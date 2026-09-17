import 'server-only';
import type { Filter, Sort, OptionalUnlessRequiredId, UpdateFilter } from 'mongodb';
import { counterCollection, dataCollection } from '@/lib/mongodb';

/**
 * A single MongoDB collection (`data`) stores every ZenFix entity. Each
 * document carries an `entity` discriminator plus a monotonic numeric `id`
 * (per entity), which matches the numeric ids the UI already expects.
 *
 * IDs are allocated from a `counters` collection using an atomic
 * `findOneAndUpdate` with `$inc`, so concurrent inserts can never collide.
 */

export interface ZDoc {
  _id?: unknown;
  entity: string;
  id: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

/** Fields that must never leave the server. */
export const INTERNAL_FIELDS = ['_id', 'passwordHash', 'entity'] as const;

export function serializeDoc<T extends Record<string, unknown>>(doc: T): Omit<T, '_id'> {
  const out: Record<string, unknown> = { ...doc };
  for (const key of INTERNAL_FIELDS) {
    delete out[key];
  }
  return out as Omit<T, '_id'>;
}

async function getCounter(entity: string): Promise<number> {
  const coll = await counterCollection<{ _id: string; value: number }>();
  const result = await coll.findOneAndUpdate(
    { _id: entity },
    { $inc: { value: 1 } } as UpdateFilter<{ _id: string; value: number }>,
    { upsert: true, returnDocument: 'after' }
  );
  return result?.value ?? 1;
}

export async function listDocuments<T = Record<string, unknown>>(
  entity: string,
  filter: Filter<Record<string, unknown>> = {},
  opts: { limit?: number; skip?: number; sort?: Sort } = {}
): Promise<T[]> {
  const coll = await dataCollection();
  const cursor = coll.find({ entity, ...filter } as Filter<Record<string, unknown>>);
  if (opts.sort) cursor.sort(opts.sort);
  if (opts.skip) cursor.skip(opts.skip);
  if (opts.limit && opts.limit > 0) cursor.limit(opts.limit);
  const docs = await cursor.toArray();
  return docs.map((d) => serializeDoc(d as unknown as Record<string, unknown>) as unknown as T);
}

export async function findDocumentById<T = Record<string, unknown>>(
  entity: string,
  id: number | string
): Promise<T | null> {
  const coll = await dataCollection();
  const numeric = Number(id);
  if (Number.isNaN(numeric)) return null;
  const doc = await coll.findOne({ entity, id: numeric });
  return doc ? (serializeDoc(doc as unknown as Record<string, unknown>) as unknown as T) : null;
}

export async function findDocument<T = Record<string, unknown>>(
  entity: string,
  filter: Filter<Record<string, unknown>>
): Promise<T | null> {
  const coll = await dataCollection();
  const doc = await coll.findOne({ entity, ...filter } as Filter<Record<string, unknown>>);
  return doc ? (serializeDoc(doc as unknown as Record<string, unknown>) as unknown as T) : null;
}

/**
 * Raw lookup that keeps internal fields (e.g. `passwordHash`) intact.
 * Only intended for server-side auth flows; never return this to the client.
 */
export async function findDocumentRaw<T = Record<string, unknown>>(
  entity: string,
  filter: Filter<Record<string, unknown>>
): Promise<T | null> {
  const coll = await dataCollection();
  const doc = await coll.findOne({ entity, ...filter } as Filter<Record<string, unknown>>);
  return doc ? (doc as unknown as T) : null;
}

/**
 * Insert a new document, allocating a fresh numeric id and timestamps.
 * Returns the stored record (including `_id` and `id`).
 */
export async function insertDocumentReturningId<T extends Record<string, unknown>>(
  entity: string,
  data: T
): Promise<ZDoc> {
  const coll = await dataCollection();
  const id = await getCounter(entity);
  const now = new Date().toISOString();
  const doc: ZDoc = {
    _id: undefined,
    entity,
    id,
    ...data,
    createdAt: (data.createdAt as string) || now,
    updatedAt: now,
  };
  const inserted = await coll.insertOne(doc as unknown as OptionalUnlessRequiredId<ZDoc>);
  const stored = { ...doc, _id: inserted.insertedId };
  return stored;
}

export async function updateDocumentById(
  entity: string,
  id: number | string,
  patch: Record<string, unknown>
): Promise<ZDoc | null> {
  const coll = await dataCollection();
  const numeric = Number(id);
  if (Number.isNaN(numeric)) return null;

  const update: UpdateFilter<ZDoc> = {
    $set: { ...patch, updatedAt: new Date().toISOString() },
  };

  const result = await coll.findOneAndUpdate(
    { entity, id: numeric } as Filter<ZDoc>,
    update,
    { returnDocument: 'after' }
  );
  // mongodb driver v7 returns the document itself (or null), not a
  // `{ value }` wrapper.
  return (result as unknown as ZDoc) ?? null;
}

export async function removeDocumentById(
  entity: string,
  id: number | string
): Promise<boolean> {
  const coll = await dataCollection();
  const numeric = Number(id);
  if (Number.isNaN(numeric)) return false;
  const result = await coll.deleteOne({ entity, id: numeric } as Filter<ZDoc>);
  return (result.deletedCount ?? 0) > 0;
}

export async function countDocuments(
  entity: string,
  filter: Filter<Record<string, unknown>> = {}
): Promise<number> {
  const coll = await dataCollection();
  return coll.countDocuments({ entity, ...filter } as Filter<Record<string, unknown>>);
}

export async function aggregateDocuments<T>(
  entity: string,
  pipeline: Record<string, unknown>[]
): Promise<T[]> {
  const coll = await dataCollection();
  const documents = await coll.aggregate<T & Document>([
    { $match: { entity } as Filter<Record<string, unknown>> },
    ...pipeline,
  ]).toArray();
  return documents;
}