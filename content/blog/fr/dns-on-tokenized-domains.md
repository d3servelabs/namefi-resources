---
title: "Le DNS fonctionne toujours : serveurs de noms, e-mails et DNSSEC sur un domaine tokenisé"
date: '2026-05-22'
language: fr
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Un aperçu pratique de la façon dont le DNS classique — serveurs de noms, A/AAAA, MX, TXT, DNSSEC, CAA — continue de fonctionner après avoir tokenisé un domaine ICANN. Ce qui change, ce qui ne change pas, et où pointer votre fournisseur DNS existant."
keywords: ['DNS domaine tokenisé', 'DNSSEC domaine NFT', 'serveurs de noms domaine tokenisé', 'e-mail domaine tokenisé', 'enregistrements MX domaine NFT', 'enregistrements CAA domaine tokenisé', 'gestion DNS domaine tokenisé', 'DNS domaine on-chain', 'MX domaine NFT', 'DNSSEC domaine NFT', 'Cloudflare domaine tokenisé', 'Route53 domaine tokenisé', 'fonctionnement DNS tokenisé', 'résolution domaine tokenisé']
relatedArticles:
  - /fr/blog/how-to-tokenize-your-com/
  - /fr/blog/what-are-tokenized-domains/
  - /fr/blog/tokenize-your-com-to-flip-it/
  - /fr/blog/how-tokenized-marketplaces-replace-escrow/
  - /fr/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /fr/topics/domain-tokenization/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/tokenize-your-com/
  - /fr/series/domain-flipping-skills/
relatedGlossary:
  - /fr/glossary/dns/
  - /fr/glossary/registrar/
  - /fr/glossary/icann/
  - /fr/glossary/registry/
  - /fr/glossary/tld/
---

Une inquiétude courante lors de la tokenisation d'un domaine : *"Mon site web fonctionnera-t-il toujours ? Mes e-mails fonctionneront-ils toujours ? Vais-je devoir apprendre toute une nouvelle pile DNS ?"*

Réponse courte : **oui, oui, non.** Un domaine tokenisé reste un véritable domaine ICANN. Le DNS continue de faire exactement ce que fait le DNS. Cet article est un tour d'horizon de ce qui change (un peu) et de ce qui ne change pas (la majeure partie).

---

## La seule idée à retenir

Un domaine tokenisé comporte **deux couches** :

1. **La couche [DNS](/fr/glossary/dns/) / [registre](/fr/glossary/registry/)** — celle dans laquelle votre `.com` a toujours vécu. [ICANN](/fr/glossary/icann/), [bureau d'enregistrement](/fr/glossary/registrar/) (registrar), serveurs racines, résolveurs récursifs.
2. **La couche [on-chain](/fr/glossary/on-chain/)** — un [NFT](/fr/glossary/nft/) dans votre [portefeuille](/fr/glossary/wallet/) (wallet) qui représente la *propriété*.

La résolution DNS — c'est-à-dire transformer `example.com` en une [adresse IP](/fr/glossary/ip-address/) — s'effectue entièrement sur la couche 1. La couche on-chain concerne **qui contrôle le domaine**, et non la manière dont il est résolu. Les navigateurs, les serveurs de messagerie, les CDN et les autorités de certification n'ont jamais besoin de savoir qu'une [blockchain](/fr/glossary/blockchain/) existe.

C'est pourquoi "le DNS fonctionne toujours". Ce n'est pas de la magie. C'est le même DNS.

---

## Ce qui ne change pas

### Serveurs de noms

Vous configurez toujours des serveurs de noms pour votre domaine. Utilisez Cloudflare, Route53, Namecheap, Google Cloud DNS, dnsimple — celui que vous utilisiez auparavant fera très bien l'affaire. De nombreuses personnes laissent leur fournisseur DNS exactement là où il était lors de la tokenisation et n'y touchent plus jamais.

### Enregistrements A, AAAA, CNAME, ALIAS

Tout est standard. Votre site web est résolu de la même manière qu'hier.

### MX, SPF, DKIM, DMARC

Les e-mails continuent de fonctionner. La tokenisation n'a aucun effet sur la livraison des courriers. Si vous utilisez Google Workspace, Microsoft 365, Fastmail, ProtonMail ou un serveur de messagerie auto-hébergé, rien de tout cela ne change.

### Enregistrements TXT

La vérification de domaine pour les outils SaaS (Stripe, Slack, GitHub, Atlassian, etc.) continue de fonctionner. Ajoutez et supprimez des enregistrements TXT selon vos besoins.

### Enregistrements CAA

L'autorisation de l'autorité de certification (CAA) — les enregistrements qui indiquent aux autorités de certification (Let's Encrypt, DigiCert) qui est autorisé à émettre des certificats pour votre domaine — continue de fonctionner sans modification.

### Certificats TLS / SSL

Vous obtenez toujours vos certificats auprès du même fournisseur. Let's Encrypt, votre fournisseur CDN, votre répartiteur de charge (load balancer) — le processus est le même. Les défis ACME (DNS-01 ou HTTP-01) fonctionnent de la même manière.

### Renouvellements

Le domaine est toujours renouvelé via le bureau d'enregistrement, selon le même calendrier et facturé de la même manière. La tokenisation n'introduit aucun nouveau mécanisme de renouvellement.

---

## Ce qui *change* (un peu)

### Qui contrôle le domaine

Avant : celui qui possède les identifiants du compte du bureau d'enregistrement.
Après : **celui qui détient le NFT on-chain** a le contrôle absolu. Le tableau de bord Namefi relie le NFT au compte du bureau d'enregistrement via le protocole, le portefeuille est donc la source de vérité.

C'est tout l'intérêt. C'est aussi pourquoi vous devez prendre la sécurité de votre portefeuille au sérieux — voir [Récupérer un domaine tokenisé après la perte de son portefeuille](/fr/blog/recovering-a-tokenized-domain-after-wallet-loss/).

### Où cliquer pour gérer le DNS

La plupart des propriétaires gèrent les enregistrements DNS depuis le tableau de bord Namefi après la tokenisation — le tableau de bord communique avec le bureau d'enregistrement en votre nom. Si vous préférez conserver votre DNS chez Cloudflare/Route53, etc., laissez simplement vos serveurs de noms pointer vers eux et ignorez l'interface DNS de l'application. Les deux approches fonctionnent.

### Le transfert du domaine

Avant : le processus de [transfert inter-bureaux d'enregistrement](/fr/glossary/cross-registrar-transfer/) (cross-registrar transfer), avec des [codes d'autorisation](/fr/glossary/auth-code/) (auth codes) et des délais de carence de 60 jours.
Après : le [**transfert du NFT**](/fr/glossary/atomic-transfer/). Une seule transaction on-chain transfère la propriété. L'enregistrement côté bureau d'enregistrement est synchronisé par le protocole. C'est considérablement plus rapide — et c'est pourquoi les places de marché de domaines tokenisés n'ont pas besoin de services d'[entiercement](/fr/glossary/escrow/) (escrow) traditionnels (voir [De la mise en vente au règlement](/fr/blog/how-tokenized-marketplaces-replace-escrow/)).

Vous pouvez toujours effectuer un transfert de bureau d'enregistrement traditionnel si vous le souhaitez ; la couche on-chain ne l'empêche pas.

---

## DNSSEC sur un domaine tokenisé

[DNSSEC](/fr/glossary/dnssec/) fonctionne. Si vous l'aviez activé auparavant, il reste activé. Si ce n'était pas le cas, vous pouvez l'activer après la tokenisation. La chaîne de confiance passe par le registre comme d'habitude — la couche on-chain n'intervient nulle part sur ce chemin. (Contexte : la [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033) définit le protocole ; l'[explication de la cérémonie KSK de l'ICANN](https://www.icann.org/dns-resolvers-checking-current-trust-anchors) décrit le processus de racine de confiance).

Quelques remarques pratiques :

- Si votre DNS est chez Cloudflare ou Route53, ces fournisseurs gèrent la signature DNSSEC pour vous. Il suffit de l'activer du côté du bureau d'enregistrement, ce que vous pouvez faire via le tableau de bord Namefi.
- Les enregistrements DS sont gérés au niveau du bureau d'enregistrement / registre. Si vous effectuez une rotation des clés KSK, vous publierez de nouveaux enregistrements DS via le même processus que vous avez toujours utilisé.
- Les échecs DNSSEC sont visibles dans les outils standards (`dig +dnssec`, [dnsviz.net](https://dnsviz.net/), [l'analyseur DNSSEC de Verisign](https://dnssec-debugger.verisignlabs.com/)). La tokenisation n'introduit pas de nouveau mode d'échec.

---

## Délivrabilité des e-mails après la tokenisation

Les responsables des e-mails sont souvent les plus inquiets, soyons donc explicites : **rien ne change concernant les e-mails.**

Vos enregistrements MX acheminent toujours le courrier vers votre fournisseur. SPF autorise toujours les expéditeurs. DKIM signe toujours les messages sortants. DMARC applique toujours l'alignement. La réputation réside dans la paire IP / domaine d'envoi, et votre domaine est toujours votre domaine — même nom, même ancienneté, même historique.

Si vous changez de fournisseur de messagerie en même temps que la tokenisation (une occasion courante de faire le grand nettoyage), effectuez ces changements un par un. Ce n'est pas parce que la tokenisation casse quoi que ce soit ; il s'agit simplement d'une bonne hygiène opérationnelle de ne modifier qu'une seule variable à la fois.

---

## Référence rapide : Enregistrements courants

| Enregistrement | Utilisé pour | Affecté par la tokenisation ? |
|---|---|---|
| A / AAAA | IP de sites web | Non |
| CNAME / ALIAS | Alias | Non |
| MX | Routage des e-mails | Non |
| TXT | Vérification, SPF, DKIM, DMARC | Non |
| CAA | Restrictions des autorités de certification | Non |
| NS | Délégation | Non (vous choisissez toujours les serveurs de noms) |
| DS | Délégation DNSSEC | Non (géré au niveau du registre comme d'habitude) |
| SRV | Localisation de services | Non |
| TLSA | DANE | Non |

Toute la couche "tokenisée" se trouve *à côté* du DNS, et non au-dessus.

---

## Où les gens trébuchent réellement

- **Oublier quel portefeuille détient le NFT.** Ce n'est pas un problème DNS, mais c'est la raison numéro 1 pour laquelle les gens perdent l'accès à un domaine tokenisé. Notez-le bien.
- **Changer de serveurs de noms et de fournisseur DNS en même temps.** C'est tentant, mais cela introduit un risque inutile. Tokenisez d'abord, puis changez de fournisseur DNS plus tard si vous le souhaitez.
- **Supposer que la couche on-chain pousse automatiquement les changements DNS.** Ce n'est pas le cas. Les modifications DNS passent toujours par les fournisseurs DNS et prennent un temps de propagation normal (de quelques minutes à quelques heures, selon les TTL).
- **Désactiver DNSSEC pendant une migration.** Si vous désactivez puis réactivez DNSSEC, faites-le proprement avec les mises à jour d'enregistrements DS appropriées. Un DNSSEC partiellement déployé interrompt la résolution partout.

---

## Avertissement amical (Lisez-moi !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins — et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou toute autre forme de conseil professionnel.** Nous rédigeons ces articles pour nous éduquer et pour faciliter la tâche de nos clients. Les informations présentées ici peuvent être obsolètes, spécifiques à une zone géographique ou tout simplement fausses — il nous arrive aussi de faire des erreurs.
>
> Pour toute décision importante, **veuillez consulter un vrai professionnel (sérieusement !)**. Ou si ce n'est pas votre genre, demandez à un ami, demandez sur Twitter, demandez sur Reddit, demandez à une IA, ou consultez un voyant. En bref : **DYOR — Faites vos propres recherches** (Do Your Own Research). Apprenons et amusons-nous.

---

## Résumé

- La tokenisation d'un domaine ne remplace pas le DNS. Le DNS continue de faire du DNS.
- Vos serveurs de noms, votre site web, vos e-mails (MX/SPF/DKIM/DMARC), DNSSEC, CAA et vos certificats TLS continuent tous de fonctionner sans aucune modification.
- Ce qui change, c'est la **propriété** : le NFT dans votre portefeuille est le nouveau point de contrôle décisionnel. Les transferts se font on-chain au lieu de passer par la bureaucratie du bureau d'enregistrement.
- Vous pouvez conserver votre DNS chez Cloudflare, Route53, ou là où il se trouve actuellement. Vous pouvez également le gérer via Namefi. Les deux options sont valables.
- Implication pratique : d'un point de vue opérationnel, un `.com` tokenisé est indiscernable d'un `.com` non tokenisé, jusqu'à ce que vous décidiez de le vendre ou de le transférer — c'est à ce moment-là que la couche on-chain rend tout considérablement plus rapide.

Pour obtenir un guide étape par étape sur la façon de tokeniser en premier lieu, consultez [Comment tokeniser votre .com](/fr/blog/how-to-tokenize-your-com/).