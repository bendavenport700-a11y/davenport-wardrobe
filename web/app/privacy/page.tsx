import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'We collect your name, email address, shipping address, and payment method (processed by Stripe — we never store card numbers). We also collect rental and order history and device identifiers for app functionality.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use your information to process and fulfill rental orders, charge your saved payment method for monthly rentals, send order confirmations and billing receipts, provide customer support, and improve the service.',
  },
  {
    title: '3. Data Sharing',
    body: 'We do not sell your personal information. We share data only with Stripe (payment processing), Resend (transactional email), and Supabase (secure database hosting). All are bound by strict data processing agreements.',
  },
  {
    title: '4. Data Retention',
    body: 'We retain your account data for as long as your account is active. When you delete your account (Account tab → Delete Account at the bottom), your personal information is removed within 30 days. Order records may be retained for legal compliance, anonymized from your identity.',
  },
  {
    title: '5. Your Rights',
    body: 'You may request a copy of your data, request correction of inaccurate data, or delete your account at any time from within the app. For data requests: privacy@davenport.rentals.',
  },
  {
    title: '6. Security',
    body: 'Your data is encrypted in transit (TLS) and at rest. Payment information is handled exclusively by Stripe and never stored on Davenport servers.',
  },
  {
    title: '7. Contact',
    body: 'Privacy questions: privacy@davenport.rentals\nGeneral support: support@davenport.rentals',
  },
]

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="font-serif text-5xl font-bold text-navy mb-2">Privacy Policy</h1>
          <p className="font-sans text-sm text-slate mb-12">Last updated: June 2026</p>

          <div className="space-y-10">
            {SECTIONS.map((s, i) => (
              <div key={i}>
                <h2 className="font-serif text-xl font-semibold text-navy mb-3">{s.title}</h2>
                <p className="font-sans text-base text-slate leading-relaxed whitespace-pre-line">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
