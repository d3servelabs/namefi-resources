import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';
import { load } from 'cheerio';
import jsesc from 'jsesc';
import { LANGUAGE_CODES, type LanguageCode } from '../language-codes';

const getUrl = (languageCode: LanguageCode) =>
  `https://www.verisign.com/assets/languagefiles/${languageCode}.html`;

const writeJson = async (fileName: string, data: unknown): Promise<void> => {
  const contents = jsesc(data, {
    json: true,
    compact: false,
  });
  await writeFile(fileName, `${contents}\n`);
  console.log(`${fileName} created successfully.`);
};

// Modified version of `ucs2encode`; see https://mths.be/punycode
const codePointToSymbol = (codePoint: number): string => {
  let output = '';
  if (codePoint > 0xffff) {
    const adjustedCodePoint = codePoint - 0x10000;
    output += String.fromCharCode(
      ((adjustedCodePoint >>> 10) & 0x3ff) | 0xd800,
    );
    const remainingCodePoint = 0xdc00 | (adjustedCodePoint & 0x3ff);
    output += String.fromCharCode(remainingCodePoint);
  } else {
    output += String.fromCharCode(codePoint);
  }
  return output;
};

const scrapeCodePoints = async (languageCode: LanguageCode): Promise<void> => {
  try {
    const response = await axios.get(getUrl(languageCode));
    const $ = load(response.data);

    const codePoints: number[] = [];
    const symbols: string[] = [];

    $('a[href^=" http://www.unicode.org/"]').each((_, element) => {
      const hex = $(element).text().trim().replace(/^U\+/, '');
      const codePoint = Number.parseInt(hex, 16);
      codePoints.push(codePoint);
      symbols.push(codePointToSymbol(codePoint));
    });

    await mkdir(
      path.join(import.meta.dirname, `../generated/${languageCode}`),
      { recursive: true },
    );

    await writeJson(
      path.join(
        import.meta.dirname,
        `../generated/${languageCode}/code-points.json`,
      ),
      codePoints,
    );
    await writeJson(
      path.join(
        import.meta.dirname,
        `../generated/${languageCode}/symbols.json`,
      ),
      symbols,
    );

    console.log('Scraping completed successfully.');
  } catch (error) {
    console.error('Error scraping code points:', error);
    process.exit(1);
  }
};

const __filename = fileURLToPath(import.meta.url);
const entrypoint = process.argv[1];

if (__filename === entrypoint) {
  for (const languageCode of Object.values(LANGUAGE_CODES)) {
    await scrapeCodePoints(languageCode);
  }
}
