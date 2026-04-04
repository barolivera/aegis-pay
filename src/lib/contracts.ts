// AegisPay contract addresses on Hedera Testnet
export const ADDRESSES = {
  agentRegistry: "0xe0595502b10398D7702Ed43eDcf8101Fd67c0991" as const,
  policyManager: "0x226F68C0D8F26A478F4F64d2733376DAB98Fcc6c" as const,
  assessmentRegistry: "0xeA86E74c8c89a30F6180B4d5c3d9C58C981d3638" as const,
};


export const policyManagerAbi = [
  {
    type: "function",
    name: "getVerdict",
    inputs: [{ name: "riskScore", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getThresholds",
    inputs: [],
    outputs: [
      { name: "low", type: "uint256" },
      { name: "medium", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setPolicy",
    inputs: [
      { name: "_lowThreshold", type: "uint256" },
      { name: "_mediumThreshold", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;

export const assessmentRegistryAbi = [
  {
    type: "function",
    name: "createAssessment",
    inputs: [
      { name: "agent", type: "address" },
      { name: "target", type: "address" },
      { name: "riskScore", type: "uint256" },
      { name: "verdict", type: "string" },
      { name: "reason", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAssessment",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "agent", type: "address" },
          { name: "target", type: "address" },
          { name: "riskScore", type: "uint256" },
          { name: "verdict", type: "string" },
          { name: "reason", type: "string" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalAssessments",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAssessmentsByAgent",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AssessmentCreated",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "agent", type: "address", indexed: true },
      { name: "target", type: "address", indexed: true },
      { name: "riskScore", type: "uint256", indexed: false },
      { name: "verdict", type: "string", indexed: false },
    ],
  },
] as const;

export const agentRegistryAbi = [
  {
    type: "function",
    name: "getAgent",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "metadataURI", type: "string" },
          { name: "active", type: "bool" },
          { name: "registeredAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerAgent",
    inputs: [
      { name: "agent", type: "address" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "agentCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "toggleAgent",
    inputs: [
      { name: "agent", type: "address" },
      { name: "active", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// Wagmi contract config shortcuts
export const agentRegistryConfig = {
  address: ADDRESSES.agentRegistry as `0x${string}`,
  abi: agentRegistryAbi,
} as const;

export const policyManagerConfig = {
  address: ADDRESSES.policyManager as `0x${string}`,
  abi: policyManagerAbi,
} as const;

export const assessmentRegistryConfig = {
  address: ADDRESSES.assessmentRegistry as `0x${string}`,
  abi: assessmentRegistryAbi,
} as const;
