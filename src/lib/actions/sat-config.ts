import { SatConfigValues } from '../schemas/sat-config';

export async function updateSatConfig(data: FormData) {
  return { success: true, data, error: null };
}
