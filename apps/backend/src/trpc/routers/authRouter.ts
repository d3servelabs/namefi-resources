import { authContract } from '@namefi-astra/common/contract/auth-contract';
import { NAMEFI_EIP712_DOMAIN } from '#lib/auth/ecdsa-payload-signature';
import { baseProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';

export const authRouter = createContractTRPCRouter<typeof authContract>({
  /**
   * Get the EIP-712 domain configuration for signing payloads.
   *
   * Clients should use this domain when signing EIP-712 typed data
   * for operations that require payload signatures.
   *
   * @returns The EIP-712 domain configuration
   */
  getSigningDomain: baseProcedure
    .input(authContract.getSigningDomain.input)
    .output(authContract.getSigningDomain.output)
    .query(() => {
      return {
        domain: NAMEFI_EIP712_DOMAIN,
      };
    }),
});
