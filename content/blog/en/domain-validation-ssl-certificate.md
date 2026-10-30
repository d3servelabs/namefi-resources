---
date: '2026-10-30'
language: en
authors:
- namefiteam
draft: false
tags:
- domains
- guide
relatedArticles:
- /en/blog/ssl-certificate-types/
- /en/blog/free-ssl-certificate/
- /en/blog/lets-encrypt-certificate-setup/
- /en/blog/how-to-install-an-ssl-certificate/
- /en/blog/renew-ssl-certificate/
relatedGlossary:
- /en/glossary/certificate-authority/
- /en/glossary/caa/
- /en/glossary/public-key/
- /en/glossary/private-key/
- /en/glossary/subdomain/
title: 'DV SSL Certificates: Do You Need Anything More for Your Website?'
description: Learn what domain validation checks, how DV certificate challenges work, and which coverage and renewal questions to resolve before launch.
keywords:
- domain validation SSL certificate
- DV SSL certificate
- domain validated certificate
- DV certificate meaning
- DV certificate validation
- Lets Encrypt DV
- ACME domain validation
- HTTP-01 challenge
- DNS-01 challenge
- wildcard DV certificate
- certificate hostname matching
- SSL certificate renewal
cluster: domain-basics
format: guide
updated: '2026-10-30'
ogImage: ../../assets/domain-validation-ssl-certificate-og.jpg
relatedTopics:
- /en/topics/domain-security/
- /en/topics/domain-basics/
relatedSeries:
- /en/series/domain-apocalypse/
- /en/series/blockchain-concepts/
---

A domain-validated, or DV, certificate uses a domain-control validation process. A website operator usually starts by checking whether the host already manages the certificate. Let's Encrypt offers [DV certificates without a certificate fee](#lets-encrypt-explains-dv-issuance-and-cost).

The practical question is whether DV meets your project's requirements for validation, hostname coverage, and operation. A specific contract or organizational requirement may call for another certificate product. Read that requirement before choosing based on the label alone.

This guide explains the DV decision and setup boundaries. The [certificate types guide](/en/blog/ssl-certificate-types/) provides a broader comparison.

## Domain validation checks control through a specific challenge

Let's Encrypt documents automated challenges that establish domain control. HTTP-01 places a challenge response on the web server. DNS-01 publishes a challenge response in DNS. [The official challenge guide explains both methods](#lets-encrypt-explains-domain-control-challenges).

A successful challenge establishes the control needed for the issuance process. Do not describe a DV certificate as proof of a company's business quality or a promise that every page is safe.

As editorial advice, define what your users or counterparties actually require. A technical requirement to serve HTTPS differs from a procurement requirement for a particular validation product. Keep the written requirement beside the certificate order.

Ask the website host which certificate the service already provides and which names the service covers. Identify the renewal owner before adding another certificate product to the account.

![DV checks domain control, OV adds organization checks, and EV adds detailed identity checks.](../../assets/ssl-certificate-types-01-identity.jpg)

## A managed host can simplify the operating responsibility

Start in the host's domain or certificate settings. Check whether the exact domain has completed validation and whether the host reports an active certificate. Use the provider's documented route for connecting a custom domain.

As practical advice, avoid creating a second certificate workflow before understanding the existing one. Another certificate order can add work without resolving an incorrect DNS record or an incomplete hosting configuration.

Write down who controls each required component:

| Component | Question to answer |
| --- | --- |
| Registration account | Who can manage the domain's registration and recovery? |
| Authoritative DNS | Who can publish the required challenge record? |
| Web hosting | Who can serve a challenge response or install the certificate? |
| Certificate automation | Who monitors renewal and validation failures? |
| Application testing | Who checks the actual public hostname after issuance? |

The table is an operating checklist. The provider's actual product determines which responsibilities the provider accepts.

If you manage the server yourself, select an established ACME client supported by your environment. Let's Encrypt's FAQ recommends starting with Certbot when choosing a client. [The FAQ explains the supported issuance approach](#lets-encrypt-explains-dv-issuance-and-cost).

## HTTP validation and DNS validation have different prerequisites

For HTTP-01, Let's Encrypt gives the ACME client a token. The client serves the required response below `/.well-known/acme-challenge/`. Let's Encrypt retrieves the response to evaluate the challenge. [The documented HTTP-01 procedure uses port 80](#lets-encrypt-explains-domain-control-challenges).

Follow the hosting provider's or client's documented network requirements. Do not apply a blanket firewall change unrelated to the challenge. If several servers answer for the domain, confirm the challenge response reaches the required destinations.

HTTP-01 does not support wildcard issuance in Let's Encrypt's documented process. DNS-01 can support wildcard issuance by proving control through a TXT record. [The challenge guide distinguishes those capabilities](#lets-encrypt-explains-domain-control-challenges).

For DNS-01, publish the exact token at the name supplied by the client. The normal challenge label is `_acme-challenge` under the domain. Check the complete published name instead of assuming that a dashboard's host field preserves the input literally.

As security advice, use narrowly scoped DNS automation credentials when the provider supports them. Keep credentials out of public DNS values, screenshots, and certificate request notes. A challenge response and an API credential serve different purposes.

![HTTP validation serves a challenge file, while DNS validation publishes a TXT record and can support wildcard issuance.](../../assets/free-ssl-certificate-02-validation.jpg)

## Hostname coverage needs a separate review

Write the complete list of hostnames that users will visit. Include the apex domain, `www`, and application subdomains when relevant. Compare that list with the certificate's actual identifiers.

Certificate name matching follows specific rules. RFC 9525 says a wildcard can match only one label in a reference identifier. [The standard defines that boundary](#rfc-9525-defines-certificate-name-matching).

For a hypothetical certificate containing `*.example.com`, review `shop.example.com` separately from `example.com` and `api.shop.example.com`. The wildcard does not provide a general instruction to trust every possible depth below the domain.

Treat the example as a coverage illustration, not an issued certificate. Confirm the actual certificate identifiers and client behavior before declaring a hostname ready.

If a hostname fails validation in the browser, inspect the certificate presented for that hostname. Do not assume that successful issuance for another hostname resolves the error. RFC 9525 requires the client to find an appropriate [reference-identifier match](#rfc-9525-defines-certificate-name-matching).

![A wildcard covers one label below example.com but excludes the apex and deeper names.](../../assets/ssl-certificate-types-02-coverage.jpg)

## Renewal must remain part of the service after issuance

A certificate order is only one step in the operating process. As practical advice, identify how the service renews the certificate and which person receives failures. Keep the automation configuration accessible to the responsible administrator.

If DNS-01 uses an API integration, include the integration in credential rotation and provider-change planning. If HTTP-01 depends on a hosting route, preserve the route during application changes.

Test the renewal mechanism through the client's documented test procedure. Record the outcome rather than assuming that an initially successful challenge proves future automation will work.

Our [certificate renewal guide](/en/blog/renew-ssl-certificate/) provides a separate maintenance workflow. Use that guide after selecting the validation and hosting arrangement.

![Managed hosting handles certificates and renewal, while a self-managed server uses an ACME client.](../../assets/free-ssl-certificate-01-manager.jpg)

## Choose another product only when the requirement calls for it

Ask the certificate provider to explain any organization-validation requirement in the proposed order. Compare that answer with the actual contract, customer request, or internal policy. Do not buy an upgrade solely because the product name sounds more secure.

Let's Encrypt states that its service provides DV rather than organization-validated or extended-validation certificates. [The FAQ establishes that product boundary](#lets-encrypt-explains-dv-issuance-and-cost). Another validation requirement therefore needs another suitable provider or product.

For a site whose requirements fit DV, finish the practical checks: domain validation, correct hostname coverage, active deployment, and functioning renewal. Keep browser certificate validation enabled throughout testing. Fix the failed configuration instead of suppressing the warning.

Start with the host's existing certificate capability. Add a separate certificate workflow only after identifying the exact requirement and the person who will operate the workflow.

## Sources and further reading

### Lets Encrypt explains DV issuance and cost

[Lets Encrypt explains DV issuance and cost](https://letsencrypt.org/docs/faq/#:~:text=Domain%20Validation). Checked 2026-10-30.

### Lets Encrypt explains domain control challenges

[Lets Encrypt explains domain control challenges](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge). Checked 2026-10-30.

### RFC 9525 defines certificate name matching

[RFC 9525 defines certificate name matching](https://www.rfc-editor.org/rfc/rfc9525.html#section-6.3). Checked 2026-10-30.
