import { z } from 'zod'

export const satConfigSchema = z.object({
  rfc: z.string().min(12, 'RFC inválido').max(13, 'RFC inválido'),
  regimen_fiscal: z.string().min(3, 'Régimen fiscal inválido'),
  csd_password: z.string().optional(),
  facturama_api_user: z.string().optional(),
  facturama_api_password: z.string().optional(),
})

export type SatConfigValues = z.infer<typeof satConfigSchema>
