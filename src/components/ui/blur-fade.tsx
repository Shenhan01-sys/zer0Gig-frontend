"use client";

import { motion } from "framer-motion";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
  blur?: string;
}

export function BlurFade({
  children,
  className,
  delay = 0,
  yOffset = 6,
  blur = "5px",
}: BlurFadeProps) {
  return (
    <motion.div
      initial={{ y: yOffset, opacity: 0, filter: `blur(${blur})` }}
      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{
        delay: 0.04 + delay,
        duration: 0.45,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
