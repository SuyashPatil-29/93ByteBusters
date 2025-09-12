"use client";
import React from "react";
import type { RegionalComparison } from "@/lib/groundwater/types";

type Props = { comparison: RegionalComparison };

export default function RegionalComparisonDashboard({ comparison }: Props) {
  return (
    <div className="w-full border rounded-lg p-4">
      <div className="text-sm text-zinc-600 mb-2">Regional Comparison</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {comparison.metrics.map((m, i) => (
          <div key={i} className="border rounded p-3 text-sm">
            <div className="font-medium">{m.region.name} ({m.level}) — {m.assessmentYear}</div>
            <div className="flex justify-between"><span>Stage</span><span>{m.stageOfExtractionPercent}%</span></div>
            <div className="flex justify-between"><span>Category</span><span>{m.category}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}


