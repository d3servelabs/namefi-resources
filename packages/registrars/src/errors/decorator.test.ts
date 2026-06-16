import { describe, expect, it } from 'vitest';
import { RegistrarUnknownError } from './base';
import { withRegistrarError } from './decorator';

// Minimal host implementing the structural contract the decorator relies on.
class FakeRegistrar {
  calls: Array<{ operation: string; domainName: string | undefined }> = [];

  async withErrorHandling<T>(
    operation: string,
    domainName: string | undefined,
    fn: () => Promise<T>,
  ): Promise<T> {
    this.calls.push({ operation, domainName });
    try {
      return await fn();
    } catch (error) {
      throw new RegistrarUnknownError(`wrapped: ${operation}`, {
        registrarKey: 'centralnic',
        domainName,
        operation,
        originalError: error,
        timestamp: new Date('2026-01-01T00:00:00.000Z'),
      });
    }
  }

  @withRegistrarError()
  async succeeds(domainName: string): Promise<string> {
    return `ok:${domainName}`;
  }

  @withRegistrarError()
  async fails(domainName: string): Promise<never> {
    throw new Error(`boom for ${domainName}`);
  }

  @withRegistrarError({ operation: 'customOp' })
  async withCustomOperation(_arg: { id: number }): Promise<number> {
    throw new Error('nope');
  }
}

describe('@withRegistrarError', () => {
  it('passes successful results through unchanged (signature preserved)', async () => {
    const reg = new FakeRegistrar();
    const result = await reg.succeeds('example.com');
    expect(result).toBe('ok:example.com');
    expect(reg.calls).toEqual([
      { operation: 'succeeds', domainName: 'example.com' },
    ]);
  });

  it('routes thrown errors through withErrorHandling with method name + domain', async () => {
    const reg = new FakeRegistrar();
    const error = await reg.fails('example.com').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RegistrarUnknownError);
    expect((error as RegistrarUnknownError).operation).toBe('fails');
    expect((error as RegistrarUnknownError).domainName).toBe('example.com');
    expect((error as RegistrarUnknownError).originalError).toBeInstanceOf(
      Error,
    );
  });

  it('honors a custom operation name and tolerates non-domain args', async () => {
    const reg = new FakeRegistrar();
    const error = await reg
      .withCustomOperation({ id: 7 })
      .catch((e: unknown) => e);

    expect(reg.calls[0]).toEqual({
      operation: 'customOp',
      domainName: undefined,
    });
    expect((error as RegistrarUnknownError).operation).toBe('customOp');
  });

  it('supports the current method-decorator runtime shape', async () => {
    const reg = new FakeRegistrar();
    const original = async function (
      this: FakeRegistrar,
      domainName: string,
    ): Promise<string> {
      return `ok:${domainName}`;
    };

    const wrapped = withRegistrarError()(original, {
      kind: 'method',
      name: 'stage3Succeeds',
    });

    const result = await wrapped.call(reg, 'example.com');

    expect(result).toBe('ok:example.com');
    expect(reg.calls).toEqual([
      { operation: 'stage3Succeeds', domainName: 'example.com' },
    ]);
  });
});
