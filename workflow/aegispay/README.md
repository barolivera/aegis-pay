# AegisPay × Chainlink CRE — Decentralized Risk Assessment Workflow

> Trust layer for autonomous AI agents, powered by Chainlink's Decentralized Oracle Network.

## What it does

This CRE workflow runs on a Chainlink DON to provide **fault-tolerant, trust-minimized risk assessment** for AI agent transactions on Hedera.

```
Cron Trigger (every 1 min)
    │
    ▼
HTTP Capability ──► CoinGecko API (HBAR/USD live price)
    │                   with DON consensus
    ▼
Risk Engine ──► Score each pending transaction
    │           • Address reputation (burn addr = +60)
    │           • USD value analysis (real-time price × amount)
    │           • Action type risk (swap +10, contract-call +15)
    │           • First interaction penalty (+15)
    ▼
PolicyManager Logic ──► ALLOW (score < 30) | WARN (30-69) | BLOCK (≥70)
    │
    ▼
Structured Assessment Report (JSON)
```

## Why CRE?

Without CRE, AegisPay's risk scoring runs client-side or on a single server — a single point of failure. With CRE:

- **Decentralized execution**: Multiple DON nodes run the same assessment, reach consensus
- **Fault-tolerant**: No single node can manipulate the risk score
- **Real-time data**: HTTP capability fetches live HBAR price with consensus verification
- **Institutional-grade**: Same infrastructure used by DeFi protocols managing billions

## Simulation Output

```
✓ Workflow compiled
[SIMULATION] Running trigger: cron-trigger@1.0.0

  AegisPay Risk Assessment — CRE Workflow
  HBAR/USD Price (live): $0.087
  Policy: ALLOW < 30 | WARN < 70 | BLOCK >= 70

  [OK] TX #1: transfer 50 HBAR ($4.36)    → score=25 → ALLOW
  [!!] TX #2: swap 5000 HBAR ($436.15)     → score=50 → WARN
  [XX] TX #3: transfer to 0x...dead        → score=85 → BLOCK
  [!!] TX #4: contract-call 2000 HBAR      → score=55 → WARN

  Summary: 1 ALLOW | 2 WARN | 1 BLOCK
  Total USD exposure: $632.42
  USD blocked: $17.45

✓ Status: SUCCESS
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.3+
- [CRE CLI](https://docs.chain.link/cre/getting-started/cli-installation) v1.9+
- `cre login` (authenticate once)

### Run

```bash
cd workflow/aegispay

# Install deps
bun install --cwd ./aegispay-workflow

# Simulate
cre workflow simulate ./aegispay-workflow -T staging-settings --non-interactive --trigger-index 0
```

## Architecture — How it connects to AegisPay

```
┌─────────────────────────────────────────────────────────┐
│                    AegisPay System                       │
│                                                          │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │ Frontend  │   │ Agent (TS)   │   │ CRE Workflow     │ │
│  │ Next.js   │   │ Autonomous   │   │ (Chainlink DON)  │ │
│  │           │   │              │   │                  │ │
│  │ /simulate │   │ picks mission│   │ HTTP: HBAR price │ │
│  │ /policy   │   │ scores risk  │   │ Risk scoring     │ │
│  │ /history  │   │ executes tx  │   │ DON consensus    │ │
│  └─────┬─────┘   └──────┬───────┘   └────────┬─────────┘ │
│        │                │                     │           │
│        ▼                ▼                     ▼           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Hedera Testnet (On-Chain)                │ │
│  │  PolicyManager ─── AssessmentRegistry ─── AgentReg   │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Bounty Qualification

**Best workflow with Chainlink CRE ($4,000)**

- ✅ CRE Workflow built with TypeScript SDK (`@chainlink/cre-sdk`)
- ✅ Integrates blockchain (Hedera) with external API (CoinGecko price feed)
- ✅ Successful simulation via CRE CLI demonstrated
- ✅ Meaningfully used: risk assessment is the core value prop of AegisPay
- ✅ DON consensus on HTTP responses (consensusIdenticalAggregation)

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Workflow SDK | `@chainlink/cre-sdk` v1.5.0 |
| CLI | CRE CLI v1.9.0 |
| Runtime | Bun v1.3+ |
| HTTP Data | CoinGecko API (HBAR/USD) |
| Consensus | `consensusIdenticalAggregation` |
| On-chain | Hedera Testnet (EVM) |
| Contracts | PolicyManager, AssessmentRegistry, AgentRegistry |
