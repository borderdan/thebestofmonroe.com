import { decrypt } from '@/lib/security/encryption'

interface FacturamaConfig {
  facturama_api_user: string;
  facturama_api_password: string;
}

export async function stampCfdi(config: FacturamaConfig, cfdiPayload: Record<string, unknown>) {
  const user = decrypt(config.facturama_api_user);
  const pass = decrypt(config.facturama_api_password);
  
  if (!user || !pass) {
    throw new Error('Configuración de Facturama incompleta o corrupta.');
  }

  const encodedAuth = Buffer.from(`${user}:${pass}`).toString('base64');
  const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'production';
  const apiUrl = isProd 
    ? 'https://api.facturama.mx/3/cfdis' 
    : 'https://apisandbox.facturama.mx/3/cfdis';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${encodedAuth}`
    },
    body: JSON.stringify(cfdiPayload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error PAC: ${JSON.stringify(errorData.ModelState || errorData)}`);
  }

  return response.json(); 
}

export async function cancelCfdi(config: FacturamaConfig, uuidSat: string, motive: string = '02', uuidReplacement?: string) {
  const user = decrypt(config.facturama_api_user);
  const pass = decrypt(config.facturama_api_password);
  
  if (!user || !pass) {
    throw new Error('Configuración de Facturama incompleta.');
  }

  const encodedAuth = Buffer.from(`${user}:${pass}`).toString('base64');
  const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'production';
  const baseUrl = isProd 
    ? 'https://api.facturama.mx/3/cfdis' 
    : 'https://apisandbox.facturama.mx/3/cfdis';

  let url = `${baseUrl}/${uuidSat}?type=issued&motive=${motive}`;
  if (uuidReplacement) {
    url += `&uuidReplacement=${uuidReplacement}`;
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Basic ${encodedAuth}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error cancelación PAC: ${JSON.stringify(errorData.ModelState || errorData)}`);
  }

  return response.json(); 
}
