import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('[Davenport] Missing Supabase env vars — add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to eas.json or .env')
}

// supabase-js throws on falsy URL/key, so we use non-empty placeholders as fallbacks.
// Real values always come from eas.json env section in production builds.
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
  {
    auth: {
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: true, persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
)

export function callEdgeFunction<T = unknown>(name: string, body: Record<string, unknown> = {}, timeoutMs = 30_000): Promise<T> {
  const controller = new AbortController()

  const work = async (): Promise<T> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated — cannot call Edge Function without a session')
    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(err.error ?? 'Edge Function error')
    }
    return response.json()
  }

  // Hard wall-clock deadline covers getSession() + fetch together.
  // AbortController alone is unreliable on iOS when the network layer ignores the signal.
  const deadline = new Promise<never>((_, reject) =>
    setTimeout(() => {
      controller.abort()
      reject(new Error('Request timed out. Check your connection and try again.'))
    }, timeoutMs)
  )

  return Promise.race([work(), deadline])
}
