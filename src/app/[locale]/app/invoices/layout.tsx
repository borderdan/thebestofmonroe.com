import { requireFeature } from '@/lib/auth/feature-gate'

export default async function InvoicesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Strictly enforce invoice feature
  await requireFeature('invoicing', locale)

  return <>{children}</>
}
