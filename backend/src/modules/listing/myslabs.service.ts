import type { Env } from "../../config/index.js";

export interface MyslabsItem {
  id: number;
  title: string;
  price: number;
  shipping_cost?: number;
  status: string;
  sold: boolean;
  for_sale: boolean;
  sold_date?: string;
  updated_date?: string;
  created_date?: string;
  year?: number;
  publish_type?: string;
  card_type?: string;
  category?: string;
  slab_link?: string;
  lot_type?: string;
  slab_image_1?: string;
  slab_image_1_thumbnail?: string;
  slab_image_2?: string;
  slab_image_2_thumbnail?: string;
  description?: string;
  grade?: number;
  allow_offer?: boolean;
}

export class MyslabsService {
  constructor(private readonly env: Env) {}

  private isConfigured(): boolean {
    const clientId = this.env.MYSLABS_CLIENT_ID;
    const clientSecret = this.env.MYSLABS_CLIENT_SECRET;
    if (!clientId || !clientSecret) return false;
    if (clientId.includes("placeholder") || clientId.includes("your_")) return false;
    return true;
  }

  private getMockSlabs(q: string, status: "for-sale" | "sold"): MyslabsItem[] {
    const year = q.match(/\b(19|20)\d{2}\b/)?.[0] ? parseInt(q.match(/\b(19|20)\d{2}\b/)?.[0]!) : 2021;
    const baseTitle = q || "Sports Card";
    return [
      {
        id: 10001,
        title: `${baseTitle} PSA 10 GEM MT`,
        price: status === "sold" ? 120 : 150,
        shipping_cost: 5,
        status: status,
        sold: status === "sold",
        for_sale: status === "for-sale",
        sold_date: status === "sold" ? new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0] : undefined,
        created_date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
        updated_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        year: year,
        publish_type: "SLABBED_CARD",
        card_type: "PSA",
        category: "BASEBALL",
        slab_link: "https://myslabs.com/slab/view/10001/",
        slab_image_1: "https://s3.amazonaws.com/s3.myslabs.com/media/SWFBUBA_1655255380_1.jpg",
        grade: 10,
        allow_offer: true,
      },
      {
        id: 10002,
        title: `${baseTitle} BGS 9.5 MINT`,
        price: status === "sold" ? 95 : 110,
        shipping_cost: 6,
        status: status,
        sold: status === "sold",
        for_sale: status === "for-sale",
        sold_date: status === "sold" ? new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0] : undefined,
        created_date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
        updated_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        year: year,
        publish_type: "SLABBED_CARD",
        card_type: "BGS",
        category: "BASEBALL",
        slab_link: "https://myslabs.com/slab/view/10002/",
        slab_image_1: "https://s3.amazonaws.com/s3.myslabs.com/media/DPJKVJM_1655255386_2.jpg",
        grade: 9.5,
        allow_offer: true,
      },
      {
        id: 10003,
        title: `${baseTitle} PSA 9 MINT`,
        price: status === "sold" ? 75 : 85,
        shipping_cost: 5,
        status: status,
        sold: status === "sold",
        for_sale: status === "for-sale",
        sold_date: status === "sold" ? new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString().split('T')[0] : undefined,
        created_date: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString().split('T')[0],
        updated_date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
        year: year,
        publish_type: "SLABBED_CARD",
        card_type: "PSA",
        category: "BASEBALL",
        slab_link: "https://myslabs.com/slab/view/10003/",
        slab_image_1: "https://s3.amazonaws.com/s3.myslabs.com/media/SWFBUBA_1655255380_1.jpg",
        grade: 9,
        allow_offer: true,
      }
    ];
  }

  private async getAccessToken(): Promise<string> {
    const clientId = this.env.MYSLABS_CLIENT_ID;
    const clientSecret = this.env.MYSLABS_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error("MYSLABS_CLIENT_ID and MYSLABS_CLIENT_SECRET are required");
    }

    const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;

    const res = await fetch("https://myslabs.com/api/v2/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MySlabs token request failed (${res.status}): ${text}`);
    }

    const data = await res.json() as { access_token: string };
    return data.access_token;
  }

  async searchSlabs(params: {
    q: string;
    status?: "for-sale" | "sold";
    limit?: number;
  }): Promise<{ items: MyslabsItem[] }> {
    const status = params.status || "for-sale";

    if (!this.isConfigured()) {
      console.log(`[MYSLABS] API keys not configured. Falling back to mock data for: "${params.q}"`);
      return { items: this.getMockSlabs(params.q, status) };
    }

    try {
      const token = await this.getAccessToken();
      const limit = params.limit || 20;

      const searchUrl = new URL("https://myslabs.com/api/v2/slabs");
      searchUrl.searchParams.set("status", status);
      searchUrl.searchParams.set("query", params.q);
      searchUrl.searchParams.set("page_count", limit.toString());
      searchUrl.searchParams.set("sort", "price_desc"); // Default sort per docs

      const res = await fetch(searchUrl.toString(), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`MySlabs search failed (${res.status}): ${text}`);
      }

      const items = await res.json() as any[];
      const mapped = (items || []).map((item) => {
        const slabLink = item.slab_link || "";
        const match = slabLink.match(/\/view\/(\d+)\//);
        const id = item.id !== undefined && item.id !== null ? Number(item.id) : (match ? parseInt(match[1]) : 0);
        
        return {
          ...item,
          id,
          price: typeof item.price === "string" ? parseFloat(item.price) : (item.price ?? 0),
          shipping_cost: typeof item.shipping_cost === "string" ? parseFloat(item.shipping_cost) : (item.shipping_cost ?? 0),
        };
      });

      return { items: mapped };
    } catch (err) {
      console.warn(`[MYSLABS] Live search failed (falling back to mock data):`, (err as Error).message);
      return { items: this.getMockSlabs(params.q, status) };
    }
  }
}
