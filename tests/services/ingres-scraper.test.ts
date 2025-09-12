import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapeWithCache } from '@/services/ingres-scraper';
import { prisma } from '@/lib/prisma';
import { kv } from '@vercel/kv';

let mockScrapeImpl: any;
vi.mock('@/services/firecrawl', () => {
  return {
    getFirecrawl: () => ({
      scrapeUrl: (...args: any[]) => mockScrapeImpl(...args),
    }),
  };
});

describe('scrapeWithCache', () => {
  beforeEach(() => {
    mockScrapeImpl = vi.fn();
    (prisma.scrapeCache.findUnique as any).mockReset?.();
    (prisma.scrapeCache.upsert as any).mockReset?.();
    (kv.get as any).mockReset?.();
    (kv.set as any).mockReset?.();
    (kv.expire as any).mockReset?.();
  });

  it('scrapes and writes to KV and Prisma when cache miss', async () => {
    (kv.get as any).mockResolvedValue(null);
    (prisma.scrapeCache.findUnique as any).mockResolvedValue(null);
    mockScrapeImpl.mockResolvedValue({ html: '<div>ok</div>', markdown: '' });

    const result = await scrapeWithCache('https://example.com/x', { formats: ['html', 'markdown'] });

    expect(result.html).toContain('ok');
    expect(kv.set).toHaveBeenCalled();
    expect(prisma.scrapeCache.upsert).toHaveBeenCalled();
  });

  it('returns KV cached content on subsequent call without scraping again', async () => {
    // First call populates KV
    (kv.get as any).mockResolvedValue(null);
    (prisma.scrapeCache.findUnique as any).mockResolvedValue(null);
    mockScrapeImpl.mockResolvedValue({ html: '<div>ok</div>', markdown: '' });
    await scrapeWithCache('https://example.com/y');

    // KV hit
    const kvValue = (kv.set as any).mock.calls[0]?.[1];
    (kv.get as any).mockResolvedValue(kvValue);

    const result2 = await scrapeWithCache('https://example.com/y');
    expect(result2.html).toContain('ok');
    expect(mockScrapeImpl).toHaveBeenCalledTimes(1);
  });
});


