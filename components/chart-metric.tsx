"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Tooltip
} from "chart.js";
import { Bar, Doughnut, Line, Radar } from "react-chartjs-2";
import type { ReportMetric } from "@/lib/research/report-types";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend
);

const PALETTE = ["#2563eb", "#7c3aed", "#0891b2", "#d97706", "#e11d48", "#059669"];

export const chartTheme = {
  grid: "rgba(148, 163, 184, 0.25)",
  text: "#475569",
  font: "Inter, system-ui, sans-serif"
};

function normalizeRows(data: ReportMetric["data"]) {
  return data.map((row) => {
    const keys = Object.keys(row);
    const nameKey = keys.find((k) => ["name", "label", "segment", "driver", "category"].includes(k)) ?? keys[0];
    const valueKey = keys.find((k) => ["value", "score", "adoption", "satisfaction", "percent"].includes(k)) ?? keys[1];
    return {
      label: String(row[nameKey] ?? ""),
      value: Number(row[valueKey] ?? 0)
    };
  });
}

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: chartTheme.text, font: { family: chartTheme.font, size: 11 } }
    }
  }
};

function StatCard({ metric, value, label }: { metric: ReportMetric; value: number; label: string }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col justify-between rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-lg">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-300">{metric.title}</p>
      <div>
        <p className="text-4xl font-semibold tracking-tight">
          {value}
          {metric.unit === "%" ? "%" : metric.unit ? ` ${metric.unit}` : ""}
        </p>
        <p className="mt-2 text-sm text-slate-300">{label}</p>
      </div>
      {metric.description ? <p className="text-xs text-slate-400">{metric.description}</p> : null}
    </div>
  );
}

export function ChartMetric({ metric, compact = false }: { metric: ReportMetric; compact?: boolean }) {
  const rows = normalizeRows(metric.data);
  const height = compact ? 180 : 260;

  if (metric.chartType === "stat" || rows.length === 1) {
    return <StatCard metric={metric} value={rows[0]?.value ?? 0} label={rows[0]?.label ?? ""} />;
  }

  const labels = rows.map((row) => row.label);
  const values = rows.map((row) => row.value);
  const colors = rows.map((_, index) => PALETTE[index % PALETTE.length]);

  if (metric.chartType === "pie" || metric.chartType === "donut") {
    return (
      <div style={{ height }}>
        <Doughnut
          data={{
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 8
              }
            ]
          }}
          options={{
            ...baseOptions,
            cutout: metric.chartType === "donut" ? "62%" : undefined,
            plugins: { ...baseOptions.plugins, legend: { position: "bottom" } }
          }}
        />
      </div>
    );
  }

  if (metric.chartType === "line") {
    return (
      <div style={{ height }}>
        <Line
          data={{
            labels,
            datasets: [
              {
                data: values,
                borderColor: PALETTE[0],
                backgroundColor: "rgba(37, 99, 235, 0.12)",
                fill: true,
                tension: 0.35,
                pointRadius: 4
              }
            ]
          }}
          options={{
            ...baseOptions,
            scales: {
              x: { grid: { color: chartTheme.grid }, ticks: { color: chartTheme.text } },
              y: { grid: { color: chartTheme.grid }, ticks: { color: chartTheme.text } }
            }
          }}
        />
      </div>
    );
  }

  if (metric.chartType === "radar") {
    return (
      <div style={{ height }}>
        <Radar
          data={{
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: "rgba(124, 58, 237, 0.2)",
                borderColor: PALETTE[1],
                pointBackgroundColor: PALETTE[1]
              }
            ]
          }}
          options={{
            ...baseOptions,
            scales: {
              r: {
                angleLines: { color: chartTheme.grid },
                grid: { color: chartTheme.grid },
                pointLabels: { color: chartTheme.text, font: { size: 10 } },
                ticks: { display: false }
              }
            }
          }}
        />
      </div>
    );
  }

  const horizontal = metric.chartType === "horizontal_bar";

  return (
    <div style={{ height }}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors,
              borderRadius: 8,
              barThickness: horizontal ? 18 : undefined
            }
          ]
        }}
        options={{
          ...baseOptions,
          indexAxis: horizontal ? "y" : "x",
          scales: {
            x: { grid: { display: horizontal ? true : false, color: chartTheme.grid }, ticks: { color: chartTheme.text } },
            y: { grid: { display: horizontal ? false : true, color: chartTheme.grid }, ticks: { color: chartTheme.text } }
          }
        }}
      />
    </div>
  );
}

export function MiniExpertBarChart({
  labels,
  values,
  unit
}: {
  labels: string[];
  values: number[];
  unit?: string;
}) {
  return (
    <div className="h-[200px]">
      <Bar
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: labels.map((_, index) => PALETTE[index % PALETTE.length]),
              borderRadius: 6
            }
          ]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y ?? ctx.parsed.x}${unit ?? ""}` } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: chartTheme.text, font: { size: 10 }, maxRotation: 45 } },
            y: { grid: { color: chartTheme.grid }, ticks: { color: chartTheme.text } }
          }
        }}
      />
    </div>
  );
}
