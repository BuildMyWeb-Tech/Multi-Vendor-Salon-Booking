import broadcastModel from '../models/broadcastModel.js';
import userModel from '../models/userModel.js';
import appointmentModel from '../models/appointmentModel.js';
import { v2 as cloudinary } from 'cloudinary';

// ── GET /api/salon-admin/broadcast/contacts ───────────────────────────────────
// Returns deduplicated contacts (name + phone) from users and appointments
// belonging to the authenticated salon only.
export const getBroadcastContacts = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;

    // 1. Users who registered via this salon
    const users = await userModel.find({ shopId }, 'name phone').lean();

    // 2. Appointment bookers — use denormalized userData (covers guests / different-salon users)
    const appts = await appointmentModel
      .find({ shopId, 'userData.phone': { $exists: true, $ne: '' } })
      .select('userData.name userData.phone')
      .lean();

    // Merge into a map keyed by phone to deduplicate
    const phoneMap = new Map();

    users.forEach(({ name, phone }) => {
      if (phone) phoneMap.set(phone.trim(), { name: name || '', phone: phone.trim() });
    });

    appts.forEach(({ userData }) => {
      const phone = userData?.phone?.trim();
      if (phone && !phoneMap.has(phone)) {
        phoneMap.set(phone, { name: userData.name || '', phone });
      }
    });

    const contacts = Array.from(phoneMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    res.json({ success: true, contacts });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── POST /api/salon-admin/broadcast ──────────────────────────────────────────
// Save a broadcast record.
// For 'api' mode, you would call a WhatsApp Cloud API here.
// For 'manual' (wa.me) mode, we just record it as-is with status 'pending'.
export const createBroadcast = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const { message, sendMode = 'manual', recipients: recipientsJson } = req.body;

    let recipients = [];
    try {
      recipients = JSON.parse(recipientsJson || '[]');
    } catch {
      return res.json({ success: false, message: 'Invalid recipients format.' });
    }

    if (!recipients.length) {
      return res.json({ success: false, message: 'Select at least one recipient.' });
    }
    if (!message && !req.file) {
      return res.json({ success: false, message: 'Provide a message or media.' });
    }

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

    const recipientDocs = recipients.map((r) => ({
      name: r.name || '',
      phone: r.phone,
      status: sendMode === 'manual' ? 'pending' : 'pending',
    }));

    // For WhatsApp Cloud API mode, attempt to send
    let sentCount = 0;
    let failedCount = 0;

    if (sendMode === 'api') {
      const WABA_TOKEN = process.env.WHATSAPP_API_TOKEN;
      const PHONE_ID   = process.env.WHATSAPP_PHONE_ID;

      if (!WABA_TOKEN || !PHONE_ID) {
        return res.json({
          success: false,
          message: 'WhatsApp Cloud API credentials are not configured on the server. Use manual mode instead.',
        });
      }

      const { default: axios } = await import('axios');

      for (const rec of recipientDocs) {
        try {
          const body = {
            messaging_product: 'whatsapp',
            to: rec.phone.replace(/[^0-9]/g, ''),
            type: 'text',
            text: { body: message },
          };
          await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
            body,
            { headers: { Authorization: `Bearer ${WABA_TOKEN}`, 'Content-Type': 'application/json' } }
          );
          rec.status = 'sent';
          rec.sentAt = new Date();
          sentCount++;
        } catch (err) {
          rec.status = 'failed';
          rec.error = err.response?.data?.error?.message || err.message || 'Send failed';
          failedCount++;
        }
      }
    }

    const pendingCount = recipientDocs.filter((r) => r.status === 'pending').length;

    const broadcast = await broadcastModel.create({
      shopId,
      message,
      mediaUrl,
      mediaType,
      sendMode,
      status: sendMode === 'api' ? 'completed' : 'completed',
      totalCount: recipientDocs.length,
      sentCount,
      failedCount,
      pendingCount,
      recipients: recipientDocs,
    });

    res.json({ success: true, broadcast });
  } catch (error) {
    console.error('createBroadcast error:', error);
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/salon-admin/broadcast ───────────────────────────────────────────
// List broadcast history for this salon (most recent first, no recipients array)
export const getBroadcastHistory = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      broadcastModel
        .find({ shopId })
        .select('-recipients')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      broadcastModel.countDocuments({ shopId }),
    ]);

    res.json({ success: true, broadcasts: items, total });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/salon-admin/broadcast/:id ───────────────────────────────────────
// Full broadcast detail including recipients (scoped to this salon)
export const getBroadcastById = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const broadcast = await broadcastModel.findOne({ _id: req.params.id, shopId }).lean();
    if (!broadcast) return res.json({ success: false, message: 'Broadcast not found.' });
    res.json({ success: true, broadcast });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
