"use client";
import React, { useState } from "react";

type Props = { tool: string; context?: string };

export default function FeedbackBar({ tool, context }: Props) {
  const [voted, setVoted] = useState<null | "up" | "down">(null);

  const save = (val: "up" | "down") => {
    try {
      const key = "gw_feedback";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.unshift({ ts: Date.now(), tool, vote: val, context: context?.slice(0, 200) });
      localStorage.setItem(key, JSON.stringify(prev.slice(0, 200)));
      setVoted(val);
    } catch {}
  };

  return (
    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-3">
      <span>Was this helpful?</span>
      <button
        onClick={() => save("up")}
        className={`px-2 py-1 rounded border ${voted === "up" ? "bg-green-50 border-green-300" : "border-zinc-200"}`}
      >
        Yes
      </button>
      <button
        onClick={() => save("down")}
        className={`px-2 py-1 rounded border ${voted === "down" ? "bg-red-50 border-red-300" : "border-zinc-200"}`}
      >
        No
      </button>
    </div>
  );
}


