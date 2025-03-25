import type { CSSProperties } from 'react';

export * from './context';

export const style2string = (styles?: CSSProperties): string => {
  return styles
    ? Object.entries(styles)
        .map(
          ([key, value]) =>
            `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value};`,
        )
        .join('\n')
    : '';
};
