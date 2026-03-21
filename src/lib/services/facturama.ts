export async function stampCfdi(config: any, options: any) {
  return { Id: 'dummy-id' }
}

export async function cancelCfdi(config: any, uuid: string, reason: string, replacement?: string) {
  return { success: true }
}
