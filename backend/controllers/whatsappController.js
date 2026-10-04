import WhatsAppAccount from '../models/WhatsAppAccount.js';
import broadcastModel from '../models/broadcastModel.js';
import MessageOutbox from '../models/MessageOutbox.js';
import userModel from '../models/userModel.js';
import appointmentModel from '../models/appointmentModel.js';
import { v2 as cloudinary } from 'cloudinary';
import { normalizeIndianPhone, phoneToWhatsAppJid } from '../utils/phoneUtils.js';

const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

// ── GET /api/salon-admin/whatsapp/status ─────────────────────────────────────
export const getWhatsAppStatus = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    let account = await WhatsAppAccount.findOne({ shopId }).lean();
    if (!account) {
      account = { shopId, connectionState: 'DISCONNECTED', status: 'disconnected', qrDataUri: null };
    }

    // Check if worker is alive via heartbeat
    const isWorkerAlive = account.lastHeartbeatAt
      ? Date.now() - new Date(account.lastHeartbeatAt).getTime() < STALE_THRESHOLD_MS
      : false;

    res.json({
      success: true,
      connectionState: account.connectionState,
      status: account.status,
      qrDataUri: account.connectionState === 'QR_REQUIRED' ? account.qrDataUri : null,
      qrGeneratedAt: account.qrGeneratedAt,
      lastConnectedAt: account.lastConnectedAt,
      lastDisconnectedAt: account.lastDisconnectedAt,
      lastHeartbeatAt: account.lastHeartbeatAt,
      lastError: account.lastError,
      isWorkerAlive,
      reconnectAttempts: account.reconnectAttempts || 0,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── POST /api/salon-admin/whatsapp/connect ───────────────────────────────────
// Sets connectRequestedAt so the worker picks it up and force-starts connection.
// Does NOT overwrite connectionState — preserves any QR the worker already generated.
export const connectWhatsApp = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    await WhatsAppAccount.findOneAndUpdate(
      { shopId },
      {
        $set: {
          connectRequestedAt: new Date(),
          lastError: null,
          disconnectRequestedAt: null,
        },
      },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Connection requested. QR code will appear within a few seconds.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── POST /api/salon-admin/whatsapp/disconnect ────────────────────────────────
export const disconnectWhatsApp = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    await WhatsAppAccount.findOneAndUpdate(
      { shopId },
      { $set: { disconnectRequestedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true, message: 'Disconnect request sent.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── POST /api/salon-admin/broadcast/qr ──────────────────────────────────────
// Create a QR broadcast — queues messages to the outbox for the worker to send
export const createQrBroadcast = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;

    // Check WhatsApp is connected
    const account = await WhatsAppAccount.findOne({ shopId }).lean();
    const isConnected = account?.connectionState === 'CONNECTED';

    if (!isConnected) {
      return res.json({ success: false, message: 'WhatsApp is not connected. Please connect first.' });
    }

    const { message, recipients: recipientsJson, sendIntervalMs = 1500 } = req.body;

    let recipients = [];
    try {
      recipients = JSON.parse(recipientsJson || '[]');
    } catch {
      return res.json({ success: false, message: 'Invalid recipients format.' });
    }

    if (!recipients.length) return res.json({ success: false, message: 'Select at least one recipient.' });
    if (!message && !req.file) return res.json({ success: false, message: 'Provide a message or media.' });

    // Upload media if present
    let mediaUrl = '';
    let mediaType = '';
    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;
      const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'broadcast_media',
        resource_type: resourceType,
      });
      mediaUrl = result.secure_url;
      mediaType = resourceType;
    }

    // Normalize phone numbers — skip any that can't be normalized
    const recipientDocs = recipients
      .map((r) => {
        const normalized = normalizeIndianPhone(r.phone);
        return normalized ? { name: r.name || '', phone: normalized, status: 'queued' } : null;
      })
      .filter(Boolean);

    if (!recipientDocs.length) return res.json({ success: false, message: 'No valid phone numbers in recipient list.' });

    const broadcast = await broadcastModel.create({
      shopId,
      message,
      mediaUrl,
      mediaType,
      sendMode: 'qr',
      status: 'in_progress',
      totalCount: recipientDocs.length,
      sentCount: 0,
      failedCount: 0,
      pendingCount: recipientDocs.length,
      recipients: recipientDocs,
      sendIntervalMs: Math.max(700, Math.min(5000, parseInt(sendIntervalMs) || 800)),
    });

    // Determine actual mimetype for media
    const actualMimetype = req.file ? req.file.mimetype : '';

    // Queue outbox jobs — store normalized phone; worker converts to JID
    const now = new Date();
    const outboxJobs = recipientDocs.map((r, i) => ({
      shopId,
      recipient: r.phone, // stored as +91XXXXXXXXXX

      messageType: mediaUrl ? mediaType : 'text',
      payload: mediaUrl
        ? { url: mediaUrl, mimetype: actualMimetype || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'), caption: message }
        : { text: message },
      status: 'pending',
      scheduledAt: new Date(now.getTime() + i * 100), // slight stagger
      broadcastId: broadcast._id,
      broadcastRecipientIndex: i,
      maxAttempts: 3,
    }));

    await MessageOutbox.insertMany(outboxJobs);

    res.json({ success: true, broadcast });
  } catch (error) {
    console.error('createQrBroadcast error:', error);
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/salon-admin/broadcast/qr/status/:id ────────────────────────────
// Real-time status of a QR broadcast (pending/sent/failed counts)
export const getQrBroadcastStatus = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const broadcast = await broadcastModel.findOne({ _id: req.params.id, shopId }).lean();
    if (!broadcast) return res.json({ success: false, message: 'Broadcast not found.' });

    // Compute live counts from recipients
    const recipients = broadcast.recipients || [];
    const sentCount = recipients.filter((r) => ['sent', 'delivered', 'read'].includes(r.status)).length;
    const failedCount = recipients.filter((r) => r.status === 'failed').length;
    const pendingCount = recipients.filter((r) => ['pending', 'queued'].includes(r.status)).length;

    // Update status if all done
    let status = broadcast.status;
    if (status === 'in_progress' && pendingCount === 0) {
      status = 'completed';
      await broadcastModel.findByIdAndUpdate(broadcast._id, {
        $set: { status: 'completed', sentCount, failedCount, pendingCount: 0 },
      });
    }

    res.json({
      success: true,
      broadcastId: broadcast._id,
      status,
      totalCount: broadcast.totalCount,
      sentCount,
      failedCount,
      pendingCount,
      deliveredCount: recipients.filter((r) => ['delivered', 'read'].includes(r.status)).length,
      readCount: recipients.filter((r) => r.status === 'read').length,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── POST /api/salon-admin/broadcast/qr/:id/cancel ───────────────────────────
export const cancelQrBroadcast = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const broadcast = await broadcastModel.findOne({ _id: req.params.id, shopId });
    if (!broadcast) return res.json({ success: false, message: 'Broadcast not found.' });
    if (!['in_progress', 'queued'].includes(broadcast.status)) {
      return res.json({ success: false, message: 'Broadcast cannot be cancelled in its current state.' });
    }
    broadcast.status = 'cancelled';
    await broadcast.save();
    // Cancel pending outbox jobs
    await MessageOutbox.updateMany(
      { broadcastId: broadcast._id, status: 'pending' },
      { $set: { status: 'cancelled' } }
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
