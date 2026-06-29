import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/context/CartContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'Davenport — Rent. Wear. Own if you want to.',
  description: 'Rent premium wardrobe pieces monthly. Try before you commit. Buy at a lower price if you love it — or return it. No commitment.',
  openGraph: {
    title: 'Davenport — Rent. Wear. Own if you want to.',
    description: 'Rent premium menswear monthly. Try before you commit. Buy at a lower price if you love it — or return it.',
    url: 'https://davenport.rentals',
    siteName: 'Davenport',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans"><CartProvider>{children}</CartProvider></body>
    </html>
  )
}
