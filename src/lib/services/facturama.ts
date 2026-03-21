export async function stampCfdi(config: { facturama_api_user?: string, facturama_api_password?: string }, cfdiPayload: unknown) {
  // Replace with actual Facturama API call
  const auth = Buffer.from(`${config.facturama_api_user}:${config.facturama_api_password}`).toString('base64')

  try {
    const res = await fetch('https://apisandbox.facturama.mx/2/cfdis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(cfdiPayload)
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Facturama Error: ${res.status} ${errorText}`)
    }

    const data = await res.json()
    return { success: true, Id: data.Id }
  } catch (error: unknown) {
    console.error('Facturama Stamp Error:', error)
    throw new Error((error as Error).message || String(error))
  }
}

export async function cancelCfdi(config: { facturama_api_user?: string, facturama_api_password?: string }, uuid_sat: string, motive: string, uuidReplacement: string | undefined) {
  const auth = Buffer.from(`${config.facturama_api_user}:${config.facturama_api_password}`).toString('base64')

  try {
    const url = `https://apisandbox.facturama.mx/2/cfdis/${uuid_sat}?motive=${motive}${uuidReplacement ? `&uuidReplacement=${uuidReplacement}` : ''}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Facturama Cancel Error: ${res.status} ${errorText}`)
    }

    return { success: true }
  } catch (error: unknown) {
    console.error('Facturama Cancel Error:', error)
    throw new Error((error as Error).message || String(error))
  }
}
