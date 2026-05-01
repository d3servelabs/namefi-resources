import { writeFile } from 'node:fs/promises';
import path, { dirname } from 'node:path';
import axios from 'axios';
import { load } from 'cheerio';
import jsesc from 'jsesc';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const URL =
  'https://www.verisign.com/assets/allowedcode/idn-allowed-code-points.html';

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

const scrapeCodePoints = async (): Promise<void> => {
  try {
    const response = await axios.get(URL);
    const $ = load(response.data);

    const codePoints: number[] = [];
    const symbols: string[] = [];

    $('a[href^=" http://www.unicode.org/"]').each((_, element) => {
      const hex = $(element).text().trim().replace(/^U\+/, '');
      const codePoint = Number.parseInt(hex, 16);
      codePoints.push(codePoint);
      symbols.push(codePointToSymbol(codePoint));
    });

    await writeJson(
      path.join(__dirname, '../generated/code-points.json'),
      codePoints,
    );
    await writeJson(path.join(__dirname, '../generated/symbols.json'), symbols);

    console.log('Scraping completed successfully.');
  } catch (error) {
    console.error('Error scraping code points:', error);
    process.exit(1);
  }
};

// Execute the script
scrapeCodePoints();
