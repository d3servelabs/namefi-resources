import {
  MigrationActivities,
  NotifyActivities,
  InAppNotificationActivities,
  OrderActivities,
  PaymentActivities,
  HuntActivities,
  FreeClaimActivities,
  FreeClaimsCorrectionActivities,
  PbnIssuanceReservationsActivities,
  LinkSharesExternalIdentifierMigrationActivities,
  TwitterLinkSharesValidationActivities,
  GreetActivities,
  InternalLogoGenerationActivities,
  StudioGenerationActivities,
  PublicDigestAnimationActivities,
  LeadgenActivities,
  NamefiFeedActivities,
  NamefiFeedDigestActivities,
  NamefiFeedLogoActivities,
} from '../activities';
import { DomainsActivities } from '../activities/domain';
import { TEMPORAL_ENUMS } from '../shared';
import { IndexersActivities } from '../activities/indexers';
import { defaultTaskQueueActivities } from '../activities/default';
import { mintTaskQueueActivities } from '../activities/mint';
import { workflowMarkerActivities } from '../activities/shared/workflow-marker.activities';

// Detect silent activity-name collisions in the merged NOTIFY namespace
// at module load. Spreading two activity bundles into one queue can
// otherwise overwrite handlers without any startup signal.
const duplicateNotifyActivityKeys = Object.keys(
  InAppNotificationActivities,
).filter((key) => key in NotifyActivities);
if (duplicateNotifyActivityKeys.length > 0) {
  throw new Error(
    `Duplicate NOTIFY activity keys detected: ${duplicateNotifyActivityKeys.join(', ')}`,
  );
}

// `workflowMarkerActivities` (the `marker` stage-finish marker) is a
// LOCAL activity: workflows proxy it via `proxyLocalActivities`, so it executes on
// whichever worker runs the calling workflow. It must therefore be registered on
// EVERY task queue (e.g. `staggeredSendRace` runs inline in workflows scheduled on
// MINT and DEFAULT). Spread last; `marker` is a unique key.
export const ACTIVITIES = {
  [TEMPORAL_ENUMS.DEFAULT]: {
    ...defaultTaskQueueActivities,
    ...GreetActivities,
    ...MigrationActivities,
    ...LinkSharesExternalIdentifierMigrationActivities,
    ...TwitterLinkSharesValidationActivities,
    ...OrderActivities,
    ...PaymentActivities,
    ...InternalLogoGenerationActivities,
    ...StudioGenerationActivities,
    ...PublicDigestAnimationActivities,
    ...LeadgenActivities,
    ...NamefiFeedActivities,
    ...NamefiFeedDigestActivities,
    ...NamefiFeedLogoActivities,

    ...FreeClaimActivities,
    ...FreeClaimsCorrectionActivities,
    ...PbnIssuanceReservationsActivities,
    ...workflowMarkerActivities,
  },
  [TEMPORAL_ENUMS.MINT]: {
    ...mintTaskQueueActivities,
    ...workflowMarkerActivities,
  },
  [TEMPORAL_ENUMS.DOMAINS]: {
    ...DomainsActivities,
    ...workflowMarkerActivities,
  },
  [TEMPORAL_ENUMS.NOTIFY]: {
    ...NotifyActivities,
    ...InAppNotificationActivities,
    ...workflowMarkerActivities,
  },
  [TEMPORAL_ENUMS.INDEXERS]: {
    ...IndexersActivities,
    ...workflowMarkerActivities,
  },
  [TEMPORAL_ENUMS.HUNT]: { ...HuntActivities, ...workflowMarkerActivities },
};
export type ACTIVITIES = typeof ACTIVITIES;
