import { logger } from './logger.js';

const RECONNECTABLE_STATES = new Set(['RECONNECTING']);
const SESSION_INVALID_STATES = new Set(['LOGGED_OUT', 'ERROR']);

function backoffDelay(attempt) {
  return Math.min(30000, 1000 * Math.pow(2, attempt));
}

export class ConnectionManager {
  constructor({ provider, sessionStore, repo, shopId, workerId }) {
    this.provider = provider;
    this.sessionStore = sessionStore;
    this.repo = repo;
    this.shopId = shopId;
    this.workerId = workerId;
    this.state = 'DISCONNECTED';
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.stopped = false;
  }

  async start() {
    logger.info('connection_starting', { shopId: this.shopId });
    const locked = await this.repo.claimLock(this.shopId, this.workerId);
    if (!locked) {
      throw new Error('Connection lock held by another worker instance');
    }
    logger.info('lock_acquired', { shopId: this.shopId, workerId: this.workerId });
    this.provider.onEvent((event) => this.handleProviderEvent(event));
    await this.connect();
  }

  async stop() {
    this.stopped = true;
    this._clearReconnectTimer();
    await this.provider.disconnect();
    await this.repo.releaseLock(this.shopId, this.workerId);
    logger.info('lock_released', { shopId: this.shopId });
  }

  async checkDisconnectCommand() {
    const requested = await this.repo.checkDisconnectRequested(this.shopId);
    if (!requested) return;
    logger.info('disconnect_command_received', { shopId: this.shopId });
    await this.repo.clearDisconnectRequest(this.shopId);
    await this.provider.logout();
  }

  async checkConnectCommand() {
    const requested = await this.repo.checkConnectRequested(this.shopId);
    if (!requested) return;
    await this.repo.clearConnectRequest(this.shopId);

    const providerState = this.provider.getConnectionState();
    logger.info('connect_command_received', { shopId: this.shopId, providerState });

    // Already connecting or connected — nothing to do
    if (['CONNECTED', 'STARTING', 'AUTHENTICATING', 'QR_REQUIRED'].includes(providerState)) {
      return;
    }

    // Force-restart the connection
    this._clearReconnectTimer();
    this.reconnectAttempts = 0;
    await this.provider.disconnect();
    await this.connect();
  }

  getState() {
    return this.state;
  }

  async connect() {
    if (this.stopped) return;
    const authState = await this.sessionStore.load(this.shopId);
    await this.provider.initialize(authState);
    await this.provider.connect();
  }

  async handleProviderEvent(event) {
    switch (event.type) {
      case 'state_changed':
        await this._onStateChanged(event.state);
        break;

      case 'auth_state_updated':
        await this.sessionStore.save(this.shopId, event.authState);
        break;

      case 'qr':
        await this.repo.setConnectionState(this.shopId, 'QR_REQUIRED', {
          qrDataUri: event.dataUri,
          qrGeneratedAt: new Date().toISOString(),
        });
        break;

      case 'logged_out':
        this.state = 'LOGGED_OUT';
        this._clearReconnectTimer();
        await this.sessionStore.clear(this.shopId);
        await this.repo.setConnectionState(this.shopId, 'LOGGED_OUT', {
          qrDataUri: null,
          lastError: 'Session invalidated by WhatsApp',
        });
        break;

      case 'message_received':
        // Inbound messages — not handled in basic salon mode
        logger.info('inbound_message', { from: event.message.from, type: event.message.contentType });
        break;

      case 'message_status':
        await this._handleMessageStatus(event.messageId, event.status);
        break;
    }
  }

  async _handleMessageStatus(wamid, status) {
    if (status !== 'delivered' && status !== 'read') return;
    try {
      const outbox = await this.repo.Outbox.findOne({ sentMessageId: wamid }).lean();
      if (!outbox?.broadcastId || outbox.broadcastRecipientIndex == null) return;
      await this.repo.updateBroadcastRecipient(
        outbox.broadcastId,
        outbox.broadcastRecipientIndex,
        status
      );
    } catch (err) {
      logger.warn('delivery_update_failed', { wamid, message: String(err) });
    }
  }

  async _onStateChanged(next) {
    const prev = this.state;
    this.state = next;

    await this.repo.setConnectionState(this.shopId, next, {
      reconnectAttempts: this.reconnectAttempts,
      ...(next === 'CONNECTED' ? { qrDataUri: null } : {}),
    });

    if (next === 'CONNECTED') {
      this.reconnectAttempts = 0;
      this._clearReconnectTimer();
      return;
    }

    if (RECONNECTABLE_STATES.has(next) && prev === 'CONNECTED') {
      this._scheduleReconnect();
      return;
    }

    if (next === 'RECONNECTING') {
      this._scheduleReconnect();
      return;
    }

    if (SESSION_INVALID_STATES.has(next)) {
      this._clearReconnectTimer();
    }
  }

  _scheduleReconnect() {
    if (this.stopped) return;
    this._clearReconnectTimer();
    const delay = backoffDelay(this.reconnectAttempts);
    this.reconnectAttempts++;
    logger.info('reconnect_backoff', { attempt: this.reconnectAttempts, delayMs: delay });
    this.reconnectTimer = setTimeout(() => {
      if (this.stopped) return;
      this.repo.setConnectionState(this.shopId, 'RECONNECTING', { reconnectAttempts: this.reconnectAttempts })
        .then(() => this.connect())
        .catch((err) => logger.error('error', { op: 'reconnect', message: String(err) }));
    }, delay);
  }

  _clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
