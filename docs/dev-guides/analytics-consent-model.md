# Analytics Consent Model

This document describes how Namefi should measure Google Analytics checkout/search behavior across login and consent states.

It is an engineering/product reference, not legal advice. The goal is to keep GA data useful without creating GA or backend analytics identifiers for users who have not granted measurement consent.

## Current Architecture

- c15t is the consent source for `measurement`.
- The frontend maps c15t `measurement` to Google Consent Mode `analytics_storage`.
- Browser GA events may run in normal mode when measurement is granted.
- Backend GA events for web checkout/search should only use the browser GA `client_id` from a consented browser session.
- Backend web checkout/search merges the c15t request cookie, the frontend `X-C15T-Measurement-Consent` signal (`granted` or `denied`), and c15t geo auto-grant behavior, so logged-out requests do not rely on the GA client id alone.
- API-originated backend checkout events are tagged with `event_source: api` so GA Data API reports can include or filter them intentionally.
- Transactional email open pixels are tagged with `event_source: email` because they do not have browser/API checkout identity. They are useful as email-open counts, not as proof that the same browser session continued through email open. Email-only open events can include event metadata such as `user_id` and `order_id`, but should not set top-level GA `user_id` or browser session params unless a browser/API tracking identity is explicitly present.
- Admin checkout analytics reads GA4 data through the GA Data API, so polluted backend GA events can directly affect admin funnel reporting.
- Request IP and browser fingerprint can exist for non-analytics security flows such as login-history/new-device detection. They must not be used as fallback GA identities or backend analytics join keys.

## API-Originated Events

ORPC/API/MPP/X402 checkout calls are not browser sessions and usually do not have a browser GA `client_id` or c15t browser consent record. We still send those backend events as API-originated product telemetry when the authenticated API user is otherwise eligible for analytics tracking, and we tag them with `event_source: api`.

The admin checkout report can query all sources, only API events, or non-API events. Non-API means web, email, and legacy events that do not carry `event_source: api`.

The current Measurement Protocol sender still has a legacy fallback `client_id` when no browser `client_id` is provided. That fallback is server-derived and timestamp-shaped, so it should not be interpreted as a real visitor, browser, or session identity. It is kept for API event continuity and should not be used as a no-consent web tracking workaround.

## Geo Defaults

c15t consent defaults depend on whether c15t shows a banner:

| c15t result | Common cases | Measurement default |
| --- | --- | --- |
| Banner shown | GDPR/UK GDPR, Switzerland, Brazil, Canada, Australia, Japan, South Korea, unknown | Off until the user grants consent |
| No banner, `NONE` jurisdiction | No detected regulation | On, no banner |

Source: [c15t consent models](https://c15t.com/docs/frameworks/javascript/concepts/consent-models).

## Four User Cases

| Case | What we should send to GA | What we can measure |
| --- | --- | --- |
| Logged out + measurement consent granted or geo auto-allows measurement | Browser GA events and backend Measurement Protocol events with the browser GA `client_id`. No `user_id`. | Pseudonymous GA browser-session analytics and aggregate admin checkout/search counts. |
| Logged out + measurement consent denied or opt-in consent unspecified | No backend Measurement Protocol events. Browser GA may only send consent-mode cookieless/modeling signals if the tag is loaded with denied consent. | Aggregate backend counters and business facts only. No per-browser/session funnel. |
| Logged in + measurement consent granted or geo auto-allows measurement | Browser GA events and backend Measurement Protocol events with browser GA `client_id`; include `user_id` only after consent. | GA user/session analytics, backend checkout/search events, and admin funnel reporting. |
| Logged in + measurement consent denied or opt-in consent unspecified | No GA `user_id`; no backend Measurement Protocol events. Auth does not override measurement consent. | Product/business database facts such as order count/revenue. Aggregate backend counters are ok if they do not create a tracking identifier. |

## Why Backend GA Needs Consent

GA4 Measurement Protocol is not a replacement for browser tagging. Google describes it as a way to augment automatic collection, and says Measurement Protocol events are joined to online interactions and privacy settings with `client_id` or `app_instance_id`.

Sources:

- [GA4 Measurement Protocol overview](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [GA4 Measurement Protocol reference: `session_id`, consent, and reporting behavior](https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference)

For no-consent traffic, Google’s intended GA path is Consent Mode. When `analytics_storage='denied'`, Google says GA does not read or write analytics cookies and sends cookieless, non-identifiable events/pings for modeling.

Sources:

- [Google Consent Mode reference](https://support.google.com/analytics/answer/13802165)
- [About Consent Mode](https://support.google.com/analytics/answer/10000067?hl=en-EN)

## Common Questions

### Why can’t we track anonymously from the backend if there is no consent?

We can count anonymous aggregate backend events. We cannot create a GA user/session funnel anonymously.

A GA backend event that joins to a visitor needs a stable join key, such as `client_id`, `session_id`, `user_id`, or a backend-created equivalent. Once we create or reuse that join key, we are tracking the same browser/person across records. That is pseudonymous tracking, not anonymous aggregate measurement.

Google’s no-consent GA path is cookieless modeling through Consent Mode, not backend-created pseudo-identities.

Sources:

- [Google Consent Mode reference](https://support.google.com/analytics/answer/13802165)
- [GA4 Measurement Protocol overview](https://developers.google.com/analytics/devguides/collection/protocol/ga4)

### Why can’t we fuzz or hash the identifier?

Fuzzing only helps if it destroys linkability. But if it destroys linkability, it also destroys funnels, sessions, attribution, and user paths.

| Identifier strategy | Result |
| --- | --- |
| Stable hash of user id, IP, fingerprint, or GA id | Still linkable; still a pseudonymous identifier. |
| Stable salted hash | Still linkable while the salt is stable. |
| Daily rotating hash | Still linkable within a day; breaks cross-day funnels. |
| Random id per request | Not linkable; cannot build a funnel/session. |
| Aggregate counter with no visitor/session id | Good for totals; not a funnel. |

Regulators describe this as the difference between anonymisation and pseudonymisation. Pseudonymised data can still be personal data, and effective anonymisation must address singling out and linkability.

Sources:

- [ICO: effective anonymisation, singling out, and linkability](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/how-do-we-ensure-anonymisation-is-effective/?search=photos)
- [ICO: pseudonymised data is still personal data](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/pseudonymisation/)
- [EDPB pseudonymisation summary](https://www.edpb.europa.eu/system/files/2025-02/edpb_summary_202501_pseudonymisation_en.pdf)
- [European Commission: de-identified, encrypted, or pseudonymised data can remain personal data](https://commission.europa.eu/law/law-topic/data-protection/data-protection-explained_en)
- [GDPR Article 4(1): online identifiers can identify a person directly or indirectly](https://eur-lex.europa.eu/legal-content/EN-ES/TXT/?from=EN&uri=CELEX%3A32016R0679)

### Why can’t we use IP address or browser fingerprint instead?

IP and fingerprint-derived values are not consent workarounds. They are tracking inputs. The ePrivacy guidance specifically discusses device fingerprinting, IP-based tracking, tracking pixels, local processing, and unique identifiers as tracking techniques within scope.

Source: [EDPB Guidelines 2/2023 on technical scope of Article 5(3) of the ePrivacy Directive](https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf).
