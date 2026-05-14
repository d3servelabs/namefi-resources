import type { NotificationRelatedResource } from '@namefi-astra/common/shared-schemas';

export type NotificationsModalFilter = NotificationRelatedResource | null;

export type NotificationsModalState = {
  isOpen: boolean;
  filter: NotificationsModalFilter;
};
