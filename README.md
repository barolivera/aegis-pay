```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   AEGISPAY ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌──────────────────────────────┐          ┌──────────────────────────────────────┐         │
│  │       Frontend Layer         │          │          Agent Layer                 │         │
│  │   (React + Tailwind + Viem)  │          │     (TypeScript Autonomous Agent)    │         │
│  │                              │          │                                      │         │
│  │  • Dashboard                 │          │  • Mission Selector                  │         │
│  │  • Simulate Assessment       │          │  • Risk Score Calculation            │         │
│  │  • Verdict Badge             │          │  • Decision Engine                   │         │
│  │  • Assessment History        │          │  • Hedera SDK Integration            │         │
│  └──────────────┬───────────────┘          └────────────────┬──────────--─────────┘         │
│                 │                                           │                               │
│                 └──────────────────────┬────────────────────┘                               │
│                                        │                                                    │
│                 ┌──────────────────────▼──────────────────────┐                             │
│                 │            Trust & Policy Layer             │                             │
│                 │                                             │                             │
│                 │  • PolicyManager                            │                             │
│                 │    - getVerdict(riskScore)                  │                             │
│                 │    - Thresholds (ALLOW / WARN / BLOCK)      │                             │
│                 │  • AgentRegistry                            │                             │
│                 │    - Register + Owner + Metadata            │                             │
│                 │  • AssessmentRegistry                       │                             │
│                 │    - On-chain Receipt + txHash              │                             │
│                 └──────────────────────┬──────────────────────┘                             │
│                                        │                                                    │
│                 ┌──────────────────────▼──────────────────────┐                             │
│                 │          Execution Layer (Hedera)           │                             │
│                 │                                             │                             │
│                 │  • Real HBAR / Token Transfer               │                             │
│                 │  • If ALLOW → Execute Payment               │                             │
│                 │  • If BLOCK → No funds moved                │                             │
│                 └──────────────────────┬──────────────────────                              │
│                                        │                                                    │
│                 ┌──────────────────────▼──────────────────────┐                             │
│                 │          Human Trust Layer (Ledger)         │                             │
│                 │                                             │                             │
│                 │  • Modal Human Approval (WARN)              │                             │
│                 │  • "Riesgo medio - Ledger recomienda        │                             │
│                 │     aprobación humana"                      │                             │
│                 │  • Future: Ledger hardware + Clear Signing  │                             │
│                 └─────────────────────────────────────────────┘                             │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

      1 {
      2   "agentRegistry": "0xe0595502b10398D7702Ed43eDcf8101Fd67c0991",
      3   "policyManager": "0x226F68C0D8F26A478F4F64d2733376DAB98Fcc6c",
      4   "assessmentRegistry": "0xeA86E74c8c89a30F6180B4d5c3d9C58C981d3638"
      5 }
```
