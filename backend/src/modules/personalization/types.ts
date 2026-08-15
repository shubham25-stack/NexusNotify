export interface PersonalizationResult {
  score: number;

  reasons: string[];

  userPreference: string;

  confidence: number;
}
