import { z } from 'zod';

export const satConfigSchema = z.object({
  rfc: z.string().min(1, 'RFC is required'),
  regimen_fiscal: z.string().min(1, 'Tax regime is required'),
  csd_password: z.string().optional(),
  facturama_api_user: z.string().optional(),
  facturama_api_password: z.string().optional(),
});

export type SatConfigValues = z.infer<typeof satConfigSchema>;