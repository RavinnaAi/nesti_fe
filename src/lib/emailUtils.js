const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeEmailInput(value) {
  return String(value || '').replace(/\s/g, '');
}

export function isEmailValid(value) {
  const email = sanitizeEmailInput(value);
  return Boolean(email) && EMAIL_PATTERN.test(email);
}

export function validateEmailRequired(value) {
  const email = sanitizeEmailInput(value);
  if (!email) return 'Email is required';
  if (!EMAIL_PATTERN.test(email)) return 'Please enter a valid email address';
  return '';
}
