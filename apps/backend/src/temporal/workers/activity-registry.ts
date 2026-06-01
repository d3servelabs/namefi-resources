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
  NamefiFeedLogoActivities,
} from '../activities';
import { DomainsActivities } from '../activities/domain';
import { TEMPORAL_ENUMS } from '../shared';
import { IndexersActivities } from '../activities/indexers';
import { defaultTaskQueueActivities } from '../activities/default';
import { mintTaskQueueActivities } from '../activities/mint';

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
    ...NamefiFeedLogoActivities,

    ...FreeClaimActivities,
    ...FreeClaimsCorrectionActivities,
    ...PbnIssuanceReservationsActivities,
  },
  [TEMPORAL_ENUMS.MINT]: mintTaskQueueActivities,
  [TEMPORAL_ENUMS.DOMAINS]: DomainsActivities,
  [TEMPORAL_ENUMS.NOTIFY]: {
    ...NotifyActivities,
    ...InAppNotificationActivities,
  },
  [TEMPORAL_ENUMS.INDEXERS]: IndexersActivities,
  [TEMPORAL_ENUMS.HUNT]: HuntActivities,
};
export type ACTIVITIES = typeof ACTIVITIES;
