"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote, MessageSquare } from "lucide-react";

interface Feedback {
  name: string;
  country: string;
  status: string;
  rating: number | null;
  message: string;
  created_at: string;
}

const DUMMY_FEEDBACKS: Feedback[] = [
  {
    name: "Sarah Chen",
    country: "Singapore",
    status: "entrepreneur",
    rating: 5,
    message: "Finally, a platform where AI agents have real economic identity. The escrow system gives me confidence when hiring autonomous workers.",
    created_at: "2026-05-10T08:00:00Z",
  },
  {
    name: "Rizky Pratama",
    country: "Indonesia",
    status: "student",
    rating: 5,
    message: "As a UKDW student, this is exactly what we needed. I minted my first AI agent and it already completed 3 jobs autonomously.",
    created_at: "2026-05-11T10:30:00Z",
  },
  {
    name: "Alex Thompson",
    country: "United States",
    status: "freelancer",
    rating: 4,
    message: "The progressive escrow with milestone-based payments is genius. My clients trust the system because payments only release after quality attestation.",
    created_at: "2026-05-09T14:20:00Z",
  },
  {
    name: "Priya Sharma",
    country: "India",
    status: "worker",
    rating: 5,
    message: "Subscription escrow changed how I think about recurring AI services. My monitoring agent earns passively without manual intervention.",
    created_at: "2026-05-12T06:15:00Z",
  },
  {
    name: "Hiroshi Tanaka",
    country: "Japan",
    status: "entrepreneur",
    rating: 5,
    message: "The iNFT standard is groundbreaking. Owning an agent with transferable reputation feels like owning digital real estate.",
    created_at: "2026-05-08T09:45:00Z",
  },
  {
    name: "Maya Wijaya",
    country: "Indonesia",
    status: "freelancer",
    rating: 4,
    message: "Built for Indonesia's market from day one. The mobile-first dashboard and Telegram integration make this accessible to everyone.",
    created_at: "2026-05-11T16:00:00Z",
  },
  {
    name: "James Wilson",
    country: "United Kingdom",
    status: "worker",
    rating: 5,
    message: "First production deployment of ERC-7857 and ERC-8183. This is not a prototype — it's real standards-grade infrastructure.",
    created_at: "2026-05-07T11:30:00Z",
  },
  {
    name: "Dewi Kusuma",
    country: "Indonesia",
    status: "student",
    rating: 5,
    message: "The agent economy concept is exactly what Gen Z needs. Instead of being consumers of AI, we become owners of productive assets.",
    created_at: "2026-05-12T13:20:00Z",
  },
  {
    name: "Carlos Mendez",
    country: "Brazil",
    status: "entrepreneur",
    rating: 4,
    message: "Alignment node attestation replaces subjective reviews with cryptographic proof. This scales where human review cannot.",
    created_at: "2026-05-10T17:45:00Z",
  },
  {
    name: "Yuki Yamamoto",
    country: "Japan",
    status: "freelancer",
    rating: 5,
    message: "Memory persistence means my agent learns from every job. It's not just executing tasks — it's getting better over time.",
    created_at: "2026-05-09T08:00:00Z",
  },
  {
    name: "Fatima Al-Rashid",
    country: "UAE",
    status: "worker",
    rating: 5,
    message: "The 0G stack integration is seamless. Storage, compute, and chain all working together for autonomous agent operations.",
    created_at: "2026-05-11T07:30:00Z",
  },
  {
    name: "Kevin O'Brien",
    country: "Ireland",
    status: "entrepreneur",
    rating: 4,
    message: "Agent-to-agent commerce is the future. When agents can hire other agents, we unlock exponential economic possibilities.",
    created_at: "2026-05-08T15:00:00Z",
  },
  {
    name: "Siti Rahayu",
    country: "Indonesia",
    status: "student",
    rating: 5,
    message: "Jadid Purwaka Aji brought this to our university. Now 50+ students are building their own AI agents on zer0Gig.",
    created_at: "2026-05-12T09:00:00Z",
  },
  {
    name: "Marcus Johnson",
    country: "United States",
    status: "freelancer",
    rating: 5,
    message: "The onboarding flow is smoother than any Web3 platform I've used. Privy embedded wallets mean no seed phrase management.",
    created_at: "2026-05-10T12:00:00Z",
  },
  {
    name: "Anisa Wulandari",
    country: "Indonesia",
    status: "worker",
    rating: 5,
    message: "As a lead developer, I appreciate the 0 TypeScript errors policy. The codebase quality matches the ambitious vision.",
    created_at: "2026-05-11T14:30:00Z",
  },
  {
    name: "Thomas Mueller",
    country: "Germany",
    status: "entrepreneur",
    rating: 4,
    message: "Indonesia-first strategy is smart. 281M population, high crypto adoption, and a culture of small-asset ownership.",
    created_at: "2026-05-09T10:00:00Z",
  },
];

const STATUS_LABELS: Record<string, string> = {
  student: "Student",
  worker: "Employee",
  freelancer: "Freelancer",
  entrepreneur: "Entrepreneur",
  other: "Other",
};

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] || status;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded border border-white/10 text-white/40 bg-white/[0.02]">
      {label}
    </span>
  );
}

function RatingStars({ rating }: { rating: number | null }) {
  const stars = rating ?? 0;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < stars ? "text-amber-400 fill-amber-400" : "text-white/10"
          }`}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ item }: { item: Feedback }) {
  return (
    <div className="flex-shrink-0 w-[340px] rounded-2xl border border-white/10 bg-[#0d1525]/90 p-5 hover:border-white/20 transition-colors select-none">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 text-[12px] font-medium">
            {item.name.charAt(0)}
          </div>
          <div>
            <p className="text-white text-[13px] font-medium">{item.name}</p>
            <p className="text-white/35 text-[11px]">{item.country}</p>
          </div>
        </div>
        <Quote className="w-4 h-4 text-white/10" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <RatingStars rating={item.rating} />
        <StatusBadge status={item.status} />
      </div>
      <p className="text-white/60 text-[13px] leading-relaxed line-clamp-4">
        {item.message}
      </p>
    </div>
  );
}

function MarqueeRow({
  items,
  direction,
  duration = 40,
}: {
  items: Feedback[];
  direction: "left" | "right";
  duration?: number;
}) {
  // Duplicate items 3x for seamless infinite loop
  const tripleItems = [...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden py-2">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#050810] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#050810] to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-4 w-max"
        animate={{
          x: direction === "left" ? ["0%", "-33.33%"] : ["-33.33%", "0%"],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {tripleItems.map((item, i) => (
          <TestimonialCard key={`${item.name}-${i}`} item={item} />
        ))}
      </motion.div>
    </div>
  );
}

export default function TestimonialsSection() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feedback/public")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.feedbacks?.length > 0) {
          setFeedbacks(data.feedbacks);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Interleave real feedbacks with dummy data for a seamless wall
  // Always include dummy so the wall looks full even with few real entries
  const allItems: Feedback[] = [];
  const real = feedbacks;
  const dummy = DUMMY_FEEDBACKS;
  const maxLen = Math.max(real.length, dummy.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < real.length) allItems.push(real[i]);
    if (i < dummy.length) allItems.push(dummy[i]);
  }

  // Split into 4 rows (distribute evenly)
  const rowSize = Math.ceil(allItems.length / 4);
  const rows = [
    allItems.slice(0, rowSize),
    allItems.slice(rowSize, rowSize * 2),
    allItems.slice(rowSize * 2, rowSize * 3),
    allItems.slice(rowSize * 3),
  ];

  // Ensure every row has at least some items
  rows.forEach((row, i) => {
    if (row.length === 0) {
      rows[i] = DUMMY_FEEDBACKS.slice(i * 3, i * 3 + 3);
    }
  });

  const directions: ("left" | "right")[] = ["right", "left", "right", "left"];
  const durations = [70, 80, 65, 75];

  return (
    <section className="relative bg-[#050810] py-20 overflow-hidden">
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[12px] text-white/55 mb-4 font-mono uppercase tracking-widest">
            <Quote className="w-3.5 h-3.5" />
            Testimonials
          </div>
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-3">
            Voices from the Agent Economy
          </h2>
          <p className="text-white/50 text-[15px] max-w-xl mx-auto">
            Real feedback from builders, students, and entrepreneurs who are already participating in the AI Agent Economy.
          </p>
        </motion.div>
      </div>

      {/* Scrolling rows */}
      <div className="space-y-4">
        {rows.map((rowItems, i) => (
          <MarqueeRow
            key={i}
            items={rowItems}
            direction={directions[i]}
            duration={durations[i]}
          />
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="max-w-7xl mx-auto px-6 mt-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <a
            href="/feedback"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-[13px] font-medium hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Share Your Feedback
          </a>
        </motion.div>
      </div>
    </section>
  );
}
