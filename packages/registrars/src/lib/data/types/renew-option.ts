/**
 * RenewOption Enum
 */
export const RenewOption = {
  MANUAL: 'MANUAL',
  AUTOMATIC: 'AUTOMATIC',
} as const;

export type RenewOption = (typeof RenewOption)[keyof typeof RenewOption];
