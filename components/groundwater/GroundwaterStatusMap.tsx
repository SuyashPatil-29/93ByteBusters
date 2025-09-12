"use client";
import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import type { RegionalComparison } from "@/lib/groundwater/types";

type Props = {
  comparison: RegionalComparison; // expects state-level metrics
};

const INDIA_STATES_TOPOJSON =
  "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json";

const CATEGORY_COLOR: Record<string, string> = {
  Safe: "#16a34a",
  "Semi-Critical": "#f59e0b",
  Critical: "#ef4444",
  "Over-Exploited": "#7f1d1d",
};

export default function GroundwaterStatusMap({ comparison }: Props) {
  const categoryByState = useMemo(() => {
    const m = new Map<string, string>();
    for (const metric of comparison.metrics) {
      const stateName = (metric.region.name || "").toLowerCase();
      if (!stateName) continue;
      m.set(stateName, metric.category);
    }
    return m;
  }, [comparison]);

  return (
    <div className="w-full border rounded-lg p-4">
      <div className="text-sm font-medium mb-2">Groundwater Status Map (States)</div>
      <div style={{ width: "100%", height: 420 }}>
        <ComposableMap projection="geoMercator">
          <ZoomableGroup zoom={1.1} center={[80, 22]}>
            <Geographies geography={INDIA_STATES_TOPOJSON}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const name = (geo.properties?.ST_NM || "").toLowerCase();
                  const category = categoryByState.get(name);
                  const fill = category ? CATEGORY_COLOR[category] || "#9ca3af" : "#e5e7eb";
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", fill: "#60a5fa" },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        {Object.entries(CATEGORY_COLOR).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: v }} />
            <span>{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


