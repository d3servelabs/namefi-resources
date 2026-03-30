import { checksumWalletAddressSchema } from '@namefi-astra/utils';
import { z } from 'zod';

export const mppDidSourceSchema = z
  .string()
  .regex(/^did:pkh:(eip155:\d+):(0x[a-fA-F0-9]{40})$/)
  .transform((value) => {
    const match = value.match(/^did:pkh:(eip155:\d+):(0x[a-fA-F0-9]{40})$/);

    if (!match) {
      throw new Error('Invalid MPP DID source');
    }

    return {
      chain: match[1],
      walletAddress: checksumWalletAddressSchema.parse(match[2]),
    };
  });

export type ParsedMppDidSource = z.infer<typeof mppDidSourceSchema>;

export function parseMppDidSource(
  source?: string,
): ParsedMppDidSource | undefined {
  if (!source) {
    return undefined;
  }

  const result = mppDidSourceSchema.safeParse(source);
  if (!result.success) {
    return undefined;
  }

  return result.data;
}
