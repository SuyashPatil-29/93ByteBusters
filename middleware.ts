import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const config = {
  matcher: ['/api/ingres/:path*'],
};

export async function middleware(req: NextRequest) {
  try {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const key = `ratelimit:${ip}`;
    const limit = 60; // 60 requests
    const window = 60; // per 60s
    const current = (await kv.incr(key)) as number;
    if (current === 1) await kv.expire(key, window);
    if (current > limit) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  } catch {}

  return NextResponse.next();
}


