import fs from 'node:fs';
import { minifyContractRouter } from '@orpc/contract';
import { orpcRouter } from '@namefi-astra/backend/openapi';

const minifiedRouter = minifyContractRouter(orpcRouter);

fs.writeFileSync('./contract.json', JSON.stringify(minifiedRouter));
