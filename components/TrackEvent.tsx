"use client";
import { useEffect } from "react";
import { track } from "@vercel/analytics";

export default function TrackEvent({ name, props }: { name: string; props?: Record<string, any> }) {
  useEffect(() => {
    try {
      track(name, props || {});
    } catch {}
  }, [name]);
  return null;
}


