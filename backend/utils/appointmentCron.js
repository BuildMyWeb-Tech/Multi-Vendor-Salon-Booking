// backend/utils/appointmentCron.js
import cron from 'node-cron';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import AdminNotification from '../models/AdminNotification.js';

// ─── Helper: format slotDate + slotTime for display ──────────────────────────
const formatDisplayDate = (slotDate, slotTime) => {
  const [y, m, d] = slotDate.split('-').map(Number);
  const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const [h, min] = slotTime.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const timeStr = `${hour12}:${String(min).padStart(2, '0')} ${period}`;
  return { dateStr, timeStr };
};

/**
 * ─── CRON 1: Auto-complete past appointments ─────────────────────────────────
 * Marks appointments as completed 30 min after their slot time.
 * Runs every 15 minutes.
 */
export const startAppointmentCompletionCron = () => {
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('Running appointment completion check...');
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const result = await appointmentModel.updateMany(
        {
          cancelled: false,
          isCompleted: false,
          slotDateTime: { $lt: thirtyMinutesAgo },
        },
        { $set: { isCompleted: true } }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Marked ${result.modifiedCount} appointments as completed`);
      }
    } catch (error) {
      console.error('Error in appointment completion cron:', error);
    }
  });

  console.log('✅ Appointment completion cron job started (runs every 15 minutes)');
};

/**
 * ─── CRON 2: 24-hour reminder notifications ──────────────────────────────────
 * Sends a reminder to the USER and ADMIN for appointments happening in ~24 hours.
 * Uses a `reminderSent` flag on the appointment to prevent duplicate sends.
 * Runs every hour.
 */
export const startReminderCron = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      // Window: appointments starting between 23 and 25 hours from now
      const in23 = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const in25 = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      const upcomingAppointments = await appointmentModel.find({
        cancelled: false,
        isCompleted: false,
        reminderSent: { $ne: true },
        slotDateTime: { $gte: in23, $lte: in25 },
      });

      if (upcomingAppointments.length === 0) return;

      console.log(`⏰ Sending 24-hour reminders for ${upcomingAppointments.length} appointment(s)`);

      for (const appt of upcomingAppointments) {
        try {
          const { dateStr, timeStr } = formatDisplayDate(appt.slotDate, appt.slotTime);
          const stylistName = appt.docData?.name || 'your stylist';
          const userName = appt.userData?.name || 'User';

          // ✅ USER — 24-hour reminder notification
          await userModel.findByIdAndUpdate(appt.userId, {
            $push: {
              notifications: {
                title: '⏰ Appointment Reminder — Tomorrow',
                message: `Don't forget! You have an appointment with ${stylistName} on ${dateStr} at ${timeStr}. Please arrive on time.`,
                type: 'reminder',
                read: false,
                link: '/my-appointments',
                createdAt: new Date(),
              },
            },
          });

          // ✅ ADMIN — 24-hour reminder notification
          await AdminNotification.create({
            title: '⏰ Upcoming Appointment (24h reminder)',
            message: `${userName} has an appointment with ${stylistName} on ${dateStr} at ${timeStr}.`,
            type: 'reminder',
            appointmentId: appt._id,
            meta: {
              userName,
              stylistName,
              slotDate: appt.slotDate,
              slotTime: appt.slotTime,
            },
          });

          // ✅ Mark reminder as sent — prevents duplicate notifications
          await appointmentModel.findByIdAndUpdate(appt._id, { reminderSent: true });

          console.log(
            `✅ Reminder sent for appointment ${appt._id} (${userName} with ${stylistName})`
          );
        } catch (err) {
          console.error(`❌ Failed reminder for appointment ${appt._id}:`, err.message);
        }
      }
    } catch (error) {
      console.error('Error in reminder cron:', error);
    }
  });

  console.log('✅ 24-hour reminder cron job started (runs every hour)');
};

/**
 * ─── STARTUP: Complete all past appointments immediately ─────────────────────
 * Called once on server start to catch any appointments missed while offline.
 */
export const completePastAppointments = async () => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const result = await appointmentModel.updateMany(
      {
        cancelled: false,
        isCompleted: false,
        slotDateTime: { $lt: thirtyMinutesAgo },
      },
      { $set: { isCompleted: true } }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Completed ${result.modifiedCount} past appointments on startup`);
    }

    return result.modifiedCount;
  } catch (error) {
    console.error('Error completing past appointments:', error);
    return 0;
  }
};
