import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

const SECTIONS = [
  {
    number: '1',
    title: 'Minimum Rental Period',
    body: 'Each item rented through Davenport has a minimum rental period of 30 days. Returning an item before 30 days does not reduce your first payment.',
  },
  {
    number: '2',
    title: 'Rolling Billing',
    body: 'Rental fees are charged on a rolling 30-day cycle from the date your order is placed, not on a calendar-month schedule. Each active rental is billed independently. Charges are processed automatically to your saved payment method. You will receive a receipt by email after each successful charge.',
  },
  {
    number: '3',
    title: 'Security Deposit',
    body: 'A refundable security deposit is held on your payment method when you place your first order. The deposit amount is disclosed at checkout. Your deposit authorization is released when all rented items have been returned and inspected in acceptable condition. If your deposit was partially applied to a damage charge, the remaining authorization is automatically released by our payment processor.',
  },
  {
    number: '4',
    title: 'Damage Charges',
    body: 'Normal wear is expected and acceptable. Damage beyond normal wear — including stains, tears, missing buttons, or structural damage — will be assessed per item at the time of return.',
    subsections: [
      { label: '(a)', sublabel: 'Deposit Capture:', text: 'Damage charges up to the amount of your security deposit will be applied against your deposit hold.' },
      { label: '(b)', sublabel: 'Excess Damage:', text: 'If damage to one or more items exceeds your security deposit, the excess amount will be charged separately to your saved payment method. You authorize this charge by accepting these terms.' },
      { label: '(c)', sublabel: 'Multiple Items:', text: 'Each item is assessed independently. If multiple returned items are damaged, damage charges are calculated per item and may be applied individually or in aggregate.' },
      { label: '(d)', sublabel: 'Buyout Option:', text: 'In lieu of a damage charge, Davenport may charge you the buyout price of the damaged item. You will be notified in advance if this applies.' },
    ],
    footer: 'You will be given at least 30 days written notice before any deposit capture or damage charge is applied.',
  },
  {
    number: '5',
    title: 'Returns',
    body: "To return an item, tap 'Return' on your active rental in your account at davenport.rentals/account, or email returns@davenport.rentals with your order number. We will email a prepaid return label within 24 hours. Ship back within 21 days. Items must be returned in the condition received, accounting for normal wear.",
  },
  {
    number: '6',
    title: 'Refund Requests',
    body: "To request a refund, contact support@davenport.rentals with your order number. Refund requests are reviewed within 3–5 business days. Approved refunds are credited to your original payment method. Refunds are not available after 30 days from your order date.",
  },
  {
    number: '7',
    title: 'Item Condition',
    body: 'Items are described accurately at time of listing. Condition is assessed as Pristine, Excellent, Well-Worn, or Veteran based on prior rental count. Wear count reflects rentals completed.',
  },
  {
    number: '8',
    title: 'Cancellation',
    body: 'You may request a return at any time. Your first 30 days are billed upfront and non-refundable, regardless of when you return. After day 30, billing stops as soon as you submit a return request. No cancellation fee.',
  },
  {
    number: '9',
    title: 'Non-Return and Default',
    body: 'If you fail to return rented items within 90 days of a return request, or if your account becomes 90 days past due, Davenport may:',
    subsections: [
      { label: '(a)', text: 'Charge your saved payment method the buyout price for each unreturned item. By accepting these terms, you expressly authorize this charge for any item not returned within the default period.' },
      { label: '(b)', text: 'Capture your full security deposit.' },
      { label: '(c)', text: 'Suspend your account.' },
      { label: '(d)', text: 'Report the outstanding balance to collections.' },
      { label: '(e)', text: 'Pursue recovery through small claims court.' },
    ],
    footer: "You will be given at least 30 days written notice before any non-return charge is applied. The outstanding balance for non-returned items is calculated as the current buyout price of each unreturned item at the time of default.",
  },
  {
    number: '10',
    title: 'Contact',
    body: 'Questions: support@davenport.rentals\nReturns: returns@davenport.rentals',
  },
  {
    number: '11',
    title: 'Shipping and Delivery',
    body: 'Davenport ships within 1–2 weeks. Delivery fee covers one-way shipping only. Return shipping via prepaid label provided by Davenport.',
  },
  {
    number: '12',
    title: 'Governing Law',
    body: 'These Rental Terms shall be governed by and construed in accordance with the laws of the state in which Davenport Wardrobe LLC is registered, without regard to conflict of law provisions. Any disputes shall be resolved in the courts of that state.',
  },
  {
    number: '13',
    title: 'Privacy',
    body: 'Davenport Wardrobe LLC collects your name, email, shipping address, and payment method to fulfill your rental orders. We do not sell your personal information. See our Privacy Policy at davenport.rentals/privacy for full details.',
  },
]

export default function RentalTermsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="font-serif text-5xl font-bold text-navy mb-2">Rental Terms</h1>
          <p className="font-sans text-sm text-slate mb-12">Last updated: June 2026 · Davenport Wardrobe LLC</p>

          <div className="space-y-6">
            {SECTIONS.map(section => (
              <div key={section.number} className="bg-white rounded-2xl border border-sand p-6">
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-navy rounded-lg flex items-center justify-center text-[11px] font-sans font-bold text-cream">
                    {section.number}
                  </span>
                  <h2 className="font-sans font-semibold text-navy text-sm uppercase tracking-wide pt-1">{section.title}</h2>
                </div>
                <p className="font-sans text-sm text-slate leading-relaxed whitespace-pre-line pl-10">{section.body}</p>
                {section.subsections && (
                  <div className="mt-3 pl-10 space-y-2.5">
                    {section.subsections.map((sub, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="font-sans text-xs font-semibold text-navy shrink-0 w-6">{sub.label}</span>
                        <p className="font-sans text-sm text-slate leading-relaxed">
                          {'sublabel' in sub && sub.sublabel && (
                            <span className="font-semibold text-navy">{sub.sublabel} </span>
                          )}
                          {sub.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {section.footer && (
                  <div className="mt-4 pl-10 bg-sand/30 rounded-xl px-4 py-3">
                    <p className="font-sans text-xs text-navy/70 leading-relaxed">{section.footer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
