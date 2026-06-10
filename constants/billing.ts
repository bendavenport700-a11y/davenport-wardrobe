// Billing constants — single source of truth for deposit and handling amounts.
// Read from Expo env vars so they can be changed without code changes.
export const DEPOSIT_CENTS  = parseInt(process.env.EXPO_PUBLIC_DEPOSIT_AMOUNT_CENTS ?? '7500')
export const HANDLING_CENTS = parseInt(process.env.EXPO_PUBLIC_HANDLING_FEE_CENTS   ?? '500')
