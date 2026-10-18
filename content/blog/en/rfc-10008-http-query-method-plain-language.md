---
title: 'RFC 10008: HTTP Finally Has a Proper Way to Ask Complex Questions'
date: '2026-07-10'
language: en
tags: ['http', 'web-standards', 'caching', 'explainer']
authors: ['sami-mishal']
draft: false
format: explainer
description: RFC 10008 adds HTTP QUERY, a standard way to send a large or structured read request without making it look like a data-changing POST.
keywords: ['RFC 10008', 'HTTP QUERY method', 'HTTP caching', 'HTTP POST', 'HTTP GET', 'safe HTTP method', 'idempotent HTTP method', 'request body', 'automatic retries', 'conditional requests', 'web standards']
ogImage: ../../assets/rfc-10008-http-query-method-plain-language-og.jpg
relatedArticles:
  - /en/blog/oauth-cimd-explained-simply/
  - /en/blog/oauth-cimd-domain-trust-ai-agents/
  - /en/blog/agent-native/
  - /en/blog/mcp-quickstart/
  - /en/blog/llms-txt/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/blockchain-concepts/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/ai-agent/
  - /en/glossary/dns/
  - /en/glossary/dns-resolver/
  - /en/glossary/cryptographic-security/
  - /en/glossary/web3/
---

On 2026-06-15, the Internet Engineering Task Force (IETF), the standards body behind HTTP, published [RFC 10008, "The HTTP QUERY Method"](https://www.rfc-editor.org/rfc/rfc10008.html). It gives websites and APIs a standard way to ask a complicated question without making that question look like a command to change something.

The short version is:

- `GET` is good for simple questions that fit in a URL.
- `POST` can carry a large, structured request, but it usually means "process this," which may change data.
- `QUERY` can carry the same kind of structured request as `POST` while clearly saying, "this is only a question."

That distinction matters because an HTTP request rarely travels straight from one app to one server. Browsers, proxies, content delivery networks, caches, retry systems, and security tools may all handle it along the way. They make decisions from the HTTP method they see. Until now, a complex read often had to wear the wrong label.

## The problem: GET is simple, but URLs have limits

Suppose an app wants the latest articles about web standards. A normal `GET` request works well:

```http
GET /feed?q=standards&sort=-published HTTP/1.1
Host: example.org
```

The question is visible in the URL. A cache can understand the request, a browser can bookmark it, and everyone in the request path knows it is meant to read data rather than change it.

Now imagine a search with nested filters, several date ranges, a long list of product IDs, or a full query language. Squeezing all of that into a URL becomes awkward. URLs can also appear in browser history, bookmarks, analytics, and server logs, which may be undesirable for some query details.

Developers sometimes ask whether they can put the query in the body of a `GET` request. In practice, that is unreliable. [HTTP does not define general meaning for content in a GET request](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.3.1), and some servers, clients, and network tools reject or ignore it.

## The usual workaround: use POST for a read

For years, many APIs have sent complicated searches with `POST`:

```http
POST /feed/search HTTP/1.1
Host: example.org
Content-Type: application/json

{"tags":["http","standards"],"sort":"published-descending"}
```

This works between an API and a client that both understand the endpoint. The API documentation can say that this particular `POST` only reads data.

The problem is that the rest of the internet cannot see that private promise. In HTTP, `POST` may change data and may produce a different effect each time it is repeated. A generic cache or proxy therefore has to be cautious. It cannot safely assume that this request is just a search.

RFC 10008 gives the same request an honest label:

```http
QUERY /feed/search HTTP/1.1
Host: example.org
Content-Type: application/json

{"tags":["http","standards"],"sort":"published-descending"}
```

`QUERY` does not require JSON, GraphQL, SQL, or any other particular query language. The server still decides which formats it accepts. The new method simply tells HTTP-aware software what kind of operation this is.

## What QUERY promises

RFC 10008 defines `QUERY` as **safe**, **idempotent**, and **cacheable**.

Those words are precise in HTTP, but their everyday meanings are straightforward:

- **Safe:** the client is not asking or expecting the target resource to change state. Incidental effects such as logging and metrics can still happen, and a server may create a separate helper resource for retrieving results on its own initiative.
- **Idempotent:** sending the same request again has the same intended effect. The result can change if the underlying data changes, but repeating the question does not turn it into a second action.
- **Cacheable:** a cache is allowed to store a response and reuse it for a later matching `QUERY`, as long as normal HTTP caching rules allow it.

Here is the practical comparison:

| Property | `GET` | `QUERY` | `POST` |
|---|---|---|---|
| Client does not ask the target resource to change state | Yes | Yes | Not necessarily |
| Same intended effect when repeated | Yes | Yes | Not necessarily |
| Structured content in the request | No generally defined meaning | Expected | Expected |
| A stored response can answer the same method later | Yes | Yes | No |

The last row needs one qualification. A `POST` response can be stored in limited cases and later used for a `GET` or `HEAD` request. A cache still cannot answer a later `POST` from that stored response. `QUERY` is different because a stored `QUERY` response can answer a later equivalent `QUERY`.

## Why the new label changes real behavior

Calling the method `QUERY` is not cosmetic. HTTP methods are instructions that independent pieces of software can understand without reading an API's documentation.

### Matching queries can use a cached answer

A cache that supports RFC 10008 can store a `QUERY` response and use it when the same query arrives again. The cache key - the information used to decide whether two requests match - includes more than the URL. It also has to account for the request content, its declared format (`Content-Type`), and any compression or other content encoding (`Content-Encoding`).

That prevents two different searches sent to the same endpoint from sharing the wrong answer. A search for red shoes and a search for blue jackets may both use `/catalog/search`, but their request content makes them different cache entries.

Reading the full request before calculating a cache key takes more work than caching a simple `GET`. The RFC recognizes that tradeoff. A server can return a `Location` pointing to an equivalent query resource; an ordinary `GET` to that resource repeats the query without resending the structured request content. A `Content-Location`, by contrast, can identify the particular result representation that was returned.

### Failed requests can be retried more safely

Imagine that a connection drops before the client receives a response. The client may not know whether the server received the request.

Automatically repeating a `POST` can be risky because it might create a second order, charge a card twice, or repeat another action. A generic client normally needs special knowledge before retrying it.

Because `QUERY` is idempotent, the method itself says that an automatic retry has the same intended effect. Retry software no longer needs a private rule for every read-only search endpoint.

### Redirects keep the query intact

Historically, some redirects can turn a `POST` into a `GET`. If that happened to a structured search, the request content could be lost.

[RFC 10008 defines how redirects handle QUERY](https://www.rfc-editor.org/rfc/rfc10008.html#section-2.5). A `301`, `302`, `307`, or `308` points toward a similar `QUERY` at the new address. A server can deliberately use `303 See Other` when it wants the client to switch to `GET` for a separate result resource.

### Clients can check whether a result changed

`QUERY` works with HTTP validators, such as an `ETag`, that label a particular version of a result. A client can send that label in a conditional request asking for the content only if it changed. If it did not, the server can return `304 Not Modified` instead of sending the whole response again.

Servers can also advertise support through an `OPTIONS` request and its `Allow` response field, which list the methods a resource accepts. The new `Accept-Query` response field can tell a client which query formats the resource accepts.

## Why POST could not simply be treated this way

An API can privately define one `POST` endpoint as read-only, but generic HTTP software cannot make that assumption. [POST responses can be cached under specific conditions](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.3.3), but a cache still cannot use one to answer a later `POST`. A successful response to a potentially unsafe method can also invalidate stored responses for the target URL because the request may have changed the resource.

`QUERY` puts the safe, cacheable meaning in the shared protocol instead of leaving it in private API documentation.

## What does not change overnight

Publishing an RFC does not instantly update every browser, server, proxy, or CDN.

Origin servers have to accept `QUERY`. Caches need to understand its special cache key. Retry and redirect code needs to recognize its semantics. Components that do not know the method may reject it or pass it through without using its benefits.

A cache that does not recognize `QUERY` cannot store its response. Because it also does not know that the method is safe, the conservative [HTTP invalidation rule](https://www.rfc-editor.org/rfc/rfc9111.html#section-4.4) applies: after a non-error response, the cache invalidates stored responses for the target URL as though the request might have changed that resource. Support therefore matters for both gaining the new behavior and avoiding that fallback.

There are also normal security and privacy limits:

- A response is only stored when ordinary caching rules permit it. `QUERY` does not override `Cache-Control`, authorization rules, or `Vary`.
- Personal or sensitive queries should still use suitable policies such as `private` or `no-store`.
- Moving query details out of the URL does not make them secret. HTTPS and careful logging policies are still necessary.
- A browser making a `QUERY` to a different site first sends a CORS preflight: a small permission-check request asking whether the server allows that cross-origin method. `QUERY` is not on the browser's built-in safelist, although a JSON `POST` often needs the same check.

The useful claim is not "every query will now be cached." It is "HTTP now has enough information to cache, retry, redirect, and validate a complex read correctly when the software in the path supports the standard."

## It took years to make the details work

The idea is older than the final method name.

- **2008:** [WebDAV SEARCH was standardized in RFC 5323](https://www.rfc-editor.org/rfc/rfc5323.html). It carried a query in request content but was tied to WebDAV and did not define cacheable successful results.
- **2015:** A [general HTTP SEARCH draft](https://datatracker.ietf.org/doc/html/draft-snell-search-method-00) proposed a safe, idempotent method, but its responses were not cacheable.
- **2019:** Discussion restarted at the HTTP Workshop.
- **2021:** The work became an HTTP Working Group draft. Later that year, revision `-02` renamed the method to `QUERY` and introduced the request-content-aware caching rules.
- **2026-06-15:** The work was published as RFC 10008.

The name changed because `SEARCH` was already associated with WebDAV and its own conventions. `QUERY` better described the general operation without borrowing those assumptions.

## The real gain is a shared meaning

A read-only `POST` was never necessarily bad API design. It was a practical workaround for a missing piece of HTTP.

The weakness appeared outside the application. Generic infrastructure saw `POST` and had to treat the request as a possible change. The API knew it was a question, but the protocol did not say so.

`QUERY` moves that knowledge into the request itself. It lets a complicated read say what it really is: a question that can be repeated safely and whose matching answer may be reused.

That is the quiet importance of RFC 10008. It gives independently built software one more piece of shared language, and shared language is what lets the web work as a system rather than a collection of private agreements.

## Sources and further reading

- IETF - [RFC 10008: The HTTP QUERY Method](https://www.rfc-editor.org/rfc/rfc10008.html).
- IETF - [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html), including `GET`, `POST`, safety, and idempotency.
- IETF - [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111.html), including storage, reuse, and invalidation rules.
- IETF - [RFC 5323: WebDAV SEARCH](https://www.rfc-editor.org/rfc/rfc5323.html), the earlier WebDAV-specific method.
- IETF Datatracker - [The first general HTTP SEARCH draft](https://datatracker.ietf.org/doc/html/draft-snell-search-method-00), published on 2015-04-10.
- IETF Datatracker - [HTTP Working Group draft revision `-02`](https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-safe-method-w-body-02), which introduced the `QUERY` name and caching rules.
- IETF Datatracker - [Complete draft history](https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/history/).
