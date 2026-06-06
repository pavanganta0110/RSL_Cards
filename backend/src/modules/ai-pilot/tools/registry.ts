import { TOOL_SCHEMAS } from './schemas.js';

export const toolsRegistry = TOOL_SCHEMAS;

export type ToolName =
  | 'searchInventory'
  | 'searchOnlineCards'
  | 'findComps'
  | 'getInventoryAnalytics'
  | 'getProfitSummary'
  | 'updatePrice'
  | 'addInventoryItem'
  | 'markSold'
  | 'createListing'
  | 'addToWatchlist'
  | 'addOnlineCardToInventory';
