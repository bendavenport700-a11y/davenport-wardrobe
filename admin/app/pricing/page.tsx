// Pricing model constants — ask Ben to confirm before finalizing
const DEPRECIATION_SCHEDULE = [
  { label: 'Brand new', buyoutPct: 1.00, rentalPct: 1.00 },
  { label: 'After 1st renter', buyoutPct: 0.80, rentalPct: 0.95 },
  { label: 'After 2nd renter', buyoutPct: 0.70, rentalPct: 0.90 },
  { label: 'After 3rd renter', buyoutPct: 0.65, rentalPct: 0.87 },
  { label: 'After 4th+ renter', buyoutPct: 0.60, rentalPct: 0.85 },
]
const BUYOUT_FLOOR_PCT = 0.50
const RENTAL_FLOOR_PCT = 0.80

const PERSONAL_DISCOUNT = [
  { month: 1, discountPct: 0 },
  { month: 2, discountPct: 0.04 },
  { month: 3, discountPct: 0.08 },
  { month: '4+', discountPct: 0.12 },
]

const EXAMPLE_RETAIL = 3870   // $38.70 — Finley Pocket Tee
const EXAMPLE_RENTAL = 581    // $5.81/mo

function pct(n: number) { return `${Math.round(n * 100)}%` }
function cents(n: number) { return `$${(n / 100).toFixed(2)}` }

function currentBuyout(retailCents: number, returnsIndex: number) {
  const schedule = DEPRECIATION_SCHEDULE[Math.min(returnsIndex, DEPRECIATION_SCHEDULE.length - 1)]
  return Math.max(retailCents * schedule.buyoutPct, retailCents * BUYOUT_FLOOR_PCT)
}

function currentRental(baseCents: number, returnsIndex: number) {
  const schedule = DEPRECIATION_SCHEDULE[Math.min(returnsIndex, DEPRECIATION_SCHEDULE.length - 1)]
  return Math.max(baseCents * schedule.rentalPct, baseCents * RENTAL_FLOOR_PCT)
}

function renterBuyout(baseBuyoutCents: number, monthsRented: number) {
  const discount = Math.min(Math.max(0, monthsRented - 1) * 0.04, 0.12)
  return baseBuyoutCents * (1 - discount)
}

export default function PricingPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Pricing Model</h1>
        <p className="text-gray-500 text-sm mt-1">
          Two-part system: piece value drops when returned, plus a personal discount the longer someone rents.
        </p>
        <div className="mt-2 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          <span className="text-amber-600 text-xs font-medium">Numbers are proposed — not yet finalized</span>
        </div>
      </div>

      {/* Part 1: Piece depreciation */}
      <div className="bg-white rounded-xl border border-gray-100 mb-5">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy">Part 1 — Piece depreciation on return</h2>
          <p className="text-gray-500 text-xs mt-1">Each time a piece comes back, its buyout price and rental rate permanently drop. First return is the biggest drop.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Condition</th>
                <th className="text-right px-5 py-3 font-medium">Buyout</th>
                <th className="text-right px-5 py-3 font-medium">Monthly rate</th>
                <th className="text-right px-5 py-3 font-medium">Example buyout</th>
                <th className="text-right px-5 py-3 font-medium">Example rate</th>
              </tr>
            </thead>
            <tbody>
              {DEPRECIATION_SCHEDULE.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 text-navy font-medium">{row.label}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{pct(row.buyoutPct)}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{pct(row.rentalPct)}</td>
                  <td className="px-5 py-3 text-right font-mono text-navy">{cents(Math.round(EXAMPLE_RETAIL * row.buyoutPct))}</td>
                  <td className="px-5 py-3 text-right font-mono text-navy">{cents(Math.round(EXAMPLE_RENTAL * row.rentalPct))}/mo</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="px-5 py-3 text-gray-400 text-xs">Floor (never below)</td>
                <td className="px-5 py-3 text-right text-gray-400 text-xs">{pct(BUYOUT_FLOOR_PCT)}</td>
                <td className="px-5 py-3 text-right text-gray-400 text-xs">{pct(RENTAL_FLOOR_PCT)}</td>
                <td className="px-5 py-3 text-right font-mono text-gray-400 text-xs">{cents(Math.round(EXAMPLE_RETAIL * BUYOUT_FLOOR_PCT))}</td>
                <td className="px-5 py-3 text-right font-mono text-gray-400 text-xs">{cents(Math.round(EXAMPLE_RENTAL * RENTAL_FLOOR_PCT))}/mo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Part 2: Personal discount */}
      <div className="bg-white rounded-xl border border-gray-100 mb-5">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy">Part 2 — Personal buyout discount while renting</h2>
          <p className="text-gray-500 text-xs mt-1">The longer someone rents a piece, the cheaper their buyout price gets. Resets completely for each new renter.</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left px-5 py-3 font-medium">Rental month</th>
              <th className="text-right px-5 py-3 font-medium">Extra discount</th>
              <th className="text-right px-5 py-3 font-medium">Brand new buyout</th>
              <th className="text-right px-5 py-3 font-medium">After 1 renter</th>
            </tr>
          </thead>
          <tbody>
            {PERSONAL_DISCOUNT.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-3 text-navy">Month {row.month}</td>
                <td className="px-5 py-3 text-right text-gray-600">{row.discountPct === 0 ? 'None' : `-${pct(row.discountPct)}`}</td>
                <td className="px-5 py-3 text-right font-mono text-navy">
                  {cents(Math.round(renterBuyout(currentBuyout(EXAMPLE_RETAIL, 0), typeof row.month === 'number' ? row.month : 4)))}
                </td>
                <td className="px-5 py-3 text-right font-mono text-gray-500">
                  {cents(Math.round(renterBuyout(currentBuyout(EXAMPLE_RETAIL, 1), typeof row.month === 'number' ? row.month : 4)))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scenarios */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy">Example scenarios</h2>
          <p className="text-gray-500 text-xs mt-1">Using Finley Pocket Tee: retail $38.70, rental $5.81/mo</p>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'Brand new piece, month 1 renter', returns: 0, months: 1 },
            { label: 'Brand new piece, month 4+ renter', returns: 0, months: 4 },
            { label: 'After 1 previous renter, month 1', returns: 1, months: 1 },
            { label: 'After 1 previous renter, month 4+', returns: 1, months: 4 },
            { label: 'After 2 previous renters, month 1', returns: 2, months: 1 },
          ].map((s, i) => {
            const base = currentBuyout(EXAMPLE_RETAIL, s.returns)
            const buyout = renterBuyout(base, s.months)
            const rental = currentRental(EXAMPLE_RENTAL, s.returns)
            return (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">{s.label}</span>
                <div className="flex gap-6 text-right">
                  <div>
                    <p className="text-xs text-gray-400">Buyout</p>
                    <p className="font-mono text-sm text-navy font-medium">{cents(Math.round(buyout))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Monthly</p>
                    <p className="font-mono text-sm text-navy font-medium">{cents(Math.round(rental))}/mo</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
