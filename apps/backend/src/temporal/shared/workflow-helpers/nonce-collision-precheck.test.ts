import type { Hash } from 'viem';
import { describe, expect, it } from 'vitest';
import type { NonceAlreadySentResult } from '../../activities/default/nonce-collision.activities';
import { decideNonceCollision } from './nonce-collision-precheck';

const TXH = '0xabc' as Hash;

const matched = (
  receiptStatus: 'success' | 'reverted' | null,
): NonceAlreadySentResult => ({
  status: 'matched',
  txHash: TXH,
  receiptStatus,
  blockNumber: receiptStatus ? '100' : null,
});

describe('decideNonceCollision', () => {
  it('re-pins on `unused` for both policies (our calldata is not at the nonce)', () => {
    expect(decideNonceCollision({ status: 'unused' }, 'PROCEED')).toEqual({
      kind: 'REPIN',
    });
    expect(
      decideNonceCollision({ status: 'unused' }, 'WAIT_FOR_ADMIN'),
    ).toEqual({ kind: 'REPIN' });
  });

  it('re-pins on `conflict` for both policies (a foreign tx took the nonce)', () => {
    const conflict: NonceAlreadySentResult = {
      status: 'conflict',
      txHash: TXH,
      to: null,
      onChainData: '0xdead',
    };
    expect(decideNonceCollision(conflict, 'PROCEED')).toEqual({
      kind: 'REPIN',
    });
    expect(decideNonceCollision(conflict, 'WAIT_FOR_ADMIN')).toEqual({
      kind: 'REPIN',
    });
  });

  it('PROCEEDs with the landed tx on a successful match (idempotent op)', () => {
    expect(decideNonceCollision(matched('success'), 'PROCEED')).toEqual({
      kind: 'PROCEED',
      winner: TXH,
    });
  });

  it('treats an unconfirmable matched receipt as still do-not-resend', () => {
    expect(decideNonceCollision(matched(null), 'PROCEED')).toEqual({
      kind: 'PROCEED',
      winner: TXH,
    });
  });

  it('waits for admin on a successful match (non-idempotent op)', () => {
    expect(decideNonceCollision(matched('success'), 'WAIT_FOR_ADMIN')).toEqual({
      kind: 'WAIT_FOR_ADMIN',
      winner: TXH,
    });
  });

  it('is terminal (REVERTED) when our matched tx reverted, regardless of policy', () => {
    expect(decideNonceCollision(matched('reverted'), 'PROCEED')).toEqual({
      kind: 'REVERTED',
      txHash: TXH,
    });
    expect(decideNonceCollision(matched('reverted'), 'WAIT_FOR_ADMIN')).toEqual(
      {
        kind: 'REVERTED',
        txHash: TXH,
      },
    );
  });

  it('re-pins on consumed_unidentified for idempotent ops (a re-send is safe)', () => {
    expect(
      decideNonceCollision(
        { status: 'consumed_unidentified', nonce: 7, onChainNonce: 8 },
        'PROCEED',
      ),
    ).toEqual({ kind: 'REPIN' });
  });

  it('escalates on consumed_unidentified for non-idempotent ops', () => {
    expect(
      decideNonceCollision(
        { status: 'consumed_unidentified', nonce: 7, onChainNonce: 8 },
        'WAIT_FOR_ADMIN',
      ),
    ).toEqual({ kind: 'ESCALATE', onChainNonce: 8 });
  });
});
