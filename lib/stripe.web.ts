export const useStripe = () => ({
  initPaymentSheet: async () => ({ error: undefined }),
  presentPaymentSheet: async () => ({ error: undefined }),
})
export type PresentPaymentSheetResult = { error?: { code: string; message: string } }
