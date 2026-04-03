import AgentRegistryABI from "@/contracts/abis/AgentRegistry.json";
import PolicyManagerABI from "@/contracts/abis/PolicyManager.json";
import AssessmentRegistryABI from "@/contracts/abis/AssessmentRegistry.json";

// TODO: Replace with real deployed addresses
export const CONTRACT_ADDRESSES = {
  AgentRegistry: "0x0000000000000000000000000000000000000000",
  PolicyManager: "0x0000000000000000000000000000000000000000",
  AssessmentRegistry: "0x0000000000000000000000000000000000000000",
} as const;

export const agentRegistryConfig = {
  address: CONTRACT_ADDRESSES.AgentRegistry as `0x${string}`,
  abi: AgentRegistryABI,
} as const;

export const policyManagerConfig = {
  address: CONTRACT_ADDRESSES.PolicyManager as `0x${string}`,
  abi: PolicyManagerABI,
} as const;

export const assessmentRegistryConfig = {
  address: CONTRACT_ADDRESSES.AssessmentRegistry as `0x${string}`,
  abi: AssessmentRegistryABI,
} as const;
