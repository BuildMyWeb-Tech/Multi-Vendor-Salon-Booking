// backend/controllers/stylistController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import shopModel from '../models/shopModel.js';

// ── POST /api/stylist/login ───────────────────────────────────────────────────
export const loginStylist = async (req, res) => {
  try {
    const { email, password, shopSlug } = req.body;
    if (!email || !password || !shopSlug) {
      return res.json({ success: false, message: 'Email, password and salon are required.' });
    }
    const shop = await shopModel.findOne({ slug: shopSlug.toLowerCase(), status: 'active' });
    if (!shop) return res.json({ success: false, message: 'Salon not found or inactive.' });
    if (!shop.stylistPanelEnabled) {
      return res.json({ success: false, message: 'Stylist panel is not enabled for this salon.' });
    }

    const doctor = await doctorModel.findOne({ email: email.toLowerCase().trim(), shopId: shop.shopId });
    if (!doctor) return res.json({ success: false, message: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) return res.json({ success: false, message: 'Invalid email or password.' });

    const token = jwt.sign(
      { doctorId: doctor._id.toString(), shopId: doctor.shopId, role: 'stylist' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      stylist: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        image: doctor.image,
        specialty: doctor.specialty,
        shopId: doctor.shopId,
        shopName: shop.shopName,
        shopSlug: shop.slug,
      },
    });
  } catch (error) {
    console.error('loginStylist error:', error);
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/stylist/dashboard ────────────────────────────────────────────────
export const getStylistDashboard = async (req, res) => {
  try {
    const { doctorId, shopId } = req.stylist;
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    const [total, todayCount, completed, cancelled, upcoming] = await Promise.all([
      appointmentModel.countDocuments({ doctorId, shopId }),
      appointmentModel.countDocuments({ doctorId, shopId, slotDateTime: { $gte: todayStart, $lte: todayEnd } }),
      appointmentModel.countDocuments({ doctorId, shopId, isCompleted: true }),
      appointmentModel.countDocuments({ doctorId, shopId, cancelled: true }),
      appointmentModel.countDocuments({ doctorId, shopId, cancelled: false, isCompleted: false, slotDateTime: { $gte: now } }),
    ]);

    const recentAppointments = await appointmentModel
      .find({ doctorId, shopId })
      .sort({ slotDateTime: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      dashData: { total, todayCount, completed, cancelled, upcoming, recentAppointments },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/stylist/appointments ─────────────────────────────────────────────
export const getStylistAppointments = async (req, res) => {
  try {
    const { doctorId, shopId } = req.stylist;
    const appointments = await appointmentModel
      .find({ doctorId, shopId })
      .sort({ slotDateTime: -1 })
      .lean();
    res.json({ success: true, appointments });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── PUT /api/stylist/appointments/:id/complete ────────────────────────────────
export const completeStylistAppointment = async (req, res) => {
  try {
    const { doctorId, shopId } = req.stylist;
    const apt = await appointmentModel.findOne({ _id: req.params.id, doctorId, shopId });
    if (!apt) return res.json({ success: false, message: 'Appointment not found.' });
    if (apt.cancelled) return res.json({ success: false, message: 'Cannot complete a cancelled appointment.' });
    apt.isCompleted = true;
    await apt.save();
    res.json({ success: true, message: 'Appointment marked as completed.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── PUT /api/stylist/appointments/:id/cancel ──────────────────────────────────
export const cancelStylistAppointment = async (req, res) => {
  try {
    const { doctorId, shopId } = req.stylist;
    const apt = await appointmentModel.findOne({ _id: req.params.id, doctorId, shopId });
    if (!apt) return res.json({ success: false, message: 'Appointment not found.' });
    if (apt.cancelled) return res.json({ success: false, message: 'Already cancelled.' });
    apt.cancelled = true;
    apt.cancelledBy = 'admin';
    await apt.save();

    // Free the slot
    const doctor = await doctorModel.findById(doctorId);
    if (doctor) {
      const slots = doctor.slots_booked.get(apt.slotDate) || [];
      doctor.slots_booked.set(apt.slotDate, slots.filter(t => t !== apt.slotTime));
      await doctor.save();
    }
    res.json({ success: true, message: 'Appointment cancelled.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ── GET /api/stylist/profile ──────────────────────────────────────────────────
export const getStylistProfile = async (req, res) => {
  try {
    const { doctorId } = req.stylist;
    const doctor = await doctorModel.findById(doctorId).select('-password').lean();
    if (!doctor) return res.json({ success: false, message: 'Profile not found.' });
    const shop = await shopModel.findOne({ shopId: doctor.shopId }).select('shopName slug').lean();
    res.json({ success: true, stylist: doctor, shopName: shop?.shopName, shopSlug: shop?.slug });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
