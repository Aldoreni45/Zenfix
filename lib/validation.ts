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
