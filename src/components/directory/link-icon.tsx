import { Link2, MapPin, Mail, Wifi, Contact, Facebook, Instagram, Twitter } from 'lucide-react';
import { ProfileLinkData } from '@/lib/schemas/links';

export function LinkIcon({ type, metaIcon, className }: { 
  type: ProfileLinkData['link_type'], 
  metaIcon?: string,
  className?: string 
}) {
  const iconProps = { className: className || "w-5 h-5" };

  if (type === 'social') {
    switch (metaIcon?.toLowerCase()) {
      case 'facebook': return <Facebook {...iconProps} />;
      case 'instagram': return <Instagram {...iconProps} />;
      case 'twitter': return <Twitter {...iconProps} />;
      case 'x': return <Twitter {...iconProps} />;
      default: return <Link2 {...iconProps} />;
    }
  }

  switch (type) {
    case 'map': return <MapPin {...iconProps} />;
    case 'contact': return <Mail {...iconProps} />;
    case 'wifi': return <Wifi {...iconProps} />;
    case 'vcard': return <Contact {...iconProps} />;
    default: return <Link2 {...iconProps} />;
  }
}
