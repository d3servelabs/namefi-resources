import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { bundleWorkflowCode } from '@temporalio/worker';

async function bundle() {
  const { code } = await bundleWorkflowCode({
    workflowsPath: require.resolve(
      path.join(import.meta.dirname || __dirname, '../src/temporal/workflows'),
    ),
  });
  const tsconfigPath = path.join(
    import.meta.dirname || __dirname,
    '../tsconfig.json',
  );
  const tsconfigData = await readFile(tsconfigPath, 'utf-8');
  const tsconfig = JSON.parse(tsconfigData);

  const outdir = path.join(
    import.meta.dirname || __dirname,
    `../${tsconfig.compilerOptions.outDir}`,
  );
  const codePath = path.join(outdir, 'workflow-bundle.js');

  if (!existsSync(outdir)) {
    await mkdir(outdir);
  }

  await writeFile(codePath, code);
  console.log(`Bundle written to ${codePath}`);
}

bundle().catch((err) => {
  console.error(err);
  process.exit(0);
});
