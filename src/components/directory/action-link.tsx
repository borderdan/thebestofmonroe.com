'use client'

import { trackEvent } from '@/lib/actions/analytics';
import { ReactNode } from 'react';

export function ActionLink({ 
  businessId, 
  entityId, 
  url, 
  className,
  children,
  target = "_blank"
}: { 
  businessId: string;
  entityId?: string;
  url: string;
  className?: string;
  children: ReactNode;
  target?: string;
}) {
  const handleClick = () => {
    // Fire and forget
    trackEvent({
      businessId,
      eventType: 'link_click',
      entityId,
    });
  };

  if (url.startsWith('tel:') || url.startsWith('mailto:')) {
    target = "_self";
  }

  return (
    <a href={url} target={target} rel="noopener noreferrer" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
