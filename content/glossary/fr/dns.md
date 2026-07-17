---
title: DNS
date: '2025-06-30'
language: fr
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['alan-machin']
description: Le système de nommage hiérarchique qui traduit les noms de domaine lisibles par l'homme en adresses IP utilisées par les ordinateurs pour acheminer le trafic sur internet.
keywords: ['DNS', 'système de noms de domaine', 'résolution de noms', 'requête DNS', 'enregistrements DNS', 'serveur de noms', 'résolveur récursif', 'DNSSEC', 'infrastructure internet']
also_known_as: ['Système de noms de domaine']
level: 2
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.iana.org/domains/root
  - https://www.cloudflare.com/learning/dns/what-is-dns/
  - https://www.icann.org/resources/pages/what-2012-02-25-en
relatedArticles:
  - /fr/blog/what-are-tokenized-domains/
  - /fr/blog/the-myetherwallet-bgp-dns-attack/
  - /fr/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /fr/blog/the-sea-turtle-dns-espionage/
  - /fr/blog/the-dnspionage-campaign/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/name-change-game-change/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/tld/
  - /fr/glossary/icann/
  - /fr/glossary/registry/
  - /fr/glossary/web3/
---

**DNS** (le *Système de noms de domaine*, aussi connu sous le nom de *Système de noms de domaine*) est le système de nommage distribué et hiérarchique d'internet qui traduit les noms de domaine lisibles par l'homme — tels que `example.com` — en [adresses IP](/fr/glossary/ip-address/) que les équipements réseau utilisent pour acheminer les paquets sur internet. Sans le DNS, chaque utilisateur devrait mémoriser les adresses numériques de chaque site qu'il souhaite visiter. Défini dans la [RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034) et la [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035) (publiées par l'IETF en 1987 et toujours fondamentales aujourd'hui), le DNS demeure l'un des protocoles essentiels d'internet.

## Ce que fait le DNS

Le DNS effectue la **résolution de noms** : à partir d'un nom de domaine, il retourne les enregistrements de ressources associés à ce nom — le plus souvent une [adresse IP](/fr/glossary/ip-address/) pour qu'un navigateur ou une application sache où envoyer sa demande de connexion. Le système est également utilisé pour acheminer les courriels (enregistrements MX), vérifier la propriété d'un domaine (enregistrements TXT) et déléguer l'autorité sur une zone à un ensemble particulier de serveurs (enregistrements NS).

Parce que le DNS est consulté bien plus souvent qu'il n'est mis à jour, le protocole est optimisé pour des lectures rapides et mises en cache, distribuées sur des millions de serveurs dans le monde, plutôt que pour la cohérence immédiate.

## Comment fonctionne une requête DNS

Lorsque vous tapez `example.com` dans un navigateur, un processus de résolution en plusieurs étapes commence :

1. **Vérification du cache local.** Le système d'exploitation commence par consulter son propre cache DNS. Si une réponse récente et encore valide y est stockée, la résolution se termine immédiatement.

2. **Résolveur récursif.** S'il n'existe pas de réponse en cache, la requête est transmise à un [résolveur DNS](/fr/glossary/dns-resolver/) — un serveur exploité par votre fournisseur d'accès à internet, une entreprise (comme le `1.1.1.1` de Cloudflare ou le `8.8.8.8` de Google) ou votre organisation. Ce résolveur prend en charge le travail de recherche de la réponse en votre nom ; ce mode de fonctionnement est appelé **résolution récursive**.

3. **Serveurs de noms racines.** Si le résolveur n'a pas de réponse en cache, il contacte l'un des 13 clusters logiques de serveurs de noms de la [zone racine](/fr/glossary/root-zone/) (lettrés de `a` à `m`). Le serveur racine ne connaît pas la réponse finale mais répond par un renvoi vers les [serveurs de noms](/fr/glossary/nameserver/) responsables du domaine de premier niveau (TLD) concerné, comme `.com` ou `.org`. L'[IANA](https://www.iana.org/domains/root) publie et maintient la base de données de la zone racine.

4. **Serveurs de noms du TLD.** Le résolveur interroge les serveurs de noms du TLD. Ces derniers répondent par un renvoi vers les **serveurs de noms faisant autorité** pour le domaine spécifique (`example.com`).

5. **Serveurs de noms faisant autorité.** Le résolveur interroge le [serveur de noms](/fr/glossary/nameserver/) faisant autorité du domaine, qui détient les enregistrements DNS réels. Le serveur faisant autorité retourne l'enregistrement de ressource — par exemple, un enregistrement `A` contenant une adresse IPv4.

6. **Réponse et mise en cache.** Le résolveur retourne la réponse au client et la met en cache pour la durée spécifiée par le [TTL](/fr/glossary/ttl/) (Durée de vie) de l'enregistrement. Les requêtes ultérieures pour le même nom dans la fenêtre TTL sont servies depuis le cache, réduisant la latence et la charge sur les serveurs en amont.

Ce schéma — où le résolveur effectue le travail itératif et le client ne parle qu'à un seul serveur — est appelé **résolution récursive**. En contraste, la **résolution itérative** est celle où le client interroge lui-même chaque niveau de la hiérarchie en séquence ; c'est rare en pratique, mais c'est ainsi que les résolveurs parcourent la hiérarchie en interne ([RFC 1034 §5.3](https://datatracker.ietf.org/doc/html/rfc1034#section-5.3)).

## La hiérarchie DNS et les types d'enregistrements clés

Le DNS est organisé comme un arbre inversé. La racine (`.`) se trouve au sommet ; en dessous se trouvent les TLD (`.com`, `.net`, `.io`, les codes de pays comme `.de`) ; sous chaque TLD se trouvent les domaines de deuxième niveau (`example.com`) ; et ceux-ci peuvent avoir des sous-domaines d'une profondeur arbitraire (`mail.example.com`).

Chaque nœud de cet arbre est appelé une **zone**, et le serveur de noms faisant autorité pour une zone détient les **enregistrements de ressources** de cette zone. Les [types d'enregistrements DNS](/fr/glossary/dns-record-types/) les plus couramment rencontrés sont :

| Enregistrement | Rôle | Exemple de valeur |
|--------|---------|---------------|
| **A** | Associe un nom à une adresse IPv4 | `93.184.216.34` |
| **AAAA** | Associe un nom à une adresse IPv6 | `2606:2800:21f:cb07::1` |
| **CNAME** | Alias d'un nom vers un autre nom canonique | `www → example.com` |
| **MX** | Spécifie les serveurs de messagerie du domaine, avec priorité | `10 mail.example.com` |
| **NS** | Délègue une zone à un ensemble de serveurs de noms | `ns1.example.com` |
| **TXT** | Stocke du texte arbitraire ; utilisé pour SPF, DKIM, la vérification de domaine | `"v=spf1 include:…"` |
| **SOA** | Début d'autorité — métadonnées sur la zone elle-même | numéro de série, délais de rafraîchissement et de nouvelle tentative |

Les enregistrements `CNAME` ne peuvent pas être placés à l'apex de zone (le domaine nu `example.com`) car un `CNAME` doit être le seul enregistrement à un nom, mais l'apex requiert également des enregistrements `NS` et `SOA`. De nombreux fournisseurs DNS contournent ce problème avec des types d'enregistrements propriétaires tels que le « CNAME flattening » ou les pseudo-enregistrements `ALIAS`/`ANAME`.

## Qui gère le DNS

La gouvernance et le fonctionnement du DNS sont répartis entre plusieurs niveaux d'acteurs :

- **[ICANN](/fr/glossary/icann/) / IANA.** L'Internet Corporation for Assigned Names and Numbers supervise la [zone racine](/fr/glossary/root-zone/) et coordonne l'espace de nommage DNS mondial. L'IANA, une fonction de l'ICANN, maintient la [base de données de la zone racine](https://www.iana.org/domains/root) répertoriant tous les TLD et leurs serveurs de noms faisant autorité.

- **Registres.** Un [registre](/fr/glossary/registry/) exploite la base de données faisant autorité pour un TLD spécifique. Par exemple, Verisign opère `.com` et `.net` ; le Public Interest Registry opère `.org`. Les registres publient et maintiennent les enregistrements NS qui pointent vers les serveurs de noms de chaque domaine.

- **Registraires.** Un [registraire](/fr/glossary/registrar/) est une organisation accréditée par l'ICANN (ou le registre concerné) pour vendre des noms de domaine au public et soumettre les données d'enregistrement au registre au nom des clients.

- **Résolveurs récursifs.** Les résolveurs DNS sont exploités par des fournisseurs d'accès à internet, des services DNS publics (Cloudflare, Google, Quad9), des entreprises et des routeurs domestiques. Ils effectuent les recherches itératives décrites ci-dessus et mettent en cache les résultats pour réduire la latence des requêtes ([Cloudflare Learning — What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)).

- **Serveurs de noms faisant autorité.** Hébergés par les propriétaires de domaines ou leurs fournisseurs DNS, ces serveurs détiennent les fichiers de zone réels et répondent aux requêtes des résolveurs avec des réponses définitives.

## Sécurité

Les spécifications DNS originales ont été conçues pour la fiabilité et l'extensibilité, pas pour la sécurité. Plusieurs vulnérabilités et mécanismes de protection sont apparus au fil du temps :

**Empoisonnement du cache.** Un attaquant capable d'injecter une réponse DNS falsifiée dans le cache d'un résolveur peut rediriger les utilisateurs de sites légitimes vers des sites malveillants à leur insu. L'attaque Kaminsky (2008) l'a démontré à grande échelle, conduisant à une adoption plus large de la randomisation des ports et du [DNSSEC](/fr/glossary/dnssec/).

**DNSSEC.** Les extensions de sécurité DNS, définies dans les RFC 4033–4035, ajoutent des signatures cryptographiques aux enregistrements DNS. Un résolveur qui valide les signatures [DNSSEC](/fr/glossary/dnssec/) peut détecter les réponses falsifiées. L'adoption progresse mais de manière inégale : en 2024, environ 90 % de la zone racine et des principaux TLD sont signés, mais la validation de bout en bout dépend de la signature de toutes les zones de la chaîne et de la vérification des signatures par les résolveurs.

**Détournement DNS.** Des attaquants qui compromettent un compte de registraire, les systèmes de registre ou le résolveur d'un fournisseur d'accès peuvent rediriger les réponses DNS à grande échelle. Les défenses comprennent l'authentification à plusieurs facteurs au niveau du registraire, les verrous de registre (EPP `serverTransferProhibited`) et la surveillance des changements inattendus d'enregistrements NS ou A.

**DNS sur HTTPS / DNS sur TLS (DoH / DoT).** Ces protocoles chiffrent les requêtes DNS entre les clients et les résolveurs, empêchant l'écoute clandestine et la modification en transit des requêtes — une protection complémentaire au DNSSEC, qui traite de l'intégrité des données plutôt que de la vie privée.

## DNS et domaines tokenisés

Certains systèmes de noms fondés sur la blockchain (comme l'Ethereum Name Service) maintiennent leurs propres associations nom→adresse entièrement on-chain, indépendamment de la hiérarchie DNS traditionnelle. D'autres émettent des jetons on-chain représentant la propriété d'un domaine conventionnellement enregistré, où le fichier de zone DNS sous-jacent continue d'être hébergé sur des serveurs de noms standard. Dans ce dernier cas, la résolution DNS emprunte le flux de recherche normal décrit ci-dessus ; l'enregistrement blockchain atteste de la propriété mais ne fait pas partie du chemin de résolution. Les deux systèmes — enregistrements de propriété on-chain et DNS mondial — sont des couches distinctes qui peuvent coexister ou être reliées par des résolveurs passerelles.

---

*Sources : [RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034), [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035), [Base de données de la zone racine IANA](https://www.iana.org/domains/root), [Cloudflare Learning — What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/), [ICANN — What is DNS?](https://www.icann.org/resources/pages/what-2012-02-25-en)*
