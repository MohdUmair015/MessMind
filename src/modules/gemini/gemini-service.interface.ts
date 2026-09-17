import { AggregatedExplanationPayload, GeminiExplanationResult } from "./types";

export interface IGeminiExplanationService {
  /**
   * Generates a manager-friendly natural language summary explaining the factors
   * behind a deterministic demand prediction.
   */
  generateExplanation(payload: AggregatedExplanationPayload): Promise<GeminiExplanationResult>;
}
