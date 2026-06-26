---
title: BGPハイジャック
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: 偽のIP経路を広告してインターネット通信を迂回させる、DNSより下位のネットワーク層攻撃。
keywords: ['BGP hijack', 'route hijacking', 'IP prefix', 'network security', 'internet routing']
level: 1
sources:
  - https://www.cloudflare.com/learning/security/glossary/bgp-hijacking/
---

**BGPハイジャック**（Border Gateway Protocol hijacking）とは、悪意ある、または誤設定された自律システムが偽の経路広告を流し、正当な [IPアドレス](/ja/glossary/ip-address/) 宛てのトラフィックを攻撃者のインフラ経由で送るよう、インターネット上の他のルーターに信じ込ませるネットワーク層攻撃です。名前から IP への対応を改ざんする [DNSハイジャック](/ja/glossary/dns-hijacking/)とは異なり、BGPハイジャックはルーティング層で動作するため、ドメインの DNS レコードは変更されず、[DNSSEC](/ja/glossary/dnssec/) では防げません。トラフィックが迂回されると、攻撃者は TLS 証明書発行を妨害・悪用したり、暗号化されていない通信を読んだり、中間者攻撃を行ったりできます。BGPハイジャックは、HTTP ベースのドメイン検証を使う CA から不正な証明書を取得するためにも使われてきました。対策には、RPKI（Resource Public Key Infrastructure）による経路起点検証や、予期しない AS が自分のプレフィックスを広告したときに通知する監視サービスがあります。
