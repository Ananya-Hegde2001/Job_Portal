export function isValidEmail(email) {
  const value = (email || '').trim();
  // Simple but solid email format check
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}
