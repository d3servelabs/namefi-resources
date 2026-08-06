import { describe, expect, test } from 'bun:test';
import { collectBodyFaqs, matchQuestion, stripInline } from './check-tld-faq-sync';

describe('stripInline', () => {
  test('strips code spans, bold, and links down to rendered text', () => {
    expect(stripInline('Yes, `yourname.al` is **open** — see [the guide](/en/tld/al/).')).toBe(
      'Yes, yourname.al is open — see the guide.',
    );
  });
});

describe('collectBodyFaqs', () => {
  const fmQuestions = ['Can anyone register a .test domain?', 'Does .test affect SEO?'];

  test('scopes to the FAQ section when an earlier ### repeats a question verbatim', () => {
    // Regression for the Bugbot finding on PR #289: a flat scan of every ###
    // returns the EARLIER non-FAQ block via find-first, so the checker would
    // compare against the wrong text (false mismatch — or false pass if the
    // real FAQ section drifted while the shadow block matches).
    const body = [
      '## Things to watch out for',
      '',
      '### Can anyone register a .test domain?',
      '',
      'This earlier topic block discusses eligibility history, not the FAQ answer.',
      '',
      '## Frequently asked questions',
      '',
      '### Can anyone register a .test domain?',
      '',
      'Yes. Open to everyone worldwide.',
      '',
      '### Does .test affect SEO?',
      '',
      'No.',
      '',
      '## Related resources',
      '',
      '- [guide](/en/tld/test/)',
    ].join('\n');

    const qas = collectBodyFaqs(body, fmQuestions);
    expect(qas).toEqual([
      { question: 'Can anyone register a .test domain?', answer: 'Yes. Open to everyone worldwide.' },
      { question: 'Does .test affect SEO?', answer: 'No.' },
    ]);
  });

  test('matches the FAQ section across whitespace drift in question text', () => {
    const body = [
      '## よくある質問',
      '',
      '### 誰でも .test ドメインを登録できますか？',
      '',
      'はい。',
    ].join('\n');
    const qas = collectBodyFaqs(body, ['誰でも.testドメインを登録できますか？']);
    expect(qas).toEqual([{ question: '誰でも .test ドメインを登録できますか？', answer: 'はい。' }]);
  });

  test('falls back to a flat scan when no section matches any frontmatter question', () => {
    const body = ['## Some section', '', '### Unrelated heading', '', 'Text.'].join('\n');
    expect(collectBodyFaqs(body, fmQuestions)).toEqual([
      { question: 'Unrelated heading', answer: 'Text.' },
    ]);
  });
});

describe('matchQuestion', () => {
  const qas = [{ question: '誰でも .test ドメインを登録できますか？', answer: 'はい。' }];

  test('exact match is not flagged as whitespace-only', () => {
    expect(matchQuestion(qas, '誰でも .test ドメインを登録できますか？')).toEqual({
      hit: qas[0],
      whitespaceOnly: false,
    });
  });

  test('whitespace-only drift still pairs, flagged so the gate reports it as drift', () => {
    expect(matchQuestion(qas, '誰でも.testドメインを登録できますか？')).toEqual({
      hit: qas[0],
      whitespaceOnly: true,
    });
  });

  test('genuinely missing question returns no hit', () => {
    expect(matchQuestion(qas, 'Completely different?')).toEqual({ hit: undefined, whitespaceOnly: false });
  });
});
