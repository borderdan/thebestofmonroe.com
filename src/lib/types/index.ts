export interface GroceryPrice {
  id: string;
  store_name: string;
  store_location: string;
  item_name: string;
  category: string;
  price: number;
  unit: string;
  is_deal: boolean;
  deal_description: string | null;
  scraped_at: string;
  brand?: string;
  image_url?: string;
  source?: string;
  discount_pct?: number;
}