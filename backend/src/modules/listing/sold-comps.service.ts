import type { Env } from "../../config/index.js";

export interface SoldCompsItem {
  itemId: string;
  url: string;
  title: string;
  endedAt: string;
  soldPrice: string;
  soldCurrency: string;
  shippingPrice: string | null;
  totalPrice: string;
  sellerUsername: string;
  sellerPositivePercent: number;
  sellerFeedbackScore: number;
  itemCondition?: string;
}

export interface SoldCompsResponse {
  keyword: string;
  totalItems: number;
  hasNextPage: boolean;
  items: SoldCompsItem[];
}

export class SoldCompsService {
  private readonly baseUrl = "https://api.sold-comps.com/v1";

  constructor(private readonly env: Env) {}

  private isConfigured(): boolean {
    const apiKey = this.env.SOLD_COMPS_KEY;
    if (!apiKey) return false;
    if (apiKey.includes("placeholder") || apiKey.includes("your_")) return false;
    return true;
  }

  private getMockSold(q: string): SoldCompsResponse {
    const baseTitle = q || "Sports Card";
    return {
      keyword: q,
      totalItems: 3,
      hasNextPage: false,
      items: [
        {
          itemId: "sold10001",
          url: "https://www.ebay.com/itm/sold10001",
          title: `${baseTitle} PSA 10 Gem Mint`,
          endedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
          soldPrice: "148.50",
          soldCurrency: "USD",
          shippingPrice: "4.50",
          totalPrice: "153.00",
          sellerUsername: "card_collector_pro",
          sellerPositivePercent: 99.8,
          sellerFeedbackScore: 4520,
          itemCondition: "Graded - PSA 10"
        },
        {
          itemId: "sold10002",
          url: "https://www.ebay.com/itm/sold10002",
          title: `${baseTitle} BGS 9.5 Mint`,
          endedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
          soldPrice: "90.00",
          soldCurrency: "USD",
          shippingPrice: "5.00",
          totalPrice: "95.00",
          sellerUsername: "slab_hq",
          sellerPositivePercent: 100,
          sellerFeedbackScore: 890,
          itemCondition: "Graded - BGS 9.5"
        },
        {
          itemId: "sold10003",
          url: "https://www.ebay.com/itm/sold10003",
          title: `${baseTitle} PSA 9 Mint`,
          endedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
          soldPrice: "72.00",
          soldCurrency: "USD",
          shippingPrice: "4.50",
          totalPrice: "76.50",
          sellerUsername: "graded_gems",
          sellerPositivePercent: 99.2,
          sellerFeedbackScore: 2310,
          itemCondition: "Graded - PSA 9"
        }
      ]
    };
  }

  async getSoldItems(keyword: string): Promise<SoldCompsResponse> {
    if (!this.isConfigured()) {
      console.log(`[SOLD-COMPS] API key not configured. Falling back to mock data for: "${keyword}"`);
      return this.getMockSold(keyword);
    }

    try {
      const apiKey = this.env.SOLD_COMPS_KEY;
      const url = new URL(`${this.baseUrl}/scrape`);
      url.searchParams.set("keyword", keyword);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`SoldComps API failed (${res.status}): ${text}`);
      }

      return (await res.json()) as SoldCompsResponse;
    } catch (err) {
      console.warn(`[SOLD-COMPS] Live fetch failed (falling back to mock data):`, (err as Error).message);
      return this.getMockSold(keyword);
    }
  }
}
