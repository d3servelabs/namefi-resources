export function shortage(value: string, max: number): string {
  return value.length > max
    ? `${value.slice(0, Math.ceil(max / 2) - 1)}...${value.slice(-Math.floor(max / 2))}`
    : value;
}

/**
 * Creates an abbreviation from a string value.
 *
 * @param value - The string to abbreviate
 * @param last - If true and value is a single word, use first and last characters instead of first two
 * @returns The abbreviated string in uppercase
 *
 * @example
 * // Single word examples
 * abbreviation("John")      // Returns "JO"
 * abbreviation("John", true) // Returns "JN"
 * abbreviation("A")         // Returns "AA"
 *
 * @example
 * // Multiple word examples
 * abbreviation("John Doe")  // Returns "JD"
 * abbreviation("New York City") // Returns "NYC"
 */
export const abbreviation = (value: string, last = false): string => {
  const parts = value.trim().split(/\s+/);

  if (parts.length === 1) {
    const [word] = parts;
    return word.length === 1
      ? word.repeat(2).toUpperCase()
      : last
        ? (word[0] + word[word.length - 1]).toUpperCase()
        : word.slice(0, 2).toUpperCase();
  }

  return parts.map((part) => part[0].toUpperCase()).join('');
};

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
