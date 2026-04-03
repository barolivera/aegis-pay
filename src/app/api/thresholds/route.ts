import { NextResponse } from "next/server";
import { getThresholds } from "../rpc";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const thresholds = await getThresholds();
    return NextResponse.json(thresholds);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
