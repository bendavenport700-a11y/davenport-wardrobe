import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

const FAQS = [
  { q: 'How does the rental work?', a: 'You pick pieces from the app, add them to your suitcase, and checkout. We ship within 2–3 days. You\'re billed monthly on the 1st. Keep pieces as long as you want.' },
  { q: 'Can I buy a piece I\'ve been renting?', a: 'Yes — and the price drops every month you rent it. After 3 months on a typical piece, the buyout price has already dropped significantly. You can buy outright from the Account tab in the app.' },
  { q: 'What\'s the security deposit?', a: 'A $75 deposit is held (not charged) on your card when you place your first order. It\'s released in full when all pieces are returned in acceptable condition.' },
  { q: 'How do I return a piece?', a: 'Email returns@davenport.rentals with your order number. We\'ll send a prepaid shipping label.' },
  { q: 'What condition are the pieces in?', a: 'Every listing shows the condition (New, Like New, Good) and the number of prior rentals. We only list pieces in wearable condition.' },
  { q: 'What if something gets damaged?', a: 'Normal wear is expected and fine. Damage beyond normal wear may result in your deposit being charged — but we\'ll always reach out first and give you at least 30 days notice.' },
  { q: 'How do I delete my account?', a: 'Go to Account → Delete Account in the app. Your data is removed within 30 days.' },
]

export default function SupportPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="font-serif text-5xl font-bold text-navy mb-3">Support</h1>
          <p className="font-sans text-slate text-lg mb-12">
            Questions? Email us at{' '}
            <a href="mailto:support@davenport.rentals" className="text-navy underline">support@davenport.rentals</a>
            {' '}and we respond within one business day.
          </p>

          <div className="space-y-6">
            {FAQS.map((faq, i) => (
              <div key={i} className="border-b border-sand pb-6 last:border-0">
                <h2 className="font-serif text-lg font-semibold text-navy mb-2">{faq.q}</h2>
                <p className="font-sans text-base text-slate leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
