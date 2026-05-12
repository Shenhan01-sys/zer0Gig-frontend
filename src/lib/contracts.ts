// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYED CONTRACT ADDRESSES (0G Newton Testnet - Chain ID: 16602)
// Deployed: 2026-03-31
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT ABIs (Imported from Hardhat artifacts)
// ─────────────────────────────────────────────────────────────────────────────

import AgentRegistryABI from './abis/AgentRegistry.json';
import ProgressiveEscrowABI from './abis/ProgressiveEscrow.json';
import SubscriptionEscrowABI from './abis/SubscriptionEscrow.json';
import UserRegistryABI from './abis/UserRegistry.json';
import AgentMarketplaceABI from './abis/AgentMarketplace.json';
import { type Abi } from 'viem';

export const AGENT_REGISTRY_ABI = AgentRegistryABI.abi as Abi;
export const PROGRESSIVE_ESCROW_ABI = ProgressiveEscrowABI.abi as Abi;
export const SUBSCRIPTION_ESCROW_ABI = SubscriptionEscrowABI.abi as Abi;
export const USER_REGISTRY_ABI = UserRegistryABI.abi as Abi;
export const AGENT_MARKETPLACE_ABI = AgentMarketplaceABI.abi as Abi;

// ─────────────────────────────────────────────────────────────────────────────
// SKILL IDS (Well-known keccak256 hashes)
// ─────────────────────────────────────────────────────────────────────────────

export const SKILL_IDS = {
  solidityDev:     "0x8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b" as const,
  frontendDev:     "0x2c5d2e1e0b72e9f9f6c3e0c1d2a1b0a9f8e7d6c5b4a392817060504030201000" as const,
  webSearch:       "0x5c6b7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e00" as const,
  codeExecution:   "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d00" as const,
  dataAnalysis:    "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a00" as const,
  contentWriting:  "0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f00" as const,
  imageGeneration: "0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c00" as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYED CONTRACT ADDRESSES (0G Newton Testnet - Chain ID: 16602)
// Deployed: 2026-04-28 (ERC-7857 + ERC-8183 migration)
// Deployer: 0x48379F4d1427209311E9FF0bcC4a354953ea631B
// ─────────────────────────────────────────────────────────────────────────────

export const CONTRACT_ADDRESSES = {
  AgentRegistry: "0x4c49D008E72eF1E098Bcd6E75857Ed17377dB4ab",
  ProgressiveEscrow: "0xe9d1d260c08385b3beB68012D425e208b4cd2295",
  SubscriptionEscrow: "0x088400FFf9d37851173e22eef904e710B88F6312",
  UserRegistry: "0x1958bdbb5926674026b9ac630c9A4Cb91718Aee7",
  // TODO: Replace with deployed address after running scripts/deploy-marketplace.js.
  // Frontend will compile against this zero address but buyAgent / completeTransfer
  // calls will revert until a real deployment is wired in.
  AgentMarketplace: "0x0000000000000000000000000000000000000000",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// WAGMI CONTRACT CONFIG (Type-safe)
// ─────────────────────────────────────────────────────────────────────────────

export const CONTRACT_CONFIG = {
  AgentRegistry: {
    address: CONTRACT_ADDRESSES.AgentRegistry,
    abi: AGENT_REGISTRY_ABI,
  },
  ProgressiveEscrow: {
    address: CONTRACT_ADDRESSES.ProgressiveEscrow,
    abi: PROGRESSIVE_ESCROW_ABI,
  },
  SubscriptionEscrow: {
    address: CONTRACT_ADDRESSES.SubscriptionEscrow,
    abi: SUBSCRIPTION_ESCROW_ABI,
  },
  UserRegistry: {
    address: CONTRACT_ADDRESSES.UserRegistry,
    abi: USER_REGISTRY_ABI,
  },
  AgentMarketplace: {
    address: CONTRACT_ADDRESSES.AgentMarketplace,
    abi: AGENT_MARKETPLACE_ABI,
  },
} as const;

export type ContractName = keyof typeof CONTRACT_CONFIG;

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export const NETWORK_CONFIG = {
  chainId: 16602,
  chainName: '0G Newton Testnet',
  rpcUrl: 'https://rpc-testnet.0g.ai',
  blockExplorer: 'https://scan-testnet.0g.ai',
  nativeCurrency: {
    name: 'OG',
    symbol: 'OG',
    decimals: 18,
  },
} as const;
