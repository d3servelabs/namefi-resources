import crypto from 'node:crypto';
import { CHAINS } from '@namefi-astra/utils/chains';
import { switchCaseOrDefault } from '@namefi-astra/utils/match';
import { Hono } from 'hono';
// Router for webhooks
//
import { secrets } from '#lib/env';
import { updateNamefiNftIndex } from '../temporal/activities/namefi-nft';

export const webhooksRouter = new Hono();

webhooksRouter.post(async (c) => {
  const signature = c.req.header('x-alchemy-signature');
  const rawBody = c.req.raw.body?.toString() ?? '';
  const body = (await c.req.json()) as
    | NftActivityResponse
    | AddressActivityResponse;
  console.log(`ALCHEMY WEBHOOK Network(${body.event.network})`);
  const chainId = switchCaseOrDefault(
    body.event?.network,
    {
      BASE_MAINNET: CHAINS.base.id,
      ETH_MAINNET: CHAINS.mainnet.id,
    },
    -1,
  );
  if (chainId === -1) {
    c.status(400);
    return c.text('Invalid Network');
  }
  try {
    const isValid = _isValidSignatureForStringBody(
      rawBody,
      signature ?? '',
      secrets.X_ALCHEMY_WEBHOOK_NFT_ACTIVITY_SIGNATURE?.[chainId] ?? '',
    );
    if (!isValid) {
      c.status(400);
      return c.text('Invalid Signature');
    }
    await updateNamefiNftIndex();
    c.status(200);
    return c.text('done');
  } catch (e) {
    console.error('Transfer Event Failed To Be Recorded');
    c.status(500);
    return c.text('Internal Server Error');
  }
});

type AddressActivityResponse = {
  webhookId: string;
  id: string;
  createdAt: string; //ISO
  event: AddressActivityEvent;
  type: 'ADDRESS_ACTIVITY';
};
type AddressActivityEvent = {
  activity: {
    fromAddress: string;
    toAddress: string;
    erc1155Metadata: {
      tokenId: string;
      value: string;
    }[];
    erc721TokenId: string;
    category: string;
    transactionHash: string;
    log: {
      address: string;
      topics: string[];
      data: string;
      blockNumber: string;
      transactionHash: string;
      transactionIndex: string;
      blockHash: string;
      logIndex: string;
      removed: boolean;
    };

    blockNum: `0x${string}`;
    hash: `0x${string}`;
    value: number;
    asset: string;
    rawContract: {
      rawValue: `0x${string}`;
      address: `0x${string}`;
      decimals: number;
    };
    typeTraceAddress: null;
  }[];
  network: string;
};

type NftActivityResponse = {
  webhookId: string;
  id: string;
  createdAt: string;
  type: 'NFT_ACTIVITY';
  event: NftActivityEvent;
};

type NftActivityEvent = {
  activity: {
    fromAddress: string;
    toAddress: string;
    erc1155Metadata: {
      tokenId: string;
      value: string;
    }[];
    erc721TokenId: string;
    category: 'erc1155' | 'erc721';
    transactionHash: string;
    log: {
      address: string;
      topics: string[];
      data: string;
      blockNumber: string;
      transactionHash: string;
      transactionIndex: string;
      blockHash: string;
      logIndex: string;
      removed: boolean;
    };
  }[];
  network: string;
};

/**
 * Validates the webhook signature from Alchemy
 * @param body - Raw string body from the request
 * @param signature - The x-alchemy-signature header value
 * @param signingKey - The webhook signing key from Alchemy dashboard
 * @returns boolean indicating if the signature is valid
 */
function _isValidSignatureForStringBody(
  body: string, // must be raw string body, not json transformed version of the body
  signature: string, // your "x-alchemy-signature" from header
  signingKey: string, // taken from dashboard for specific webhook
): boolean {
  const hmac = crypto.createHmac('sha256', signingKey); // Create a HMAC SHA256 hash using the signing key
  hmac.update(body, 'utf8'); // Update the token hash with the request body using utf8
  const digest = hmac.digest('hex');
  return signature === digest;
}
