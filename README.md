# AegisPay — Trust Layer for Autonomous AI Agents

> **ETHGlobal Cannes 2026** | Bounties: **Hedera AI Agents** + **Ledger AI Agents x Clear Signing**

AegisPay is a trust layer that evaluates risk before an AI agent executes a payment on **Hedera**. It scores the transaction, applies a configurable policy (ALLOW / WARN / BLOCK), and records every assessment on-chain as an immutable audit trail. **Ledger** acts as the hardware trust layer for human-in-the-loop approval on medium-risk transactions.

---

## The Problem: AI Agents Need Guardrails

Autonomous AI agents can pay for APIs, tools, and services without human intervention. But what happens when an agent tries to send 150 HBAR to an unknown address? Or interact with a suspicious contract?

**Without AegisPay:** The agent executes blindly — no risk check, no audit trail, no way to stop it.

**With AegisPay:** Every payment goes through a 3-step pipeline:

```
+------------------+     +------------------+     +------------------+
|  1. RISK ENGINE  | --> |  2. POLICY       | --> |  3. EXECUTION    |
|                  |     |     MANAGER      |     |                  |
|  Score 0-100     |     |  ALLOW < 30      |     |  ALLOW: transfer |
|  based on:       |     |  WARN  30-70     |     |  WARN:  Ledger   |
|  - amount        |     |  BLOCK > 70      |     |         approval |
|  - target addr   |     |                  |     |  BLOCK: stopped  |
|  - reputation    |     |  (on-chain,      |     |                  |
|  - first contact |     |   configurable)  |     |  All recorded    |
+------------------+     +------------------+     |  on-chain        |
                                                  +------------------+
```

Every assessment is recorded on-chain — creating an **immutable audit trail** of what the agent did, why, and whether it was allowed.

---

## AI Agents in AegisPay

### Autonomous Agent (Backend)

The autonomous agent runs as a TypeScript process using **Hedera Agent Kit SDK**. It simulates real-world AI agent behavior:

```
+---------------------------------------------------------------+
|                    AUTONOMOUS AGENT                            |
|                                                                |
|  +-----------+    +----------+    +---------+    +----------+  |
|  | Mission   |    | Risk     |    | Policy  |    | Hedera   |  |
|  | Queue     |--->| Engine   |--->| Check   |--->| Agent Kit|  |
|  |           |    |          |    | (chain) |    | Transfer |  |
|  | "Pay data |    | score=20 |    | ALLOW   |    | 5 HBAR   |  |
|  |  provider"|    |          |    |         |    | native   |  |
|  +-----------+    +----------+    +---------+    +----------+  |
|                                                                |
|  Missions:                                                     |
|  - Pay data feed provider      (low risk,  5 HBAR)            |
|  - Pay API oracle service      (medium,   20 HBAR)            |
|  - Pay unknown contractor      (high,    150 HBAR)            |
|  - Transfer to suspicious addr (blocked, burn addr)            |
|                                                                |
|  Tech: Hedera Agent Kit (HederaBuilder.transferHbar)           |
|        @hashgraph/sdk (ContractCallQuery, ContractExecute)     |
|        AgentMode.AUTONOMOUS                                    |
+---------------------------------------------------------------+
```

### Agent Registration (On-Chain)

Every agent must be registered in the **AgentRegistry** contract before it can create assessments. This follows the **ERC-8004 pattern** for on-chain agent identity:

```
+-------------------+         +------------------+
|  Agent            |         | AgentRegistry    |
|  0x5e07...e929    | ------> | registerAgent()  |
|                   |         |                  |
|  owner: deployer  |         | Stores:          |
|  metadata: ipfs://|         |  - owner address |
|  active: true     |         |  - metadata URI  |
|  registered: block|         |  - active status |
+-------------------+         |  - timestamp     |
                              +------------------+
```

### Human-in-the-Loop (Ledger)

When the policy returns **WARN**, the agent **cannot move funds** without human approval. In the frontend, this triggers a Ledger Clear Signing flow:

```
+----------+     +-----------+     +----------+     +----------+
|  Agent   |     | Policy:   |     | Ledger   |     | Execute  |
|  wants   | --> | WARN      | --> | Device   | --> | or       |
|  to pay  |     | (medium   |     | shows tx |     | Cancel   |
|  20 HBAR |     |  risk)    |     | details  |     |          |
+----------+     +-----------+     | via Clear|     +----------+
                                   | Signing  |
                                   +----------+
```

The Ledger device displays human-readable transaction details (not raw hex) thanks to ERC-7730 Clear Signing JSON files.

---

## How It Works (Detailed Flow)

```
                    +-----------------------+
                    |    AI Agent picks a   |
                    |    payment mission    |
                    +-----------+-----------+
                                |
                                v
                    +-----------+-----------+
                    |   Register agent in   |
                    |   AgentRegistry       |
                    |   (once, on-chain)    |
                    +-----------+-----------+
                                |
                                v
                    +-----------+-----------+
                    |   Compute risk score  |
                    |   amount + address +  |
                    |   first interaction   |
                    +-----------+-----------+
                                |
                                v
                    +-----------+-----------+
                    |   PolicyManager       |
                    |   getVerdict(score)   |
                    +-----------+-----------+
                                |
              +-----------------+-----------------+
              |                 |                 |
              v                 v                 v
        +-----+-----+    +-----+-----+    +-----+-----+
        |   ALLOW   |    |   WARN    |    |   BLOCK   |
        |  score<30 |    | 30<=s<70  |    |  score>=70|
        +-----+-----+    +-----+-----+    +-----+-----+
              |                 |                 |
              v                 v                 |
        +-----+-----+    +-----+-----+           |
        |  Execute   |    |  Ledger   |           |
        |   HBAR     |    |  Human    |           |
        | transfer   |    | Approval  |           |
        | (Agent Kit)|    |  Required |           |
        +-----+-----+    +-----+-----+           |
              |                 |                 |
              |           +-----+-----+           |
              |           | Approve?  |           |
              |           +-----+-----+           |
              |            /         \            |
              |           v           v           |
              |     +-----+--+  +----+----+      |
              |     |Transfer|  | Cancel  |      |
              |     | (sign  |  |         |      |
              |     | on     |  |         |      |
              |     | Ledger)|  |         |      |
              |     +-----+--+  +----+----+      |
              |           |           |           |
              +--------+--+-----------+-----------+
                       |
                       v
              +--------+--------+
              | Record assessment|
              | on-chain (always)|
              | AssessmentRegistry|
              +-----------------+
```

---

## Architecture

```
+------------------------------------------------------------------+
|                         FRONTEND                                  |
|                      Next.js 14 + wagmi + viem                    |
|                                                                   |
|  +------------+ +----------+ +---------+ +--------+ +---------+  |
|  | Dashboard  | | Simulate | | Agents  | | Policy | | History |  |
|  | live stats | | risk     | | register| | set    | | audit   |  |
|  | from chain | | assess   | | on-chain| | rules  | | trail   |  |
|  +------+-----+ +----+-----+ +----+----+ +---+----+ +----+----+  |
|         |             |            |          |           |        |
+---------+-------------+------------+----------+-----------+-------+
          |             |            |          |           |
          v             v            v          v           v
+------------------------------------------------------------------+
|                    API ROUTES (server-side)                        |
|                                                                   |
|  /api/stats -----> AgentRegistry + AssessmentRegistry             |
|  /api/verdict ---> PolicyManager.getVerdict()                     |
|  /api/thresholds > PolicyManager.getThresholds()                  |
|  /api/assessments> AssessmentRegistry (recent list)               |
+----------------------------------+-------------------------------+
                                   |
                                   | JSON-RPC
                                   v
+------------------------------------------------------------------+
|                  HEDERA TESTNET (Chain 296)                        |
|                                                                   |
|  +------------------+  +----------------+  +-------------------+  |
|  | AgentRegistry    |  | PolicyManager  |  | AssessmentRegistry|  |
|  | 0xe059...c0991   |  | 0x226F...Fcc6c |  | 0xeA86...d3638   |  |
|  |                  |  |                |  |                   |  |
|  | registerAgent()  |  | getVerdict()   |  | createAssessment()|  |
|  | toggleAgent()    |  | setPolicy()    |  | getAssessment()   |  |
|  | getAgent()       |  | getThresholds()|  | totalAssessments()|  |
|  +------------------+  +----------------+  +-------------------+  |
+------------------------------------------------------------------+
          ^                                            ^
          |                                            |
+---------+--------------------------------------------+-----------+
|                  AUTONOMOUS AGENT                                 |
|               TypeScript + Hedera Agent Kit                       |
|                                                                   |
|  +-------------+  +-----------+  +------------+  +------------+  |
|  | Mission     |  | Risk      |  | Policy     |  | Transfer   |  |
|  | Queue       |->| Engine    |->| Verdict    |->| via Agent  |  |
|  | (random     |  | score     |  | on-chain   |  | Kit SDK    |  |
|  |  pick)      |  | 0-100     |  | query      |  | (native    |  |
|  +-------------+  +-----------+  +------------+  |  HBAR)     |  |
|                                                   +-----+------+  |
|                                                         |         |
|  +------------------------------------------------------+------+  |
|  | Record assessment on-chain (always)                         |  |
|  | agent + target + score + verdict + reason + timestamp       |  |
|  +-------------------------------------------------------------+  |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|                    LEDGER INTEGRATION                              |
|                                                                   |
|  +-------------------+    +----------------------------------+    |
|  | Wallet Provider   |    | ERC-7730 Clear Signing JSON      |    |
|  | (EIP-6963)        |    |                                  |    |
|  |                   |    | aegispay-agent-registry.json     |    |
|  | Auto-discovered   |    |   registerAgent, toggleAgent     |    |
|  | by wagmi v2       |    |                                  |    |
|  |                   |    | aegispay-policy-manager.json     |    |
|  | Human-in-the-loop |    |   setPolicy                     |    |
|  | for WARN verdicts |    |                                  |    |
|  |                   |    | aegispay-assessment-registry.json|    |
|  | Hardware-signed   |    |   createAssessment               |    |
|  | Clear Signing     |    |                                  |    |
|  +-------------------+    +----------------------------------+    |
+------------------------------------------------------------------+
```

---

## Bounty Qualification

### Hedera — AI on Hedera ($2,000)
- **Hedera Agent Kit SDK** (`hedera-agent-kit@3.8.2`) for native HBAR transfers via `HederaBuilder.transferHbar()` + `handleTransaction()` with `AgentMode.AUTONOMOUS`
- **Smart Contracts** on Hedera EVM: AgentRegistry, PolicyManager, AssessmentRegistry
- **@hashgraph/sdk** for `ContractCallQuery` / `ContractExecuteTransaction`
- Verified contracts on HashScan

### Ledger — AI Agents x Ledger ($6,000)
- **Human-in-the-loop**: WARN verdicts require human approval before funds move
- **Ledger Wallet Provider** (`@ledgerhq/ledger-wallet-provider@1.1.1`) via EIP-6963, auto-discovered by wagmi v2
- **ERC-7730 Clear Signing JSON** for all 3 contracts — human-readable tx details on Ledger device
- Ledger as the trust layer between autonomous AI agents and on-chain execution

### Ledger — Clear Signing & Integrations ($4,000)
- 3 ERC-7730 JSON files mapping every write function to human-readable labels
- Labels: "Register AI Agent", "Record Risk Assessment", "Risk Score (0-100)", "Update Risk Policy Thresholds"
- Schema-compliant: `https://eips.ethereum.org/assets/eip-7730/erc7730-v1.schema.json`

---

## Contracts (Hedera Testnet)

| Contract | Address | HashScan |
|----------|---------|----------|
| AgentRegistry | `0xe0595502b10398D7702Ed43eDcf8101Fd67c0991` | [View](https://hashscan.io/testnet/contract/0xe0595502b10398D7702Ed43eDcf8101Fd67c0991) |
| PolicyManager | `0x226F68C0D8F26A478F4F64d2733376DAB98Fcc6c` | [View](https://hashscan.io/testnet/contract/0x226F68C0D8F26A478F4F64d2733376DAB98Fcc6c) |
| AssessmentRegistry | `0xeA86E74c8c89a30F6180B4d5c3d9C58C981d3638` | [View](https://hashscan.io/testnet/contract/0xeA86E74c8c89a30F6180B4d5c3d9C58C981d3638) |

---

## Project Structure

```
flujoAgente/
├── contracts/                  Solidity contracts (Foundry)
│   ├── src/                    AgentRegistry, PolicyManager, AssessmentRegistry
│   ├── script/                 Deploy script for Hedera
│   └── test/                   15 Foundry tests (all passing)
│
├── agent/                      Autonomous AI Agent
│   ├── src/agent.ts            Dual-mode: viem (local) / Hedera Agent Kit (testnet)
│   ├── src/addresses-hedera.json
│   └── .env.example            HEDERA_ACCOUNT_ID, AGENT_PRIVATE_KEY, etc.
│
├── src/                        Next.js 14 Frontend
│   ├── app/                    Pages: /, /simulate, /agents, /policy, /history
│   ├── app/api/                Server-side RPC routes to Hedera
│   ├── components/             Sidebar, VerdictBadge, PageWrapper, Providers
│   ├── lib/wagmi.ts            Hedera Testnet chain config (chain 296)
│   ├── lib/ledger.ts           Ledger Wallet Provider init (EIP-6963)
│   ├── lib/contracts.ts        ABIs + deployed addresses
│   └── clear-signing/          ERC-7730 JSON files (3 contracts)
│
└── next.config.mjs
```

---

## Quick Start

### Frontend
```bash
git clone https://github.com/mariaelisaaraya/flujoAgente.git
cd flujoAgente
npm install
npm run dev
# Open http://localhost:3000
# Connect MetaMask to Hedera Testnet (Chain ID 296, RPC https://testnet.hashio.io/api)
```

### Autonomous Agent on Hedera
```bash
cd agent
npm install
cp .env.example .env
# Edit .env with your Hedera credentials:
#   NETWORK=hedera
#   HEDERA_ACCOUNT_ID=0.0.XXXXX
#   AGENT_PRIVATE_KEY=0x...
#   TARGET_ADDRESS=0x...
#   TARGET_ACCOUNT_ID=0.0.XXXXX
npm run agent
```

### Contracts (local testing)
```bash
cd contracts
forge install foundry-rs/forge-std --no-git
forge test -vvv       # 15/15 tests pass
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Contracts** | Solidity 0.8.24, Foundry, Hedera Testnet EVM |
| **Agent** | TypeScript, Hedera Agent Kit, @hashgraph/sdk, AgentMode.AUTONOMOUS |
| **Frontend** | Next.js 14, Tailwind CSS, wagmi v2, viem, Framer Motion |
| **Ledger** | Ledger Wallet Provider (EIP-6963), ERC-7730 Clear Signing JSON |
| **Chain** | Hedera Testnet (chain 296, JSON-RPC relay via hashio.io) |
| **Explorer** | HashScan (tx links for every on-chain write) |

---

## Team

Built by **AegisPay** at ETHGlobal Cannes 2026.
