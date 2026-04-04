# AegisPay — Trust Layer for Autonomous AI Agents

<p align="center">
  <img src="https://img.shields.io/badge/ETHGlobal-Cannes%202026-blue?style=for-the-badge" alt="ETHGlobal Cannes 2026"/>
  <img src="https://img.shields.io/badge/Chain-Hedera%20Testnet-7F55E0?style=for-the-badge" alt="Hedera Testnet"/>
  <img src="https://img.shields.io/badge/Tests-23%2F23%20Passing-brightgreen?style=for-the-badge" alt="23/23 tests passing"/>
  <img src="https://img.shields.io/badge/Contracts-3%20Deployed-orange?style=for-the-badge" alt="3 contracts deployed"/>
</p>

> **The firewall for autonomous AI agents.** Before any agent moves funds, AegisPay scores the risk, enforces policy on-chain, and either auto-approves, routes to Ledger for human sign-off, or hard-blocks the transaction — leaving an immutable audit trail every time.

---

## 🚨 The Problem — $200B at Stake

AI agents are moving money today. By 2026, autonomous agents manage wallets, pay APIs, swap tokens, and call contracts — **without asking permission.**

- **No risk layer**: Agents can drain wallets by interacting with malicious contracts
- **No accountability**: Zero on-chain record of why a payment was made or stopped
- **No human override**: When an agent misbehaves, there is no kill switch

> *"The question is not whether AI agents will make financial mistakes — it's whether there's a system to catch them."*

**Without AegisPay:** The agent executes blindly — no risk check, no audit trail, no way to stop it.

**With AegisPay:** Every payment goes through a 3-step pipeline:

```
  Risk Engine          Policy Manager         Execution
 ┌────────────┐      ┌────────────────┐      ┌──────────────────────┐
 │ Score 0-100│ ──── │ ALLOW  < 30    │ ──── │ ✅ ALLOW: auto-send   │
 │            │      │ WARN   30-69   │      │ ⚠️  WARN: Ledger HW   │
 │ - amount   │      │ BLOCK  >= 70   │      │ 🚫 BLOCK: hard stop   │
 │ - address  │      │                │      │                       │
 │ - price USD│      │ Chainlink feed │      │ All recorded on-chain │
 │ - action   │      │ on-chain       │      │ immutable audit trail │
 └────────────┘      └────────────────┘      └────────────────────── ┘
```

---

## 🎮 Live Demo

| Resource | Link |
|----------|------|
| 🌐 Frontend (Hedera Testnet) | Deploy `npm run dev` → connect Hedera Testnet (Chain 296) |
| 🤖 Autonomous Agent | `cd agent && npm run agent` |
| ⛓️ AgentRegistry on HashScan | [View](https://hashscan.io/testnet/contract/0xe0595502b10398D7702Ed43eDcf8101Fd67c0991) |
| ⛓️ PolicyManager v2 on HashScan | [View](https://hashscan.io/testnet/contract/0xc5b07cdc6908ecee95ce721da8374dcda2588b7a) |
| ⛓️ AssessmentRegistry on HashScan | [View](https://hashscan.io/testnet/contract/0xeA86E74c8c89a30F6180B4d5c3d9C58C981d3638) |
| 🔗 State Change TX (Chainlink) | [0x8b8b8a6b...](https://hashscan.io/testnet/transaction/0x8b8b8a6bd87bfa28f2d7240f85920d0ed705cd19cc6d746e6cabc2b5423b2971) |

---

## 🏆 Sponsor Integrations at a Glance

| Sponsor | Integration | Status |
|---------|-------------|--------|
| **Hedera** | 3 contracts on Hedera EVM + Agent Kit SDK | ✅ Live on testnet |
| **Chainlink CRE** | DON workflow: HTTP → consensus → verdict | ✅ Simulation passing |
| **Chainlink Price Feed** | `AggregatorV3Interface` on-chain risk adjustment | ✅ State change TX verified |
| **Ledger** | Hardware wallet approval for WARN verdicts (ERC-7730) | ✅ Clear Signing JSONs |
| **ENS** | Agent operator identity via `useEnsName` + `useEnsAvatar` | ✅ Live in UI |

---

## 💡 Business Model

AegisPay is infrastructure — not just a hackathon demo. Here's how it becomes a business:

```
 ┌─────────────────────────────────────────────────────────────┐
 │                    WHO NEEDS AEGISPAY?                       │
 │                                                              │
 │  AI Agent Platforms   →  embed risk layer in their SDK       │
 │  DeFi Protocols       →  protect against rogue agents        │
 │  Enterprise AI Teams  →  compliance + audit trail            │
 │  Insurance Protocols  →  pricing risk based on score history │
 └─────────────────────────────────────────────────────────────┘
           │
           ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                  REVENUE STREAMS                             │
 │                                                              │
 │  • Per-assessment fee (micro-payment per scored TX)          │
 │  • SaaS policy management (enterprise risk rules)            │
 │  • Insurance data feed (risk score history on-chain)         │
 │  • White-label SDK for agent platforms                       │
 └─────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
┌────────────────────────────────────────────────────────────────── ┐
│  FRONTEND  (Next.js 14 + wagmi + viem)                            │
│                                                                   │
│  /dashboard    /simulate    /agents    /policy    /history        │
│  live stats    risk assess  register   set rules  audit trail     │
│                                                                   │
│  /workflow  ←── Chainlink CRE integration page                    │
│  run DON        shows on-chain price + verdicts                   │
│  simulation     reads from PolicyManager v2                       │
└───────────┬───────────────────────────────────────┬────────────── ┘
            │                                       │
            │  wagmi / JSON-RPC                     │  fetch /api/cre-simulate
            ▼                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  HEDERA TESTNET  (Chain 296)                                      │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │ AgentRegistry   │  │ PolicyManager   │  │ AssessmentRegistry│  │
│  │                 │  │                 │  │                  │   │
│  │ registerAgent() │  │ getVerdict()    │  │ createAssessment()│  │
│  │ toggleAgent()   │  │ setPolicy()     │  │ getAssessment()  │   │
│  │ ERC-8004 pattern│  │ getThresholds() │  │ audit trail      │   │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │ PolicyManager v2              MockPriceFeed              │     │
│  │ (Chainlink integration)       (AggregatorV3Interface)    │     │
│  │                                                          │     │ 
│  │ getVerdictWithPrice()  ◄────  latestRoundData()          │     │
│  │ reads price on-chain          returns HBAR/USD           │     │
│  │ adjusts risk score            $0.087 (8 decimals)        │     │
│  │ emits PriceAwareVerdict                                  │     │
│  └──────────────────────────────────────────────────────────┘     │
└───────┬──────────────────────────────────┬───────────────────────┘
        │                                  │
        ▼                                  ▼
┌────────────────────┐          ┌─────────────────────────────────┐
│  AUTONOMOUS AGENT  │          │  CHAINLINK CRE WORKFLOW         │
│  (TypeScript)      │          │  (Decentralized Oracle Network) │
│                    │          │                                 │
│  1. Pick mission   │          │  1. Cron trigger (every 1 min)  │
│  2. Compute risk   │          │  2. HTTP: fetch HBAR/USD price  │
│  3. Query policy   │──────┐   │  3. DON consensus on price      │
│  4. Execute or     │      │   │  4. Score each pending TX       │
│     wait for       │      │   │  5. Return ALLOW/WARN/BLOCK     │
│     human approval │      │   │                                 │
│  5. Record on-chain│      │   │  SDK: @chainlink/cre-sdk        │
└────────────────────┘      │   │  CLI: cre workflow simulate     │
                            │   └─────────────────────────────────┘
                            ▼
                  ┌──────────────────┐
                  │  LEDGER DEVICE   │
                  │                  │
                  │  WARN verdicts   │
                  │  require human   │
                  │  approval on     │
                  │  hardware device │
                  │                  │
                  │  ERC-7730 Clear  │
                  │  Signing shows   │
                  │  readable tx     │
                  │  details         │
                  └──────────────────┘
```

---

## Chainlink Integration

### CRE Workflow — Decentralized Risk Assessment

A CRE workflow that runs on a **Chainlink Decentralized Oracle Network (DON)** for fault-tolerant risk assessment.

```
Cron Trigger ── HTTP: HBAR/USD Price ── Risk Scoring ── Verdict
                (DON consensus)         (same logic)     ALLOW/WARN/BLOCK
```

**What it does:**
- Fetches live HBAR/USD price from CoinGecko via HTTP capability
- Multiple DON nodes reach consensus on the price (`consensusIdenticalAggregation`)
- Scores each pending AI agent transaction using AegisPay's risk engine
- Returns structured assessment report

**Simulation output:**
```
[OK] TX #1: transfer 50 HBAR ($4.36)    → score=25 → ALLOW
[!!] TX #2: swap 5000 HBAR ($436.15)     → score=50 → WARN
[XX] TX #3: transfer to 0x...dead        → score=85 → BLOCK
[!!] TX #4: contract-call 2000 HBAR      → score=55 → WARN

Summary: 1 ALLOW | 2 WARN | 1 BLOCK | $632.42 exposure | $17.45 blocked
```

**Run it yourself:**
```bash
cd workflow/aegispay
bun install --cwd ./aegispay-workflow
cre workflow simulate ./aegispay-workflow -T staging-settings --non-interactive --trigger-index 0
```

### Chainlink Price Feed — On-Chain Risk Adjustment

PolicyManager v2 reads HBAR/USD price from a **Chainlink AggregatorV3Interface** on-chain and adjusts the risk score based on the real USD value of the transfer.

```solidity
function getVerdictWithPrice(uint256 baseScore, uint256 amountWei)
    → reads Chainlink price feed
    → adjusts score based on USD value
    → emits PriceAwareVerdict event (state change)
    → returns verdict
```

**State change TX:** [`0x8b8b8a6b...`](https://hashscan.io/testnet/transaction/0x8b8b8a6bd87bfa28f2d7240f85920d0ed705cd19cc6d746e6cabc2b5423b2971)

---

## Ledger Integration

When PolicyManager returns **WARN**, the agent cannot move funds without human approval.

- **Ledger Wallet Provider** (`@ledgerhq/ledger-wallet-provider`) via EIP-6963
- **ERC-7730 Clear Signing** JSON files for all 3 contracts
- Ledger screen shows human-readable tx details, not raw calldata

---

## ENS Integration

AI agents need persistent, human-readable identities. AegisPay resolves ENS names and avatars for connected wallets:

- **`useEnsName`** + **`useEnsAvatar`** from wagmi, resolving against Ethereum mainnet
- Sidebar shows ENS name + avatar instead of raw `0x...` addresses
- Falls back to short address if no ENS name is registered
- Enhances agent operator identity and discoverability in the UI

---

## Contracts

### Original (Hedera Testnet)

| Contract | Address | HashScan |
|----------|---------|----------|
| AgentRegistry | `0xe0595502b10398D7702Ed43eDcf8101Fd67c0991` | [View](https://hashscan.io/testnet/contract/0xe0595502b10398D7702Ed43eDcf8101Fd67c0991) |
| PolicyManager | `0x226F68C0D8F26A478F4F64d2733376DAB98Fcc6c` | [View](https://hashscan.io/testnet/contract/0x226F68C0D8F26A478F4F64d2733376DAB98Fcc6c) |
| AssessmentRegistry | `0xeA86E74c8c89a30F6180B4d5c3d9C58C981d3638` | [View](https://hashscan.io/testnet/contract/0xeA86E74c8c89a30F6180B4d5c3d9C58C981d3638) |

### Chainlink Integration (Hedera Testnet)

| Contract | Address | HashScan |
|----------|---------|----------|
| PolicyManager v2 | `0xc5b07cdc6908ecee95ce721da8374dcda2588b7a` | [View](https://hashscan.io/testnet/contract/0xc5b07cdc6908ecee95ce721da8374dcda2588b7a) |
| MockPriceFeed | `0x1bd8c9fd55a0140e5f7db18546334b2ae8ca59d4` | [View](https://hashscan.io/testnet/contract/0x1bd8c9fd55a0140e5f7db18546334b2ae8ca59d4) |

> On mainnet, MockPriceFeed is replaced by the real Chainlink HBAR/USD feed at `0xAF685FB45C12b92b5054ccb9313e135525F9b5d5`

---

## Project Structure

```
flujoAgente/
│
├── src/                        Frontend (Next.js 14)
│   ├── app/                    Pages: /, /simulate, /agents, /policy, /history, /workflow
│   ├── app/api/                Server-side RPC routes
│   ├── components/             Sidebar, VerdictBadge, Providers
│   └── lib/                    wagmi config, contracts, ledger
│
├── contracts/                  Smart Contracts (Foundry)
│   ├── src/                    AgentRegistry, PolicyManager, AssessmentRegistry, MockPriceFeed
│   ├── script/                 Deploy scripts (Hedera Testnet)
│   └── test/                   23 tests (all passing)
│
├── agent/                      Autonomous AI Agent (TypeScript)
│   └── src/agent.ts            Mission picker → risk engine → policy check → execute
│
└── workflow/aegispay/          Chainlink CRE Workflow
    ├── aegispay-workflow/      TypeScript SDK workflow
    │   ├── workflow.ts         HTTP fetch + risk scoring + verdict
    │   ├── main.ts             CRE Runner entry point
    │   └── config.staging.json 4 test scenarios
    └── project.yaml            CRE CLI settings
```

---

## Quick Start

### Frontend
```bash
npm install
npm run dev
# Open http://localhost:3000
# Connect wallet to Hedera Testnet (Chain 296)
```

### Agent
```bash
cd agent
npm install
cp .env.example .env   # Add your Hedera credentials
npm run agent
```

### Contracts
```bash
cd contracts
forge test   # 23/23 tests pass
```

### CRE Workflow
```bash
cd workflow/aegispay
bun install --cwd ./aegispay-workflow
~/bin/cre login
cre workflow simulate ./aegispay-workflow -T staging-settings --non-interactive --trigger-index 0
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Contracts | Solidity 0.8.24, Foundry, Hedera Testnet EVM |
| Frontend | Next.js 14, Tailwind CSS, wagmi v2, viem |
| Agent | TypeScript, viem, Hedera Agent Kit |
| Chainlink | CRE SDK (`@chainlink/cre-sdk`), AggregatorV3Interface, Price Feeds |
| Ledger | Wallet Provider (EIP-6963), ERC-7730 Clear Signing |
| ENS | Name + avatar resolution via wagmi (useEnsName, useEnsAvatar) |
| Chain | Hedera Testnet (296) |

---

## Bounty Qualification

### Hedera — AI on Hedera
- Hedera Agent Kit SDK for native HBAR transfers
- 3 smart contracts on Hedera EVM
- Verified on HashScan

### Ledger — AI Agents x Clear Signing
- Human-in-the-loop for WARN verdicts
- Ledger Wallet Provider via EIP-6963
- ERC-7730 Clear Signing JSON for all contracts

### Chainlink — Best Workflow with CRE ($4,000)
- CRE Workflow with TypeScript SDK
- HTTP capability + DON consensus (`consensusIdenticalAggregation`)
- Successful simulation via CRE CLI
- Meaningfully used: risk assessment is the core of AegisPay

### Chainlink — Connect the World ($1,000)
- PolicyManager reads Chainlink AggregatorV3Interface on-chain
- `getVerdictWithPrice()` adjusts risk based on real USD value
- State change: `PriceAwareVerdict` event emitted
- 8 tests with MockPriceFeed, 23 total passing

### ENS — Best ENS Integration for AI Agents ($5,000)
- ENS name + avatar resolution for agent operators in the UI
- `useEnsName` + `useEnsAvatar` via wagmi resolving against Ethereum mainnet
- Enhances agent identity and discoverability — not cosmetic, agents need human-readable names
- No hardcoded values — resolves dynamically for any connected wallet

---

## Tests

```
23 tests, all passing

AgentRegistry:      register, duplicate prevention, toggle, permissions
PolicyManager:      thresholds, verdicts (ALLOW/WARN/BLOCK), price feed, value adjustment
AssessmentRegistry: create, agent validation, history, queries
Chainlink:          setPriceFeed, getLatestPrice, verdictWithPrice (3 scenarios), event emission
```

Run them:
```bash
cd contracts
forge test -v
```

---

## 🔍 For Judges — 5-Minute Evaluation Guide

Fastest path to verify every integration:

| What to check | How | Expected result |
|---------------|-----|-----------------|
| **Hedera contracts** | Click HashScan links in Contracts table | 5 deployed contracts, verified source |
| **Chainlink state change** | [0x8b8b8a6b...](https://hashscan.io/testnet/transaction/0x8b8b8a6bd87bfa28f2d7240f85920d0ed705cd19cc6d746e6cabc2b5423b2971) | `PriceAwareVerdict` event on-chain |
| **CRE Workflow** | `cre workflow simulate ./aegispay-workflow -T staging-settings --non-interactive --trigger-index 0` | `SUCCESS` + 4 verdicts |
| **23 tests** | `cd contracts && forge test` | All passing |
| **Ledger Clear Signing** | `src/clear-signing/` | JSON files for 3 contracts (ERC-7730) |
| **ENS in UI** | Run frontend + connect wallet with .eth name | Sidebar shows name + avatar |
| **Risk scoring logic** | `agent/src/agent.ts` | Mission picker → risk engine → policy → execute |

> **TL;DR for judges**: AegisPay is a fully functional risk firewall for AI agents. Every integration is real, on-chain, and verifiable. Not a UI prototype — the agent actually runs missions and makes payment decisions.

---

## 🌟 Social Proof & Achievements

### Built at ETHGlobal Cannes 2026
- ✅ 5 sponsor integrations completed (Hedera, Chainlink CRE, Chainlink Price Feed, Ledger, ENS)
- ✅ **23/23 smart contract tests passing**
- ✅ **5 contracts deployed** and verified on Hedera Testnet
- ✅ **Chainlink CRE simulation**: successful run with real HBAR/USD price from CoinGecko via DON
- ✅ **On-chain state change verified**: `PriceAwareVerdict` TX on HashScan
- ✅ **Autonomous agent** runs end-to-end: picks mission → scores risk → consults policy → executes or waits

### Why AegisPay is Different

Most AI agent projects at ETHGlobal build the **agent** — what the agent *does*.

AegisPay builds the **guardrails** — what the agent *cannot do*.

```
Other projects:   Agent ──→ Action
AegisPay:         Agent ──→ Risk Score ──→ Policy Check ──→ (Action | Human | Block)
                                              ↑
                                    Chainlink Price Feed
                                    Hedera Audit Trail
                                    Ledger Hardware Approval
```

The problem is real, the solution is live, and the architecture is production-ready.

---

## 👥 Team

Built at **ETHGlobal Cannes 2026** in 36 hours.

| Role | Contribution |
|------|-------------|
| Smart Contracts | AgentRegistry, PolicyManager, AssessmentRegistry + Chainlink integration |
| Frontend | Next.js 14 dashboard with wagmi, viem, ENS resolution |
| AI Agent | TypeScript autonomous agent with Hedera Agent Kit |
| CRE Workflow | Chainlink DON workflow with TypeScript SDK |
| Design | UX for human-in-the-loop Ledger approval flow |

---
## Risk Model

AegisPay uses a deterministic six-factor risk model instead of a black-box score.

The goal of this model is to make agent decisions explainable, auditable, and compatible with onchain policy enforcement.  
Before an agent pays, signs, or executes a sensitive action, the system evaluates the action across six independent risk dimensions.

### 1. Amount Risk
Measures the financial exposure of the action relative to the agent’s configured safe spending limit.

**Why it matters**  
A payment amount should not be evaluated as an absolute number. Risk depends on the policy configured for that specific agent.

**Example**  
If an agent has a safe spending limit of 100 USDC:
- 10 USDC → low amount risk
- 60 USDC → medium amount risk
- 95 USDC → high amount risk
- 120 USDC → policy breach

---

### 2. Target Risk
Measures whether the destination is trusted, known, approved, or unverified.

**Why it matters**  
Even a small payment can be dangerous if the destination is malicious or unknown.

**Example**
- approved contract used before → lower risk
- new address with no history → higher risk
- unverified contract → high risk

---

### 3. Action Risk
Measures the sensitivity of the requested action.

**Why it matters**  
Not all actions carry the same level of risk. A simple transfer is very different from a high-impact contract interaction.

**Example**
- simple payment → lower risk
- contract interaction → medium risk
- sensitive execution or complex function call → higher risk

---

### 4. Permission Risk
Measures whether the action grants, uses, or expands elevated permissions.

**Why it matters**  
Permission changes can create larger downstream risk than the immediate payment itself.

**Example**
- limited approval → moderate risk
- broad spending approval → high risk
- delegation of control or privilege escalation → very high risk

---

### 5. Context Risk
Measures execution anomalies or unusual behavioral patterns.

**Why it matters**  
Even a valid action may become risky when it happens under unusual conditions.

**Example**
- repeated failed attempts
- action outside expected operating pattern
- unusual sequence of requests
- abnormal timing or unexpected execution context

---

### 6. Historical Reputation Risk
Measures whether the agent or the destination has trustworthy prior history.

**Why it matters**  
Past behavior is a strong signal for future trust.

**Example**
- repeated successful interactions with the same target → lower risk
- no historical record → neutral or elevated risk
- prior suspicious or failed interactions → higher risk

---

## Final Score

These six components are combined into a normalized **0–100 risk score**.

### Verdict Mapping
- **0–29** → `ALLOW`
- **30–69** → `WARN`
- **70–100** → `BLOCK`

## Design Principles

This model is intentionally:

- **Deterministic**  
  The same action under the same conditions produces the same score.

- **Explainable**  
  Each risk component can be inspected and justified.

- **Auditable**  
  The final decision can be logged and verified.

- **Policy-compatible**  
  The score can be translated into enforceable onchain rules.

## Why This Approach

AegisPay does not treat trust as a vague UX concept.  
It turns trust into an explicit control flow:

1. an agent requests an action,
2. the system evaluates risk,
3. the policy layer maps the result to `ALLOW`, `WARN`, or `BLOCK`,
4. and only then the action may proceed.

Built at **ETHGlobal Cannes 2026** · [HashScan](https://hashscan.io/testnet) · [Chainlink CRE](https://docs.chain.link/chainlink-automation/concepts/compatible-contracts)
