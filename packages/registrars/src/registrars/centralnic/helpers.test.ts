import {
  EppTransportError,
  EppUnknownError,
  isEppTransportError,
  type EppEnvelopeXml,
  type Result,
  type SendResult,
} from '@namefi-astra/epp-client';
import { describe, expect, it } from 'vitest';
import { RegistrarErrorCodes } from '../../errors';
import { createRegistrarErrorFromEpp } from '../../errors';
import {
  generateAuthCode,
  generateOperationId,
  handleEppResult,
  parseOperationId,
} from './helpers';
import { OperationType, type PunycodeDomainName } from '#lib/data';

type EppResult = Result<SendResult<EppEnvelopeXml>, string | undefined>;

function failed(
  reason: 'transport' | 'protocol' | 'result',
  cause: unknown,
): EppResult {
  return {
    ok: false,
    error: { reason, message: 'EPP send/receive failed', cause },
  };
}

const parser = (): never => {
  throw new Error('parser should not run for failed results');
};

describe('handleEppResult', () => {
  it('rethrows a typed EppTransportError carried as the cause', () => {
    const cause = new EppTransportError('socket closed');
    expect(() => handleEppResult(failed('transport', cause), parser)).toThrow(
      cause,
    );
  });

  it('wraps a raw transport-reason failure as EppTransportError', () => {
    const cause = Object.assign(new Error('boom'), { code: 'ECONNRESET' });
    let thrown: unknown;
    try {
      handleEppResult(failed('transport', cause), parser);
    } catch (error) {
      thrown = error;
    }
    expect(isEppTransportError(thrown)).toBe(true);
  });

  it('throws EppUnknownError for non-transport failures without an EppError cause', () => {
    expect(() => handleEppResult(failed('result', undefined), parser)).toThrow(
      EppUnknownError,
    );
  });

  it('surfaces transport failures as RegistrarTransportError through the factory', () => {
    let thrown: unknown;
    try {
      handleEppResult(
        failed('transport', new EppTransportError('down')),
        parser,
      );
    } catch (error) {
      thrown = error;
    }
    const registrarError = createRegistrarErrorFromEpp({
      error: thrown,
      domainName: 'example.com',
      operation: 'searchForDomain',
    });
    expect(registrarError.code).toBe(RegistrarErrorCodes.TRANSPORT_ERROR);
  });

  it('returns the parsed value for successful results', () => {
    const ok: EppResult = {
      ok: true,
      data: { response: {} as EppEnvelopeXml, xml: '<xml/>' },
      raw: '<xml/>',
    };
    expect(handleEppResult(ok, () => 'parsed')).toBe('parsed');
  });
});

const UPPER_RE = /[A-Z]/;
const LOWER_RE = /[a-z]/;
const DIGIT_RE = /[0-9]/;
const SPECIAL_RE = /[!@#$%^&*]/;
const ALLOWED_AUTH_CODE_RE = /^[A-Za-z0-9!@#$%^&*]+$/;
const FOUR_DIGIT_NONCE_RE = /^[0-9]{4}$/;

describe('generateAuthCode (EPP authInfo / transfer secret)', () => {
  it('produces a 16-char code drawn only from the allowed pool', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateAuthCode();
      expect(code).toHaveLength(16);
      expect(ALLOWED_AUTH_CODE_RE.test(code)).toBe(true);
    }
  });

  it('always contains at least one of each required character class', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateAuthCode();
      expect(UPPER_RE.test(code)).toBe(true);
      expect(LOWER_RE.test(code)).toBe(true);
      expect(DIGIT_RE.test(code)).toBe(true);
      expect(SPECIAL_RE.test(code)).toBe(true);
    }
  });

  it('does not pin character classes to fixed positions (shuffled)', () => {
    // A fixed-position implementation would always place the special character
    // at the same index; the CSPRNG Fisher-Yates shuffle spreads it around.
    const specialPositions = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const idx = generateAuthCode().search(SPECIAL_RE);
      if (idx >= 0) specialPositions.add(idx);
    }
    expect(specialPositions.size).toBeGreaterThan(1);
  });

  it('produces unique codes across many calls (CSPRNG entropy)', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 200; i++) {
      codes.add(generateAuthCode());
    }
    expect(codes.size).toBe(200);
  });
});

describe('operation-id nonce (getNonce) via generateOperationId round-trip', () => {
  it('embeds a 4-digit numeric nonce that round-trips as a string', () => {
    for (let i = 0; i < 50; i++) {
      const id = generateOperationId(
        OperationType.REGISTER_DOMAIN,
        'example.com' as PunycodeDomainName,
      );
      const parsed = parseOperationId(id);
      expect(parsed.nonce).toMatch(FOUR_DIGIT_NONCE_RE);
    }
  });

  it('preserves leading-zero nonces at full width', () => {
    // ~10% of nonces start with '0'; across 500 samples we reliably hit one,
    // and each must keep its 4-character width (numeric parsing would drop it).
    let sawLeadingZero = false;
    for (let i = 0; i < 500; i++) {
      const parsed = parseOperationId(
        generateOperationId(
          OperationType.RENEW_DOMAIN,
          'example.com' as PunycodeDomainName,
        ),
      );
      expect(parsed.nonce).toHaveLength(4);
      if (parsed.nonce.startsWith('0')) {
        sawLeadingZero = true;
      }
    }
    expect(sawLeadingZero).toBe(true);
  });
});
