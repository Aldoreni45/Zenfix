import { SignJWT, jwtVerify, decodeJwt } from 'jose';

const ACCESS_TOKEN_EXPIRY = '1h'; // 1 hour
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  type: 'access' | 'refresh';
}

function getSecret(name: string): Uint8Array {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return new TextEncoder().encode(value);
}

function secretNameFor(type: 'access' | 'refresh'): string {
  return type === 'access' ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET';
}

export async function signAccessToken(payload: Omit<JWTPayload, 'type'>): Promise<string> {
  return await new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getSecret(secretNameFor('access')));
}

export async function signRefreshToken(payload: Omit<JWTPayload, 'type'>): Promise<string> {
  return await new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getSecret(secretNameFor('refresh')));
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  let type: unknown;
  try {
    type = (decodeJwt(token) as { type?: unknown } | null)?.type;
  } catch {
    type = undefined;
  }
  const secret = getSecret(secretNameFor(type === 'refresh' ? 'refresh' : 'access'));
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export async function verifyAccessToken(token: string): Promise<Omit<JWTPayload, 'type'>> {
  const payload = await verifyToken(token);
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  const { type, ...rest } = payload;
  return rest;
}

export async function verifyRefreshToken(token: string): Promise<Omit<JWTPayload, 'type'>> {
  const payload = await verifyToken(token);
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  const { type, ...rest } = payload;
  return rest;
}
