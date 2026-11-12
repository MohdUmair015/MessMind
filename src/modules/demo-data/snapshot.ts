import { DemoSnapshot, DemoResident, DemoMenu, DemoMeal, DemoPrediction, DemoAnalyticsSummary } from "./types";
import { generateDeterministicFallbackExplanation } from "@/modules/ai/deterministic-explainer";
import { ResidentType } from "@/types";
import { ResidentHistoryRecord, ComparableMealMetric } from "@/modules/prediction/types";

/**
 * ==============================================================================
 * MessMind Static Demo Data Snapshot
 * ==============================================================================
 *
 * DISCLAIMER:
 * Demo environment — simulated data.
 * The prototype operates using a synthetic population of 125 simulated residents
 * (50 student residents and 75 corporate residents) and generated historical logs
 * across a 90-day window. These figures are for demonstration purposes and do NOT
 * represent actual hostel residents.
 *
 * ARCHITECTURAL INTEGRITY:
 * - 100% pure TypeScript with ZERO Prisma, database, or AWS SDK imports.
 * - Browser-safe and ready for GitHub Pages static export.
 * - Decoupled from runtime server actions and server-side authentication.
 */

export const DEMO_BENCHMARK_DATE = "2026-09-19T18:00:00.000Z";
export const DEMO_TARGET_MEAL_ID = "meal-target-saturday-dinner";

// 1. Synthetic Residents (Exactly 125: 50 Students, 75 Corporate)
export const demoResidents: DemoResident[] = [];

// 50 Student Residents (STU-001 .. STU-050)
for (let i = 1; i <= 50; i++) {
  const code = `STU-${String(i).padStart(3, "0")}`;
  let archetype: DemoResident["archetype"] = "consistent";
  let baseline = 0.92;
  let reliability = 0.90;

  if (i <= 20) {
    archetype = "consistent";
    baseline = 0.94;
    reliability = 0.92;
  } else if (i <= 32) {
    archetype = "weekend_heavy";
    baseline = 0.88;
    reliability = 0.88;
  } else if (i <= 38) {
    archetype = "weekday_heavy";
    baseline = 0.60;
    reliability = 0.85;
  } else if (i <= 42) {
    archetype = "flaky_preference";
    baseline = 0.35;
    reliability = 0.35;
  } else if (i <= 47) {
    archetype = "occasional";
    baseline = 0.40;
    reliability = 0.50;
  } else {
    archetype = "sparse";
    baseline = 0.80;
    reliability = 0.80;
  }

  demoResidents.push({
    id: `res-stu-${String(i).padStart(3, "0")}`,
    residentCode: code,
    residentType: "STUDENT",
    archetype,
    baselineAttendanceRate: baseline,
    preferenceReliability: reliability,
  });
}

// 75 Corporate Residents (CORP-001 .. CORP-075)
for (let i = 1; i <= 75; i++) {
  const code = `CORP-${String(i).padStart(3, "0")}`;
  let archetype: DemoResident["archetype"] = "consistent";
  let baseline = 0.88;
  let reliability = 0.88;

  if (i <= 35) {
    archetype = "dinner_heavy";
    baseline = 0.92;
    reliability = 0.90;
  } else if (i <= 50) {
    archetype = "weekend_heavy";
    baseline = 0.90;
    reliability = 0.88;
  } else if (i <= 60) {
    archetype = "breakfast_heavy";
    baseline = 0.65;
    reliability = 0.85;
  } else if (i <= 65) {
    archetype = "flaky_preference";
    baseline = 0.35;
    reliability = 0.30;
  } else if (i <= 72) {
    archetype = "occasional";
    baseline = 0.40;
    reliability = 0.45;
  } else {
    archetype = "sparse";
    baseline = 0.80;
    reliability = 0.80;
  }

  demoResidents.push({
    id: `res-corp-${String(i).padStart(3, "0")}`,
    residentCode: code,
    residentType: "CORPORATE",
    archetype,
    baselineAttendanceRate: baseline,
    preferenceReliability: reliability,
  });
}

// 2. Menu Catalog
export const demoMenus: Record<string, DemoMenu> = {
  biryani: {
    id: "menu-biryani-special",
    name: "Vegetable Biryani Special",
    category: "Weekend Special",
    items: ["Vegetable Biryani", "Cucumber Raita", "Gulab Jamun", "Roasted Papad"],
  },
  paneer: {
    id: "menu-paneer-butter",
    name: "Paneer Butter Masala Dinner",
    category: "North Indian",
    items: ["Paneer Butter Masala", "Butter Naan", "Jeera Rice", "Dal Makhani"],
  },
  homestyle: {
    id: "menu-dal-tadka",
    name: "Everyday Homestyle Dinner",
    category: "Standard",
    items: ["Dal Tadka", "Steamed Rice", "Mixed Vegetable Sabzi", "Phulka Roti"],
  },
  southIndian: {
    id: "menu-dosa-idli",
    name: "South Indian Breakfast",
    category: "Breakfast",
    items: ["Masala Dosa", "Steamed Idli", "Sambar", "Coconut Chutney"],
  },
  poha: {
    id: "menu-poha-upma",
    name: "Light Breakfast Special",
    category: "Breakfast",
    items: ["Indori Poha", "Rava Upma", "Boiled Eggs / Sprouts", "Masala Chai"],
  },
  rajma: {
    id: "menu-rajma-chawal",
    name: "Weekend Rajma Chawal",
    category: "Weekend Lunch",
    items: ["Rajma Masala", "Basmati Rice", "Boondi Raita", "Garden Salad"],
  },
  khichdi: {
    id: "menu-khichdi-kadhi",
    name: "Sunday Comfort Khichdi",
    category: "Comfort Food",
    items: ["Moong Dal Khichdi", "Gujarati Kadhi", "Aloo Chokha", "Roasted Papad"],
  },
};

// 3. Comparable Saturday Dinner Historical Services (12 Services for CV & Waste Evidence)
// Diners calibrated to Mean 86.4, StdDev 3.8, CV 4.4% (0.044)
const saturdayDiners = [83, 91, 83, 89, 85, 93, 81, 88, 86, 90, 81, 87];
const remainingServingsPattern = [5, 5, 5, 5, 5, 6, 5, 5, 5, 5, 5, 5];
const wastedServingsPattern = [2, 3, 2, 3, 2, 3, 3, 3, 2, 3, 2, 3];

export const demoComparableHistoricalMeals: ComparableMealMetric[] = saturdayDiners.map((actualDiners, idx) => {
  const weeksAgo = idx + 1;
  const mealDate = new Date(new Date(DEMO_BENCHMARK_DATE).getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
  const remaining = remainingServingsPattern[idx];
  const wasted = wastedServingsPattern[idx];
  const prepared = actualDiners + remaining;

  return {
    mealId: `hist-sat-dinner-${weeksAgo}`,
    mealDate,
    mealType: "DINNER",
    menuId: weeksAgo % 3 === 0 ? demoMenus.biryani.id : demoMenus.homestyle.id,
    totalActualDiners: actualDiners,
    preparedServings: prepared,
    remainingServings: remaining,
    wastedServings: wasted,
  };
});

// 4. Pre-Generated Resident History Records for In-Memory Deterministic Engine
export const demoResidentHistoryRecords: ResidentHistoryRecord[] = [];
export const demoTargetMealPreferences: Array<{ residentId: string; selectedOption: string }> = [];

// 94 opt-ins for target Saturday Biryani Special
for (let rIdx = 0; rIdx < demoResidents.length; rIdx++) {
  const res = demoResidents[rIdx];
  if (rIdx < 94) {
    demoTargetMealPreferences.push({
      residentId: res.id,
      selectedOption: rIdx % 3 === 0 ? "VEG_BIRYANI" : "REGULAR",
    });
  }
}

const targetPrefSet = new Set(demoTargetMealPreferences.map((p) => p.residentId));

// 12 Saturday Dinners matching exact benchmark attendance and Biryani menu delta
for (let s = 1; s <= 12; s++) {
  const mealDate = new Date(new Date(DEMO_BENCHMARK_DATE).getTime() - s * 7 * 24 * 60 * 60 * 1000);
  const count = saturdayDiners[s - 1];
  const isBiryani = s % 3 === 0;

  for (let r = 0; r < 125; r++) {
    const res = demoResidents[r];
    const isOptIn = targetPrefSet.has(res.id);

    const rank = (r * 7 + s * 13) % 125;
    const attended = rank < count;
    let hasPref = false;
    if (isOptIn) {
      hasPref = attended ? (r * 3 + s * 7) % 100 < 88 : (r * 5 + s * 11) % 100 < 70;
    } else {
      hasPref = attended ? (r * 3 + s * 7) % 100 < 25 : (r * 5 + s * 11) % 100 < 5;
    }

    demoResidentHistoryRecords.push({
      residentId: res.id,
      residentCode: res.residentCode,
      residentType: res.residentType,
      mealId: `hist-sat-dinner-${s}`,
      mealDate,
      mealType: "DINNER",
      menuId: isBiryani ? demoMenus.biryani.id : demoMenus.homestyle.id,
      hasPreference: hasPref,
      selectedOption: "REGULAR",
      attended,
    });
  }
}

// 4 Saturday Lunches (Separates day-of-week pattern from day-meal specific baseline)
for (let s = 1; s <= 4; s++) {
  const mealDate = new Date(new Date(DEMO_BENCHMARK_DATE).getTime() - (s * 7 * 24 + 6) * 60 * 60 * 1000);
  const count = s === 1 ? 90 : 95;
  for (let r = 0; r < 125; r++) {
    const res = demoResidents[r];
    const isOptIn = targetPrefSet.has(res.id);
    const rank = (r * 11 + s * 17) % 125;
    const attended = rank < count;
    const hasPref = isOptIn ? (attended ? (r * 3 + s * 7) % 100 < 88 : (r * 5 + s * 11) % 100 < 70) : false;

    demoResidentHistoryRecords.push({
      residentId: res.id,
      residentCode: res.residentCode,
      residentType: res.residentType,
      mealId: `hist-sat-lunch-${s}`,
      mealDate,
      mealType: "LUNCH",
      menuId: demoMenus.rajma.id,
      hasPreference: hasPref,
      selectedOption: "REGULAR",
      attended,
    });
  }
}

// 4 Friday Dinners (Separates meal-type pattern from day-meal specific baseline)
for (let s = 1; s <= 4; s++) {
  const mealDate = new Date(new Date(DEMO_BENCHMARK_DATE).getTime() - (s * 7 * 24 + 24) * 60 * 60 * 1000);
  const count = s === 1 ? 90 : 95;
  for (let r = 0; r < 125; r++) {
    const res = demoResidents[r];
    const isOptIn = targetPrefSet.has(res.id);
    const rank = (r * 13 + s * 19) % 125;
    const attended = rank < count;
    const hasPref = isOptIn ? (attended ? (r * 3 + s * 7) % 100 < 88 : (r * 5 + s * 11) % 100 < 70) : false;

    demoResidentHistoryRecords.push({
      residentId: res.id,
      residentCode: res.residentCode,
      residentType: res.residentType,
      mealId: `hist-fri-dinner-${s}`,
      mealDate,
      mealType: "DINNER",
      menuId: demoMenus.paneer.id,
      hasPreference: hasPref,
      selectedOption: "REGULAR",
      attended,
    });
  }
}

// 5. Pre-Rendered Target Benchmark Prediction
const benchmarkExplanation = generateDeterministicFallbackExplanation({
  expectedDiners: 90,
  historicalBaseline: 86,
  personalHistoricalRate: 0.71,
  dayOfWeekRate: 0.71,
  mealTypeRate: 0.71,
  recentAttendanceRate: 0.72,
  preferenceIntentionRate: 0.75,
  menuAdjustment: 1,
  trendAdjustment: 1,
  confidence: "HIGH",
  cv: 4.4,
  mealType: "DINNER",
  day: "Saturday",
  menuName: demoMenus.biryani.name,
});

export const demoTargetPrediction: DemoPrediction = {
  id: "pred-target-saturday-dinner",
  mealId: DEMO_TARGET_MEAL_ID,
  predictedDiners: 90,
  recommendedServings: 95,
  wasteRisk: "LOW",
  confidenceLevel: "HIGH",
  confidenceReason: "High confidence — based on 12 comparable historical meals with consistent attendance (CV: 4.4%).",
  algorithmVersion: "v1.1-deterministic",
  explanation: benchmarkExplanation,
  explanationSource: "fallback",
  createdAt: "2026-09-19T10:00:00.000Z",
  predictionFactors: {
    eligiblePopulation: 125,
    historicalBaselineDiners: 86,
    weightedFactors: {
      personalHistoricalRate: 0.71,
      dayOfWeekPatternRate: 0.71,
      mealTypePatternRate: 0.71,
      recentAttendanceTrendRate: 0.72,
      preferenceIntentionRate: 0.75,
    },
    boundedAdjustments: {
      menuAdjustmentPercent: 1,
      macroTrendAdjustmentPercent: 1,
    },
    confidenceMetrics: {
      comparableMealsCount: 12,
      calculatedCoefficientOfVariation: 0.044,
      attendanceMean: 86.4,
      attendanceStdDev: 3.8,
    },
    wasteEvidence: {
      evaluatedOutcomesCount: 12,
      averageLeftoverPercent: 5.6,
      averageWastePercent: 2.8,
      excessiveLeftoverFrequencyPercent: 0.0,
      riskReasoning: "Low waste risk based on historical outcomes — comparable meals maintained low leftovers (5.6%) and minimal waste (2.8%).",
    },
  },
};

// 6. Target Saturday Meal (Unserved, Decision Hero)
export const demoTargetMeal: DemoMeal = {
  id: DEMO_TARGET_MEAL_ID,
  mealDate: DEMO_BENCHMARK_DATE,
  mealType: "DINNER",
  menuId: demoMenus.biryani.id,
  isServed: false,
  preferenceDeadline: "2026-09-19T14:00:00.000Z",
  menu: demoMenus.biryani,
  prediction: demoTargetPrediction,
  outcome: null,
  _count: {
    scans: 0,
    preferences: 94,
  },
};

// 7. Recent Historical Services (For Timeline & Chart Divergence)
export const demoRecentHistoricalOutcomes = [
  {
    mealId: "meal-hist-01",
    mealDate: "2026-09-19T12:30:00.000Z",
    mealType: "LUNCH",
    menuName: "Weekend Rajma Chawal",
    predictedDiners: 54,
    actualDiners: 52,
    preparedServings: 58,
    remainingServings: 6,
    wastedServings: 2,
    errorPercent: 3.7,
  },
  {
    mealId: "meal-hist-02",
    mealDate: "2026-09-19T07:30:00.000Z",
    mealType: "BREAKFAST",
    menuName: "South Indian Breakfast",
    predictedDiners: 86,
    actualDiners: 88,
    preparedServings: 92,
    remainingServings: 4,
    wastedServings: 1,
    errorPercent: 2.3,
  },
  {
    mealId: "meal-hist-03",
    mealDate: "2026-09-18T19:30:00.000Z",
    mealType: "DINNER",
    menuName: "Paneer Butter Masala Dinner",
    predictedDiners: 89,
    actualDiners: 92,
    preparedServings: 96,
    remainingServings: 4,
    wastedServings: 2,
    errorPercent: 3.4,
  },
  {
    mealId: "meal-hist-04",
    mealDate: "2026-09-18T07:30:00.000Z",
    mealType: "BREAKFAST",
    menuName: "Light Breakfast Special",
    predictedDiners: 79,
    actualDiners: 81,
    preparedServings: 85,
    remainingServings: 4,
    wastedServings: 1,
    errorPercent: 2.5,
  },
  {
    mealId: "meal-hist-05",
    mealDate: "2026-09-17T19:30:00.000Z",
    mealType: "DINNER",
    menuName: "Everyday Homestyle Dinner",
    predictedDiners: 84,
    actualDiners: 82,
    preparedServings: 88,
    remainingServings: 6,
    wastedServings: 2,
    errorPercent: 2.4,
  },
  {
    mealId: "meal-hist-06",
    mealDate: "2026-09-17T07:30:00.000Z",
    mealType: "BREAKFAST",
    menuName: "South Indian Breakfast",
    predictedDiners: 85,
    actualDiners: 87,
    preparedServings: 90,
    remainingServings: 3,
    wastedServings: 1,
    errorPercent: 2.4,
  },
  {
    mealId: "meal-hist-07",
    mealDate: "2026-09-16T19:30:00.000Z",
    mealType: "DINNER",
    menuName: "Paneer Butter Masala Dinner",
    predictedDiners: 91,
    actualDiners: 89,
    preparedServings: 95,
    remainingServings: 6,
    wastedServings: 2,
    errorPercent: 2.2,
  },
  {
    mealId: "meal-hist-08",
    mealDate: "2026-09-16T07:30:00.000Z",
    mealType: "BREAKFAST",
    menuName: "Light Breakfast Special",
    predictedDiners: 80,
    actualDiners: 83,
    preparedServings: 86,
    remainingServings: 3,
    wastedServings: 1,
    errorPercent: 3.8,
  },
  {
    mealId: "meal-hist-09",
    mealDate: "2026-09-15T19:30:00.000Z",
    mealType: "DINNER",
    menuName: "Everyday Homestyle Dinner",
    predictedDiners: 83,
    actualDiners: 85,
    preparedServings: 89,
    remainingServings: 4,
    wastedServings: 1,
    errorPercent: 2.4,
  },
  {
    mealId: "meal-hist-10",
    mealDate: "2026-09-15T07:30:00.000Z",
    mealType: "BREAKFAST",
    menuName: "South Indian Breakfast",
    predictedDiners: 84,
    actualDiners: 82,
    preparedServings: 88,
    remainingServings: 6,
    wastedServings: 2,
    errorPercent: 2.4,
  },
  {
    mealId: "meal-hist-11",
    mealDate: "2026-09-14T19:30:00.000Z",
    mealType: "DINNER",
    menuName: "Paneer Butter Masala Dinner",
    predictedDiners: 88,
    actualDiners: 86,
    preparedServings: 92,
    remainingServings: 6,
    wastedServings: 2,
    errorPercent: 2.3,
  },
  {
    mealId: "meal-hist-12",
    mealDate: "2026-09-14T07:30:00.000Z",
    mealType: "BREAKFAST",
    menuName: "Light Breakfast Special",
    predictedDiners: 81,
    actualDiners: 79,
    preparedServings: 85,
    remainingServings: 6,
    wastedServings: 2,
    errorPercent: 2.5,
  },
  {
    mealId: "meal-hist-13",
    mealDate: "2026-09-13T19:30:00.000Z",
    mealType: "DINNER",
    menuName: "Sunday Comfort Khichdi",
    predictedDiners: 78,
    actualDiners: 76,
    preparedServings: 82,
    remainingServings: 6,
    wastedServings: 2,
    errorPercent: 2.6,
  },
  {
    mealId: "meal-hist-14",
    mealDate: "2026-09-13T12:30:00.000Z",
    mealType: "LUNCH",
    menuName: "Weekend Rajma Chawal",
    predictedDiners: 55,
    actualDiners: 58,
    preparedServings: 62,
    remainingServings: 4,
    wastedServings: 1,
    errorPercent: 5.5,
  },
  {
    mealId: "meal-hist-15",
    mealDate: "2026-09-13T07:30:00.000Z",
    mealType: "BREAKFAST",
    menuName: "South Indian Breakfast",
    predictedDiners: 85,
    actualDiners: 84,
    preparedServings: 90,
    remainingServings: 6,
    wastedServings: 2,
    errorPercent: 1.2,
  },
  {
    mealId: "meal-hist-16",
    mealDate: "2026-09-12T19:30:00.000Z",
    mealType: "DINNER",
    menuName: "Vegetable Biryani Special",
    predictedDiners: 89,
    actualDiners: 91,
    preparedServings: 96,
    remainingServings: 5,
    wastedServings: 2,
    errorPercent: 2.2,
  },
  {
    mealId: "meal-hist-17",
    mealDate: "2026-09-12T12:30:00.000Z",
    mealType: "LUNCH",
    menuName: "Weekend Rajma Chawal",
    predictedDiners: 53,
    actualDiners: 51,
    preparedServings: 56,
    remainingServings: 5,
    wastedServings: 2,
    errorPercent: 3.8,
  },
  {
    mealId: "meal-hist-18",
    mealDate: "2026-09-12T07:30:00.000Z",
    mealType: "BREAKFAST",
    menuName: "Light Breakfast Special",
    predictedDiners: 82,
    actualDiners: 85,
    preparedServings: 89,
    remainingServings: 4,
    wastedServings: 1,
    errorPercent: 3.7,
  },
  {
    mealId: "meal-hist-19",
    mealDate: "2026-09-11T19:30:00.000Z",
    mealType: "DINNER",
    menuName: "Paneer Butter Masala Dinner",
    predictedDiners: 87,
    actualDiners: 89,
    preparedServings: 94,
    remainingServings: 5,
    wastedServings: 2,
    errorPercent: 2.3,
  },
  {
    mealId: "meal-hist-20",
    mealDate: "2026-09-11T07:30:00.000Z",
    mealType: "BREAKFAST",
    menuName: "South Indian Breakfast",
    predictedDiners: 84,
    actualDiners: 86,
    preparedServings: 90,
    remainingServings: 4,
    wastedServings: 1,
    errorPercent: 2.4,
  },
];

// 8. Full Timeline of Meals for /meals Route (30 Services)
export const demoMealsTimeline: DemoMeal[] = [
  demoTargetMeal,
  ...demoRecentHistoricalOutcomes.map((h, i) => {
    let menuObj = demoMenus.homestyle;
    if (h.menuName.includes("Biryani")) menuObj = demoMenus.biryani;
    else if (h.menuName.includes("Paneer")) menuObj = demoMenus.paneer;
    else if (h.menuName.includes("Rajma")) menuObj = demoMenus.rajma;
    else if (h.menuName.includes("South Indian")) menuObj = demoMenus.southIndian;
    else if (h.menuName.includes("Light Breakfast")) menuObj = demoMenus.poha;
    else if (h.menuName.includes("Khichdi")) menuObj = demoMenus.khichdi;

    return {
      id: h.mealId,
      mealDate: h.mealDate,
      mealType: h.mealType as any,
      menuId: menuObj.id,
      isServed: true,
      preferenceDeadline: new Date(new Date(h.mealDate).getTime() - 4 * 60 * 60 * 1000).toISOString(),
      menu: menuObj,
      prediction: {
        id: `pred-${h.mealId}`,
        mealId: h.mealId,
        predictedDiners: h.predictedDiners ?? 85,
        recommendedServings: Math.ceil((h.predictedDiners ?? 85) * 1.05),
        wasteRisk: "LOW" as const,
        confidenceLevel: "HIGH" as const,
        confidenceReason: "High confidence from historical attendance stability.",
        algorithmVersion: "v1.1-deterministic",
        explanation: `Historical demand was ${h.predictedDiners} diners. Attendance verified at ${h.actualDiners} unique scans.`,
        explanationSource: "fallback" as const,
        createdAt: h.mealDate,
        predictionFactors: {
          eligiblePopulation: 125,
          historicalBaselineDiners: 86,
          weightedFactors: {
            personalHistoricalRate: 0.74,
            dayOfWeekPatternRate: 0.71,
            mealTypePatternRate: 0.70,
            recentAttendanceTrendRate: 0.73,
            preferenceIntentionRate: 0.69,
          },
          boundedAdjustments: {
            menuAdjustmentPercent: 3,
            macroTrendAdjustmentPercent: 1,
          },
          confidenceMetrics: {
            comparableMealsCount: 12,
            calculatedCoefficientOfVariation: 0.044,
            attendanceMean: 86.4,
            attendanceStdDev: 3.8,
          },
          wasteEvidence: {
            evaluatedOutcomesCount: 12,
            averageLeftoverPercent: 5.6,
            averageWastePercent: 2.5,
            excessiveLeftoverFrequencyPercent: 0,
            riskReasoning: "Low waste risk based on historical outcomes.",
          },
        },
      },
      outcome: {
        id: `outcome-${h.mealId}`,
        mealId: h.mealId,
        preparedServings: h.preparedServings,
        actualDiners: h.actualDiners,
        attendanceSource: "SCANNER_SYNC",
        remainingServings: h.remainingServings,
        wastedServings: h.wastedServings,
        estimatedSurplus: Math.max(0, h.preparedServings - h.actualDiners),
        recordedAt: new Date(new Date(h.mealDate).getTime() + 3 * 60 * 60 * 1000).toISOString(),
      },
      _count: {
        scans: h.actualDiners,
        preferences: Math.round(h.actualDiners * 0.95),
      },
    };
  }),
];

// 9. Analytics Summary (Accurate to 205 Evaluated Meals from 90-day History)
export const demoAnalyticsSummary: DemoAnalyticsSummary = {
  totalHistoricalMeals: 205,
  totalOutcomesRecorded: 205,
  overallMapePercent: 4.2,
  accuracyWithinFivePercentRate: 92.5,
  averageFoodWastePercent: 2.6,
  averageLeftoverPercent: 5.6,
  totalServingsPrepared: 17250,
  totalActualDinersServed: 16300,
  totalServingsWasted: 448,
  recentOutcomeComparisons: demoRecentHistoricalOutcomes,
};

// 10. The Unified Static Demo Snapshot
export const demoSnapshot: DemoSnapshot = {
  disclaimer: "Demo environment — simulated data. Synthetic population of 125 residents (50 student residents and 75 corporate residents).",
  generatedBenchmarkDate: DEMO_BENCHMARK_DATE,
  targetMealId: DEMO_TARGET_MEAL_ID,
  eligibleResidentsCount: 125,
  studentCount: 50,
  corporateCount: 75,
  residents: demoResidents,
  menus: Object.values(demoMenus),
  targetMeal: demoTargetMeal,
  mealsTimeline: demoMealsTimeline,
  targetPrediction: demoTargetPrediction,
  analytics: demoAnalyticsSummary,
  comparableHistoricalMeals: demoComparableHistoricalMeals,
  residentHistoryRecords: demoResidentHistoryRecords,
  targetMealPreferences: demoTargetMealPreferences,
};
