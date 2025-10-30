---
title: "Behind the Scenes of the Oct 20, 2025 AWS Outage"
date: '2025-10-23'
language: en
tags: ['dns', 'aws', 'resilience', 'incident-explainer']
authors: ['namefiteam']
draft: false
description: A registrar/DNS‑operations perspective on the October 20, 2025 AWS incident, how DNS actually works, why this failure propagated so widely, and what resilient internet teams can do about it.
keywords: ['dns', 'aws outage', 'control plane', 'dynamodb', 'us-east-1', 'dns caching', 'cloud resilience', 'multi-signer dns', 'incident response']
---

![Illustration of resilient DNS control planes steering around a regional outage](/assets/blog/dns-is-the-control-plane/hero.png)

On October 20, 2025, parts of the internet had a bad morning. Amazon Web Services (AWS) reported problems in its Northern Virginia data center cluster (US-EAST-1). For several hours, many popular apps and sites were slow or unavailable—[Vercel](https://downdetector.com/status/vercel/), [Figma](https://downdetector.in/status/figma/), [Venmo](https://downdetector.in/status/venmo/), and [Snapchat](https://downdetector.com/status/snapchat/), to name a few. News outlets and monitoring services recorded millions of user reports, and even some Amazon services flickered.

Namefi customers, however, saw a quiet day. Our systems kept running as usual—not by chance, but because we invest heavily in the engineering and operational rigor that makes DNS resolution resilient to regional hiccups.

That said, the Namefi engineering team reviews global outages like this and learns from them, as it does for all major incidents. Here is what has been learned so far:

*Note: At the time of writing, the incident is still developing. This post may be updated from time to time. If you see any mistakes or corrections needed, please share with dev-team at [namefi.io](http://namefi.io). We appreciate it.*

## What actually went wrong in AWS—without the jargon

Every app and website needs a way to “look up” where to connect. That address book of the internet is called DNS—short for Domain Name System. On Oct 20, a naming problem inside AWS meant some computers couldn’t find a key AWS database service by name. If the address book can’t provide the right entry at the right moment, even healthy systems can’t talk to each other.

AWS fixed the immediate naming problem within a couple of hours and then spent the rest of the day letting backlogs clear and easing systems back to normal. By late afternoon (Pacific time), AWS said everything was operating normally again, though some services took longer to catch up.

## Who was affected (and what that says about today’s internet)

The footprint was broad and familiar to everyday users. Consumer apps such as Snapchat and Reddit, communications like Zoom and Signal, and gaming platforms including Fortnite and Roblox reported issues. Financial services saw interruptions at Coinbase and Robinhood, while in the UK a number of public-facing services—including HMRC (the tax portal) and banks under the Lloyds/Halifax/Bank of Scotland group—experienced outages. Telecom customer apps from Vodafone and BT were also affected, even though their core networks remained available.

Amazon’s own properties had trouble too: Amazon.com, Prime Video, Alexa, and Ring all saw disruption, illustrating how deeply AWS is intertwined with its parent company’s consumer services. Live trackers like Downdetector logged millions of user problem reports worldwide, underlining how many daily-life apps sit atop AWS. Some roundups also noted ripple effects to entertainment apps (e.g., Apple Music) and big consumer brands’ mobile apps during the window.

## Under the hood

AWS’s timeline points to DNS resolution failures for the DynamoDB API in US-EAST-1. The underlying trigger was attributed to an internal EC2 subsystem that monitors the health of Network Load Balancers (NLBs); when that subsystem malfunctioned, it surfaced outwardly as bad name lookups to the DynamoDB endpoint. AWS mitigated the DNS issue at 2:24 AM PDT and declared all services normal by 3:01 PM PDT, while backlogs drained through the afternoon. ([Amazon](https://www.aboutamazon.com/news/aws/aws-service-disruptions-outage-update), [Reuters](https://www.reuters.com/business/retail-consumer/amazons-cloud-unit-reports-outage-several-websites-down-2025-10-20/))

Independent network telemetry noted no broader internet routing anomaly (for example, no BGP incident), which aligns with the conclusion that the fault sat inside AWS’s control plane rather than on the public internet. ([ThousandEyes](https://www.thousandeyes.com/blog/aws-outage-analysis-october-20-2025))

## A few DNS behaviors explain the “long tail” after the fix:

- Caching, including negative caching. Resolvers store answers for a period called TTL (time-to-live). They also cache failures, by standard. If a resolver cached a “couldn’t find it” response during the incident, it might keep serving that failure until the timer expired, even after AWS corrected the source. (Standards: [RFC 2308](https://datatracker.ietf.org/doc/html/rfc2308), updated in [RFC 9520](https://www.rfc-editor.org/rfc/rfc9520))
- Control plane vs. data plane. Cloud platforms separate orchestration (control plane) from steady-state serving (data plane). A control-plane hiccup that breaks name lookups can block otherwise healthy serving paths, because clients still need to discover endpoints by name. AWS’s own resilience guidance distinguishes these planes and notes the higher complexity and change rate in control systems. ([AWS whitepaper](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/control-planes-and-data-planes.html))
- Regional centrality. US-EAST-1 hosts components that many global features rely upon; this concentration explains why a regional naming issue felt global in effect. (Context in general reporting: [Reuters](https://www.reuters.com/business/retail-consumer/amazons-cloud-unit-reports-outage-several-websites-down-2025-10-20/))

## What smaller internet companies can take from it

Incidents like this underline a simple idea: the naming layer is the safety layer. Decisions about where users are sent, which data center to try next, and how to steer traffic during trouble all run through DNS. Building that layer to be independent, redundant, and ready for change makes recovery faster and outages smaller.

## Why DNS is critical and how Namefi fits in

The lesson is not that the cloud is fragile; it is that dependence on a single naming and control path concentrates risk. Modern internet teams reduce that risk by treating DNS as the independent, resilient steering layer for their traffic and by preparing alternative endpoints before trouble arrives. With robust DNS in place, applications retain the ability to reroute, degrade gracefully, and recover faster when a provider has a bad day.

This philosophy is the reason Namefi exists. Namefi’s platform provides domain and DNS resilience as a product, weaving together best practices, carefully engineered TTLs and communication surfaces. The result is a naming layer designed to continue making good routing decisions when underlying clouds are healing, throttling, or catching up. Teams adopting Namefi get this posture out of the box, along with the operational tooling to observe and adjust it without tying those controls to the same plane that might be experiencing trouble.

When incidents like Oct 20 occur, that separation is what keeps the map intact.

## Sources and further reading

- Amazon — Official incident timings and recovery steps (mitigation at 2:24 AM PDT; all services normal by 3:01 PM PDT; EC2 throttling during recovery). ([Amazon](https://www.aboutamazon.com/news/aws/aws-service-disruptions-outage-update))
- Reuters — Root cause in EC2 internal NLB health-monitoring subsystem; scope of impact; multi-million user reports; backlog clearing. ([Reuters](https://www.reuters.com/business/retail-consumer/amazons-cloud-unit-reports-outage-several-websites-down-2025-10-20/))
- ThousandEyes — Telemetry focusing on US-EAST-1, DNS to DynamoDB, and absence of broader routing anomalies. ([ThousandEyes](https://www.thousandeyes.com/blog/aws-outage-analysis-october-20-2025))
- The Verge / Tom’s Guide — Public timelines, confirmation that the event was DNS/control-plane related rather than a cyberattack, and examples of affected platforms. ([The Verge](https://www.theverge.com/news/802486/aws-outage-alexa-fortnite-snapchat-offline))
- IETF / Cloudflare Docs — DNS negative caching behavior (RFC 2308, RFC 9520) and multi-signer DNSSEC patterns for multi-provider authoritative deployments (RFC 8901, operator docs). ([RFC Editor](https://www.rfc-editor.org/rfc/rfc8901), [RFC Editor](https://www.rfc-editor.org/rfc/rfc9520))
