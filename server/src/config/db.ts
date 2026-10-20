import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env';

let memoryServer: MongoMemoryServer | null = null;
let connectPromise: Promise<void> | null = null;
let dbReady = false;

async function connectInternal(): Promise<void> {
  mongoose.set('strictQuery', true);

  const externalUri = env.MONGODB_URI?.trim();

  if (externalUri) {
    try {
      await mongoose.connect(externalUri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 2500,
      });
      dbReady = true;
      console.log('[DB] Connected to external MongoDB via Mongoose.');
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[DB] External MONGODB_URI unreachable (${message}). Falling back to embedded MongoDB...`
      );
      try {
        await mongoose.disconnect();
      } catch {
        // Ignore cleanup errors before fallback
      }
    }
  } else {
    console.log('[DB] MONGODB_URI not set. Starting embedded MongoDB instance...');
  }

  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'tactix_arena',
    },
  });
  const localUri = memoryServer.getUri();
  console.log('[DB] Embedded MongoDB started.');

  await mongoose.connect(localUri, {
    autoIndex: true,
  });

  dbReady = true;
  console.log('[DB] Connected to embedded MongoDB via Mongoose.');
}

export function ensureDatabaseConnected(): Promise<void> {
  if (!connectPromise) {
    connectPromise = connectInternal().catch((err) => {
      connectPromise = null;
      dbReady = false;
      throw err;
    });
  }
  return connectPromise;
}

export function isDatabaseReady(): boolean {
  return dbReady && mongoose.connection.readyState === 1;
}

export async function connectDatabase(): Promise<void> {
  await ensureDatabaseConnected();
}

export async function disconnectDatabase(): Promise<void> {
  dbReady = false;
  connectPromise = null;
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
