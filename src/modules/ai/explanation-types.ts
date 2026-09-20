/**
 * Amazon Bedrock Explanation Layer Types
 *
 * HARD CONSTRAINTS:
 * 1. This layer receives ONLY aggregate prediction factors produced by the deterministic engine.
 * 2. NEVER include resident-level records, resident IDs, names, room numbers, individual attendance
 *    histories, or PII.
 * 3. Bedrock is strictly an explanation layer. It never computes diners, buffers, or waste metrics.
 */

export interface AggregateExplanationInput {
  expectedDiners: number;
  historicalBaseline: number;
  personalHistoricalRate: number;      // e.g. 0.71 (40% weight factor)
  dayOfWeekRate: number;               // e.g. 0.71 (20% weight factor)
  mealTypeRate: number;                // e.g. 0.71 (15% weight factor)
  recentAttendanceRate: number;        // e.g. 0.72 (15% weight factor)
  preferenceIntentionRate: number;     // e.g. 0.75 (10% weight factor)
  menuAdjustment: number;              // bounded percentage e.g. +1%
  trendAdjustment: number;             // bounded percentage e.g. +1%
  confidence: "HIGH" | "MEDIUM" | "LOW" | string;
  cv: number;                          // coefficient of variation e.g. 4.4%
  mealType: string;                    // e.g. "DINNER", "LUNCH", "BREAKFAST"
  day: string;                         // e.g. "Saturday", "Wednesday"
  menuName?: string;                   // e.g. "Paneer Butter Masala & Naan"
}

export interface ExplanationResult {
  explanation: string;
  source: "bedrock" | "fallback";
  modelId?: string;
  latencyMs?: number;
  cached?: boolean;
}
