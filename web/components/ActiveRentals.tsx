'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { formatCents, formatCentsPerMonth } from '@/lib/format'
import { multiPieceDiscount } from '@/lib/pricing'

const ACTIVE_STATUSES = ['pending', 'sourcing', 'packaged', 'shipped', 'delivered', 'return_requested']
const FN_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('.supabase.co', '.functions.supabase.co')

const STATUS_LABEL: Record<string, string> = {
  pending:          'Pending',
  sourcing:         'Sourcing',
  packaged:         'Packaged',
  shipped:          'Shipped',
  delivered:        'Active',
  return_requested: 'Return requested',
}

const STATUS_COLOR: Record<string, string> = {
  pending:          'bg-yellow-50 text-yellow-700 border-yellow-200',
  sourcing:         'bg-yellow-50 text-yellow-700 border-yellow-200',
  packaged:         'bg-blue-50 text-blue-700 border-blue-200',
  shipped:          'bg-blue-50 text-blue-700 border-blue-200',
  delivered:        'bg-green-50 text-green-700 border-green-200',
  return_requested: 'bg-orange-50 text-orange-700 border-orange-200',
}

interface Rental {
  id: string
  status: string
  rental_fee_cents: number
  size: string
  next_billing_date: string | null
  buyout_price_snapshot: number
  created_at: string
  tracking_number: string | null
  carrier: string | null
  pieces: { name: string; brand: string; images: string[] | null } | null
}

function formatNextBilling(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const now = new Date()
  const days = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (days < 0)  return `Bill overdue — ${formatted}`
  if (days === 0) return 'Bills today'
  if (days <= 7)  return `Bills in ${days} day${days === 1 ? '' : 's'}`
  return `Next bill ${formatted}`
}

export function ActiveRentals() {
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [returning, setReturning] = useState<string | null>(null)
  const [returnError, setReturnError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('rentals')
      .select('id, status, rental_fee_cents, size, next_billing_date, buyout_price_snapshot, created_at, tracking_number, carrier, pieces(name, brand, images)')
      .eq('user_id', user.id)
      .in('status', ACTIVE_STATUSES)
      .order('created_at', { ascending: false })
    setRentals((data ?? []) as unknown as Rental[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function requestReturn(rentalId: string) {
    setReturning(rentalId)
    setReturnError(null)
    try {
      const supabase = createSupabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')
      const res = await fetch(`${FN_BASE}/v1/request-return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ rental_id: rentalId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Request failed')
      }
      setRentals(prev => prev.map(r => r.id === rentalId ? { ...r, status: 'return_requested' } : r))
    } catch (e: any) {
      setReturnError(e.message ?? 'Something went wrong. Email returns@davenport.rentals.')
    } finally {
      setReturning(null)
    }
  }

  // Billing summary
  const deliveredRentals = rentals.filter(r => r.status === 'delivered')
  const rawMonthly = deliveredRentals.reduce((s, r) => s + r.rental_fee_cents, 0)
  const discountRate = multiPieceDiscount(deliveredRentals.length)
  const discountedMonthly = Math.round(rawMonthly * (1 - discountRate))
  const savingsCents = rawMonthly - discountedMonthly
  const nextBillDate = deliveredRentals
    .filter(r => r.next_billing_date)
    .map(r => r.next_billing_date!)
    .sort()[0]

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-sand h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  if (rentals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-sand p-8">
        <p className="font-serif text-xl font-bold text-navy mb-2">Your wardrobe, waiting.</p>
        <p className="font-sans text-sm text-slate leading-relaxed mb-6">
          Once you rent, everything lives here — your pieces, billing dates, and the option to buy anything you love at a lower price.
        </p>
        <div className="space-y-2.5 mb-6">
          {[
            'Ships in 1–2 weeks',
            'Billed every 30 days from your order date',
            'Buyout price drops every month you rent',
            'Request a return anytime — label arrives within 24 hours',
          ].map(note => (
            <p key={note} className="font-sans text-sm text-slate flex items-start gap-2">
              <span className="text-gold/60 mt-0.5 shrink-0">✦</span>{note}
            </p>
          ))}
        </div>
        <Link
          href="/browse"
          className="inline-block font-sans text-sm font-medium bg-navy text-cream px-6 py-3 rounded-xl hover:bg-navy/90 transition-colors"
        >
          Build your suitcase →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rentals.map(rental => {
        const p = rental.pieces
        const canReturn = ['delivered', 'shipped', 'packaged', 'sourcing', 'pending'].includes(rental.status)
        const isInTransit = ['pending', 'sourcing', 'packaged', 'shipped'].includes(rental.status)

        return (
          <div key={rental.id} className="bg-white rounded-2xl border border-sand overflow-hidden">
            {/* Main row */}
            <div className="flex gap-3 p-4">
              <div className="w-14 h-[72px] rounded-xl overflow-hidden bg-sand shrink-0 relative">
                {p?.images?.[0] ? (
                  <Image
                    src={p.images[0]}
                    alt={`${p.brand} ${p.name}`}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-serif text-xl text-navy/30">D</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[10px] uppercase tracking-widest text-slate/50">{p?.brand}</p>
                <p className="font-sans text-sm font-semibold text-navy leading-snug line-clamp-1">{p?.name}</p>
                <p className="font-sans text-xs text-slate mt-0.5">
                  Size {rental.size} · {formatCentsPerMonth(rental.rental_fee_cents)}
                </p>
                {rental.next_billing_date && rental.status === 'delivered' && (
                  <p className="font-sans text-[11px] text-slate/40 mt-1">
                    {formatNextBilling(rental.next_billing_date)}
                  </p>
                )}
              </div>
              <span className={`self-start shrink-0 text-[10px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wide ${STATUS_COLOR[rental.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                {STATUS_LABEL[rental.status] ?? rental.status}
              </span>
            </div>

            {/* In-transit strip */}
            {isInTransit && (
              <div className="border-t border-sand/50 px-4 py-2.5 flex items-start gap-2 bg-sand/20">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
                <p className="font-sans text-[11px] text-slate leading-relaxed">
                  {rental.status === 'pending' ? 'Order confirmed. Your piece ships in 1–2 weeks.' :
                   rental.status === 'sourcing' ? 'Sourcing your piece now. Ships in 1–2 weeks.' :
                   rental.status === 'packaged' ? 'Packed and heading to the carrier. Tracking arrives by email.' :
                   rental.tracking_number
                     ? `${rental.carrier ? rental.carrier + ': ' : ''}${rental.tracking_number}`
                     : "On its way. Tracking info coming by email shortly."}
                </p>
              </div>
            )}

            {/* Action chips */}
            {rental.status !== 'return_requested' && !['returned', 'bought_out'].includes(rental.status) && (
              <div className="border-t border-sand/40 px-4 py-3 flex items-center gap-2.5">
                {/* Buyout chip */}
                {(rental.buyout_price_snapshot ?? 0) > 0 && (
                  <a
                    href={`mailto:support@davenport.rentals?subject=Buyout Request&body=I'd like to buy the piece from rental ${rental.id} for ${formatCents(rental.buyout_price_snapshot)}.`}
                    className="inline-flex items-center gap-1.5 bg-navy text-cream font-sans text-[11px] font-medium px-3 py-1.5 rounded-full hover:bg-navy/90 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                    </svg>
                    Buy · {formatCents(rental.buyout_price_snapshot)}
                  </a>
                )}
                {/* Return chip */}
                {canReturn && (
                  <button
                    onClick={() => requestReturn(rental.id)}
                    disabled={returning === rental.id}
                    className="inline-flex items-center gap-1.5 bg-sand/60 text-navy font-sans text-[11px] font-medium px-3 py-1.5 rounded-full hover:bg-sand transition-colors disabled:opacity-60"
                  >
                    {returning === rental.id ? (
                      <span>Requesting…</span>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                        Return
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Return requested confirmation */}
            {rental.status === 'return_requested' && (
              <div className="border-t border-sand/40 px-4 py-2.5 flex items-center gap-2 bg-green-50/50">
                <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-sans text-[11px] text-green-700">Return requested — your prepaid label is on its way</p>
              </div>
            )}
          </div>
        )
      })}

      {returnError && (
        <p className="font-sans text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {returnError}
        </p>
      )}

      {/* Billing summary */}
      {deliveredRentals.length > 0 && (
        <div className="bg-white rounded-2xl border border-sand px-5 py-4 space-y-2.5 mt-1">
          <p className="font-sans text-[10px] uppercase tracking-widest text-slate/50 mb-3">Monthly Billing</p>
          <div className="flex justify-between font-sans text-sm text-slate">
            <span>{deliveredRentals.length} {deliveredRentals.length === 1 ? 'rental' : 'rentals'}</span>
            <span>{formatCentsPerMonth(rawMonthly)}</span>
          </div>
          {savingsCents > 0 && (
            <div className="flex justify-between font-sans text-sm">
              <span className="text-slate">Bundle discount ({Math.round(discountRate * 100)}% off)</span>
              <span className="text-green-600 font-medium">−{formatCents(savingsCents)}/mo</span>
            </div>
          )}
          {savingsCents > 0 && (
            <div className="flex justify-between font-sans text-sm font-semibold text-navy border-t border-sand pt-2.5">
              <span>Monthly total</span>
              <span>{formatCentsPerMonth(discountedMonthly)}</span>
            </div>
          )}
          {nextBillDate && (
            <p className="font-sans text-xs text-slate/50 border-t border-sand pt-2.5">
              Next charge: {new Date(nextBillDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
