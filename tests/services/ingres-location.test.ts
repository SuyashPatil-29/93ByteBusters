import { describe, it, expect, vi, beforeEach } from 'vitest';
import { INGRESLocationService, generateINGRESUrl, type LocationType } from '@/services/ingres-location';
import { prisma } from '@/lib/prisma';

let mockScrapeImpl: any;
vi.mock('@/services/firecrawl', () => {
  return {
    getFirecrawl: () => ({
      scrapeUrl: (...args: any[]) => mockScrapeImpl(...args),
    }),
  };
});

describe('INGRESLocationService', () => {
  beforeEach(() => {
    // reset prisma mocks
    (prisma.location.findFirst as any).mockReset?.();
    (prisma.location.findMany as any).mockReset?.();
    (prisma.location.findUnique as any).mockReset?.();
    (prisma.location.upsert as any).mockReset?.();
    mockScrapeImpl = vi.fn();
  });

  it('returns cached UUIDs from DB for state', async () => {
    (prisma.location.findFirst as any).mockResolvedValue({ id: 1, name: 'Karnataka', type: 'STATE', uuid: 'eaec6bbb-a219-415f-bdba-991c42586352' });
    const service = new INGRESLocationService(prisma as any);
    const res = await service.findLocationUUIDs('Karnataka', 'STATE');
    expect(res).toEqual({ locuuid: 'eaec6bbb-a219-415f-bdba-991c42586352', stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352' });
  });

  it('scrapes UUIDs when not in DB and upserts district with state', async () => {
    (prisma.location.findFirst as any).mockResolvedValue(null);
    mockScrapeImpl.mockResolvedValue({ html: 'locuuid=fc194628-dfa2-4026-b410-5535a5ceea8c stateuuid=eaec6bbb-a219-415f-bdba-991c42586352' });
    (prisma.location.upsert as any).mockResolvedValueOnce({ id: 10, uuid: 'eaec6bbb-a219-415f-bdba-991c42586352' });
    const service = new INGRESLocationService(prisma as any);
    const res = await service.findLocationUUIDs('Bengaluru (Urban)', 'DISTRICT');
    expect(res).toEqual({ locuuid: 'fc194628-dfa2-4026-b410-5535a5ceea8c', stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352' });
    expect(prisma.location.upsert).toHaveBeenCalled();
  });

  it('falls back to fuzzy match when scrape fails', async () => {
    (prisma.location.findFirst as any).mockResolvedValue(null);
    mockScrapeImpl.mockRejectedValue(new Error('fail'));
    (prisma.location.findMany as any).mockResolvedValue([
      { id: 2, name: 'Bengaluru (Urban)', type: 'DISTRICT', uuid: 'fc194628-dfa2-4026-b410-5535a5ceea8c', parentId: 99 },
    ]);
    (prisma.location.findUnique as any).mockResolvedValue({ id: 99, uuid: 'eaec6bbb-a219-415f-bdba-991c42586352' });
    const service = new INGRESLocationService(prisma as any);
    const res = await service.findLocationUUIDs('Bangalore Urban', 'DISTRICT');
    expect(res).toEqual({ locuuid: 'fc194628-dfa2-4026-b410-5535a5ceea8c', stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352' });
  });
});

describe('generateINGRESUrl', () => {
  it('builds correct URL with defaults and optional params', () => {
    const url = generateINGRESUrl(
      { locuuid: 'loc-uuid-1234-1234-1234-123456789012', stateuuid: 'state-uuid-1234-1234-1234-123456789012' } as any,
      { locationName: 'Karnataka', locationType: 'STATE' as LocationType, component: 'recharge', period: 'annual' }
    );
    expect(url).toContain('https://ingres.iith.ac.in/gecdataonline/gis/INDIA;');
    expect(url).toContain('locname=Karnataka');
    expect(url).toContain('loctype=STATE');
    expect(url).toContain('view=ADMIN');
    expect(url).toContain('year=2024-2025');
    expect(url).toContain('component=recharge');
    expect(url).toContain('period=annual');
  });
});


