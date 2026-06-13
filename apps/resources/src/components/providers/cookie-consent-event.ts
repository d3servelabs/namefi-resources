// Shared window-event name that lets the site footer's "Cookie Settings" button
// open the lazily-mounted consent dialog WITHOUT importing the c15t React
// runtime. The footer dispatches this event; a listener inside the deferred
// consent island (which has the c15t context) calls setActiveUI('dialog').
export const OPEN_COOKIE_SETTINGS_EVENT = 'namefi:open-cookie-settings';
