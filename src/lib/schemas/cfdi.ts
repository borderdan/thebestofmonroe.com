import { z } from 'zod';

export const cfdiRequestSchema = z.object({
  rfc_receptor: z.string()
    .toUpperCase()
    .regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'RFC inválido (Ej: AAA010101AAA)'),
  nombre_receptor: z.string()
    .toUpperCase()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(254, 'El nombre excede el límite permitido'),
  uso_cfdi: z.string().length(3, 'Debe ser un código de 3 caracteres (Ej: G03)'),
  regimen_fiscal: z.string().length(3, 'Debe ser un código de 3 caracteres (Ej: 601)'),
  cp_receptor: z.string().regex(/^[0-9]{5}$/, 'El Código Postal debe tener exactamente 5 dígitos'),
  transaction_id: z.string().uuid('ID de transacción inválido')
});

export type CfdiRequestValues = z.infer<typeof cfdiRequestSchema>;
