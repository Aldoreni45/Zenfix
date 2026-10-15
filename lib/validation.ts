export const PHONE_DIGITS = 10;

// Keep only the digits so stored values are consistent (no spaces/dashes/plus).
export function normalizePhone(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

// A valid phone number is exactly 10 digits.
export function isValidPhone(value: unknown): boolean {
  return normalizePhone(value).length === PHONE_DIGITS;
}

// Restrict raw input to at most 10 digits, for use in form onChange handlers.
export function restrictPhoneInput(value: string): string {
  return normalizePhone(value).slice(0, PHONE_DIGITS);
}

export const PHONE_ERROR = `Phone number must be exactly ${PHONE_DIGITS} digits.`;

/**
 * Escape a user-provided string before it is embedded in a regular expression.
 *
 * Search endpoints pass raw query values into MongoDB `$regex`. A value such as
 * `(` or `[` is an invalid pattern and makes the query throw (HTTP 500), while
 * crafted patterns can cause catastrophic backtracking (ReDoS). Escaping keeps
 * search a plain substring match and removes both problems.
 */
export function escapeRegex(value: unknown): string {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
