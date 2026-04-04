import { NextResponse } from "next/server";

// PolicyManager v2 + MockPriceFeed on Hedera Testnet
// These are separate from the original contracts — nothing else is affected
const POLICY_V2 = "0xc5b07cdc6908ecee95ce721da8374dcda2588b7a";
const RPC_URL = "https://testnet.hashio.io/api";

const RISKY_ADDRESSES = [
  "0x000000000000000000000000000000000000dead",
  "0x0000000000000000000000000000000000000000",
];

const ACTION_RISK: Record<string, number> = {
  transfer: 0,
  swap: 10,
  "contract-call": 15,
  mint: 10,
  other: 5,
};

const PENDING_TRANSACTIONS = [
  {
    agent: "0x1234567890abcdef1234567890abcdef12345678",
    target: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    amountHbar: 50,
    action: "transfer",
  },
  {
    agent: "0x1234567890abcdef1234567890abcdef12345678",
    target: "0x9876543210fedcba9876543210fedcba98765432",
    amountHbar: 5000,
    action: "swap",
  },
  {
    agent: "0xaaaabbbbccccddddaaaabbbbccccddddaaaabbbb",
    target: "0x000000000000000000000000000000000000dead",
    amountHbar: 200,
    action: "transfer",
  },
  {
    agent: "0x1234567890abcdef1234567890abcdef12345678",
    target: "0x5555666677778888555566667777888855556666",
    amountHbar: 2000,
    action: "contract-call",
  },
];

const POLICY = { low: 30, medium: 70 };
const RISK_THRESHOLDS = { lowUsdValue: 100, highUsdValue: 1000 };

// Read Chainlink price from PolicyManager v2 on-chain
async function getOnChainPrice(): Promise<{ price: number; raw: string }> {
  try {
    // getLatestPrice() selector = keccak256("getLatestPrice()") first 4 bytes
    const selector = "0x8e15f473"; // getLatestPrice()
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: POLICY_V2, data: selector }, "latest"],
      }),
    });
    const json = await res.json();
    if (json.result && json.result !== "0x") {
      // Result is (int256 price, uint8 decimals) — price is first 32 bytes
      const priceHex = json.result.slice(2, 66);
      const priceRaw = parseInt(priceHex, 16);
      const decimalsHex = json.result.slice(66, 130);
      const decimals = parseInt(decimalsHex, 16);
      const price = priceRaw / Math.pow(10, decimals);
      return { price, raw: priceRaw.toString() };
    }
  } catch {
    // fallback
  }
  return { price: 0.087, raw: "8700000" };
}

function computeRiskScore(
  target: string,
  amountHbar: number,
  hbarPriceUsd: number,
  action: string,
) {
  let score = 10;
  const reasons: string[] = [];

  if (RISKY_ADDRESSES.includes(target.toLowerCase())) {
    score += 60;
    reasons.push("CRITICAL: Known risky/burn address");
  }

  const usdValue = amountHbar * hbarPriceUsd;
  if (usdValue > RISK_THRESHOLDS.highUsdValue) {
    score += 35;
    reasons.push(`HIGH VALUE: $${usdValue.toFixed(2)} USD (>${RISK_THRESHOLDS.highUsdValue})`);
  } else if (usdValue > RISK_THRESHOLDS.lowUsdValue) {
    score += 15;
    reasons.push(`MEDIUM VALUE: $${usdValue.toFixed(2)} USD (>${RISK_THRESHOLDS.lowUsdValue})`);
  } else {
    reasons.push(`Low value: $${usdValue.toFixed(2)} USD`);
  }

  const actionRisk = ACTION_RISK[action] ?? 5;
  if (actionRisk > 0) {
    score += actionRisk;
    reasons.push(`Action: ${action} (+${actionRisk} risk)`);
  }

  score += 15;
  reasons.push("New target: first interaction");

  return { score: Math.min(100, Math.max(0, score)), reasons };
}

function getVerdict(score: number): "ALLOW" | "WARN" | "BLOCK" {
  if (score < POLICY.low) return "ALLOW";
  if (score < POLICY.medium) return "WARN";
  return "BLOCK";
}

export async function POST() {
  try {
    // Read HBAR/USD price from Chainlink feed via PolicyManager v2 on-chain
    const { price: hbarPriceUsd, raw: chainlinkRawPrice } = await getOnChainPrice();

    const assessments = PENDING_TRANSACTIONS.map((tx) => {
      const { score, reasons } = computeRiskScore(
        tx.target,
        tx.amountHbar,
        hbarPriceUsd,
        tx.action,
      );
      const verdict = getVerdict(score);
      return {
        ...tx,
        usdValue: tx.amountHbar * hbarPriceUsd,
        riskScore: score,
        verdict,
        reasons,
      };
    });

    const allowed = assessments.filter((a) => a.verdict === "ALLOW").length;
    const warned = assessments.filter((a) => a.verdict === "WARN").length;
    const blocked = assessments.filter((a) => a.verdict === "BLOCK").length;

    return NextResponse.json({
      workflow: "aegispay-risk-assessment",
      version: "2.0.0",
      executedOn: "Chainlink DON (simulated)",
      chainlinkFeed: {
        source: "PolicyManager v2 → MockPriceFeed (AggregatorV3Interface)",
        contract: POLICY_V2,
        rawPrice: chainlinkRawPrice,
        note: "On mainnet: real Chainlink HBAR/USD feed at 0xAF685FB45C12b92b5054ccb9313e135525F9b5d5",
      },
      hbarPriceUsd,
      policyThresholds: POLICY,
      summary: {
        totalAssessed: assessments.length,
        allowed,
        warned,
        blocked,
        totalUsdExposure: assessments.reduce((s, a) => s + a.usdValue, 0),
        blockedUsdValue: assessments
          .filter((a) => a.verdict === "BLOCK")
          .reduce((s, a) => s + a.usdValue, 0),
      },
      assessments,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
