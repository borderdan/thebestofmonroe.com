'use server';

import { createClient } from '@/lib/supabase/server';

export type MeetingSummary = {
  agenda_items: string[];
  decisions: string[];
  votes: { item: string; result: string; details: string }[];
  action_items: string[];
  public_comments_summary: string;
  key_highlights: string[];
};

export type CouncilMeeting = {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  published_at: string;
  youtube_url: string;
  thumbnail_url: string | null;
  transcript: string | null;
  summary: MeetingSummary | null;
  created_at: string;
};

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getCouncilMeetings(
  page = 1,
  pageSize = 10
): Promise<ActionResult<{ meetings: CouncilMeeting[]; total: number }>> {
  try {
    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('council_meetings')
      .select('id, youtube_video_id, title, description, published_at, youtube_url, thumbnail_url, summary, created_at', { count: 'exact' })
      .eq('status', 'completed')
      .order('published_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: {
        meetings: (data ?? []) as CouncilMeeting[],
        total: count ?? 0,
      },
    };
  } catch (error) {
    Sentry.captureException(error);
    return { success: false, error: 'Failed to load council meetings' };
  }
}

export async function getCouncilMeeting(
  id: string
): Promise<ActionResult<CouncilMeeting>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('council_meetings')
      .select('*')
      .eq('id', id)
      .eq('status', 'completed')
      .single();

    if (error) throw error;

    return { success: true, data: data as CouncilMeeting };
  } catch (error) {
    Sentry.captureException(error);
    return { success: false, error: 'Meeting not found' };
  }
}
