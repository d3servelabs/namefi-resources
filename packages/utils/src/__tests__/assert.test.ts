import { describe, expect, it } from 'vitest';
import { assert, assertExhaustive, assertNot, assertNotNil } from '../assert';

describe('assert', () => {
  it('should not throw when assertion is true', () => {
    expect(() => assert(true, 'Error message')).not.toThrow();
  });

  it('should throw when assertion is false', () => {
    expect(() => assert(false, 'Error message')).toThrow('Error message');
  });
});

describe('assertNot', () => {
  it('should not throw when assertion is false', () => {
    expect(() => assertNot(false, 'Error message')).not.toThrow();
  });

  it('should throw when assertion is true', () => {
    expect(() => assertNot(true, 'Error message')).toThrow('Error message');
  });
});

describe('assertNotNil', () => {
  it('should not throw when value is not null or undefined', () => {
    expect(() => assertNotNil('value', 'Error message')).not.toThrow();
    expect(() => assertNotNil(0, 'Error message')).not.toThrow();
    expect(() => assertNotNil(false, 'Error message')).not.toThrow();
    expect(() => assertNotNil({}, 'Error message')).not.toThrow();
  });

  it('should throw when value is null', () => {
    expect(() => assertNotNil(null, 'Error message')).toThrow('Error message');
  });

  it('should throw when value is undefined', () => {
    expect(() => assertNotNil(undefined, 'Error message')).toThrow(
      'Error message',
    );
  });
});

describe('assertExhaustive', () => {
  it('should throw with default message when called', () => {
    // Simulating a never type through type assertion
    const value = 'invalid' as never;
    expect(() => assertExhaustive(value)).toThrow(
      'Reached unexpected case in exhaustive switch',
    );
  });

  it('should throw with custom message when provided', () => {
    const value = 'invalid' as never;
    const customMessage = 'Custom error message';
    expect(() => assertExhaustive(value, customMessage)).toThrow(customMessage);
  });
});
