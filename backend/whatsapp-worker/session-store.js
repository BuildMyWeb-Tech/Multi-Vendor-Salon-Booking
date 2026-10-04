import { encrypt, decrypt } from './crypto.js';
import { logger } from './logger.js';

export class DbSessionStore {
  constructor(repo, encryptionKeyHex) {
    this.repo = repo;
    this.encryptionKeyHex = encryptionKeyHex;
    this.saveQueue = Promise.resolve();
    this.saveSeq = 0;
  }

  async load(shopId) {
    const doc = await this.repo.loadSession(shopId);
    if (!doc) {
      logger.info('session_not_found', { shopId });
      return null;
    }
    try {
      const plain = decrypt(doc.encryptedState, this.encryptionKeyHex);
      const authState = JSON.parse(plain);
      logger.info('session_loaded', { shopId, version: doc.version });
      return authState;
    } catch (err) {
      logger.error('error', { op: 'session_decrypt', message: String(err) });
      return null;
    }
  }

  save(shopId, authState) {
    const seq = ++this.saveSeq;
    this.saveQueue = this.saveQueue
      .then(async () => {
        const plain = JSON.stringify(authState);
        const encrypted = encrypt(plain, this.encryptionKeyHex);
        await this.repo.saveSession(shopId, encrypted);
        logger.info('session_saved', { shopId, seq });
      })
      .catch((err) => {
        logger.error('error', { op: 'session_save_queue', seq, message: String(err) });
      });
    return this.saveQueue;
  }

  async clear(shopId) {
    await this.repo.clearSession(shopId);
    logger.info('session_cleared', { shopId });
  }
}
