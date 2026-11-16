// Thin client for the Xendit QR Codes API (QRIS). Docs: https://developers.xendit.co/api-reference/#qr-codes
const BASE_URL = 'https://api.xendit.co';
const API_VERSION = '2022-07-31';
const REQUEST_TIMEOUT_MS = 15000;

class XenditError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function secretKey() {
  const key = process.env.XENDIT_SECRET_KEY;
  if (!key) throw new XenditError(503, 'NOT_CONFIGURED', 'XENDIT_SECRET_KEY is not set');
  return key;
}

function isTestMode() {
  return (process.env.XENDIT_SECRET_KEY || '').startsWith('xnd_development_');
}

async function call(method, path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey()}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      'api-version': API_VERSION,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new XenditError(response.status, data.error_code || 'UNKNOWN', data.message || 'Xendit request failed');
  }
  return data;
}

function createQrCode({ referenceId, amount, expiresAt }) {
  return call('POST', '/qr_codes', {
    reference_id: referenceId,
    type: 'DYNAMIC',
    currency: 'IDR',
    amount,
    expires_at: expiresAt.toISOString(),
  });
}

async function listQrPayments(qrId) {
  const data = await call('GET', `/qr_codes/${encodeURIComponent(qrId)}/payments`);
  return Array.isArray(data.data) ? data.data : [];
}

function simulateQrPayment(qrId, amount) {
  return call('POST', `/qr_codes/${encodeURIComponent(qrId)}/payments/simulate`, { amount });
}

module.exports = { createQrCode, listQrPayments, simulateQrPayment, isTestMode, XenditError };
