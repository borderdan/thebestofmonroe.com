import { z } from 'zod'

export const menuItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  stock_level: z.coerce.number().int().nonnegative('Stock must be 0 or higher'),
  description: z.string().optional().default(''),
  category: z.string().optional().default(''),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  clave_prod_serv: z.string().optional().default('01010101'),
  clave_unidad: z.string().optional().default('H87'),
  barcode: z.string().optional().default(''),
  sku: z.string().optional().default(''),
})

export type MenuItemFormValues = z.infer<typeof menuItemSchema>
