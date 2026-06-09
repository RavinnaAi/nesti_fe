import { isPossiblePhoneNumber, isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input';

export const DEFAULT_PHONE_COUNTRY = 'US';

export function phoneDigitCount(value) {
  const s = String(value || '').trim();
  if (!s) return 0;
  return (s.match(/\d/g) || []).length;
}

export function normalizePhoneForStorage(value, defaultCountry = DEFAULT_PHONE_COUNTRY) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const parsed = parsePhoneNumber(raw, defaultCountry);
    if (parsed?.number) return parsed.number;
  } catch {
    // fall through to sanitized digits
  }

  const digits = raw.replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+')) return digits;

  try {
    const parsed = parsePhoneNumber(digits, defaultCountry);
    if (parsed?.number) return parsed.number;
  } catch {
    // ignore
  }

  return `+${digits}`;
}

export function validatePhoneRequired(value, { lenient = false } = {}) {
  const normalized = normalizePhoneForStorage(value);
  if (!normalized) return 'Phone is required';
  const isAcceptable = lenient
    ? isPossiblePhoneNumber(normalized)
    : isValidPhoneNumber(normalized);
  if (!isAcceptable) return 'Please enter a valid phone number';
  return '';
}

export function isPhoneValid(value) {
  const normalized = normalizePhoneForStorage(value);
  return Boolean(normalized) && isValidPhoneNumber(normalized);
}
