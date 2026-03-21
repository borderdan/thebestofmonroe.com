// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function stampCfdi(config: any, data: any) {
  return { success: true, data: { config, data }, Id: 'mock-id' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cancelCfdi(config: any, id: string, motive?: string, uuidReplacement?: string) {
  return { success: true, id: id + (motive || '') + (uuidReplacement || '') + (config ? '1' : '0') };
}
