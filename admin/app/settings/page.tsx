import { unstable_noStore as noStore } from 'next/cache'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

async function getSetting(key: string): Promise<boolean> {
  noStore()
  const { data } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value === true
}

export default async function SettingsPage() {
  const womensEnabled = await getSetting('womens_enabled')
  const tripsEnabled  = await getSetting('trips_enabled')

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">App Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Feature flags and global configuration.</p>
      </div>

      {/* Women's Line toggle */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-navy text-base">Women&apos;s Line</h2>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                womensEnabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {womensEnabled ? 'Live' : 'Hidden'}
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-md">
              When enabled, shows a gender toggle on Browse, adds a gender preference step to onboarding, and unlocks women&apos;s categories in the catalog.
              Turn this on once women&apos;s inventory is loaded in Pieces.
            </p>
          </div>

          <form>
            <button
              formAction={async () => {
                'use server'
                const { data } = await supabaseAdmin.from('app_settings').select('value').eq('key', 'womens_enabled').single()
                await supabaseAdmin
                  .from('app_settings')
                  .upsert({ key: 'womens_enabled', value: !(data?.value === true), updated_at: new Date().toISOString() })
                revalidatePath('/settings')
              }}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                womensEnabled
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  : 'bg-navy text-white hover:bg-navy/90'
              }`}
            >
              {womensEnabled ? 'Disable' : 'Enable Women\'s Line'}
            </button>
          </form>
        </div>

        <div className="border-t border-gray-50 pt-4 space-y-1.5">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">What this controls</p>
          <ul className="text-xs text-gray-500 space-y-1 leading-relaxed">
            <li>→ Gender toggle (Men / Women / All) on the Browse screen</li>
            <li>→ Gender preference step in the complete-profile onboarding flow</li>
            <li>→ Browse filters pieces by gender (women&apos;s + unisex when Women selected)</li>
          </ul>
          <p className="text-[11px] text-gray-400 pt-1">
            Note: Admin always shows all categories regardless of this setting.
          </p>
        </div>
      </div>

      {/* Trips toggle */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-navy text-base">Trips</h2>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                tripsEnabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {tripsEnabled ? 'Live' : 'Hidden'}
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-md">
              When enabled, shows the &quot;Create a Plan&quot; entry point on Home and Account, and lets users build packing lists from the catalog.
            </p>
          </div>

          <form>
            <button
              formAction={async () => {
                'use server'
                const { data } = await supabaseAdmin.from('app_settings').select('value').eq('key', 'trips_enabled').single()
                await supabaseAdmin
                  .from('app_settings')
                  .upsert({ key: 'trips_enabled', value: !(data?.value === true), updated_at: new Date().toISOString() })
                revalidatePath('/settings')
              }}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tripsEnabled
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  : 'bg-navy text-white hover:bg-navy/90'
              }`}
            >
              {tripsEnabled ? 'Disable' : 'Enable Plans'}
            </button>
          </form>
        </div>

        <div className="border-t border-gray-50 pt-4 space-y-1.5">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">What this controls</p>
          <ul className="text-xs text-gray-500 space-y-1 leading-relaxed">
            <li>→ &quot;Create a Plan&quot; card on the Home screen</li>
            <li>→ &quot;My Plans&quot; section on the Account screen</li>
            <li>→ &quot;Planning for an event?&quot; prompt on the empty Suitcase screen</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
