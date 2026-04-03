import { NextResponse } from "next/server";
import { getVerdict } from "../rpc";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const score = parseInt(searchParams.get("score") || "0");

  try {
    const verdict = await getVerdict(score);
    return NextResponse.json({ verdict });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
