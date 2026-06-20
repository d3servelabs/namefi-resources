// Compile-time type-safety for next-intl messages.
//
// Augments next-intl's `AppConfig` with the precise shape of our assembled
// catalog so `useTranslations(ns)` / `t('key')` are validated by `tsc` — a
// mistyped or removed message key becomes a build error, not a render-time
// surprise. The shape mirrors `loadMessages()` (namespace -> en JSON), so this
// list must stay in sync with `NAMESPACES` in `./config.ts`. English is the
// source of truth, so we type against the `en` catalog.

import type aiGeneration from '../../messages/en/aiGeneration.json';
import type cart from '../../messages/en/cart.json';
import type claim from '../../messages/en/claim.json';
import type common from '../../messages/en/common.json';
import type consent from '../../messages/en/consent.json';
import type dnsManagement from '../../messages/en/dnsManagement.json';
import type domains from '../../messages/en/domains.json';
import type error from '../../messages/en/error.json';
import type faucet from '../../messages/en/faucet.json';
import type feed from '../../messages/en/feed.json';
import type footer from '../../messages/en/footer.json';
import type freeMints from '../../messages/en/freeMints.json';
import type gallery from '../../messages/en/gallery.json';
import type gifts from '../../messages/en/gifts.json';
import type hunt from '../../messages/en/hunt.json';
import type landing from '../../messages/en/landing.json';
import type landingMarketing from '../../messages/en/landingMarketing.json';
import type manage from '../../messages/en/manage.json';
import type mart from '../../messages/en/mart.json';
import type nav from '../../messages/en/nav.json';
import type newsletter from '../../messages/en/newsletter.json';
import type notifications from '../../messages/en/notifications.json';
import type nfsc from '../../messages/en/nfsc.json';
import type tlds from '../../messages/en/tlds.json';
import type orders from '../../messages/en/orders.json';
import type payment from '../../messages/en/payment.json';
import type paymentMethods from '../../messages/en/paymentMethods.json';
import type profile from '../../messages/en/profile.json';
import type search from '../../messages/en/search.json';
import type shared from '../../messages/en/shared.json';
import type wishlist from '../../messages/en/wishlist.json';
import type { Locale } from './config';

type Messages = {
  aiGeneration: typeof aiGeneration;
  cart: typeof cart;
  claim: typeof claim;
  common: typeof common;
  consent: typeof consent;
  dnsManagement: typeof dnsManagement;
  domains: typeof domains;
  error: typeof error;
  faucet: typeof faucet;
  feed: typeof feed;
  footer: typeof footer;
  freeMints: typeof freeMints;
  gallery: typeof gallery;
  gifts: typeof gifts;
  hunt: typeof hunt;
  landing: typeof landing;
  landingMarketing: typeof landingMarketing;
  manage: typeof manage;
  mart: typeof mart;
  nav: typeof nav;
  newsletter: typeof newsletter;
  notifications: typeof notifications;
  nfsc: typeof nfsc;
  tlds: typeof tlds;
  orders: typeof orders;
  payment: typeof payment;
  paymentMethods: typeof paymentMethods;
  profile: typeof profile;
  search: typeof search;
  shared: typeof shared;
  wishlist: typeof wishlist;
};

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
