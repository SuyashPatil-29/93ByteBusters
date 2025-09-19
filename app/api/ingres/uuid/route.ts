import { NextRequest } from "next/server";
import { INGRESLocationService } from "@/services/ingres-location";

// Set maximum execution time to 59 seconds
export const maxDuration = 59;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const type = searchParams.get("type") as any;
  if (!name || !type) {
    return new Response(JSON.stringify({ error: "Missing name or type" }), { status: 400 });
  }
  const service = new INGRESLocationService();
  const result = await service.findLocationUUIDs(name, type);
  if (!result) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  return new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } });
}


