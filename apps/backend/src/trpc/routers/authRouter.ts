import { createTRPCRouter, baseProcedure } from '../base';
import { NAMEFI_EIP712_DOMAIN } from '#lib/auth/ecdsa-payload-signature';

export const authRouter = createTRPCRouter({
  /**
   * Get the EIP-712 domain configuration for signing payloads.
   *
   * Clients should use this domain when signing EIP-712 typed data
   * for operations that require payload signatures.
   *
   * @returns The EIP-712 domain configuration
   */
  getSigningDomain: baseProcedure.query(() => {
    return {
      domain: NAMEFI_EIP712_DOMAIN,
    };
  }),
});
