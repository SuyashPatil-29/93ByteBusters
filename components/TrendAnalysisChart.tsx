"use client";
import { Card } from "./ui/card";

export function TrendAnalysisChart({ series }: { series: Array<{ date: string; value: number }> }) {
  return (
    <Card className="p-4">
      <div className="text-sm text-zinc-500">Trend analysis (placeholder)</div>
      <div className="mt-2 text-xs text-zinc-400">
        {series.slice(0, 6).map((p) => (
          <div key={p.date}>
            {p.date}: {p.value}
          </div>
        ))}
      </div>
    </Card>
  );
}


