# The article checks registration age against separate historical evidence

Assignment: order 4, G27, fixed title “How old is this domain, and why anyone cares”. Locale: en-US. Scope: procedural age check, record interpretation, historical gaps, purchase decisions. The historical demand slate supplies planning context only. The article makes no Namefi product claims.

## The research used these primary sources

All successful fetches occurred on 2026-10-21 UTC through the web tool. No archive snapshot was obtained or invented.

- https://datatracker.ietf.org/doc/html/rfc9083#section-4.5 — RFC 9083 §4.5: eventAction states the reason, eventDate states the time, future events can represent expiration. §5.3 shows domain-level events separately from nested entities and nameservers. §2.1 permits absent optional members. Supports identifying the right object and registration event, not selecting the oldest timestamp. RFC Editor returned 429, so the readable IETF copy supplies evidence.
- https://www.iana.org/assignments/rdap-json-values — event action rows: registration is initial object registration; last changed refers to information change; transfer means registrar-to-registrar movement; reinstantiation means registration after removal. RDAP database update is synchronization. Supports distinguishing events, not reconstructing an exhaustive owner list.
- https://www.icann.org/en/contracted-parties/registry-operators/registration-data-access-protocol/information-for-rdap-users-31-08-2018-en — “ICANN RDAP Lookup Tool”: free browser client, runs RDAP queries directly. Opening lookup.icann.org itself returned no text, so interface-specific field names and screenshots are deliberately absent.
- https://www.icann.org/en/contracted-parties/registry-operators/resources/registration-data-access-protocol — “RDAP Overview”: RDAP supplies current registration data and replaces WHOIS. Avoids detailed WHOIS phaseout exceptions, query counts and implementation counts because those do not serve the article.
- https://datatracker.ietf.org/doc/html/rfc5731#section-3.1.2 — §3.1.2: crDate represents domain object creation, upDate represents modification, trDate represents transfer. §3.2.1 creates objects; §3.2.2 deletes objects; §3.2.4 moves sponsorship; §3.2.5 changes registrant attributes. Supports the object-history distinction and the statement that an ordinary transfer does not itself create a fresh object. Does not prove every registry preserves every historical timestamp.
- https://www.icann.org/en/contracted-parties/consensus-policies/expired-registration-recovery-policy/expired-registration-recovery-policy-28-02-2013-en — §§2.2 and 3: post-expiration renewal and restoration after deletion exist. Supports the warning that expiration or deletion during recovery is not automatically a completed drop followed by fresh registration. No universal drop timeline is claimed.
- https://help.archive.org/help/using-the-wayback-machine/ — “Why isn't the site ... in the archive?”, “Where is the rest ...”, and “How did I end up ...”: crawler gaps/exclusions, missing resources, navigation across capture dates. The guide contains obsolete unrelated service references, which the article excludes. Supports capture limits only, not an actual domain timeline.
- https://developers.google.com/search/docs/essentials/spam-policies#expired-domain-abuse — “Expired domain abuse”: expired-domain purchase and repurposing primarily to manipulate rankings with low-value content violates policy. The article does not infer a universal domain-age ranking factor or its absence.
- https://www.iana.org/domains/root/db — introductory description identifies the root database as TLD delegation information. Used only to direct a reader toward a registry operator, never as second-level domain registration history.

## The evidence leaves these questions open

No real target domain or live RDAP record was supplied. Every numerical timeline in the manuscript is hypothetical and explicitly labeled. Public RDAP cannot establish a complete ownership chain. Missing historical events do not establish that no deletion occurred. Older captures can coexist with a younger current registration. Specific ccTLD field semantics require that registry's documentation. No seller, traffic, ranking, or safety assertion receives verification from age alone.

The generic lifecycle page exposed only a graphic and a caveat, so the article uses the readable recovery policy instead. Two guessed ICANN support URLs and a Google manual-action URL failed retrieval and supply no evidence. No public article mentions these tool failures.

## The self-review will check each boundary

The manuscript must use domain-level events, keep transfer distinct from registrant changes, and avoid equating expiry with release. The practical procedure records raw timestamps, retrieval date and evidence gaps. Related links use existing English content. The parent owns imagery, full batch validation and publication.

## The text review verified the final manuscript

The final pass checked every protocol and policy assertion against the opened primary passages above. The pass separated sourced definitions from procedural recommendations and hypothetical examples. The manuscript does not claim that age is or is not a Google ranking factor. The manuscript does not claim that a current registration event proves uninterrupted ownership. Expiration, recoverable deletion, completed drop, and a fresh object remain distinct.

The focused link audit passed with 0 broken, 0 missing-locale, 0 locale-mismatch, 0 relationship-mismatch, and 0 fallback findings. Focused ESLint passed. Frontmatter contains 12 keywords, five existing articles, five existing glossary terms, two valid topics, and two valid series. Parent will supply all five images, run batch validation, and inspect rendered output. Ancestor READMEs remain accurate at the collection level, so this writer changed no shared inventory.

```json
{
  "image_scenes": [
    {
      "section": "Registration data gives the domain a specific starting date",
      "scene": "A domain-level RDAP record labeled example.com shows a highlighted registration event and timestamp, with separate last changed, transfer, and expiration rows. A calendar comparison connects only the registration event to the checking date. Nested contact and nameserver records appear visibly separate. Avoid real live dates or a trust score.",
      "short_name": "registration-event"
    },
    {
      "section": "Website captures reveal use rather than a guaranteed launch date",
      "scene": "A timeline contains separated archived website captures and explicit unobserved gaps. A caption marks the earliest available capture as observed content, while a separate unknown launch-date marker sits earlier. Show a redirect capture and a date check on the destination without implying continuous operation.",
      "short_name": "website-captures"
    },
    {
      "section": "Transfers and fresh registrations create different historical questions",
      "scene": "Two parallel timelines compare an existing registration transferred from Registrar A to Registrar B with a completed removal followed by a new registration. The first timeline preserves the object creation marker, while the second marks separate registration objects. A third small note separates registrant acquisition from registrar transfer. Do not equate expiration with a completed drop.",
      "short_name": "registration-continuity"
    },
    {
      "section": "Buyers should connect age claims to the decision at hand",
      "scene": "A buyer compares three evidence cards labeled Registration date, Website observations, and Registrant acquisition. Each card connects to the corresponding original record and a supported or unknown finding. A purchase note states the narrow conclusion. Keep rankings, safety, and ownership proof outside the age conclusion rather than showing an automatic approval badge.",
      "short_name": "buyer-evidence"
    }
  ]
}
```

## The coordinator checked the updated recovery policy

The 2013 ERRP page directs readers to the 2024 policy. The coordinator opened the updated policy and verified post-expiration renewal and redemption sections on 2026-10-21. The public article now cites the updated URL. The substantive warning remains unchanged. Coordinator review falls outside writer counters.
