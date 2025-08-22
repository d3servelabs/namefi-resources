import Color from 'colorjs.io';

export const toHex = (cssColor: string) =>
  new Color(cssColor).to('srgb').toString({ format: 'hex' });
