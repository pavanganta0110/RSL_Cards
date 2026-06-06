import { db } from '../../../db/index.js';
import { sql } from 'drizzle-orm';
import { aiActions, aiWatchlist } from '../../../db/schema/ai_pilot.js';
import { InventoryService } from '../../inventory/inventory.service.js';
import { InventoryRepository } from '../../inventory/inventory.repository.js';
import { CardDbService } from '../../card-db/card-db.service.js';
import { CardDbRepository } from '../../card-db/card-db.repository.js';
import { ListingService } from '../../listing/listing.service.js';
import { ListingRepository } from '../../listing/listing.repository.js';
import { TransactionService } from '../../transaction/transaction.service.js';
import { TransactionRepository } from '../../transaction/transaction.repository.js';
import { logger } from '../../../lib/logger.js';
import { cacheProvider } from '../providers/cache.provider.js';

// Instantiate core services
const inventoryRepo = new InventoryRepository();
const inventoryService = new InventoryService(inventoryRepo);

const cardDbRepo = new CardDbRepository();
const cardDbService = new CardDbService(cardDbRepo);

const listingRepo = new ListingRepository();
const listingService = new ListingService(listingRepo);

const transactionRepo = new TransactionRepository();
const transactionService = new TransactionService(transactionRepo);

export async function handleToolCall(
  name: string,
  args: any,
  userId: string,
  conversationId?: string
): Promise<any> {
  logger.info({ name, args, userId }, 'Executing AI tool call');
  
  switch (name) {
    // ────────── READ TOOLS ──────────
    case 'searchInventory': {
      const { sport, grade, status, limit = 5, page = 1 } = args;
      const queryParams = { sport, grade, status, limit, page };
      const result = await inventoryService.getInventory(queryParams, userId);
      // Minify response to avoid bloating token count
      return {
        items: result.items.map((item: any) => ({
          id: item.id,
          playerName: item.player_name,
          year: item.year,
          setName: item.set_name,
          variation: item.variation,
          sport: item.sport,
          gradeKey: item.grade_key,
          costBasis: item.cost_basis,
          currentMarketValue: item.current_market_value,
          listingStatus: item.listing_status,
        })),
        pagination: result.pagination
      };
    }

    case 'searchOnlineCards': {
      const { keyword, limit = 5 } = args;
      const cacheKey = `online_search:${keyword}:${limit}`;
      const cached = await cacheProvider.get(cacheKey);
      if (cached) {
        logger.info({ keyword }, 'Online search cache hit');
        return JSON.parse(cached);
      }

      // Live search active listings on eBay
      const ebayResult = await listingService.ebaySearch({ q: keyword, limit });
      const summaries = (ebayResult.itemSummaries || []).map((item: any) => ({
        itemId: item.itemId,
        title: item.title,
        price: item.price?.value,
        shipping: item.shippingOptions?.[0]?.shippingCost?.value || '0.00',
        image: item.image?.imageUrl,
        url: item.itemWebUrl,
        condition: item.condition,
        seller: item.seller?.username,
        platform: 'ebay'
      }));

      // Fetch MySlabs active listings
      try {
        const myslabsResult = await listingService.myslabsSold({ q: keyword, limit });
        if (myslabsResult && myslabsResult.activeListings) {
          const myslabsSummaries = myslabsResult.activeListings.map((item: any) => ({
            itemId: item.itemId,
            title: item.title,
            price: item.price?.value || (item.price as any)?.toString() || '0.00',
            shipping: '0.00',
            image: item.image?.imageUrl || item.image,
            url: item.itemWebUrl,
            condition: item.condition,
            seller: 'myslabs_seller',
            platform: 'myslabs'
          }));
          summaries.push(...myslabsSummaries);
        }
      } catch (err: any) {
        logger.warn({ error: err.message }, 'Failed to fetch active listings from MySlabs');
      }

      const response = { keyword, items: summaries.slice(0, limit) };
      await cacheProvider.set(cacheKey, JSON.stringify(response), 600); // 10 min cache
      return response;
    }

    case 'findComps': {
      const { keyword, gradeKey = 'RAW', limit = 5 } = args;
      const cacheKey = `comps:${keyword}:${gradeKey}:${limit}`;
      const cached = await cacheProvider.get(cacheKey);
      if (cached) {
        logger.info({ keyword }, 'Comps cache hit');
        return JSON.parse(cached);
      }

      // Fetch eBay sold comps
      const result = await listingService.ebaySold({ q: keyword, grade_key: gradeKey, limit });
      const recentSales = (result.last30Days?.items || []).slice(0, limit).map((s: any) => ({
        title: s.title,
        soldPrice: s.soldPrice?.value,
        endDate: s.endDate,
        url: s.itemWebUrl,
        platform: 'ebay'
      }));

      // Fetch MySlabs sold comps
      try {
        const myslabsResult = await listingService.myslabsSold({ q: keyword, grade_key: gradeKey, limit });
        if (myslabsResult && myslabsResult.last30Days?.items) {
          const myslabsSales = myslabsResult.last30Days.items.slice(0, limit).map((s: any) => ({
            title: s.title,
            soldPrice: s.soldPrice?.value,
            endDate: s.endDate,
            url: s.itemWebUrl,
            platform: 'myslabs'
          }));
          recentSales.push(...myslabsSales);
        }
      } catch (err: any) {
        logger.warn({ error: err.message }, 'Failed to fetch sold comps from MySlabs');
      }

      const response = {
        query: result.query,
        snapshots: result.snapshots,
        recentSales: recentSales.slice(0, limit)
      };

      await cacheProvider.set(cacheKey, JSON.stringify(response), 900); // 15 min cache
      return response;
    }

    case 'getInventoryAnalytics': {
      const summary = (await inventoryService.getInventorySummary(userId)) as any;
      return {
        totalCards: Number(summary.total_cards || 0),
        totalCostBasis: parseFloat(summary.total_cost_basis || '0'),
        totalMarketValue: parseFloat(summary.total_market_value || '0'),
        totalUnrealizedGain: parseFloat(summary.total_unrealized_gain || '0'),
        unrealizedGainPct: summary.total_cost_basis > 0
          ? parseFloat(((summary.total_market_value - summary.total_cost_basis) / summary.total_cost_basis * 100).toFixed(1))
          : 0
      };
    }

    case 'getProfitSummary': {
      const todayStats = await transactionService.getTransactionsToday(userId);
      // Fallback/calculated stats if todayStats is mock/stub
      const transactions = await db.execute(sql`
        SELECT type, price, cost_basis, profit FROM transactions
        WHERE user_id = ${userId} AND created_at >= NOW() - INTERVAL '30 days'
      `);
      
      const last30d = (transactions.rows as any[]).reduce(
        (acc, row) => {
          if (row.type === 'sell') {
            acc.revenue += parseFloat(row.price || '0');
            acc.profit += parseFloat(row.profit || '0');
            acc.soldCount += 1;
          } else if (row.type === 'buy') {
            acc.spent += parseFloat(row.price || '0');
            acc.boughtCount += 1;
          }
          return acc;
        },
        { revenue: 0, profit: 0, spent: 0, boughtCount: 0, soldCount: 0 }
      );

      return {
        today: todayStats,
        last30Days: {
          revenue: parseFloat(last30d.revenue.toFixed(2)),
          profit: parseFloat(last30d.profit.toFixed(2)),
          spent: parseFloat(last30d.spent.toFixed(2)),
          cardsBought: last30d.boughtCount,
          cardsSold: last30d.soldCount
        }
      };
    }

    // ────────── WRITE TOOLS (PENDING CONFIRMATION) ──────────
    case 'updatePrice': {
      const { inventoryId, price } = args;
      if (!inventoryId || !price) throw new Error('Missing inventoryId or price');
      
      // Check ownership
      const item = await inventoryService.getInventoryId(inventoryId, userId);
      if (!item) throw new Error('Inventory card not found or access denied');

      const action = await db.insert(aiActions).values({
        userId,
        conversationId: conversationId || null,
        actionType: 'price_update',
        targetId: inventoryId,
        status: 'pending_confirmation',
        payload: { inventoryId, price, oldPrice: item.current_market_value }
      }).returning();

      return {
        actionId: action[0].id,
        pending: true,
        message: `I need your confirmation to update the price of "${item.player_name}" from $${item.current_market_value} to $${price}.`
      };
    }

    case 'addInventoryItem': {
      const action = await db.insert(aiActions).values({
        userId,
        conversationId: conversationId || null,
        actionType: 'add_inventory',
        status: 'pending_confirmation',
        payload: args
      }).returning();

      return {
        actionId: action[0].id,
        pending: true,
        message: `I need your confirmation to add ${args.year || ''} ${args.setName || ''} ${args.variation || ''} (${args.sport}) to your inventory for a cost basis of $${args.costBasis}.`
      };
    }

    case 'markSold': {
      const { inventoryId, price } = args;
      if (!inventoryId || !price) throw new Error('Missing inventoryId or price');
      
      const item = await inventoryService.getInventoryId(inventoryId, userId);
      if (!item) throw new Error('Inventory card not found or access denied');

      const action = await db.insert(aiActions).values({
        userId,
        conversationId: conversationId || null,
        actionType: 'mark_sold',
        targetId: inventoryId,
        status: 'pending_confirmation',
        payload: args
      }).returning();

      return {
        actionId: action[0].id,
        pending: true,
        message: `I need your confirmation to record the sale of "${item.player_name}" for $${price}.`
      };
    }

    case 'createListing': {
      const { inventoryId, price } = args;
      if (!inventoryId || !price) throw new Error('Missing inventoryId or price');

      const item = await inventoryService.getInventoryId(inventoryId, userId);
      if (!item) throw new Error('Inventory card not found or access denied');

      const action = await db.insert(aiActions).values({
        userId,
        conversationId: conversationId || null,
        actionType: 'create_listing',
        targetId: inventoryId,
        status: 'pending_confirmation',
        payload: args
      }).returning();

      return {
        actionId: action[0].id,
        pending: true,
        message: `I need your confirmation to publish "${item.player_name}" for sale on eBay at $${price}.`
      };
    }

    case 'addToWatchlist': {
      const action = await db.insert(aiActions).values({
        userId,
        conversationId: conversationId || null,
        actionType: 'add_watchlist',
        status: 'pending_confirmation',
        payload: args
      }).returning();

      return {
        actionId: action[0].id,
        pending: true,
        message: `I need your confirmation to add this card to your watchlist.`
      };
    }

    case 'addOnlineCardToInventory': {
      const action = await db.insert(aiActions).values({
        userId,
        conversationId: conversationId || null,
        actionType: 'add_inventory',
        status: 'pending_confirmation',
        payload: args
      }).returning();

      return {
        actionId: action[0].id,
        pending: true,
        message: `I need your confirmation to import online card "${args.playerName}" into your inventory for a cost basis of $${args.costBasis}.`
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ────────── EXECUTION OF CONFIRMED WRITE ACTIONS ──────────
export async function executeAction(actionId: string, userId: string): Promise<any> {
  const result = await db.execute(sql`
    SELECT * FROM ai_actions WHERE id = ${actionId} AND user_id = ${userId} LIMIT 1
  `);
  
  if (result.rows.length === 0) {
    throw new Error('Action not found or permission denied');
  }

  const action = result.rows[0] as any;
  if (action.status !== 'pending_confirmation') {
    throw new Error(`Action is already ${action.status}`);
  }

  const payload = action.payload;
  logger.info({ actionId, type: action.actionType, userId }, 'Executing confirmed AI action');

  try {
    switch (action.action_type) {
      case 'price_update': {
        const { inventoryId, price } = payload;
        await listingService.patchListingsIdPrice(inventoryId, { price });
        break;
      }
      case 'add_inventory': {
        await inventoryService.postInventory(payload, userId);
        break;
      }
      case 'mark_sold': {
        // payload: inventoryId, price, channel, paymentMethod
        const item = await inventoryService.getInventoryId(payload.inventoryId, userId);
        const sellPayload = {
          inventoryId: payload.inventoryId,
          playerName: item.player_name,
          price: payload.price,
          costBasis: item.cost_basis,
          channel: payload.channel || 'other',
          paymentMethod: payload.paymentMethod || 'other',
          dealRating: 'fair_price'
        };
        await transactionService.postTransactionsSell(userId, sellPayload);
        break;
      }
      case 'create_listing': {
        const { inventoryId, price, description = '' } = payload;
        const publishPayload = {
          inventoryId,
          price,
          description,
          condition: 'Used',
          format: 'FixedPrice'
        };
        await listingService.publishEbayListing(userId, publishPayload);
        break;
      }
      case 'add_watchlist': {
        const { cardId, variantId, gradeKey, targetPrice } = payload;
        await db.insert(aiWatchlist).values({
          userId,
          cardId: cardId || null,
          variantId: variantId || null,
          gradeKey: gradeKey || null,
          targetPrice: targetPrice ? targetPrice.toString() : null
        });
        break;
      }
      default:
        throw new Error(`Unhandled action type: ${action.actionType}`);
    }

    await db.execute(sql`
      UPDATE ai_actions SET status = 'completed', updated_at = NOW() WHERE id = ${actionId}
    `);
    return { success: true };
  } catch (err: any) {
    await db.execute(sql`
      UPDATE ai_actions SET status = 'failed', payload = ${JSON.stringify({ ...payload, error: err.message })}::jsonb, updated_at = NOW() WHERE id = ${actionId}
    `);
    throw err;
  }
}
