import { PrismaClient, ResidentType, MealType, WasteRiskLevel, ConfidenceLevel } from "@prisma/client";
import { DeterministicPredictionEngine } from "../src/modules/prediction/deterministic-engine";

const prisma = new PrismaClient();

// Reproducible PRNG (Mulberry32)
function createPRNG(seed = 42) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createPRNG(1337);

interface ResidentProfile {
  code: string;
  type: ResidentType;
  archetype:
    | "consistent"
    | "occasional"
    | "weekend_heavy"
    | "weekday_heavy"
    | "breakfast_heavy"
    | "dinner_heavy"
    | "flaky_preference"
    | "declining"
    | "sparse";
  baseProb: number;
  prefReliability: number;
  optInRate: number;
  activeFromDaysAgo: number;
}

async function main() {
  console.log("🌱 Starting MessMind synthetic data generation (90-day historical window)...");

  // Clear existing records to ensure clean state
  await prisma.auditLog.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.mealOutcome.deleteMany();
  await prisma.mealScan.deleteMany();
  await prisma.mealPreference.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.resident.deleteMany();
  await prisma.predictionSetting.deleteMany();

  // 1. Prediction Settings
  await prisma.predictionSetting.create({
    data: {
      id: "default",
      bufferPercentage: 5.0,
      highWasteRiskThresholdPercent: 20.0,
    },
  });

  // 2. Menus
  console.log("Creating menu catalog...");
  const menuBiryani = await prisma.menu.create({
    data: {
      id: "menu-biryani-special",
      name: "Vegetable Biryani Special",
      category: "Weekend Special",
      items: ["Vegetable Biryani", "Cucumber Raita", "Gulab Jamun", "Roasted Papad"],
    },
  });

  const menuPaneer = await prisma.menu.create({
    data: {
      id: "menu-paneer-butter",
      name: "Paneer Butter Masala Dinner",
      category: "North Indian",
      items: ["Paneer Butter Masala", "Butter Naan", "Jeera Rice", "Dal Makhani"],
    },
  });

  const menuHomestyle = await prisma.menu.create({
    data: {
      id: "menu-dal-tadka",
      name: "Everyday Homestyle Dinner",
      category: "Standard",
      items: ["Dal Tadka", "Steamed Rice", "Mixed Vegetable Sabzi", "Phulka Roti"],
    },
  });

  const menuSouthIndian = await prisma.menu.create({
    data: {
      id: "menu-dosa-idli",
      name: "South Indian Breakfast",
      category: "Breakfast",
      items: ["Masala Dosa", "Steamed Idli", "Sambar", "Coconut Chutney"],
    },
  });

  const menuPoha = await prisma.menu.create({
    data: {
      id: "menu-poha-upma",
      name: "Light Breakfast Special",
      category: "Breakfast",
      items: ["Indori Poha", "Rava Upma", "Boiled Eggs / Sprouts", "Masala Chai"],
    },
  });

  const menuRajma = await prisma.menu.create({
    data: {
      id: "menu-rajma-chawal",
      name: "Weekend Rajma Chawal",
      category: "Weekend Lunch",
      items: ["Rajma Masala", "Basmati Rice", "Boondi Raita", "Garden Salad"],
    },
  });

  const menuKhichdi = await prisma.menu.create({
    data: {
      id: "menu-khichdi-kadhi",
      name: "Sunday Comfort Khichdi",
      category: "Comfort Food",
      items: ["Moong Dal Khichdi", "Gujarati Kadhi", "Aloo Chokha", "Roasted Papad"],
    },
  });

  // 3. Residents (Exactly 125: 50 Students, 75 Corporate)
  console.log("Creating 125 synthetic residents (50 students, 75 corporate)...");
  const residentProfiles: ResidentProfile[] = [];

  // 50 Students
  for (let i = 1; i <= 50; i++) {
    const code = `STU-${String(i).padStart(3, "0")}`;
    let archetype: ResidentProfile["archetype"] = "consistent";
    let baseProb = 0.90;
    let prefReliability = 0.92;
    let optInRate = 0.90;
    let activeFromDaysAgo = 95;

    if (i <= 20) {
      archetype = "consistent";
      baseProb = 0.94;
    } else if (i <= 32) {
      archetype = "weekend_heavy";
      baseProb = 0.90;
    } else if (i <= 38) {
      archetype = "weekday_heavy";
      baseProb = 0.60;
    } else if (i <= 42) {
      archetype = "flaky_preference";
      baseProb = 0.35;
      prefReliability = 0.35;
      optInRate = 0.95;
    } else if (i <= 47) {
      archetype = "occasional";
      baseProb = 0.40;
      optInRate = 0.45;
    } else {
      archetype = "sparse";
      baseProb = 0.80;
      activeFromDaysAgo = 10;
    }

    residentProfiles.push({
      code,
      type: "STUDENT",
      archetype,
      baseProb,
      prefReliability,
      optInRate,
      activeFromDaysAgo,
    });
  }

  // 75 Corporate Residents
  for (let i = 1; i <= 75; i++) {
    const code = `CORP-${String(i).padStart(3, "0")}`;
    let archetype: ResidentProfile["archetype"] = "consistent";
    let baseProb = 0.88;
    let prefReliability = 0.90;
    let optInRate = 0.88;
    let activeFromDaysAgo = 95;

    if (i <= 35) {
      archetype = "dinner_heavy";
      baseProb = 0.92;
    } else if (i <= 50) {
      archetype = "weekend_heavy";
      baseProb = 0.90;
    } else if (i <= 60) {
      archetype = "breakfast_heavy";
      baseProb = 0.65;
    } else if (i <= 65) {
      archetype = "flaky_preference";
      baseProb = 0.35;
      prefReliability = 0.30;
      optInRate = 0.92;
    } else if (i <= 72) {
      archetype = "occasional";
      baseProb = 0.40;
      optInRate = 0.40;
    } else {
      archetype = "sparse";
      baseProb = 0.80;
      activeFromDaysAgo = 8;
    }

    residentProfiles.push({
      code,
      type: "CORPORATE",
      archetype,
      baseProb,
      prefReliability,
      optInRate,
      activeFromDaysAgo,
    });
  }

  // Insert residents
  const createdResidents = await Promise.all(
    residentProfiles.map((p) =>
      prisma.resident.create({
        data: {
          residentCode: p.code,
          residentType: p.type,
          status: "ACTIVE",
          createdAt: new Date(Date.now() - p.activeFromDaysAgo * 24 * 60 * 60 * 1000),
        },
      })
    )
  );

  const residentIdMap = new Map(createdResidents.map((r) => [r.residentCode, r]));

  // 4. Generate 90-day Meal History
  console.log("Generating 90-day historical meal timeline...");
  const targetSaturday = new Date("2026-09-19T18:00:00Z"); // Target benchmark Saturday dinner

  let totalPreferences = 0;
  let totalScans = 0;
  let totalMeals = 0;

  for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
    const currentDate = new Date(targetSaturday.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dayOfWeek = currentDate.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isTargetMeal = daysAgo === 0;

    // Daily Meals: Breakfast, (Lunch on weekends), Dinner
    const mealsForDay: Array<{
      type: MealType;
      menuId: string;
      isServed: boolean;
      deadlineHoursBefore: number;
    }> = [];

    // Breakfast daily
    if (!isTargetMeal) {
      mealsForDay.push({
        type: "BREAKFAST",
        menuId: daysAgo % 2 === 0 ? menuSouthIndian.id : menuPoha.id,
        isServed: true,
        deadlineHoursBefore: 12,
      });
    }

    // Lunch on weekends only
    if (isWeekend && !isTargetMeal) {
      mealsForDay.push({
        type: "LUNCH",
        menuId: menuRajma.id,
        isServed: true,
        deadlineHoursBefore: 5,
      });
    }

    // Dinner daily
    let dinnerMenuId = menuHomestyle.id;
    if (isWeekend) {
      if (dayOfWeek === 6) {
        // Target Saturday is Biryani Special; historical Saturdays rotate between Biryani and Paneer
        dinnerMenuId = (isTargetMeal || daysAgo % 4 !== 0) ? menuBiryani.id : menuPaneer.id;
      } else {
        dinnerMenuId = menuKhichdi.id;
      }
    } else if (daysAgo % 3 === 0) {
      dinnerMenuId = menuPaneer.id;
    }

    mealsForDay.push({
      type: "DINNER",
      menuId: dinnerMenuId,
      isServed: !isTargetMeal, // Target Saturday Dinner is upcoming
      deadlineHoursBefore: 4,
    });

    for (const mConfig of mealsForDay) {
      totalMeals++;
      const mealDateOnly = new Date(
        Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate())
      );
      const deadline = new Date(currentDate.getTime() - mConfig.deadlineHoursBefore * 60 * 60 * 1000);

      const meal = await prisma.meal.create({
        data: {
          mealDate: mealDateOnly,
          mealType: mConfig.type,
          menuId: mConfig.menuId,
          isServed: mConfig.isServed,
          preferenceDeadline: deadline,
        },
      });

      // Generate preferences and scans for each resident
      let actualDiners = 0;
      const mealPreferencesData = [];
      const mealScansData = [];

      for (const profile of residentProfiles) {
        if (daysAgo > profile.activeFromDaysAgo) {
          continue; // resident hadn't joined yet
        }

        const resident = residentIdMap.get(profile.code)!;

        // Calculate attendance probability based on profile archetype
        let p = profile.baseProb;

        if (profile.archetype === "weekend_heavy") {
          p = isWeekend ? 0.88 : 0.25;
        } else if (profile.archetype === "weekday_heavy") {
          p = isWeekend ? 0.20 : 0.85;
        } else if (profile.archetype === "dinner_heavy") {
          p = mConfig.type === "DINNER" ? 0.90 : 0.25;
        } else if (profile.archetype === "breakfast_heavy") {
          p = mConfig.type === "BREAKFAST" ? 0.90 : 0.35;
        } else if (profile.archetype === "declining") {
          p = daysAgo < 14 ? 0.35 : 0.85;
        }

        // Menu appeal modifier (Biryani +5%, Paneer +3%)
        if (mConfig.menuId === menuBiryani.id) p += 0.05;
        if (mConfig.menuId === menuPaneer.id) p += 0.03;

        // Add small realistic noise
        p = Math.max(0.05, Math.min(0.95, p + (random() * 0.10 - 0.05)));

        // Preference intention: does the resident opt in?
        let optsIn = random() < profile.optInRate;
        if (profile.archetype === "flaky_preference") optsIn = true;

        if (optsIn) {
          const optionName = mConfig.menuId === menuBiryani.id
            ? (random() > 0.3 ? "VEG_BIRYANI" : "JAIN_BIRYANI")
            : "REGULAR";

          mealPreferencesData.push({
            mealId: meal.id,
            residentId: resident.id,
            selectedOption: optionName,
          });
          totalPreferences++;
        }

        // Physical attendance scan
        if (!isTargetMeal) {
          let attended = false;
          if (profile.archetype === "flaky_preference") {
            attended = random() < profile.prefReliability;
          } else if (optsIn) {
            attended = random() < profile.prefReliability;
          } else {
            attended = random() < 0.12; // Small chance of walk-in without preference
          }

          if (attended) {
            actualDiners++;
            mealScansData.push({
              mealId: meal.id,
              residentId: resident.id,
              scannedAt: new Date(currentDate.getTime() + Math.floor(random() * 90) * 60 * 1000),
            });
            totalScans++;
          }
        }
      }

      // Batch insert preferences & scans
      if (mealPreferencesData.length > 0) {
        await prisma.mealPreference.createMany({ data: mealPreferencesData });
      }

      if (mealScansData.length > 0) {
        await prisma.mealScan.createMany({ data: mealScansData });
      }

      // Record outcomes for past meals
      if (mConfig.isServed) {
        const prepBuffer = 1.05 + (random() * 0.08 - 0.04); // kitchen prepped around ~5-9% buffer
        const prepared = Math.ceil(actualDiners * prepBuffer);
        const remaining = Math.max(0, prepared - actualDiners);
        const wasted = Math.round(remaining * (0.35 + random() * 0.25));

        await prisma.mealOutcome.create({
          data: {
            mealId: meal.id,
            preparedServings: prepared,
            actualDiners,
            remainingServings: remaining,
            wastedServings: wasted,
            recordedAt: new Date(currentDate.getTime() + 3 * 60 * 60 * 1000),
          },
        });
      }

      // If target meal, run prediction engine and persist initial prediction!
      if (isTargetMeal && mConfig.type === "DINNER") {
        console.log("Running deterministic prediction engine on benchmark Saturday Dinner...");
        const engine = new DeterministicPredictionEngine();
        const predResult = await engine.predictWithDatabase(meal.id, {
          customBufferPercent: 5.0,
          persistToDb: true,
        });

        console.log(`\n======================================================`);
        console.log(`🎯 TARGET SATURDAY DINNER PREDICTION PRODUCED:`);
        console.log(`Eligible Population       : ${predResult.breakdown.eligiblePopulation}`);
        console.log(`Historical Baseline       : ${predResult.breakdown.historicalBaselineDiners} diners`);
        console.log(`\n-- WEIGHTED BEHAVIORAL FACTORS (40/20/15/15/10) --`);
        console.log(`Personal Historical Rate  : ${(predResult.breakdown.weightedFactors.personalHistoricalRate * 100).toFixed(1)}% (40% weight)`);
        console.log(`Day-of-Week Pattern Rate  : ${(predResult.breakdown.weightedFactors.dayOfWeekPatternRate * 100).toFixed(1)}% (20% weight)`);
        console.log(`Meal-Type Pattern Rate    : ${(predResult.breakdown.weightedFactors.mealTypePatternRate * 100).toFixed(1)}% (15% weight)`);
        console.log(`Recent Attendance Trend   : ${(predResult.breakdown.weightedFactors.recentAttendanceTrendRate * 100).toFixed(1)}% (15% weight)`);
        console.log(`Preference Intention Rate : ${(predResult.breakdown.weightedFactors.preferenceIntentionRate * 100).toFixed(1)}% (10% weight)`);
        console.log(`\n-- BOUNDED ADJUSTMENTS (Clamped to ±10% max) --`);
        console.log(`Menu Appeal Adjustment    : ${predResult.breakdown.boundedAdjustments.menuAdjustmentPercent > 0 ? "+" : ""}${predResult.breakdown.boundedAdjustments.menuAdjustmentPercent}%`);
        console.log(`Macro Trend Drift         : ${predResult.breakdown.boundedAdjustments.macroTrendAdjustmentPercent > 0 ? "+" : ""}${predResult.breakdown.boundedAdjustments.macroTrendAdjustmentPercent}%`);
        console.log(`\n-- PREDICTION & RECOMMENDATION --`);
        console.log(`Expected Diners           : ${predResult.expectedDiners}`);
        console.log(`Recommended Servings      : ${predResult.recommendedServings} (with 5% buffer)`);
        console.log(`\n-- HISTORICAL OUTCOME WASTE-RISK EVIDENCE --`);
        console.log(`Waste Risk Level          : ${predResult.wasteRisk}`);
        console.log(`Historical Leftover Rate  : ${predResult.breakdown.wasteEvidence.averageLeftoverPercent}%`);
        console.log(`Historical Food Waste Rate: ${predResult.breakdown.wasteEvidence.averageWastePercent}%`);
        console.log(`Excess Leftover Frequency : ${predResult.breakdown.wasteEvidence.excessiveLeftoverFrequencyPercent}%`);
        console.log(`Waste Reasoning           : ${predResult.breakdown.wasteEvidence.riskReasoning}`);
        console.log(`\n-- CONFIDENCE CLASSIFICATION --`);
        console.log(`Confidence Level          : ${predResult.confidenceLevel}`);
        console.log(`Comparable Meals Evaluated: ${predResult.breakdown.confidenceMetrics.comparableMealsCount}`);
        console.log(`Calculated Attendance CV  : ${(predResult.breakdown.confidenceMetrics.calculatedCoefficientOfVariation * 100).toFixed(1)}%`);
        console.log(`Confidence Basis          : ${predResult.confidenceReason}`);
        console.log(`======================================================\n`);
      }
    }
  }

  // Audit log entry
  await prisma.auditLog.create({
    data: {
      action: "INITIAL_SYNTHETIC_DATA_SEED",
      userRole: "HOSTEL_ADMIN",
      details: {
        residents: 125,
        studentCount: 50,
        corporateCount: 75,
        totalMealsSeeded: totalMeals,
        totalPreferencesSeeded: totalPreferences,
        totalScansSeeded: totalScans,
        timeframeDays: 90,
      },
    },
  });

  console.log(`✅ Seeding complete!`);
  console.log(`- Residents: 125 (50 students, 75 corporate)`);
  console.log(`- Meals: ${totalMeals}`);
  console.log(`- Preferences logged: ${totalPreferences}`);
  console.log(`- Physical scans recorded: ${totalScans}`);
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
