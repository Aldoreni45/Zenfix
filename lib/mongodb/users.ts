import 'server-only';
import bcrypt from 'bcryptjs';
import { findDocumentRaw, findDocumentById, insertDocumentReturningId, updateDocumentById, listDocuments, type ZDoc } from '@/lib/mongodb/repository';

const ENTITY = 'users';

export interface UserDoc {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  role: 'owner' | 'manager' | 'employee';
  role_name: string;
  department?: string;
  department_name?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended' | string;
  status_name: string;
  last_login?: string | null;
  passwordHash?: string;
  created_at: string;
  updated_at: string;
}

const SALT_ROUNDS = 12;

export async function findByUsername(username: string): Promise<UserDoc | null> {
  // Raw lookup: keeps `passwordHash` so `verifyPassword` can check it.
  const user = await findDocumentRaw<UserDoc>(ENTITY, {
    username: { $regex: `^${escapeRegExp(username)}$`, $options: 'i' },
  });
  return user;
}

export async function findById(id: number | string): Promise<UserDoc | null> {
  return findDocumentById<UserDoc>(ENTITY, id);
}

export async function verifyPassword(user: UserDoc, password: string): Promise<boolean> {
  if (!user.passwordHash) return false;
  try {
    return await bcrypt.compare(password, user.passwordHash);
  } catch {
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Create a user, hashing the password. Throws if the username is taken. */
export async function createUser(
  data: Omit<UserDoc, 'id' | 'passwordHash' | 'created_at' | 'updated_at' | 'full_name'> & {
    password: string;
  }
): Promise<ZDoc> {
  const existing = await findByUsername(data.username);
  if (existing) {
    const error = new Error('A user with this username already exists.') as Error & { field?: string };
    error.field = 'username';
    throw error;
  }

  const passwordHash = await hashPassword(data.password);
  const { password: _pw, ...rest } = data;

  return insertDocumentReturningId(ENTITY, {
    ...rest,
    passwordHash,
    full_name: `${rest.first_name ?? ''} ${rest.last_name ?? ''}`.trim() || (rest as any).username,
    last_login: null,
  } as Record<string, unknown>);
}

/** Update a user and re-hash the password only when a new one is provided. */
export async function updateUser(
  id: number | string,
  patch: Record<string, unknown> & { password?: string }
): Promise<UserDoc | null> {
  const update: Record<string, unknown> = { ...patch };
  if (patch.password) {
    update.passwordHash = await hashPassword(patch.password as string);
  }
  delete update.password;
  delete update.confirm_password;

  // Never let a client assign a passwordHash directly.
  delete update.passwordHash;

  if (update.first_name !== undefined || update.last_name !== undefined) {
    const current = await findById(id);
    update.full_name = `${update.first_name ?? current?.first_name ?? ''} ${update.last_name ?? current?.last_name ?? ''}`.trim();
  }

  const updated = await updateDocumentById(ENTITY, id, update);
  return updated as unknown as UserDoc | null;
}

export async function listAllUsers(): Promise<UserDoc[]> {
  return listDocuments<UserDoc>(ENTITY, {}, { sort: { id: 1 as const } });
}

export async function listUsersByRole(role: 'owner' | 'manager' | 'employee'): Promise<UserDoc[]> {
  return listDocuments<UserDoc>(ENTITY, { role }, { sort: { id: 1 as const } });
}

/** Shape used by the API responses (drops internal/secret fields). */
export function toPublicUser(user: UserDoc): Record<string, unknown> {
  const { passwordHash: _hash, password: _pw, _id: _id, entity: _ent, ...publicUser } = user as UserDoc & {
    password?: string;
    _id?: unknown;
    entity?: string;
  };
  return publicUser;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}