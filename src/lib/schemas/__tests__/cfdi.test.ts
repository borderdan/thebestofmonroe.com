import { describe, it, expect } from 'vitest'
import { cfdiRequestSchema } from '../cfdi'

describe('CFDI Validation Schema', () => {
  it('should pass with a valid RFC and data', () => {
    const validData = {
      rfc_receptor: 'AAA010101AAA',
      nombre_receptor: 'EMPRESA DE PRUEBA SA DE CV',
      uso_cfdi: 'G03',
      regimen_fiscal: '601',
      cp_receptor: '01000',
      transaction_id: '123e4567-e89b-12d3-a456-426614174000'
    }

    const result = cfdiRequestSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should fail with an invalid RFC', () => {
    const invalidData = {
      rfc_receptor: 'INVALID_RFC_123',
      nombre_receptor: 'TEST',
      uso_cfdi: 'G03',
      regimen_fiscal: '601',
      cp_receptor: '01000',
      transaction_id: '123e4567-e89b-12d3-a456-426614174000'
    }

    const result = cfdiRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should require a 5 digit postal code', () => {
    const invalidZip = {
      rfc_receptor: 'AAA010101AAA',
      nombre_receptor: 'TEST',
      uso_cfdi: 'G03',
      regimen_fiscal: '601',
      cp_receptor: '1234', // Only 4 digits
      transaction_id: '123e4567-e89b-12d3-a456-426614174000'
    }

    const result = cfdiRequestSchema.safeParse(invalidZip)
    expect(result.success).toBe(false)
  })
})
