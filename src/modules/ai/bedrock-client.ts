import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { AggregateExplanationInput } from "./explanation-types";

/**
 * Server-side Amazon Bedrock Runtime Client
 *
 * ARCHITECTURAL CONSTRAINTS:
 * 1. Server-side execution only. Credentials and secrets are never sent to client-side JS.
 * 2. Uses the AWS SDK's standard credential provider chain:
 *    - Local development: developer's configured AWS profile/credentials/env (~/.aws/credentials or env vars).
 *    - AWS deployment: IAM execution role / managed instance credentials.
 * 3. BEDROCK_MODEL_ID is fully configurable. No specific model is hardcoded as guaranteed.
 *    If BEDROCK_MODEL_ID is missing or Bedrock is unreachable, the calling layer falls back gracefully.
 * 4. Strictly an explanation layer: receives only aggregate factor rates. Zero resident PII.
 */

// Cached singleton client instance
let bedrockClientInstance: BedrockRuntimeClient | null = null;

export function getBedrockRegion(): string {
  return process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-1";
}

export function getBedrockModelId(): string | null {
  const modelId = process.env.BEDROCK_MODEL_ID?.trim();
  return modelId && modelId.length > 0 ? modelId : null;
}

export function getBedrockRuntimeClient(): BedrockRuntimeClient {
  if (!bedrockClientInstance) {
    const region = getBedrockRegion();
    // Relies on standard AWS credential provider chain
    bedrockClientInstance = new BedrockRuntimeClient({ region });
  }
  return bedrockClientInstance;
}

/**
 * For test injection or resetting client instances
 */
export function setBedrockRuntimeClient(client: BedrockRuntimeClient | null) {
  bedrockClientInstance = client;
}

const SYSTEM_PROMPT = `You are the explanation intelligence layer for MessMind, an intelligent hostel dining operations platform.
Your sole job is to generate a concise 1-2 sentence, manager-friendly explanation for kitchen managers based strictly on the provided aggregate factors.

Strict Rules:
1. Never calculate, adjust, or invent numbers. The expected diners and baselines are deterministically calculated by the mathematical prediction engine.
2. Never mention or extrapolate individual residents, room numbers, personal IDs, or private data.
3. Compare the forecast to the historical baseline and highlight which aggregate signals (e.g. recent attendance trend, preference opt-ins, day-of-week pattern, or menu appeal) are driving the variance.
4. Keep the output strictly concise: 1 to 2 sentences only. No markdown formatting, bullet points, asterisks, or conversational preamble.`;

function buildAggregatePrompt(input: AggregateExplanationInput): string {
  const diff = input.expectedDiners - input.historicalBaseline;
  const direction = diff > 0 ? `+${diff}` : `${diff}`;

  return `Aggregate Forecast Drivers:
- Meal: ${input.day} ${input.mealType}${input.menuName ? ` (${input.menuName})` : ""}
- Expected Diners: ${input.expectedDiners} (Baseline: ${input.historicalBaseline}, Variance: ${direction})
- Personal History Factor: ${Math.round(input.personalHistoricalRate * 100)}% (40% weight)
- Day-of-Week Factor: ${Math.round(input.dayOfWeekRate * 100)}% (20% weight)
- Meal-Type Factor: ${Math.round(input.mealTypeRate * 100)}% (15% weight)
- Recent Attendance Trend Factor: ${Math.round(input.recentAttendanceRate * 100)}% (15% weight)
- Preference Intention Factor: ${Math.round(input.preferenceIntentionRate * 100)}% (10% weight)
- Menu Adjustment: ${input.menuAdjustment >= 0 ? "+" : ""}${input.menuAdjustment}%
- Trend Adjustment: ${input.trendAdjustment >= 0 ? "+" : ""}${input.trendAdjustment}%
- Confidence: ${input.confidence} (CV: ${input.cv}%)

Write a concise 1-2 sentence manager-friendly explanation of why demand is expected to be ${input.expectedDiners} diners compared to the baseline.`;
}

/**
 * Sends a structured aggregate explanation request through the Amazon Bedrock Converse API.
 * Throws an error if BEDROCK_MODEL_ID is not configured or if Bedrock Runtime fails.
 */
export async function sendBedrockExplanationRequest(
  input: AggregateExplanationInput
): Promise<{ text: string; modelId: string }> {
  const modelId = getBedrockModelId();
  if (!modelId) {
    throw new Error(
      "BEDROCK_MODEL_ID environment variable is not configured. Please set a valid Bedrock model ID available in your AWS region."
    );
  }

  const client = getBedrockRuntimeClient();
  const userPrompt = buildAggregatePrompt(input);

  const command = new ConverseCommand({
    modelId,
    messages: [
      {
        role: "user",
        content: [{ text: userPrompt }],
      },
    ],
    system: [{ text: SYSTEM_PROMPT }],
    inferenceConfig: {
      maxTokens: 180,
      temperature: 0.3,
    },
  });

  const response = await client.send(command);
  const text = response.output?.message?.content?.[0]?.text?.trim();

  if (!text) {
    throw new Error("Bedrock Converse API returned an empty explanation response.");
  }

  return { text, modelId };
}
