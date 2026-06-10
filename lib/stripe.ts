// Base file for TypeScript module resolution.
// Metro bundler resolves to stripe.native.ts (iOS/Android) or stripe.web.ts (web) at runtime.
export { useStripe } from './stripe.native'
export type { PresentPaymentSheetResult } from './stripe.native'
