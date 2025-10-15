#!/usr/bin/env bun

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { i18n } from '../src/i18n-config';

const authorsRoot = path.join(process.cwd(), 'data', 'authors');
const defaultLocale = i18n.defaultLocale;
const targetLocales = i18n.locales.filter((locale) => locale !== defaultLocale);

function log(message: string) {
  console.log(message);
}

function syncAuthors() {
  log(`👥 Syncing author profiles to ${targetLocales.length} locale(s).`);

  const sourceDir = path.join(authorsRoot, defaultLocale);

  if (!existsSync(sourceDir)) {
    console.error(
      `❌ Source directory not found for default locale "${defaultLocale}": ${sourceDir}`,
    );
    process.exit(1);
  }

  const authorFiles = readdirSync(sourceDir).filter((file) =>
    file.endsWith('.mdx'),
  );

  if (authorFiles.length === 0) {
    log('ℹ️  No author files found to sync.');
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const file of authorFiles) {
    const sourcePath = path.join(sourceDir, file);
    const raw = readFileSync(sourcePath, 'utf8');
    log(`\n📄 Processing ${file}`);

    for (const locale of targetLocales) {
      const destinationDir = path.join(authorsRoot, locale);
      const destinationPath = path.join(destinationDir, file);

      if (!existsSync(destinationDir)) {
        mkdirSync(destinationDir, { recursive: true });
        log(`📁 Created directory: data/authors/${locale}`);
      }

      if (existsSync(destinationPath)) {
        log(`⏭️  ${locale}/${file} already exists. Skipping.`);
        skipped += 1;
        continue;
      }

      const parsed = matter(raw);
      parsed.data.language = locale;
      const output = `${matter.stringify(parsed.content.trim(), parsed.data)}\n`;
      writeFileSync(destinationPath, output, 'utf8');
      log(`✅ Synced ${locale}/${file}`);
      created += 1;
    }
  }

  log('\n📊 Summary');
  log(`   ✅ Created: ${created}`);
  log(`   ⏭️  Skipped: ${skipped}`);
  log(`   📚 Total authors (source): ${authorFiles.length}`);
  log(`   🌍 Locales: ${i18n.locales.join(', ')}`);

  if (created > 0) {
    log('\n💡 Next steps');
    log('   1. Translate each new profile.');
    log('   2. Update social links or occupations per locale if needed.');
    log('   3. Commit the generated files.');
  }
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
👥 Author Profile Synchronizer

Usage:
  bun scripts/sync-authors.ts

Copies MDX author profiles from the default locale directory
to every other configured locale and updates their language field.

Options:
  --help, -h    Show this help message
`);
  process.exit(0);
}

syncAuthors();
