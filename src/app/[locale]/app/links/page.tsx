import { createClient } from '@/lib/supabase/server';
import LinkManager from './_components/link-manager';

export default async function LinksPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single();

  if (!profile?.business_id) return null;

  const { data: links } = await supabase
    .from('entities')
    .select('*')
    .eq('business_id', profile.business_id)
    .eq('type', 'profile_link')
    .order('sort_order', { ascending: true });

  return (
    <div className="min-h-screen">
      <LinkManager initialLinks={links || []} />
    </div>
  );
}
