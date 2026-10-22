---
title: "SSL Certificate Types Answer Different Identity and Coverage Needs"
description: "Compare DV, OV, EV, wildcard, and multi-domain TLS certificates. Choose identity checks and hostname coverage separately."
date: '2026-10-22'
language: en
tags: ['https', 'tls', 'certificates', 'security']
authors: ['namefiteam']
draft: false
format: guide
cluster: domain-security
keywords: ['SSL certificate types', 'DV certificate', 'OV certificate', 'EV certificate', 'wildcard SSL certificate', 'multi-domain certificate', 'SAN certificate', 'single domain certificate', 'TLS certificate selection', 'certificate validation']
ogImage: ../../assets/ssl-certificate-types-og.jpg
relatedArticles:
  - /en/blog/what-is-https/
  - /en/blog/renew-ssl-certificate/
  - /en/blog/custom-domain-github-pages/
  - /en/blog/wildcard-dns-records/
  - /en/blog/how-domain-hijacking-actually-happens/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/dns/
  - /en/glossary/private-key/
  - /en/glossary/public-key/
  - /en/glossary/subdomain/
relatedTopics:
  - /en/topics/domain-basics/
  - /en/topics/domain-security/
relatedSeries:
  - /en/series/domain-investor-field-guide/
  - /en/series/domain-apocalypse/
---

**Choose an SSL certificate by answering two questions: what identity must the issuer verify, and which hostnames must the certificate cover?** DV, OV, and EV describe identity validation. Single-name, wildcard, and multi-domain describe hostname coverage. A wildcard certificate can also be a DV certificate.

“SSL certificate” remains a common search term for certificates used with modern TLS. Read the [HTTPS explanation](/en/blog/what-is-https/) for connection mechanics. This guide helps a site operator prepare a certificate request and compare offerings.

## Identity validation determines which checks the issuer performs

![DV checks domain control, OV adds organization checks, and EV adds detailed identity checks.](../../assets/ssl-certificate-types-01-identity.jpg)

A certificate authority checks domain control before issuing a domain-validated certificate. Organization validation adds checks about the organization. Extended validation adds more extensive identity checks. [DigiCert explains the validation differences](https://www.digicert.com/difference-between-dv-ov-and-ev-ssl-certificates#:~:text=What%20distinguishes%20OV%20%26%20EV).

| Validation | Issuer checks | Selection question |
| --- | --- | --- |
| Domain validation (DV) | Control of the requested domain | Does the requirement concern an authenticated connection to a hostname? |
| Organization validation (OV) | Domain control and organization details | Does a customer or internal policy require organization identity in the certificate? |
| Extended validation (EV) | Domain control and more extensive organization identity checks | Does a documented requirement specifically call for EV? |

Treat the selection questions as planning guidance. Confirm the actual requirement with the team that owns the requirement before buying a certificate.

An identity check does not establish that a website will handle customer data responsibly. Also, the validation label alone does not specify a negotiated TLS cipher. [RFC 8446, section 4.1.2](https://www.rfc-editor.org/rfc/rfc8446.html#section-4.1.2) defines cipher-suite negotiation separately from certificate selection. Do not buy OV or EV on the assumption that the validation label means stronger connection encryption.

Let's Encrypt offers [DV certificates, but no OV or EV certificates](https://letsencrypt.org/docs/faq/#what-services-does-lets-encrypt-offer). A requirement for organization validation therefore changes the issuer options.

## Hostname coverage determines which names the certificate can match

![A wildcard covers one label below example.com but excludes the apex and deeper names.](../../assets/ssl-certificate-types-02-coverage.jpg)

List the exact names that visitors use before choosing coverage. For a hypothetical business, the list might contain `example.com`, `www.example.com`, and `shop.example.net`. These names illustrate configuration choices. These names do not identify a deployed service.

| Coverage | Example certificate names | What the example covers |
| --- | --- | --- |
| One exact name | `www.example.com` | That exact hostname |
| Wildcard | `*.example.com` | One label below `example.com`, such as `shop.example.com` |
| Multiple names | `example.com`, `www.example.com`, `shop.example.net` | Each listed name |

A wildcard in `*.example.com` does not match `example.com` or `a.shop.example.com`. [RFC 9525, section 6.3](https://www.rfc-editor.org/rfc/rfc9525.html#section-6.3) limits wildcard matching to one label. Add the apex name separately when the apex must serve HTTPS.

Certificate authorities can place multiple names in the Subject Alternative Name extension. Let's Encrypt [supports multiple domain names in one certificate](https://letsencrypt.org/docs/faq/#can-i-get-a-certificate-for-multiple-domain-names-san-certificates-or-ucc-certificates). “Multi-domain” and “SAN certificate” commonly describe that arrangement. Confirm the issuer's supported combinations and name limits before ordering.

A [wildcard DNS record](/en/blog/wildcard-dns-records/) and a wildcard certificate solve different problems. DNS chooses an address or another DNS answer. The certificate must still match the hostname that the client checks. Creating a DNS wildcard does not add certificate coverage.

Sharing a certificate can simplify an inventory, but sharing a private key also connects the deployments that hold that key. As an operational recommendation, avoid distributing one wildcard private key across unrelated teams merely to reduce certificate count.

## A short inventory makes the certificate request reviewable

1. Record every public hostname that must support HTTPS.
2. Identify the hosting provider or server that manages each certificate.
3. Record any explicit DV, OV, or EV requirement and the requirement owner.
4. Check wildcard boundaries against the hostname inventory.
5. Confirm that the issuer and deployment support the requested names.
6. Assign renewal responsibility before issuing the certificate.

For Let's Encrypt wildcard issuance, the ACME client must use [DNS-01 validation](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge). DNS-01 places a challenge value in DNS. The process needs continued DNS access for automation. Use narrowly scoped DNS credentials, following the issuer's guidance.

For a managed host, check the provider's supported coverage before purchasing anything. A separately purchased certificate does not help if the platform cannot install that certificate. For an existing deployment, follow the [certificate renewal guide](/en/blog/renew-ssl-certificate/) to verify the certificate that visitors receive.

## The sources document validation and hostname matching

- DigiCert, [DV, OV, and EV differences](https://www.digicert.com/difference-between-dv-ov-and-ev-ssl-certificates), validation comparison. Fetched 2026-10-22.
- IETF, [RFC 9525, section 6.3](https://www.rfc-editor.org/rfc/rfc9525.html#section-6.3), wildcard matching. Fetched 2026-10-22.
- IETF, [RFC 8446, section 4.1.2](https://www.rfc-editor.org/rfc/rfc8446.html#section-4.1.2), cipher suites. Fetched 2026-10-22.
- Let's Encrypt, [FAQ](https://letsencrypt.org/docs/faq/) and [DNS-01 challenge](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge), available certificate types and validation. Fetched 2026-10-22.
