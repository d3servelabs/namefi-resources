---
title: "llms.txt pour les domaines : une API lisible par n'importe quel agent IA"
date: '2026-07-10'
language: 'fr'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/llms-txt-og.jpg
description: "Découverte de namefi.io/llms.txt : comment un simple fichier texte permet à n'importe quel agent IA de trouver et d'utiliser l'API complète d'un bureau d'enregistrement, et comment il fonctionne avec MCP."
keywords: ["llms.txt", "exemple de llms.txt", "qu'est-ce que llms.txt", "documentation d'API lisible par l'IA", "découverte d'API", "robots.txt pour l'IA", "llms.txt ou MCP", "namefi.io/llms.txt", "référence d'API lisible par machine", "API conçue pour les agents", "documentation structurée pour les LLM", "découverte d'API en texte brut", "descripteur de découverte MCP", "enregistrement de domaine par un agent IA"]
relatedArticles:
  - /fr/blog/ai-agent-register/
  - /fr/blog/claude-mcp-domains/
  - /fr/blog/namefi-mcp/
  - /fr/blog/mcp-quickstart/
  - /fr/blog/agent-native/
relatedTopics:
  - /fr/topics/web3-foundations/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/blockchain-concepts/
  - /fr/series/tokenize-your-com/
relatedGlossary:
  - /fr/glossary/ai-agent/
  - /fr/glossary/registrar/
  - /fr/glossary/epp/
  - /fr/glossary/dns/
  - /fr/glossary/seo/
---

Tout [bureau d'enregistrement](/fr/glossary/registrar/) doté d'une [API](/fr/glossary/epp/) possède une documentation quelque part : un site dédié, une page de référence, voire une spécification OpenAPI derrière une page de connexion. Cela a suffi pendant vingt ans, car le lecteur était un développeur humain capable de naviguer entre les pages et de survoler les menus pour trouver le paragraphe utile. Un [agent IA](/fr/glossary/ai-agent/) qui consulte le même site au moment de l'inférence n'a pas ce luxe : sa fenêtre de contexte est limitée, il ne peut pas s'attarder sur un portail documentaire rendu en JavaScript et il n'a qu'une chance de comprendre le rôle d'une API avant d'abandonner ou d'inventer un endpoint inexistant.

`llms.txt` résout ce problème, et Namefi en publie un à l'adresse [namefi.io/llms.txt](https://namefi.io/llms.txt). Cet article explique en quoi consiste cette convention, pourquoi elle existe, ce que contient notre propre fichier section par section, où il s'arrête volontairement et comment il complète le [Model Context Protocol](https://modelcontextprotocol.io) (MCP) au lieu de lui faire concurrence. Il illustre aussi, par sa conception même, ce qu'il décrit : un fournisseur d'API publique qui présente son propre fichier de découverte lisible par machine dans un langage clair.

## Pourquoi les agents ne peuvent-ils pas simplement parcourir votre site de documentation ?

La raison d'être de `llms.txt` n'est pas hypothétique : elle est énoncée directement dans la proposition. [L'article original de Jeremy Howard](https://llmstxt.org) s'ouvre sur la contrainte qui l'a motivé : « Les grands modèles de langage s'appuient de plus en plus sur les informations des sites web, mais se heurtent à une limite majeure : leurs fenêtres de contexte sont trop petites pour traiter la plupart des sites dans leur intégralité. Convertir des pages HTML complexes, avec leur navigation, leurs publicités et leur JavaScript, en texte brut adapté aux LLM est à la fois difficile et imprécis. »

Deux problèmes se superposent. Un véritable site de documentation — navigation, journal des modifications, textes marketing, bandeau de cookies — contient surtout du bruit par rapport aux quelques paragraphes dont un agent a besoin pour accomplir une tâche. De plus, une bonne partie de ce bruit dépend de JavaScript, qu'une simple requête sans navigateur n'exécute jamais : le client HTTP de l'agent ne voit donc même pas la page affichée à un humain. `llms.txt` contourne ces deux difficultés grâce à un unique fichier Markdown en texte brut, conçu pour être lu en entier plutôt que parcouru puis réduit.

## L'analogie avec `robots.txt`, et ses limites

La comparaison avec [`robots.txt`](https://www.robotstxt.org) est le moyen le plus rapide de situer `llms.txt` pour toute personne qui connaît l'infrastructure web, et elle est pertinente jusqu'à un certain point. `robots.txt` sert à donner des instructions aux robots d'exploration — selon les termes du site lui-même, « Les propriétaires de sites web utilisent le fichier /robots.txt pour donner aux robots du web des instructions concernant leur site ; c'est ce que l'on appelle le *protocole d'exclusion des robots*. » Les deux fichiers se trouvent à un emplacement racine prévisible, sont en texte brut et s'adressent à des lecteurs automatisés plutôt qu'à des humains.

L'analogie atteint toutefois ses limites au niveau de l'intention. `robots.txt` formule presque exclusivement des instructions **négatives** : `Disallow: /some-path` indique à un robot ce qu'il ne doit *pas* consulter. `llms.txt` est **positif** : voici ce qu'est ce site et où se trouvent les éléments qui méritent d'être lus. C'est moins une clôture qu'une table des matières destinée à un lecteur incapable de parcourir tout le livre. Les deux sont complémentaires, et le site de Namefi les utilise tous les deux.

## Ce que la spécification demande réellement

`llms.txt` n'est pas un format libre. La proposition définit une structure Markdown précise, dans cet ordre : une marque d'ordre des octets facultative, un H1 obligatoire portant le nom du site, un résumé sous forme de citation, zéro ou plusieurs sections de détails sans titre, puis zéro ou plusieurs sections de « listes de fichiers », délimitées par des H2 et composées de liens au format `[name](url): notes`. Un titre H2 revêt une signification particulière : une section intitulée **Optional** indique que « les URL qui s'y trouvent peuvent être ignorées si vous avez besoin d'un contexte plus court ». Le fichier de Namefi reprend exactement ce titre et l'utilise conformément à la spécification.

## Parcourons namefi.io/llms.txt

Voici le fichier en ligne, commenté section par section : ce qu'il contient réellement, cité directement, et la raison pour laquelle chaque élément est structuré ainsi pour un agent qui le découvre sans contexte préalable.

| Section (telle qu'elle apparaît dans le fichier) | Ce qu'elle indique | Pourquoi elle est structurée ainsi |
| --- | --- | --- |
| H1 + citation | `# Namefi API` / `> Namefi lets you register traditional domains as NFTs and manage their DNS records via API.` | L'introduction obligatoire prévue par la spécification : une seule ligne exploitable par l'agent, même s'il ne lit rien d'autre. |
| Pointeur MCP intégré au résumé | `MCP server (every operation below as MCP tools): https://api.namefi.io/mcp — discovery descriptor at https://namefi.io/.well-known/mcp/servers.json` | Place le chemin le plus rapide — une connexion à un protocole actif — avant le chemin en texte brut, dans les trois premières lignes. |
| `## Base URLs` | `https://api.namefi.io/v-next/` | Une ligne, sans explication : c'est exactement ce dont un agent a besoin pour construire des requêtes HTTP brutes. |
| `## MCP Server (for AI agents)` | « Privilégiez MCP si votre client le prend en charge… Ajoutez-le dans Claude Code : `claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"` » | Exprime une préférence et la concrétise par une commande prête à copier-coller plutôt que par un paragraphe. |
| `## Authentication` | « Générez une clé sur https://namefi.io/api-key… Fonctionne pour **toutes les opérations**… **Utilisation directe de HTTP (recommandée pour les agents IA) :** transmettez directement l'en-tête, sans SDK » | Indique clairement qu'aucun SDK, flux OAuth ni session de navigateur n'est nécessaire pour authentifier une requête d'écriture. |
| `## Domain Registration` | Une séquence `curl` en trois étapes : vérifier la disponibilité, envoyer `POST /v-next/orders/register-domain`, puis interroger `GET /v-next/orders/{orderId}` jusqu'à obtenir un état final | Présente la transaction principale sous forme de commandes exécutables, et non comme une description textuelle de la structure d'une requête et de sa réponse. |
| `## DNS Record Management` | Un tableau de onze endpoints (`GET`/`POST`/`PUT`/`DELETE` sur `/v-next/dns/records`, `/v-next/dns/park`, `/v-next/dns/forwarding`, etc.) indiquant la méthode, le chemin, l'authentification et une description en une ligne | Les données de référence — de nombreux endpoints similaires — sont regroupées dans un tableau plutôt que réparties sur onze paragraphes. |
| Note de dépannage | « **UNAUTHORIZED (401) :** votre clé API est incorrecte, expirée ou non associée au portefeuille du propriétaire du domaine… **Erreurs de validation des enregistrements :** vérifiez que `zoneName` ne se termine pas par un point et que `rdata` se termine par un point pour les types CNAME/MX/NS… » | Anticipe les premières erreurs qu'un agent risque de rencontrer et fournit leur cause ainsi que leur solution, au lieu d'un tableau générique de codes d'état. |
| `## Optional` | Des liens vers la documentation du SDK TypeScript, le paquet npm `@namefi/api-client`, une spécification OpenAPI 3 lisible par machine, le guide des agents sortants et un dépôt GitHub de scripts auxiliaires indépendants du signataire | Il s'agit de la section prévue par la spécification pour les éléments que l'on peut ignorer si le contexte doit être plus court : des ressources approfondies, et non des prérequis pour suivre le parcours principal ci-dessus. |

Le fichier se termine par un lien vers `namefi.io/llms-full.txt`, qui rassemble le même contenu dans un document unique, y compris les flux de paiement Web3 et le guide des agents sortants auxquels le fichier racine se contente de renvoyer. Cette séparation reprend le modèle à deux niveaux de la spécification : conserver un point d'entrée suffisamment court pour tenir aisément dans la fenêtre de contexte, puis permettre à un agent qui en a besoin d'en savoir plus en suivant un lien.

## Les fichiers complémentaires : découverte Web3 et MCP

Le fichier racine renvoie vers des fichiers connexes pour les parties de l'API qui n'ont pas leur place dans un point d'entrée généraliste. [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) décrit les modes de paiement dont un agent disposant d'un portefeuille a besoin à la place d'une clé API : un flux [x402](/fr/glossary/x402/) dans lequel `GET /x402/domain/{domainName}` renvoie `402 Payment Required` avec le prix jusqu'à ce qu'un en-tête `X-PAYMENT` signé soit joint, une variante défi-réponse MPP (Machine Payable Protocol) signée au moyen de la CLI `mppx`, et un mode de signature EIP-712 manuel compatible avec les portefeuilles de contrats intelligents. Le fichier précise que l'enregistrement via x402 ne nécessite « Aucun compte Namefi ni signature EIP-712 : le portefeuille de l'acheteur signe une autorisation `transferWithAuthorization` EIP-3009. » Un agent qui n'a besoin que d'une clé API ne doit jamais charger ces informations.

La partie MCP possède son propre fichier de découverte, entièrement distinct de `llms.txt` : [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json). Il s'agit d'un petit descripteur JSON plutôt que d'un document Markdown :

```json
{
  "servers": [
    {
      "name": "namefi-api",
      "transport": "streamable-http",
      "url": "https://api.namefi.io/mcp",
      "authentication": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key"
      },
      "documentation": "https://namefi.io/llms.txt"
    }
  ]
}
```

Ce descripteur se trouve sous `.well-known/`, selon la convention également employée par `/.well-known/security.txt` pour les métadonnées lisibles par machine. C'est un équivalent plus ciblé et typé en JSON de l'approche Markdown en langage naturel de `llms.txt`. Son dernier champ renvoie à `llms.txt` : un agent qui découvre d'abord le serveur MCP dispose donc toujours d'un chemin vers l'explication en texte brut des fonctions de ces outils.

## Ce qui est inclus, ce qui ne l'est pas, et pourquoi

Plusieurs choix semblent délibérés. Presque toutes les opérations sont présentées sous la forme d'une commande `curl` exécutable plutôt que d'un paragraphe décrivant un schéma de requête : le fichier est écrit pour un système qui exécute du code, et non pour un système qui rédige son propre résumé. Le fichier racine renvoie vers d'autres ressources au lieu de tout inclure, tandis que `llms-full.txt` intègre le contenu auquel il se contente normalement de faire référence : c'est exactement le modèle de gestion de la taille prévu par la spécification. La section `## Optional` propose une spécification OpenAPI 3 complète en plus du Markdown, de sorte qu'un outil ayant besoin d'un schéma strictement typé puisse y accéder sans alourdir le chemin de lecture principal. Enfin, les paiements par portefeuille — x402, MPP, EIP-712 — sont regroupés dans un fichier distinct, ce qui permet à l'authentification par clé API et à l'enregistrement d'un domaine de rester les premières informations lues par chaque agent.

<!-- TODO : confirmer avec l'équipe — existe-t-il un budget cible de tokens ou de caractères pour le fichier llms.txt racine, et comment la répartition entre llms.txt / llms-full.txt / web3/llms.txt / outbound/llms.txt est-elle réévaluée à mesure que l'API évolue ? -->

## llms.txt et MCP : découverte ou connexion

Il convient de distinguer précisément le rôle de chaque élément. `llms.txt` est un document : un agent le récupère une fois, comprend le rôle de l'API et repère les ressources plus détaillées. Il reste un texte inerte tant qu'un système ne met pas ses instructions en pratique. Selon la description du protocole lui-même, [MCP](https://modelcontextprotocol.io) est « une norme open source permettant de connecter des applications d'IA à des systèmes externes » : une session active qu'un client ouvre avec un serveur et au cours de laquelle il répertorie et invoque des outils utilisables.

Le fichier de Namefi illustre directement cette relation : `llms.txt` signale à l'agent qu'un serveur MCP existe à l'adresse `api.namefi.io/mcp` et lui fournit la commande `claude mcp add` pour s'y connecter. Lire le fichier, découvrir qu'il existe une interface d'outils active, s'y connecter, agir. Un agent qui passe directement à MCP peut toujours trouver le serveur grâce à `.well-known/mcp/servers.json`, mais le champ `documentation` de ce descripteur renvoie à `llms.txt` : dans la pratique, les deux fonctionnent donc rarement de manière totalement isolée.

## Recommandations pour les autres fournisseurs d'API

Publier un fichier `llms.txt` opérationnel ne nécessite pas de reconstruire toute votre documentation :

1. **Placez en premier le H1, le résumé et la méthode de connexion la plus rapide** : un agent disposant d'une petite fenêtre de contexte pourrait ne jamais dépasser les premières lignes.
2. **Montrez des requêtes exécutables, pas la description textuelle d'un schéma.** Une commande `curl` avec de véritables noms de champs est plus utile qu'un paragraphe décrivant un corps JSON.
3. **Scindez les fichiers selon leur taille, et non selon l'organisation des équipes.** Un fichier racine court, une version plus complète et des fichiers distincts pour des sujets comme les paiements permettent de conserver un parcours courant concis.
4. **Documentez les erreurs réellement rencontrées**, et pas seulement les codes d'état : comprendre pourquoi un appel renvoie 401 plutôt que 403 compte davantage que les nombres eux-mêmes.
5. **Utilisez le titre `## Optional` pour tout élément facultatif**, conformément à la convention de la spécification.
6. **Publiez un descripteur de découverte MCP à côté de llms.txt si vous exploitez un serveur MCP** : l'un répond à la question « de quoi s'agit-il ? », l'autre à « comment m'y connecter ? ».

## Questions fréquentes

### Qu'est-ce que llms.txt ?

Il s'agit d'une convention proposée — et non d'une norme officielle de l'IETF ou du W3C — pour publier à la racine d'un site web un fichier Markdown en texte brut qui explique à un agent IA le rôle du site ou de l'API et lui indique où trouver davantage d'informations. Elle définit un ordre précis : un titre H1, un résumé sous forme de citation, des paragraphes de détails facultatifs et des listes de liens délimitées par des H2, avec un titre « Optional » réservé aux ressources qui peuvent être ignorées.

### En quoi llms.txt diffère-t-il de robots.txt ?

`robots.txt` donne aux robots d'exploration des instructions négatives — ce qu'ils ne doivent pas indexer — dans le cadre du protocole d'exclusion des robots. `llms.txt` fournit des informations positives : ce qu'est un site et ce qui mérite d'être lu. Ils s'adressent à des lecteurs automatisés différents et coexistent généralement sur un même site.

### llms.txt remplace-t-il MCP ?

Non. `llms.txt` est un document qu'un agent lit une fois pour comprendre le fonctionnement d'une API ; MCP est une connexion à un protocole actif que son client ouvre afin d'appeler réellement les opérations de cette API. Namefi publie les deux, et c'est `llms.txt` qui indique en premier lieu à l'agent que le serveur MCP existe.

### Que contient le fichier llms.txt de Namefi ?

L'URL de base, un pointeur vers le serveur MCP, une section sur l'authentification par clé API, une procédure d'enregistrement de domaine en trois étapes accompagnée d'exemples `curl` exécutables, un tableau des endpoints de gestion des enregistrements DNS, les endpoints de configuration des domaines, une section de dépannage et une section « Optional » contenant des liens vers le SDK, la spécification OpenAPI et les fichiers complémentaires consacrés aux paiements par portefeuille et aux flux de travail sortants.

### Puis-je lire llms.txt moi-même, sans agent IA ?

Oui. Il s'agit de Markdown brut, lisible aussi bien par une personne que par un modèle. [namefi.io/llms.txt](https://namefi.io/llms.txt) se lit comme une brève référence d'API ; la clarté qui aide une personne à le parcourir permet également à un modèle de l'interpréter correctement.

## Sources et lectures complémentaires

- llmstxt.org — [Le fichier /llms.txt : contexte, proposition et spécification du format](https://llmstxt.org/#:~:text=Large%20language%20models%20increasingly%20rely%20on%20website%20information%2C%20but%20face%20a%20critical%20limitation)
- robotstxt.org — [À propos de /robots.txt : « En bref »](https://www.robotstxt.org/robotstxt.html#:~:text=Web%20site%20owners%20use%20the%20/robots.txt%20file%20to%20give%20instructions%20about%20their%20site%20to%20web%20robots%3B%20this%20is%20called%20The%20Robots%20Exclusion%20Protocol)
- modelcontextprotocol.io — [Qu'est-ce que le Model Context Protocol (MCP) ?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (source principale de chaque extrait commenté dans cet article)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (flux de paiement par portefeuille x402, MPP et EIP-712)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (descripteur de découverte MCP)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (version complète en un seul fichier intégrant les ressources Web3 et celles destinées aux agents sortants)
- IETF — [RFC 8615, URI (Uniform Resource Identifiers) bien connues (la convention `.well-known/`)](https://datatracker.ietf.org/doc/html/rfc8615)

## Lisez le fichier vous-même

Le moyen le plus rapide de comprendre `llms.txt` est d'en ouvrir un. [namefi.io/llms.txt](https://namefi.io/llms.txt) est public, accessible sans authentification et suffisamment court pour être lu pendant le temps qu'il vous a fallu pour parcourir cet article : c'est ce même fichier que lit en premier tout agent IA qui se connecte à Namefi. Pour découvrir le rôle concret des outils MCP qui se cachent derrière, consultez [Serveur MCP Namefi : des outils de domaine pour les agents IA](/fr/blog/namefi-mcp/) ; pour vous connecter depuis un éditeur, suivez le [guide de démarrage rapide MCP](/fr/blog/mcp-quickstart/) ; et pour voir un agent exécuter l'ensemble du processus, lisez [Comment enregistrer un domaine auprès de Namefi avec votre agent IA](/fr/blog/ai-agent-register/).
