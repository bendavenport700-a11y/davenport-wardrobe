import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { updateWardrobe, createWardrobe } from '@/lib/actions'
import { revalidatePath } from 'next/cache'
import type { Wardrobe } from '@/lib/types'

async function getWardrobes() {
  noStore()
  const { data } = await supabaseAdmin.from('wardrobes').select('*').order('sort_order')
  return (data ?? []) as Wardrobe[]
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default async function WardrobesPage() {
  const wardrobes = await getWardrobes()

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Wardrobes</h1>
        <span className="text-sm text-gray-400">{wardrobes.length} wardrobes</span>
      </div>

      {/* Create new wardrobe */}
      <form className="bg-navy/5 border border-navy/10 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-navy text-sm uppercase tracking-wide">New Wardrobe</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
            <input name="name" required placeholder="The Weekend Edit"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Cover Image URL</label>
            <input name="cover_image_url" placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
          <textarea name="description" rows={2} placeholder="A short description shown on the wardrobe page."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy/30" />
        </div>
        <button
          formAction={async (fd: FormData) => {
            'use server'
            const name = fd.get('name') as string
            const cover = fd.get('cover_image_url') as string
            const result = await createWardrobe({
              name,
              description: fd.get('description') as string || '',
              slug: slugify(name),
              tags: [],
            })
            if (!('error' in result) && cover) {
              await supabaseAdmin.from('wardrobes')
                .update({ cover_image_url: cover })
                .eq('id', result.id)
            }
            revalidatePath('/wardrobes')
          }}
          className="bg-navy text-white text-sm px-4 py-2 rounded-lg hover:bg-navy/90 transition-colors"
        >
          + Create Wardrobe
        </button>
      </form>

      {/* Existing wardrobes */}
      <div className="space-y-4">
        {wardrobes.map(w => (
          <form key={w.id} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${w.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="font-semibold text-navy">{w.name}</span>
                <span className="text-gray-400 text-xs font-mono">/{w.slug}</span>
              </div>
              <span className="text-xs text-gray-400">Sort: {w.sort_order}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
                <input name="name" defaultValue={w.name}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Cover Image URL</label>
                <input name="cover_image_url" defaultValue={w.cover_image_url ?? ''}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
              <textarea name="description" defaultValue={w.description ?? ''} rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy/30" />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_active" defaultChecked={w.is_active}
                  className="w-4 h-4 accent-navy" />
                <span className="text-sm text-gray-600">Active (visible to customers)</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500">Sort order</label>
                <input type="number" name="sort_order" defaultValue={w.sort_order}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
              </div>
            </div>

            <button
              formAction={async (fd: FormData) => {
                'use server'
                await updateWardrobe(w.id, {
                  name:            fd.get('name') as string,
                  description:     fd.get('description') as string || undefined,
                  cover_image_url: fd.get('cover_image_url') as string || undefined,
                  is_active:       fd.get('is_active') === 'on',
                  sort_order:      parseInt(fd.get('sort_order') as string) || w.sort_order,
                })
              }}
              className="bg-navy text-white text-sm px-4 py-2 rounded-lg hover:bg-navy/90 transition-colors"
            >
              Save
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}
