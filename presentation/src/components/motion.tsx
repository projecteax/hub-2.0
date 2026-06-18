import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  })
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
};

type SlideFrameProps = {
  children: ReactNode;
  className?: string;
  align?: "center" | "start";
};

export function SlideFrame({ children, className = "", align = "center" }: SlideFrameProps) {
  return (
    <div
      className={`mx-auto flex w-full max-w-5xl flex-col ${
        align === "center" ? "items-center text-center" : "items-start text-left"
      } ${className}`}
    >
      {children}
    </div>
  );
}

type EyebrowProps = { children: ReactNode };

export function Eyebrow({ children }: EyebrowProps) {
  return (
    <motion.p
      className="mb-3 self-center text-center text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300"
      variants={fadeUp}
      custom={0}
    >
      {children}
    </motion.p>
  );
}

type SlideTitleProps = { children: ReactNode; className?: string };

export function SlideTitle({ children, className = "" }: SlideTitleProps) {
  return (
    <motion.h1
      className={`max-w-4xl self-center text-balance text-center text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl ${className}`}
      variants={fadeUp}
      custom={1}
    >
      {children}
    </motion.h1>
  );
}

type SlideSubtitleProps = { children: ReactNode; className?: string };

export function SlideSubtitle({ children, className = "" }: SlideSubtitleProps) {
  return (
    <motion.p
      className={`mt-4 max-w-3xl self-center text-balance text-center text-base leading-relaxed text-slate-400 md:text-lg ${className}`}
      variants={fadeUp}
      custom={2}
    >
      {children}
    </motion.p>
  );
}
