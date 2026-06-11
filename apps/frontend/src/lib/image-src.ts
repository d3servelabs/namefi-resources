const SVG_PATH_SUFFIXES = ['.svg', '/svg'];

export function isSvgLikeSrc(src: string) {
  try {
    const url = new URL(src, 'https://namefi.local');
    return SVG_PATH_SUFFIXES.some((suffix) => url.pathname.endsWith(suffix));
  } catch {
    const [path] = src.split('?');
    return SVG_PATH_SUFFIXES.some((suffix) => path?.endsWith(suffix));
  }
}

export function shouldBypassImageOptimization(src: string) {
  if (isSvgLikeSrc(src)) {
    return true;
  }

  try {
    const url = new URL(src, 'https://namefi.local');
    return url.hostname === 'avatar.vercel.sh';
  } catch {
    return false;
  }
}
