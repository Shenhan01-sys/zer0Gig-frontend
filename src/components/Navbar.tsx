"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BorderGlow from "./BorderGlow/BorderGlow";

const navLinks = [
  { label: "Marketplace", href: "#marketplace" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Developers", href: "#developers" },
  { label: "Docs", href: "#docs" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-[120px] py-5">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="w-[187px] h-[25px] flex items-center">
            <span className="text-white text-xl font-semibold tracking-tight">
              DeAI<span className="text-white/40 font-light ml-1">FreelanceAgent</span>
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-[30px]">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="group flex items-center gap-[14px] text-white text-[14px] font-medium hover:text-white/80 transition-colors"
            >
              {link.label}
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-white/60 group-hover:text-white/80 transition-colors"
              >
                <path
                  d="M3.5 5.25L7 8.75L10.5 5.25"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          ))}
        </div>

        {/* Right: CTA Button */}
        <div className="hidden md:block">
          <BorderGlow
            edgeSensitivity={40}
            glowColor="200 80 80"
            backgroundColor="#000000"
            borderRadius={999}
            glowRadius={20}
            glowIntensity={0.8}
            coneSpread={30}
            colors={["#38bdf8", "#22d3ee", "#4ade80"]}
            fillOpacity={0.3}
          >
            <button className="px-[29px] py-[11px] text-white text-[14px] font-medium whitespace-nowrap">
              Launch App
            </button>
          </BorderGlow>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            {mobileOpen ? (
              <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-4 py-4 flex flex-col gap-4 border-t border-white/10"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-white text-[14px] font-medium hover:text-white/80"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <button className="mt-2 px-[29px] py-[11px] bg-white text-black text-[14px] font-medium rounded-full w-fit">
              Launch App
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
