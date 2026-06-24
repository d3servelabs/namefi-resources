---
title: 301 Redirect
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: An HTTP status telling browsers and search engines that a page has permanently moved to a new URL.
keywords: ['301 redirect', 'permanent redirect', 'http redirect', 'seo', 'domain forwarding', 'link equity']
also_known_as: ['Permanent Redirect']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
---

A **301 redirect** (also called a *permanent redirect*) is an HTTP response code that signals to browsers and search engines that a resource has permanently moved to a new URL, and that all future requests should go to the new destination. The "301" distinguishes it from a temporary 302 redirect: with a 301, Google consolidates ranking signals — including link equity and [anchor text](/en/glossary/anchor-text/) — from the old URL to the new one, making it the standard mechanism for [domain forwarding](/en/glossary/domain-forwarding/) without sacrificing [SEO](/en/glossary/seo/) value. In practice, this means a domain investor can acquire an aged domain with strong [domain authority](/en/glossary/domain-authority/) and point it at a target site, passing much of that accumulated link equity through to the destination. The transfer is not immediate — Google typically consolidates signals over a period of weeks — and not always 100%, so 301s are valuable but not a perfect equity transplant.
