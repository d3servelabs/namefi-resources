import { describe, expect, it, vi } from 'vitest';
import {
  PrimitiveValueError,
  isAsyncFailure,
  isAsyncSuccessful,
  resolve,
  resolveOrDefault,
  resolveOrFallback,
} from '../promises/resolve';

describe('resolve', () => {
  it('should resolve successful promises with [null, result]', async () => {
    const result = await resolve(Promise.resolve('success'));

    expect(result[0]).toBeNull();
    expect(result[1]).toBe('success');
    expect(result.success).toBe(true);
    expect(result.failed).toBe(false);
    expect(result.result).toBe('success');
    expect(result.error).toBeNull();
  });

  it('should resolve failed promises with [error, null]', async () => {
    const error = new Error('failure');
    const result = await resolve(Promise.reject(error));

    expect(result[0]).toBe(error);
    expect(result[1]).toBeNull();
    expect(result.success).toBe(false);
    expect(result.failed).toBe(true);
    expect(result.result).toBeNull();
    expect(result.error).toBe(error);
  });

  it('should handle primitive error values', async () => {
    const result = await resolve(Promise.reject('primitive error'));

    expect(result[0]).toBeInstanceOf(PrimitiveValueError);
    expect(result.success).toBe(false);
    expect(result.failed).toBe(true);
    expect((result.error as PrimitiveValueError).value).toBe('primitive error');
  });

  it('should wrap other primitive types in PrimitiveValueError', async () => {
    const numberResult = await resolve(Promise.reject(123));
    expect(numberResult[0]).toBeInstanceOf(PrimitiveValueError);
    expect((numberResult.error as PrimitiveValueError).value).toBe(123);

    const boolResult = await resolve(Promise.reject(true));
    expect(boolResult[0]).toBeInstanceOf(PrimitiveValueError);
    expect((boolResult.error as PrimitiveValueError).value).toBe(true);
  });
});

describe('isAsyncSuccessful', () => {
  it('should return true for successful results', async () => {
    const result = await resolve(Promise.resolve('success'));
    expect(isAsyncSuccessful(result)).toBe(true);
  });

  it('should return false for failed results', async () => {
    const result = await resolve(Promise.reject(new Error()));
    expect(isAsyncSuccessful(result)).toBe(false);
  });
});

describe('isAsyncFailure', () => {
  it('should return false for successful results', async () => {
    const result = await resolve(Promise.resolve('success'));
    expect(isAsyncFailure(result)).toBe(false);
  });

  it('should return true for failed results', async () => {
    const result = await resolve(Promise.reject(new Error()));
    expect(isAsyncFailure(result)).toBe(true);
  });
});

describe('resolveOrFallback', () => {
  it('should return the result when promise resolves', async () => {
    const result = await resolveOrFallback(
      Promise.resolve('success'),
      'fallback',
    );
    expect(result).toBe('success');
  });

  it('should return the fallback when promise rejects', async () => {
    const result = await resolveOrFallback(
      Promise.reject(new Error()),
      'fallback',
    );
    expect(result).toBe('fallback');
  });

  it('should log errors when enableErrorLog is true', async () => {
    const mockLogger = { error: vi.fn(), log: vi.fn() };
    const error = new Error('test error');

    const result = await resolveOrFallback(Promise.reject(error), 'fallback', {
      enableErrorLog: true,
      logger: mockLogger,
    });

    expect(result).toBe('fallback');
    expect(mockLogger.error).toHaveBeenCalledWith(error);
  });
});

describe('resolveOrDefault', () => {
  it('should return the result when promise resolves', async () => {
    const result = await resolveOrDefault(
      Promise.resolve('success'),
      'default',
    );
    expect(result).toBe('success');
  });

  it('should return the default when promise rejects', async () => {
    const result = await resolveOrDefault(
      Promise.reject(new Error()),
      'default',
    );
    expect(result).toBe('default');
  });

  it('should log errors when enableErrorLog is true', async () => {
    const mockLogger = { error: vi.fn(), log: vi.fn() };
    const error = new Error('test error');

    const result = await resolveOrDefault(Promise.reject(error), 'default', {
      enableErrorLog: true,
      logger: mockLogger,
    });

    expect(result).toBe('default');
    expect(mockLogger.error).toHaveBeenCalledWith(error);
  });
});
