import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const skillRoot = resolve(__dirname, '../..');
export const repoRoot = resolve(skillRoot, '../../..');
export const backendRoutersRoot = resolve(
  repoRoot,
  'apps/backend/src/trpc/routers',
);
export const generatedDir = resolve(skillRoot, 'references/generated');
export const manifestPath = resolve(skillRoot, 'openapi.docs.json');
export const contractPath = resolve(
  repoRoot,
  'packages/namefi-client/contract.json',
);

export function snapshotPath(env: string): string {
  return resolve(generatedDir, `${env}.openapi.json`);
}

export function indexPath(env: string): string {
  return resolve(generatedDir, `${env}.index.json`);
}
