import { describe, expect, it } from 'vitest';
import {
  parseJsonOrDefault,
  parseJsonOrNull,
  parseJsonOrUndefined,
  safeParseJson,
} from '../safe-parse-json';

describe('safeParseJson', () => {
  it('should parse valid JSON string', () => {
    const json = '{"key": "value"}';
    const result = safeParseJson(json);
    expect(result).toEqual({ key: 'value' });
  });

  it('should return default value for invalid JSON', () => {
    const invalidJson = '{invalid';
    const defaultValue = { default: true };
    const result = safeParseJson(invalidJson, defaultValue);
    expect(result).toBe(defaultValue);
  });

  it('should return default value for non-string input', () => {
    const result = safeParseJson(123, 'default');
    expect(result).toBe('default');
  });
});

describe('parseJsonOrDefault', () => {
  it('should parse valid JSON string', () => {
    const json = '{"key": "value"}';
    const result = parseJsonOrDefault(json, 'default');
    expect(result).toEqual({ key: 'value' });
  });

  it('should return default value for invalid JSON', () => {
    const invalidJson = '{invalid';
    const defaultValue = { default: true };
    const result = parseJsonOrDefault(invalidJson, defaultValue);
    expect(result).toBe(defaultValue);
  });

  it('should return default value for non-string input', () => {
    const result = parseJsonOrDefault(null, 'default');
    expect(result).toBe('default');
  });
});

describe('parseJsonOrUndefined', () => {
  it('should parse valid JSON string', () => {
    const json = '{"key": "value"}';
    const result = parseJsonOrUndefined(json);
    expect(result).toEqual({ key: 'value' });
  });

  it('should return undefined for invalid JSON', () => {
    const invalidJson = '{invalid';
    const result = parseJsonOrUndefined(invalidJson);
    expect(result).toBeUndefined();
  });
});

describe('parseJsonOrNull', () => {
  it('should parse valid JSON string', () => {
    const json = '{"key": "value"}';
    const result = parseJsonOrNull(json);
    expect(result).toEqual({ key: 'value' });
  });

  it('should return null for invalid JSON', () => {
    const invalidJson = '{invalid';
    const result = parseJsonOrNull(invalidJson);
    expect(result).toBeNull();
  });
});
