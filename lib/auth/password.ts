import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;
const PBKDF2_DIGEST = 'sha256';

// Django PBKDF2 format: pbkdf2_sha256$<iterations>$<salt>$<hash>
const DJANGO_PBKDF2_REGEX = /^pbkdf2_sha256\$(\d+)\$([a-zA-Z0-9+/]+)\$([a-zA-Z0-9+/]+={0,2})$/;

export async function hashPassword(password: string): Promise<string> {
  // Use bcrypt for new passwords (more secure than PBKDF2)
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (typeof password !== 'string' || typeof hash !== 'string' || hash.length === 0) {
    return false;
  }

  // First try bcrypt (for new passwords). `$2y$` is a valid bcrypt variant
  // produced by PHP/Django tooling, so it must be accepted too.
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  // Try Django PBKDF2 format (for migrated users)
  const pbkdf2Match = hash.match(DJANGO_PBKDF2_REGEX);
  if (pbkdf2Match) {
    const [, iterations, salt, storedHash] = pbkdf2Match;
    const parsedIterations = parseInt(iterations, 10);
    if (!Number.isFinite(parsedIterations) || parsedIterations <= 0) {
      return false;
    }
    return verifyPBKDF2(password, salt, storedHash, parsedIterations);
  }

  // If neither format matches, return false
  return false;
}

function verifyPBKDF2(password: string, salt: string, storedHash: string, iterations: number): boolean {
  try {
    const stored = Buffer.from(storedHash, 'base64');
    if (stored.length === 0) return false;

    // Derive with the same key length the hash was created with. Django's
    // default PBKDF2PasswordHasher uses the digest size (32 bytes for SHA-256),
    // while older exports could use a larger length. Deriving from the stored
    // length keeps both verifiable instead of hard-coding a single value.
    const computed = crypto.pbkdf2Sync(
      password,
      Buffer.from(salt, 'base64'),
      iterations,
      stored.length,
      PBKDF2_DIGEST
    );

    // Constant-time comparison: a plain `===` leaks hash bytes through timing.
    if (computed.length !== stored.length) {
      return false;
    }
    return crypto.timingSafeEqual(computed, stored);
  } catch {
    return false;
  }
}

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
