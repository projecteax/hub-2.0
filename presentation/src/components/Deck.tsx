import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SlideContent } from "./SlideContent";
import { SECTION_COLORS, SLIDES } from "../slides";

export function Deck() {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const total = SLIDES.length;
  const slide = SLIDES[index];
  const progress = ((index + 1) / total) * 100;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.min(Math.max(i + delta, 0), total - 1));
    },
    [total]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      }
      if (e.key === "Home") {
        e.preventDefault();
        setIndex(0);
      }
      if (e.key === "End") {
        e.preventDefault();
        setIndex(total - 1);
      }
      if (e.key === "f") {
        void toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, total]);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }

  useEffect(() => {
    function onFsChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const gradient = SECTION_COLORS[slide.section] ?? "from-indigo-500/20";

  return (
    <div className="relative flex h-full flex-col">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          key={slide.section}
          className={`absolute -left-1/4 -top-1/4 h-[70vh] w-[70vh] rounded-full bg-gradient-to-br ${gradient} to-transparent blur-3xl`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        />
        <div className="absolute -bottom-1/4 -right-1/4 h-[50vh] w-[50vh] rounded-full bg-gradient-to-tl from-sky-500/10 to-transparent blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "64px 64px"
          }}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
            {slide.section}
          </span>
          <span className="hidden text-xs text-slate-500 sm:inline">
            {index + 1} / {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Toggle fullscreen"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Progress */}
      <div className="relative z-10 mx-6 h-0.5 overflow-hidden rounded-full bg-white/10 md:mx-10">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-400 to-sky-400"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Slide area */}
      <main className="relative z-10 flex flex-1 items-center justify-center overflow-hidden px-6 py-6 md:px-10 md:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            className="flex w-full max-w-6xl justify-center"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <SlideContent slide={slide} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Nav */}
      <footer className="relative z-10 flex items-center justify-between px-6 pb-6 md:px-10 md:pb-8">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="hidden items-center gap-1.5 md:flex">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-indigo-400" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === total - 1}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-30"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      </footer>

      {/* Click zones for presentation */}
      <button
        type="button"
        className="absolute left-0 top-0 z-0 h-full w-1/4 cursor-w-resize opacity-0"
        onClick={() => go(-1)}
        disabled={index === 0}
        aria-label="Previous slide"
      />
      <button
        type="button"
        className="absolute right-0 top-0 z-0 h-full w-1/4 cursor-e-resize opacity-0"
        onClick={() => go(1)}
        disabled={index === total - 1}
        aria-label="Next slide"
      />

      <p className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-[10px] text-slate-600 md:block">
        Arrow keys · Space · F fullscreen
      </p>
    </div>
  );
}
