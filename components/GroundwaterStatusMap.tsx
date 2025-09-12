"use client";
import { Card } from "./ui/card";

export function GroundwaterStatusMap({
  title = "Groundwater Status Map",
}: {
  title?: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-lg font-semibold mb-2">{title}</div>
      <div className="text-sm text-zinc-500">
        Map placeholder. Integrate D3/Leaflet with INGRES overlays in next pass.
      </div>
    </Card>
  );
}


