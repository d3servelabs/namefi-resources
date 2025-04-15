import { shortRunningOpts } from '../shared/commonRunningOptions';
import { TEMPORAL_ENUMS } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
export async function updateNamefiNftIndexWorkflow(): Promise<void> {
  // Get reference to activities
  const { updateNamefiNftIndex } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      ...shortRunningOpts,
    },
  });

  await updateNamefiNftIndex();
}
