import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGroundwaterStatus, parseLocationQuery, queryINGRES } from '@/services/ingres-api';
import { INGRESLocationService } from '@/services/ingres-location';

vi.mock('@/services/ingres-scraper', () => ({
  scrapeWithCache: vi.fn(async () => ({ html: 'Recharge: 123\nDepth: 45', markdown: '' })),
}));

describe('ingres-api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parseLocationQuery detects state names heuristically', async () => {
    expect(await parseLocationQuery('Karnataka')).toEqual({ locationName: 'Karnataka', locationType: 'STATE' });
    expect(await parseLocationQuery('Bengaluru Urban')).toEqual({ locationName: 'Bengaluru Urban', locationType: 'DISTRICT' });
  });

  it('getGroundwaterStatus uses location service and scraper', async () => {
    const spy = vi.spyOn(INGRESLocationService.prototype, 'findLocationUUIDs').mockResolvedValue({
      locuuid: 'fc194628-dfa2-4026-b410-5535a5ceea8c',
      stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
    });
    const result = await getGroundwaterStatus({ locationQuery: 'Bengaluru Urban' });
    expect(spy).toHaveBeenCalled();
    expect(result.locationName).toBe('Bengaluru Urban');
    expect(result.metrics['Recharge']).toBe('123');
    expect(result.sourceUrl).toContain('locuuid=');
  });

  it('queryINGRES returns url and scraped data', async () => {
    const spy = vi.spyOn(INGRESLocationService.prototype, 'findLocationUUIDs').mockResolvedValue({
      locuuid: 'fc194628-dfa2-4026-b410-5535a5ceea8c',
      stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
    });
    const result = await queryINGRES({ locationName: 'Karnataka', locationType: 'STATE', component: 'recharge' });
    expect(spy).toHaveBeenCalled();
    expect(result.url).toContain('component=recharge');
    expect(result.scraped.html).toContain('Recharge');
  });
});


