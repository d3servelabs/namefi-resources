export const SEARCH_INTENT_EVENT = 'namefi:search-intent';

export function dispatchSearchIntent() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SEARCH_INTENT_EVENT));
}
