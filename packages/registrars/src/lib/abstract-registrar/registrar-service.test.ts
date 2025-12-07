import { describe, expect, it } from 'vitest';
import {
  createRegistrarErrorFromDynadot,
  RegistrarErrorCodes,
  RegistrarTransportError,
  RegistrarUnknownError,
  type RegistrarError,
} from '../../errors';
import { AbstractRegistrarService } from './registrar-service';

// The abstract base declares ~30 abstract methods we don't need here; cast to a
// minimal constructable surface that exposes the error-handling hooks so the
// test can focus on the withErrorHandling()/toRegistrarError() wiring added in
// the shared base class.
const BaseRegistrar = AbstractRegistrarService as unknown as {
  new (
    key: string,
  ): {
    readonly key: string;
    withErrorHandling<T>(
      operation: string,
      domainName: string | undefined,
      fn: () => Promise<T>,
    ): Promise<T>;
    toRegistrarError(
      error: Error,
      operation: string,
      domainName: string | undefined,
    ): RegistrarError;
  };
};

/** Uses the base default toRegistrarError (what the aggregator relies on). */
class DefaultRegistrar extends BaseRegistrar {}

/** Overrides toRegistrarError like a real leaf registrar. */
class DynadotLikeRegistrar extends BaseRegistrar {
  override toRegistrarError(
    error: Error,
    operation: string,
    domainName: string | undefined,
  ): RegistrarError {
    return createRegistrarErrorFromDynadot({
      error,
      domainName,
      operation,
      registrarKey: this.key,
    });
  }
}

describe('AbstractRegistrarService error handling', () => {
  it('returns the value when the operation succeeds', async () => {
    const reg = new DefaultRegistrar('main');
    await expect(
      reg.withErrorHandling('op', 'example.com', async () => 42),
    ).resolves.toBe(42);
  });

  it('wraps native errors via the default toRegistrarError', async () => {
    const reg = new DefaultRegistrar('main');
    const error = await reg
      .withErrorHandling('renewDomain', 'example.com', async () => {
        throw new Error('weird failure');
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RegistrarUnknownError);
    expect((error as RegistrarError).domainName).toBe('example.com');
    expect((error as RegistrarError).operation).toBe('renewDomain');
  });

  it('dispatches to a subclass toRegistrarError override', async () => {
    const reg = new DynadotLikeRegistrar('dynadot');
    const error = await reg
      .withErrorHandling('renewDomain', 'example.com', async () => {
        throw Object.assign(new Error('connect failed'), {
          code: 'ECONNREFUSED',
        });
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RegistrarTransportError);
    expect((error as RegistrarError).code).toBe(
      RegistrarErrorCodes.TRANSPORT_ERROR,
    );
  });

  it('passes an already-converted RegistrarError through unchanged', async () => {
    const reg = new DynadotLikeRegistrar('dynadot');
    const original = new RegistrarTransportError('already converted', {
      registrarKey: 'dynadot',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    });
    const error = await reg
      .withErrorHandling('op', undefined, async () => {
        throw original;
      })
      .catch((e: unknown) => e);

    expect(error).toBe(original);
  });
});
