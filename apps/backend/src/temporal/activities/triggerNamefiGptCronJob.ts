import axios from 'axios';
import { config } from '../../lib/env';

export async function triggerNamefiGptCronJob() {
  if (!config.GITHUB_WORKFLOWS_TOKEN) {
    throw new Error('GITHUB_WORKFLOWS_TOKEN is not set');
  }
  await axios.post(
    'https://api.github.com/repos/d3servelabs/namefi-gpt/actions/workflows/86835114/dispatches',
    {
      ref: 'namefi',
      inputs: {},
    },
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${config.GITHUB_WORKFLOWS_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
}
