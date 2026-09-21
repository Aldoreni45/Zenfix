import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const ACCESS_TOKEN_EXPIRY = '1h'; // 1 hour
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  type: 'access' | 'refresh';
}

export async function signAccessToken(payload: Omit<JWTPayload, 'type'>): Promise<string> {
  return await new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: Omit<JWTPayload, 'type'>): Promise<string> {
  return await new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
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
