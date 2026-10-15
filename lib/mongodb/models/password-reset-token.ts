import 'server-only';
import crypto from 'crypto';
import { getDb } from '../client';

/**
 * Password reset tokens.
 *
 * These were previously held in a module-scoped `Map` inside each route file.
 * That approach was broken and unsafe in production:
 *  - the request route and the confirm route are separate modules, so they had
 *    *different* Maps and a generated token could never be validated;
 *  - tokens were lost on every restart / redeploy and were not shared across
 *    multiple application instances;
 *  - the raw token was written to the server console.
 *
 * Persisting a SHA-256 hash of the token in MongoDB fixes all three: the token
 * survives restarts, is shared by every instance, and a database dump never
 * exposes a usable reset link.
 */
export interface PasswordResetTokenDocument {
  _id?: any;
  token_hash: string;
  user_id: number;
  expires_at: Date;
  created_at: Date;
}

const COLLECTION = 'zf_password_reset_tokens';
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

let indexesEnsured: Promise<void> | null = null;

export class PasswordResetTokenModel {
  private static getCollection() {
    return getDb().then((db) => db.collection<PasswordResetTokenDocument>(COLLECTION));
  }

  private static async ensureIndexes(): Promise<void> {
    if (!indexesEnsured) {
      indexesEnsured = (async () => {
        try {
          const collection = await this.getCollection();
          await collection.createIndex({ token_hash: 1 }, { unique: true });
          await collection.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
          await collection.createIndex({ user_id: 1 });
        } catch {
          // Index creation is an optimisation; failing it must not break the
          // password reset flow. Next call will retry.
          indexesEnsured = null;
        }
      })();
    }
    return indexesEnsured;
  }

  /**
   * Create a single-use reset token for the user. Any previously issued token
   * for the same user is invalidated so only the newest link works.
   * Returns the raw token (only ever handed to the requester).
   */
  static async create(userId: number, ttlMs: number = DEFAULT_TTL_MS): Promise<string> {
    await this.ensureIndexes();
    const collection = await this.getCollection();
    const now = new Date();

    await collection.deleteMany({ user_id: userId });
    await collection.deleteMany({ expires_at: { $lt: now } });

    const token = crypto.randomBytes(32).toString('hex');
    await collection.insertOne({
      token_hash: hashToken(token),
      user_id: userId,
      expires_at: new Date(now.getTime() + ttlMs),
      created_at: now,
    });

    return token;
  }

  /**
   * Validate and consume a reset token. Returns true only for a token that
   * belongs to `userId`, has not expired, and has not been used before.
   */
  static async consume(token: string, userId: number): Promise<boolean> {
    if (!token || typeof token !== 'string') return false;
    const collection = await this.getCollection();
    const now = new Date();

    const doc = await collection.findOne({
      token_hash: hashToken(token),
      user_id: userId,
    });
    if (!doc) return false;

    if (!doc.expires_at || doc.expires_at.getTime() < now.getTime()) {
      await collection.deleteOne({ _id: doc._id });
      return false;
    }

    await collection.deleteOne({ _id: doc._id });
    return true;
  }
}
