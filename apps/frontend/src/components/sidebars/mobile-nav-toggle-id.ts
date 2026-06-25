/**
 * Shared id linking the header hamburger (`<label htmlFor>`) to the mobile nav
 * drawer's toggle checkbox. They are CSS-only siblings, so the drawer opens and
 * closes with no JavaScript — it works from the server-rendered HTML before
 * React hydrates. Kept in its own tiny module so the header can reference the id
 * without importing the drawer component (and its nav/auth dependencies).
 */
export const MOBILE_NAV_TOGGLE_ID = 'mobile-nav-toggle';
