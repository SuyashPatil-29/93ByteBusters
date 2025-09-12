import { NextRequest } from "next/server";
import { queryINGRES } from "@/services/ingres-api";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const result = await queryINGRES(body);
    return new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { "content-type": "application/json" } });
  }
}


