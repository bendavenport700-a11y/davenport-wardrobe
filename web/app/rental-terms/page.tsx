import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function RentalTermsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="font-serif text-5xl font-bold text-navy mb-2">Rental Terms</h1>
          <p className="font-sans text-sm text-slate mb-12">Last updated: June 2026 · Davenport Wardrobe LLC</p>

          <div className="space-y-8 font-sans text-base text-slate leading-relaxed">
            {[
              ['1. Minimum Rental Period', 'Each item rented through Davenport has a minimum rental period of 30 days. Returning an item before 30 days does not reduce your first month\'s charge.'],
              ['2. Monthly Billing', 'Your saved payment method is charged on the 1st of each month for all active rentals. Charges are processed automatically. You will receive a receipt by email after each successful charge.'],
              ['3. Security Deposit', 'A refundable security deposit is held on your payment method when you place your first order. The deposit amount is disclosed at checkout. Your deposit is returned when all rented items have been received back in acceptable condition.'],
              ['4. Damage and Loss', 'Normal wear is expected and acceptable. Damage beyond normal wear, or failure to return an item within 90 days of a return request, may result in your deposit being charged. You will be given at least 30 days written notice before any deposit capture.'],
              ['5. Returns', 'To return an item, email returns@davenport.rentals with your order number. We will provide prepaid shipping instructions. Items must be returned in the condition received, accounting for normal wear.'],
              ['6. Item Condition', 'Items are described accurately at time of listing. Condition is shown as Pristine, Excellent, Well-Worn, or Veteran based on prior rental count. Wear count reflects rentals completed.'],
              ['7. Cancellation', 'You may cancel a rental at any time after the 30-day minimum by returning the item. No cancellation fee beyond the minimum period.'],
              ['8. Non-Return and Default', 'If you fail to return rented items within 90 days of a return request, Davenport may capture your security deposit, suspend your account, and pursue recovery for outstanding balances.'],
              ['9. Shipping', 'Orders ship in 1–2 weeks. Return shipping is provided via prepaid label from Davenport.'],
              ['10. Governing Law', 'These terms are governed by the laws of the state in which Davenport Wardrobe LLC is registered. Disputes shall be resolved in the courts of that state.'],
              ['11. Contact', 'Questions: support@davenport.rentals\nReturns: returns@davenport.rentals'],
            ].map(([title, body]) => (
              <div key={title}>
                <h2 className="font-serif text-lg font-semibold text-navy mb-2">{title}</h2>
                <p className="whitespace-pre-line">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
