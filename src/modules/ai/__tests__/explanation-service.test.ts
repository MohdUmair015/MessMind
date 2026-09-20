import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  ExplanationService,
  generateDeterministicFallbackExplanation,
  sanitizeToAggregateExplanationInput,
} from "../explanation-service";
import {
  setBedrockRuntimeClient,
  getBedrockModelId,
  getBedrockRegion,
} from "../bedrock-client";
import { AggregateExplanationInput } from "../explanation-types";
import { prisma } from "@/lib/db";

describe("Phase 3C — Amazon Bedrock Explanation Layer Test Suite", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset process.env to known test defaults
    process.env.BEDROCK_REGION = "us-east-1";
    process.env.BEDROCK_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";
    setBedrockRuntimeClient(null);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    setBedrockRuntimeClient(null);
  });

  // ============================================================================
  // 1. DETERMINISTIC FALLBACK EXPLANATION TESTS
  // ============================================================================
  describe("Deterministic Fallback Explanation Generator", () => {
    it("1. Generates concise 1-2 sentence fallback when demand is slightly above baseline", () => {
      const input: AggregateExplanationInput = {
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
        menuName: "Paneer Butter Masala",
      };

      const explanation = generateDeterministicFallbackExplanation(input);

      assert.ok(explanation.length > 20, "Explanation should not be empty");
      assert.match(
        explanation,
        /Demand is expected to be 90 diners, slightly above the historical baseline of 86/,
        "Should match baseline comparison pattern"
      );
      assert.match(
        explanation,
        /Recent attendance momentum|current meal preferences|historical menu popularity/,
        "Should mention driving aggregate factors"
      );

      // Verify conciseness: approximately 1-2 sentences
      const sentenceCount = explanation.split(/\.\s+/).filter(Boolean).length;
      assert.ok(
        sentenceCount <= 2,
        `Expected 1-2 sentences, got ${sentenceCount}: "${explanation}"`
      );
    });

    it("2. Correctly reflects lower demand when attendance and opt-ins soften", () => {
      const input: AggregateExplanationInput = {
        expectedDiners: 74,
        historicalBaseline: 82,
        personalHistoricalRate: 0.60,
        dayOfWeekRate: 0.62,
        mealTypeRate: 0.65,
        recentAttendanceRate: 0.58,
        preferenceIntentionRate: 0.55,
        menuAdjustment: -2,
        trendAdjustment: -1,
        confidence: "MEDIUM",
        cv: 6.2,
        mealType: "LUNCH",
        day: "Wednesday",
      };

      const explanation = generateDeterministicFallbackExplanation(input);

      assert.match(
        explanation,
        /Demand is expected to be 74 diners, notably below the historical baseline of 82/,
        "Should accurately describe notably below baseline"
      );
      assert.match(
        explanation,
        /softening recent attendance|lower pre-meal opt-ins|lower historical interest/,
        "Should identify downward drivers"
      );
    });

    it("3. Correctly reflects demand consistent with historical baseline", () => {
      const input: AggregateExplanationInput = {
        expectedDiners: 86,
        historicalBaseline: 86,
        personalHistoricalRate: 0.70,
        dayOfWeekRate: 0.70,
        mealTypeRate: 0.70,
        recentAttendanceRate: 0.70,
        preferenceIntentionRate: 0.70,
        menuAdjustment: 0,
        trendAdjustment: 0,
        confidence: "HIGH",
        cv: 3.8,
        mealType: "DINNER",
        day: "Monday",
      };

      const explanation = generateDeterministicFallbackExplanation(input);

      assert.match(
        explanation,
        /consistent with the historical baseline of 86/,
        "Should describe consistent baseline"
      );
    });
  });

  // ============================================================================
  // 2. PRIVACY & PII SANITIZATION TESTS
  // ============================================================================
  describe("PII & Resident Data Privacy Boundary", () => {
    it("4. Strips all resident names, IDs, room numbers, and individual arrays from input", () => {
      const dirtyPayloadWithPII = {
        expectedDiners: 90,
        predictedDiners: 90,
        historicalBaseline: 86,
        confidenceLevel: "HIGH",
        breakdown: {
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
            calculatedCoefficientOfVariation: 0.044,
          },
        },
        // LEAK ATTEMPTS: Resident records, PII, individual histories
        individualProbabilities: [
          {
            residentId: "res-uuid-12345",
            residentCode: "RES-401",
            residentName: "Aarav Sharma",
            roomNumber: "B-204",
            phoneNumber: "+91-9876543210",
            probability: 0.92,
            attendanceHistory: [true, false, true, true],
          },
        ],
        residents: ["Aarav", "Priya", "Rahul"],
        secretApiKey: "should-never-be-passed",
        mealType: "DINNER",
        day: "Saturday",
      };

      const sanitized = sanitizeToAggregateExplanationInput(dirtyPayloadWithPII);

      // Verify allowed fields exist
      assert.strictEqual(sanitized.expectedDiners, 90);
      assert.strictEqual(sanitized.historicalBaseline, 86);
      assert.strictEqual(sanitized.personalHistoricalRate, 0.71);
      assert.strictEqual(sanitized.cv, 4.4);

      // Verify strict absence of any PII properties
      const sanitizedKeys = Object.keys(sanitized);
      assert.ok(!sanitizedKeys.includes("individualProbabilities"), "Must not include individualProbabilities");
      assert.ok(!sanitizedKeys.includes("residents"), "Must not include residents array");
      assert.ok(!sanitizedKeys.includes("residentId"), "Must not include residentId");
      assert.ok(!sanitizedKeys.includes("residentName"), "Must not include residentName");
      assert.ok(!sanitizedKeys.includes("roomNumber"), "Must not include roomNumber");
      assert.ok(!sanitizedKeys.includes("phoneNumber"), "Must not include phoneNumber");
      assert.ok(!sanitizedKeys.includes("secretApiKey"), "Must not include secretApiKey");

      // Verify stringified output contains zero traces of sensitive resident names or identifiers
      const serialized = JSON.stringify(sanitized);
      assert.ok(!serialized.includes("Aarav"), "PII name leaked into aggregate payload");
      assert.ok(!serialized.includes("res-uuid-12345"), "Resident UUID leaked into aggregate payload");
      assert.ok(!serialized.includes("B-204"), "Room number leaked into aggregate payload");
    });
  });

  // ============================================================================
  // 3. BEDROCK CONVERSE API MOCKING & GRACEFUL FALLBACK
  // ============================================================================
  describe("Bedrock Converse Mocking & Failure Resilience", () => {
    it("5. Successfully calls Bedrock Converse (mocked) and returns source: 'bedrock'", async () => {
      const mockBedrockResponse = {
        output: {
          message: {
            role: "assistant",
            content: [
              {
                text: "Demand is expected to be slightly higher than the recent Saturday dinner average. Recent attendance and current meal preferences are contributing to the increase, while this menu has historically shown slightly stronger participation.",
              },
            ],
          },
        },
      };

      let capturedCommand: any = null;
      const mockClient: any = {
        send: async (command: any) => {
          capturedCommand = command;
          return mockBedrockResponse;
        },
      };

      setBedrockRuntimeClient(mockClient);

      const service = new ExplanationService();
      const result = await service.generateExplanation({
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
        menuName: "Paneer Butter Masala",
      });

      assert.strictEqual(result.source, "bedrock");
      assert.strictEqual(result.modelId, "anthropic.claude-3-haiku-20240307-v1:0");
      assert.ok(result.explanation.includes("slightly higher than the recent Saturday dinner average"));
      assert.ok(capturedCommand !== null, "Converse command should have been dispatched");

      // Verify prompt sent to Bedrock Converse contains no PII
      const inputMessage = capturedCommand.input.messages[0].content[0].text;
      assert.ok(inputMessage.includes("Expected Diners: 90"));
      assert.ok(inputMessage.includes("Baseline: 86"));
      assert.ok(!inputMessage.includes("residentId"));
    });

    it("6. Recovers gracefully when Bedrock throws a service error / 500 / timeout", async () => {
      // Mock Bedrock client throwing an AWS error
      const mockFailingClient: any = {
        send: async () => {
          throw new Error("ResourceNotFoundException: Model ID not enabled in region us-east-1");
        },
      };

      setBedrockRuntimeClient(mockFailingClient);

      const service = new ExplanationService();
      const result = await service.generateExplanation({
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
      });

      // Verify system did NOT crash and gracefully fell back to deterministic explanation
      assert.strictEqual(result.source, "fallback");
      assert.ok(result.explanation.length > 20);
      assert.match(
        result.explanation,
        /Demand is expected to be 90 diners, slightly above the historical baseline of 86/
      );
    });

    it("7. Recovers gracefully when BEDROCK_MODEL_ID is not configured", async () => {
      delete process.env.BEDROCK_MODEL_ID;

      const service = new ExplanationService();
      const result = await service.generateExplanation({
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
      });

      assert.strictEqual(result.source, "fallback");
      assert.match(result.explanation, /Demand is expected to be 90 diners/);
    });
  });

  // ============================================================================
  // 4. PREDICTION ENGINE PURITY TEST
  // ============================================================================
  describe("Mathematical Engine Independence Guarantee", () => {
    it("8. Ensures explanation generation NEVER alters predicted numbers or safety buffer", () => {
      const originalExpectedDiners = 90;
      const originalBaseline = 86;
      const originalCV = 4.4;

      const input: AggregateExplanationInput = {
        expectedDiners: originalExpectedDiners,
        historicalBaseline: originalBaseline,
        personalHistoricalRate: 0.71,
        dayOfWeekRate: 0.71,
        mealTypeRate: 0.71,
        recentAttendanceRate: 0.72,
        preferenceIntentionRate: 0.75,
        menuAdjustment: 1,
        trendAdjustment: 1,
        confidence: "HIGH",
        cv: originalCV,
        mealType: "DINNER",
        day: "Saturday",
      };

      const fallback = generateDeterministicFallbackExplanation(input);

      // Verify that input numbers remain strictly unchanged
      assert.strictEqual(input.expectedDiners, originalExpectedDiners);
      assert.strictEqual(input.historicalBaseline, originalBaseline);
      assert.strictEqual(input.cv, originalCV);

      // Fallback mentions exact number 90 without math deviation
      assert.ok(fallback.includes("90 diners"));
      assert.ok(fallback.includes("86"));
    });
  });

  // ============================================================================
  // 5. PHASE 3C.1 — EXPLANATION CACHING & PERSISTENCE TEST SUITE
  // ============================================================================
  describe("Phase 3C.1 Explanation Caching & Persistence", () => {
    it("9. Existing cached explanation returns immediately without invoking Bedrock", async () => {
      let bedrockCalled = false;
      const mockBedrockClient: any = {
        send: async () => {
          bedrockCalled = true;
          return { output: { message: { content: [{ text: "Bedrock should not be called" }] } } };
        },
      };
      setBedrockRuntimeClient(mockBedrockClient);

      const meal = await prisma.meal.findFirst({
        where: { prediction: { isNot: null } },
        include: { prediction: true },
      });
      assert.ok(meal && meal.prediction, "Meal with prediction must exist in test database");

      const cachedText = "Pre-cached explanation text from earlier Bedrock invocation.";
      await prisma.prediction.update({
        where: { id: meal.prediction.id },
        data: { explanation: cachedText, explanationSource: "bedrock" },
      });

      const service = new ExplanationService();
      const result = await service.getExplanationForMeal(meal.id);

      assert.strictEqual(bedrockCalled, false, "Bedrock MUST NOT be called when explanation is cached");
      assert.strictEqual(result.cached, true, "Result should have cached: true");
      assert.strictEqual(result.explanation, cachedText);
      assert.strictEqual(result.source, "bedrock", "Cached bedrock explanation must preserve source: 'bedrock'");
    });

    it("10. Missing explanation causes explanation generation and caches to database", async () => {
      let bedrockCallCount = 0;
      const expectedText = "Bedrock newly generated explanation for freshly predicted meal.";
      const mockBedrockClient: any = {
        send: async () => {
          bedrockCallCount++;
          return { output: { message: { content: [{ text: expectedText }] } } };
        },
      };
      setBedrockRuntimeClient(mockBedrockClient);

      const meal = await prisma.meal.findFirst({
        where: { prediction: { isNot: null } },
        include: { prediction: true },
      });
      assert.ok(meal && meal.prediction);

      // Clear the explanation cache in database
      await prisma.prediction.update({
        where: { id: meal.prediction.id },
        data: { explanation: null, explanationSource: null },
      });

      const service = new ExplanationService();
      const result = await service.getExplanationForMeal(meal.id);

      assert.strictEqual(bedrockCallCount, 1, "Bedrock must be called when cache is missing");
      assert.strictEqual(result.explanation, expectedText);
      assert.strictEqual(result.source, "bedrock");

      // Verify persisted to PostgreSQL
      const updatedPrediction = await prisma.prediction.findUnique({
        where: { id: meal.prediction.id },
      });
      assert.strictEqual(updatedPrediction?.explanation, expectedText);
      assert.strictEqual(updatedPrediction?.explanationSource, "bedrock");

      // Verify second call hits cache immediately and does not invoke Bedrock
      const cachedResult = await service.getExplanationForMeal(meal.id);
      assert.strictEqual(bedrockCallCount, 1, "Bedrock must not be called again on subsequent request");
      assert.strictEqual(cachedResult.cached, true);
      assert.strictEqual(cachedResult.explanation, expectedText);
      assert.strictEqual(cachedResult.source, "bedrock");
    });

    it("11. Fallback-generated explanations are accurately represented and cached as fallback", async () => {
      const mockFailingClient: any = {
        send: async () => {
          throw new Error("Bedrock Service Unavailable");
        },
      };
      setBedrockRuntimeClient(mockFailingClient);

      const meal = await prisma.meal.findFirst({
        where: { prediction: { isNot: null } },
        include: { prediction: true },
      });
      assert.ok(meal && meal.prediction);

      // Clear cache
      await prisma.prediction.update({
        where: { id: meal.prediction.id },
        data: { explanation: null, explanationSource: null },
      });

      const service = new ExplanationService();
      const result = await service.getExplanationForMeal(meal.id);

      assert.strictEqual(result.source, "fallback", "Fallback explanation must return source: 'fallback'");
      assert.ok(result.explanation.includes("Demand is expected to be"));

      // Verify database recorded explanationSource as 'fallback'
      const updated = await prisma.prediction.findUnique({
        where: { id: meal.prediction.id },
      });
      assert.strictEqual(updated?.explanationSource, "fallback");
      assert.ok(updated?.explanation);

      // Verify cached retrieval also accurately preserves 'fallback' (does not falsely return 'bedrock')
      const cachedResult = await service.getExplanationForMeal(meal.id);
      assert.strictEqual(cachedResult.source, "fallback", "Must not falsely return 'bedrock' for cached fallback");
      assert.strictEqual(cachedResult.cached, true);
    });

    it("12. Database cache-write failure does not prevent the explanation from being returned", async () => {
      const service = new ExplanationService();

      const originalUpdate = prisma.prediction.update;
      let updateAttempted = false;
      (prisma.prediction as any).update = async () => {
        updateAttempted = true;
        throw new Error("Database connection glitch / read-only replica");
      };

      try {
        const meal = await prisma.meal.findFirst({
          where: { prediction: { isNot: null } },
          include: { prediction: true, menu: true },
        });
        assert.ok(meal && meal.prediction);

        const mockMeal = {
          ...meal,
          menu: meal.menu || { name: "Paneer Butter Masala" },
          prediction: {
            ...meal.prediction,
            explanation: null,
            explanationSource: null,
          },
        };

        const originalFindUnique = prisma.meal.findUnique;
        (prisma.meal as any).findUnique = async () => mockMeal;

        try {
          const result = await service.getExplanationForMeal(meal.id);
          assert.ok(result.explanation.length > 20, "Explanation must be returned even if DB cache write fails");
          assert.ok(updateAttempted, "DB cache write was attempted");
        } finally {
          (prisma.meal as any).findUnique = originalFindUnique;
        }
      } finally {
        prisma.prediction.update = originalUpdate;
      }
    });

    it("13. Prediction numbers and recommended servings remain strictly unchanged", async () => {
      const meal = await prisma.meal.findFirst({
        where: { prediction: { isNot: null } },
        include: { prediction: true },
      });
      assert.ok(meal && meal.prediction);

      const preExpectedDiners = meal.prediction.predictedDiners;
      const preRecommendedServings = meal.prediction.recommendedServings;

      const service = new ExplanationService();
      await service.getExplanationForMeal(meal.id);

      const postMeal = await prisma.meal.findFirst({
        where: { id: meal.id },
        include: { prediction: true },
      });
      assert.ok(postMeal && postMeal.prediction);

      assert.strictEqual(
        postMeal.prediction.predictedDiners,
        preExpectedDiners,
        "predictedDiners must remain identical"
      );
      assert.strictEqual(
        postMeal.prediction.recommendedServings,
        preRecommendedServings,
        "recommendedServings must remain identical"
      );
    });
  });
});
