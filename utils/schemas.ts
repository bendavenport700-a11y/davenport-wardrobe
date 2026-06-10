import { z } from 'zod'

export const shippingAddressSchema = z.object({
  line1: z.string().min(5, 'Address is required'),
  line2: z.string().optional(),
  city:  z.string().min(2, 'City is required'),
  state: z.string().min(2, 'Use 2-letter state code').max(2, 'Use 2-letter state code').transform(v => v.toUpperCase()),
  zip:   z.string().regex(/^\d{5}$/, 'Enter a 5-digit ZIP code'),
})

export const signupSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  email:     z.string().email('Enter a valid email'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  terms:     z.literal(true, { error: 'You must accept the terms' }),
})

export const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const completeProfileSchema = z.object({
  full_name:        z.string().min(2, 'Enter your name'),
  phone:            z.string().optional(),
  shipping_address: shippingAddressSchema,
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export type SignupFormData           = z.infer<typeof signupSchema>
export type LoginFormData            = z.infer<typeof loginSchema>
export type CompleteProfileFormData  = z.infer<typeof completeProfileSchema>
export type ShippingAddressFormData  = z.infer<typeof shippingAddressSchema>
export type ForgotPasswordFormData   = z.infer<typeof forgotPasswordSchema>
