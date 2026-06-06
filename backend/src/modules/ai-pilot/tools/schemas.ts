export const TOOL_SCHEMAS = [
  // 1. searchInventory
  {
    name: 'searchInventory',
    description: "Search the dealer's local inventory of sports cards. Filter by sport, grade (e.g. PSA_10, RAW), and listing status (e.g. listed, unlisted, sold).",
    parameters: {
      type: 'OBJECT',
      properties: {
        sport: { type: 'STRING', description: 'Sport category, e.g. Football, Baseball, Basketball' },
        grade: { type: 'STRING', description: 'Grade key, e.g. PSA_10, PSA_9, BGS_9.5, RAW' },
        status: { type: 'STRING', description: 'Listing status: unlisted, listed, sold, archived' },
        limit: { type: 'NUMBER', description: 'Max results to return (default is 5)' },
        page: { type: 'NUMBER', description: 'Page offset (default is 1)' }
      },
      required: []
    }
  },
  // 2. searchOnlineCards
  {
    name: 'searchOnlineCards',
    description: 'Perform a text-based keyword search on eBay active listings and the master card catalog.',
    parameters: {
      type: 'OBJECT',
      properties: {
        keyword: { type: 'STRING', description: 'Search keywords, e.g. "Patrick Mahomes 2017 Prizm Silver"' },
        limit: { type: 'NUMBER', description: 'Max results to return' }
      },
      required: ['keyword']
    }
  },
  // 3. findComps
  {
    name: 'findComps',
    description: 'Get historical market sales comps for a card variant on eBay and MySlabs.',
    parameters: {
      type: 'OBJECT',
      properties: {
        keyword: { type: 'STRING', description: 'Keywords, e.g. "Patrick Mahomes 2017 Prizm Silver"' },
        variantId: { type: 'STRING', description: 'Optional exact card variant UUID if known' },
        gradeKey: { type: 'STRING', description: 'Grade key, e.g. RAW, PSA_10, PSA_9' }
      },
      required: ['keyword']
    }
  },
  // 4. getInventoryAnalytics
  {
    name: 'getInventoryAnalytics',
    description: "Retrieve high-level summary and value metrics of the dealer's card portfolio (e.g., total valuation, total cost basis, unrealized gains).",
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    }
  },
  // 5. getProfitSummary
  {
    name: 'getProfitSummary',
    description: "Retrieve a profit breakdown summary for the dealer's transactions (today's bought/sold counts, total revenue, net profits).",
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    }
  },
  // 6. updatePrice (write action with confirmation)
  {
    name: 'updatePrice',
    description: 'Updates the pricing for an inventory card. Requires dealer confirmation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        inventoryId: { type: 'STRING', description: 'The UUID of the card in the inventory' },
        price: { type: 'NUMBER', description: 'The new target price' }
      },
      required: ['inventoryId', 'price']
    }
  },
  // 7. addInventoryItem (write action with confirmation)
  {
    name: 'addInventoryItem',
    description: 'Add a new card to the inventory. Requires dealer confirmation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cardId: { type: 'STRING', description: 'The template card ID' },
        variantId: { type: 'STRING', description: 'The card variant UUID' },
        year: { type: 'NUMBER', description: 'Year of release' },
        setName: { type: 'STRING', description: 'Card set name' },
        variation: { type: 'STRING', description: 'Parallel or variation name' },
        cardNumber: { type: 'STRING', description: 'Card number' },
        sport: { type: 'STRING', description: 'Sport category' },
        gradeCompany: { type: 'STRING', description: 'Grading company (PSA, BGS, SGC, RAW)' },
        gradeValue: { type: 'STRING', description: 'Numerical grade or condition' },
        gradeKey: { type: 'STRING', description: 'Grade key (PSA_10, RAW, etc.)' },
        costBasis: { type: 'NUMBER', description: 'Amount paid for the card' },
        currentMarketValue: { type: 'NUMBER', description: 'Current estimated market value' },
        quantity: { type: 'NUMBER', description: 'Quantity (defaults to 1)' },
        notes: { type: 'STRING', description: 'Optional dealer notes' }
      },
      required: ['costBasis', 'sport']
    }
  },
  // 8. markSold (write action with confirmation)
  {
    name: 'markSold',
    description: 'Records a card sale and updates inventory status to sold. Requires dealer confirmation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        inventoryId: { type: 'STRING', description: 'The UUID of the card in the inventory' },
        price: { type: 'NUMBER', description: 'The sale price' },
        channel: { type: 'STRING', description: 'Sale channel: card_show, ebay, whatnot, mercari, etc.' },
        paymentMethod: { type: 'STRING', description: 'Payment method: cash, venmo, zelle, paypal, cashapp' }
      },
      required: ['inventoryId', 'price']
    }
  },
  // 9. createListing (write action with confirmation)
  {
    name: 'createListing',
    description: 'Publishes a card listing to eBay. Requires dealer confirmation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        inventoryId: { type: 'STRING', description: 'The UUID of the card in the inventory' },
        price: { type: 'NUMBER', description: 'The listing price' },
        description: { type: 'STRING', description: 'The listing description' }
      },
      required: ['inventoryId', 'price']
    }
  },
  // 10. addToWatchlist (write action with confirmation)
  {
    name: 'addToWatchlist',
    description: 'Add a card to the automated watchlist. Requires dealer confirmation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cardId: { type: 'STRING', description: 'Base card ID' },
        variantId: { type: 'STRING', description: 'Card variant UUID' },
        gradeKey: { type: 'STRING', description: 'Optional grade key' },
        targetPrice: { type: 'NUMBER', description: 'Optional target price' }
      },
      required: []
    }
  },
  // 11. addOnlineCardToInventory (write action with confirmation)
  {
    name: 'addOnlineCardToInventory',
    description: 'Resolves an online card search result, generates catalog models, and adds it to inventory. Requires dealer confirmation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        playerName: { type: 'STRING', description: 'Player name' },
        year: { type: 'NUMBER', description: 'Release year' },
        setName: { type: 'STRING', description: 'Set name' },
        variation: { type: 'STRING', description: 'Parallel/variation description' },
        cardNumber: { type: 'STRING', description: 'Card number' },
        sport: { type: 'STRING', description: 'Sport category' },
        costBasis: { type: 'NUMBER', description: 'Purchase price/cost basis' },
        gradeKey: { type: 'STRING', description: 'Grade key, e.g. RAW' }
      },
      required: ['playerName', 'year', 'setName', 'sport', 'costBasis']
    }
  }
];
