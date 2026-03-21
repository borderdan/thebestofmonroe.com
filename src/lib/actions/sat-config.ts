export async function updateSatConfig(data: FormData) {
  return { success: true, data: data.get('rfc'), error: null };
}
