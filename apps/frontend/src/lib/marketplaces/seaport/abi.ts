/**
 * Minimal Seaport v1.6 ABI fragments — only what we still need.
 *
 * The OpenSea SDK builds + signs + posts orders for us, so most of the Seaport surface
 * is unused. We keep:
 *   - `cancel(OrderComponents[])` — on-chain fallback when the SDK's off-chain cancel
 *     can't be applied (e.g. order isn't protected by the SignedZone, fulfillment
 *     signature was already vended, etc.).
 *   - ERC-2981 `royaltyInfo` — read on-chain when previewing fees on the create form.
 */
export const SeaportCancelAbi = [
  {
    type: 'function',
    name: 'cancel',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'orders',
        type: 'tuple[]',
        components: [
          { name: 'offerer', type: 'address' },
          { name: 'zone', type: 'address' },
          {
            name: 'offer',
            type: 'tuple[]',
            components: [
              { name: 'itemType', type: 'uint8' },
              { name: 'token', type: 'address' },
              { name: 'identifierOrCriteria', type: 'uint256' },
              { name: 'startAmount', type: 'uint256' },
              { name: 'endAmount', type: 'uint256' },
            ],
          },
          {
            name: 'consideration',
            type: 'tuple[]',
            components: [
              { name: 'itemType', type: 'uint8' },
              { name: 'token', type: 'address' },
              { name: 'identifierOrCriteria', type: 'uint256' },
              { name: 'startAmount', type: 'uint256' },
              { name: 'endAmount', type: 'uint256' },
              { name: 'recipient', type: 'address' },
            ],
          },
          { name: 'orderType', type: 'uint8' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'zoneHash', type: 'bytes32' },
          { name: 'salt', type: 'uint256' },
          { name: 'conduitKey', type: 'bytes32' },
          { name: 'counter', type: 'uint256' },
        ],
      },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * Minimal ERC-721 approval ABI — used to preview the one on-chain transaction a
 * Seaport listing requires: `setApprovalForAll(conduit, true)` so the protocol
 * can transfer the NFT when the (otherwise gasless) listing is filled.
 * `isApprovedForAll` lets the create form skip the fee preview when the conduit
 * is already approved.
 */
export const Erc721ApprovalAbi = [
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/** ERC-2981 royalty info — for on-chain royalty preview in `calculateListingFees`. */
export const Erc2981Abi = [
  {
    type: 'function',
    name: 'royaltyInfo',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'salePrice', type: 'uint256' },
    ],
    outputs: [
      { name: 'receiver', type: 'address' },
      { name: 'royaltyAmount', type: 'uint256' },
    ],
  },
] as const;
