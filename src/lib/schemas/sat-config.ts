// Stub: SAT Configuration schema
// TODO: Implement full SAT (tax authority) configuration schema
import { z } from 'zod'

export const satConfigSchema = z.object({
  rfc: z.string().optional(),
  regimen_fiscal: z.string().optional(),
  uso_cfdi: z.string().optional(),
  csd_password: z.string().optional(),
  facturama_api_user: z.string().optional(),
  facturama_api_password: z.string().optional(),
})

export type SatConfigValues = z.infer<typeof satConfigSchema>
