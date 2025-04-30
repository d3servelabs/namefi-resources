import { useMemo, useState } from 'react';

export type DomainData = {
  domain: string;
  availability: boolean;
  priceInUSD?: number | null;
  currentOwner?: string | null;
};

/**
 * Hook for filtering domains based on tab selection
 */
export function useDomainFilters(
  domains: DomainData[],
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
