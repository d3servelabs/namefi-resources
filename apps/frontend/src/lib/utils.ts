import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getShortAddress(address: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
}

export function getHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    console.error('Error getting hostname', e);
    return '';
  }
}

export function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
}

export function getSubDomainAndParentDomainFromNormalizedDomainName(
  normalizedDomainName: string,
): { subdomain: string; parentDomain: string } {
  const [subdomain, ...parentDomain] = normalizedDomainName.split('.');
  return {
    subdomain,
    parentDomain: parentDomain.join('.'),
  };
}
