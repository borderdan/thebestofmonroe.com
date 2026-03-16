import { describe, it, expect, beforeAll } from 'vitest'
import { encrypt, decrypt } from '../encryption'

describe('Encryption Utilities', () => {
  beforeAll(() => {
    // Set a mock 64-character hex key for testing AES-256
    process.env.SAT_ENCRYPTION_KEY = 'a'.repeat(64)
  })

  it('should encrypt and decrypt a string successfully', () => {
    const originalText = 'my-secret-password-123!'
    const encrypted = encrypt(originalText)
    
    expect(encrypted).not.toBe(originalText)
    expect(encrypted.split(':').length).toBe(3) // iv:authTag:encrypted

    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(originalText)
  })

  it('should return empty string if input is empty', () => {
    expect(encrypt('')).toBe('')
    expect(decrypt('')).toBe('')
  })

  it('should throw an error if decryption payload is invalid', () => {
    expect(() => decrypt('invalid-payload')).toThrow('Invalid encryption payload format.')
  })
})
