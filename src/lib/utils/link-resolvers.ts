import { ProfileLinkData } from '@/lib/schemas/links';

export function resolveLinkUrl(data: ProfileLinkData, businessId?: string): string {
  if (data.link_type === 'social' && data.meta.username) {
    // Expand based on icon/platform if needed, default to raw URL if provided
    return data.url || `https://${data.meta.icon}.com/${data.meta.username}`;
  }
  
  if (data.link_type === 'map' && data.meta.coordinates) {
    const { lat, lng } = data.meta.coordinates;
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  if (data.link_type === 'wifi' && data.meta.ssid) {
    return `WIFI:S:${data.meta.ssid};T:WPA;P:${data.meta.password || ''};;`;
  }

  if (data.link_type === 'vcard' && businessId) {
    return `/api/vcard/${businessId}`;
  }

  return data.url || '#';
}
