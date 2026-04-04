# AegisPay — Trust Layer for Autonomous AI Agents

> **ETHGlobal Cannes 2026** | AI Agents + DeFi + On-Chain Risk Assessment

---

## Overview

AegisPay is a **trust layer** that evaluates risk before an AI agent executes a payment. It scores the transaction, applies a configurable policy (**ALLOW / WARN / BLOCK**), and records every assessment on-chain as an immutable audit trail.

When risk is medium, **Ledger** acts as the hardware trust layer for human-in-the-loop approval. When the assessment needs to be decentralized, **Chainlink CRE** runs it on a DON with fault-tolerant consensus.

---

## The Problem

Autonomous AI agents can pay for APIs, tools, and services without human intervention. But what happens when an agent tries to send 150 HBAR to an unknown address? Or interact with a suspicious contract?

**Without AegisPay:** The agent executes blindly — no risk check, no audit trail, no way to stop it.

**With AegisPay:** Every payment goes through a 3-step pipeline:

```
  Risk Engine          Policy Manager         Execution
 ┌────────────┐      ┌────────────────┐      ┌──────────────┐
 │ Score 0-100│ ──── │ ALLOW  < 30    │ ──── │ ALLOW: send  │
 │            │      │ WARN   30-69   │      │ WARN: Ledger │
 │ - amount   │      │ BLOCK  >= 70   │      │ BLOCK: stop  │
 │ - address  │      │                │      │              │
 │ - price USD│      │ Chainlink feed │      │ All recorded │
 │ - action   │      │ on-chain       │      │ on-chain     │
 └────────────┘      └────────────────┘      └──────────────┘
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND  (Next.js 14 + wagmi + viem)                           │
│                                                                   │
│  /dashboard    /simulate    /agents    /policy    /history        │
│  live stats    risk assess  register   set rules  audit trail     │
│                                                                   │
│  /workflow  ←── Chainlink CRE integration page                    │
│  run DON        shows on-chain price + verdicts                   │
│  simulation     reads from PolicyManager v2                       │
└───────────┬───────────────────────────────────────┬──────────────┘
            │                                       │
            │  wagmi / JSON-RPC                     │  fetch /api/cre-simulate
            ▼                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  HEDERA TESTNET  (Chain 296)                                      │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ AgentRegistry   │  │ PolicyManager   │  │ AssessmentRegistry│  │
│  │                 │  │                 │  │                  │  │
│  │ registerAgent() │  │ getVerdict()    │  │ createAssessment()│  │
│  │ toggleAgent()   │  │ setPolicy()     │  │ getAssessment()  │  │
│  │ ERC-8004 pattern│  │ getThresholds() │  │ audit trail      │  │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ PolicyManager v2              MockPriceFeed              │    │
│  │ (Chainlink integration)       (AggregatorV3Interface)    │    │
│  │                                                          │    │
│  │ getVerdictWithPrice()  ◄────  latestRoundData()          │    │
│  │ reads price on-chain          returns HBAR/USD           │    │
│  │ adjusts risk score            $0.087 (8 decimals)        │    │
│  │ emits PriceAwareVerdict                                  │    │
│  └──────────────────────────────────────────────────────────┘    │
└───────┬──────────────────────────────────┬───────────────────────┘
        │                                  │
        ▼                                  ▼
┌────────────────────┐          ┌─────────────────────────────────┐
│  AUTONOMOUS AGENT  │          │  CHAINLINK CRE WORKFLOW         │
│  (TypeScript)      │          │  (Decentralized Oracle Network) │
│                    │          │                                  │
│  1. Pick mission   │          │  1. Cron trigger (every 1 min)  │
│  2. Compute risk   │          │  2. HTTP: fetch HBAR/USD price  │
│  3. Query policy   │──────┐   │  3. DON consensus on price      │
│  4. Execute or     │      │   │  4. Score each pending TX       │
│     wait for       │      │   │  5. Return ALLOW/WARN/BLOCK     │
│     human approval │      │   │                                  │
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

---

## Tests

```
23 tests, all passing

AgentRegistry:      register, duplicate prevention, toggle, permissions
PolicyManager:      thresholds, verdicts (ALLOW/WARN/BLOCK), price feed, value adjustment
AssessmentRegistry: create, agent validation, history, queries
Chainlink:          setPriceFeed, getLatestPrice, verdictWithPrice (3 scenarios), event emission
```

---

Built at **ETHGlobal Cannes 2026**.
