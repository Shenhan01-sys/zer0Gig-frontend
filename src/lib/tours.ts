import type { TourStep } from "@/components/GuidedTour";

// ─────────────────────────────────────────────────────────────────────────────
// Tour content registry. Each step optionally targets a real UI element via
// `target` (a CSS selector — convention: `[data-tour-id="..."]`). The matching
// element gets a glowing cyan spotlight and the card auto-positions next to
// it. Steps without `target` show as a centered/bottom-right card with a
// full-screen dim.
// ─────────────────────────────────────────────────────────────────────────────

export interface TourDefinition {
  badge?: string;
  steps:  TourStep[];
}

export const TOURS: Record<string, TourDefinition> = {

  // ── Dashboard overview ────────────────────────────────────────────────────
  dashboard: {
    badge: "Dashboard",
    steps: [
      {
        title: "Your zer0Gig workspace",
        body:  "Mission control — jobs, subscriptions, agents you own, and the marketplace all start here. Quick tour in 30 seconds.",
      },
      {
        title: "Role-aware tabs",
        body:  "Clients see My Jobs + Subscriptions. Agent Owners get Find Jobs, My Proposals, My Agents. The tab strip changes based on your role.",
        target: "[data-tour-id='dashboard-tabs']",
      },
      {
        title: "Quick actions",
        body:  "+ New Job (clients), + Register Agent (owners), + Subscribe, and the Harvest pill in the nav. The primary buttons up top always reflect what you can do.",
        target: "[data-tour-id='dashboard-actions']",
      },
      {
        title: "Switch role anytime",
        body:  "The wallet pill on the right shows your connected address. Disconnect and reconnect with a different wallet to switch roles instantly.",
        target: "[data-tour-id='nav-wallet']",
      },
      {
        title: "Need help later?",
        body:  "The Guide button in the nav reopens this tour anytime. One click = back here.",
        target: "[data-tour-id='nav-guide']",
      },
    ],
  },

  // ── Withdraw / Harvest yield ───────────────────────────────────────────────
  withdraw: {
    badge: "Harvest Yield",
    steps: [
      {
        title: "Two paths, one outcome",
        body:  "Your agent earns OG into two pools: keyless Vault (preferred — on-chain ownership gate, no private keys) and legacy Wallet (server env config).",
        target: "[data-tour-id='balance-tiles']",
      },
      {
        title: "Switch agents",
        body:  "Multiple iNFTs? Pick which one to harvest from. The holographic core swaps to the selected agent's avatar.",
        target: "[data-tour-id='agent-switcher']",
      },
      {
        title: "Top up the vault",
        body:  "Vault empty? Tap '+ Top up vault' to deposit OG directly. Anyone can fund any agent — useful for demo or self-tipping.",
        target: "[data-tour-id='vault-deposit']",
      },
      {
        title: "Where the funds land",
        body:  "Destination defaults to your connected wallet. Override to any 0x address — the contract will send OG there.",
        target: "[data-tour-id='withdraw-destination']",
      },
      {
        title: "Harvest = one signature",
        body:  "Type amount, hit Harvest, sign in your wallet. Vault path is fully on-chain — your tx, your funds, your control. Receipt links to chainscan.",
        target: "[data-tour-id='harvest-button']",
      },
    ],
  },

  // ── Register agent wizard ──────────────────────────────────────────────────
  registerAgent: {
    badge: "Register Agent",
    steps: [
      {
        title: "Mint your AI agent as an iNFT",
        body:  "ERC-7857 mint flow. You'll set rates, declare skills, wire tools, and the agent gets its own autonomous wallet.",
      },
      {
        title: "Agent wallet ≠ your wallet",
        body:  "ERC-7857 requires the agent's signing address to differ from yours. Use any wallet you control or let the form generate a fresh keypair.",
        target: "[data-tour-id='agent-wallet-input']",
      },
      {
        title: "SAVE the generated key",
        body:  "If the form generates a key, copy it immediately. It's NOT stored on our side. The vault path is keyless, but the legacy fallback needs that key.",
        target: "[data-tour-id='agent-key-box']",
      },
      {
        title: "Mint → live in seconds",
        body:  "Submit → wallet signs → tx confirms → agent shows up in My Agents + the public marketplace. Reputation starts at 80% win rate, builds from there.",
        target: "[data-tour-id='register-submit']",
      },
    ],
  },

  // ── Create job (client) ────────────────────────────────────────────────────
  createJob: {
    badge: "Post a Job",
    steps: [
      {
        title: "Post a job to the swarm",
        body:  "Define what you want done, who can do it, and how much you'll pay. The right agent finds your job and pitches.",
      },
      {
        title: "Milestone budget",
        body:  "Total budget splits across milestones. Escrow holds OG until each milestone's alignment attestation passes (≥80% score). No score, no payout.",
      },
      {
        title: "Submit → on-chain escrow",
        body:  "Sign once, OG locks into ProgressiveEscrow. Refund window opens immediately if no one accepts. Welcome to trustless hiring.",
      },
    ],
  },

  // ── Create subscription (client) ───────────────────────────────────────────
  createSubscription: {
    badge: "New Subscription",
    steps: [
      {
        title: "Recurring agent work",
        body:  "Subscriptions are ERC-8183 recurring escrow. Agent does X every interval (60s / hourly / daily), drains a fixed amount of OG per cycle.",
      },
      {
        title: "Top up initial balance",
        body:  "Pre-fund the subscription so it doesn't pause when you sleep. Balance decreases per tick until empty, then the agent stops until you top up.",
      },
      {
        title: "Submit → autonomous runtime",
        body:  "Sign once, the agent-runtime takes over. Logs, payouts, alignment attestations all run without you. Cancel anytime by burning the subscription.",
      },
    ],
  },

  // ── Find jobs (agent owner) ────────────────────────────────────────────────
  findJobs: {
    badge: "Find Jobs",
    steps: [
      {
        title: "Open jobs waiting for proposals",
        body:  "Clients posted these and didn't target a specific agent. Pitch your agent and win the work.",
      },
      {
        title: "Click a job to see details",
        body:  "Budget, milestones, required skills, client wallet. The full brief lives on the detail page.",
      },
      {
        title: "Submit a proposal",
        body:  "Pick which agent pitches, set a rate (≤ budget), one-line pitch. Goes into My Proposals after submission.",
      },
    ],
  },

  // ── Job detail (active job + chat) ─────────────────────────────────────────
  jobDetail: {
    badge: "Job Details",
    steps: [
      {
        title: "Where the work happens",
        body:  "Full job spec, escrow status, milestone timeline, and the chat where client + agent coordinate. Real-time updates from on-chain events.",
      },
      {
        title: "Milestones unlock payouts",
        body:  "Each milestone gets its own alignment attestation. Score ≥ 80% → OG releases. Below → milestone fails, refund window opens.",
      },
      {
        title: "Chat with the agent",
        body:  "JobChat is the human-readable layer over on-chain coordination. Both parties see the same thread, persisted in Supabase.",
      },
    ],
  },

  // ── My proposals ──────────────────────────────────────────────────────────
  myProposals: {
    badge: "My Proposals",
    steps: [
      {
        title: "Proposals you've submitted",
        body:  "Every pitch your agents made — pending, accepted, rejected. Click any to see the original job + chat thread.",
      },
      {
        title: "Status flow",
        body:  "Pending → Accepted (client picked your agent, escrow locks) → Working (milestones in flight) → Completed (payout finalized).",
      },
    ],
  },

  // ── Agent detail ──────────────────────────────────────────────────────────
  agentDetail: {
    badge: "Agent Management",
    steps: [
      {
        title: "Your agent's command center",
        body:  "Identity, skills, tools, earnings, and the encrypted blob in 0G Storage all live here. Edits trigger oracle re-encryption on transfer.",
      },
      {
        title: "Update without transferring",
        body:  "Edit skills, tools, system prompt → updateCapability fires the oracle, rotates the AES key, re-uploads to 0G Storage. No ownership change.",
      },
      {
        title: "List for sale",
        body:  "Ready to flip? Sell as Transfer (carries reputation) or Clone (resets to default). Listings show on /marketplace/agents-for-sale.",
      },
      {
        title: "Earnings + history",
        body:  "Total earnings, jobs completed, win rate all live on-chain. The Harvest button in the navbar pulls accumulated OG into your owner wallet.",
      },
    ],
  },

  // ── My listings (selling) ─────────────────────────────────────────────────
  myListings: {
    badge: "My Listings",
    steps: [
      {
        title: "Agents you've put up for sale",
        body:  "Active listings on AgentMarketplace. Each shows price, mode (Transfer / Clone), and any pending buyer escrow.",
      },
      {
        title: "Two-step settlement",
        body:  "Buyer pays → you execute iTransfer / iClone with the new encryption params → anyone calls completeTransfer/Clone to release escrow to you.",
      },
      {
        title: "7-day refund window",
        body:  "If you don't execute within 7 days, the buyer can call refundExpired and reclaim their OG. Don't leave pending sales hanging.",
      },
    ],
  },

  // ── My purchases (buyer tracking) ─────────────────────────────────────────
  myPurchases: {
    badge: "My Purchases",
    steps: [
      {
        title: "Your agent buys",
        body:  "Everything you've bought from AgentMarketplace, tracked from escrow → transfer → completion.",
      },
      {
        title: "Status badges",
        body:  "Pending = waiting for seller to execute. In-flight = transfer done, escrow settling. Complete = iNFT is in your wallet, earnings start flowing.",
      },
      {
        title: "Refund expired purchases",
        body:  "Seller didn't deliver within 7 days? Click Refund to reclaim your OG. Trustless escrow protects you.",
      },
    ],
  },

  // ── Marketplace ───────────────────────────────────────────────────────────
  marketplace: {
    badge: "Marketplace",
    steps: [
      {
        title: "Hire AI agents",
        body:  "Browse agents available for work. Filter by skill, sort by reputation, dive into any agent's track record.",
      },
      {
        title: "Two ways to engage",
        body:  "Hire (one-shot job via ProgressiveEscrow) or Subscribe (recurring drain via SubscriptionEscrow). Cards show both CTAs.",
      },
      {
        title: "Want to buy the agent itself?",
        body:  "Tap 'Buy Agents' in the nav for the iNFT marketplace — transfer ownership of mature agents instead of just renting their work.",
      },
    ],
  },

  // ── Buy agents (iNFT marketplace) ─────────────────────────────────────────
  buyAgents: {
    badge: "iNFT Marketplace",
    steps: [
      {
        title: "Buy mature AI agents",
        body:  "These are real ERC-7857 iNFTs on 0G Newton — running agents with track record, skills, and reputation.",
      },
      {
        title: "Transfer vs Clone",
        body:  "Transfer = you get the original agent plus its full reputation. Clone = fresh copy with the same capability but a clean slate.",
      },
      {
        title: "Buying flow",
        body:  "Click Buy → review → keygen → oracle sign → confirm → settle. Escrow holds your funds for 7 days as a refund window.",
      },
    ],
  },

  // ── Agent listing detail (single buy page) ────────────────────────────────
  agentListingDetail: {
    badge: "Agent Listing",
    steps: [
      {
        title: "Full agent disclosure",
        body:  "Every metric the seller has — capability hash, sealed key history, all skills, full reputation. Take your time.",
      },
      {
        title: "Mode determines reputation",
        body:  "Transfer keeps the seller's track record. Clone resets to default. Same agent intelligence, different starting trust.",
      },
      {
        title: "Buy flow — 5 steps",
        body:  "Review → keygen (your fresh ECIES key) → oracle (server signs the re-encryption) → confirm (you pay into escrow) → wait (seller executes iTransfer).",
      },
    ],
  },

  // ── Leaderboard ───────────────────────────────────────────────────────────
  leaderboard: {
    badge: "Leaderboard",
    steps: [
      {
        title: "The agent reputation board",
        body:  "Top agents ranked by jobs completed, win rate, and total OG earned. All numbers pulled live from AgentRegistry — no fake stats.",
      },
      {
        title: "Sort + filter",
        body:  "Pick the dimension you care about: most jobs, highest win rate, biggest earner. Switching sort surfaces different leaders.",
      },
      {
        title: "Click to inspect",
        body:  "Every row links to the agent's detail page. Hire them, subscribe to them, or buy the iNFT itself if they're listed.",
      },
    ],
  },
};

// Pathname prefix → tour key. Longest match wins.
export const PATH_TO_TOUR: Array<{ match: string; key: string }> = [
  { match: "/dashboard/withdraw",          key: "withdraw"           },
  { match: "/dashboard/register-agent",    key: "registerAgent"      },
  { match: "/dashboard/create-job",        key: "createJob"          },
  { match: "/dashboard/create-subscription", key: "createSubscription" },
  { match: "/dashboard/jobs/",             key: "jobDetail"          },
  { match: "/dashboard/jobs",              key: "findJobs"           },
  { match: "/dashboard/my-proposals",      key: "myProposals"        },
  { match: "/dashboard/my-listings",       key: "myListings"         },
  { match: "/dashboard/my-purchases",      key: "myPurchases"        },
  { match: "/dashboard/agents/",           key: "agentDetail"        },
  { match: "/dashboard",                   key: "dashboard"          },
  { match: "/marketplace/agents-for-sale/", key: "agentListingDetail" },
  { match: "/marketplace/agents-for-sale", key: "buyAgents"          },
  { match: "/marketplace",                 key: "marketplace"        },
  { match: "/leaderboard",                 key: "leaderboard"        },
];

export function tourKeyForPath(pathname: string): string | null {
  let best: { key: string; len: number } | null = null;
  for (const entry of PATH_TO_TOUR) {
    if (pathname.startsWith(entry.match) && (!best || entry.match.length > best.len)) {
      best = { key: entry.key, len: entry.match.length };
    }
  }
  return best?.key ?? null;
}
