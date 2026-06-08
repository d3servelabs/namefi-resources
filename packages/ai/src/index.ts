/** biome-ignore-all lint/performance/noBarrelFile lint/performance/noReExportAll: package public API */
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
import {
  runLogoAnimationWorkflow as executeLogoAnimationWorkflow,
  type logoAnimationWorkflowInputSchema,
  type logoAnimationWorkflowOutputSchema,
} from './workflows/logo-animation-workflow';
import {
  runDigestAnimationWorkflow as executeDigestAnimationWorkflow,
  type digestAnimationWorkflowOutputSchema,
} from './workflows/digest-animation-workflow';

export type LogoWorkflowInput = z.input<typeof logoWorkflowInputSchema>;
export type LogoWorkflowOutput = z.output<typeof logoWorkflowOutputSchema>;
export type MarketingWorkflowInput = z.input<
  typeof marketingWorkflowInputSchema
>;
export type MarketingWorkflowOutput = z.output<
  typeof marketingWorkflowOutputSchema
>;
export type LogoAnimationWorkflowInput = z.input<
  typeof logoAnimationWorkflowInputSchema
>;
export type LogoAnimationWorkflowOutput = z.output<
  typeof logoAnimationWorkflowOutputSchema
>;
export type DigestAnimationWorkflowOutput = z.output<
  typeof digestAnimationWorkflowOutputSchema
>;

export const runLogoWorkflow = executeLogoWorkflow;
export const runMarketingWorkflow = executeMarketingWorkflow;
export const runLogoAnimationWorkflow = executeLogoAnimationWorkflow;
export const runDigestAnimationWorkflow = executeDigestAnimationWorkflow;

export * from './agents/dream-domain-suggestions';
export * from './leadgen/agents';
export * from './leadgen/domain';
export * from './leadgen/types';
export * from './namefi-feed/domain-sale-classifier';
export * from './namefi-feed/sales-digest';
export * from './types/generation';
export * from './types/logo-options';
export * from './workflows/digest-animation-workflow';
