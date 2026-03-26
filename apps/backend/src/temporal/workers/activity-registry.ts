import {
  MigrationActivities,
  NotifyActivities,
  OrderActivities,
  PaymentActivities,
  HuntActivities,
  FreeClaimActivities,
  FreeClaimsCorrectionActivities,
  PbnIssuanceReservationsActivities,
  LinkSharesExternalIdentifierMigrationActivities,
  TwitterLinkSharesValidationActivities,
  GreetActivities,
  LogoAnimationActivities,
} from '../activities';
import { DomainsActivities } from '../activities/domain';
import { TEMPORAL_ENUMS } from '../shared';
import { IndexersActivities } from '../activities/indexers';
import { defaultTaskQueueActivities } from '../activities/default';
import { LogoGenerationActivities } from '../activities';
import { mintTaskQueueActivities } from '../activities/mint';

export const ACTIVITIES = {
  [TEMPORAL_ENUMS.DEFAULT]: {
    ...defaultTaskQueueActivities,
    ...GreetActivities,
    ...MigrationActivities,
    ...LinkSharesExternalIdentifierMigrationActivities,
    ...TwitterLinkSharesValidationActivities,
    ...OrderActivities,
    ...PaymentActivities,
    ...LogoGenerationActivities,
    ...LogoAnimationActivities,

    ...FreeClaimActivities,
    ...FreeClaimsCorrectionActivities,
    ...PbnIssuanceReservationsActivities,
  },
  [TEMPORAL_ENUMS.MINT]: mintTaskQueueActivities,
  [TEMPORAL_ENUMS.DOMAINS]: DomainsActivities,
  [TEMPORAL_ENUMS.NOTIFY]: NotifyActivities,
  [TEMPORAL_ENUMS.INDEXERS]: IndexersActivities,
  [TEMPORAL_ENUMS.HUNT]: HuntActivities,
};
export type ACTIVITIES = typeof ACTIVITIES;
