import broadcastModel from '../models/broadcastModel.js';
import userModel from '../models/userModel.js';
import appointmentModel from '../models/appointmentModel.js';
import { v2 as cloudinary } from 'cloudinary';
import { normalizeIndianPhone } from '../utils/phoneUtils.js';

// ── GET /api/salon-admin/broadcast/contacts ───────────────────────────────────
// Returns deduplicated contacts (name + phone) from users and appointments
// belonging to the authenticated salon only.
// Supports ?page=1&limit=200 for pagination (default limit 200, max 500).
export const getBroadcastContacts = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const page  = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit || '200', 10)));
    const skip  = (page - 1) * limit;

    // 1. Fetch contacts — capped at 5000 per source to avoid loading entire collections.
    // The in-memory merge stays fast; a large salon with 5k+ contacts can use search.
    const MAX_RAW = 5000;
    const [users, appts] = await Promise.all([
      userModel
        .find({ shopId }, 'name phone')
        .sort({ name: 1 })
        .limit(MAX_RAW)
        .lean(),
      appointmentModel
        .find({ shopId, 'userData.phone': { $exists: true, $ne: '' } })
        .select('userData.name userData.phone')
        .limit(MAX_RAW)
        .lean(),
    ]);

    // 2. Merge into a map keyed by trimmed phone — users take priority over appointment data
    const phoneMap = new Map();

    for (const { name, phone } of users) {
      const p = normalizeIndianPhone(phone?.trim()) || phone?.trim();
      if (p) phoneMap.set(p, { name: (name || '').trim(), phone: p });
    }

    for (const { userData } of appts) {
      const raw = userData?.phone?.trim();
      if (!raw) continue;
      const p = normalizeIndianPhone(raw) || raw;
      const apptName = (userData.name || '').trim();
      if (phoneMap.has(p)) {
        const existing = phoneMap.get(p);
        if (!existing.name && apptName) existing.name = apptName;
      } else {
        phoneMap.set(p, { name: apptName, phone: p });
      }
    }

    // 3. Sort all merged contacts, then paginate in-memory
    const all = Array.from(phoneMap.values()).sort((a, b) =>
      (a.name || a.phone).localeCompare(b.name || b.phone)
    );

    const total    = all.length;
    const contacts = all.slice(skip, skip + limit);

    res.json({ success: true, contacts, total, page, limit, pages: Math.ceil(total / limit) });
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
// Full broadcast detail including recipients (scoped to this salon).
// Recomputes aggregate counts from recipients so the UI is always accurate.
export const getBroadcastById = async (req, res) => {
  try {
    const { shopId } = req.salonAdmin;
    const broadcast = await broadcastModel.findOne({ _id: req.params.id, shopId }).lean();
    if (!broadcast) return res.json({ success: false, message: 'Broadcast not found.' });

    // Recompute live counts from recipients array
    const recipients = broadcast.recipients || [];
    const sentCount     = recipients.filter((r) => ['sent', 'delivered', 'read'].includes(r.status)).length;
    const failedCount   = recipients.filter((r) => r.status === 'failed').length;
    const pendingCount  = recipients.filter((r) => ['pending', 'queued', 'processing'].includes(r.status)).length;
    const deliveredCount = recipients.filter((r) => ['delivered', 'read'].includes(r.status)).length;
    const readCount     = recipients.filter((r) => r.status === 'read').length;

    res.json({
      success: true,
      broadcast: {
        ...broadcast,
        sentCount,
        failedCount,
        pendingCount,
        deliveredCount,
        readCount,
        totalCount: recipients.length || broadcast.totalCount,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
