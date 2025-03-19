// import punycode from 'node:punycode';

export function shortage(value: string, max: number): string {
  return value.length > max
    ? `${value.slice(0, Math.ceil(max / 2) - 1)}...${value.slice(-Math.floor(max / 2))}`
    : value;
}

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

// export const text2unicode = (text: string): string => punycode.toUnicode(text);
