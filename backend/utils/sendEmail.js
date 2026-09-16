import nodemailer from 'nodemailer';

// ✅ FIXED transporter (no "service", force IPv4)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  // ✅ CRITICAL FIX (prevents ENETUNREACH on Render)
  family: 4,

  // ✅ Optional but recommended (avoid hanging)
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

export const sendOTPEmail = async (toEmail, otp, purpose = 'login') => {
  try {
    console.log('📧 Sending OTP to:', toEmail);

    const subject =
      purpose === 'reset'
        ? 'Password Reset OTP – Salon Booking'
        : 'Your Login OTP – Salon Booking';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
        <div style="background:#5f6FFF;padding:20px 24px;">
          <h2 style="color:#fff;margin:0;font-size:20px;">Salon Booking System</h2>
        </div>
        <div style="padding:28px 24px;">
          <p style="font-size:15px;color:#374151;margin-top:0;">
            ${purpose === 'reset'
              ? 'You requested a password reset.'
              : 'Use the OTP below to complete your login.'}
          </p>
          <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#5f6FFF;">${otp}</span>
          </div>
          <p style="font-size:13px;color:#6b7280;">
            This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
        </div>
        <div style="background:#f9fafb;padding:14px 24px;text-align:center;">
          <p style="font-size:12px;color:#9ca3af;margin:0;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Salon Booking" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html,
    });

    console.log('✅ OTP email sent successfully');
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
};