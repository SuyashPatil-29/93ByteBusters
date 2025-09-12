"use client";
import { Card } from "./ui/card";

type CategoryDatum = { category: string; value: number };

export function CategoryDistributionChart({ data }: { data: CategoryDatum[] }) {
  return (
    <Card className="p-4">
      <div className="text-lg font-semibold mb-2">Category Distribution</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {data.map((d) => (
          <div key={d.category} className="flex items-center justify-between border rounded p-2 text-sm">
            <span className="text-zinc-500">{d.category}</span>
            <span className="font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}


