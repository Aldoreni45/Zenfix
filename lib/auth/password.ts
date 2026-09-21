import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;
const PBKDF2_ITERATIONS = 390000;
const PBKDF2_KEY_LENGTH = 128;
const PBKDF2_DIGEST = 'sha256';

// Django PBKDF2 format: pbkdf2_sha256$<iterations>$<salt>$<hash>
const DJANGO_PBKDF2_REGEX = /^pbkdf2_sha256\$(\d+)\$([a-zA-Z0-9+/]+)\$([a-zA-Z0-9+/]+={0,2})$/;

export async function hashPassword(password: string): Promise<string> {
  // Use bcrypt for new passwords (more secure than PBKDF2)
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // First try bcrypt (for new passwords)
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return await bcrypt.compare(password, hash);
  }

  // Try Django PBKDF2 format (for migrated users)
  const pbkdf2Match = hash.match(DJANGO_PBKDF2_REGEX);
  if (pbkdf2Match) {
    const [, iterations, salt, storedHash] = pbkdf2Match;
    return verifyPBKDF2(password, salt, storedHash, parseInt(iterations));
  }

  // If neither format matches, return false
  return false;
}

function verifyPBKDF2(password: string, salt: string, storedHash: string, iterations: number): boolean {
  try {
    const hash = crypto.pbkdf2Sync(
      password,
      Buffer.from(salt, 'base64'),
      iterations,
      PBKDF2_KEY_LENGTH,
      PBKDF2_DIGEST
    );
    const hashBase64 = hash.toString('base64');
    return hashBase64 === storedHash;
  } catch (error) {
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
