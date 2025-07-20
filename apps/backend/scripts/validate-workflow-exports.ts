import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

interface ValidationResult {
  success: boolean;
  missingExports: string[];
  totalWorkflows: number;
  totalExports: number;
}

function findWorkflowFiles(dir: string, relativePath = '') {
  const workflowFiles: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and other non-workflow directories
      if (item !== 'node_modules' && item !== '.git') {
        workflowFiles.push(
          ...findWorkflowFiles(
            fullPath,
            relativePath ? `${relativePath}/${item}` : item,
          ),
        );
      }
    } else if (item.endsWith('.workflow.ts')) {
      const workflowPath = relativePath ? `${relativePath}/${item}` : item;
      // Remove .ts extension for comparison with exports
      const exportPath = workflowPath.replace('.ts', '');
      workflowFiles.push(exportPath);
    }
  }
  return workflowFiles;
}

async function validateWorkflowExports(): Promise<ValidationResult> {
  const workflowsDir = join(
    import.meta.dirname || __dirname,
    '../src/temporal/workflows',
  );
  const indexPath = join(workflowsDir, 'index.ts');

  // Read the index.ts file to get current exports
  const indexContent = await readFile(indexPath, 'utf-8');
  const exportLines = indexContent
    .split('\n')
    .filter((line) => line.trim().startsWith("export * from './"))
    .map((line) => line.match(/export \* from '\.\/(.+)'/)?.[1])
    .filter(Boolean) as string[];

  // Find all workflow files recursively
  const workflowFiles = findWorkflowFiles(workflowsDir);

  // Find missing exports
  const missingExports = workflowFiles.filter((workflow) => {
    return !exportLines.includes(workflow);
  });

  const result: ValidationResult = {
    success: missingExports.length === 0,
    missingExports,
    totalWorkflows: workflowFiles.length,
    totalExports: exportLines.length,
  };

  return result;
}

async function main() {
  try {
    console.log('🔍 Validating workflow exports...\n');

    const result = await validateWorkflowExports();

    console.log(`📊 Found ${result.totalWorkflows} workflow files`);
    console.log(`📋 Found ${result.totalExports} exports in index.ts\n`);

    if (result.success) {
      console.log('✅ All workflow files are properly exported!');
      process.exit(0);
    } else {
      console.log('❌ Missing exports found:');
      for (const missing of result.missingExports) {
        console.log(`   - ${missing}.ts`);
      }

      console.log('\n💡 To fix, add these exports to index.ts:');
      for (const missing of result.missingExports) {
        console.log(`   export * from './${missing}';`);
      }

      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Error validating workflow exports:', error);
    process.exit(1);
  }
}

// Run main function if this script is executed directly
main().catch(console.error);

export { validateWorkflowExports, type ValidationResult };
