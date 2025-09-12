import { kv } from '@vercel/kv';

export async function incrMetric(name: string) {
  try {
    await kv.incr(`metrics:${name}`);
  } catch {}
}


