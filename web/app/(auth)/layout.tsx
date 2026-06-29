import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="px-6 py-5 border-b border-sand/60">
        <Link href="/" className="font-serif text-lg font-bold text-navy tracking-[0.35em] hover:opacity-75 transition-opacity">
          DAVENPORT
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        {children}
      </main>
    </div>
  )
}
