"use client";
import React from "react";
import type { TrendAnalysis } from "@/lib/groundwater/types";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area } from "recharts";

type Props = { trend: TrendAnalysis };

export default function TrendAnalysisChart({ trend }: Props) {
  const data = trend.history.map((p) => ({ year: p.year, stage: p.stageOfExtractionPercent }));
  const projections = (trend.projections || []).map((p) => ({
    year: p.year,
    proj: p.projectedStageOfExtractionPercent,
    lower: p.lowerCI,
    upper: p.upperCI,
  }));

  const combined = [
    ...data,
    ...projections.map((p) => ({ year: p.year, stage: undefined, proj: p.proj, lower: p.lower, upper: p.upper })),
  ];

  return (
    <div className="w-full border rounded-lg p-4">
      <div className="text-sm font-medium mb-2">Stage of Extraction Trend — {trend.region.name}</div>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={combined} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis unit="%" tick={{ fontSize: 12 }} domain={[0, 200]} />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Line type="monotone" dataKey="stage" stroke="#2563eb" strokeWidth={2} dot={false} />
            {projections.length > 0 && (
              <>
                <Area type="monotone" dataKey="upper" stroke="none" fill="#93c5fd" fillOpacity={0.2} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="#93c5fd" fillOpacity={0.2} />
                <Line type="monotone" dataKey="proj" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


