export interface CostCalculation {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  model: string;
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // Standard approximation: 1 token ~ 4 characters
  return Math.ceil(text.length / 4);
}

export function calculateExecutionCost(
  model: string,
  inputCharCount: number,
  outputCharCount: number
): CostCalculation {
  const inputTokens = estimateTokenCount(typeof inputCharCount === 'number' ? 'a'.repeat(inputCharCount) : '');
  const outputTokens = estimateTokenCount(typeof outputCharCount === 'number' ? 'a'.repeat(outputCharCount) : '');
  
  const isPro = model.toLowerCase().includes('pro');
  
  // Rates per 1,000,000 tokens
  const inputRate = isPro ? 1.25 : 0.075;
  const outputRate = isPro ? 5.00 : 0.30;
  
  const estimatedCost = (inputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate;
  
  return {
    inputTokens,
    outputTokens,
    estimatedCost: parseFloat(estimatedCost.toFixed(6)),
    model,
  };
}
