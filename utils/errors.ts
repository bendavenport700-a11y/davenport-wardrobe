export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)

  if (msg.includes('NetworkError') || msg.includes('fetch failed')) {
    return 'No internet connection. Please check your network and try again.'
  }
  if (msg.includes('JWT') || msg.includes('session')) {
    return 'Your session expired. Please sign in again.'
  }
  if (msg.includes('PIECE_UNAVAILABLE_REFUND_FAILED')) {
    const ref = msg.split(':')[1] ?? 'unknown'
    return `A piece was unavailable and your refund couldn't be processed automatically. Email support@davenport.rentals immediately — ref: ${ref}`
  }
  if (msg.includes('PIECE_UNAVAILABLE')) {
    return 'A piece in your cart just became unavailable. Your payment has been refunded.'
  }
  if (msg.includes('SIZE_UNAVAILABLE')) {
    return 'That size is no longer available. Please update your suitcase.'
  }
  if (msg.includes('Shipping address required')) {
    return 'Please add a shipping address to your account before checking out.'
  }
  if (msg.includes('No Stripe customer') || msg.includes('call create-setup-intent')) {
    return 'Payment setup incomplete. Please restart checkout.'
  }
  if (msg.includes('No payment method') || msg.includes('no payment method on file')) {
    return 'Please add a payment method to continue.'
  }
  if (msg.includes('Payment method not saved') || msg.includes('SetupIntent not succeeded')) {
    return 'Card setup was not completed. Please try again.'
  }
  if (msg.includes('Payment failed') || msg.includes('payment failed')) {
    return 'Payment failed. Please check your card details and try again.'
  }
  if (msg.includes('insufficient_funds') || msg.includes('card_declined')) {
    return 'Your card was declined. Please try a different payment method.'
  }
  if (msg.includes('stripe') || msg.includes('Stripe')) {
    return 'Payment processing failed. Please try again or contact support.'
  }
  if (msg.includes('rpc_failed')) {
    const ref = msg.split(':')[1] ?? 'unknown'
    return `Something went wrong. Your payment is safe — email support@davenport.rentals (ref: ${ref})`
  }
  if (msg.includes('violates') || msg.includes('constraint')) {
    return 'This action could not be completed. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}
