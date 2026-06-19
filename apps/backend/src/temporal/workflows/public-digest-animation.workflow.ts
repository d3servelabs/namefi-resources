import { TEMPORAL_ENUMS } from '../shared/enums';
import {
  buildPublicDigestAnimationWorkflowResult,
  type PublicDigestAnimationWorkflowInput,
} from '../shared/public-digest-animation';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

const PUBLIC_DIGEST_ANIMATION_ACTIVITY_TIMEOUT = '15 minutes';

export async function generatePublicDigestAnimationWorkflow(
  input: PublicDigestAnimationWorkflowInput,
) {
  const { generatePublicDigestAnimation } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      // Digest callers enforce their own 10-minute cap at the parent workflow.
      scheduleToCloseTimeout: PUBLIC_DIGEST_ANIMATION_ACTIVITY_TIMEOUT,
      startToCloseTimeout: PUBLIC_DIGEST_ANIMATION_ACTIVITY_TIMEOUT,
      heartbeatTimeout: '30 seconds',
      retry: {
        maximumAttempts: 1,
      },
    },
  });

  const result = await generatePublicDigestAnimation(input);

  return buildPublicDigestAnimationWorkflowResult(input, result);
}
