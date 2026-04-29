import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_CONFIG } from '../lib/contracts';
import { type Address, keccak256, toBytes } from 'viem';

/**
 * Hook to read an agent's profile from AgentRegistry
 */
export function useAgentProfile(agentId: bigint | number) {
  return useReadContract({
    address: CONTRACT_CONFIG.AgentRegistry.address as Address,
    abi: CONTRACT_CONFIG.AgentRegistry.abi,
    functionName: 'getAgentProfile',
    args: [BigInt(agentId)],
  });
}

/**
 * Hook to check if an agent has a specific skill
 */
export function useHasSkill(agentId: bigint | number | undefined, skillId: string | undefined) {
  const ZERO_SKILL = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const enabled = !!agentId && !!skillId && skillId !== ZERO_SKILL;
  return useReadContract({
    address: CONTRACT_CONFIG.AgentRegistry.address as Address,
    abi: CONTRACT_CONFIG.AgentRegistry.abi,
    functionName: 'hasSkill',
    args: enabled ? [BigInt(agentId!), skillId as `0x${string}`] : undefined,
    query: { enabled },
  });
}

/**
 * Hook to get all agents owned by an address
 */
export function useOwnerAgents(ownerAddress: Address | undefined) {
  return useReadContract({
    address: CONTRACT_CONFIG.AgentRegistry.address as Address,
    abi: CONTRACT_CONFIG.AgentRegistry.abi,
    functionName: 'getOwnerAgents',
    args: ownerAddress ? [ownerAddress] : undefined,
    query: {
      enabled: !!ownerAddress,
    },
  });
}

/**
 * Hook to mint a new agent (ERC-7857 contract — bytes32 hashes, 7 args)
 */
export function useMintAgent() {
  const { writeContract, isPending, isSuccess, isError, data, error } = useWriteContract();

  const mintAgent = async (
    defaultRateWei: bigint,         // full wei, e.g. parseEther("0.01") — converted to uint32 /1e10
    profileCID: string,              // plain string, hashed to bytes32
    capabilityCID: string,           // capability manifest string, hashed to bytes32
    skillIds: `0x${string}`[],
    agentWallet: Address,
    eciesPubKey: `0x${string}`,
    sealedAesKey: `0x${string}` = "0x01"
  ) => {
    const profileHash = keccak256(toBytes(profileCID || "profile"));
    const capabilityHash = keccak256(toBytes(capabilityCID || "capability"));
    // Convert full wei to uint32 stored in 1e10-wei units (max ~42.9 OG)
    const defaultRate = Number(defaultRateWei / BigInt(10_000_000_000));

    writeContract({
      address: CONTRACT_CONFIG.AgentRegistry.address as Address,
      abi: CONTRACT_CONFIG.AgentRegistry.abi,
      functionName: 'mintAgent',
      args: [defaultRate, profileHash, capabilityHash, skillIds, agentWallet, eciesPubKey, sealedAesKey],
      gas: BigInt(2_000_000),
    });
  };

  return {
    mintAgent,
    isPending,
    isSuccess,
    isError,
    data,
    error,
  };
}
