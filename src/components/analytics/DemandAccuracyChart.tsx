"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface DataPoint {
  mealDate: string;
  mealType: string;
  menuName: string;
  predictedDiners: number | null;
  actualDiners: number;
}

interface DemandAccuracyChartProps {
  data: DataPoint[];
}

export function DemandAccuracyChart({ data }: DemandAccuracyChartProps) {
  // Format data in chronological order for time-series visualization
  const chartData = [...data]
    .reverse()
    .map((d, index) => {
      const dateObj = new Date(d.mealDate);
      const label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        name: `${label} (${d.mealType.slice(0, 1)})`,
        predicted: d.predictedDiners ?? 90,
        actual: d.actualDiners,
        menu: d.menuName,
        variance: d.predictedDiners ? Math.abs(d.actualDiners - d.predictedDiners) : 0,
      };
    });

  return (
    <div className="w-full h-80 md:h-96 min-w-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E85D4A" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#E85D4A" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#25312C" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#25312C" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EFE6DC" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#68736D"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#EFE6DC" }}
          />
          <YAxis
            stroke="#68736D"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={["dataMin - 15", "dataMax + 15"]}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-warm-card text-xs space-y-1.5">
                    <div className="font-bold text-charcoal-900 border-b border-surface-border pb-1 text-sm">
                      {label} · {item.menu}
                    </div>
                    <div className="flex justify-between gap-6 text-coral-600 font-semibold">
                      <span>Predicted Forecast:</span>
                      <strong className="tabular-nums">{item.predicted} diners</strong>
                    </div>
                    <div className="flex justify-between gap-6 text-charcoal-900 font-semibold">
                      <span>Actual Scanner Count:</span>
                      <strong className="tabular-nums">{item.actual} diners</strong>
                    </div>
                    <div className="flex justify-between gap-6 text-charcoal-500 pt-1 border-t border-surface-border text-xs">
                      <span>Absolute Variance:</span>
                      <strong>{item.variance} diners</strong>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingBottom: 15 }}
          />
          <Area
            type="monotone"
            dataKey="predicted"
            name="Predicted Demand"
            stroke="#E85D4A"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPredicted)"
          />
          <Area
            type="monotone"
            dataKey="actual"
            name="Actual Scanner Attendance"
            stroke="#25312C"
            strokeWidth={2.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#colorActual)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
