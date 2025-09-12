"use client";
import React, { useMemo } from "react";
import type { RegionalComparison } from "@/lib/groundwater/types";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

type Props = { comparison: RegionalComparison };

const COLORS = {
  Safe: "#16a34a",
  "Semi-Critical": "#f59e0b",
  Critical: "#ef4444",
  "Over-Exploited": "#7f1d1d",
};

export default function CategoryDistributionChart({ comparison }: Props) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of comparison.metrics) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [comparison]);

  return (
    <div className="w-full border rounded-lg p-4">
      <div className="text-sm font-medium mb-2">Category Distribution</div>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name] || "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


