// Stub: Facturama service integration
// TODO: Implement Facturama API client for CFDI stamping/cancellation

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function stampCfdi(_invoiceData: any, _options?: any): Promise<{ Id: string }> {
  throw new Error('Facturama stampCfdi not yet implemented')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cancelCfdi(_cfdiId: string, _rfc?: string, _motivo?: string, _folioSustitucion?: string): Promise<void> {
  throw new Error('Facturama cancelCfdi not yet implemented')
}
