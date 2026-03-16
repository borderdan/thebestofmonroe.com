import { requireFeature } from '@/lib/auth/feature-gate'

export default async function PosLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Strictly enforce POS feature
  await requireFeature('pos', locale)

  return <>{children}</>
}
