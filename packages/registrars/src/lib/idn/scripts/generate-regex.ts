import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import regenerate from 'regenerate';
import codePoints from '../generated/code-points.json' assert { type: 'json' };

/**
 * Generates a TypeScript regex constant from Unicode code points.
 * Reads code points from generated/code-points.json and creates
 * an IDN_REGEX export in generated/idn-regex.ts
 */
function generateRegex() {
  try {
    const pattern = regenerate(codePoints).toString();
    const source = `export const IDN_REGEX = /${pattern}/;\n`;
    const outputPath = path.join(
      import.meta.dirname,
      '../generated/idn-regex.ts',
    );

    fs.writeFileSync(outputPath, source);
    console.log('Successfully generated IDN regex file');
  } catch (error) {
    console.error('Failed to generate IDN regex:', error);
    process.exit(1);
  }
}

const __filename = fileURLToPath(import.meta.url);
const entrypoint = process.argv[1];

if (__filename === entrypoint) {
  generateRegex();
}
