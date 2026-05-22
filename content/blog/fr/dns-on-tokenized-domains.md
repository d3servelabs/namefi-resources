---
title: "Le DNS fonctionne toujours : Serveurs de noms, e-mails et DNSSEC sur un domaine tokenisé"
date: '2026-05-22'
language: fr
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Un aperçu pratique de la façon dont le DNS classique — serveurs de noms, A/AAAA, MX, TXT, DNSSEC, CAA — continue de fonctionner après la tokenisation d'un domaine ICANN. Ce qui change, ce qui ne change pas, et vers où pointer votre fournisseur DNS existant."
keywords: ['DNS domaine tokenisé', 'DNSSEC domaine NFT', 'serveurs de noms domaine tokenisé', 'e-mail domaine tokenisé', 'enregistrements MX domaine NFT', 'enregistrements CAA domaine tokenisé', 'gestion DNS domaine tokenisé', 'DNS domaine on-chain', 'domaine NFT MX', 'domaine NFT DNSSEC', 'domaine tokenisé Cloudflare', 'domaine tokenisé Route53', 'fonctionnement DNS tokenisé', 'résolution domaine tokenisé']
---

Une inquiétude courante concernant la tokenisation d'un domaine : *"Mon site web fonctionnera-t-il toujours ? Mes e-mails fonctionneront-ils toujours ? Devrai-je apprendre toute une nouvelle pile DNS ?"*

Réponse courte : **oui, oui, non.** Un domaine tokenisé reste un véritable domaine ICANN. Le DNS continue de faire exactement ce qu'il a toujours fait. Cet article fait le tour de ce qui change (un peu) et de ce qui ne change pas (la majeure partie).

---

## L'unique idée à retenir

Un domaine tokenisé comporte **deux couches** :

1. **La couche [DNS](/en/glossary/dns/) / registre** — celle-là même où votre `.com` a toujours résidé. [ICANN](/en/glossary/icann/), [bureau d'enregistrement](/en/glossary/registrar/) (registrar), serveurs racines, résolveurs récursifs.
2. **La couche [on-chain](/en/glossary/on-chain/)** — un [NFT](/en/glossary/nft/) dans votre [portefeuille](/en/glossary/wallet/) (wallet) qui représente la *propriété*.

La résolution DNS — qui transforme `example.com` en adresse IP — se produit entièrement sur la couche 1. La couche on-chain concerne **celui qui contrôle le domaine**, et non la manière dont il se résout. Les navigateurs, les serveurs de messagerie, les CDN et les autorités de certification n'ont jamais besoin de savoir qu'une blockchain existe.

C'est pourquoi "le DNS fonctionne toujours". Ce n'est pas de la magie. C'est le même DNS.

---

## Ce qui ne change pas

### Serveurs de noms

Vous configurez toujours les serveurs de noms pour votre domaine. Utilisez Cloudflare, Route53, Namecheap, Google Cloud DNS, dnsimple — celui que vous utilisiez auparavant fera très bien l'affaire. De nombreuses personnes laissent leur fournisseur DNS exactement là où il était lors de la tokenisation et n'y touchent plus jamais.

### Enregistrements A, AAAA, CNAME, ALIAS

Tout est standard. Votre site web se résout de la même manière qu'hier.

### MX, SPF, DKIM, DMARC

Les e-mails continuent de fonctionner. La tokenisation n'a aucun effet sur la distribution du courrier. Si vous utilisez Google Workspace, Microsoft 365, Fastmail, ProtonMail ou un serveur de messagerie auto-hébergé, rien de tout cela ne change.

### Enregistrements TXT

La vérification de domaine pour les outils SaaS (Stripe, Slack, GitHub, Atlassian, etc.) continue de fonctionner. Ajoutez et supprimez des enregistrements TXT selon vos besoins.

### Enregistrements CAA

L'Autorisation de l'Autorité de Certification (Certificate Authority Authorization) — les enregistrements qui indiquent aux autorités de certification (Let's Encrypt, DigiCert) qui est autorisé à émettre des certificats pour votre domaine — continue de fonctionner sans modification.

### Certificats TLS / SSL

Vous obtenez toujours vos certificats auprès de ceux qui vous les fournissaient déjà. Let's Encrypt, votre fournisseur de CDN, votre équilibreur de charge — le processus reste le même. Les défis ACME (DNS-01 ou HTTP-01) fonctionnent de la même manière.

### Renouvellements

Le domaine se renouvelle toujours via le bureau d'enregistrement, selon le même calendrier et facturé de la même manière. La tokenisation n'introduit aucun nouveau mécanisme de renouvellement.

---

## Ce qui change (un peu)

### Qui contrôle le domaine

Avant : quiconque possède les identifiants de connexion au compte du bureau d'enregistrement.
Après : **quiconque détient le NFT on-chain** a le contrôle absolu. Le tableau de bord Namefi relie le NFT au compte du bureau d'enregistrement via le protocole, le portefeuille est donc la source de vérité.

C'est là tout l'intérêt. C'est aussi la raison pour laquelle vous devez prendre la sécurité de votre portefeuille au sérieux — voir [Récupérer un domaine tokenisé après la perte de son portefeuille](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/).

### L'endroit où vous cliquez pour gérer le DNS

La plupart des propriétaires gèrent les enregistrements DNS depuis le tableau de bord Namefi après la tokenisation — le tableau de bord communique avec le bureau d'enregistrement en votre nom. Si vous préférez conserver votre DNS chez Cloudflare/Route53, etc., laissez simplement vos serveurs de noms pointer vers eux et ignorez l'interface utilisateur DNS de l'application. Les deux méthodes fonctionnent.

### Transférer le domaine

Avant : processus de [transfert inter-bureaux d'enregistrement](/en/glossary/cross-registrar-transfer/), avec des [codes d'autorisation (auth codes)](/en/glossary/auth-code/) et des périodes de blocage de 60 jours.
Après : [**transfert du NFT**](/en/glossary/atomic-transfer/). Une seule transaction on-chain transfère la propriété. L'enregistrement côté bureau d'enregistrement est maintenu synchronisé par le protocole. C'est considérablement plus rapide — et c'est pourquoi les places de marché de domaines tokenisés n'ont pas besoin de service de [séquestre (escrow)](/en/glossary/escrow/) traditionnel (voir [De la mise en vente au règlement](/en/blog/how-tokenized-marketplaces-replace-escrow/)).

Vous pouvez toujours effectuer un transfert classique via le bureau d'enregistrement si vous le souhaitez ; la couche on-chain ne l'empêche pas.

---

## DNSSEC sur un domaine tokenisé

Le [DNSSEC](/en/glossary/dnssec/) fonctionne. Si vous l'aviez activé auparavant, il reste activé. Si ce n'était pas le cas, vous pouvez l'activer après la tokenisation. La chaîne de confiance passe par le registre comme d'habitude — la couche on-chain n'intervient nulle part sur ce chemin. (Contexte : la [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033) définit le protocole ; [l'explication de la cérémonie KSK par l'ICANN](https://www.icann.org/dns-resolvers-checking-current-trust-anchors) décrit le processus de racine de confiance.)

Quelques remarques pratiques :

- Si votre DNS est chez Cloudflare ou Route53, ces fournisseurs gèrent la signature DNSSEC pour vous. Il vous suffit de l'activer côté bureau d'enregistrement, ce que vous pouvez faire via le tableau de bord Namefi.
- Les enregistrements DS sont gérés au niveau du bureau d'enregistrement / registre. Si vous effectuez une rotation des clés KSK, vous publierez de nouveaux enregistrements DS via le même processus que vous avez toujours utilisé.
- Les échecs DNSSEC sont visibles dans les outils standards (`dig +dnssec`, [dnsviz.net](https://dnsviz.net/), [l'analyseur DNSSEC de Verisign](https://dnssec-debugger.verisignlabs.com/)). La tokenisation n'introduit pas de nouveau mode de défaillance.

---

## Délivrabilité des e-mails après la tokenisation

Les utilisateurs se soucient le plus de leurs e-mails, alors soyons clairs : **absolument rien ne change pour les e-mails.**

Vos enregistrements MX routent toujours le courrier vers votre fournisseur. Le SPF autorise toujours les expéditeurs. Le DKIM signe toujours les messages sortants. Le DMARC applique toujours l'alignement. La réputation réside dans la paire IP d'envoi / domaine, et votre domaine reste votre domaine — même nom, même âge, même historique.

Si vous changez de fournisseur de messagerie au moment de la tokenisation (une occasion courante de faire un peu de ménage), effectuez ces changements un par un. Ce n'est pas parce la tokenisation casse quoi que ce soit ; c'est simplement une bonne hygiène opérationnelle de ne modifier qu'une seule variable à la fois.

---

## Référence rapide : Enregistrements courants

| Enregistrement | Utilisé pour | Affecté par la tokenisation ? |
|---|---|---|
| A / AAAA | IP du site web | Non |
| CNAME / ALIAS | Alias | Non |
| MX | Routage des e-mails | Non |
| TXT | Vérification, SPF, DKIM, DMARC | Non |
| CAA | Restrictions des autorités de certification | Non |
| NS | Délégation | Non (vous choisissez toujours les serveurs de noms) |
| DS | Délégation DNSSEC | Non (géré au niveau du registre comme d'habitude) |
| SRV | Localisation de service | Non |
| TLSA | DANE | Non |

Toute la couche "tokenisée" se trouve *à côté* du DNS, et non au-dessus.

---

## Les erreurs les plus fréquentes

- **Oublier quel portefeuille détient le NFT.** Ce n'est pas un problème de DNS, mais c'est la principale cause de perte d'accès à un domaine tokenisé. Notez-le.
- **Changer de serveurs de noms et de fournisseur DNS en même temps.** C'est tentant, mais cela introduit un risque inutile. Tokenisez d'abord, puis changez de fournisseur DNS plus tard si vous le souhaitez.
- **Supposer que la couche on-chain déploie automatiquement les changements DNS.** Ce n'est pas le cas. Les modifications DNS passent toujours par les fournisseurs DNS et prennent le temps de propagation normal (de quelques minutes à quelques heures, selon les TTL).
- **Désactiver le DNSSEC pendant une migration.** Si vous désactivez puis réactivez le DNSSEC, faites-le proprement avec des mises à jour appropriées des enregistrements DS. Un DNSSEC mal configuré interrompt la résolution partout.

---

## Avertissement amical (Lisez-moi !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins — et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou tout autre type de conseil professionnel.** Nous rédigeons ces articles pour nous éduquer nous-mêmes et pour des raisons pratiques pour nos clients. Les informations présentées ici peuvent être obsolètes, spécifiques à une zone géographique, ou tout simplement erronées — il nous arrive aussi de faire des erreurs.
>
> Pour toute décision importante, **veuillez consulter un vrai professionnel (sérieusement !)**. Ou si ce n'est pas votre truc, demandez à un ami, à Twitter, à Reddit, à une IA, ou à un voyant. En bref : **DYOR — Do Your Own Research (Faites vos propres recherches)**. Apprenons tout en nous amusant.

---

## Résumé

- La tokenisation d'un domaine ne remplace pas le DNS. Le DNS continue de faire du DNS.
- Vos serveurs de noms, votre site web, vos e-mails (MX/SPF/DKIM/DMARC), le DNSSEC, les enregistrements CAA et les certificats TLS continuent tous de fonctionner sans changement.
- Ce qui change, c'est la **propriété** : le NFT dans votre portefeuille est le nouveau point de contrôle décisionnel. Les transferts se font on-chain plutôt que via la bureaucratie des bureaux d'enregistrement.
- Vous pouvez conserver votre DNS chez Cloudflare, Route53, ou là où il se trouve actuellement. Ou le gérer via Namefi. Les deux options sont valables.
- Implication pratique : un `.com` tokenisé est indiscernable d'un `.com` non tokenisé sur le plan opérationnel, jusqu'au moment où vous décidez de le vendre ou de le transférer — à ce stade, la couche on-chain rend tout considérablement plus rapide.

Pour un guide détaillé destiné aux opérateurs sur la façon de tokeniser initialement, consultez [Comment tokeniser votre .com](/en/blog/how-to-tokenize-your-com/).