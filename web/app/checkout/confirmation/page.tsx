import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: { order_id?: string }
}) {
  const orderId = searchParams.order_id

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <div className="max-w-2xl mx-auto px-6 py-20">
          {/* Success icon */}
          <div className="w-20 h-20 bg-navy/8 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-9 h-9 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="font-serif text-4xl font-bold text-navy text-center mb-4">Order confirmed</h1>
          <p className="font-sans text-slate text-center mb-10 leading-relaxed">
            Your suitcase is locked in. You&apos;ll receive a confirmation email shortly.
          </p>

          {orderId && (
            <div className="bg-sand/40 rounded-2xl px-6 py-4 text-center mb-10">
              <p className="font-sans text-xs uppercase tracking-widest text-slate mb-1">Order ID</p>
              <p className="font-mono text-sm text-navy">{orderId}</p>
            </div>
          )}

          {/* What happens next */}
          <div className="bg-white rounded-2xl border border-sand p-8 mb-10">
            <h2 className="font-sans font-semibold text-navy mb-6 text-sm uppercase tracking-wide">What happens next</h2>
            <ol className="space-y-6">
              {[
                {
                  step: '1',
                  title: 'We pack your order',
                  body: 'Each piece is steamed, inspected, and packed within a few days of your order.',
                },
                {
                  step: '2',
                  title: 'It ships to you',
                  body: 'Expect delivery within 1–2 weeks. You\'ll get a tracking number when it ships.',
                },
                {
                  step: '3',
                  title: 'Wear it all month',
                  body: 'You\'re billed monthly. Minimum 30 days per piece. Cancel (by returning) anytime after that.',
                },
                {
                  step: '4',
                  title: 'Love it? Buy it.',
                  body: 'Your buyout price drops every month you rent. Keep pieces you love at a lower price.',
                },
              ].map(({ step, title, body }) => (
                <li key={step} className="flex gap-4">
                  <span className="w-7 h-7 rounded-full bg-navy/8 text-navy font-serif font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                    {step}
                  </span>
                  <div>
                    <p className="font-sans font-semibold text-navy mb-1">{title}</p>
                    <p className="font-sans text-sm text-slate leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/account"
              className="flex-1 bg-navy text-cream font-sans font-semibold py-4 rounded-xl hover:bg-navy/90 transition-colors text-center text-sm"
            >
              View my orders
            </Link>
            <Link
              href="/browse"
              className="flex-1 border border-navy/20 text-navy font-sans font-medium py-4 rounded-xl hover:bg-sand/40 transition-colors text-center text-sm"
            >
              Browse more pieces
            </Link>
          </div>

          <p className="font-sans text-xs text-slate/60 text-center mt-8">
            Questions? Email us at{' '}
            <a href="mailto:support@davenport.rentals" className="text-navy hover:underline">
              support@davenport.rentals
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
