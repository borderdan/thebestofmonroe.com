/**
 * Type definitions for the JSONB `data` column in the `entities` table.
 * Each entity type has its own data shape stored in the polymorphic JSON blob.
 */

export interface MenuItemData {
  name: string
  price: number
  stock_level: number
  description?: string
  category?: string
  image_url?: string
  clave_prod_serv?: string
  clave_unidad?: string
  barcode?: string
  sku?: string
}

export interface LinkData {
  name: string
  url: string
  description?: string
  image_url?: string
}

export interface KeyringData {
  name: string
  description?: string
  image_url?: string
}

export interface ProfileLinkData {
  label: string;
  url: string;
  link_type: 'social' | 'website' | 'map';
  is_active: boolean;
  order_index: number;
}

export interface FormFieldData {
  id: string;
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'radio';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  order_index: number;
}

/**
 * Union of all entity data types for type narrowing.
 * Use with `entities.type` to discriminate.
 */
export type EntityData = MenuItemData | LinkData | KeyringData | ProfileLinkData | FormFieldData

/**
 * A fully-typed entity row with discriminated data.
 */
export interface TypedEntity<T extends EntityData = EntityData> {
  id: string
  business_id: string
  type: string
  data: T
  sort_order: number | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export type MenuItemEntity = TypedEntity<MenuItemData>
