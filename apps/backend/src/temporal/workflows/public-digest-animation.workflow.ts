import { TEMPORAL_ENUMS } from '../shared/enums';
import {
  buildPublicDigestAnimationWorkflowResult,
  type PublicDigestAnimationWorkflowInput,
} from '../shared/public-digest-animation';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

export async function generatePublicDigestAnimationWorkflow(
  input: PublicDigestAnimationWorkflowInput,
) {
  const { generatePublicDigestAnimation } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '35 minutes',
      heartbeatTimeout: '30 seconds',
      retry: {
        maximumAttempts: 1,
      },
    },
  });

  const result = await generatePublicDigestAnimation(input);

  return buildPublicDigestAnimationWorkflowResult(input, result);
}
