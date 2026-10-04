import { logger } from './logger.js';
import { config } from './config.js';
import { phoneToWhatsAppJid } from '../utils/phoneUtils.js';

const PERMANENT_ERROR_PATTERNS = [
  /invalid.*number/i,
  /not.*registered/i,
  /number.*does not exist/i,
  /unsupported.*media/i,
  /media.*too large/i,
  /invalid.*jid/i,
  /blocked/i,
];

function isPermanentFailure(error) {
  return PERMANENT_ERROR_PATTERNS.some((p) => p.test(error));
}

export class OutboxConsumer {
  constructor(provider, repo, shopId, workerId, pollIntervalMs) {
    this.provider = provider;
    this.repo = repo;
    this.shopId = shopId;
    this.workerId = workerId;
    this.pollIntervalMs = pollIntervalMs;
    this.timer = null;
    this.running = false;
    this.pollCount = 0;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.poll(), this.pollIntervalMs);
    // Recover any stale jobs immediately on startup, then poll right away
    this.repo.recoverStaleOutboxJobs(this.shopId).catch(() => {});
    setTimeout(() => this.poll(), 500);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async poll() {
    if (this.running) return;
    if (this.provider.getConnectionState() !== 'CONNECTED') return;
    this.running = true;
    try {
      this.pollCount++;
      if (this.pollCount % 150 === 1) {
        await this.repo.recoverStaleOutboxJobs(this.shopId).catch(() => {});
      }

      const jobs = await this.repo.claimOutboxJobs(this.shopId, this.workerId);
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        await this.process(job);
        if (i < jobs.length - 1) {
          const delayMs = await this._resolveDelay(job);
          if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    } finally {
      this.running = false;
    }
  }

  async _resolveDelay(job) {
    if (job.broadcastId) {
      const info = await this.repo.getBroadcastStatus(job.broadcastId);
      return info?.sendIntervalMs ?? config.outbox.broadcastSendIntervalMs;
    }
    return 0;
  }

  async process(job) {
    logger.info('outbox_job_claimed', { jobId: job._id, type: job.messageType, attempt: job.attempts });

    // Check broadcast eligibility
    if (job.broadcastId) {
      const info = await this.repo.getBroadcastStatus(job.broadcastId);
      if (!info || info.status === 'cancelled') {
        await this.repo.markOutboxCancelled(job._id);
        return;
      }
      if (info.status === 'paused') {
        await this.repo.returnOutboxToPending(job._id);
        return;
      }
    }

    try {
      const jid = phoneToWhatsAppJid(job.recipient);

      let result;
      if (job.messageType === 'text') {
        result = await this.provider.sendText(jid, String(job.payload.text ?? ''));
      } else {
        result = await this.provider.sendMedia(jid, {
          type: job.messageType,
          url: job.payload.url,
          mimetype: String(job.payload.mimetype ?? 'application/octet-stream'),
          caption: job.payload.caption,
          filename: job.payload.filename,
        });
      }

      if (result.status === 'sent') {
        await this.repo.markOutboxSent(job._id, result.messageId);
        if (job.broadcastId && job.broadcastRecipientIndex != null) {
          await this.repo.updateBroadcastRecipient(job.broadcastId, job.broadcastRecipientIndex, 'sent');
        }
        logger.info('outbox_job_completed', { jobId: job._id, messageId: result.messageId });
      } else {
        const errorMsg = result.error ?? 'Unknown error';
        const exhausted = job.attempts >= job.maxAttempts || isPermanentFailure(errorMsg);
        await this.repo.markOutboxFailed(job._id, errorMsg, exhausted);
        if (job.broadcastId && job.broadcastRecipientIndex != null && exhausted) {
          await this.repo.updateBroadcastRecipient(job.broadcastId, job.broadcastRecipientIndex, 'failed', { error: errorMsg });
        }
        logger.warn('outbox_job_failed', { jobId: job._id, error: errorMsg, exhausted });
      }
    } catch (err) {
      const errorMsg = String(err);
      const exhausted = job.attempts >= job.maxAttempts || isPermanentFailure(errorMsg);
      await this.repo.markOutboxFailed(job._id, errorMsg, exhausted);
      if (job.broadcastId && job.broadcastRecipientIndex != null && exhausted) {
        await this.repo.updateBroadcastRecipient(job.broadcastId, job.broadcastRecipientIndex, 'failed', { error: errorMsg });
      }
      logger.error('outbox_job_failed', { jobId: job._id, error: errorMsg, exhausted });
    }
  }
}
