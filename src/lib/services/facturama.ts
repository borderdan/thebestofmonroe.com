import { type CfdiRequestValues } from '@/lib/schemas/cfdi'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function stampCfdi(config: Record<string, any>, payload: any) {
  // Stub implementation
  console.log('Stamping CFDI:', config, payload);
  return { success: true, Id: 'fake-uuid-' + Date.now() }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cancelCfdi(config: Record<string, any>, uuid: string, motive?: string, replacement?: string) {
  // Stub implementation
  console.log('Canceling CFDI:', config, uuid, motive, replacement);
  return { success: true }
}