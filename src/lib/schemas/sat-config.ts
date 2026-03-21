import { z } from 'zod'

export const satConfigSchema = z.object({
  rfc: z.string(),
  regimen_fiscal: z.string(),
  csd_password: z.string(),
  facturama_api_user: z.string(),
  facturama_api_password: z.string(),
})

export type SatConfigValues = z.infer<typeof satConfigSchema>
