import type { ProjectionPoint, TrendPoint } from "@/lib/groundwater/types";

type RegressionResult = {
  slope: number;
  intercept: number;
  stdErr: number; // standard error of estimate
};

function linearRegression(points: TrendPoint[]): RegressionResult {
  const n = points.length;
  const xs = points.map((p) => p.year);
  const ys = points.map((p) => p.stageOfExtractionPercent);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    num += dx * (ys[i] - meanY);
    den += dx * dx;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  // Standard error of estimate
  let seNum = 0;
  for (let i = 0; i < n; i++) {
    const yHat = intercept + slope * xs[i];
    seNum += (ys[i] - yHat) ** 2;
  }
  const variance = n > 2 ? seNum / (n - 2) : 0;
  const stdErr = Math.sqrt(variance);
  return { slope, intercept, stdErr };
}

export function computeLinearProjection(
  history: TrendPoint[],
  yearsAhead: number = 5
): ProjectionPoint[] {
  if (!history || history.length < 2) return [];
  const reg = linearRegression(history);
  const lastYear = Math.max(...history.map((p) => p.year));
  const projections: ProjectionPoint[] = [];
  for (let i = 1; i <= yearsAhead; i++) {
    const year = lastYear + i;
    const yHat = reg.intercept + reg.slope * year;
    const ci = 1.96 * reg.stdErr; // approx 95% CI
    projections.push({
      year,
      projectedStageOfExtractionPercent: Math.max(0, yHat),
      lowerCI: Math.max(0, yHat - ci),
      upperCI: Math.max(0, yHat + ci),
    });
  }
  return projections;
}


