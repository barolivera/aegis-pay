import { NextResponse } from "next/server";
import { getTotalAssessments, getAssessment } from "../rpc";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const total = await getTotalAssessments();
    if (total === 0) return NextResponse.json({ assessments: [] });

    const count = Math.min(total, 5);
    const ids = [];
    for (let i = total - 1; i >= total - count; i--) ids.push(i);

    const results = await Promise.all(ids.map((id) => getAssessment(id).catch(() => null)));
    const assessments = results.filter((a) => a !== null);

    return NextResponse.json({ assessments });
  } catch {
    return NextResponse.json({ assessments: [] });
  }
}
