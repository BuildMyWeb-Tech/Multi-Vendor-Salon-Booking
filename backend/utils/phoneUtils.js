/**
 * Indian phone number normalization.
 * All numbers are stored and used as +91XXXXXXXXXX (E.164 format).
 */

/**
 * Normalize any Indian mobile input to +91XXXXXXXXXX.
 * Accepts: 9876543210 / 919876543210 / +919876543210
 * Returns null if invalid.
 */
export function normalizeIndianPhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith('091')) return `+91${digits.slice(3)}`;

  return null; // unrecognized format
}

/**
 * Return true if the string looks like a valid +91 Indian number.
 */
export function isValidIndianPhone(raw) {
  return normalizeIndianPhone(raw) !== null;
}

/**
 * Convert a stored +91XXXXXXXXXX phone to a WhatsApp JID.
 * e.g. "+919344095727" → "919344095727@s.whatsapp.net"
 */
export function phoneToWhatsAppJid(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;

  // Ensure country code is present
  if (digits.length === 10) return `91${digits}@s.whatsapp.net`;
  if (digits.length === 12 && digits.startsWith('91')) return `${digits}@s.whatsapp.net`;

  // Already a JID
  if (phone.includes('@')) return phone;

  return `${digits}@s.whatsapp.net`;
}

/**
 * Strip +91 prefix for display in a 10-digit UI field.
 */
export function displayPhone(stored) {
  if (!stored) return '';
  const digits = String(stored).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}
