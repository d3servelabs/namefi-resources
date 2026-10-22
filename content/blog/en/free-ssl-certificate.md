---
title: "A Free SSL Certificate Still Needs Reliable Deployment and Renewal"
description: "Get a free TLS certificate through managed hosting or Let's Encrypt. Check domain control, hostname coverage, deployment, and renewal responsibility."
date: '2026-10-22'
language: en
tags: ['https', 'tls', 'certificates', 'security']
authors: ['namefiteam']
draft: false
format: guide
cluster: domain-security
keywords: ['free SSL certificate', 'free TLS certificate', 'Let’s Encrypt certificate', 'free HTTPS', 'managed SSL certificate', 'ACME client', 'Certbot certificate', 'free wildcard certificate', 'certificate validation', 'SSL certificate cost']
ogImage: ../../assets/free-ssl-certificate-og.jpg
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

**A free SSL certificate can provide HTTPS without a certificate issuance fee.** Start by checking whether the hosting provider manages certificates. If the server is self-managed, consider an ACME client connected to a certificate authority such as Let's Encrypt.

The certificate fee and the work required to run HTTPS are separate. Let's Encrypt [charges no certificate fee](https://letsencrypt.org/docs/faq/#what-does-it-cost-to-use-lets-encrypt-is-it-really-free). Hosting providers can still charge for administration. The operator still needs a working deployment and a renewal plan.

This guide covers the choice between managed certificates and self-managed issuance. The [HTTPS explanation](/en/blog/what-is-https/) covers encryption and authentication. The [renewal guide](/en/blog/renew-ssl-certificate/) covers an existing deployment.

## The hosting arrangement determines the practical route

![Managed hosting handles certificates and renewal, while a self-managed server uses an ACME client.](../../assets/free-ssl-certificate-01-manager.jpg)

Let's Encrypt advises website operators to [check whether the hosting provider supports Let's Encrypt](https://letsencrypt.org/getting-started/#without-shell-access). A managed service can handle the certificate workflow. For example, GitHub Pages supports [HTTPS for correctly configured custom domains](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

| Situation | Start here | Confirm before proceeding |
| --- | --- | --- |
| A provider manages HTTPS | Provider's custom-domain and HTTPS settings | Included certificate, covered hostnames, renewal responsibility |
| You administer the server | Supported ACME client | Server access, deployment integration, automated renewal |
| You need a wildcard certificate | A managed wildcard feature or DNS-01-capable ACME client | DNS automation and restricted credentials |
| You need organization identity checks | An issuer offering the required validation | Whether OV or EV is mandatory |

The table provides selection guidance, rather than a promise about every hosting plan. Check the actual plan and platform before changing DNS or buying an add-on.

For a self-managed server, Let's Encrypt [recommends starting with Certbot](https://letsencrypt.org/getting-started/#with-shell-access). Choose the client instructions for the actual operating system and web server. Avoid copying a command for a different deployment.

Keep the private key under the control of the certificate manager. Let's Encrypt states that [subscribers generate and manage their own private keys](https://letsencrypt.org/docs/faq/#does-lets-encrypt-generate-or-store-the-private-keys-for-my-certificates-on-lets-encrypts-servers). A certificate request does not require sending that private key to the issuer.

## Free issuance still requires domain control and suitable coverage

![HTTP validation serves a challenge file, while DNS validation publishes a TXT record and can support wildcard issuance.](../../assets/free-ssl-certificate-02-validation.jpg)

Let's Encrypt issues [domain-validated certificates](https://letsencrypt.org/docs/faq/#what-services-does-lets-encrypt-offer). DV checks control of a domain. Let's Encrypt does not offer OV or EV. A free DV certificate therefore does not satisfy an explicit requirement for organization validation.

The ACME client proves control through a validation challenge. With [HTTP-01](https://letsencrypt.org/docs/challenge-types/#http-01-challenge), the client serves a challenge file through HTTP on port 80. With [DNS-01](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge), the client publishes a DNS TXT value. Let's Encrypt wildcard issuance requires DNS-01.

DNS-01 automation needs a suitable DNS API. Follow the issuer's recommendation to restrict DNS credentials or separate validation from the web server. A broad DNS credential on a compromised server can expose more than certificate renewal.

Write down the required hostnames before issuing a certificate. A certificate can include [multiple names through Subject Alternative Name](https://letsencrypt.org/docs/faq/#can-i-get-a-certificate-for-multiple-domain-names-san-certificates-or-ucc-certificates). A wildcard such as `*.example.com` matches one label, such as `shop.example.com`. The wildcard does not cover `example.com` or `a.shop.example.com`, under [RFC 9525's matching rules](https://www.rfc-editor.org/rfc/rfc9525.html#section-6.3). Request the apex separately when needed.

The certificate establishes a connection identity, rather than a recommendation to trust the business. The [TLS specification](https://www.rfc-editor.org/rfc/rfc8446.html#section-1) describes protection against eavesdropping, tampering, and message forgery. Evaluate the business and the application separately.

## A deployment checklist prevents an unfinished HTTPS setup

1. Identify the provider or ACME client that will manage the certificate.
2. Confirm the required hostnames and validation method.
3. Complete validation and deploy the certificate to the public TLS endpoint.
4. Open each required hostname over HTTPS in a browser.
5. Check hostname coverage, certificate validity, and browser trust.
6. Confirm automated renewal and assign an owner to investigate failures.
7. Check application resources for remaining HTTP requests before enforcing HTTPS.

At the October 22, 2026 check, [Let's Encrypt's FAQ](https://letsencrypt.org/docs/faq/#what-is-the-lifetime-for-lets-encrypt-certificates-for-how-long-are-they-valid) lists 90-day default certificates and optional six-day certificates. The FAQ recommends renewal every 60 days and every three days, respectively. These periods describe Let's Encrypt's current offerings, rather than every free certificate. Keep automated renewal enabled and monitor the certificate actually served by the public endpoint.

GitHub documents [mixed-content problems](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https#resolving-problems-with-mixed-content) when an HTTPS page requests resources through HTTP. A successfully issued certificate does not repair those application references.

Use the [certificate renewal guide](/en/blog/renew-ssl-certificate/) for public-endpoint inspection and replacement checks. A certificate dashboard can show a successful request while a different server still presents an old certificate. Verify the connection that visitors actually use.

## The sources explain free issuance and operational requirements

- Let's Encrypt, [FAQ](https://letsencrypt.org/docs/faq/), fees, certificate types, private keys, and SAN support. Fetched 2026-10-22.
- Let's Encrypt, [Getting Started](https://letsencrypt.org/getting-started/) and [Challenge Types](https://letsencrypt.org/docs/challenge-types/), managed hosting, ACME clients, and validation. Fetched 2026-10-22.
- GitHub, [Securing your GitHub Pages site with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https), custom domains and mixed content. Fetched 2026-10-22.
- IETF, [RFC 9525, section 6.3](https://www.rfc-editor.org/rfc/rfc9525.html#section-6.3) and [RFC 8446, section 1](https://www.rfc-editor.org/rfc/rfc8446.html#section-1), name matching and TLS goals. Fetched 2026-10-22.
