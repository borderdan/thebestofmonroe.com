import { z } from 'zod';

export const satConfigSchema = z.object({
  rfc: z.string()
    .toUpperCase()
    .regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'RFC inválido'),
  regimen_fiscal: z.string().length(3, 'Debe ser un código de 3 caracteres (Ej: 601)'),
  csd_password: z.string().min(1, 'Contraseña CSD es requerida'),
  facturama_api_user: z.string().min(1, 'Usuario API Facturama es requerido'),
  facturama_api_password: z.string().min(1, 'Contraseña API Facturama es requerida'),
});

export type SatConfigValues = z.infer<typeof satConfigSchema>;
