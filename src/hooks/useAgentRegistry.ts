import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_CONFIG } from '../lib/contracts';
import { Address } from 'viem';

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
 * Hook to mint a new agent
 */
export function useMintAgent() {
  const { writeContract, isPending, isSuccess, isError, data, error } = useWriteContract();

  const mintAgent = async (
    agentType: number,
    baseRate: bigint,
    resumeCID: string,
    agentWallet: Address,
    eciesPublicKey: string
  ) => {
    // Ensure the public key is formatted as a hex string for bytes
    const pubKeyHex = eciesPublicKey.startsWith('0x') ? eciesPublicKey : `0x${eciesPublicKey}`;
    
    writeContract({
      address: CONTRACT_CONFIG.AgentRegistry.address as Address,
      abi: CONTRACT_CONFIG.AgentRegistry.abi,
      functionName: 'mintAgent',
      args: [
        agentType,
        baseRate,
        resumeCID,
        agentWallet,
        pubKeyHex as `0x${string}`
      ],
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
