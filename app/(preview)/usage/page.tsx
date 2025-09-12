"use client";
import React, { useEffect, useMemo, useState } from "react";

type Feedback = { ts: number; tool: string; vote: "up" | "down"; context?: string };

export default function UsagePage() {
  const [items, setItems] = useState<Feedback[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("gw_feedback");
      setItems(raw ? JSON.parse(raw) : []);
    } catch {}
  }, []);

  const summary = useMemo(() => {
    const map: Record<string, { up: number; down: number }> = {};
    for (const f of items) {
      map[f.tool] ||= { up: 0, down: 0 };
      map[f.tool][f.vote]++;
    }
    return map;
  }, [items]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">User Feedback (Local)</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {Object.entries(summary).map(([tool, v]) => (
          <div key={tool} className="border rounded p-4">
            <div className="font-medium">{tool}</div>
            <div className="text-sm text-zinc-600">👍 {v.up} • 👎 {v.down}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {items.map((f, i) => (
          <div key={i} className="border rounded p-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">{f.tool}</span>
              <span className="text-zinc-500">{new Date(f.ts).toLocaleString()}</span>
            </div>
            <div>Vote: {f.vote}</div>
            {f.context && <div className="text-zinc-600 mt-1">{f.context}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}


