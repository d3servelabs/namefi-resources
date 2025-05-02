// #! /usr/bin/env -S bun
import { $ } from 'bun';

const { stdout, stderr, exitCode } =
  await $`ln -s ./node_modules/@infisical/cli/bin/infisical ./node_modules/.bin/infisical`
    .nothrow()
    .quiet();

if (exitCode !== 0) {
  if (stderr.includes('exists')) {
    console.log('Infisical already linked');
  } else {
    console.log('Failed to link infisical');
    console.log(stderr);
  }
} else {
  console.log('Linked infisical');
}
