import { logger } from './logger.js';

const COMMAND_POLL_MS = 5000; // check connect/disconnect commands every 5 seconds

export class Heartbeat {
  constructor(repo, connectionManager, shopId, workerId, intervalMs) {
    this.repo = repo;
    this.connectionManager = connectionManager;
    this.shopId = shopId;
    this.workerId = workerId;
    this.intervalMs = intervalMs;
    this.heartbeatTimer = null;
    this.commandTimer = null;
  }

  start() {
    if (this.heartbeatTimer) return;

    // Slow timer: update lastHeartbeatAt in DB
    this.heartbeatTimer = setInterval(() => this._beat(), this.intervalMs);

    // Fast timer: poll for admin connect/disconnect commands
    this.commandTimer = setInterval(() => this._pollCommands(), COMMAND_POLL_MS);

    // Run both immediately
    this._beat().catch(() => {});
    this._pollCommands().catch(() => {});

    logger.info('heartbeat_started', { intervalMs: this.intervalMs, commandPollMs: COMMAND_POLL_MS });
  }

  stop() {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
    if (this.commandTimer)   { clearInterval(this.commandTimer);   this.commandTimer = null; }
  }

  async _beat() {
    try {
      await this.repo.heartbeat(this.shopId, this.workerId);
    } catch (err) {
      logger.error('error', { op: 'heartbeat', message: String(err) });
    }
  }

  async _pollCommands() {
    try {
      await this.connectionManager.checkDisconnectCommand();
      await this.connectionManager.checkConnectCommand();
    } catch (err) {
      logger.error('error', { op: 'command_poll', message: String(err) });
    }
  }
}
