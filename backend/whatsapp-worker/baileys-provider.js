/**
 * Baileys provider — wraps @whiskeysockets/baileys behind a simple interface.
 * Adapted from BuildMyWeb-CRM whatsapp-worker/src/provider/baileys/index.ts
 */
import makeWASocket, {
  initAuthCreds,
  DisconnectReason,
  BufferJSON,
  isLidUser,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { logger } from './logger.js';

const noopLogger = {
  level: 'silent',
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  child: () => noopLogger,
};

const RECONNECTABLE_STATES = new Set(['RECONNECTING']);
const SESSION_INVALID_STATES = new Set(['LOGGED_OUT', 'ERROR']);

export class BaileysProvider {
  constructor() {
    this.socket = null;
    this.state = 'DISCONNECTED';
    this.qrDataUri = null;
    this.handler = null;
    this.savedCreds = null;
    this.keysData = {};
    this.lidToJidMap = new Map();
  }

  onEvent(handler) {
    this.handler = handler;
  }

  emit(event) {
    const result = this.handler?.(event);
    if (result instanceof Promise) {
      result.catch((err) => {
        logger.error('error', { op: 'emit_handler', event: event.type, message: String(err) });
      });
    }
  }

  setState(next) {
    if (this.state === next) return;
    this.state = next;
    if (next !== 'QR_REQUIRED') this.qrDataUri = null;
    logger.info('connection_state_changed', { state: next });
    this.emit({ type: 'state_changed', state: next });
  }

  async initialize(authState) {
    if (authState) {
      this.savedCreds = JSON.parse(JSON.stringify(authState.creds), BufferJSON.reviver);
      this.keysData = JSON.parse(JSON.stringify(authState.keys), BufferJSON.reviver);
    } else {
      this.savedCreds = null;
      this.keysData = {};
    }
  }

  async connect() {
    if (this.socket) return;
    this.setState('STARTING');

    const creds = this.savedCreds ? this.savedCreds : initAuthCreds();
    const baileysAuth = { creds, keys: null };

    baileysAuth.keys = this._buildKeyStore(() => {
      const snapshot = this._snapshotAuthState(baileysAuth);
      this.savedCreds = snapshot.creds;
      this.emit({ type: 'auth_state_updated', authState: snapshot });
    });

    this.socket = makeWASocket({
      auth: {
        creds: baileysAuth.creds,
        keys: makeCacheableSignalKeyStore(baileysAuth.keys, noopLogger),
      },
      printQRInTerminal: false,
      logger: noopLogger,
      keepAliveIntervalMs: 10_000,
      connectTimeoutMs: 60_000,
    });

    this._wireEvents(this.socket, baileysAuth);
    this.setState('AUTHENTICATING');
  }

  async disconnect() {
    if (!this.socket) return;
    this.socket.end(undefined);
    this.socket = null;
    this.setState('DISCONNECTED');
  }

  async logout() {
    if (this.socket) {
      try { await this.socket.logout(); } catch { /* ignore */ }
      this.socket = null;
    }
    this.savedCreds = null;
    this.keysData = {};
    this.setState('LOGGED_OUT');
    this.emit({ type: 'logged_out' });
  }

  getConnectionState() {
    return this.state;
  }

  async sendText(jid, text) {
    if (!this.socket || this.state !== 'CONNECTED') {
      return { messageId: '', status: 'failed', error: 'Not connected' };
    }
    try {
      const result = await this.socket.sendMessage(jid, { text });
      return { messageId: result?.key?.id ?? '', status: 'sent' };
    } catch (err) {
      return { messageId: '', status: 'failed', error: String(err) };
    }
  }

  async sendMedia(jid, media) {
    if (!this.socket || this.state !== 'CONNECTED') {
      return { messageId: '', status: 'failed', error: 'Not connected' };
    }
    try {
      // Baileys requires the media type as the top-level key: { image: { url } } / { video: { url } }
      const mediaSource = { url: media.url };
      let payload;

      const type = media.type ||
        (media.mimetype?.startsWith('video/') ? 'video'
          : media.mimetype?.startsWith('image/') ? 'image'
          : media.mimetype?.startsWith('audio/') ? 'audio'
          : 'document');

      if (type === 'image') {
        payload = { image: mediaSource };
      } else if (type === 'video') {
        payload = { video: mediaSource };
      } else if (type === 'audio') {
        payload = { audio: mediaSource, ptt: false };
      } else {
        payload = { document: mediaSource, fileName: media.filename || 'file', mimetype: media.mimetype || 'application/octet-stream' };
      }

      if (media.caption) payload.caption = String(media.caption);
      // mimetype is only needed for document type; image/video Baileys infers automatically
      if (type === 'document' && media.mimetype) payload.mimetype = media.mimetype;

      const result = await this.socket.sendMessage(jid, payload);
      return { messageId: result?.key?.id ?? '', status: 'sent' };
    } catch (err) {
      return { messageId: '', status: 'failed', error: String(err) };
    }
  }

  // ── Private ────────────────────────────────────────────────────────────────

  _buildKeyStore(onSet) {
    return {
      get: async (type, ids) => {
        const out = {};
        const store = this.keysData[type] ?? {};
        for (const id of ids) {
          if (store[id] !== undefined) out[id] = store[id];
        }
        return out;
      },
      set: async (data) => {
        for (const [type, vals] of Object.entries(data)) {
          this.keysData[type] ??= {};
          Object.assign(this.keysData[type], vals);
        }
        onSet?.();
      },
    };
  }

  _snapshotAuthState(baileysAuth) {
    return {
      creds: JSON.parse(JSON.stringify(baileysAuth.creds, BufferJSON.replacer)),
      keys: JSON.parse(JSON.stringify(this.keysData, BufferJSON.replacer)),
    };
  }

  _wireEvents(sock, baileysAuth) {
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        import('qrcode').then((mod) => {
          const toDataURL = mod.toDataURL ?? mod.default?.toDataURL;
          if (!toDataURL) throw new Error('no toDataURL');
          return toDataURL(qr);
        }).then((dataUri) => {
          this.qrDataUri = dataUri;
          this.setState('QR_REQUIRED');
          this.emit({ type: 'qr', dataUri });
        }).catch(() => {
          this.qrDataUri = qr;
          this.setState('QR_REQUIRED');
          this.emit({ type: 'qr', dataUri: qr });
        });
      }

      if (connection === 'open') {
        this.setState('CONNECTED');
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        const isAuthFailure =
          reason === DisconnectReason.loggedOut ||
          reason === DisconnectReason.forbidden;
        this.socket = null;
        if (isAuthFailure) {
          this.setState('LOGGED_OUT');
          this.emit({ type: 'logged_out' });
        } else {
          this.setState('RECONNECTING');
        }
      }
    });

    sock.ev.on('creds.update', () => {
      const snapshot = this._snapshotAuthState(baileysAuth);
      this.savedCreds = snapshot.creds;
      this.emit({ type: 'auth_state_updated', authState: snapshot });
    });

    sock.ev.on('contacts.upsert', (contacts) => {
      for (const c of contacts) {
        if (c.lid && c.jid) this.lidToJidMap.set(c.lid, c.jid);
      }
    });

    sock.ev.on('messages.upsert', ({ messages, type: upsertType }) => {
      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;
        if (msg.message.protocolMessage || msg.message.senderKeyDistributionMessage || msg.message.reactionMessage) continue;

        let from = msg.key.remoteJid ?? '';
        if (isLidUser(from)) {
          const resolved = msg.key.senderPn ?? this.lidToJidMap.get(from);
          if (!resolved) continue;
          from = resolved;
        }

        const body = msg.message.conversation ?? msg.message.extendedTextMessage?.text ?? null;
        const contentType = body != null ? 'text'
          : msg.message.imageMessage ? 'image'
          : msg.message.documentMessage ? 'document'
          : msg.message.audioMessage ? 'audio'
          : msg.message.videoMessage ? 'video'
          : 'unknown';

        this.emit({
          type: 'message_received',
          message: {
            messageId: msg.key.id ?? '',
            from,
            body,
            contentType,
            timestamp: msg.messageTimestamp ?? Math.floor(Date.now() / 1000),
          },
        });
      }
    });

    sock.ev.on('messages.update', (updates) => {
      for (const update of updates) {
        if (!update.key?.id || !update.key.fromMe) continue;
        const sc = update.update?.status ?? null;
        if (sc === null) continue;
        const mapped = sc >= 4 ? 'read' : sc === 3 ? 'delivered' : sc === 0 ? 'failed' : null;
        if (!mapped) continue;
        this.emit({ type: 'message_status', messageId: update.key.id, status: mapped });
      }
    });
  }
}
