import { describe, expect, it } from 'vitest';
import { analyzeZodType } from './analyze-zod-schema';
import { z } from 'zod';

describe('ZodType Analysis', () => {
  const baseType = z.string();
  let testingType: any = baseType;
  it('base type', () => {
    const result = analyzeZodType(baseType);
    expect(result).toMatchObject({ type: 'string' });
    expect(result.innermostType).toBe(baseType);
  });
  testingType = baseType.nullable();
  it('nullable', () => {
    let result = analyzeZodType(testingType);
    expect(result).toMatchObject({ type: 'string', nullable: true });
    expect(result.innermostType).toBe(baseType);

    testingType = testingType.optional();

    result = analyzeZodType(testingType);
    expect(result).toMatchObject({
      type: 'string',
      nullable: true,
      optional: true,
    });
    expect(result.innermostType).toBe(baseType);

    testingType = testingType.nonoptional();

    result = analyzeZodType(testingType);
    expect(result).toMatchObject({
      type: 'string',
      nonoptional: true,
      nullable: true,
      optional: true,
    });
    expect(result.innermostType).toBe(baseType);
  });
});
