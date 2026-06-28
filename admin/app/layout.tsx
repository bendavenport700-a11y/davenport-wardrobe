import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { getSessionUser } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Davenport Admin',
  description: 'Davenport Wardrobe inventory management',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()

  return (
    <html lang="en" className={inter.className}>
      <body className="bg-gray-50 text-gray-900 flex min-h-screen antialiased">
        <Sidebar user={user ? { name: user.name, role: user.role } : null} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
