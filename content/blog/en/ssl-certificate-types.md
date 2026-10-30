---
title: What Is an SSL Certificate? What Your Website Actually Needs
description: Choose a TLS certificate by hostname coverage, identity requirements, hosting support, and renewal responsibility instead of a confusing product label.
date: '2026-10-22'
language: en
tags:
- https
- tls
- certificates
- security
authors:
- namefiteam
draft: false
format: guide
cluster: domain-security
keywords:
- SSL certificate
- what is an SSL certificate
- TLS certificate
- SSL certificate types
- DV certificate
- OV certificate
- EV certificate
- wildcard certificate
- SAN certificate
- website SSL
- certificate hostname coverage
- TLS certificate renewal
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
updated: '2026-10-30'
---

**An SSL certificate is the common product name for a certificate used in a TLS-protected connection.** The client checks the service identity against the requested hostname. For a website, first check whether the hosting platform manages certificates, then identify the exact hostnames and any organization-identity requirement. [The TLS identity standard describes certificate-based service verification](#the-tls-identity-standard-defines-the-matching-task).

Certificate selection combines separate questions. DV, OV, and EV describe validation. Exact-name, wildcard, and multiple-name coverage describe which names a certificate can match. A certificate can combine a validation level with a coverage choice.

## A managed host may already provide the required workflow

Before buying a separate certificate, open the host's documentation for custom-domain HTTPS. Confirm whether the host issues and renews certificates, which names the workflow supports, and whether the platform permits installing an externally purchased certificate.

GitHub Pages provides a concrete example: correctly configured custom-domain sites support HTTPS and HTTPS enforcement. [GitHub documents that workflow](#github-documents-managed-https-for-custom-domains). The example shows why the hosting platform should be the first stop, rather than proof that every host supports identical options.

For a self-managed deployment, identify the certificate client, validation method, server configuration, and renewal owner. Use the [HTTPS guide](/en/blog/what-is-https/) for the connection model. This guide addresses the certificate decision rather than every server-specific installation command.

![Managed hosting handles certificate work while a self-managed server needs a certificate client.](../../assets/free-ssl-certificate-01-manager.jpg)

## Validation levels describe identity checks rather than cipher strength

DigiCert's current documentation defines [domain validation](/en/blog/domain-validation-ssl-certificate/) as confirming that the requester controls the requested domain names. The issuer does not verify organization identity for that DV certificate. [The DV documentation states those limits](#digicert-defines-domain-validation).

Organization validation adds verification of the organization's legal existence. Extended validation adds further checks, including operational status and approval by a verified representative. [The OV documentation describes organization validation](#digicert-defines-organization-validation). [The EV documentation describes the additional validation](#digicert-defines-extended-validation).

| Validation choice | Question for the site owner |
| --- | --- |
| DV | Does the requirement concern an authenticated connection to the requested names? |
| OV | Does a documented requirement call for verified organization identity? |
| EV | Does a documented requirement specifically call for extended validation? |

The questions are selection advice. Confirm a customer's or organization's actual requirement before purchasing a certificate. Do not infer a legal or contractual requirement merely from the site accepting payments.

TLS negotiates cipher suites through a separate handshake mechanism. The validation label does not itself select the negotiated symmetric cipher. [RFC 8446 defines the cipher-suite offer](#the-tls-standard-defines-cipher-negotiation).

Let's Encrypt offers DV certificates and does not offer OV or EV. [The issuer's FAQ explains its service scope](#lets-encrypt-describes-validation-and-name-coverage). An explicit organization-validation requirement therefore changes the issuer shortlist.

![DV, OV, and EV specify different identity validation checks.](../../assets/ssl-certificate-types-01-identity.jpg)

## Hostname coverage needs an exact inventory

List every name visitors use, including names that redirect to another hostname. The following hypothetical inventory uses [reserved example domains](#the-ietf-reserves-example-domains).

| Certificate name or names | Matching result in the example |
| --- | --- |
| `www.example.com` | Matches the exact listed hostname |
| `*.example.com` | Can match `shop.example.com` |
| `*.example.com` alone | Does not match the apex `example.com` |
| `*.example.com` alone | Does not match `a.shop.example.com` |
| `example.com`, `www.example.com`, `shop.example.net` | Lists several requested names separately |

RFC 9525 limits a certificate wildcard to one label in the reference name. The wildcard rules also require the permitted wildcard in the leftmost label. [The identity standard defines those limits](#the-tls-identity-standard-limits-wildcard-matching).

Multiple-name coverage uses the Subject Alternative Name mechanism. Let's Encrypt confirms that one certificate can contain several names through SAN. [The FAQ describes multiple-name certificates](#lets-encrypt-describes-validation-and-name-coverage).

A wildcard DNS record does not add a name to a certificate. DNS wildcard matching and certificate wildcard matching follow different rules. RFC 9525 explicitly distinguishes the two. [The wildcard section states the distinction](#the-tls-identity-standard-limits-wildcard-matching). See the [wildcard DNS guide](/en/blog/wildcard-dns-records/) for the DNS configuration task.

![A certificate wildcard covers one label and excludes the apex and deeper names.](../../assets/ssl-certificate-types-02-coverage.jpg)

## Issuance and renewal require a working validation path

A certificate authority must validate the requested domain names through its supported procedure. Let's Encrypt documents HTTP-01 and DNS-01 challenges. HTTP-01 retrieves a challenge file through port 80. DNS-01 checks a TXT record and supports wildcard issuance. [The challenge documentation explains both paths](#lets-encrypt-documents-domain-control-challenges).

Choose a procedure that the deployment can maintain. For example, a DNS validation workflow needs appropriate DNS access when validation runs. As operational advice, scope automation credentials to the required DNS operation and keep an accountable renewal owner.

Do not consider issuance complete merely because the certificate client reports success. Verify the certificate visitors actually receive at the intended hostname. With curl available, a basic diagnostic request is:

```bash
curl --head --verbose https://www.example.com/
```

Replace the example hostname. curl verifies the certificate signature and requested server name by default. [The verification guidance describes that check](#curl-documents-certificate-and-hostname-verification). Keep verification enabled during the test.

The deployment also needs the corresponding private key for certificate authentication. TLS's CertificateVerify message proves possession of that key. [RFC 8446 defines that proof](#the-tls-standard-explains-private-key-possession). As security advice, restrict private-key access and avoid distributing one key across unrelated deployments for convenience.

![HTTP and DNS validation use different domain-control checks.](../../assets/free-ssl-certificate-02-validation.jpg)

## A connection certificate does not certify an honest business

Chromium explains that a secure connection indicator does not establish website trustworthiness. A phishing site can also use HTTPS. [The browser team's explanation states that boundary](#chromium-separates-connection-security-from-website-safety).

Use organization validation when a real identity requirement calls for organization validation. Continue to review the site's accounts, application permissions, data handling, and domain administration. A certificate cannot replace those operating decisions.

Before ordering, finish a short request record: exact hostnames, hosting platform, required validation level, selected issuer, validation method, installation owner, and renewal owner. If the platform already handles the required coverage, follow that workflow first. If another requirement remains, buy the certificate that satisfies the documented requirement and verify the deployed result.

## Sources and further reading

### The TLS identity standard defines the matching task

[IETF RFC 9525, section 1.1](https://www.rfc-editor.org/rfc/rfc9525.html#section-1.1). Fetched 2026-10-30.

### GitHub documents managed HTTPS for custom domains

[GitHub Docs, About HTTPS and GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https#about-https-and-github-pages). Fetched 2026-10-30.

### DigiCert defines domain validation

[DigiCert CertCentral, Domain Validation](https://docs.digicert.com/en/certcentral/get-started/understand-how-certcentral-works/understand-certificate-validation/validation-levels-in-certcentral/domain-validation--dv-.html#:~:text=DigiCert%20confirms%20that%20the%20requester). Fetched 2026-10-30.

### DigiCert defines organization validation

[DigiCert CertCentral, Organization Validation](https://docs.digicert.com/en/certcentral/get-started/understand-how-certcentral-works/understand-certificate-validation/validation-levels-in-certcentral/organization-validation--ov-.html#:~:text=DigiCert%20confirms%20domain%20control). Fetched 2026-10-30.

### DigiCert defines extended validation

[DigiCert CertCentral, Extended Validation](https://docs.digicert.com/en/certcentral/get-started/understand-how-certcentral-works/understand-certificate-validation/validation-levels-in-certcentral/extended-validation--ev-.html#:~:text=DigiCert%20performs%20the%20most%20thorough). Fetched 2026-10-30.

### The TLS standard defines cipher negotiation

[IETF RFC 8446, section 4.1.2](https://www.rfc-editor.org/rfc/rfc8446.html#section-4.1.2). Fetched 2026-10-30.

### Lets Encrypt describes validation and name coverage

[Let's Encrypt FAQ, validation and multiple-name questions](https://letsencrypt.org/docs/faq/#what-services-does-let-s-encrypt-offer). Fetched 2026-10-30.

### The IETF reserves example domains

[IETF RFC 2606, section 3](https://www.rfc-editor.org/rfc/rfc2606.html#section-3). Fetched 2026-10-30.

### The TLS identity standard limits wildcard matching

[IETF RFC 9525, section 6.3](https://www.rfc-editor.org/rfc/rfc9525.html#section-6.3). Fetched 2026-10-30.

### Lets Encrypt documents domain control challenges

[Let's Encrypt, Challenge Types](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge). Fetched 2026-10-30.

### curl documents certificate and hostname verification

[curl, SSL certificate verification](https://curl.se/docs/sslcerts.html#:~:text=curl%20does%20certificate%20verification%20by%20default). Fetched 2026-10-30.

### The TLS standard explains private key possession

[IETF RFC 8446, section 4.4.3](https://www.rfc-editor.org/rfc/rfc8446.html#section-4.4.3). Fetched 2026-10-30.

### Chromium separates connection security from website safety

[Chromium Blog, An Update on the Lock Icon](https://blog.chromium.org/2023/05/an-update-on-lock-icon.html#:~:text=not%20an%20indicator%20of%20website%20safety). Fetched 2026-10-30.
