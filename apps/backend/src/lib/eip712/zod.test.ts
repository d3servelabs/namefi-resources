import { describe, expect, it } from 'vitest';
import { analyzeZodType } from './analyze-zod-schema';
import { z } from 'zod';

describe('ZodType Analysis', () => {
  const baseType = z.string();
  let testingType: any = baseType;
  it('base type', () => {
    const result = analyzeZodType(baseType);
    expect(result).toEqual({ type: 'string' });
  });
  testingType = baseType.nullable();
  it('nullable', () => {
    let result = analyzeZodType(testingType);
    expect(result).toEqual({ type: 'string', nullable: true });

    testingType = testingType.optional();

    result = analyzeZodType(testingType);
    expect(result).toEqual({ type: 'string', nullable: true, optional: true });

    testingType = testingType.nonoptional();

    result = analyzeZodType(testingType);
    expect(result).toEqual({
      type: 'string',
      nonoptional: true,
      nullable: true,
      optional: true,
    });
  });
});
