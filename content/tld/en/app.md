---
title: "What is a .app Domain? The Secure TLD for Apps (HTTPS by Default)"
date: '2025-12-10'
updated: '2026-06-10'
language: 'en'
tags: ['tld']
authors: ['namefiteam']
draft: false
description: "What is a .app domain and what is it used for? Learn why Google's .app TLD requires HTTPS (HSTS preload), who should use it, and how to register a tokenized .app at Namefi."
keywords: ['.app domain', '.app TLD', 'app domain', 'app tld', 'app tlds', '.app top level domain', 'what is .app domain used for', 'what is a .app domain', 'why choose .app', 'Google Registry .app', '.app HTTPS required', '.app HSTS preload', 'secure domains HSTS', 'mobile app landing page', 'SaaS domain names', 'developer domains', 'tokenized domains', 'blockchain domains', 'buy .app domain', 'dominio .app', 'dominios app', 'dominio app', 'qué es un dominio .app', 'registrar dominio .app', 'Namefi .app']
---

## **What is a .app Domain?**

The **.app** domain is a generic Top-Level Domain (gTLD) designed for applications, software developers, and technology products. It launched to the general public in **May 2018** and is operated by **Google Registry**, the same operator behind sibling extensions like [.dev](/en/tld/dev/) and .page.

Unlike legacy extensions such as .com or .net, the .app TLD was created with a clear purpose: to give the booming app economy a secure, instantly recognizable home on the internet. Whether your product is a mobile application, a web-based tool, or a backend service, a `.app` address tells users exactly what to expect before they even click the link.

The single most important thing to know about .app is its **security model**: it was the first TLD to require **HTTPS for every site**, enforced through the **HSTS preload list**. We explain exactly how that works—and what it means for you as an owner—further down this page.

For background on how new extensions like this are introduced and governed, see our glossary entries on [ICANN](/en/glossary/icann/) and what a [registrar](/en/glossary/registrar/) actually does.

## **What is a .app Domain Used For?**

Because "app" is a universally understood term, .app bridges the gap between developers and everyday users. Here is how it is most commonly used:

*   **Mobile App Landing Pages:** Companies with apps on the Apple App Store or Google Play use a `.app` domain (e.g., `getproduct.app`) as a central hub for download links, release notes, and support.
*   **Web Applications (SaaS):** Modern software lives in the browser, so SaaS providers use .app for the actual product interface and login, separating it from a marketing site that often sits on a .com.
*   **Developer Portfolios:** Engineers use `lastname.app` or `projectname.app` to showcase coding projects, side projects, and résumés.
*   **Documentation and Support Portals:** Tech companies spin up dedicated .app sites to host API docs, user guides, and status pages.
*   **Product Launches:** On platforms like [Product Hunt](https://www.producthunt.com/), a growing share of new tech launches now use .app addresses, in part because the short, brandable .com market is so saturated.

## **Why Does .app Require HTTPS? (HSTS Preload Explained)**

This is the defining feature of the .app TLD, and it is worth understanding properly because it directly affects how you set up your site.

**Every .app domain is on the HSTS preload list at the registry level.** Google Registry submitted the entire `.app` zone to the **HSTS (HTTP Strict Transport Security) preload list** *before* the TLD launched. That list is honored by Chrome, Firefox, Safari, Edge, and most other modern browsers. The practical consequences:

*   **HTTP is disabled, automatically.** When a browser sees any address ending in `.app`, it upgrades the connection to **HTTPS before the request is even sent**—the user never touches an insecure HTTP connection.
*   **No certificate means no website.** If you register a .app domain but do not configure a valid **TLS/SSL certificate**, browsers will simply refuse to load it (you'll see an error like "HTTP is disabled for this domain"). The domain can be *bought* like any other, but it will not *resolve* in a browser until HTTPS is in place.
*   **You cannot opt out.** Because the requirement is baked into the TLD via the preload list, it applies to every `.app` site, and individual domains cannot be removed from it.

### **What This Means for You as an Owner**

*   **You need a TLS certificate before going live.** The good news: certificates are typically free and automatic. Most hosts (Vercel, Netlify, Cloudflare, GitHub Pages) and tools like [Let's Encrypt](https://letsencrypt.org/) provision and renew them for you with no manual work.
*   **You are secure by default.** Mandatory HTTPS protects your visitors from man-in-the-middle attacks, content injection by ISPs, and credential interception on public Wi-Fi. There is no "I forgot to turn on SSL" failure mode on .app.
*   **It builds trust.** Users see the secure-connection indicator on every visit, with no insecure-page warnings—valuable for any product handling logins, payments, or personal data.
*   **It's good for SEO.** Google has confirmed that HTTPS is a positive ranking signal. Because .app enforces HTTPS by design, you meet that best practice automatically from day one.

## **Notable Entities Using .app**

Since launch, many high-profile companies have adopted the extension to signal security and relevance:

1.  **Cash App (cash.app):** Perhaps the most famous example—Block's peer-to-peer payment service, with the brand name and URL perfectly aligned.
2.  **Google (google.app):** As the registry operator, Google uses the extension for projects and redirects that showcase the namespace.
3.  **Oh Dear (ohdear.app):** A well-known website monitoring service, featured by Google Registry as a flagship .app site.
4.  **Sitata (sitata.app):** A travel safety application that hosts its web-based services on the extension.

These examples show .app is trusted by products handling real users, payments, and sensitive data.

## **Why Choose a .app Domain?**

Choosing the right extension shapes your brand's digital identity. Here's why .app is a strong choice for developers and tech businesses:

*   **Built-in Security:** Enforced HTTPS via HSTS preload means your users are protected by default—and so is your reputation.
*   **Instant Recognition:** The extension describes your product immediately. A `.app` address tells visitors they're heading to a functional tool or application.
*   **SEO Advantage by Default:** Mandatory HTTPS aligns you with Google's ranking best practices from the start.
*   **Availability:** Short, one-word .com names are nearly impossible to find or wildly expensive. The .app namespace still offers excellent availability for concise, memorable, brandable names.
*   **Trust Factor:** In an era of phishing and spoofed sites, a guaranteed secure connection raises user confidence.

If you're weighing .app against other developer-friendly extensions, compare it with our guides to [.dev](/en/tld/dev/) and [.tech](/en/tld/tech/) to find the best fit for your project.

## **Frequently Asked Questions About .app Domains**

**What is a .app domain used for?**
It's used for anything app-related: mobile app landing pages, web apps and SaaS products, developer portfolios, documentation portals, and product launch sites. The extension signals "this is a functional application" at a glance.

**Why does .app require HTTPS?**
Because Google Registry placed the entire .app TLD on the browser HSTS preload list before launch. Browsers automatically upgrade every .app connection to HTTPS, so a valid TLS/SSL certificate is mandatory for the site to load.

**Can I buy a .app domain without an SSL certificate?**
Yes—you can register and own a .app domain without one. But it will not display in a browser until you add a valid TLS certificate. Most modern hosting providers supply these for free and automatically.

**Is .app good for SEO?**
Yes. Google treats HTTPS as a ranking signal, and .app enforces HTTPS by default, so you satisfy that requirement automatically. The extension itself is treated neutrally for ranking, just like other gTLDs.

**Who operates the .app TLD?**
Google Registry operates .app. It is a generic Top-Level Domain (gTLD) available to anyone, not restricted to a specific country or industry.

**Can I tokenize a .app domain?**
Yes. With Namefi you can register a .app domain and mint it as an on-chain asset (an NFT), making it easy to transfer, trade, or use in Web3 applications while keeping full ICANN-compliant ownership. Learn more in [What Are Tokenized Domains?](/en/blog/what-are-tokenized-domains/)

## **Register Your .app Domain at Namefi**

Ready to secure the perfect home for your application? At Namefi, registering your **.app** domain is simple, secure, and future-proof.

Namefi isn't just a standard registrar—we bridge Web2 and Web3. When you register with us, you don't just rent a name; you secure a digital asset that can be tokenized and easily managed or traded on the blockchain.

**Why register with Namefi?**
*   **ICANN Accredited:** Fully compliant, secure registration.
*   **Seamless Web3 Integration:** Mint your domain as an NFT for easier transfer and liquidity.
*   **Competitive Pricing:** Launch your project without breaking the budget.

Don't let your perfect app name get taken by a competitor. Secure your digital real estate today.

[**Register your .app domain at Namefi**](https://namefi.io)
