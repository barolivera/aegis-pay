/**
 * AegisPay Autonomous Agent
 *
 * Picks a random mission, evaluates risk on-chain via PolicyManager,
 * executes or blocks the transfer, and records the assessment.
 * All contract calls are real — nothing simulated.
 *
 * NETWORK=local  → Anvil (default)
 * NETWORK=hedera → Hedera Testnet via JSON-RPC relay
 */
import {
  createWalletClient,
  createPublicClient,
  http,
  defineChain,
  parseEther,
  formatEther,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../..");

// ── Chains ──────────────────────────────────────────────────────

const anvil: Chain = defineChain({
  id: 31337,
  name: "Anvil Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
});

const hederaTestnet: Chain = defineChain({
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet.hashio.io/api"] } },
});

// ── Config ──────────────────────────────────────────────────────

const NETWORK = process.env.NETWORK || "local";
const chain = NETWORK === "hedera" ? hederaTestnet : anvil;

// Local default = Anvil account #1. Override via .env for Hedera.
const ANVIL_AGENT_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const AGENT_KEY = (process.env.AGENT_PRIVATE_KEY || ANVIL_AGENT_KEY) as `0x${string}`;

// ── Missions ────────────────────────────────────────────────────

interface Mission {
  name: string;
  target: `0x${string}`;
  amount: string;
  context: string;
}

// Local targets = Anvil accounts. For Hedera, set TARGET_ADDRESS in .env.
const TARGET_HEDERA = (process.env.TARGET_ADDRESS || "0x81154491ca6d5d0441cff77c4ad025ddc703c9d5") as `0x${string}`;

const LOCAL_MISSIONS: Mission[] = [
  {
    name: "Pay data feed provider",
    target: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    amount: "0.25",
    context: "Monthly data subscription, known provider",
  },
  {
    name: "Pay API oracle service",
    target: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    amount: "1.5",
    context: "One-time pricing query, medium amount",
  },
  {
    name: "Pay unknown contractor",
    target: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    amount: "12",
    context: "Large payment to first-time address",
  },
  {
    name: "Transfer to burn address",
    target: "0x000000000000000000000000000000000000dEaD",
    amount: "0.1",
    context: "Token burn request from external service",
  },
];

const HEDERA_MISSIONS: Mission[] = [
  {
    name: "Pay data feed provider",
    target: TARGET_HEDERA,
    amount: "5",
    context: "Monthly data subscription, known provider",
  },
  {
    name: "Pay API oracle service",
    target: TARGET_HEDERA,
    amount: "20",
    context: "One-time pricing query, medium amount",
  },
  {
    name: "Pay unknown contractor",
    target: TARGET_HEDERA,
    amount: "150",
    context: "Large payment to first-time address",
  },
  {
    name: "Transfer to suspicious address",
    target: "0x000000000000000000000000000000000000dEaD",
    amount: "1",
    context: "Token burn request from external service",
  },
];

const MISSIONS = NETWORK === "hedera" ? HEDERA_MISSIONS : LOCAL_MISSIONS;

// ── Helpers ──────────────────────────────────────────────────────

function loadAbi(name: string) {
  const path = resolve(rootDir, `out/${name}.sol/${name}.json`);
  if (!existsSync(path)) {
    throw new Error(`ABI not found: ${path}. Run 'forge build' first.`);
  }
  return JSON.parse(readFileSync(path, "utf-8")).abi;
}

function loadAddresses() {
  const file = NETWORK === "hedera" ? "addresses-hedera.json" : "addresses.json";
  const path = resolve(__dirname, file);
  if (!existsSync(path)) {
    throw new Error(`${file} not found. Deploy contracts first.`);
  }
  return JSON.parse(readFileSync(path, "utf-8"));
}

function log(step: string, msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [${step}] ${msg}`);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Risk engine ─────────────────────────────────────────────────

const RISKY_ADDRESSES = new Set([
  "0x000000000000000000000000000000000000dead",
  "0x0000000000000000000000000000000000000000",
]);

const TRUSTED_ADDRESSES = new Set([
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", // Anvil #2
  TARGET_HEDERA.toLowerCase(),                     // Hedera target
]);

function computeRiskScore(target: string, amount: number, isFirstInteraction: boolean): number {
  let score = 0;
  const addr = target.toLowerCase();

  if (RISKY_ADDRESSES.has(addr)) score += 60;
  if (TRUSTED_ADDRESSES.has(addr)) score -= 10;

  if (amount > 10) score += 35;
  else if (amount > 1) score += 15;
  else score += 5;

  if (isFirstInteraction) score += 15;

  return Math.max(0, Math.min(score, 100));
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const agentAccount = privateKeyToAccount(AGENT_KEY);
  const wallet = createWalletClient({ account: agentAccount, chain, transport: http() });
  const pub = createPublicClient({ chain, transport: http() });

  const addrs = loadAddresses();
  const agentRegistryAbi = loadAbi("AgentRegistry");
  const policyManagerAbi = loadAbi("PolicyManager");
  const assessmentRegistryAbi = loadAbi("AssessmentRegistry");

  const agentAddr = agentAccount.address;
  const coin = chain.nativeCurrency.symbol;

  console.log("\n====================================");
  console.log("  AegisPay Autonomous Agent");
  console.log("====================================");
  log("INIT", `Network: ${chain.name}`);
  log("INIT", `Agent:   ${agentAddr}`);

  const startBal = await pub.getBalance({ address: agentAddr });
  log("INIT", `Balance: ${formatEther(startBal)} ${coin}`);
  console.log("");

  // ── Register agent (once) ──
  try {
    const existing = await pub.readContract({
      address: addrs.agentRegistry,
      abi: agentRegistryAbi,
      functionName: "getAgent",
      args: [agentAddr],
    }) as any;

    if (existing.registeredAt === 0n) {
      log("REGISTER", "Registering agent on-chain...");
      const hash = await wallet.writeContract({
        address: addrs.agentRegistry,
        abi: agentRegistryAbi,
        functionName: "registerAgent",
        args: [agentAddr, "ipfs://aegispay-autonomous-agent-v2"],
      });
      await pub.waitForTransactionReceipt({ hash });
      log("REGISTER", "Agent registered on-chain");
    } else {
      log("REGISTER", "Already registered");
    }
  } catch (err: any) {
    log("REGISTER", `FATAL: ${err.shortMessage || err.message}`);
    process.exit(1);
  }

  // ── Pick a random mission ──
  const mission = pickRandom(MISSIONS);
  const amount = parseFloat(mission.amount);

  console.log(`\n-- Mission: ${mission.name} --`);
  log("MISSION", `Target:  ${mission.target}`);
  log("MISSION", `Amount:  ${mission.amount} ${coin}`);
  log("MISSION", `Context: ${mission.context}`);

  // ── Risk score ──
  const isFirstInteraction = true; // simplified for demo
  const riskScore = computeRiskScore(mission.target, amount, isFirstInteraction);
  log("RISK", `Score: ${riskScore}/100`);

  // ── Policy verdict (on-chain) ──
  let verdict: string;
  try {
    verdict = await pub.readContract({
      address: addrs.policyManager,
      abi: policyManagerAbi,
      functionName: "getVerdict",
      args: [BigInt(riskScore)],
    }) as string;
    log("POLICY", `Verdict: ${verdict}`);
  } catch (err: any) {
    log("POLICY", `ERROR: ${err.shortMessage || err.message}`);
    process.exit(1);
  }

  // ── Execute or block ──
  let txHash = "";
  if (verdict === "ALLOW") {
    try {
      log("TRANSFER", `Sending ${mission.amount} ${coin}...`);
      const hash = await wallet.sendTransaction({
        to: mission.target,
        value: parseEther(mission.amount),
      });
      const receipt = await pub.waitForTransactionReceipt({ hash });
      txHash = hash;
      log("TRANSFER", `Success: ${hash}`);
      log("TRANSFER", `Status:  ${receipt.status}`);
    } catch (err: any) {
      log("TRANSFER", `FAILED: ${err.shortMessage || err.message}`);
    }
  } else if (verdict === "WARN") {
    log("TRANSFER", "Requires human approval — paused");
  } else {
    log("TRANSFER", "BLOCKED — transfer cancelled by policy");
  }

  // ── Record assessment on-chain (always) ──
  const reason = [
    mission.name,
    `| score=${riskScore}`,
    `| amount=${mission.amount} ${coin}`,
    `| ${isFirstInteraction ? "first-interaction" : "known-target"}`,
    txHash ? `| tx=${txHash.slice(0, 18)}...` : "| no-transfer",
  ].join(" ");

  try {
    log("ASSESS", "Recording assessment on-chain...");
    const hash = await wallet.writeContract({
      address: addrs.assessmentRegistry,
      abi: assessmentRegistryAbi,
      functionName: "createAssessment",
      args: [agentAddr, mission.target, BigInt(riskScore), verdict, reason],
    });
    await pub.waitForTransactionReceipt({ hash });

    const total = await pub.readContract({
      address: addrs.assessmentRegistry,
      abi: assessmentRegistryAbi,
      functionName: "totalAssessments",
    }) as bigint;

    log("ASSESS", `Assessment #${total - 1n} recorded on-chain`);
  } catch (err: any) {
    log("ASSESS", `ERROR: ${err.shortMessage || err.message}`);
  }

  // ── Summary ──
  const endBal = await pub.getBalance({ address: agentAddr });

  console.log("\n====================================");
  console.log("  Result");
  console.log("====================================");
  console.log(`  Mission:  ${mission.name}`);
  console.log(`  Score:    ${riskScore}/100`);
  console.log(`  Verdict:  ${verdict}`);
  console.log(`  Transfer: ${txHash ? "Executed" : "Not executed"}`);
  console.log(`  Balance:  ${formatEther(endBal)} ${coin}`);
  console.log("====================================\n");
}

main().catch((err) => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
