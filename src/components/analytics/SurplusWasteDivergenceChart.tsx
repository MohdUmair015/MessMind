"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface OutcomePoint {
  mealDate: string;
  mealType: string;
  preparedServings: number;
  actualDiners: number;
  remainingServings: number;
  wastedServings: number;
}

interface SurplusWasteDivergenceChartProps {
  data: OutcomePoint[];
}

export function SurplusWasteDivergenceChart({ data }: SurplusWasteDivergenceChartProps) {
  const chartData = [...data]
    .slice(0, 10)
    .reverse()
    .map((d) => {
      const dateObj = new Date(d.mealDate);
      const label = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const surplus = Math.max(0, d.preparedServings - d.actualDiners);
      return {
        name: `${label} (${d.mealType.slice(0, 1)})`,
        prepared: d.preparedServings,
        eaten: d.actualDiners,
        surplus,
        wasted: d.wastedServings,
      };
    });

  return (
    <div className="w-full h-80 md:h-96 min-w-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
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
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-warm-card text-xs space-y-1.5">
                    <div className="font-bold text-charcoal-900 border-b border-surface-border pb-1 text-sm">
                      {label} Service Volumes
                    </div>
                    <div className="flex justify-between gap-6 text-charcoal-700">
                      <span>Kitchen Prepared:</span>
                      <strong className="tabular-nums">{item.prepared} portions</strong>
                    </div>
                    <div className="flex justify-between gap-6 text-mint-700 font-bold">
                      <span>Diners Consumed:</span>
                      <strong className="tabular-nums">{item.eaten} diners</strong>
                    </div>
                    <div className="flex justify-between gap-6 text-mango-700 font-semibold">
                      <span>Estimated Surplus:</span>
                      <strong className="tabular-nums">{item.surplus} portions</strong>
                    </div>
                    <div className="flex justify-between gap-6 text-coral-600 border-t border-surface-border pt-1 font-black">
                      <span>Physically Wasted:</span>
                      <strong className="tabular-nums">{item.wasted} portions</strong>
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
          <Bar dataKey="prepared" name="Prepared Servings" fill="#C3CDC8" radius={[6, 6, 0, 0]} />
          <Bar dataKey="eaten" name="Actual Attendance" fill="#2FAF8F" radius={[6, 6, 0, 0]} />
          <Bar dataKey="wasted" name="Physical Food Waste" fill="#E85D4A" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
