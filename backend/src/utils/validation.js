const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
}

function normalizeName(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return name.length >= 1 && name.length <= 100 ? name : null;
}

function validPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}

module.exports = { normalizeEmail, normalizeName, validPassword };
