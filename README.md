# AegisPay — Trust Layer for Autonomous AI Agents

AegisPay is a trust layer that evaluates risk before an AI agent executes a payment on **Hedera**. It scores the transaction, applies a configurable policy (ALLOW / WARN / BLOCK), and records every assessment on-chain as an immutable audit trail.

Built for **ETHGlobal Cannes 2026** — Bounty: **AI & Agentic Payments on Hedera**.

## What works today

- 3 Solidity contracts **deployed and verified on Hedera Testnet**
- Autonomous TypeScript agent that **executes real HBAR transfers** based on policy verdicts
- Full frontend connected to Hedera on-chain (not mocked):
  - **Dashboard**: live stats from AgentRegistry + AssessmentRegistry
  - **Simulate Assessment**: risk score → PolicyManager.getVerdict() on-chain → register assessment
  - **Register Agent**: calls AgentRegistry.registerAgent() via MetaMask on Hedera
  - **Configure Policy**: reads/writes thresholds on PolicyManager (owner only)
  - **Assessment History**: audit trail reading all assessments from chain
- ENS resolution support (AgentIdentity component with avatar + name fallback)
- Hedera Testnet chain definition for wagmi/viem
- Human Approval modal for WARN verdicts (Ledger co-signing flow)
- HashScan transaction links after every on-chain write

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           AEGISPAY ARCHITECTURE                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────┐       ┌────────────────────────────────┐    │
│  │     Frontend (Next.js)     │       │   Autonomous Agent (TS + viem) │    │
│  │                            │       │                                │    │
│  │  • Dashboard (live stats)  │       │  • Mission queue (random pick) │    │
│  │  • Simulate Assessment     │       │  • Risk score heuristic        │    │
│  │  • Register Agents         │       │  • On-chain verdict query      │    │
│  │  • Configure Policy        │       │  • Real HBAR transfers         │    │
│  │  • Assessment History      │       │  • On-chain assessment record  │    │
│  │  • ENS Identity (avatar)   │       │  • Local (Anvil) + Hedera mode │    │
│  │  • Human Approval (WARN)   │       │                                │    │
│  └─────────────┬──────────────┘       └───────────────┬────────────────┘    │
│                │                                       │                     │
│                └────────────────┬───────────────────────┘                     │
│                                 │                                            │
│                ┌────────────────▼─────────────────────┐                      │
│                │   API Routes (Next.js server-side)    │                     │
│                │                                       │                     │
│                │   /api/verdict    → PolicyManager      │                     │
│                │   /api/stats      → AgentRegistry +    │                     │
│                │                     AssessmentRegistry  │                     │
│                │   /api/assessments → AssessmentRegistry │                     │
│                │   /api/thresholds  → PolicyManager      │                     │
│                └────────────────┬─────────────────────┘                      │
│                                 │                                            │
│                ┌────────────────▼─────────────────────┐                      │
│                │     Smart Contracts (Solidity 0.8.24) │                      │
│                │                                       │                     │
│                │  AgentRegistry                        │                     │
│                │    registerAgent / toggleAgent         │                     │
│                │    ERC-8004 pattern (agent identity)   │                     │
│                │                                       │                     │
│                │  PolicyManager                        │                     │
│                │    getVerdict(score) → ALLOW/WARN/BLOCK│                     │
│                │    setPolicy(low, medium) — owner only │                     │
│                │                                       │                     │
│                │  AssessmentRegistry                   │                     │
│                │    createAssessment (validates agent)  │                     │
│                │    on-chain audit trail                │                     │
│                └────────────────┬─────────────────────┘                      │
│                                 │                                            │
│                ┌────────────────▼─────────────────────┐                      │
│                │       Hedera Testnet (EVM / RPC)      │                      │
│                │                                       │                     │
│                │  Chain ID: 296                         │                     │
│                │  RPC: testnet.hashio.io/api            │                     │
│                │  Explorer: hashscan.io/testnet         │                     │
│                └───────────────────────────────────────┘                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Flow

```
Agent wants to pay Target
    │
    ├─ 1. Register agent in AgentRegistry (once, on-chain)
    │
    ├─ 2. Compute risk score (amount + address reputation + first interaction)
    │
    ├─ 3. Query PolicyManager.getVerdict(score) on Hedera
    │      ├─ score < 30  → ALLOW
    │      ├─ 30 ≤ score < 70 → WARN (human approval via modal / Ledger)
    │      └─ score ≥ 70  → BLOCK
    │
    ├─ 4. Execute decision
    │      ├─ ALLOW → real HBAR transfer on Hedera
    │      ├─ WARN  → pause, wait for human approval, then transfer or cancel
    │      └─ BLOCK → no funds moved
    │
    └─ 5. Record assessment in AssessmentRegistry (always, regardless of verdict)
           └─ agent, target, score, verdict, reason, timestamp — all on-chain
```

## Contracts (Hedera Testnet)

| Contract | Address | Verified |
|----------|---------|----------|
| AgentRegistry | `0xe0595502b10398D7702Ed43eDcf8101Fd67c0991` | Yes |
| PolicyManager | `0x226F68C0D8F26A478F4F64d2733376DAB98Fcc6c` | Yes |
| AssessmentRegistry | `0xeA86E74c8c89a30F6180B4d5c3d9C58C981d3638` | Yes |

## Project Structure

```
├── contracts/              Solidity contracts (Foundry)
│   ├── src/                AgentRegistry, PolicyManager, AssessmentRegistry
│   ├── script/             Deploy script for Hedera
│   └── test/               15 Foundry tests (all passing)
├── agent/                  Autonomous TypeScript agent
│   └── src/                agent.ts (missions + risk engine + transfers)
└── src/                    Next.js 14 frontend
    ├── app/                Pages: /, /simulate, /agents, /policy, /history
    ├── app/api/            Server-side RPC routes (no browser-side chain calls)
    ├── components/         Sidebar, VerdictBadge, AgentIdentity (ENS), PageWrapper
    └── lib/                wagmi (Hedera), contracts (ABIs + addresses), ENS utils
```

## Setup

### Frontend
```bash
npm install
npm run dev
# Open http://localhost:3000
# Connect MetaMask to Hedera Testnet (Chain ID 296, RPC https://testnet.hashio.io/api)
```

### Contracts (local testing)
```bash
cd contracts
forge install foundry-rs/forge-std --no-git
forge test -vvv       # 15/15 tests pass
```

### Autonomous Agent (local)
```bash
cd agent
npm install
# Terminal 1: anvil
# Terminal 2:
npm run deploy-local
npm run agent
```

### Agent on Hedera Testnet
```bash
cd agent
cp .env.example .env
# Edit .env: NETWORK=hedera, AGENT_PRIVATE_KEY, TARGET_ADDRESS
npm run agent
```

## Tech Stack

- **Contracts**: Solidity 0.8.24, Foundry, deployed on Hedera Testnet
- **Frontend**: Next.js 14, Tailwind CSS, wagmi, viem, Framer Motion
- **Agent**: TypeScript, viem, mission-based autonomous execution
- **Identity**: ENS resolution (avatar + name), ERC-8004 agent registration pattern
- **Chain**: Hedera Testnet (EVM-compatible via JSON-RPC relay)
- **Explorer**: HashScan (transaction links for every on-chain write)
