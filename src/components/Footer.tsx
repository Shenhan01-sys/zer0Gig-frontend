"use client";

import { motion } from "framer-motion";

const links = [
  { label: "Docs", href: "#docs" },
  { label: "GitHub", href: "https://github.com" },
  { label: "0G Chain", href: "https://0g.ai" },
];

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative border-t border-white/[0.06]"
    >
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <span className="text-white text-[15px] font-semibold tracking-tight">
            DeAI<span className="text-white/40 font-light ml-1">FreelanceAgent</span>
          </span>
        </div>

        {/* Center: Links */}
        <div className="flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[13px] text-white/40 hover:text-white/70 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: Hackathon label */}
        <div className="text-[12px] text-white/25">
          Built for 0G APAC Hackathon 2026
        </div>
      </div>
    </motion.footer>
  );
}
