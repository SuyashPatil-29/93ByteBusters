import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Prisma client module with test doubles
vi.mock('@/lib/prisma', () => {
  const prisma = {
    location: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    scrapeCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  } as any;
  return { prisma };
});

// Simple in-memory KV mock
vi.mock('@vercel/kv', () => {
  const store = new Map<string, any>();
  return {
    kv: {
      get: vi.fn(async (key: string) => store.get(key)),
      set: vi.fn(async (key: string, value: any) => { store.set(key, value); }),
      expire: vi.fn(async (_key: string, _seconds: number) => {}),
      incr: vi.fn(async (key: string) => {
        const current = Number(store.get(key) ?? 0);
        const next = current + 1;
        store.set(key, next);
        return next;
      }),
    },
  };
});


