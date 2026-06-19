import { describe, expect, it, vi } from 'vitest';

import { aiContract } from './ai-contract';

describe('aiContract.generatePoster', () => {
  it('requires a reference logo generation id', () => {
    expect(() =>
      aiContract.generatePoster.input.parse({
        domain: 'example.com',
        collateralType: 'let_ai_choose',
        model: 'gpt-image-2',
      }),
    ).toThrow();
  });

  it('rejects an empty reference logo generation id', () => {
    expect(() =>
      aiContract.generatePoster.input.parse({
        domain: 'example.com',
        referenceLogoGenerationId: '',
        collateralType: 'let_ai_choose',
        model: 'gpt-image-2',
      }),
    ).toThrow();
  });

  it('accepts poster inputs with a reference logo generation id', () => {
    expect(
      aiContract.generatePoster.input.parse({
        domain: 'example.com',
        referenceLogoGenerationId: 'logo-generation-id',
        collateralType: 'let_ai_choose',
        model: 'gpt-image-2',
      }),
    ).toEqual({
      domain: 'example.com',
      referenceLogoGenerationId: 'logo-generation-id',
      collateralType: 'let_ai_choose',
      model: 'gpt-image-2',
    });
  });
});

describe('aiContract.generateAnimation', () => {
  it('requires a non-empty reference logo generation id', () => {
    expect(() =>
      aiContract.generateAnimation.input.parse({
        mode: 'looped',
        domain: 'example.com',
        referenceLogoGenerationId: '',
        model: 'bytedance/seedance-2.0',
      }),
    ).toThrow();
  });
});

describe('aiContract.getGenerationById', () => {
  const now = new Date('2026-01-02T03:04:05.000Z');
  const fullGeneration = {
    createdAt: now,
    domain: 'example.com',
    errorMessage: null,
    featured: false,
    finishedAt: now,
    id: 'generation-1',
    input: {
      type: 'logo' as const,
      logoStyle: 'let-ai-choose',
      logoType: 'let-ai-choose',
    },
    isDeleted: false,
    metadata: { prompt: 'owner-only prompt' },
    output: {
      type: 'logo' as const,
      storagePath: 'logos/example.png',
    },
    referenceGenerationId: null,
    startedAt: now,
    status: 'SUCCEEDED' as const,
    tokenUsage: [],
    type: 'logo' as const,
    updatedAt: now,
    userId: 'user-1',
    url: 'https://cdn.test/logos/example.png',
    thumbnailUrl: 'https://cdn.test/logos/example.png',
    mimeType: 'image/png',
  };

  it('accepts full owner generation details', () => {
    expect(aiContract.getGenerationById.output.parse(fullGeneration)).toEqual(
      fullGeneration,
    );
  });

  it('accepts public generation details without private owner fields', () => {
    const {
      input: _input,
      isDeleted: _isDeleted,
      tokenUsage: _tokenUsage,
      userId: _userId,
      ...publicGeneration
    } = fullGeneration;
    const safePublicGeneration = {
      ...publicGeneration,
      metadata: {
        animationSheetUrl: 'https://cdn.test/animations/sheet.png',
        resolvedMotionPreset: 'light-sweep',
        sheetModel: 'gpt-image-2',
      },
    };

    expect(
      aiContract.getGenerationById.output.parse(safePublicGeneration),
    ).toEqual(safePublicGeneration);
  });

  it('flags public details that include private fields in soft output validation', () => {
    const {
      input: _input,
      isDeleted: _isDeleted,
      tokenUsage: _tokenUsage,
      userId: _userId,
      ...publicGeneration
    } = fullGeneration;
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    try {
      for (const leakedGeneration of [
        { ...publicGeneration, userId: fullGeneration.userId },
        { ...publicGeneration, input: fullGeneration.input },
        { ...publicGeneration, tokenUsage: fullGeneration.tokenUsage },
        { ...publicGeneration, metadata: fullGeneration.metadata },
      ]) {
        aiContract.getGenerationById.output.parse(leakedGeneration);
      }

      expect(consoleError).toHaveBeenCalledTimes(4);
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          '[trpc-contract] Output validation failed for "getGenerationById"',
        ),
        expect.any(Object),
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
