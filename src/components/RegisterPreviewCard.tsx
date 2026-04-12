"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const GRADIENTS = [
  "from-blue-500 to-cyan-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-500",
];

const PROVIDER_LABELS: Record<string, string> = {
  "0g_compute": "0G Compute",
  openai: "OpenAI",
  anthropic: "Anthropic",
  groq: "Groq",
  openrouter: "OpenRouter",
  alibaba: "Alibaba",
  google: "Google",
};

interface Props {
  displayName: string;
  bio: string;
  avatarUrl: string;
  selectedSkillLabels: string[];
  defaultRateOG: string;
  runtimeType: "self_hosted" | "platform_managed";
  llmProvider: string;
  ownerAddress: string;
}

export default function RegisterPreviewCard({
  displayName,
  bio,
  avatarUrl,
  selectedSkillLabels,
  defaultRateOG,
  runtimeType,
  llmProvider,
  ownerAddress,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const gradient = GRADIENTS[0];
  const name = displayName || "Your Agent Name";
  const shortAddr = ownerAddress
    ? `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`
    : "0x0000...0000";
  const rateLabel = defaultRateOG ? `${defaultRateOG} OG` : "— OG";
  const provLabel = PROVIDER_LABELS[llmProvider] ?? llmProvider;

  return (
    <motion.div
      className="sticky top-28 select-none"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 32 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.35 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
        <p className="text-[11px] text-white/30 uppercase tracking-widest font-medium">
          Live Preview
        </p>
      </div>

      <motion.div
        className="relative rounded-2xl border border-white/[0.12] bg-[#0d1525]/90 overflow-hidden flex flex-col shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <div className="h-[3px] w-full bg-gradient-to-r from-[#38bdf8] to-[#a855f7] to-[#22d3ee]" />

        <div className="flex flex-col items-center text-center px-7 pt-8 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-5">
            <AnimatePresence mode="wait">
              {runtimeType === "platform_managed" ? (
                <motion.span
                  key="platform"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20"
                >
                  Platform · {provLabel}
                </motion.span>
              ) : (
                <motion.span
                  key="self"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                >
                  Self-Hosted
                </motion.span>
              )}
            </AnimatePresence>
            <motion.span
              className="px-3 py-1 rounded-full text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Active
            </motion.span>
          </div>

          <motion.div
            className="mb-5"
            key={avatarUrl || "no-avatar"}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
          >
            <AnimatePresence mode="wait">
              {avatarUrl ? (
                <motion.div
                  key="avatar-image"
                  className="w-48 h-48 rounded-full overflow-hidden border-2 border-white/20 shadow-[0_0_32px_rgba(56,189,248,0.2)]"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={avatarUrl}
                    alt={name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="avatar-placeholder"
                  className={`w-28 h-28 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-[0_0_32px_rgba(56,189,248,0.2)]`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-white text-[28px] font-bold">?</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.h3
              key={displayName || "no-name"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className={`font-bold text-[22px] leading-tight mb-1 transition-colors ${
                displayName ? "text-white" : "text-white/20"
              }`}
            >
              {name}
            </motion.h3>
          </AnimatePresence>

          <motion.p
            className="text-white/30 text-[12px] font-mono mb-3"
            key={shortAddr}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {shortAddr}
          </motion.p>

          <AnimatePresence mode="wait">
            <motion.div
              key={bio || "no-bio"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: bio ? 1 : 0.4, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{ minHeight: "40px" }}
            >
              <p
                className={`text-[14px] leading-relaxed ${bio ? "text-white/55" : "text-white/20 italic"}`}
              >
                {bio || "Your agent bio will appear here..."}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-7 py-6 flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-white/35 uppercase tracking-wider">
                Reputation Score
              </span>
              <span className="text-white/30 text-[12px] font-medium">
                New Agent
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#22d3ee]"
                initial={{ width: 0 }}
                animate={{ width: "0%" }}
                transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.div
              className="bg-[#050810]/70 rounded-xl px-4 py-3"
              key={defaultRateOG || "no-rate"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">
                Rate / Task
              </p>
              <span
                className={`text-[18px] font-bold ${defaultRateOG ? "text-white" : "text-white/20"}`}
              >
                {rateLabel}
              </span>
            </motion.div>
            <div className="bg-[#050810]/70 rounded-xl px-4 py-3">
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-1">
                Jobs Done
              </p>
              <p className="text-[18px] text-white font-bold">0</p>
            </div>
          </div>

          <div className="min-h-[32px]">
            <AnimatePresence mode="popLayout">
              {selectedSkillLabels.length === 0 ? (
                <motion.p
                  key="no-skills"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[12px] text-white/20 italic text-center"
                >
                  No skills selected yet
                </motion.p>
              ) : (
                <motion.div
                  key="skills-container"
                  className="flex flex-wrap gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {selectedSkillLabels.slice(0, 6).map((label, i) => (
                    <motion.span
                      key={`${label}-${i}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      layout
                      transition={{ duration: 0.2 }}
                      className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/50"
                    >
                      {label}
                    </motion.span>
                  ))}
                  {selectedSkillLabels.length > 6 && (
                    <motion.span
                      key="extra-skills"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      layout
                      className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/30"
                    >
                      +{selectedSkillLabels.length - 6}
                    </motion.span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-3 pt-1">
            <div className="flex-1 px-4 py-2.5 bg-white/8 text-white/25 text-[13px] font-medium rounded-full text-center">
              Hire Agent
            </div>
            <div className="flex-1 px-4 py-2.5 border border-white/8 text-white/20 text-[13px] font-medium rounded-full text-center">
              Subscribe
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}