# Research supports certificate renewal as validation, issuance, deployment, and public verification

Assignment: order 7, G41, historical demand slate. Topic fixed; no current search-demand claim. Written 2026-10-21 in English under explicit GPT batch authorization. Scope: procedure for an existing website, distinct from the HTTPS explainer. No Namefi feature claims.

All listed sources fetched through the web tool on 2026-10-21 UTC. Locators below identify the actual passages read. No archive snapshot asserted.

| Source | Locator | Evidence used |
| --- | --- | --- |
| https://letsencrypt.org/2026/10/07/64-day-certs | Opening paragraphs, ARI paragraph | Default 64-day issuance begins 2027-02-10; shorter 45/6-day options; staging differs; ARI accommodates scheduling. Current announcement controls older generic lifetime guidance. |
| https://letsencrypt.org/2025/12/02/from-90-to-45 | Timeline of Changes | Opt-in tlsserver 45-day profile from 2026-05-13; classic 64 days in 2027 and 45 days in 2028. Article labels future defaults and does not universalize 90 days. |
| https://www.rfc-editor.org/rfc/rfc8555.html#section-8 | Abstract, sections 7 and 8 | ACME automates authorization and issuance; challenges demonstrate identifier control. |
| https://letsencrypt.org/docs/challenge-types/ | HTTP-01 and DNS-01 headings, lines 10–48 | HTTP path, port 80, wildcard limitation, consistent frontends; DNS TXT, API scope, delegation, provider-dependent availability. Derived summary kept concise. |
| https://docs.aws.amazon.com/acm/latest/userguide/managed-renewal.html | Eligibility bullets and Note | Imported/expired exceptions; ACME client manages ACME renewal; regional certificates independent. No universal managed renewal claim. |
| https://docs.aws.amazon.com/acm/latest/userguide/dns-renewal-validation.html | Renewal criteria bullets | In-use AWS service and publicly accessible required CNAME records. Persistent provider validation records differ from transient ACME TXT challenges. Current source includes 198-day behavior, but article omits provider timing numbers. |
| https://eff-certbot.readthedocs.io/en/stable/using.html#renewing-certificates | Renewing certificates, automated renewals, certificate inventory examples, modifying renewal configuration | Select stored certificate name; active dry-run; scheduler depends on installation; success can mean no renewal needed; deploy hook distinguishes successful renewal. Commands remain examples, no execution against real infrastructure. |
| https://www.rfc-editor.org/rfc/rfc9773.html#section-4.2 | Sections 4.2–4.3 | suggestedWindow and client scheduling; Retry-After and error behavior. Article distinguishes timing coordination from deployment. |
| https://docs.openssl.org/3.5/man1/openssl-s_client/#options | -connect, -servername, -showcerts | Read-only network inspection, explicit SNI, presented certificates. Display does not imply trusted verification. |
| https://docs.openssl.org/3.5/man1/openssl-x509/#certificate-printing-options | -dates, -issuer, -serial, -ext | Public certificate file inspection, no private key required. |

Additional sources opened but not cited: Let's Encrypt FAQ and Integration Guide. A guessed /docs/renewal/ URL returned 404 and contributes zero evidence. Public article does not mention the failed fetch.

## The text review checks operational boundaries

The manuscript separates certificate lifetime from renewal cadence, CA issuance from deployment, and local file inspection from public verification. The manuscript treats dry-run as active, preserves managed CNAME records, and does not offer blanket restart or DNS replacement commands. Hypothetical incident examples use example.com. Source links point directly outward because production strips some HTML anchors. Frontmatter links use existing articles and glossary entries. Parent owns image creation, full validator run, publication, and final deployment review.

Uncertainty: provider behavior and client versions can change. The article directs readers to existing managers and installation-specific procedures. ARI requires both client and authority support. A successful sample connection establishes only the observed endpoint's certificate, not every region or browser trust outcome. No universal propagation wait or renewal lifetime is asserted.

```json
{
  "image_scenes": [
    {"section":"Your renewal plan starts with the certificate that serves visitors","scene":"Show a browser connecting to a public TLS endpoint, with a separate origin behind the endpoint. Display a certificate at each location, with distinct expiry cards and a small inventory linking hostname, manager, and deployment target. Emphasize inspection of the visitor-facing certificate, not merely the origin file.","short_name":"public-certificate"},
    {"section":"Your validation method determines what renewal must preserve","scene":"Show two clearly labeled validation paths. HTTP-01 leads to an HTTP challenge file on port 80. DNS-01 leads to a TXT answer at _acme-challenge.example.com. A separate managed-service lane retains a CNAME validation record. Keep temporary TXT values visually distinct from the retained CNAME.","short_name":"validation-paths"},
    {"section":"Your certificate manager must connect renewal to deployment","scene":"Show a left-to-right process: validation, certificate authority issuance, deployment operation, public TLS endpoint. Place an ARI suggested-window calendar above the renewal client, with no direct arrow from ARI to the public endpoint. A certificate file before deployment differs from a certificate actually loaded at the endpoint.","short_name":"renewal-deployment"},
    {"section":"Your final check must confirm the public replacement","scene":"Show a certificate inspector comparing a new local certificate with certificates served by two regional public endpoints. One regional endpoint initially shows an old certificate and a listener-association check; the other shows the replacement. Include date, hostname, and certificate identity as verification fields.","short_name":"public-verification"}
  ]
}
```
