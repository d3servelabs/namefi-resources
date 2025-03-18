export const TEMPORAL_ENUMS = {
  DEFAULT: 'DEFAULT',
  DOMAINS: 'DOMAINS',
  MINT: 'MINT',
  NOTIFY: 'NOTIFY',
} as const;

export type TEMPORAL_ENUMS =
  (typeof TEMPORAL_ENUMS)[keyof typeof TEMPORAL_ENUMS];

export const TEMPORAL_QUEUES = {
  /**
   * Default temporal configuration
   * @property {string} QUEUE - Default task queue name
   */
  DEFAULT: 'default_task_queue',
  /**
   * Domain-specific temporal configuration
   * @property {string} QUEUE - Domain-specific task queue name
   */
  DOMAINS: 'domains_task_queue',
  /**
   * Minting operations temporal configuration
   * @property {string} QUEUE - Minting operations task queue name
   */
  MINT: 'mint_queue',
  /**
   * Notification temporal configuration
   * @property {string} QUEUE - Notification task queue name
   */
  NOTIFY: 'notify_queue',
} as const satisfies Record<TEMPORAL_ENUMS, string>;

export type TEMPORAL_QUEUES =
  (typeof TEMPORAL_QUEUES)[keyof typeof TEMPORAL_QUEUES];
