"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ReportMetric } from "@/lib/research/report-types";

const PALETTE = ["#0ea5e9", "#6366f1", "#14b8a6", "#f59e0b", "#f43f5e", "#8b5cf6"];

function normalizeRows(data: ReportMetric["data"]) {
  return data.map((row) => {
    const keys = Object.keys(row);
    const nameKey = keys.find((k) => ["name", "label", "segment", "driver", "category"].includes(k)) ?? keys[0];
    const valueKey = keys.find((k) => ["value", "score", "adoption", "satisfaction", "percent"].includes(k)) ?? keys[1];

    return {
      name: String(row[nameKey] ?? ""),
      value: Number(row[valueKey] ?? 0)
    };
  });
}

function StatCard({ metric, rows }: { metric: ReportMetric; rows: Array<{ name: string; value: number }> }) {
  const primary = rows[0]?.value ?? 0;
  return (
    <div className="flex h-full min-h-[220px] flex-col justify-center rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-8 text-white">
      <p className="text-sm text-slate-300">{metric.unit ?? "Index"}</p>
      <p className="mt-2 text-5xl font-semibold tracking-tight">
        {primary}
        {metric.unit === "%" ? "%" : ""}
      </p>
      <p className="mt-3 text-sm text-slate-300">{rows[0]?.name}</p>
      {metric.description ? <p className="mt-4 text-xs text-slate-400">{metric.description}</p> : null}
    </div>
  );
}

export function AdaptiveReportChart({ metric }: { metric: ReportMetric }) {
  const rows = normalizeRows(metric.data);

  if (metric.chartType === "stat" || rows.length === 1) {
    return <StatCard metric={metric} rows={rows} />;
  }

  if (metric.chartType === "pie" || metric.chartType === "donut") {
    const innerRadius = metric.chartType === "donut" ? 58 : 0;
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius={innerRadius} outerRadius={100} paddingAngle={2}>
            {rows.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (metric.chartType === "horizontal_bar") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows} layout="vertical" margin={{ left: 12, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
            {rows.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (metric.chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (metric.chartType === "radar") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={rows}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
          <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.28} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {rows.map((_, index) => (
            <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
