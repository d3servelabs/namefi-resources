import { parseAsString, useQueryState } from 'nuqs';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

// Module-level guard: several UserDropdown instances mount at once (header,
// sidebar, mobile drawer, cart…). Only the first to handle the ?login=1 intent
// opens the sign-in chooser, so we never stack duplicate dialogs.
let signInIntentHandled = false;

/**
 * Opens the sign-in chooser when the URL carries `?login=1`.
 *
 * This is the pre-hydration fallback for the native-link "Sign in" control: a
 * logged-out visitor who taps Sign in before the heavy app tree hydrates does a
 * native navigation to `?login=1` (zero React, so the control is usable at first
 * paint). Once auth is ready this reads the param, fires `onIntent` (open the
 * chooser, the same UI a hydrated click opens), and clears it. After hydration
 * the button's onClick opens the chooser inline and this never fires.
 */
export function useOpenSignInFromQuery(onIntent: () => void) {
  const [loginParam, setLoginParam] = useQueryState(
    'login',
    parseAsString.withOptions({ clearOnDefault: true }),
  );
  const { authReady, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loginParam) {
      // Param is gone — reset the guard so a LATER ?login=1 (e.g. the user
      // signs out and follows the native Sign in link again in the same SPA
      // session) is handled again. The guard only needs to dedupe the several
      // UserDropdown instances within a single param-present window.
      signInIntentHandled = false;
      return;
    }
    if (signInIntentHandled) return;
    // Already signed in (e.g. returning user) — nothing to do, just clean up.
    if (isAuthenticated) {
      void setLoginParam(null);
      return;
    }
    // Wait until the auth context is ready before opening the chooser.
    if (!authReady) return;
    signInIntentHandled = true;
    void setLoginParam(null);
    onIntent();
  }, [loginParam, authReady, isAuthenticated, onIntent, setLoginParam]);
}
