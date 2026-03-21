import { z } from 'zod';

export const satConfigSchema = z.object({
  rfc: z.string().optional(),
  name: z.string().optional(),
  regimen_fiscal: z.string().optional(),
  zip_code: z.string().optional(),
  csd_password: z.string().optional(),
  facturama_api_user: z.string().optional(),
  facturama_api_password: z.string().optional(),
});

export type SatConfigValues = z.infer<typeof satConfigSchema>;
