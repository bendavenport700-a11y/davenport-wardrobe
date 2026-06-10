'use client'

import { useTransition } from 'react'

interface Props {
  message: string
  action: () => Promise<void>
  className?: string
  children: React.ReactNode
}

export function ConfirmButton({ message, action, className, children }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(message)) return
        startTransition(() => action())
      }}
      className={className}
    >
      {isPending ? 'Deleting…' : children}
    </button>
  )
}
