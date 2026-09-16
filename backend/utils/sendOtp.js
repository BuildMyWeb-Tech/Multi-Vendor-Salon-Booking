// C:\Users\Siddharathan\Desktop\salon-booking-full-stack\backend\utils\sendOtp.js
import twilio from 'twilio';

// ✅ Twilio credentials loaded silently — never log secrets to console
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

// Only warn (without values) if config is missing
if (!accountSid || !authToken || !fromPhone) {
  console.warn('⚠️  Twilio not fully configured — OTP sending will be disabled.');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Send an OTP SMS via Twilio.
 * Returns { success: true } or { success: false, message }
 */
const sendOtp = async (phone, otp) => {
  if (!client) {
    console.warn('⚠️  Twilio client not initialised — OTP not sent.');
    return { success: false, message: 'OTP service not configured' };
  }

  try {
    await client.messages.create({
      body: `Your OTP for salon booking is: ${otp}. Valid for 10 minutes.`,
      from: fromPhone,
      to: phone,
    });
    return { success: true };
  } catch (error) {
    console.error('❌ Twilio sendOtp error:', error.message);
    return { success: false, message: error.message };
  }
};

export default sendOtp;
