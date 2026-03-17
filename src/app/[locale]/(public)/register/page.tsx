import { redirect } from 'next/navigation'

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // For now, redirect to login since the registration flow isn't fully implemented
  // or point to the auth-ui if preferred. This fixes the 404.
  redirect(`/${locale}/login?mode=register`)
}
