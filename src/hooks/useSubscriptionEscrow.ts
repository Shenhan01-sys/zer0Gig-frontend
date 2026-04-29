import { useReadContract, useWriteContract } from "wagmi";
import { CONTRACT_CONFIG } from "@/lib/contracts";
import { Address, keccak256, toBytes } from "viem";
import { useTx } from "@/components/ui/TxToast";
import { parseContractError } from "@/lib/utils";

export function useSubscription(subscriptionId: bigint | number) {
  return useReadContract({
    address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
    abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
    functionName: "getSubscription",
    args: [BigInt(subscriptionId)],
  });
}

export function useClientSubscriptions(clientAddress: Address | undefined) {
  return useReadContract({
    address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
    abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
    functionName: "getClientSubscriptions",
    args: clientAddress ? [clientAddress] : undefined,
    query: { enabled: !!clientAddress },
  });
}

export function useSubscriptionBalance(subscriptionId: bigint | number) {
  return useReadContract({
    address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
    abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
    functionName: "getBalance",
    args: [BigInt(subscriptionId)],
  });
}

export function useTotalSubscriptions() {
  return useReadContract({
    address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
    abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
    functionName: "totalSubscriptions",
  });
}

export function useCreateSubscription() {
  const { writeContractAsync, isPending, isSuccess, isError, error, data: txHash } = useWriteContract();
  const tx = useTx();

  const createSubscription = async (
    agentId: bigint,
    taskDescription: string,
    intervalSeconds: bigint,
    checkInRate: bigint,
    alertRate: bigint,
    gracePeriodSeconds: bigint,
    x402Enabled: boolean,
    x402VerificationMode: number,
    clientX402Sig: `0x${string}`,
    webhookUrl: string,
    value: bigint
  ): Promise<`0x${string}` | undefined> => {
    const toastId = tx.start(`Create subscription · Agent #${agentId}`);
    const taskHash = taskDescription ? keccak256(toBytes(taskDescription)) : `0x${"00".repeat(32)}` as `0x${string}`;
    const webhookHash = webhookUrl ? keccak256(toBytes(webhookUrl)) : `0x${"00".repeat(32)}` as `0x${string}`;
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
        abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
        functionName: "createSubscription",
        args: [agentId, taskHash, Number(intervalSeconds), checkInRate, alertRate, Number(gracePeriodSeconds), x402Enabled, x402VerificationMode, clientX402Sig, webhookHash],
        value,
      });
      tx.broadcast(toastId, hash);
      return hash;
    } catch (err) {
      tx.fail(toastId, parseContractError(err));
      throw err;
    }
  };

  return { createSubscription, isPending, isSuccess, isError, error, txHash };
}

export function useTopUp() {
  const { writeContract, isPending, isSuccess, isError, data, error } = useWriteContract();

  const topUp = (subscriptionId: bigint, value: bigint) => {
    writeContract({
      address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
      abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
      functionName: "topUp",
      args: [subscriptionId],
      value,
    });
  };

  return { topUp, isPending, isSuccess, isError, data, error };
}

export function useCancelSubscription() {
  const { writeContract, isPending, isSuccess, isError, data, error } = useWriteContract();

  const cancelSubscription = (subscriptionId: bigint) => {
    writeContract({
      address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
      abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
      functionName: "cancelSubscription",
      args: [subscriptionId],
    });
  };

  return { cancelSubscription, isPending, isSuccess, isError, data, error };
}

export function useApproveInterval() {
  const { writeContract, isPending, isSuccess, isError, data, error } = useWriteContract();

  const approveInterval = (subscriptionId: bigint) => {
    writeContract({
      address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
      abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
      functionName: "approveInterval",
      args: [subscriptionId],
    });
  };

  return { approveInterval, isPending, isSuccess, isError, data, error };
}

export function useSetWebhookUrl() {
  const { writeContract, isPending, isSuccess, isError, data, error } = useWriteContract();

  const setWebhookUrl = (subscriptionId: bigint, webhookUrl: string) => {
    const webhookHash = webhookUrl ? keccak256(toBytes(webhookUrl)) : `0x${"00".repeat(32)}` as `0x${string}`;
    writeContract({
      address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
      abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
      functionName: "setWebhookHash",
      args: [subscriptionId, webhookHash],
    });
  };

  return { setWebhookUrl, isPending, isSuccess, isError, data, error };
}

export function useFinalizeExpired() {
  const { writeContract, isPending, isSuccess, isError, data, error } = useWriteContract();

  const finalizeExpired = (subscriptionId: bigint) => {
    writeContract({
      address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
      abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
      functionName: "finalizeExpired",
      args: [subscriptionId],
    });
  };

  return { finalizeExpired, isPending, isSuccess, isError, data, error };
}

export function useGetStatus(subscriptionId: bigint | number) {
  return useReadContract({
    address: CONTRACT_CONFIG.SubscriptionEscrow.address as Address,
    abi: CONTRACT_CONFIG.SubscriptionEscrow.abi,
    functionName: "getStatus",
    args: [BigInt(subscriptionId)],
  });
}
