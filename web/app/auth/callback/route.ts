import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'
  const terms = searchParams.get('terms')

  if (code) {
    const supabase = createSupabaseServer()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // After email confirmation: sync full_name from auth metadata + record terms acceptance
      const updates: Record<string, unknown> = {}
      const fullName = data.user.user_metadata?.full_name
      if (fullName) updates.full_name = fullName
      if (terms === '1') updates.terms_accepted_at = new Date().toISOString()
      if (Object.keys(updates).length > 0) {
        await supabase.from('profiles').update(updates).eq('id', data.user.id)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
