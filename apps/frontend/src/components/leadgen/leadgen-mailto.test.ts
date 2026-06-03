import { describe, expect, it } from 'vitest';

import { buildMailtoHref } from './leadgen-mailto';

describe('buildMailtoHref', () => {
  it('percent-encodes mailto fields without form plus-space encoding', () => {
    const href = buildMailtoHref({
      to: 'buyer@example.com',
      subject: 'Acquiring weighttrainers.com',
      body: [
        'Hi there,',
        '',
        'Would you be open to a quick call?',
        '',
        'Best,',
      ].join('\n'),
    });

    expect(href).toBe(
      'mailto:buyer@example.com?subject=Acquiring%20weighttrainers.com&body=Hi%20there%2C%0A%0AWould%20you%20be%20open%20to%20a%20quick%20call%3F%0A%0ABest%2C',
    );
    expect(href).not.toContain('+');
  });
});
