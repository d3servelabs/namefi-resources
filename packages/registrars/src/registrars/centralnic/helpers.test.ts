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
import { handleEppResult } from './helpers';

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
