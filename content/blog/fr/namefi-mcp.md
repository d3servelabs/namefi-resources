---
title: "Serveur MCP de Namefi : des outils de gestion de domaines pour les agents IA"
date: '2026-07-10'
language: 'fr'
tags: ['ai-agents', 'domains', 'web3']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
format: explainer
ogImage: ../../assets/namefi-mcp-og.jpg
description: "Tous les outils que le serveur MCP de Namefi met à la disposition des agents IA : recherche, enregistrement, DNS, renouvellements, tokenisation, modèle d’authentification et exemples de workflows."
keywords: ["serveur mcp namefi", "liste des outils mcp", "fonctionnalités mcp namefi", "gestion de domaines par serveur mcp", "serveur mcp de bureau d'enregistrement", "portées de clé api namefi", "outils mcp dns", "enregistrer un domaine avec mcp", "tokeniser un domaine avec mcp", "paiement de domaine x402", "authentification siwe pour les domaines", "signature eip-712 pour les domaines", "prospection de clients pour les domaines", "openapi namefi", "outils de gestion de domaines pour agents ia"]
relatedArticles:
  - /fr/blog/claude-mcp-domains/
  - /fr/blog/ai-agent-register/
  - /fr/blog/wallet-checkout/
  - /fr/blog/llms-txt/
  - /fr/blog/mcp-quickstart/
relatedTopics:
  - /fr/topics/domain-tokenization/
  - /fr/topics/web3-foundations/
relatedSeries:
  - /fr/series/blockchain-concepts/
  - /fr/series/tokenize-your-com/
relatedGlossary:
  - /fr/glossary/ai-agent/
  - /fr/glossary/registrar/
  - /fr/glossary/tokenized-domain/
  - /fr/glossary/dnssec/
  - /fr/glossary/ens/
---

Chaque [agent IA](/fr/glossary/ai-agent/) qui se connecte au serveur MCP de Namefi voit la même liste d’outils qu’il peut appeler : un par opération définie par l’API, pour la recherche, l’enregistrement, le DNS, la configuration des domaines, la prospection de clients et le paiement. Cette page en constitue le catalogue : elle présente chaque outil, son rôle, l’authentification qu’il exige et trois exemples pratiques combinant plusieurs outils dans un véritable workflow.

Si vous n’avez pas encore connecté d’agent à Namefi, commencez par [Comment enregistrer un domaine avec votre agent IA sur Namefi](/fr/blog/ai-agent-register/) pour découvrir la configuration propre à chaque client, ou par [Acheter un domaine avec Claude : guide pas à pas du MCP de Namefi](/fr/blog/claude-mcp-domains/) pour consulter une transcription complète. Cette page suppose que la connexion est déjà établie.

## Qu’est-ce que le serveur MCP de Namefi ?

Namefi exploite un seul serveur MCP pour l’ensemble de son API, à l’adresse `https://api.namefi.io/mcp`, via le transport Streamable HTTP. Au lieu de programmer manuellement des appels REST à partir d’une documentation collée dans une conversation, l’agent se connecte une fois et reçoit un outil typé pour chaque opération définie par l’API. Ces outils sont générés directement depuis la spécification OpenAPI 3 de Namefi, disponible sur [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json), afin que le catalogue MCP et l’API REST ne puissent pas diverger.

Un descripteur de découverte lisible par machine, accessible sur [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json), permet à un agent de trouver le serveur sans qu’une personne doive copier manuellement une URL dans un fichier de configuration. Il nomme le serveur `namefi-api`, indique le transport `streamable-http` et déclare `apiKey`/`x-api-key` comme méthode d’authentification de la connexion. Namefi, [bureau d’enregistrement](/fr/glossary/registrar/) accrédité par l’[ICANN](/fr/glossary/icann/), publie également les mêmes opérations sous forme de simples points de terminaison HTTPS sur [namefi.io/llms.txt](https://namefi.io/llms.txt), pour les agents et scripts qui ne prennent pas en charge MCP.

## Catalogue complet des fonctionnalités

Voici toutes les opérations définies par l’API à la date de rédaction, regroupées comme dans la documentation de référence de Namefi. La colonne **Opération** correspond à l’`operationId` de la spécification OpenAPI : c’est le nom à partir duquel est constituée la liste d’outils d’un client MCP. La colonne **Authentification** indique la méthode la plus simple — une clé API couvre presque tout. Le modèle d’authentification complet, y compris les solutions de remplacement d’une clé API, est présenté dans la section suivante.

### Recherche et découverte

| Opération | Point de terminaison | Fonction | Authentification |
| --- | --- | --- | --- |
| `checkAvailability` | `GET /v-next/search/availability` | Vérifier si un nom de domaine est disponible à l’enregistrement | Aucune |
| `checkBulkAvailability` | `GET /v-next/search/bulk-availability` | Examiner un lot de noms candidats en un seul appel | Aucune |
| `getSuggestions` | `GET /v-next/search/suggestions` | Obtenir des suggestions algorithmiques de noms en rapport avec une requête | Aucune |

### Enregistrement et commandes

| Opération | Point de terminaison | Fonction | Authentification |
| --- | --- | --- | --- |
| `registerDomain` | `POST /v-next/orders/register-domain` | Enregistrer un domaine pour une durée de 0 à 10 ans. Accepte un objet `domainSetupOptions` (`autoPark`, `autoEns`, `autoRenew`, `dnssec`, `keepExistingNameservers`) ainsi qu’un champ facultatif `nftReceivingWallet` | Clé API |
| `registerWithRecords` | `POST /v-next/orders/register-domain/records` | Enregistrer un domaine et appliquer un jeu initial d’enregistrements DNS au cours du même appel | Clé API |
| `getOrder` | `GET /v-next/orders/{orderId}` | Interroger une commande jusqu’à ce qu’elle atteigne un état final : `SUCCEEDED`, `FAILED`, `CANCELLED` ou `PARTIALLY_COMPLETED` | Clé API |

L’enregistrement est asynchrone : `registerDomain` renvoie immédiatement l’`id` d’une commande, puis l’agent interroge `getOrder` jusqu’à ce qu’elle aboutisse. Le [guide pas à pas avec Claude](/fr/blog/claude-mcp-domains/) et le [guide de configuration multi-agents](/fr/blog/ai-agent-register/) montrent tous deux ce modèle sous la forme d’une transcription complète.

### Gestion des enregistrements DNS

Toutes les opérations CRUD sont disponibles, enregistrement par enregistrement ou par lots, avec en plus une opération de lecture qui ne requiert aucune authentification :

| Opération | Point de terminaison | Fonction | Authentification |
| --- | --- | --- | --- |
| `getDnsRecords` | `GET /v-next/dns/records` | Répertorier tous les enregistrements d’une zone | Aucune |
| `createDnsRecord` | `POST /v-next/dns/records` | Créer un enregistrement | Clé API |
| `updateDnsRecord` | `PUT /v-next/dns/record` | Mettre à jour un enregistrement à partir de son ID | Clé API |
| `deleteDnsRecord` | `DELETE /v-next/dns/record` | Supprimer un enregistrement à partir de son ID | Clé API |
| `batchCreateDnsRecords` | `POST /v-next/dns/records/batch` | Créer plusieurs enregistrements en un seul appel | Clé API |
| `batchUpdateDnsRecords` | `PUT /v-next/dns/records/batch` | Mettre à jour plusieurs enregistrements en un seul appel | Clé API |
| `batchDeleteDnsRecords` | `DELETE /v-next/dns/records/batch` | Supprimer plusieurs enregistrements en un seul appel | Clé API |

[Types d’enregistrements](/fr/glossary/dns-record-types/) pris en charge : A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA, DS, TLSA, SSHFP, HTTPS, SVCB, NAPTR et SPF. Deux règles de formatage font échouer la plupart des premières tentatives : `zoneName` ne doit pas se terminer par un point, tandis que les valeurs `rdata` des enregistrements CNAME, MX et NS doivent se terminer par un point.

### Paramètres activables à l’échelle d’un domaine

Ces opérations activent ou désactivent une fonctionnalité dans son ensemble, contrairement à celles qui agissent sur un seul enregistrement DNS :

| Opération | Point de terminaison | Fonction | Authentification |
| --- | --- | --- | --- |
| `toggleDomainParking` / `parkDomain` | `PUT` / `POST /v-next/dns/park` | Activer ou désactiver le [parking de domaine](/fr/glossary/domain-parking/) | Clé API |
| `isDomainParked` | `GET /v-next/dns/parked` | Vérifier si un domaine est actuellement parqué | Aucune |
| `toggleForwarding` | `PUT /v-next/dns/forwarding` | Activer ou désactiver le [transfert de domaine](/fr/glossary/domain-forwarding/) | Clé API |
| `toggleAutoEns` | `PUT /v-next/dns/auto-ens` | Activer ou désactiver la publication automatique d’enregistrements [ENS](/fr/glossary/ens/) | Clé API |
| `toggleVercelAnyCastRecords` | `PUT /v-next/dns/vercel-anycast` | Activer ou désactiver les enregistrements DNS Vercel Anycast | Clé API |

Notez que [DNSSEC](/fr/glossary/dnssec/) ne fait pas partie de ces paramètres : il est défini au moment de l’enregistrement, dans l’un des champs `domainSetupOptions` de `registerDomain` ci-dessus, et non par un point de terminaison distinct qu’un agent appellerait ultérieurement.

### Configuration du domaine

| Opération | Point de terminaison | Fonction | Authentification |
| --- | --- | --- | --- |
| `getAutoRenew` | `GET /v-next/domain-config/auto-renew` | Vérifier si le renouvellement automatique est activé | Clé API |
| `toggleAutoRenew` | `PUT /v-next/domain-config/auto-renew` | Activer ou désactiver le renouvellement automatique | Clé API |

Lorsque le [renouvellement automatique](/fr/glossary/domain-renewal/) est activé, le domaine est renouvelé automatiquement avant son expiration au moyen des modes de paiement associés au portefeuille de son propriétaire. Il s’agit d’une autorisation permanente qu’il convient d’accorder délibérément domaine par domaine, plutôt que de l’activer par défaut pour tout un portefeuille.

### Prospection de clients

La fonctionnalité la plus récente transforme les domaines détenus en pipeline commercial, plutôt que de les laisser sous forme de liste d’actifs statique :

| Opération | Point de terminaison | Fonction | Authentification |
| --- | --- | --- | --- |
| `getUserDomains` | `GET /v-next/user/domains` | Répertorier les domaines appartenant au portefeuille authentifié | Clé API |
| `startOutboundRun` | `POST /v-next/outbound/runs` | Lancer une recherche de prospects par IA pour un domaine détenu, avec un `reasoningEffort` de niveau `low`, `medium` ou `high` | Clé API |
| `listOutboundRuns` | `GET /v-next/outbound/runs` | Répertorier les recherches passées et en cours | Clé API |
| `getOutboundRun` | `GET /v-next/outbound/runs/{runId}` | Interroger l’état d’une recherche : `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED` ou `CANCELED` | Clé API |
| `listOutboundLeads` | `GET /v-next/outbound/runs/{runId}/leads` | Répertorier des acheteurs potentiels classés, avec pour chacun une justification, les coordonnées trouvées et tout brouillon de prise de contact existant | Clé API |
| `prepareOutboundOutreach` | `POST /v-next/outbound/runs/{runId}/leads/{leadId}/outreach` | Générer un brouillon de prise de contact pour un prospect, ou renvoyer celui qui existe déjà sans coût de génération supplémentaire | Clé API |

La réponse exclut les mécanismes internes de classement — score, détails du modèle, statut de prospect masqué — afin qu’un agent qui résume les résultats pour une personne ne voie que la justification publique, les coordonnées trouvées et l’existence éventuelle d’un brouillon.

### Paiements et compte

| Opération | Point de terminaison | Fonction | Authentification |
| --- | --- | --- | --- |
| `getBalance` | `GET /v-next/balance` | Vérifier le solde NFSC (Namefi Service Credit) qui finance les enregistrements | Clé API |
| `requestNfscFaucet` | `POST /v-next/user/faucet` | Demander gratuitement des crédits NFSC de test (environnements de développement uniquement) | Clé API |
| `registerDomainX402` | `GET /x402/domain/{domainName}` | Enregistrer et payer en une seule opération HTTP 402 signée en stablecoin, sans compte Namefi | Signature de portefeuille |
| — | `GET /x402/purchase/{purchaseId}` | Interroger l’état d’un achat x402 | Aucune |
| `registerDomainMPP` | `GET /mpp/domain/{domainName}` | Enregistrer et payer au moyen du workflow de défi-réponse MPP (Machine Payable Protocol) | Signature de portefeuille |

Cela couvre toutes les opérations prévues pour la recherche, l’enregistrement, le DNS, la configuration des domaines, la prospection et le paiement. Chacune est accessible en tant qu’outil MCP au moyen de la connexion unique au serveur, ou sous forme de simple appel HTTPS pour les agents qui ne prennent pas en charge MCP. (L’API de Namefi propose également quelques opérations de gestion de compte et d’assistance EIP-712/SIWE qui ne figurent pas dans cette liste ; l’ensemble complet et à jour se trouve toujours dans la spécification OpenAPI citée dans les sources ci-dessous.)

## Le modèle d’authentification : trois voies d’accès, toutes adossées à un portefeuille

Chaque opération d’écriture ci-dessus vérifie la même chose : l’appelant contrôle-t-il le portefeuille qui possède, ou possédera, le domaine ? Cette vérification emprunte l’une des trois voies suivantes. La méthode applicable dépend de l’opération et non d’un paramètre unique au niveau du compte.

**Clé API (`x-api-key`).** C’est l’option la plus simple, utilisée dans tous les exemples pratiques de ce groupe d’articles. Générez-en une sur [namefi.io/api-key](https://namefi.io/api-key). Elle fonctionne avec toutes les opérations ci-dessus, notamment les écritures DNS, le parking et l’enregistrement, car elle hérite des autorisations du portefeuille qui l’a générée. Il suffit de la transmettre dans un simple en-tête HTTP, sans SDK.

**Signature de données typées EIP-712.** Pour une utilisation programmatique sans clé stockée, signez chaque requête avec un [portefeuille](/fr/glossary/wallet/) Ethereum. Les en-têtes `x-namefi-signer`, `x-namefi-signature` et `x-namefi-eip712-type` enveloppent la charge utile avec un horodatage et un nonce à usage unique qui expire au bout de 300 secondes. Sans clé API, c’est la méthode requise par des opérations telles que `toggleDomainParking`, `createDnsRecord` et `registerDomain`. Le domaine et les définitions de types proviennent de points de terminaison actifs (`GET /v-next/eip712/domain`, `/eip712/types`) plutôt que d’une constante codée en dur, puisque la documentation de Namefi précise qu’ils peuvent évoluer. Les portefeuilles de smart contract ne peuvent pas signer directement : un compte externe autorisé signe donc au nom du contrat, tandis que `x-namefi-erc1271-account` ou `x-namefi-eip7702-account` indique quel contrat autorise la requête.

**SIWE (Sign-In with Ethereum).** Il s’agit d’un jeton de session (`x-namefi-siwe-token`) destiné aux lectures protégées qui n’exigent pas une nouvelle signature à chaque appel, comme le recensement des domaines détenus ou des commandes. Récupérez un nonce, obtenez le message à signer, signez-le avec `personal_sign`, vérifiez-le, puis réutilisez le jeton.

Quelques opérations ne nécessitent aucune authentification — `checkAvailability`, `getSuggestions`, `getDnsRecords`, `isDomainParked` et les points de terminaison de métadonnées EIP-712 — car elles sont en lecture seule et n’exposent rien que le DNS public d’un domaine ne montrerait déjà à un navigateur.

Le paiement vient se superposer à ce modèle. `registerDomainX402` règle un achat via le [protocole x402](https://x402.org) : le portefeuille de l’acheteur signe une autorisation EIP-3009 `transferWithAuthorization` pour un [stablecoin](/fr/glossary/stablecoin/) tel que l’USDC, sans qu’aucun compte Namefi soit nécessaire. `registerDomainMPP` aboutit au même résultat au moyen d’un défi-réponse signé. Ces deux méthodes permettent à un agent d’éviter la création d’un compte et de payer à la transaction. [Payer des domaines avec un portefeuille crypto : aucun compte requis](/fr/blog/wallet-checkout/) décrit ce parcours de bout en bout.

## La tokenisation passe par le catalogue, elle ne fonctionne pas en parallèle

`registerDomain` frappe le domaine sous forme de [NFT](/fr/glossary/nft/) — un jeton [ERC-721](/fr/glossary/erc-721/), [l’interface standard](https://eips.ethereum.org/EIPS/eip-721) que la plupart des places de marché et portefeuilles savent déjà lire — sur Base par défaut, à destination du portefeuille associé à la clé API de l’appelant. `nftReceivingWallet` permet de le rediriger vers un autre portefeuille ou une autre blockchain lors de l’enregistrement. Toutes les opérations ultérieures — écritures DNS, parking, renouvellement automatique, prospection de clients — vérifient ce même enregistrement de propriété on-chain plutôt qu’une base de données de comptes distincte. Un [domaine tokenisé](/fr/glossary/tokenized-domain/) échangé sur une place de marché telle qu’[OpenSea](https://opensea.io) réunit le contrôle de son DNS et sa propriété ERC-721 en un seul objet, et non en deux systèmes à synchroniser manuellement.

## Trois agents, trois façons d’utiliser le même ensemble d’outils

**Un développeur enregistre un domaine et met en place son DNS au cours d’une même conversation.** `checkAvailability` confirme que le nom est disponible, `registerDomain` soumet l’enregistrement avec les options `autoRenew` et `dnssec` activées dans `domainSetupOptions`, puis, une fois que la commande atteint l’état `SUCCEEDED`, `batchCreateDnsRecords` crée les enregistrements CNAME et TXT attendus par l’étape de vérification d’une plateforme de déploiement. Le [guide de démarrage rapide du MCP de Namefi pour les agents de programmation](/fr/blog/mcp-quickstart/) détaille cette séquence dans un éditeur.

**Un trader de domaines gère un portefeuille.** `getUserDomains` récupère les actifs actuels, `checkBulkAvailability` examine de nouveaux candidats en un appel et `registerDomain` enregistre ceux qui méritent d’être acquis. Pour les noms destinés à la revente, `toggleDomainParking` met en ligne une page d’atterrissage et `isDomainParked` confirme qu’elle est active. À l’échelle du portefeuille, `getAutoRenew` et `toggleAutoRenew` déterminent quels noms justifient une autorisation permanente de renouvellement et lesquels sont assez spéculatifs pour qu’on les laisse expirer.

**Une entreprise lance une prospection sur les noms qu’elle possède déjà.** `getUserDomains` identifie un domaine inutilisé, `startOutboundRun` lance la recherche et `getOutboundRun` en interroge l’état jusqu’à ce qu’il atteigne `SUCCEEDED`. `listOutboundLeads` renvoie des entreprises classées dont le profil suggère qu’elles pourraient souhaiter acquérir ce nom, et `prepareOutboundOutreach` rédige un e-mail pour chaque prospect : celui-ci n’est généré qu’une fois, puis renvoyé gratuitement lors des appels suivants.

## Avant de laisser un agent exécuter ces opérations sans supervision

La documentation de Namefi sur la prospection qualifie quatre opérations d’**opérations à fort impact** — `registerDomain`, `registerWithRecords`, `startOutboundRun`, `prepareOutboundOutreach` — car chacune dépense un solde ou produit une action visible à l’extérieur. Les outils en lecture seule comme `checkAvailability` peuvent être exécutés de façon autonome sans risque. Toute opération qui crée une commande, modifie un enregistrement DNS sur un domaine actif ou prépare un brouillon de prise de contact mérite une étape de confirmation. [Qu’est-ce qu’un bureau d’enregistrement de domaines natif pour les agents ?](/fr/blog/agent-native/) propose une liste de contrôle plus complète pour évaluer sous cet angle l’interface destinée aux agents de n’importe quel bureau d’enregistrement.

## Maintenir ce catalogue à jour

Ce tableau reflète la spécification OpenAPI active de Namefi à la date de publication ci-dessus, et non une feuille de route figée. Les nouvelles opérations apparaissent dans [namefi.io/llms.txt](https://namefi.io/llms.txt) et [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) avant d’être intégrées au tableau d’un article de blog.

## Questions fréquentes

### Ai-je besoin d’une clé API simplement pour vérifier si un nom est disponible ?
Non. `checkAvailability`, `checkBulkAvailability` et `getSuggestions` ne nécessitent aucune authentification. Ils fonctionnent donc avec un agent fraîchement connecté, avant même d’approvisionner le solde.

### Un agent peut-il utiliser l’intégralité de ce catalogue sans que je possède jamais de clé API Namefi ?
Oui. `registerDomainX402` et `registerDomainMPP` règlent tous deux un enregistrement par signature de portefeuille sans compte Namefi, tandis que la signature EIP-712 couvre directement depuis un portefeuille le reste des opérations d’écriture.

### Un domaine est-il automatiquement tokenisé lorsque je l’enregistre par l’une de ces méthodes ?
Oui, par défaut, quelle que soit la méthode d’enregistrement. Si `nftReceivingWallet` n’est pas indiqué, le domaine est enregistré sur Base sous forme de NFT ERC-721 dans le portefeuille associé à la clé API de l’appelant.

### Quelles opérations une personne devrait-elle confirmer avant qu’un agent autonome ne les exécute ?
Au minimum, les quatre opérations que la documentation de Namefi qualifie d’opérations à fort impact — `registerDomain`, `registerWithRecords`, `startOutboundRun`, `prepareOutboundOutreach` — auxquelles s’ajoute toute écriture DNS sur un domaine qui reçoit déjà du trafic réel.

## Connectez votre agent au catalogue complet

Tous les outils ci-dessus sont accessibles derrière une seule connexion : `https://api.namefi.io/mcp`. Si vous ne l’avez pas encore configurée, [Comment enregistrer un domaine avec votre agent IA sur Namefi](/fr/blog/ai-agent-register/) fournit la configuration exacte pour six clients différents, tandis que [llms.txt pour les domaines](/fr/blog/llms-txt/) explique la couche de découverte sous-jacente.

**[Générez une clé API Namefi](https://namefi.io/api-key)** et dirigez votre agent vers le serveur : les outils présentés ci-dessus sont ceux qu’il y trouvera.

## Sources et lectures complémentaires

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (URL du serveur MCP, transport, authentification et référence des opérations principales — source primaire de ce catalogue)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (référence en un seul fichier intégrant les paiements Web3 et la prospection de clients)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (description détaillée des workflows x402, MPP, EIP-712 et SIWE)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (descripteur de découverte MCP : nom du serveur, URL, transport et type d’authentification)
- Namefi — [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json) (spécification OpenAPI 3 lisible par machine — source de chaque `operationId` et point de terminaison du catalogue de fonctionnalités ci-dessus)
- Namefi — [docs.namefi.io : Authentification](https://docs.namefi.io/docs/02-authentication.mdx#:~:text=The%20Namefi%20API%20supports%20three%20authentication%20methods) (modes d’authentification par clé API, EIP-712 et SIWE ; exigences d’authentification propres à chaque opération ; délégation ERC-1271/EIP-7702)
- Namefi — [docs.namefi.io : Enregistrer un domaine](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (champs de la requête d’enregistrement, processus d’interrogation et valeurs d’état des commandes)
- Namefi — [docs.namefi.io : Gérer votre solde](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (solde NFSC et points de terminaison du faucet)
- Model Context Protocol — [Qu’est-ce que le Model Context Protocol ?](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (présentation du protocole)
- llmstxt.org — [Le fichier /llms.txt](https://llmstxt.org) (spécification et justification de la convention de découverte suivie par le fichier de Namefi)
- x402.org — [Protocole x402](https://x402.org) (norme de paiement en stablecoin fondée sur HTTP 402 qui sous-tend `registerDomainX402`)
- Ethereum Improvement Proposals — [ERC-721 : norme de jeton non fongible](https://eips.ethereum.org/EIPS/eip-721) (norme de jeton mise en œuvre par les NFT de domaines de Namefi)
