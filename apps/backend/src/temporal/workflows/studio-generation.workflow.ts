import { TEMPORAL_ENUMS } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export interface GenerateStudioAnimationWorkflowInput {
  generationId: string;
}

export interface GenerateStudioLogoWorkflowInput {
  generationId: string;
}

export interface GenerateStudioPosterWorkflowInput {
  generationId: string;
}

const STUDIO_GENERATION_ACTIVITY_OPTIONS = {
  startToCloseTimeout: '30 minutes',
  heartbeatTimeout: '30 seconds',
  retry: {
    maximumAttempts: 1,
  },
} as const;

export async function generateStudioLogoWorkflow({
  generationId,
}: GenerateStudioLogoWorkflowInput) {
  const { generateStudioLogo } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: STUDIO_GENERATION_ACTIVITY_OPTIONS,
  });

  return await generateStudioLogo({ generationId });
}

export async function generateStudioPosterWorkflow({
  generationId,
}: GenerateStudioPosterWorkflowInput) {
  const { generateStudioPoster } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: STUDIO_GENERATION_ACTIVITY_OPTIONS,
  });

  return await generateStudioPoster({ generationId });
}

export async function generateStudioAnimationWorkflow({
  generationId,
}: GenerateStudioAnimationWorkflowInput) {
  const { generateStudioAnimation } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: STUDIO_GENERATION_ACTIVITY_OPTIONS,
  });

  return await generateStudioAnimation({ generationId });
}

export const generateLogoAnimationWorkflow = generateStudioAnimationWorkflow;
