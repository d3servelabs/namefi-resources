/**
 * On phones (`max-sm`), dock a Dialog to the bottom of the screen as a slide-up
 * sheet — the iOS action-sheet pattern — instead of the centered modal that
 * overflows / floats awkwardly on a small viewport. Desktop (`sm+`) keeps the
 * centered dialog untouched.
 *
 * Pass to a shadcn `<DialogContent className={cn(MOBILE_BOTTOM_SHEET_DIALOG, …)}>`.
 * It only adds `max-sm:` overrides, so it composes with the dialog's own classes
 * (the desktop `sm:max-w-*` etc. still win at their breakpoints).
 *
 * What it overrides vs. the centered base (`top-1/2 left-1/2 -translate-1/2`):
 * pins to the bottom, full width, top-rounded only, caps height + scrolls, and
 * slides up from the bottom edge with a home-indicator-safe bottom padding.
 */
export const MOBILE_BOTTOM_SHEET_DIALOG =
  // `!` is needed: the base `DialogContent` pins itself dead-center with
  // `left-1/2 -translate-x-1/2 max-w-[calc(100%-2rem)]`, and those win the
  // cascade over a plain `max-sm:` override — so force the bottom-sheet geometry.
  'max-sm:inset-x-0! max-sm:top-auto! max-sm:bottom-0! ' +
  'max-sm:translate-x-0! max-sm:translate-y-0! ' +
  'max-sm:w-full! max-sm:max-w-none! max-sm:max-h-[88vh] max-sm:overflow-y-auto ' +
  'max-sm:rounded-b-none max-sm:rounded-t-2xl ' +
  'max-sm:data-open:slide-in-from-bottom-4 max-sm:data-closed:slide-out-to-bottom-4 ' +
  'max-sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]';
