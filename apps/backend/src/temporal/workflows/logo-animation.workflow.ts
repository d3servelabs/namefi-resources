import { TEMPORAL_ENUMS } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export interface GenerateLogoAnimationWorkflowInput {
  generationId: string;
}

export async function generateLogoAnimationWorkflow({
  generationId,
}: GenerateLogoAnimationWorkflowInput) {
  const { generateLogoAnimation } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '2 hours',
      heartbeatTimeout: '30 seconds',
      retry: {
        maximumAttempts: 1,
      },
    },
  });

  return await generateLogoAnimation({ generationId });
}
