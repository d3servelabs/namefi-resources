---
title: "Acheter un domaine avec Claude : guide pas à pas de Namefi MCP"
date: '2026-07-10'
language: 'fr'
tags: ['ai-agents', 'domains', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
format: guide
ogImage: ../../assets/claude-mcp-domains-og.jpg
description: "Connectez Claude au serveur MCP de Namefi et enregistrez un vrai domaine depuis une seule conversation. Configuration exacte, transcription annotée et dépannage."
keywords: ["namefi mcp", "domaine claude mcp", "configuration serveur mcp", "acheter un domaine avec claude", "x-api-key", "tutoriel pas à pas", "enregistrement de domaine namefi mcp", "enregistrer un domaine avec claude desktop", "acheter un domaine avec claude code", "intégration namefi claude", "bureau d'enregistrement de domaines mcp", "agent ia acheter domaine avec claude", "mcp http streamable"]
relatedArticles:
  - /fr/blog/ai-agent-register/
  - /fr/blog/cf-namecom-namefi/
  - /fr/blog/ai-domain-platforms/
  - /fr/blog/agent-native/
  - /fr/blog/airo-vs-namefi/
relatedTopics:
  - /fr/topics/domain-tokenization/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/tokenize-your-com/
  - /fr/series/blockchain-concepts/
relatedGlossary:
  - /fr/glossary/ai-agent/
  - /fr/glossary/registrar/
  - /fr/glossary/dns-record-types/
  - /fr/glossary/tokenized-domain/
  - /fr/glossary/x402/
---

À la fin de ce guide, vous aurez enregistré un véritable domaine auprès de l'[ICANN](/fr/glossary/icann/), dont le DNS pointera vers ce que vous êtes en train de créer, le tout entièrement depuis une conversation avec Claude — sans paiement dans le navigateur, sans panier et sans CAPTCHA. Voici le guide de configuration de l'équipe Namefi pour le serveur MCP de [Namefi](https://namefi.io) : une présentation accessible de la même API que nous publions à l'intention des agents sur [namefi.io/llms.txt](https://namefi.io/llms.txt) et [docs.namefi.io](https://docs.namefi.io). Lorsqu'un détail n'est pas encore finalisé ou publié, ce guide le signale explicitement au lieu de faire des suppositions.

Il existe déjà des tutoriels tiers expliquant comment « enregistrer un domaine avec votre [agent IA](/fr/glossary/ai-agent/) » — [un exemple populaire](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26) illustre le principe avec un autre serveur MCP, conçu comme un revendeur reposant sur l'API Registrar de Cloudflare. Le fonctionnement de MCP repose sur la même idée d'un fournisseur à l'autre ; ce guide porte spécifiquement sur le propre serveur MCP de Namefi, son modèle d'authentification et son option de [domaine tokenisé](/fr/glossary/tokenized-domain/), vérifiés à partir de la documentation de Namefi plutôt que de la description fournie par un tiers.

## MCP en quelques mots

Le [Model Context Protocol](https://modelcontextprotocol.io) (MCP) est une norme ouverte qui permet de connecter une application d'IA — ici, Claude — à des outils et sources de données externes. La documentation du protocole le décrit comme [un port USB-C pour les applications d'IA](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) : un connecteur standardisé unique, plutôt qu'une intégration personnalisée pour chaque outil. Une fois connecté au serveur MCP de Namefi, Claude dispose d'un ensemble défini d'opérations qu'il peut appeler — vérifier la disponibilité, enregistrer un domaine, lire et modifier les enregistrements DNS — au lieu d'avoir à reconstituer le fonctionnement d'une API REST à partir d'une documentation collée dans la conversation.

## Prérequis

- **Un client Claude compatible avec MCP.** Ce guide couvre Claude Code (en ligne de commande) avec des commandes concrètes et testées, ainsi que Claude Desktop / claude.ai (par l'intermédiaire des connecteurs personnalisés) selon la procédure générale documentée. D'autres clients MCP, comme Cursor ou Windsurf, se connectent au même serveur ; consultez les sections propres à chaque agent dans [Comment enregistrer un domaine avec votre agent IA sur Namefi](/fr/blog/ai-agent-register/), ou le condensé [Démarrage rapide de Namefi MCP : Claude Code, Cursor et Windsurf](/fr/blog/mcp-quickstart/) si vous avez uniquement besoin des commandes de connexion.
- **Une clé API Namefi**, générée sur [namefi.io/api-key](https://namefi.io/api-key), *ou* un [portefeuille](/fr/glossary/wallet/) crypto si vous préférez payer chaque transaction sans aucune clé API (voir la section sur le portefeuille vers la fin du guide).
- **Un solde NFSC approvisionné** si vous effectuez l'enregistrement dans l'environnement de production de Namefi. Les NFSC (Namefi Service Credits) constituent le solde débité lors de l'enregistrement d'un domaine ; la documentation de Namefi explique comment le recharger depuis le tableau de bord Namefi en production et comment demander gratuitement des crédits de test à un endpoint faucet dans les environnements de développement.

## Étape 1 : obtenir une clé API Namefi

La [clé API](https://namefi.io/api-key) constitue le moyen d'authentification le plus simple, et c'est celui utilisé tout au long de ce guide : un seul en-tête couvre toutes les opérations — enregistrement, création, modification et suppression d'enregistrements DNS. Il faut toutefois retenir un point avant de générer une clé : **la clé hérite des autorisations du portefeuille qui l'a générée.** Si vous souhaitez gérer le DNS d'un domaine que vous possédez déjà, générez la clé depuis le portefeuille qui détient le NFT de ce domaine. Une clé générée depuis un autre portefeuille ne disposera pas d'un accès en écriture à un domaine dont le [titulaire](/fr/glossary/registrant/) est une autre personne.

Une fois générée, la clé est une chaîne préfixée par `nfk_`. Vous la transmettrez dans l'en-tête `x-api-key` pour chaque opération d'écriture ; les opérations en lecture seule, comme une vérification de disponibilité, n'en nécessitent aucune.

## Étape 2 : connecter Claude au serveur MCP de Namefi

Namefi, [bureau d'enregistrement](/fr/glossary/registrar/) accrédité par l'ICANN, exploite un serveur MCP unique pour l'ensemble de son API, à l'adresse `https://api.namefi.io/mcp`, accessible via le transport Streamable HTTP. Le serveur expose chaque opération `/v-next` sous la forme d'un outil typé — recherche, enregistrement, DNS, configuration de domaine et prospection sortante. Son existence et ses informations de connexion sont elles-mêmes publiées dans un descripteur de découverte sur [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json), dans un format lisible par machine afin qu'un agent puisse trouver le serveur sans qu'un humain ait à lui fournir d'abord l'URL.

### Claude Code

Une seule commande suffit pour ajouter le serveur à Claude Code :

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

Elle correspond à la [syntaxe documentée de Claude Code](https://code.claude.com/docs/en/mcp) pour ajouter un serveur MCP HTTP distant avec un en-tête d'authentification personnalisé. La forme générale est `claude mcp add --transport http <name> <url> --header "<Header-Name>: <value>"`. Exécutez-la une fois dans votre terminal (en remplaçant `YOUR_KEY` par la clé obtenue à l'étape 1) : Claude Code inscrit alors le serveur dans la configuration MCP de votre projet ou de votre compte utilisateur. Par défaut, la commande n'enregistre le serveur que pour le projet en cours ; ajoutez `--scope user` si vous souhaitez qu'il soit accessible dans tous vos projets. Vous pouvez également omettre complètement la clé et l'ajouter plus tard si, pour commencer, vous avez uniquement besoin d'outils en lecture seule comme la recherche de disponibilité.

Vérifiez la connexion avec `claude mcp list`, qui devrait indiquer que `namefi` est connecté, puis utilisez `/mcp` dans une session Claude Code pour voir le nombre d'outils exposés par le serveur de Namefi.

### Claude Desktop et claude.ai

Claude Desktop et claude.ai se connectent aux serveurs MCP distants au moyen de **connecteurs personnalisés**, selon la procédure décrite sur [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers) : ouvrez les paramètres, accédez à Connecteurs, choisissez « Ajouter un connecteur personnalisé », puis saisissez l'URL du serveur — `https://api.namefi.io/mcp`. Après avoir cliqué sur Ajouter, vous êtes invité à effectuer l'authentification. Selon la documentation d'Anthropic, cette étape « fait généralement appel à OAuth, à des clés API ou à une combinaison nom d'utilisateur/mot de passe », en fonction des exigences du serveur concerné ; Claude affiche alors la demande d'authentification requise par le serveur.

<!-- TODO : à confirmer avec l'équipe — le champ exact présenté par l'écran d'authentification des connecteurs personnalisés de Claude Desktop pour un en-tête de type x-api-key ; la documentation publique d'Anthropic décrit l'étape générale d'authentification sans présenter spécifiquement le serveur de Namefi --> Si la configuration du connecteur Desktop ne propose aucun emplacement évident pour saisir la clé, Claude Code reste pour l'instant la méthode vérifiée, tandis que les outils en lecture seule (recherche de disponibilité) fonctionnent via le connecteur sans aucune clé.

## Étape 3 : approvisionner votre solde NFSC

L'enregistrement d'un domaine est une opération payante : il nécessite des NFSC (Namefi Service Credits) sur le portefeuille payeur. Dans un environnement de développement ou de test, un faucet (`POST /v-next/user/faucet`, ou `client.user.requestNfscFaucet()` dans le SDK) distribue gratuitement des crédits de test, avec une limitation de fréquence par portefeuille. En production, les NFSC se rechargent depuis le tableau de bord Namefi. <!-- TODO : à confirmer avec l'équipe — la procédure exacte de recharge en production : moyens de paiement acceptés et possibilité d'acheter directement depuis la conversation ou uniquement via l'interface du tableau de bord --> Vous pouvez consulter votre solde à tout moment, soit en demandant à Claude (« quel est mon solde Namefi ? ») une fois la connexion établie, soit en interrogeant directement `GET /v-next/balance`.

## Étape 4 : la conversation d'achat

Une fois le serveur MCP connecté et le solde approvisionné, le reste de la procédure se déroule en langage naturel. Voici une version annotée de cette conversation, associée à l'opération sous-jacente indiquée dans la documentation de l'API de Namefi pour chaque étape.

**1. Vous demandez à Claude de vérifier un nom.**

> « Le domaine `example.com` est-il disponible à l'enregistrement ? »

Claude appelle la vérification de disponibilité (l'opération `checkAvailability`, directement accessible à l'adresse `GET /v-next/search/availability?domain=example.com`, sans authentification). Il vous indique si le nom est libre et peut également vérifier simultanément un ensemble de candidats grâce à la variante de disponibilité en lot, si vous lui soumettez plusieurs noms à comparer.

**2. Vous confirmez et enregistrez le domaine.**

> « Enregistre-le pour un an et configure le DNS afin que `@` pointe vers 203.0.113.10. »

Claude envoie une commande d'enregistrement (`registerDomain`, `POST /v-next/orders/register-domain`) — ou, si vous avez aussi demandé des enregistrements DNS, la variante combinée `register-domain/records`, qui applique l'[enregistrement A](/fr/glossary/dns-record-types/) demandé dès que la commande est terminée. Le corps de la requête accepte un `normalizedDomainName` (en minuscules, sans point final, avec n'importe quel [TLD](/fr/glossary/tld/) déclaré enregistrable par `search/availability`) et une valeur `durationInYears` (0–10, 1 par défaut). Le champ facultatif `nftReceivingWallet` contrôle la tokenisation : si vous l'omettez, le domaine est enregistré sous forme de NFT sur Base au bénéfice du portefeuille associé à votre clé API. Un objet `domainSetupOptions` décrit d'autres paramètres propres au domaine, notamment `autoRenew`, `dnssec` et `keepExistingNameservers` ; ce dernier permet à Claude d'enregistrer le domaine sans rediriger la délégation de ses [serveurs de noms](/fr/glossary/nameserver/) depuis son emplacement actuel.

**3. Claude interroge l'état jusqu'à la fin de la commande.**

L'enregistrement est asynchrone. Claude (ou vous-même, si vous surveillez l'état) interroge `getOrder` (`GET /v-next/orders/{orderId}`) jusqu'à ce que la commande atteigne un état final : `SUCCEEDED`, `FAILED`, `CANCELLED` ou `PARTIALLY_COMPLETED`. Un enregistrement classique s'achève après quelques cycles d'interrogation ; Claude vous en informe lorsqu'il est terminé, au lieu de vous laisser devant un indicateur de chargement.

**4. Vous demandez d'autres enregistrements DNS, si vous ne les avez pas tous configurés au départ.**

> « Ajoute aussi un CNAME pour `www` pointant vers `cname.vercel-dns.com.`, ainsi qu'un enregistrement TXT sous `_verify` avec ce jeton. »

Claude appelle `createDnsRecord` (`POST /v-next/dns/records`) pour chacun d'eux. Deux règles de formatage sont à connaître avant de formuler votre demande : la valeur `rdata` des [CNAME](/fr/glossary/dns-record-types/) et des types d'enregistrements similaires doit se terminer par un point (`cname.vercel-dns.com.`), tandis que `zoneName` — le domaine lui-même — ne doit pas en comporter. Inverser ces deux règles est la cause la plus courante d'une erreur de validation dans cette procédure.

**5. Facultatif : activer le renouvellement automatique.**

> « Active le renouvellement automatique pour ce domaine. »

Claude active le [renouvellement automatique](/fr/glossary/domain-renewal/) au moyen de `PUT /v-next/domain-config/auto-renew`. Lorsque cette option est activée, le domaine est renouvelé automatiquement avant son expiration au moyen des modes de paiement disponibles dans le portefeuille du propriétaire. Il est utile de le savoir avant de l'activer, puisqu'il s'agit d'une autorisation permanente et non d'une confirmation ponctuelle.

## Étape 5 : vérifier la résolution du domaine

La [propagation DNS](/fr/glossary/dns-propagation/) n'est pas instantanée ; attendez donc quelques minutes avant de vérifier les enregistrements. Les lectures DNS ne nécessitent aucune authentification : vous (ou Claude) pouvez confirmer ce qui est publié avec `GET /v-next/dns/records?zoneName=example.com`, ou au moyen d'un outil public de recherche DNS. Si vous avez dirigé le domaine vers une plateforme de déploiement, l'étape de vérification propre à cette plateforme (qui recherche l'enregistrement TXT qu'elle a demandé) constitue une confirmation distincte qu'il convient également d'effectuer.

## Payer avec un portefeuille plutôt qu'avec une clé API

Tout ce qui précède repose sur la clé API. Namefi permet également d'enregistrer un domaine à l'aide d'un portefeuille crypto, sans aucun compte Namefi, grâce au protocole [x402](/fr/glossary/x402/) : le portefeuille de l'acheteur signe une autorisation EIP-3009, l'API répond `402 Payment Required` avec le prix si aucune autorisation n'est jointe, puis finalise l'enregistrement dès réception d'un paiement valide. Ce parcours mérite son propre guide plutôt qu'une simple note de bas de page : consultez [Payer des domaines avec un portefeuille crypto : aucun compte requis](/fr/blog/wallet-checkout/), ou la section consacrée au paiement dans [Comment enregistrer un domaine avec votre agent IA sur Namefi](/fr/blog/ai-agent-register/), pour tous les détails.

## Dépannage

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| `401 UNAUTHORIZED` lors d'un appel en écriture | Clé API invalide, expirée ou générée depuis un portefeuille qui ne possède pas le domaine | Générez une nouvelle clé sur [namefi.io/api-key](https://namefi.io/api-key) à l'aide du portefeuille qui possède (ou possédera) le domaine |
| `403 FORBIDDEN` | La clé est valide, mais le portefeuille auquel elle est associée ne possède pas ce domaine précis | Vérifiez la propriété dans votre compte Namefi avant de réessayer |
| Commande d'enregistrement bloquée dans un état non final | Comportement normal — l'enregistrement est asynchrone | Continuez d'interroger `getOrder` ; les exemples de Namefi effectuent une requête toutes les 5 secondes. Ne considérez la commande comme bloquée que si elle n'atteint jamais `SUCCEEDED`, `FAILED`, `CANCELLED` ou `PARTIALLY_COMPLETED` |
| Création ou modification d'un enregistrement DNS rejetée avec une erreur de validation | `zoneName` se termine par un point, ou il manque le point final à la valeur `rdata` d'un CNAME/MX/NS | `zoneName` = sans point final ; valeurs `rdata` de type FQDN = point final obligatoire |
| Échec complet de l'enregistrement | Solde NFSC insuffisant dans le portefeuille payeur | Vérifiez le solde (`GET /v-next/balance`), puis rechargez-le avec le faucet (test) ou le tableau de bord Namefi (production) |
| Claude indique qu'aucun outil de domaine n'est disponible | Le serveur MCP n'est pas connecté, ou il l'est sans l'en-tête requis pour les opérations d'écriture | Relancez `claude mcp add` avec l'option `--header`, ou vérifiez l'état de la connexion avec `/mcp` / `claude mcp list` |

## Foire aux questions

### Dois-je connaître l'API REST de Namefi pour utiliser cette méthode, ou puis-je simplement parler à Claude en langage naturel ?
Le langage naturel suffit pour l'ensemble du parcours ci-dessus : « ce domaine est-il disponible ? », « enregistre-le », « fais-le pointer vers cette adresse IP » fonctionnent comme des demandes directes. Les endpoints et champs de requête présentés dans ce guide vous permettent de vérifier ce que Claude effectue en arrière-plan, ou de les appeler directement si vous écrivez un script au lieu de discuter avec lui.

### Enregistrer un domaine par l'intermédiaire de Claude coûte-t-il plus cher que sur le site de Namefi ?
Ce guide ne prétend pas qu'une méthode est moins chère que l'autre. <!-- TODO : à confirmer avec l'équipe — la tarification de l'API/MCP de Namefi est-elle identique à la tarification standard de l'enregistrement, ou différente ? --> Dans tous les cas, l'enregistrement est débité du même solde NFSC, que la demande provienne d'un navigateur, d'un script ou d'un appel d'outil MCP.

### Mon domaine est-il automatiquement tokenisé sous forme de NFT lorsque je l'enregistre de cette manière ?
Oui, par défaut. Si vous n'indiquez pas de `nftReceivingWallet` dans la requête d'enregistrement, le domaine est enregistré sous forme de NFT sur Base au bénéfice du portefeuille associé à votre clé API. Vous pouvez le rediriger vers un autre portefeuille ou une autre blockchain au moment de l'enregistrement.

### Que se passe-t-il si la requête d'enregistrement DNS de Claude contient une faute de frappe ? Peut-elle perturber mon domaine sans aucun avertissement ?
Les écritures DNS sont soumises à la validation de Namefi avant d'être appliquées, et une valeur `rdata` mal formée (par exemple, l'absence de point final dans la cible d'un CNAME) est rejetée avec une erreur plutôt que silencieusement acceptée — consultez le tableau de dépannage ci-dessus. Malgré tout, traitez les modifications DNS d'un domaine en production comme n'importe quel changement d'infrastructure : vérifiez ce que Claude s'apprête à envoyer avant de confirmer.

### Puis-je utiliser ce même serveur MCP avec Cursor ou Windsurf plutôt qu'avec Claude ?
Oui. Le serveur de Namefi utilise le même protocole MCP ouvert quel que soit le client qui s'y connecte ; rien ne change donc côté serveur. Les commandes de connexion côté client diffèrent selon l'éditeur. Consultez les sections de configuration par client dans [Comment enregistrer un domaine avec votre agent IA sur Namefi](/fr/blog/ai-agent-register/), ou le guide plus court [Démarrage rapide de Namefi MCP : Claude Code, Cursor et Windsurf](/fr/blog/mcp-quickstart/).

## Achetez votre prochain domaine depuis une conversation

Il s'agit de la configuration exacte prise en charge par Namefi aujourd'hui, et non d'une hypothèse. Une fois le serveur MCP connecté, toutes les étapes — rechercher un nom, l'enregistrer, configurer le DNS et, facultativement, le transformer en jeton détenu dans un portefeuille — s'effectuent sans quitter la conversation. Le serveur MCP ne se limite pas à l'enregistrement : prospection sortante, opérations DNS par lots et configuration de domaines sont accessibles depuis la même connexion une fois celle-ci établie. Consultez [Serveur MCP de Namefi : des outils de domaine pour les agents IA](/fr/blog/namefi-mcp/) pour découvrir le catalogue complet des outils.

**[Générez une clé API Namefi et connectez Claude](https://namefi.io/api-key).**

## Sources et lectures complémentaires

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (URL du serveur MCP, transport, authentification, endpoints d'enregistrement et DNS — source principale de ce guide)
- Namefi — [docs.namefi.io : Authentication](https://docs.namefi.io/docs/02-authentication.mdx) (clé API, modes d'authentification EIP-712 et SIWE ; exigences d'authentification par opération)
- Namefi — [docs.namefi.io : Register a domain](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (exemples complets d'enregistrement et d'interrogation de l'état en SDK, fetch, cURL et Python)
- Namefi — [docs.namefi.io : Managing your balance](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (faucet NFSC et endpoints de consultation du solde)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (descripteur de découverte MCP)
- Anthropic / Claude Code — [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (syntaxe de `claude mcp add --transport http`, authentification par en-tête et options de portée)
- Model Context Protocol — [Connect to remote MCP servers](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication) (procédure des connecteurs personnalisés pour Claude Desktop et claude.ai)
- Model Context Protocol — [Qu’est-ce que le Model Context Protocol ?](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (présentation du protocole)
- llmstxt.org — [The /llms.txt file](https://llmstxt.org) (spécification et justification du nom du fichier de découverte suivi par namefi.io/llms.txt)
- dev.to — [Comment enregistrer un nom de domaine avec votre agent IA, sans intervention humaine](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26) (tutoriel MCP tiers reposant sur un autre revendeur de domaines adossé à Cloudflare)
