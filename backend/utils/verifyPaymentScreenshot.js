/**
 * UPI payment screenshot verification using Claude vision API.
 *
 * Extracts structured payment data from any Indian UPI app screenshot
 * (GPay, PhonePe, Paytm, BHIM, Amazon Pay, etc.) and cross-validates
 * against the booking details and salon's configured payment info.
 *
 * NOTE: Screenshot OCR can detect forgeries and mismatches but cannot
 * prove funds actually reached the bank. For production, wire in a
 * bank webhook or UPI payment-status API (Razorpay, PayU, NPCI etc.)
 * and set paymentVerified = true only when the bank confirms receipt.
 */

import Anthropic from '@anthropic-ai/sdk';

const EXTRACTION_PROMPT = `You are a payment fraud-detection system for an Indian salon booking app.

Analyze this UPI payment screenshot carefully and extract every visible detail.
Return ONLY a raw JSON object — no markdown, no explanation, no code fences.

{
  "isPaymentScreenshot": true,
  "status": "Success | Failed | Pending | Unknown",
  "transactionId": "UTR number or transaction reference exactly as shown, or null",
  "amount": 0,
  "currency": "INR",
  "fromUpiId": "sender UPI ID or null",
  "fromName": "sender display name or null",
  "toUpiId": "receiver UPI ID or null",
  "payeeName": "receiver/payee name exactly as shown, or null",
  "bankName": "receiver bank name if shown, or null",
  "dateTime": "date and time string exactly as shown, or null",
  "appSource": "GPay | PhonePe | Paytm | BHIM | AmazonPay | Other | Unknown",
  "suspicionFlags": [],
  "confidence": "high | medium | low"
}

Rules:
- isPaymentScreenshot: false if this is NOT a UPI payment confirmation screen
- status must be exactly "Success" for a completed payment
- transactionId: copy the 12-digit UPI UTR or alphanumeric reference exactly, no spaces
- amount: number only, no ₹ or commas
- suspicionFlags: list any concerns such as ["blurry", "possibly_edited", "status_unclear", "amount_obscured"]
- If a field is not visible in the screenshot, set it to null — do not guess
- confidence: high = all key fields (status, amount, transactionId, payee) clearly visible`;

/**
 * Call Claude claude-haiku-4-5 with vision to extract payment details from a screenshot.
 * @param {string} imageUrl - Publicly accessible image URL (Cloudinary)
 * @returns {Promise<Object>} Extracted payment details
 */
export const extractPaymentDetails = async (imageUrl) => {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: imageUrl },
          },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  const raw = response.content[0].text.trim();
  // Strip accidental markdown code fences
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(jsonStr);
};

/**
 * Cross-validate extracted OCR details against entered UTR, booking amount,
 * and the salon's configured payment information.
 *
 * @param {object} opts
 * @param {object} opts.extracted      - Result of extractPaymentDetails()
 * @param {string} opts.enteredUtr     - UTR the customer typed in the form
 * @param {number} opts.bookingAmount  - Total booking amount (INR)
 * @param {object} opts.shop           - shopModel document with UPI config
 * @returns {{ pass: boolean, errors: string[], warnings: string[], extracted: object }}
 */
export const verifyExtractedDetails = ({ extracted, enteredUtr, bookingAmount, shop }) => {
  const errors = [];
  const warnings = [];

  // ── Guard: must be a payment screenshot ──────────────────────────────────────
  if (!extracted.isPaymentScreenshot) {
    return {
      pass: false,
      errors: ['The uploaded image does not appear to be a UPI payment confirmation. Please upload the payment success screenshot.'],
      warnings: [],
      extracted,
    };
  }

  // ── 1. Payment status ─────────────────────────────────────────────────────────
  const status = (extracted.status || '').toLowerCase();
  if (status !== 'success') {
    errors.push(
      `Payment status is "${extracted.status || 'unknown'}" — only Successful transactions are accepted.`
    );
  }

  // ── 2. Transaction ID / UTR match ─────────────────────────────────────────────
  if (extracted.transactionId) {
    const ocrUtr = extracted.transactionId.replace(/\s+/g, '').toUpperCase();
    const typedUtr = enteredUtr.replace(/\s+/g, '').toUpperCase();
    if (ocrUtr !== typedUtr) {
      errors.push(
        `Transaction ID mismatch: screenshot shows "${extracted.transactionId}" but you entered "${enteredUtr}". They must match exactly.`
      );
    }
  } else {
    errors.push(
      'Transaction ID / UTR number could not be read from the screenshot. Please upload a clear, unedited payment confirmation.'
    );
  }

  // ── 3. Amount match ───────────────────────────────────────────────────────────
  if (extracted.amount !== null && extracted.amount !== undefined) {
    const ocrAmt = parseFloat(String(extracted.amount).replace(/[^0-9.]/g, ''));
    const expectedAmt = parseFloat(bookingAmount);
    if (isNaN(ocrAmt)) {
      errors.push('Payment amount could not be read from the screenshot.');
    } else if (Math.abs(ocrAmt - expectedAmt) > 0.50) {
      errors.push(
        `Amount mismatch: screenshot shows ₹${ocrAmt} but the booking total is ₹${expectedAmt}. The amounts must match.`
      );
    }
  } else {
    errors.push('Paid amount could not be read from the screenshot.');
  }

  // ── 4. Receiver UPI ID ────────────────────────────────────────────────────────
  if (shop.upiId && extracted.toUpiId) {
    const ocrTo = extracted.toUpiId.toLowerCase().trim();
    const configuredUpi = shop.upiId.toLowerCase().trim();
    if (ocrTo !== configuredUpi) {
      errors.push(
        `Payment was sent to UPI ID "${extracted.toUpiId}" but the salon's UPI ID is "${shop.upiId}". Please pay to the correct account.`
      );
    }
  } else if (shop.upiId && !extracted.toUpiId) {
    warnings.push('Receiver UPI ID was not visible in the screenshot — please ensure payment was sent to the correct account.');
  }

  // ── 5. Payee name match (partial / case-insensitive) ─────────────────────────
  if (shop.upiName && extracted.payeeName) {
    const ocrName = extracted.payeeName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const configName = shop.upiName.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Allow partial match (first 4+ chars) to handle truncation in apps
    const minLen = Math.min(4, Math.min(ocrName.length, configName.length));
    const ocrSnippet = ocrName.slice(0, Math.max(minLen, 5));
    const cfgSnippet = configName.slice(0, Math.max(minLen, 5));
    if (ocrName.length > 0 && cfgSnippet.length > 0 && !ocrName.includes(cfgSnippet) && !configName.includes(ocrSnippet)) {
      errors.push(
        `Payee name "${extracted.payeeName}" does not match the salon's registered name "${shop.upiName}".`
      );
    }
  }

  // ── 6. Suspicion flags ────────────────────────────────────────────────────────
  const suspicion = extracted.suspicionFlags || [];
  if (suspicion.includes('possibly_edited') || suspicion.includes('edited')) {
    errors.push('The screenshot appears to have been digitally edited. Only original, unmodified payment screenshots are accepted.');
  }
  if (suspicion.includes('blurry') || suspicion.includes('unreadable')) {
    errors.push('The screenshot is too blurry to verify. Please upload a clear screenshot.');
  }
  if (suspicion.includes('status_unclear')) {
    warnings.push('Payment status is not clearly visible in the screenshot.');
  }

  // ── 7. Low confidence ────────────────────────────────────────────────────────
  if (extracted.confidence === 'low') {
    errors.push('The screenshot quality is too low to verify. Please upload a clear, high-resolution screenshot.');
  }

  return { pass: errors.length === 0, errors, warnings, extracted };
};
