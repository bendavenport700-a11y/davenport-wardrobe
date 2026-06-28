import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import Image from 'next/image'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { updateWardrobe, createWardrobe, deleteWardrobe } from '@/lib/actions'
import { ConfirmButton } from '@/components/ConfirmButton'
import type { Wardrobe } from '@/lib/types'

// ── Data ────────────────────────────────────────────────────────────────────

type WardrobeWithPreviews = Wardrobe & {
  piece_count: number
  preview_images: string[]
}

async function getWardrobesWithPreviews(): Promise<WardrobeWithPreviews[]> {
  noStore()
  const [wardrobesRes, piecesRes] = await Promise.all([
    supabaseAdmin.from('wardrobes').select('*').order('sort_order'),
    supabaseAdmin
      .from('pieces')
      .select('wardrobe_id, images')
      .not('wardrobe_id', 'is', null)
      .eq('is_draft', false),
  ])

  const wardrobes = (wardrobesRes.data ?? []) as Wardrobe[]

  const countMap = new Map<string, number>()
  const imageMap = new Map<string, string[]>()
  for (const p of piecesRes.data ?? []) {
    const wid = p.wardrobe_id as string
    countMap.set(wid, (countMap.get(wid) ?? 0) + 1)
    const imgs = imageMap.get(wid) ?? []
    if (imgs.length < 4 && (p.images as string[])?.[0]) {
      imgs.push((p.images as string[])[0])
      imageMap.set(wid, imgs)
    }
  }

  return wardrobes.map(w => ({
    ...w,
    piece_count: countMap.get(w.id) ?? 0,
    preview_images: imageMap.get(w.id) ?? [],
  }))
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function parseTags(raw: string): string[] {
  return raw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
}

// ── Piece image mosaic ───────────────────────────────────────────────────────

function PieceMosaic({ images, count }: { images: string[]; count: number }) {
  const cells = [0, 1, 2, 3]
  return (
    <div className="grid grid-cols-2 gap-1 w-48 h-56 shrink-0 rounded-xl overflow-hidden bg-navy/8 border border-navy/10">
      {cells.map(i => {
        const src = images[i]
        return src ? (
          <div key={i} className="relative w-full h-full">
            <Image src={src} alt="" fill className="object-cover" sizes="96px" unoptimized />
          </div>
        ) : (
          <div key={i} className="flex items-center justify-center bg-navy/5">
            {i === 0 && count === 0 && (
              <span className="text-navy/20 text-2xl font-bold">D</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Tag chip display ─────────────────────────────────────────────────────────

function TagChips({ tags }: { tags: string[] }) {
  if (!tags.length) return <span className="text-xs text-gray-400 italic">No tags yet</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map(t => (
        <span key={t} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-navy/8 text-navy border border-navy/12">
          {t}
        </span>
      ))}
    </div>
  )
}

// ── Input styles ─────────────────────────────────────────────────────────────

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/25 bg-white'
const LABEL = 'text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block'

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function WardrobesPage() {
  const wardrobes = await getWardrobesWithPreviews()

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Wardrobes</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {wardrobes.length} collection{wardrobes.length !== 1 ? 's' : ''} ·
          Tags connect pieces to search filters and customer taste — keep them consistent
        </p>
      </div>

      {/* ── Create new wardrobe ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <h2 className="font-semibold text-navy text-sm">New Wardrobe</h2>
          <p className="text-xs text-gray-400 mt-0.5">Create a named collection, then assign pieces to it from the Pieces page.</p>
        </div>
        <form className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className={LABEL}>Name <span className="text-red-400 normal-case font-normal">*</span></label>
              <input name="name" required placeholder="The Weekend Edit" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Cover Image URL</label>
              <input name="cover_image_url" placeholder="https://..." className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Gender</label>
              <select name="gender" defaultValue="men" className={INPUT}>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className={LABEL}>Description</label>
            <textarea name="description" rows={2} placeholder="A short description shown on the wardrobe page."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy/25 bg-white" />
          </div>
          <div className="mb-5">
            <label className={LABEL}>Tags <span className="normal-case font-normal text-gray-400">(comma separated)</span></label>
            <input name="tags" placeholder="casual, summer, office, smart-casual, weekend" className={INPUT} />
            <p className="text-[11px] text-gray-400 mt-1">Tags drive search filters and wardrobe recommendations — use consistent lowercase terms.</p>
          </div>
          <button
            formAction={async (fd: FormData) => {
              'use server'
              const name  = fd.get('name') as string
              const cover = fd.get('cover_image_url') as string
              const tags  = parseTags((fd.get('tags') as string) ?? '')
              const result = await createWardrobe({
                name,
                description: fd.get('description') as string || '',
                slug: slugify(name),
                tags,
                gender: ((fd.get('gender') as string) || 'men') as 'men' | 'women' | 'unisex',
              })
              if ('error' in result) throw new Error(result.error)
              if (cover) {
                await supabaseAdmin.from('wardrobes').update({ cover_image_url: cover }).eq('id', result.id)
              }
              revalidatePath('/wardrobes')
            }}
            className="bg-navy text-white text-sm px-5 py-2.5 rounded-lg hover:bg-navy/90 transition-colors font-medium"
          >
            + Create Wardrobe
          </button>
        </form>
      </div>

      {/* ── Existing wardrobes ───────────────────────────────────── */}
      {wardrobes.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No wardrobes yet — create one above.</div>
      ) : (
        <div className="space-y-5">
          {wardrobes.map(w => (
            <div key={w.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${w.is_active ? 'border-gray-200' : 'border-gray-100 opacity-80'}`}>

              {/* Card header */}
              <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${w.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="font-bold text-navy text-base">{w.name}</span>
                <span className="text-gray-400 text-xs font-mono">/{w.slug}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide border ${
                  w.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}>
                  {w.is_active ? 'Live' : 'Hidden'}
                </span>
                <div className="flex-1" />
                <span className="text-xs text-gray-400">{w.piece_count} piece{w.piece_count !== 1 ? 's' : ''}</span>
                <Link href={`/wardrobes/${w.id}`} className="text-xs font-medium text-navy hover:underline">
                  Manage pieces →
                </Link>
              </div>

              {/* Body: mosaic + form */}
              <form className="flex gap-8 p-6">

                {/* Left: piece image mosaic */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <PieceMosaic images={w.preview_images} count={w.piece_count} />
                  {w.piece_count > 4 && (
                    <p className="text-[11px] text-gray-400">+{w.piece_count - 4} more pieces</p>
                  )}
                  {w.piece_count === 0 && (
                    <p className="text-[11px] text-gray-400">No pieces assigned</p>
                  )}
                  <Link href={`/wardrobes/${w.id}`}
                    className="text-[11px] text-navy/60 hover:text-navy hover:underline transition-colors">
                    Add / remove pieces →
                  </Link>
                </div>

                {/* Right: form */}
                <div className="flex-1 min-w-0 flex flex-col gap-4">

                  {w.cover_image_url?.startsWith('data:') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800 text-xs">
                      ⚠️ Cover image is base64 — replace with a hosted URL from Supabase Storage or any CDN.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Name</label>
                      <input name="name" defaultValue={w.name} className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Cover Image URL</label>
                      <input name="cover_image_url" defaultValue={w.cover_image_url ?? ''} placeholder="https://..." className={INPUT} />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Description</label>
                    <textarea name="description" defaultValue={w.description ?? ''} rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy/25 bg-white" />
                  </div>

                  {/* Tags — prominently featured */}
                  <div className="rounded-xl border border-navy/10 bg-navy/3 p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={LABEL + ' mb-0'}>Tags</span>
                      <span className="text-[10px] text-gray-400 font-normal normal-case">connect pieces to search &amp; customer taste</span>
                    </div>
                    <div className="mb-2">
                      <TagChips tags={w.tags ?? []} />
                    </div>
                    <input
                      name="tags"
                      defaultValue={(w.tags ?? []).join(', ')}
                      placeholder="casual, summer, office, smart-casual, evening, travel"
                      className={INPUT}
                    />
                    <p className="text-[11px] text-gray-400">
                      Edit above then Save — use consistent lowercase terms across wardrobes
                    </p>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="is_active" defaultChecked={w.is_active} className="w-4 h-4 accent-navy" />
                      <span className="text-sm text-gray-600">Visible to customers</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className={LABEL + ' mb-0'}>Sort</span>
                      <input type="number" name="sort_order" defaultValue={w.sort_order}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/25" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={LABEL + ' mb-0'}>Gender</span>
                      <select name="gender" defaultValue={w.gender ?? 'men'}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/25">
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="unisex">Unisex</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      formAction={async (fd: FormData) => {
                        'use server'
                        const tags = parseTags((fd.get('tags') as string) ?? '')
                        await updateWardrobe(w.id, {
                          name:            fd.get('name') as string,
                          description:     fd.get('description') as string || undefined,
                          cover_image_url: fd.get('cover_image_url') as string || undefined,
                          is_active:       fd.get('is_active') === 'on',
                          sort_order:      parseInt(fd.get('sort_order') as string) || w.sort_order,
                          gender:          ((fd.get('gender') as string) || 'men') as 'men' | 'women' | 'unisex',
                          tags,
                        })
                      }}
                      className="bg-navy text-white text-sm px-5 py-2 rounded-lg hover:bg-navy/90 transition-colors font-medium"
                    >
                      Save Changes
                    </button>
                    <ConfirmButton
                      message={`Delete "${w.name}"? All ${w.piece_count} piece${w.piece_count !== 1 ? 's' : ''} will be unassigned.`}
                      action={async () => {
                        'use server'
                        await deleteWardrobe(w.id)
                      }}
                      className="text-red-500 hover:text-red-700 text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
                    >
                      Delete
                    </ConfirmButton>
                  </div>
                </div>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Tag vocabulary guide */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-4">
        <p className="text-sm font-semibold text-blue-900 mb-1">Tag vocabulary</p>
        <p className="text-sm text-blue-700 leading-relaxed">
          Tags flow through the whole system: <strong>wardrobe tags → piece tags → search filters → customer taste profile</strong>.
          Reuse the same terms so filters work. Suggested vocabulary:{' '}
          <span className="font-mono text-xs">casual, office, weekend, smart-casual, summer, winter, athletic, evening, travel, layering, formal</span>
        </p>
      </div>
    </div>
  )
}
