// Shared, guarded database helpers.
// Every script and seed imports this, so no script can silently connect elsewhere.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function assertLocalDatabaseUrl(raw = process.env.DATABASE_URL): string {
  if (!raw) throw new Error('DATABASE_URL is missing');
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL');
  }
  const ok =
    ['postgresql:', 'postgres:'].includes(url.protocol) &&
    ALLOWED_HOSTS.has(url.hostname) &&
    url.port === '5433' &&
    url.pathname === '/prisma_learn' &&
    (url.username === 'postgres' || url.username === 'prisma_app');
  if (!ok) {
    throw new Error(
      `REFUSING TO CONNECT: ${url.username}@${url.hostname}:${url.port}${url.pathname} is not the approved local learning database.`,
    );
  }
  return raw;
}

type CreatePrismaOptions = {
  logSql?: boolean;
  /** Emit query events without printing them. Useful for counting queries. */
  silent?: boolean;
  max?: number;
  connectionString?: string;
};

export function createPrisma(options: CreatePrismaOptions = {}) {
  const { logSql = true, silent = false, max, connectionString } = options;
  const url = assertLocalDatabaseUrl(connectionString ?? process.env.DATABASE_URL);
  const adapter = new PrismaPg({ connectionString: url, ...(max ? { max } : {}) });
  const emitQueries = logSql || silent;
  const client = new PrismaClient({
    adapter,
    log: emitQueries ? [{ emit: 'event', level: 'query' }] : [],
  });
  if (logSql && !silent) {
    client.$on('query', (event) => {
      console.log(`prisma:query ${event.query} -- params=${event.params}`);
    });
  }
  return client;
}

// Application-style singleton. Importing this twice in one process reuses it.
export const prisma = createPrisma({ logSql: false });
