import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { createAnnouncement, toggleAnnouncement, deleteAnnouncement } from '@/lib/actions'
import { ConfirmButton } from '@/components/ConfirmButton'

interface Announcement {
  id: string
  message: string
  icon: string
  active: boolean
  sort_order: number
  created_at: string
}

const ICON_OPTIONS = [
  { value: 'information-circle-outline', label: 'Info' },
  { value: 'sparkles-outline',           label: 'Sparkles ✦' },
  { value: 'megaphone-outline',          label: 'Megaphone' },
  { value: 'star-outline',               label: 'Star ★' },
  { value: 'leaf-outline',               label: 'Leaf ✿' },
  { value: 'shirt-outline',              label: 'Shirt' },
  { value: 'checkmark-circle-outline',   label: 'Checkmark ✓' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function getAnnouncements(): Promise<Announcement[]> {
  noStore()
  const { data } = await supabaseAdmin
    .from('announcements')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false })
  return (data ?? []) as Announcement[]
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements()

  async function handleCreate(formData: FormData) {
    'use server'
    await createAnnouncement({
      message:    formData.get('message') as string,
      icon:       formData.get('icon') as string,
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
    })
  }

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Announcements</h1>
        <span className="text-sm text-gray-400">{announcements.length} total</span>
      </div>
      <p className="text-sm text-gray-500 -mt-6">
        Dismissible banners shown at the top of the home screen. Members can tap × to hide them for the session.
      </p>

      {/* Create form */}
      <form action={handleCreate} className="bg-navy/5 border border-navy/10 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-navy text-sm uppercase tracking-wide">New Announcement</h2>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Message *</label>
          <input
            name="message"
            required
            placeholder="e.g. New pieces dropping this Thursday — check back soon."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Icon</label>
            <select
              name="icon"
              defaultValue="information-circle-outline"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            >
              {ICON_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Sort Order</label>
            <input
              name="sort_order"
              type="number"
              defaultValue="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
            <p className="text-xs text-gray-400 mt-1">Lower = shown first in the app</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-navy text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-navy/90 transition-colors"
          >
            Publish Announcement
          </button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No announcements yet. Create one above.</p>
        ) : (
          announcements.map(a => (
            <div
              key={a.id}
              className={`bg-white border rounded-xl p-5 flex items-start gap-4 transition-opacity ${
                a.active ? 'border-gray-200' : 'border-gray-100 opacity-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy">{a.message}</p>
                <div className="flex gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-400">
                    Icon: {a.icon.replace('-outline', '')}
                  </span>
                  <span className="text-xs text-gray-400">Order: {a.sort_order}</span>
                  <span className="text-xs text-gray-400">{fmtDate(a.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  a.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {a.active ? 'Live' : 'Hidden'}
                </span>

                <ConfirmButton
                  message={a.active ? 'Hide this announcement from the app?' : 'Show this announcement in the app?'}
                  action={async () => { 'use server'; await toggleAnnouncement(a.id, !a.active) }}
                  className="text-xs text-gray-500 hover:text-navy border border-gray-200 rounded-lg px-2.5 py-1 transition-colors"
                >
                  {a.active ? 'Hide' : 'Show'}
                </ConfirmButton>

                <ConfirmButton
                  message="Delete this announcement? This cannot be undone."
                  action={async () => { 'use server'; await deleteAnnouncement(a.id) }}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </ConfirmButton>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
