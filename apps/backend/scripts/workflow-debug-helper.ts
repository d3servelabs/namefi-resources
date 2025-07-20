import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

interface WorkflowInfo {
  name: string;
  path: string;
  size: number;
}

async function analyzeWorkflows(): Promise<void> {
  const workflowsDir = join(
    import.meta.dirname || __dirname,
    '../src/temporal/workflows',
  );
  const workflows: WorkflowInfo[] = [];

  function findWorkflowFiles(dir: string, relativePath = '') {
    const items = readdirSync(dir);

    for (const item of items) {
      if (item === 'index.ts' || item.startsWith('.')) continue;

      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        findWorkflowFiles(
          fullPath,
          relativePath ? `${relativePath}/${item}` : item,
        );
      } else if (item.endsWith('.workflow.ts')) {
        const workflowPath = relativePath ? `${relativePath}/${item}` : item;
        workflows.push({
          name: workflowPath,
          path: fullPath,
          size: stat.size,
        });
      }
    }
  }

  findWorkflowFiles(workflowsDir);

  console.log('📊 Workflow Analysis');
  console.log('==================');
  console.log(`Found ${workflows.length} workflow files:\n`);

  // Sort by size (largest first)
  workflows.sort((a, b) => b.size - a.size);

  for (const workflow of workflows) {
    const sizeKb = (workflow.size / 1024).toFixed(1);
    console.log(`📄 ${workflow.name.padEnd(40)} ${sizeKb.padStart(6)} KB`);
  }

  console.log('\n🔍 Debugging Tips:');
  console.log('- Check largest files first for potential bundling issues');
  console.log(
    '- Look for unusual imports (Node.js modules, external libraries)',
  );
  console.log('- Verify workflow functions are properly exported');
  console.log('- Check for circular dependencies between workflows');

  console.log('\n💡 Manual Testing:');
  console.log('To test a specific workflow bundling:');
  console.log('1. Temporarily comment out all exports in index.ts except one');
  console.log('2. Run: bun run bundle:workflows');
  console.log('3. Uncomment and test the next workflow');
}

// Run main function if this script is executed directly
analyzeWorkflows().catch(console.error);

export { analyzeWorkflows };
