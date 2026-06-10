import { StripeProvider } from '@stripe/stripe-react-native'
import type { ReactNode } from 'react'
import { Fragment } from 'react'

export function StripeWrapper({ children }: { children: ReactNode }) {
  // StripeProvider types children as ReactElement | ReactElement[], but ReactNode is a superset.
  // Wrapping in Fragment normalises it to a single ReactElement without ts-expect-error.
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      urlScheme="davenport"
    >
      <Fragment>{children}</Fragment>
    </StripeProvider>
  )
}
