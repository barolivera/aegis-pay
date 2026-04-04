/**
 * Deploy the 3 AegisPay contracts to local Anvil and save addresses.
 * Run: npm run deploy-local (with Anvil running on port 8545)
 */
import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../..");

// Anvil default account #0
const ANVIL_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const;

const anvil = defineChain({
  id: 31337,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
});

function loadArtifact(name: string) {
  const path = resolve(rootDir, `out/${name}.sol/${name}.json`);
  const json = JSON.parse(readFileSync(path, "utf-8"));
  return { abi: json.abi, bytecode: json.bytecode.object as `0x${string}` };
}

async function main() {
  const account = privateKeyToAccount(ANVIL_KEY);

  const wallet = createWalletClient({ account, chain: anvil, transport: http() });
  const pub = createPublicClient({ chain: anvil, transport: http() });

  console.log("Deploying from:", account.address);

  // 1. AgentRegistry
  const agentReg = loadArtifact("AgentRegistry");
  const agentRegHash = await wallet.deployContract({
    abi: agentReg.abi,
    bytecode: agentReg.bytecode,
  });
  const agentRegReceipt = await pub.waitForTransactionReceipt({ hash: agentRegHash });
  console.log("AgentRegistry:", agentRegReceipt.contractAddress);

  // 2. PolicyManager
  const policyMgr = loadArtifact("PolicyManager");
  const policyHash = await wallet.deployContract({
    abi: policyMgr.abi,
    bytecode: policyMgr.bytecode,
  });
  const policyReceipt = await pub.waitForTransactionReceipt({ hash: policyHash });
  console.log("PolicyManager:", policyReceipt.contractAddress);

  // 3. AssessmentRegistry (needs AgentRegistry address)
  const assessReg = loadArtifact("AssessmentRegistry");
  const assessHash = await wallet.deployContract({
    abi: assessReg.abi,
    bytecode: assessReg.bytecode,
    args: [agentRegReceipt.contractAddress!],
  });
  const assessReceipt = await pub.waitForTransactionReceipt({ hash: assessHash });
  console.log("AssessmentRegistry:", assessReceipt.contractAddress);

  // Save addresses
  const addresses = {
    agentRegistry: agentRegReceipt.contractAddress,
    policyManager: policyReceipt.contractAddress,
    assessmentRegistry: assessReceipt.contractAddress,
  };

  const outPath = resolve(__dirname, "addresses.json");
  writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("\nAddresses saved to agent/src/addresses.json");
}

main().catch(console.error);
