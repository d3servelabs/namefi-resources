import { shortRunningOpts } from '../shared/commonRunningOptions';
import { TEMPORAL_ENUMS } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';

/**
 * Workflow to update the namefi nft index
 *
 * 1. Update the namefi nft index
 * 2. Add categories to domains with no categories
 *
 * @returns
 */
export async function updateNamefiNftIndexWorkflow(): Promise<void> {
  // Get reference to activities
  const { updateNamefiNftIndex, addCategoriesToDomainsWithNoCategories } =
    typedProxyActivities({
      temporalEnum: TEMPORAL_ENUMS.DEFAULT,
      options: {
        ...shortRunningOpts,
        retry: {
          initialInterval: '5 seconds',
          maximumAttempts: 3,
          maximumInterval: '10 seconds',
        },
      },
    });

  await updateNamefiNftIndex();
  await addCategoriesToDomainsWithNoCategories();
}
