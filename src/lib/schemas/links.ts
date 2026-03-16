import { z } from 'zod';

export const linkDataSchema = z.object({
  link_type: z.enum(['social', 'map', 'contact', 'custom', 'wifi', 'vcard']),
  label: z.string().min(1, 'Label is required').max(100),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  meta: z.object({
    username: z.string().optional(), // For social
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(), // For maps
    ssid: z.string().optional(), // For WiFi
    password: z.string().optional(), // For WiFi
    bg_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    text_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    icon: z.string().optional()
  }).default({}),
  order_index: z.number().int().default(0),
  is_active: z.boolean().default(true)
});

export type ProfileLinkData = z.infer<typeof linkDataSchema>;
