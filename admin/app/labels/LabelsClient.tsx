'use client'

import { useState } from 'react'

export type FilterMode = 'all' | 'available' | 'rented'

export interface UnitWithPiece {
  id: string
  piece_id: string
  size: string
  wear_count: number
  condition: 'new' | 'like_new' | 'good'
  is_available: boolean
  piece: {
    id: string
    name: string
    brand: string
  }
}

function conditionDot(wear_count: number) {
  if (wear_count === 0) return { color: '#16a34a', label: 'Pristine' }       // green
  if (wear_count <= 5)  return { color: '#2563eb', label: 'Excellent' }       // blue
  return { color: '#d97706', label: 'Well-worn' }                             // amber
}

function Label({ unit }: { unit: UnitWithPiece }) {
  const dot = conditionDot(unit.wear_count)
  const shortId = unit.id.slice(0, 8)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=DVPT:${unit.id}`

  return (
    <div
      className="label-card"
      style={{
        width: '2.5in',
        height: '2.5in',
        border: '2px solid #1B2A4A',
        background: '#ffffff',
        borderRadius: '6px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      {/* Top row: brand + size badge */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontSize: '9px',
          fontVariant: 'small-caps',
          letterSpacing: '0.08em',
          color: '#1B2A4A',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}>
          {unit.piece.brand}
        </span>
        <span style={{
          fontSize: '9px',
          fontWeight: 700,
          color: '#ffffff',
          background: '#1B2A4A',
          borderRadius: '3px',
          padding: '1px 5px',
          letterSpacing: '0.04em',
        }}>
          {unit.size}
        </span>
      </div>

      {/* QR code */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrUrl}
        alt={`QR for ${unit.id}`}
        width={90}
        height={90}
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Piece name */}
      <p style={{
        fontSize: '8px',
        fontWeight: 600,
        color: '#1B2A4A',
        textAlign: 'center',
        margin: 0,
        lineHeight: '1.2',
        maxHeight: '2.4em',
        overflow: 'hidden',
        width: '100%',
      }}>
        {unit.piece.name}
      </p>

      {/* Bottom row: condition + wear count + unit id + status */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Condition dot + wear count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: dot.color,
            display: 'inline-block',
            flexShrink: 0,
          }} title={dot.label} />
          <span style={{ fontSize: '8px', color: '#374151' }}>{unit.wear_count}w</span>
        </div>

        {/* Unit ID */}
        <span style={{
          fontSize: '7px',
          fontFamily: 'monospace',
          color: '#6b7280',
          letterSpacing: '0.02em',
        }}>
          {shortId}
        </span>

        {/* Status */}
        <span style={{
          fontSize: '7px',
          fontWeight: 600,
          color: unit.is_available ? '#16a34a' : '#dc2626',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {unit.is_available ? 'Available' : 'Rented'}
        </span>
      </div>
    </div>
  )
}

export default function LabelsClient({ units }: { units: UnitWithPiece[] }) {
  const [filter, setFilter] = useState<FilterMode>('all')

  const filtered = units.filter(u => {
    if (filter === 'available') return u.is_available
    if (filter === 'rented') return !u.is_available
    return true
  })

  // Group by piece_id, preserve order of first appearance
  const groups = filtered.reduce<{ pieceId: string; pieceName: string; units: UnitWithPiece[] }[]>(
    (acc, unit) => {
      const existing = acc.find(g => g.pieceId === unit.piece_id)
      if (existing) {
        existing.units.push(unit)
      } else {
        acc.push({ pieceId: unit.piece_id, pieceName: unit.piece.name, units: [unit] })
      }
      return acc
    },
    []
  )

  const filterButtons: { key: FilterMode; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'available', label: 'Available only' },
    { key: 'rented', label: 'Rented only' },
  ]

  return (
    <>
      {/* Header — hidden on print */}
      <div className="no-print flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Inventory Labels</h1>
        <button
          onClick={() => window.print()}
          className="bg-navy text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy/90 transition-colors"
        >
          Print Labels
        </button>
      </div>

      {/* Filter bar — hidden on print */}
      <div className="no-print flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {filterButtons.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-navy'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-2 self-center text-xs text-gray-400">{filtered.length} unit{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Label groups */}
      {groups.length === 0 ? (
        <p className="text-gray-400 text-sm">No units match this filter.</p>
      ) : (
        groups.map(group => (
          <div key={group.pieceId} className="mb-8">
            {/* Section header — hidden on print */}
            <h2 className="no-print text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3 border-b border-gray-100 pb-1">
              {group.pieceName}
            </h2>
            {/* Label grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 2.5in)',
                gap: '0.25in',
              }}
            >
              {group.units.map(unit => (
                <Label key={unit.id} unit={unit} />
              ))}
            </div>
          </div>
        ))
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </>
  )
}
