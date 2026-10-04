/**
 * MongoDB repository for the WhatsApp worker.
 * All DB access goes through this class so the connection/session/outbox
 * logic never imports Mongoose models directly.
 */
import mongoose from 'mongoose';

// ── Model definitions (inline to keep the worker self-contained) ─────────────

const whatsAppAccountSchema = new mongoose.Schema({
  shopId:               { type: String, required: true, unique: true },
  connectionState:      { type: String, default: 'DISCONNECTED' },
  status:               { type: String, default: 'disconnected' },
  qrDataUri:            { type: String, default: null },
  qrGeneratedAt:        { type: Date,   default: null },
  lastConnectedAt:      { type: Date,   default: null },
  lastDisconnectedAt:   { type: Date,   default: null },
  lastHeartbeatAt:      { type: Date,   default: null },
  lastError:            { type: String, default: null },
  workerInstanceId:     { type: String, default: null },
  workerStartedAt:      { type: Date,   default: null },
  disconnectRequestedAt:{ type: Date,   default: null },
  connectRequestedAt:   { type: Date,   default: null },
  reconnectAttempts:    { type: Number, default: 0 },
}, { timestamps: true });

const whatsAppSessionSchema = new mongoose.Schema({
  shopId:         { type: String, required: true, unique: true },
  encryptedState: { type: String, required: true },
  version:        { type: Number, default: 1 },
}, { timestamps: true });

const messageOutboxSchema = new mongoose.Schema({
  shopId:                  { type: String, required: true },
  recipient:               { type: String, required: true },
  messageType:             { type: String, default: 'text' },
  payload:                 { type: mongoose.Schema.Types.Mixed },
  status:                  { type: String, default: 'pending' },
  scheduledAt:             { type: Date,   default: Date.now },
  lockedAt:                { type: Date,   default: null },
  lockedBy:                { type: String, default: null },
  processedAt:             { type: Date,   default: null },
  attempts:                { type: Number, default: 0 },
  maxAttempts:             { type: Number, default: 3 },
  error:                   { type: String, default: null },
  broadcastId:             { type: mongoose.Schema.Types.ObjectId, default: null },
  broadcastRecipientIndex: { type: Number, default: null },
  sentMessageId:           { type: String, default: null },
}, { timestamps: true });
messageOutboxSchema.index({ shopId: 1, status: 1, scheduledAt: 1 });

const broadcastSchema = new mongoose.Schema({
  shopId:         { type: String },
  status:         { type: String },
  recipients:     { type: mongoose.Schema.Types.Mixed },
  sendIntervalMs: { type: Number, default: 1500 },
  sentCount:      { type: Number, default: 0 },
  failedCount:    { type: Number, default: 0 },
  pendingCount:   { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 },
  readCount:      { type: Number, default: 0 },
  totalCount:     { type: Number, default: 0 },
}, { timestamps: true });

const shopSchema = new mongoose.Schema({
  shopId:           { type: String, required: true, unique: true },
  broadcastEnabled: { type: Boolean, default: false },
  status:           { type: String, default: 'pending' },
}, { strict: false });

function getModel(name, schema) {
  return mongoose.models[name] || mongoose.model(name, schema);
}

export class WhatsAppRepository {
  constructor() {
    this.Account  = getModel('WhatsAppAccount', whatsAppAccountSchema);
    this.Session  = getModel('WhatsAppSession', whatsAppSessionSchema);
    this.Outbox   = getModel('MessageOutbox', messageOutboxSchema);
    this.Broadcast = getModel('broadcast', broadcastSchema);
    this.Shop     = getModel('shop', shopSchema);
  }

  // ── Salon discovery ───────────────────────────────────────────────────────

  async getEnabledShops() {
    const shops = await this.Shop
      .find({ broadcastEnabled: true, status: 'active' })
      .select('shopId')
      .lean();
    return shops.map((s) => s.shopId);
  }

  async isShopEnabled(shopId) {
    const shop = await this.Shop
      .findOne({ shopId })
      .select('broadcastEnabled status')
      .lean();
    return !!(shop?.broadcastEnabled && shop?.status === 'active');
  }

  // ── Lock ─────────────────────────────────────────────────────────────────

  async claimLock(shopId, workerId) {
    const staleThreshold = new Date(Date.now() - 2 * 60 * 1000);
    const result = await this.Account.findOneAndUpdate(
      {
        shopId,
        $or: [
          { workerInstanceId: null },
          { lastHeartbeatAt: { $lt: staleThreshold } },
          { workerInstanceId: workerId },
        ],
      },
      { $set: { workerInstanceId: workerId, workerStartedAt: new Date() } },
      { upsert: true, new: true }
    );
    return !!result;
  }

  async releaseLock(shopId, workerId) {
    await this.Account.updateOne(
      { shopId, workerInstanceId: workerId },
      { $set: { workerInstanceId: null } }
    );
  }

  // ── Heartbeat ────────────────────────────────────────────────────────────

  async heartbeat(shopId, workerId) {
    await this.Account.updateOne(
      { shopId, workerInstanceId: workerId },
      { $set: { lastHeartbeatAt: new Date() } }
    );
  }

  // ── Connection state ──────────────────────────────────────────────────────

  async setConnectionState(shopId, state, extra = {}) {
    const now = new Date();
    const patch = {
      connectionState: state,
      status: state === 'CONNECTED' ? 'connected' : state === 'ERROR' ? 'error' : 'disconnected',
    };
    if (state === 'CONNECTED') patch.lastConnectedAt = now;
    if (state === 'DISCONNECTED' || state === 'LOGGED_OUT') patch.lastDisconnectedAt = now;
    if (extra.qrDataUri !== undefined) patch.qrDataUri = extra.qrDataUri;
    if (extra.qrGeneratedAt !== undefined) patch.qrGeneratedAt = extra.qrGeneratedAt;
    if (extra.lastError !== undefined) patch.lastError = extra.lastError;
    if (extra.reconnectAttempts !== undefined) patch.reconnectAttempts = extra.reconnectAttempts;

    await this.Account.updateOne({ shopId }, { $set: patch }, { upsert: true });
  }

  async checkDisconnectRequested(shopId) {
    const doc = await this.Account.findOne({ shopId }).select('disconnectRequestedAt').lean();
    return !!(doc?.disconnectRequestedAt);
  }

  async clearDisconnectRequest(shopId) {
    await this.Account.updateOne({ shopId }, { $set: { disconnectRequestedAt: null } });
  }

  async checkConnectRequested(shopId) {
    const doc = await this.Account.findOne({ shopId }).select('connectRequestedAt').lean();
    return !!(doc?.connectRequestedAt);
  }

  async clearConnectRequest(shopId) {
    await this.Account.updateOne({ shopId }, { $set: { connectRequestedAt: null } });
  }

  // ── Session ───────────────────────────────────────────────────────────────

  async loadSession(shopId) {
    const doc = await this.Session.findOne({ shopId }).lean();
    return doc ? { encryptedState: doc.encryptedState, version: doc.version } : null;
  }

  async saveSession(shopId, encryptedState) {
    await this.Session.findOneAndUpdate(
      { shopId },
      { $set: { encryptedState }, $inc: { version: 1 } },
      { upsert: true }
    );
  }

  async clearSession(shopId) {
    await this.Session.deleteOne({ shopId });
  }

  // ── Outbox ────────────────────────────────────────────────────────────────

  async claimOutboxJobs(shopId, workerId, batchSize = 5) {
    const now = new Date();
    const stale = new Date(Date.now() - 5 * 60 * 1000);

    const candidates = await this.Outbox.find({
      shopId,
      status: 'pending',
      scheduledAt: { $lte: now },
      $or: [{ lockedAt: null }, { lockedAt: { $lt: stale } }],
    })
      .sort({ scheduledAt: 1 })
      .limit(batchSize)
      .select('_id')
      .lean();

    if (!candidates.length) return [];

    const ids = candidates.map((c) => c._id);
    await this.Outbox.updateMany(
      { _id: { $in: ids }, status: 'pending' },
      { $set: { status: 'processing', lockedAt: now, lockedBy: workerId }, $inc: { attempts: 1 } }
    );

    return this.Outbox.find({ _id: { $in: ids }, status: 'processing' }).lean();
  }

  async markOutboxSent(jobId, wamid) {
    await this.Outbox.updateOne(
      { _id: jobId },
      { $set: { status: 'sent', processedAt: new Date(), lockedAt: null, lockedBy: null, sentMessageId: wamid || null } }
    );
  }

  async markOutboxFailed(jobId, error, cancel) {
    await this.Outbox.updateOne(
      { _id: jobId },
      {
        $set: {
          status: cancel ? 'failed' : 'pending',
          error,
          processedAt: cancel ? new Date() : null,
          lockedAt: null,
          lockedBy: null,
        },
      }
    );
  }

  async markOutboxCancelled(jobId) {
    await this.Outbox.updateOne(
      { _id: jobId },
      { $set: { status: 'cancelled', lockedAt: null, lockedBy: null } }
    );
  }

  async returnOutboxToPending(jobId) {
    await this.Outbox.updateOne(
      { _id: jobId },
      { $set: { status: 'pending', lockedAt: null, lockedBy: null } }
    );
  }

  async recoverStaleOutboxJobs(shopId, staleMinutes = 5) {
    const stale = new Date(Date.now() - staleMinutes * 60 * 1000);
    const result = await this.Outbox.updateMany(
      { shopId, status: 'processing', lockedAt: { $lt: stale } },
      { $set: { status: 'pending', lockedAt: null, lockedBy: null } }
    );
    return result.modifiedCount;
  }

  // ── Broadcast helpers ─────────────────────────────────────────────────────

  async getBroadcastStatus(broadcastId) {
    const doc = await this.Broadcast.findById(broadcastId).select('status sendIntervalMs').lean();
    if (!doc) return null;
    return { status: doc.status, sendIntervalMs: doc.sendIntervalMs };
  }

  async updateBroadcastRecipient(broadcastId, recipientIndex, status, extra = {}) {
    const patch = { [`recipients.${recipientIndex}.status`]: status };
    if (status === 'sent') patch[`recipients.${recipientIndex}.sentAt`] = new Date();
    if (status === 'failed') patch[`recipients.${recipientIndex}.error`] = extra.error || '';
    if (status === 'delivered') patch[`recipients.${recipientIndex}.deliveredAt`] = new Date();
    if (status === 'read') {
      patch[`recipients.${recipientIndex}.deliveredAt`] = new Date();
      patch[`recipients.${recipientIndex}.readAt`] = new Date();
    }

    await this.Broadcast.updateOne({ _id: broadcastId }, { $set: patch });

    // Update aggregate counts
    const broadcast = await this.Broadcast.findById(broadcastId).lean();
    if (!broadcast) return;
    const recipients = broadcast.recipients || [];
    const sentCount = recipients.filter((r) => ['sent', 'delivered', 'read'].includes(r.status)).length;
    const failedCount = recipients.filter((r) => r.status === 'failed').length;
    const pendingCount = recipients.filter((r) => ['pending', 'queued'].includes(r.status)).length;
    const isComplete = pendingCount === 0;

    await this.Broadcast.updateOne(
      { _id: broadcastId },
      { $set: { sentCount, failedCount, pendingCount, status: isComplete ? 'completed' : 'in_progress' } }
    );
  }
}
