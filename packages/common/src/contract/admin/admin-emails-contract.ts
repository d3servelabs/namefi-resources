import { z } from 'zod';

import { createContract } from '../create-contract';
import type { RouterContract } from '../trpc-contract';

// Listmonk's template-create response carries a numeric `data.id`.
// We surface it as `templateId` for the admin UI; widening to a string
// guards against future Listmonk versions that switch to opaque IDs.
const createListmonkTemplateOutputSchema = z.object({
  success: z.boolean(),
  templateId: z.union([z.string(), z.number()]).nullable().optional(),
  message: z.string(),
});

const previewEmailTemplateOutputSchema = z.object({
  success: z.literal(true),
  htmlContent: z.string(),
});

export const adminEmailsContract = createContract(
  { softOutput: true },
  {
    createListmonkTemplate: {
      type: 'mutation',
      input: z.object({
        name: z.string().min(1),
        title: z.string(),
        content: z.string(),
        useContainer: z.boolean().default(true),
        useHeader: z.boolean().default(true),
        useFooter: z.boolean().default(true),
        showGoToDashboard: z.boolean().default(true),
      }),
      output: createListmonkTemplateOutputSchema,
    },
    previewEmailTemplate: {
      type: 'query',
      input: z.object({
        title: z.string(),
        content: z.string(),
        useContainer: z.boolean().default(true),
        useHeader: z.boolean().default(true),
        useFooter: z.boolean().default(true),
        showGoToDashboard: z.boolean().default(true),
      }),
      output: previewEmailTemplateOutputSchema,
    },
  },
);

export type AdminEmailsContract = typeof adminEmailsContract;
