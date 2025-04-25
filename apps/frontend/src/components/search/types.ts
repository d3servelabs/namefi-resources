import type { OriginInfo } from '@/lib/origin/types';
import type { FC } from 'react';

/**
 * Type for any search component that can be used as the landing page
 */
export type SearchComponent = FC<{
  /**
   * Origin configuration from the origin system
   */
  originInfo: OriginInfo;
}>;
