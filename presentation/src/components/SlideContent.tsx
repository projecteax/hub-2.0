import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ExternalLink,
  ImageIcon,
  X
} from "lucide-react";
import type { DiagramNode, Slide } from "../slides";
import { fadeUp, SlideFrame, staggerContainer } from "./motion";
import { SlideBody, SlideHeader } from "./slide-header";

type Props = { slide: Slide };

const nodeTones: Record<NonNullable<DiagramNode["tone"]>, string> = {
  ai: "border-violet-500/40 bg-violet-500/15 text-violet-200",
  human: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  neutral: "border-white/15 bg-white/5 text-slate-200",
  warn: "border-amber-500/40 bg-amber-500/15 text-amber-200",
  success: "border-sky-500/40 bg-sky-500/15 text-sky-200"
};

export function SlideContent({ slide }: Props) {
  switch (slide.layout) {
    case "title":
      return <TitleSlide slide={slide} />;
    case "agenda":
      return <AgendaSlide slide={slide} />;
    case "statement":
      return <StatementSlide slide={slide} />;
    case "stats":
      return <StatsSlide slide={slide} />;
    case "evaluation":
      return <EvaluationSlide slide={slide} />;
    case "ladder":
      return <LadderSlide slide={slide} />;
    case "insights":
    case "pillars":
      return <CardsSlide slide={slide} columns={3} />;
    case "split":
      return <SplitSlide slide={slide} />;
    case "poc-honest":
      return <PocHonestSlide slide={slide} />;
    case "diagram":
      return <DiagramSlide slide={slide} />;
    case "hybrid-ramp":
      return <HybridRampSlide slide={slide} />;
    case "calibration":
      return <CalibrationSlide slide={slide} />;
    case "roadmap":
      return <RoadmapSlide slide={slide} />;
    case "crossfunctional":
      return <CrossFunctionalSlide slide={slide} />;
    case "ownership":
      return <OwnershipSlide slide={slide} />;
    case "demo":
      return <DemoSlide slide={slide} />;
    case "close":
      return <CloseSlide slide={slide} />;
    default:
      return <StatementSlide slide={slide} />;
  }
}

function TitleSlide({ slide }: Props) {
  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex w-full flex-col items-center text-center">
        <SlideHeader
          eyebrow={slide.eyebrow}
          title={slide.title}
          subtitle={slide.subtitle}
          titleClassName="!text-5xl md:!text-7xl lg:!text-8xl"
          subtitleClassName="!max-w-2xl !text-lg md:!text-xl"
        />
        <motion.div className="mt-14 flex items-center gap-2 text-sm text-slate-500" variants={fadeUp} custom={3}>
          <span>Press</span>
          <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs">→</kbd>
          <span>to begin</span>
        </motion.div>
      </motion.div>
    </SlideFrame>
  );
}

function AgendaSlide({ slide }: Props) {
  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} />
        <motion.ol className="mx-auto mt-10 max-w-xl space-y-4 text-left">
          {slide.bullets?.map((b, i) => (
            <motion.li
              key={b}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4"
              variants={fadeUp}
              custom={i + 3}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/30 text-xs font-bold text-indigo-200">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-slate-300 md:text-base">{b}</span>
            </motion.li>
          ))}
        </motion.ol>
      </motion.div>
    </SlideFrame>
  );
}

function StatementSlide({ slide }: Props) {
  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} subtitle={slide.subtitle} />
        {slide.bullets ? (
          <motion.ul className="mx-auto mt-8 max-w-2xl space-y-3 text-left">
            {slide.bullets.map((b, i) => (
              <motion.li
                key={b}
                className="flex items-center gap-3 text-sm text-slate-300 md:text-base"
                variants={fadeUp}
                custom={i + 3}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                {b}
              </motion.li>
            ))}
          </motion.ul>
        ) : null}
      </motion.div>
    </SlideFrame>
  );
}

function StatsSlide({ slide }: Props) {
  const accents: Record<string, string> = {
    indigo: "from-indigo-500/30 to-indigo-500/5 border-indigo-500/30",
    sky: "from-sky-500/30 to-sky-500/5 border-sky-500/30",
    emerald: "from-emerald-500/30 to-emerald-500/5 border-emerald-500/30",
    rose: "from-rose-500/30 to-rose-500/5 border-rose-500/30",
    amber: "from-amber-500/30 to-amber-500/5 border-amber-500/30"
  };

  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} titleClassName="mb-8" />
        <SlideBody className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
          {slide.stats?.map((stat, i) => (
            <motion.div
              key={stat.label}
              className={`rounded-2xl border bg-gradient-to-br p-6 text-center ${accents[stat.accent ?? "indigo"]}`}
              variants={fadeUp}
              custom={i + 2}
            >
              <p className="text-3xl font-semibold text-white md:text-4xl">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </SlideBody>
      </motion.div>
    </SlideFrame>
  );
}

function EvaluationSlide({ slide }: Props) {
  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} subtitle={slide.subtitle} />
        <SlideBody className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-3">
          {slide.evaluationSteps?.map((step, i) => (
            <motion.div
              key={step.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left"
              variants={fadeUp}
              custom={i + 3}
            >
              <span className="text-xs font-bold text-indigo-400">0{i + 1}</span>
              <h3 className="mt-2 font-semibold text-white">{step.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
            </motion.div>
          ))}
        </SlideBody>
      </motion.div>
    </SlideFrame>
  );
}

function LadderSlide({ slide }: Props) {
  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} subtitle={slide.subtitle} />
        <SlideBody className="mx-auto mt-8 flex max-w-4xl flex-col items-center gap-3 md:flex-row md:items-stretch">
          {slide.items?.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.title} className="flex flex-1 items-stretch gap-2" variants={fadeUp} custom={i + 3}>
                <div className="flex flex-1 flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-sm">
                  {Icon ? (
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                      <Icon className="h-5 w-5" />
                    </div>
                  ) : null}
                  {item.tag ? (
                    <span className="mb-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">{item.tag}</span>
                  ) : null}
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.body}</p>
                </div>
                {i < (slide.items?.length ?? 0) - 1 ? (
                  <ChevronRight className="hidden h-5 w-5 shrink-0 self-center text-slate-600 md:block" />
                ) : null}
              </motion.div>
            );
          })}
        </SlideBody>
      </motion.div>
    </SlideFrame>
  );
}

function CardsSlide({ slide, columns }: Props & { columns: number }) {
  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} titleClassName="mb-8" />
        <SlideBody
          className="mx-auto grid max-w-4xl gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } as CSSProperties}
        >
          {slide.items?.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-5 text-center"
                variants={fadeUp}
                custom={i + 2}
              >
                {item.tag ? (
                  <span className="mb-3 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-medium text-indigo-300">
                    {item.tag}
                  </span>
                ) : null}
                {Icon ? (
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-indigo-300">
                    <Icon className="h-5 w-5" />
                  </div>
                ) : null}
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.body}</p>
              </motion.div>
            );
          })}
        </SlideBody>
      </motion.div>
    </SlideFrame>
  );
}

function SplitSlide({ slide }: Props) {
  const tones: Record<string, string> = {
    in: "border-emerald-500/25 bg-emerald-500/5",
    out: "border-slate-500/25 bg-white/3",
    warn: "border-amber-500/25 bg-amber-500/5",
    neutral: "border-white/10 bg-white/5"
  };

  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} titleClassName="mb-8" />
        <SlideBody className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          {slide.columns?.map((col, ci) => (
            <motion.div
              key={col.heading}
              className={`rounded-2xl border p-5 text-left ${tones[col.tone ?? "neutral"]}`}
              variants={fadeUp}
              custom={ci + 2}
            >
              <h3 className="mb-3 text-center text-sm font-semibold uppercase tracking-wider text-slate-300">
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-300">
                    <span
                      className={`mt-2 h-1 w-1 shrink-0 rounded-full ${col.tone === "in" ? "bg-emerald-400" : "bg-slate-500"}`}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </SlideBody>
      </motion.div>
    </SlideFrame>
  );
}

function PocHonestSlide({ slide }: Props) {
  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} subtitle={slide.subtitle} />
        <SlideBody className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
          <motion.div
            className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 text-left"
            variants={fadeUp}
            custom={3}
          >
            <h3 className="mb-3 text-center text-sm font-semibold text-emerald-400">POC proves</h3>
            <ul className="space-y-2">
              {slide.pocStatus?.proves.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 text-left"
            variants={fadeUp}
            custom={4}
          >
            <h3 className="mb-3 text-center text-sm font-semibold text-amber-400">Not yet credible</h3>
            <ul className="space-y-2">
              {slide.pocStatus?.gaps.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-300">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </SlideBody>
      </motion.div>
    </SlideFrame>
  );
}

function DiagramSlide({ slide }: Props) {
  const nodes = slide.diagramNodes ?? [];

  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} titleClassName="mb-8" />
        <SlideBody className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 md:flex-nowrap">
          {nodes.map((node, i) => (
            <motion.div key={node.id} className="flex items-center gap-2" variants={fadeUp} custom={i + 2}>
              <div
                className={`min-w-[120px] rounded-xl border px-4 py-3 text-center md:min-w-[140px] ${nodeTones[node.tone ?? "neutral"]}`}
              >
                <p className="text-xs font-semibold">{node.label}</p>
                {node.sub ? <p className="mt-1 text-[10px] opacity-70">{node.sub}</p> : null}
              </div>
              {i < nodes.length - 1 ? <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-600 md:block" /> : null}
            </motion.div>
          ))}
        </SlideBody>
      </motion.div>
    </SlideFrame>
  );
}

function HybridRampSlide({ slide }: Props) {
  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} subtitle={slide.subtitle} />
        <SlideBody className="mx-auto mt-8 max-w-3xl space-y-3">
          {slide.rampStages?.map((stage, i) => (
            <motion.div key={stage.label} variants={fadeUp} custom={i + 3}>
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30 text-lg font-bold text-white">
                  {stage.pct}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-white">{stage.label}</h3>
                    <span className="text-xs text-violet-300">AI share</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{stage.detail}</p>
                </div>
              </div>
              {i < (slide.rampStages?.length ?? 0) - 1 ? (
                <div className="mx-auto h-4 w-px bg-gradient-to-b from-indigo-500/50 to-transparent" />
              ) : null}
            </motion.div>
          ))}
        <motion.div className="mx-auto mt-6 flex h-2 max-w-md overflow-hidden rounded-full" variants={fadeUp} custom={6}>
          <div className="w-[5%] bg-violet-500" title="5% AI" />
          <div className="w-[15%] bg-violet-400/60" title="ramp" />
          <div className="flex-1 bg-emerald-500/80" title="human" />
        </motion.div>
        <p className="mt-2 text-center text-xs text-slate-500">Violet = AI agents · Green = verified human experts</p>
        </SlideBody>
      </motion.div>
    </SlideFrame>
  );
}

function CalibrationSlide({ slide }: Props) {
  const stepTones: Record<NonNullable<NonNullable<typeof slide.calibrationSteps>[0]["tone"]>, string> = {
    human: "border-emerald-500/30 bg-emerald-500/10",
    ai: "border-violet-500/30 bg-violet-500/10",
    neutral: "border-white/15 bg-white/5",
    success: "border-sky-500/30 bg-sky-500/10"
  };

  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} subtitle={slide.subtitle} />

        <SlideBody>
        {/* Parallel paths diagram */}
        <motion.div
          className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-[1fr_auto_1fr]"
          variants={fadeUp}
          custom={3}
        >
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Human path</p>
            <p className="mt-2 text-sm font-medium text-white">Expert matched via Graph</p>
            <p className="mt-1 text-xs text-slate-400">Survey / questionnaire (existing flow)</p>
            <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">Actual answers</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-xs font-semibold text-slate-500">same questions</span>
            <ArrowRight className="hidden h-5 w-5 text-slate-600 md:block" />
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold text-amber-300">
              Δ compare
            </span>
          </div>

          <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">AI twin path</p>
            <p className="mt-2 text-sm font-medium text-white">Persona predicts responses</p>
            <p className="mt-1 text-xs text-slate-400">Same scope, same questionnaire</p>
            <p className="mt-3 rounded-lg bg-violet-500/10 px-3 py-2 text-xs text-violet-200">Predicted answers</p>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="mx-auto mt-6 grid max-w-4xl gap-3 sm:grid-cols-2 md:grid-cols-4">
          {slide.calibrationSteps?.map((step, i) => (
            <motion.div
              key={step.label}
              className={`rounded-xl border p-4 text-left ${stepTones[step.tone ?? "neutral"]}`}
              variants={fadeUp}
              custom={i + 4}
            >
              <span className="text-[10px] font-bold text-slate-500">0{i + 1}</span>
              <h3 className="mt-1 text-sm font-semibold text-white">{step.label}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{step.body}</p>
            </motion.div>
          ))}
        </div>
        </SlideBody>
      </motion.div>
    </SlideFrame>
  );
}

function RoadmapSlide({ slide }: Props) {
  const horizonStyles: Record<string, string> = {
    Q1: "border-emerald-500/30 bg-emerald-500/5",
    Q2: "border-indigo-500/30 bg-indigo-500/5",
    Q3: "border-sky-500/30 bg-sky-500/5",
    Beyond: "border-slate-500/30 bg-white/3"
  };

  return (
    <SlideFrame className="max-w-6xl">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} subtitle={slide.subtitle} />
        <SlideBody className="mx-auto mt-5 grid max-w-6xl gap-3 lg:grid-cols-4">
          {slide.horizons?.map((column, ci) => (
            <motion.div
              key={column.horizon}
              className={`flex flex-col rounded-2xl border p-3 text-left ${horizonStyles[column.horizon]}`}
              variants={fadeUp}
              custom={ci + 2}
            >
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">{column.horizon}</h3>
                <p className="mt-1 text-[10px] leading-snug text-slate-500">{column.focus}</p>
              </div>
              <div className="mt-3 space-y-3">
                {column.themes.map((theme) => (
                  <div key={theme.focus} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-sm font-semibold text-white">{theme.focus}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{theme.objective}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">Build</p>
                    <ul className="mt-1 space-y-1">
                      {theme.build.map((item) => (
                        <li key={item} className="flex gap-1.5 text-[10px] leading-snug text-slate-400">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Validate</p>
                    <ul className="mt-1 space-y-1">
                      {theme.validation.map((item) => (
                        <li key={item} className="flex gap-1.5 text-[10px] leading-snug text-slate-400">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 rounded-lg border border-amber-500/15 bg-amber-500/5 px-2 py-1.5 text-[10px] leading-snug text-amber-100/80">
                      Why: {theme.why}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </SlideBody>
      </motion.div>
    </SlideFrame>
  );
}

function CrossFunctionalSlide({ slide }: Props) {
  return (
    <SlideFrame align="start">
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} titleClassName="mb-2" />
        <SlideBody className="mx-auto max-h-[54vh] max-w-5xl overflow-y-auto pr-1">
          <div className="space-y-4">
            {slide.crossFunctional?.map((row, i) => {
              const Icon = row.icon;
              return (
                <motion.div
                  key={row.team}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 text-left"
                  variants={fadeUp}
                  custom={i + 2}
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Icon className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-white">{row.team}</span>
                  </div>
                  <div className="mt-3 grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Deliverables needed
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {row.needs.map((item) => (
                          <li key={item} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Open questions
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {row.questions.map((item) => (
                          <li key={item} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
                        Why this team should care
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">{row.whyItMatters}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </SlideBody>
      </motion.div>
    </SlideFrame>
  );
}

function OwnershipSlide({ slide }: Props) {
  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} titleClassName="mb-8" />
        <SlideBody className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
          <motion.div
            className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-5 text-left"
            variants={fadeUp}
            custom={2}
          >
            <h3 className="text-center text-sm font-semibold text-indigo-300">PM owns</h3>
            <ul className="mt-3 space-y-2">
              {slide.ownership?.own.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left"
            variants={fadeUp}
            custom={3}
          >
            <h3 className="text-center text-sm font-semibold text-slate-400">Delegated to</h3>
            <ul className="mt-3 space-y-2">
              {slide.ownership?.delegate.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-300">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </SlideBody>
      </motion.div>
    </SlideFrame>
  );
}

const POC_URL = import.meta.env.VITE_POC_URL ?? "https://hub-2-0.vercel.app";

type ScreenshotSlotData = { id: string; label: string; caption: string };

function ScreenshotSlot({
  id,
  label,
  caption,
  onClick
}: ScreenshotSlotData & { onClick?: () => void }) {
  const src = `${import.meta.env.BASE_URL}screenshots/${id}.png`;
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={failed}
      className="group w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition hover:border-indigo-400/40 hover:bg-white/10 disabled:cursor-default disabled:hover:border-white/10 disabled:hover:bg-white/5"
    >
      <div className="relative flex aspect-video items-center justify-center bg-slate-900/50">
        {!failed ? (
          <>
            <img
              src={src}
              alt={label}
              className="h-full w-full object-cover object-top transition group-hover:scale-[1.02]"
              onError={() => setFailed(true)}
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-900">
                Click to enlarge
              </span>
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <ImageIcon className="h-8 w-8 text-slate-600" />
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="text-[10px] text-slate-600">{caption}</p>
          </div>
        )}
      </div>
      <div className="border-t border-white/5 px-3 py-2 text-center">
        <p className="text-xs font-semibold text-slate-200">{label}</p>
        <p className="mt-1 text-[10px] leading-snug text-slate-500">{caption}</p>
      </div>
    </button>
  );
}

function ScreenshotLightbox({
  slot,
  onClose
}: {
  slot: ScreenshotSlotData;
  onClose: () => void;
}) {
  const src = `${import.meta.env.BASE_URL}screenshots/${slot.id}.png`;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative max-h-[92vh] w-full max-w-6xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 right-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:-right-3"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
          <img src={src} alt={slot.label} className="max-h-[80vh] w-full object-contain" />
          <div className="border-t border-white/10 px-4 py-3 text-center">
            <p className="text-sm font-semibold text-white">{slot.label}</p>
            <p className="mt-1 text-xs text-slate-400">{slot.caption}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DemoSlide({ slide }: Props) {
  const [expandedSlot, setExpandedSlot] = useState<ScreenshotSlotData | null>(null);

  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full">
        <SlideHeader eyebrow={slide.eyebrow} title={slide.title} subtitle={slide.subtitle} />
        <SlideBody>
        <motion.div className="mx-auto mt-6 grid max-w-4xl gap-3 md:grid-cols-3" variants={staggerContainer}>
          {slide.screenshotSlots?.map((slot, i) => (
            <motion.div key={slot.id} variants={fadeUp} custom={i + 3}>
              <ScreenshotSlot
                id={slot.id}
                label={slot.label}
                caption={slot.caption}
                onClick={() => setExpandedSlot(slot)}
              />
            </motion.div>
          ))}
        </motion.div>
        <motion.ul className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
          {slide.bullets?.map((b, i) => (
            <motion.li
              key={b}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400"
              variants={fadeUp}
              custom={i + 6}
            >
              {b}
            </motion.li>
          ))}
        </motion.ul>
        <motion.a
          href={POC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400"
          variants={fadeUp}
          custom={9}
        >
          Open live POC <ExternalLink className="h-4 w-4" />
        </motion.a>
        </SlideBody>
      </motion.div>
      {expandedSlot ? (
        <ScreenshotLightbox slot={expandedSlot} onClose={() => setExpandedSlot(null)} />
      ) : null}
    </SlideFrame>
  );
}

function CloseSlide({ slide }: Props) {
  return (
    <SlideFrame>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex w-full max-w-4xl flex-col items-center">
        <SlideHeader
          eyebrow={slide.eyebrow}
          title={slide.title}
          subtitle={slide.subtitle}
          titleClassName="!text-3xl md:!text-5xl"
          subtitleClassName="!max-w-2xl"
        />
        {slide.bullets ? (
          <motion.div className="mt-10 grid w-full gap-3 sm:grid-cols-2" variants={staggerContainer}>
            {slide.bullets.map((b, i) => (
              <motion.div
                key={b}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-slate-300"
                variants={fadeUp}
                custom={i + 3}
              >
                {b}
              </motion.div>
            ))}
          </motion.div>
        ) : null}
        <motion.div
          className="mt-12 flex flex-col items-center gap-2"
          variants={fadeUp}
          custom={7}
        >
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <p className="text-sm font-medium text-indigo-300">Discussion & questions</p>
        </motion.div>
      </motion.div>
    </SlideFrame>
  );
}
