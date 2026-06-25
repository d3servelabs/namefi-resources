import { describe, expect, it } from 'vitest';
import { isWalletConnectNativeDeepLink } from './wallet-deeplink';

// A representative `wc:` pairing uri, percent-encoded as AppKit emits it.
const WC_URI =
  'wc%3A0a73e1916ed022b15d9e239d6d5c0708b220f36b406d35cff6be26882ee47cf2%402%3Frelay-protocol%3Dirn%26symKey%3Dabc';

describe('isWalletConnectNativeDeepLink', () => {
  it('matches native custom-scheme wallet deep links', () => {
    expect(isWalletConnectNativeDeepLink(`metamask://wc?uri=${WC_URI}`)).toBe(
      true,
    );
    expect(isWalletConnectNativeDeepLink(`imtokenv2://wc?uri=${WC_URI}`)).toBe(
      true,
    );
    expect(isWalletConnectNativeDeepLink(`trust://wc?uri=${WC_URI}`)).toBe(
      true,
    );
    expect(isWalletConnectNativeDeepLink(`rainbow://wc?uri=${WC_URI}`)).toBe(
      true,
    );
  });

  it('does not match http(s) links or unrelated window.open targets', () => {
    expect(
      isWalletConnectNativeDeepLink(
        `https://metamask.app.link/wc?uri=${WC_URI}`,
      ),
    ).toBe(false);
    expect(isWalletConnectNativeDeepLink('https://example.com/page')).toBe(
      false,
    );
    expect(isWalletConnectNativeDeepLink('mailto:hi@namefi.io')).toBe(false);
    // a non-wc custom-scheme open (e.g. a generic app link) is left untouched
    expect(isWalletConnectNativeDeepLink('metamask://settings')).toBe(false);
  });
});
