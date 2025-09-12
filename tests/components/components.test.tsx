import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendAnalysisChart } from '@/components/TrendAnalysisChart';
import { GroundwaterStatusMap } from '@/components/GroundwaterStatusMap';

describe('TrendAnalysisChart', () => {
  it('renders provided series values', () => {
    render(<TrendAnalysisChart series={[{ date: '2024', value: 10 }, { date: '2025', value: 12 }]} />);
    expect(screen.getByText(/Trend analysis/i)).toBeInTheDocument();
    expect(screen.getByText('2024: 10')).toBeInTheDocument();
    expect(screen.getByText('2025: 12')).toBeInTheDocument();
  });
});

describe('GroundwaterStatusMap', () => {
  it('renders title', () => {
    render(<GroundwaterStatusMap />);
    expect(screen.getByText('Groundwater Status Map')).toBeInTheDocument();
  });
});


