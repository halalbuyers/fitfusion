export const FEATURE_FLAGS = {
  enablePayments: false,
  enablePremium: false
} as const

export function isPremiumEnabled() {
  return FEATURE_FLAGS.enablePayments && FEATURE_FLAGS.enablePremium
}
