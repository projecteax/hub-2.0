"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ReportMetric } from "@/lib/types";

export function ReportChart({ metric }: { metric: ReportMetric }) {
  if (metric.chartType === "radar") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={metric.data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <Radar dataKey="value" fill="#0284c7" fillOpacity={0.32} stroke="#0284c7" />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  if (metric.chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={metric.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line dataKey="value" stroke="#0f172a" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={metric.data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#0f172a" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
