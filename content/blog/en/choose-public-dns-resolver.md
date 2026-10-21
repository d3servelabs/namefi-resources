---
title: "A Public DNS Resolver Should Match Your Privacy and Recovery Needs"
description: 'Choose a public DNS resolver by privacy, DNSSEC, filtering, and recovery behavior, then test the settings your devices actually use.'
date: '2026-10-21'
language: en
tags: ['dns', 'privacy', 'networking', 'security']
authors: ['namefiteam']
draft: false
format: guide
cluster: domain-security
keywords: ['public DNS resolver', 'choose DNS resolver', 'Cloudflare DNS', 'Google Public DNS', 'Quad9 DNS', 'DNS privacy', 'DNSSEC validation', 'DNS filtering', 'encrypted DNS', 'DNS fallback', 'DNS troubleshooting', 'recursive DNS']
ogImage: ../../assets/choose-public-dns-resolver-og.jpg
relatedArticles:
  - /en/blog/dns-over-https-vs-dns-over-tls/
  - /en/blog/nslookup-specific-dns-server/
  - /en/blog/root-dns-servers/
  - /en/blog/primary-secondary-dns/
  - /en/blog/dns-is-the-control-plane/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/dns-resolver/
  - /en/glossary/dnssec/
  - /en/glossary/ttl/
  - /en/glossary/dns-hijacking/
relatedTopics:
  - /en/topics/domain-basics/
  - /en/topics/domain-security/
relatedSeries:
  - /en/series/domain-investor-field-guide/
  - /en/series/domain-apocalypse/
---

Start with the policy you want, then choose a resolver and [test the complete connection](/en/blog/isp-dns-vs-public-resolver/). An easy-to-remember address does not settle the decision.

Cloudflare's standard service suits readers who want a documented option without content filtering. Quad9's secure service suits readers who want threat blocking. Google Public DNS offers another documented option with DNSSEC validation and encrypted transports. These are conditional starting points, not a universal ranking.

A useful choice must survive ordinary work: browser lookups, video calls, a corporate VPN, and a network that blocks the selected encrypted connection. The following process compares three public services and shows how to test a reversible change. The process does not rank every available resolver.

## A resolver choice changes who answers your device

![A resolver choice changes who answers your device.](../../assets/choose-public-dns-resolver-01-resolver-boundaries.jpg)

The [Domain Name System](/en/glossary/dns/) supplies information associated with names, including addresses that applications use for connections. A [DNS resolver](/en/glossary/dns-resolver/) retrieves answers for clients and can reuse cached information. The resolver follows referrals when local information cannot answer the query, as [RFC 1034 explains](https://www.rfc-editor.org/rfc/rfc1034.html#section-5.3.3).

Changing a device's resolver selects a different service for lookups. Changing a domain's authoritative nameservers changes where the domain publishes DNS information. A public resolver setting cannot repair a missing record at the authoritative source. The distinction matters when a website fails immediately after a domain change.

Begin by writing one requirement in plain language. For example: “I want encrypted lookups without content filtering,” or “I want a resolver that blocks known malicious domains.” A third requirement might preserve a company's internal names through a managed VPN. Each requirement leads to different settings, even when several providers support the same transport.

Separate four questions before comparing brands. Who receives the query? Does the client encrypt the connection? Does the resolver validate signed DNS data? Does the selected service apply a block policy? A provider name alone answers none of these questions completely.

[DNSSEC](/en/glossary/dnssec/) authenticates signed DNS data and protects integrity. DNSSEC does not encrypt queries or determine whether a website deserves trust. [RFC 4033 describes these limits](https://www.rfc-editor.org/rfc/rfc4033.html#section-4). A correctly signed record can still point to a harmful website that the domain operator intentionally published.

Encrypted DNS protects a different boundary. DNS over TLS secures the connection between a client and a resolver, as [RFC 7858 specifies](https://www.rfc-editor.org/rfc/rfc7858.html#section-1). The resolver still needs to process the query. Encryption therefore does not remove the need to examine the operator's data policy.

The client boundary also matters. A browser can select its own encrypted resolver while another application uses the operating system's resolver. Mozilla documents browser-specific [protection levels and fallback behavior](https://support.mozilla.org/en-US/kb/dns-over-https#w_protection-levels-explained). A successful browser check cannot establish that every application follows the same route.

For a managed work device, begin with the administrator's configuration. Treat the required internal naming behavior as a requirement of the comparison. Public DNS can remain useful for a personal device without becoming an appropriate replacement for every workplace configuration.

## Provider policies narrow the practical shortlist

![Provider policies narrow the practical shortlist.](../../assets/choose-public-dns-resolver-02-policy-shortlist.jpg)

Compare the exact service variant, not just the company. Cloudflare's standard resolver has no content filtering. Cloudflare publishes separate Families services for malware filtering and adult-content filtering. The [official address list identifies each variant](https://developers.cloudflare.com/1.1.1.1/ip-addresses/).

The following shortlist focuses on choices that the current documentation supports. The final column states what a reader should verify before deployment.

| Service | Useful starting point | Check first |
| --- | --- | --- |
| Cloudflare standard | No content filtering | Logging policy and encryption |
| Cloudflare Families | Category filtering | Correct filter variant |
| Quad9 secure | Threat blocking | False-positive recovery |
| Google Public DNS | Validating public DNS | Data policy and local tests |

Cloudflare lists `1.1.1.1` and `1.0.0.1` for its standard IPv4 service. Quad9 lists `9.9.9.9` and `149.112.112.112` for its secure service. Google lists `8.8.8.8` and `8.8.4.4`. These pairs identify services, but entering an address alone does not establish an encrypted connection. Follow the provider's instructions for the chosen transport and platform.

Read privacy commitments as policies with defined scope. Cloudflare describes limited resolver logs, deletion commitments, and an exception for sampled network packets. Cloudflare also describes APNIC's access to anonymized query metadata. These qualifications make [the published policy](https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/) more informative than a blanket “no logs” label.

Google separates temporary and permanent DNS logs. Google says temporary logs containing client addresses and queries enter deletion processes within 24–48 hours. Security and abuse issues can extend retention. Google describes permanent sampled logs that replace the client address with location information. Google also says personal DNS information does not support ad targeting. Read [the complete policy](https://developers.google.com/speed/public-dns/privacy) before accepting the service's data handling.

Quad9's [privacy policy](https://quad9.net/privacy/policy/) distinguishes normal service conditions from anomalous conditions governed by a separate policy. The distinction matters when comparing a concise privacy claim with the full operating terms. A provider's policy remains a commitment from the provider, not a protocol property or an anonymity guarantee.

For validation, Google explicitly documents [DNSSEC support](https://developers.google.com/speed/public-dns/docs/security#dnssec). Quad9 documents DNSSEC failures in its troubleshooting guidance. Check the chosen variant's current documentation rather than assuming that every address from one operator has identical behavior.

Performance requires a local trial. Measure lookup behavior on the network that will use the service, at more than one time. Compare normal application use alongside DNS timings. This guide supplies no measured basis for declaring one provider universally faster.

A useful trial includes repeated queries and names that the client has not recently requested. Cached answers can make a repeated lookup look fast. Record failures as carefully as response times. A small timing advantage has little practical value if required applications stop resolving names.

## Filtering and validation require different recovery decisions

![Filtering and validation require different recovery decisions.](../../assets/choose-public-dns-resolver-03-failure-diagnosis.jpg)

Threat blocking and DNSSEC validation can both stop a lookup, but the appropriate response differs. A filtering service can reject a name because the service classifies the name as harmful. A validating resolver can reject signed data because the validation process cannot establish authenticity.

Quad9 documents a concrete distinction: a blocked name can produce `NXDOMAIN`, while DNSSEC authentication failure produces `SERVFAIL`. A genuinely nonexistent name can also produce `NXDOMAIN`. Consult Quad9's [block identification guidance](https://docs.quad9.net/FAQs/#identifying-a-quad9-block), including the blocked-domain tester, before interpreting a browser's generic error.

Do not turn these observations into a universal error decoder. `SERVFAIL` can indicate problems beyond validation. A resolver response describes a lookup result, not a complete explanation of the website's condition. Google's [troubleshooting guide](https://developers.google.com/speed/public-dns/docs/troubleshooting#problems_resolving_a_domain) provides additional diagnostics for validation and nameserver problems.

Consider a hypothetical household using threat blocking. One required website stops loading while unrelated sites work. Record the full hostname and check the provider's diagnostic service. If the provider confirms a block, review the website before requesting a classification correction. Automatically switching to an unfiltered service would discard the household's original requirement.

Now consider a hypothetical domain owner whose signed domain returns validation errors. The owner should inspect the domain's DNSSEC configuration with the DNS operator. The owner should preserve validation for normal browsing. Making a misconfigured domain load through a different policy does not repair the underlying signature problem.

Filtering also has limits of granularity. DNS lookups concern names, so a resolver choice does not provide a complete review of page content or application behavior. Treat DNS filtering as one control in a broader device configuration. Do not promise that a threat-blocking resolver will detect every harmful destination.

Decide how a false positive will reach someone who can act. A household may need one person to review reports. A small office may need a support contact and a documented exception process. The operational burden belongs in the selection decision, alongside the filter's stated purpose.

Check optional information sharing as well. Quad9's [ECS explanation](https://docs.quad9.net/FAQs/#what-is-edns-client-subnet-ecs) says an ECS variant can send part of the client address to authoritative servers. The information can help content providers choose geographically suitable answers. The option also changes upstream disclosure. Select an ECS variant deliberately rather than copying a nearby address from a comparison chart.

Different answers do not automatically establish [DNS hijacking](/en/glossary/dns-hijacking/). A filter policy, an unexpired cache entry, or an authoritative configuration difference may explain the result. Compare evidence before assigning a cause. Escalate a suspected interception with the observed hostname, response, time, and network details.

## A reversible trial verifies the resolver and its fallback

![A reversible trial verifies the resolver and its fallback.](../../assets/choose-public-dns-resolver-04-reversible-trial.jpg)

Start on one personal device that can tolerate a configuration test. Save the current DNS settings and note whether the network supplies DNS automatically. Google explicitly recommends [preserving the previous settings](https://developers.google.com/speed/public-dns/docs/using#important_before_you_start) before a change. Keep the recovery instructions available without depending on a working DNS lookup.

Choose one configuration level for the first trial: browser, operating system, or router. Record the chosen level so the result has a clear scope. Router settings can affect other people, so expand the trial only after the individual device works. Follow current vendor instructions instead of copying instructions for another operating system version.

Check IPv4 and IPv6 separately when the device offers separate DNS settings. The provider documentation lists addresses for both families. Also inspect browser secure-DNS settings and VPN behavior. A device can contain several relevant settings, and a screenshot of one field cannot establish the path of every query.

For a basic comparison, use `nslookup example.com 9.9.9.9` and `nslookup example.com 8.8.8.8` where the tool is available. These commands request answers from named servers without changing stored settings. Treat the results as direct lookup tests. The commands do not prove that the browser uses the tested service or that the transport encrypts traffic.

Quad9 supplies a separate protocol check. A lookup with `dig +short txt proto.on.quad9.net.` can report how Quad9 received the query. The [official protocol test](https://docs.quad9.net/FAQs/#protocol-test-confirm-on-which-protocol-quad9-received-your-query) lists responses for plaintext DNS, DoH, and DoT. Run the test through the configured system path and interpret the result within that path's scope.

Exercise ordinary tasks after configuration. Open required sites, reconnect the VPN, and test another application that uses names. Repeat the checks after changing networks. A controlled trial should include a return to the saved settings so the recovery procedure receives a practical test.

Read the client's failure policy before relying on encryption. Firefox's default protection can fall back to default resolvers when problems occur. Max protection instead displays a warning when secure resolution fails. [Mozilla documents the differences](https://support.mozilla.org/en-US/kb/dns-over-https#w_protection-levels-explained). Select availability or strict encrypted resolution consciously, and check the equivalent behavior in the actual client.

Keep alternate servers consistent with the intended policy unless the client explicitly supports a more precise arrangement. An unfiltered alternate does not preserve an all-filtered requirement. A plaintext fallback does not preserve an all-encrypted requirement. Document the acceptable failure behavior before adding a second provider.

Finally, allow for cached answers. The [TTL](/en/glossary/ttl/) limits ordinary cache reuse, and Google documents stale-answer diagnostics after DNS changes. Compare the exact hostname and record type before deciding that the new service failed. Restore the previous settings if the trial breaks required access, then investigate with the saved observations.

The result should be a short configuration record: selected service, exact variant, transport, configuration level, fallback behavior, and recovery method. That record provides a stronger basis for continued use than a speed ranking or a familiar address.

## Sources and further reading

All sources below were fetched on 2026-10-21 UTC. Product policies and platform behavior can change.

- Cloudflare: [IP addresses](https://developers.cloudflare.com/1.1.1.1/ip-addresses/), “1.1.1.1” and “1.1.1.1 for Families.”
- Cloudflare: [Public DNS Resolver privacy](https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/), privacy commitments and APNIC sharing.
- Google: [Your Privacy](https://developers.google.com/speed/public-dns/privacy), temporary and permanent DNS logs.
- Google: [Get Started](https://developers.google.com/speed/public-dns/docs/using), preparation and IP addresses.
- Google: [Security Benefits](https://developers.google.com/speed/public-dns/docs/security#dnssec), DNSSEC and encrypted transports.
- Quad9: [Services](https://docs.quad9.net/services/), secure service and other variants.
- Quad9: [Data and Privacy Policy](https://quad9.net/privacy/policy/), applicability and IP-address treatment.
- Quad9: [FAQs](https://docs.quad9.net/FAQs/), protocol test, block identification, and ECS.
- Mozilla: [Firefox DoH protection levels](https://support.mozilla.org/en-US/kb/dns-over-https#w_protection-levels-explained).
- IETF: [RFC 4033](https://www.rfc-editor.org/rfc/rfc4033.html#section-4), sections 3–5 and 12.
- IETF: [RFC 7858](https://www.rfc-editor.org/rfc/rfc7858.html#section-1), introduction and TLS sessions.
- IETF: [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034.html#section-5.3.3), resolver algorithm and cache behavior.
- Google: [Troubleshooting](https://developers.google.com/speed/public-dns/docs/troubleshooting), domain failures and incorrect answers.
