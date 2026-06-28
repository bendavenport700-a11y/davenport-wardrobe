const ROW_ONE = [
  'Rent for vacation',
  'Perfect for travel',
  'Wedding ready',
  'Nail the job interview',
  'Internship season',
  'Career fair confident',
  'Networking events',
  'Business trips covered',
  'Date night sorted',
  'Formal events handled',
  'Party perfect',
  'Graduation ready',
  'Photoshoot looks',
  'Cruise wardrobe',
  'Ski trip style',
  'Seasonal clothing, no storage',
  'Built for small closets',
  'College dorm living',
  'Moving to a new city',
  'Moving into college',
  'Rent through weight changes',
  'Pregnancy wardrobe covered',
  'Post-pregnancy flexibility',
  'Fitness transformation friendly',
  'Temporary size changes, no problem',
  'Try a new style risk-free',
  'Explore fashion trends',
  'Test luxury brands first',
  'Build your confidence',
  'Find your personal style',
  'Save money on clothing',
  'Avoid impulse purchases',
  'Try before you buy',
  'Access expensive brands affordably',
  'Wear designer clothing',
]

const ROW_TWO = [
  'No closet clutter',
  'Always a fresh wardrobe',
  'No outfit repetition',
  'Special occasions covered',
  'Last-minute event ready',
  'Professional headshots',
  'Dress for the promotion',
  'New job, new wardrobe',
  'Public speaking events',
  'Adapt to climate changes',
  'Temporary needs only',
  'Sustainable fashion choice',
  'Reduce clothing waste',
  'Live more minimally',
  'Capsule wardrobe support',
  'Monthly wardrobe refresh',
  'Experiment with colors',
  'Experiment with fits',
  'Accessorize for every event',
  'Look your best for what matters',
  'No long-term commitment',
  'Zero buyer\'s remorse',
  'More variety, less spend',
  'Always on trend',
  'Look professional every day',
  'Look fashionable effortlessly',
  'Save storage space',
  'Adapt to lifestyle changes',
  'Recover from body changes gracefully',
  'Access premium clothing',
  'Unmatched convenience',
  'True flexibility',
  'Real affordability',
  'Endless variety',
  'Wear it with confidence',
  'Freedom from ownership',
]

function TickerRow({ items, direction }: { items: string[]; direction: 'left' | 'right' }) {
  const doubled = [...items, ...items]
  return (
    <div className="overflow-hidden py-3">
      <div
        className={direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}
        style={{ display: 'flex', width: 'max-content' }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center whitespace-nowrap">
            <span className="font-sans text-sm font-medium text-cream/80 px-5">{item}</span>
            <span className="text-gold/50 text-xs">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function ReasonsTicker() {
  return (
    <section className="bg-navy border-y border-cream/10 py-1 overflow-hidden">
      <TickerRow items={ROW_ONE} direction="left" />
      <div className="border-t border-cream/10" />
      <TickerRow items={ROW_TWO} direction="right" />
    </section>
  )
}
