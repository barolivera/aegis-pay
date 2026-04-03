```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   AEGISPAY ARCHITECTURE                                       │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                               │
│  ┌──────────────────────────────┐          ┌──────────────────────────────────────┐         │
│  │       Frontend Layer         │          │          Agent Layer                 │         │
│  │   (React + Tailwind + Viem)  │          │     (TypeScript Autonomous Agent)    │         │
│  │                              │          │                                      │         │
│  │  • Dashboard                 │          │  • Mission Selector                  │         │
│  │  • Simulate Assessment       │          │  • Risk Score Calculation            │         │
│  │  • Verdict Badge             │          │  • Decision Engine                   │         │
│  │  • Assessment History        │          │  • Hedera SDK Integration            │         │
│  └──────────────┬───────────────┘          └──────────────────┬───────────────────┘         │
│                 │                                           │                                 │
│                 └──────────────────────┬────────────────────┘                                 │
│                                        │                                                      │
│                 ┌──────────────────────▼──────────────────────┐                               │
│                 │            Trust & Policy Layer             │                               │
│                 │                                             │                               │
│                 │  • PolicyManager                            │                               │
│                 │    - getVerdict(riskScore)                  │                               │
│                 │    - Thresholds (ALLOW / WARN / BLOCK)      │                               │
│                 │  • AgentRegistry                            │                               │
│                 │    - Register + Owner + Metadata            │                               │
│                 │  • AssessmentRegistry                       │                               │
│                 │    - On-chain Receipt + txHash              │                               │
│                 └──────────────────────┬──────────────────────┘                               │
│                                        │                                                      │
│                 ┌──────────────────────▼──────────────────────┐                               │
│                 │          Execution Layer (Hedera)           │                               │
│                 │                                             │                               │
│                 │  • Real HBAR / Token Transfer               │                               │
│                 │  • If ALLOW → Execute Payment               │                               │
│                 │  • If BLOCK → No funds moved                │                               │
│                 └──────────────────────┬──────────────────────┘                               │
│                                        │                                                      │
│                 ┌──────────────────────▼──────────────────────┐                               │
│                 │          Human Trust Layer (Ledger)         │                               │
│                 │                                             │                               │
│                 │  • Modal Human Approval (WARN)              │                               │
│                 │  • "Riesgo medio - Ledger recomienda        │                               │
│                 │     aprobación humana"                      │                               │
│                 │  • Future: Ledger hardware + Clear Signing  │                               │
│                 └──────────────────────────────────────────────┘                              │
│                                                                                               │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```
