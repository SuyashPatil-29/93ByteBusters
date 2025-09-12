"use client";
import { Card } from "./ui/card";

export function RegionalComparisonDashboard({
  a,
  b,
  metricName,
}: {
  a: { name: string; value: string | number };
  b: { name: string; value: string | number };
  metricName: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-lg font-semibold mb-2">Regional Comparison</div>
      <div className="text-sm text-zinc-500 mb-3">Metric: {metricName}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border rounded p-3">
          <div className="text-zinc-500 text-sm">{a.name}</div>
          <div className="text-xl font-semibold">{String(a.value)}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-zinc-500 text-sm">{b.name}</div>
          <div className="text-xl font-semibold">{String(b.value)}</div>
        </div>
      </div>
    </Card>
  );
}


