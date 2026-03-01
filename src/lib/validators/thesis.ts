import { z } from 'zod';

const STRATEGY_TYPES = ['value', 'growth', 'momentum', 'quality', 'garp', 'custom'] as const;
const TONE_OPTIONS = ['conservative', 'moderate', 'aggressive'] as const;

/**
 * Input schema for generating an AI investment thesis for a single stock.
 * Validated by the POST /api/thesis/generate endpoint.
 */
export const GenerateThesisSchema = z.object({
  stockId: z.string().uuid(),
  strategyType: z.enum(STRATEGY_TYPES),
  tone: z.enum(TONE_OPTIONS),
});

/**
 * Input schema for batch thesis generation (up to 10 stocks at once).
 * Validated by the POST /api/thesis/batch endpoint.
 */
export const BatchThesisSchema = z.object({
  stockIds: z.array(z.string().uuid()).min(1).max(10),
  strategyType: z.enum(STRATEGY_TYPES),
  tone: z.enum(TONE_OPTIONS),
});

/**
 * Input schema for regenerating an existing thesis with a different tone.
 * Validated by the POST /api/thesis/regenerate endpoint.
 */
export const RegenerateThesisSchema = z.object({
  thesisId: z.string().uuid(),
  tone: z.enum(TONE_OPTIONS),
});

// Inferred TypeScript types
export type GenerateThesisInput = z.infer<typeof GenerateThesisSchema>;
export type BatchThesisInput = z.infer<typeof BatchThesisSchema>;
export type RegenerateThesisInput = z.infer<typeof RegenerateThesisSchema>;
