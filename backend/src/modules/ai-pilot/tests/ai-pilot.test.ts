import { expect, test, describe, beforeAll } from "bun:test";
import { aiPilotService } from "../ai-pilot.service.js";
import { aiPilotRepository } from "../ai-pilot.repository.js";
import { llmProvider } from "../providers/llm.provider.js";
import { db } from "../../../db/index.js";
import { truncateAllTables } from "../../../tests/db.setup.js";
import { users } from "../../../db/schema/auth.js";
import { aiConversations, aiMessages, aiActions, aiCardSearchResults, aiWatchlist } from "../../../db/schema/ai_pilot.js";
import { sql, eq } from "drizzle-orm";

describe("CardPilot AI Feature Suite", () => {
  let user1Id: string;
  let user2Id: string;
  let user1InventoryId: string;
  let user2InventoryId: string;
  let mockPlayerId: string;

  beforeAll(async () => {
    await truncateAllTables();

    // 1. Create two test users
    const [u1] = await db.insert(users).values({
      email: "dealer1@rslcards.com",
    }).returning();
    user1Id = u1.id;

    const [u2] = await db.insert(users).values({
      email: "dealer2@rslcards.com",
    }).returning();
    user2Id = u2.id;

    // 2. Seed player
    const playerRes = await db.execute(sql`
      INSERT INTO players (id, name, sport, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Tom Brady', 'football', NOW(), NOW())
      RETURNING id
    `);
    mockPlayerId = (playerRes.rows[0] as any).id;

    // 3. Seed inventory items
    const inv1Res = await db.execute(sql`
      INSERT INTO inventory (id, user_id, player_id, year, set_name, variation, sport, cost_basis, current_market_value, quantity, listing_status, created_at, updated_at)
      VALUES (gen_random_uuid(), ${user1Id}, ${mockPlayerId}, 2000, 'Bowman Chrome', 'Refractor', 'football', '500.00', '1500.00', 1, 'listed', NOW(), NOW())
      RETURNING id
    `);
    user1InventoryId = (inv1Res.rows[0] as any).id;

    const inv2Res = await db.execute(sql`
      INSERT INTO inventory (id, user_id, player_id, year, set_name, variation, sport, cost_basis, current_market_value, quantity, listing_status, created_at, updated_at)
      VALUES (gen_random_uuid(), ${user2Id}, ${mockPlayerId}, 2000, 'Bowman Chrome', 'Base', 'football', '100.00', '200.00', 1, 'listed', NOW(), NOW())
      RETURNING id
    `);
    user2InventoryId = (inv2Res.rows[0] as any).id;
  });

  // Test 1: Unrelated question blocked
  test("unrelated question blocked by guardrails", async () => {
    const response = await aiPilotService.processChat(user1Id, "Who won the World War II?");
    expect(response.message).toBe("I can only help with sports cards, inventory, pricing, listings, sales, and dealer operations.");
    
    // Check message saved in db
    const conv = await db.select().from(aiConversations).where(eq(aiConversations.userId, user1Id)).limit(1);
    expect(conv.length).toBe(1);
    
    const msgs = await db.select().from(aiMessages).where(eq(aiMessages.conversationId, conv[0].id));
    expect(msgs.some(m => m.role === "user" && m.content === "Who won the World War II?")).toBe(true);
    expect(msgs.some(m => m.role === "assistant" && m.content === "I can only help with sports cards, inventory, pricing, listings, sales, and dealer operations.")).toBe(true);
  });

  // Test 2: Inventory search works
  test("inventory search works via tool handlers", async () => {
    const { handleToolCall } = await import("../tools/handlers.js");
    const result = await handleToolCall("searchInventory", { sport: "football" }, user1Id);
    
    expect(result.items.length).toBe(1);
    expect(result.items[0].playerName).toBe("Tom Brady");
    expect(result.items[0].id).toBe(user1InventoryId);
  });

  // Test 3: Online card search works
  test("online card search works and returns minified mock items", async () => {
    const { handleToolCall } = await import("../tools/handlers.js");
    // Directly testing tool handler as searchOnlineCards hits eBay service under the hood
    // Mock listingService.ebaySearch before execution
    const { ListingService } = await import("../../listing/listing.service.js");
    const originalEbaySearch = ListingService.prototype.ebaySearch;
    
    ListingService.prototype.ebaySearch = async () => ({
      total: 1,
      limit: 1,
      offset: 0,
      itemSummaries: [
        {
          itemId: "ebay-999",
          title: "Tom Brady 2000 Bowman Chrome Rookie RC",
          price: { value: "2500.00" },
          shippingOptions: [{ shippingCost: { value: "10.00" } }],
          image: { imageUrl: "http://image.com" },
          itemWebUrl: "http://ebay.com",
          condition: "PSA 9",
          seller: { username: "brady_collector" }
        }
      ]
    } as any);

    try {
      const result = await handleToolCall("searchOnlineCards", { keyword: "Tom Brady" }, user1Id);
      expect(result.items.length).toBe(1);
      expect(result.items[0].itemId).toBe("ebay-999");
      expect(result.items[0].price).toBe("2500.00");
    } finally {
      ListingService.prototype.ebaySearch = originalEbaySearch;
    }
  });

  // Test 4: Price update creates pending action
  test("price update creates pending action and does not update DB immediately", async () => {
    const { handleToolCall } = await import("../tools/handlers.js");
    const result = await handleToolCall("updatePrice", { inventoryId: user1InventoryId, price: 1800 }, user1Id);
    
    expect(result.pending).toBe(true);
    expect(result.actionId).toBeDefined();
    
    // DB check: current_market_value should still be original value
    const invItemRes = await db.execute(sql`SELECT current_market_value FROM inventory WHERE id = ${user1InventoryId}`);
    const invItem = invItemRes.rows[0];
    expect(Number((invItem as any).current_market_value)).toBe(1500);

    // ai_actions check
    const [action] = await db.select().from(aiActions).where(eq(aiActions.id, result.actionId));
    expect(action.status).toBe("pending_confirmation");
    expect((action.payload as any).price).toBe(1800);
  });

  // Test 5: Confirm action executes write
  test("confirm action executes write to inventory price", async () => {
    const { handleToolCall } = await import("../tools/handlers.js");
    const result = await handleToolCall("updatePrice", { inventoryId: user1InventoryId, price: 1950 }, user1Id);
    
    await aiPilotService.confirmAction(result.actionId, user1Id);

    // DB check: price must now be updated
    const invItemRes2 = await db.execute(sql`SELECT current_market_value FROM inventory WHERE id = ${user1InventoryId}`);
    const invItem2 = invItemRes2.rows[0];
    expect(Number((invItem2 as any).current_market_value)).toBe(1950);

    // action status check
    const [action] = await db.select().from(aiActions).where(eq(aiActions.id, result.actionId));
    expect(action.status).toBe("completed");
  });

  // Test 6: Cancel action cancels write
  test("cancel action cancels write to inventory price", async () => {
    const { handleToolCall } = await import("../tools/handlers.js");
    const result = await handleToolCall("updatePrice", { inventoryId: user1InventoryId, price: 2100 }, user1Id);
    
    const cancelRes = await aiPilotService.cancelAction(result.actionId, user1Id);
    expect(cancelRes).toBe(true);

    // DB check: price must still be 1950
    const invItemRes3 = await db.execute(sql`SELECT current_market_value FROM inventory WHERE id = ${user1InventoryId}`);
    const invItem3 = invItemRes3.rows[0];
    expect(Number((invItem3 as any).current_market_value)).toBe(1950);

    // action status check
    const [action] = await db.select().from(aiActions).where(eq(aiActions.id, result.actionId));
    expect(action.status).toBe("cancelled");
  });

  // Test 7: User cannot access another user's conversation
  test("user cannot access another user's conversation details", async () => {
    const conv = await aiPilotRepository.createConversation(user2Id, "User 2 Conversation");
    
    // User 1 trying to access user 2 conversation
    const result = await aiPilotService.getConversation(conv.id, user1Id);
    expect(result).toBeNull();
  });

  // Test 8: User cannot update another user's inventory
  test("user cannot update another user's inventory card price", async () => {
    const { handleToolCall } = await import("../tools/handlers.js");
    
    // User 1 trying to update User 2's inventory item price
    expect(
      handleToolCall("updatePrice", { inventoryId: user2InventoryId, price: 500 }, user1Id)
    ).rejects.toThrow("Inventory card not found or access denied");
  });

  // Test 9: Chat messages saved
  test("chat messages are successfully saved in DB", async () => {
    // Mock Gemini LLM response
    const originalGenerate = llmProvider.generateChatResponse;
    llmProvider.generateChatResponse = async () => ({
      text: "I found Tom Brady cards in your inventory.",
      toolCalls: null,
      modelUsed: "gemini-1.5-flash"
    });

    try {
      const response = await aiPilotService.processChat(user1Id, "Show my Tom Brady cards");
      expect(response.message).toBe("I found Tom Brady cards in your inventory.");
      
      const conv = await db.select().from(aiConversations).where(eq(aiConversations.id, response.conversationId));
      expect(conv.length).toBe(1);

      const msgs = await db.select().from(aiMessages).where(eq(aiMessages.conversationId, response.conversationId));
      expect(msgs.some(m => m.role === "user" && m.content === "Show my Tom Brady cards")).toBe(true);
      expect(msgs.some(m => m.role === "assistant" && m.content === "I found Tom Brady cards in your inventory.")).toBe(true);
    } finally {
      llmProvider.generateChatResponse = originalGenerate;
    }
  });

  // Test 10: Card search results saved
  test("card search results are successfully saved to DB", async () => {
    const searchResultPayload = [
      { itemId: "ebay-555", title: "Brady Bowman Chrome PSA 10", price: "5000" }
    ];

    const record = await aiPilotService.saveCardSearchResults(user1Id, "Tom Brady PSA 10", searchResultPayload);
    expect(record.id).toBeDefined();

    const [saved] = await db.select().from(aiCardSearchResults).where(eq(aiCardSearchResults.id, record.id));
    expect(saved.query).toBe("Tom Brady PSA 10");
    expect((saved.results as any)[0].itemId).toBe("ebay-555");
  });
});
