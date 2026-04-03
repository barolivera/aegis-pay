// Shared server-side RPC helper
const RPC = "https://testnet.hashio.io/api";
const AGENT_REGISTRY = "0xe0595502b10398D7702Ed43eDcf8101Fd67c0991";
const POLICY_MANAGER = "0x226F68C0D8F26A478F4F64d2733376DAB98Fcc6c";
const ASSESSMENT_REGISTRY = "0xeA86E74c8c89a30F6180B4d5c3d9C58C981d3638";

async function rpcCall(to: string, data: string): Promise<string> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "eth_call",
      params: [{ to, data }, "latest"],
    }),
  });
  const json = await res.json();
  return json.result || "0x";
}

function decodeString(data: string, offsetPos: number): string {
  const offset = parseInt(data.slice(offsetPos, offsetPos + 64), 16) * 2;
  const len = parseInt(data.slice(offset, offset + 64), 16);
  let str = "";
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(parseInt(data.slice(offset + 64 + i * 2, offset + 66 + i * 2), 16));
  }
  return str;
}

export interface Assessment {
  id: number;
  agent: string;
  target: string;
  riskScore: number;
  verdict: string;
  reason: string;
  timestamp: number;
}

export async function getAgentCount(): Promise<number> {
  const result = await rpcCall(AGENT_REGISTRY, "0xb7dc1284");
  return parseInt(result, 16) || 0;
}

export async function getTotalAssessments(): Promise<number> {
  const result = await rpcCall(ASSESSMENT_REGISTRY, "0x2b08c955");
  return parseInt(result, 16) || 0;
}

export async function getThresholds(): Promise<{ low: number; medium: number }> {
  const result = await rpcCall(POLICY_MANAGER, "0x9c3977b5");
  const data = result.slice(2);
  return {
    low: parseInt(data.slice(0, 64), 16),
    medium: parseInt(data.slice(64, 128), 16),
  };
}

export async function getVerdict(riskScore: number): Promise<string> {
  const param = riskScore.toString(16).padStart(64, "0");
  const result = await rpcCall(POLICY_MANAGER, "0x33f3e74b" + param);
  const data = result.slice(2);
  const offset = parseInt(data.slice(0, 64), 16) * 2;
  const len = parseInt(data.slice(offset, offset + 64), 16);
  let str = "";
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(parseInt(data.slice(offset + 64 + i * 2, offset + 66 + i * 2), 16));
  }
  return str;
}

export async function getAssessment(id: number): Promise<Assessment | null> {
  try {
    const param = id.toString(16).padStart(64, "0");
    const result = await rpcCall(ASSESSMENT_REGISTRY, "0xb8e51787" + param);
    if (!result || result === "0x") return null;

    const raw = result.slice(2);
    // Skip tuple offset (first 64 hex chars = 32 bytes pointing to 0x20)
    const data = raw.slice(64);
    return {
      id,
      agent: "0x" + data.slice(24, 64),
      target: "0x" + data.slice(88, 128),
      riskScore: parseInt(data.slice(128, 192), 16),
      verdict: decodeString(data, 192),
      reason: decodeString(data, 256),
      timestamp: parseInt(data.slice(320, 384), 16),
    };
  } catch {
    return null;
  }
}

export async function getRecentAssessments(max = 10): Promise<Assessment[]> {
  const total = await getTotalAssessments();
  if (total === 0) return [];

  const count = Math.min(total, max);
  const promises = [];
  for (let i = total - 1; i >= total - count; i--) {
    promises.push(getAssessment(i));
  }
  const results = await Promise.all(promises);
  return results.filter((a): a is Assessment => a !== null);
}
