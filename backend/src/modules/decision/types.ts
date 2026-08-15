import type { Action } from "../context/context.types.js";

export interface DecisionResult {
  action: Action;

  confidence: number;

  reasons: string[];
}
