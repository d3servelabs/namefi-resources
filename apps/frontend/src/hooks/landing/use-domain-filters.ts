import { isNotNil } from 'ramda';
import { useMemo, useState } from 'react';
import type { DomainAvailabilityInfo } from '../../utils/types';

/**
 * Hook for filtering domains based on tab selection
 */
export function useDomainFilters(
  domains: DomainAvailabilityInfo[],
  isDomainInCart: (domain: string) => boolean,
) {
  const [activeTab, setActiveTab] = useState('all');

  // Filter domains based on active tab
  const filteredDomains = useMemo(() => {
    if (activeTab === 'available') {
      return domains.filter((domain) => domain.availability);
    }
    if (activeTab === 'unavailable') {
      return domains.filter((domain) => !domain.availability);
    }
    if (activeTab === 'taken') {
      return domains.filter((domain) => isNotNil(domain.currentOwner));
    }
    if (activeTab === 'cart') {
      return domains.filter((domain) => isDomainInCart(domain.domain));
    }
    return domains;
  }, [domains, activeTab, isDomainInCart]);

  return {
    activeTab,
    setActiveTab,
    filteredDomains,
  };
}
