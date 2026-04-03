import { NextResponse } from "next/server";
import { getAgentCount, getTotalAssessments } from "../rpc";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [agentCount, total] = await Promise.all([
      getAgentCount(),
      getTotalAssessments(),
    ]);

    return NextResponse.json({ agentCount, total, blocked: 0, avgScore: 0, recent: [] });
  } catch (e: any) {
    return NextResponse.json({ agentCount: 0, total: 0, blocked: 0, avgScore: 0, recent: [] });
  }
}
