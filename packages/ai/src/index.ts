import type { z } from 'zod';
import {
  runLogoWorkflow as executeLogoWorkflow,
  type logoWorkflowInputSchema,
  type logoWorkflowOutputSchema,
} from './workflows/logo-workflow';
import {
  runMarketingWorkflow as executeMarketingWorkflow,
  type marketingWorkflowInputSchema,
  type marketingWorkflowOutputSchema,
} from './workflows/marketing-workflow';

export type LogoWorkflowInput = z.input<typeof logoWorkflowInputSchema>;
export type LogoWorkflowOutput = z.output<typeof logoWorkflowOutputSchema>;
export type MarketingWorkflowInput = z.input<
  typeof marketingWorkflowInputSchema
>;
export type MarketingWorkflowOutput = z.output<
  typeof marketingWorkflowOutputSchema
>;

export const runLogoWorkflow = executeLogoWorkflow;
export const runMarketingWorkflow = executeMarketingWorkflow;

export * from './types/generation';
export * from './types/logo-options';
