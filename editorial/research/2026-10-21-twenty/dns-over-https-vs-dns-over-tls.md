# The article compares client-to-resolver encrypted DNS

Research fetched 2026-10-21 UTC. Scope: general transport selection and practical verification, separate from existing enterprise split-horizon article. Historical demand slate supplies topic only.

Sources personally opened and read:
- https://www.rfc-editor.org/rfc/rfc8484.html — sections 3, 4.1, 6, 8.1–8.2. DoH uses configured HTTPS URI templates, GET/POST, HTTPS server identity verification and default port 443. HTTP features introduce correlation considerations. Does not imply invisibility.
- https://www.rfc-editor.org/rfc/rfc7858.html — introduction and sections 3.1–3.4. DoT defaults to TCP 853, negotiates TLS first, forbids cleartext on DoT ports and supports connection reuse. Resolver-to-authoritative transport is outside original specification scope.
- https://www.rfc-editor.org/rfc/rfc8310.html — sections 4–6, especially 5. Strict profile requires authenticated encryption or hard failure. Opportunistic profile permits authenticated encryption, unauthenticated encryption or cleartext, depending on client fallback. Initial resolver-address meta-query may precede strict connection.
- https://www.rfc-editor.org/rfc/rfc9076.html — sections 5.2, 6.1.4 and 6.2. Encrypted transport does not reduce resolver-visible DNS data. HTTP headers and cookies can add identifiers. Authoritative servers see cache misses and QNAME minimization changes exposed names.
- https://www.rfc-editor.org/rfc/rfc4033.html — introduction, section 2. DNSSEC authenticates origin and integrity, provides no confidentiality.
- https://support.mozilla.org/en-US/kb/dns-over-https — Protection levels explained and FAQ DoH status. Default can fall back and disable DoH under specified conditions. Max warns and permits explicit system-DNS exception. Product behavior checked only for documented Firefox setting.
- https://developers.google.com/speed/public-dns/docs/secure-transports — Endpoints and Supported TLS versions. Google documents DoT dns.google:853 and RFC 8484 DoH https://dns.google/dns-query{?dns}:443. Provider example does not endorse provider or assert retention.

Limits: Google using-tls page fetch failed and contributes no evidence. No latency benchmark, retention policy or universal platform behavior claimed. No archive snapshot asserted. Reader procedures are original diagnostic recommendations, not tests executed on a device. No credential or SaaS account needed. Actual start boundary retained by helper; repeated start invocation returned the same existing boundary.

## The text review checked the manuscript

The article has 1,939 substantive body words before Sources, four body H2 sections, a three-column comparison, and verified existing internal targets. Source cross-check preserves TCP 853 default, HTTPS 443 default, strict/opportunistic distinction, product-specific Firefox fallback and resolver visibility. Practical tests are recommendations with cache and scope caveats. No image references were added. Parent owns imagery and publication.

```json
{
  "image_scenes": [
    {
      "section": "Both protocols protect one connection in the DNS path",
      "short_name": "protected-connection",
      "scene": "Laptop sends an encrypted DNS query through a locked connection to a recursive resolver. The resolver reads www.example.com. A separate upstream connection leads to an authoritative server. Place the encryption bracket only over laptop-to-resolver, with a small visible resolver-eye symbol."
    },
    {
      "section": "DoH and DoT use different transport and configuration details",
      "short_name": "transport-paths",
      "scene": "Two parallel client-to-resolver paths. DoH path has an HTTPS request envelope labeled HTTPS 443 and endpoint URL field. DoT path has a TLS envelope labeled TCP 853 and authentication hostname field. Both terminate at the resolver. No claim that port 443 makes traffic invisible."
    },
    {
      "section": "Authentication and fallback determine the actual protection",
      "short_name": "failure-policies",
      "scene": "A failed resolver identity check reaches a decision fork. Strict profile stops with a clear failure sign. Opportunistic profile shows possible authenticated encryption, unauthenticated encryption and cleartext outcomes, clearly distinguished. A certificate identity check precedes the successful strict route."
    },
    {
      "section": "A controlled test reveals which DNS connection the client uses",
      "short_name": "verify-connection",
      "scene": "A test-device checklist aligns configured resolver, application connection status, expected destination and temporary failure test. A browser and terminal have separate query arrows to illustrate application scope. A temporary block leads to warning, stop or fallback observations, followed by a restore-settings check."
    }
  ]
}
```
