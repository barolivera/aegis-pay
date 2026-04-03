# AegisPay — Trust Layer for Autonomous AI Agents

AegisPay is a trust layer that evaluates risk before an AI agent executes a payment. It scores the transaction, applies a configurable policy (ALLOW / WARN / BLOCK), and records every assessment on-chain as an immutable audit trail.

Built for **ETHGlobal Cannes 2026** — deployed on **Hedera Testnet**.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AEGISPAY ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────┐        ┌───────────────────────────────┐    │
│  │      Frontend (Next.js)   │        │    Autonomous Agent (TS)      │    │
│  │                           │        │                               │    │
│  │  • Dashboard (live stats) │        │  • Picks mission from queue   │    │
│  │  • Simulate Assessment    │        │  • Computes risk score        │    │
│  │  • Register Agents        │        │  • Queries verdict on-chain   │    │
│  │  • Configure Policy       │        │  • Executes HBAR transfer     │    │
│  │  • Assessment History     │        │  • Records assessment         │    │
│  └─────────────┬─────────────┘        └──────────────┬────────────────┘    │
│                │                                      │                     │
│                └───────────────┬───────────────────────┘                     │
│                                │                                            │
│                ┌───────────────▼────────────────────┐                       │
│                │   API Routes (Next.js server-side)  │                      │
│                │   /api/verdict  /api/stats          │                      │
│                │   /api/assessments  /api/thresholds │                      │
│                └───────────────┬────────────────────┘                       │
│                                │                                            │
│                ┌───────────────▼────────────────────┐                       │
│                │      Smart Contracts (Solidity)     │                      │
│                │                                     │                      │
│                │  PolicyManager                      │                      │
│                │    getVerdict(score) → ALLOW/WARN/BLOCK                    │
│                │                                     │                      │
│                │  AgentRegistry                      │                      │
│                │    registerAgent(addr, metadataURI)  │                      │
│                │                                     │                      │
│                │  AssessmentRegistry                 │                      │
│                │    createAssessment(agent, target,   │                      │
│                │      score, verdict, reason)         │                      │
│                └───────────────┬────────────────────┘                       │
│                                │                                            │
│                ┌───────────────▼────────────────────┐                       │
│                │     Hedera Testnet (EVM / RPC)      │                      │
│                │     Chain ID: 296                    │                      │
│                │     RPC: testnet.hashio.io/api       │                      │
│                └─────────────────────────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Flow

```
Agent wants to pay Target
    │
    ├─ 1. Compute risk score (amount + address type + first interaction)
    │
    ├─ 2. Call PolicyManager.getVerdict(score) on-chain
    │      └─ score < 30  → ALLOW
    │      └─ 30 ≤ score < 70 → WARN (human approval required)
    │      └─ score ≥ 70  → BLOCK
    │
    ├─ 3. If ALLOW → execute HBAR transfer
    │     If WARN  → wait for human approval
    │     If BLOCK → cancel transfer
    │
    └─ 4. Record assessment in AssessmentRegistry (always)
```

## Contracts (Hedera Testnet)

| Contract | Address |
|----------|---------|
| AgentRegistry | `0xe0595502b10398D7702Ed43eDcf8101Fd67c0991` |
| PolicyManager | `0x226F68C0D8F26A478F4F64d2733376DAB98Fcc6c` |
| AssessmentRegistry | `0xeA86E74c8c89a30F6180B4d5c3d9C58C981d3638` |

## Project Structure

```
├── contracts/          Solidity contracts (Foundry)
│   ├── src/            AgentRegistry, PolicyManager, AssessmentRegistry
│   ├── script/         Deploy script
│   └── test/           15 Foundry tests
├── agent/              Autonomous TypeScript agent
│   └── src/            agent.ts, deploy-local.ts
└── src/                Next.js frontend
    ├── app/            Pages (dashboard, simulate, agents, policy, history)
    ├── app/api/        Server-side API routes for Hedera RPC
    ├── components/     Sidebar, VerdictBadge, PageWrapper
    └── lib/            wagmi config, contract ABIs, utils
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

- **Contracts**: Solidity 0.8.24, Foundry
- **Frontend**: Next.js 14, Tailwind CSS, wagmi, viem, Framer Motion
- **Agent**: TypeScript, viem
- **Chain**: Hedera Testnet (EVM-compatible via JSON-RPC relay)
