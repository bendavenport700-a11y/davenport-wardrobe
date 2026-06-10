import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { BrowseClient } from './BrowseClient'
import { getAllPieces } from '@/lib/supabase'

export const revalidate = 300

export default async function BrowsePage() {
  const pieces = await getAllPieces()

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <BrowseClient pieces={pieces} />
      </main>
      <Footer />
    </>
  )
}
