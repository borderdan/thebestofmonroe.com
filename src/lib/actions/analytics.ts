'use server'



import { createClient } from '@/lib/supabase/server';
import { getSessionId } from '@/lib/utils/session';

export async function trackEvent({
  businessId,
  eventType,
  entityId,
  sessionId,
}: {
  businessId: string;
  eventType: 'profile_view' | 'link_click' | 'nfc_tap';
  entityId?: string;
  sessionId?: string;
}) {
  // We use a fire-and-forget approach to avoid blocking the UI
  const insertEvent = async () => {
    try {
      const activeSessionId = sessionId || await getSessionId();
      const supabase = await createClient();
      await supabase.from('analytics_events').insert({
        business_id: businessId,
        event_type: eventType,
        entity_id: entityId || null,
        session_id: activeSessionId || null,
      });
    } catch (error) {
    Sentry.captureException(error);
      console.error('Failed to track analytics event:', error);
    }
  };

  // Do not await to ensure it doesn't block
  void insertEvent();
}
