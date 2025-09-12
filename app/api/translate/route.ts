import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/services/translation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, targetLang, preserveTerms } = body || {};
    if (!text || !targetLang) {
      return NextResponse.json({ error: "Missing text or targetLang" }, { status: 400 });
    }
    const translated = await translateText({ text, targetLang, preserveTerms });
    return NextResponse.json({ translated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Translation failed" }, { status: 500 });
  }
}


