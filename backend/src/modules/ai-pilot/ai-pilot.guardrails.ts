const ALLOWED_KEYWORDS = [
  'card', 'prizm', 'chrome', 'topps', 'panini', 'bowman', 'grade', 'psa', 'bgs', 'sgc', 'raw',
  'ebay', 'myslabs', 'sold', 'price', 'market', 'comp', 'inventory', 'listing', 'sale', 'sell',
  'buy', 'profit', 'dealer', 'sport', 'player', 'rookie', 'football', 'basketball', 'baseball',
  'soccer', 'relic', 'autograph', 'slab', 'portfolio', 'revenue', 'cost', 'fee', 'watchlist',
  'calculate', 'how much', 'value', 'stock', 'analytics', 'report', 'chart', 'opportunity',
  'customer', 'show', 'booth', 'trade', 'cash', 'zelle', 'venmo', 'paypal', 'hi', 'hello', 'hey', 'help'
];

export const GUARDRAIL_REJECTION_MESSAGE = 'I can only help with sports cards, inventory, pricing, listings, sales, and dealer operations.';

export function checkMessageGuardrails(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  
  // Basic empty checks
  if (!normalized) return false;

  // Heuristic: Check if at least one sports-card-related keyword is present
  const words = normalized.split(/[^a-z0-9]+/);
  const hasKeyword = words.some(word => ALLOWED_KEYWORDS.includes(word) || 
    ALLOWED_KEYWORDS.some(keyword => word.includes(keyword))
  );

  return hasKeyword;
}

export function enforceGuardrailResponse(text: string): string {
  const normalized = text.toLowerCase().trim();
  if (
    normalized.includes('i cannot help') ||
    normalized.includes('i can only help') ||
    normalized.includes('unrelated') ||
    normalized.includes('sorry,') ||
    !normalized
  ) {
    return GUARDRAIL_REJECTION_MESSAGE;
  }
  return text;
}
