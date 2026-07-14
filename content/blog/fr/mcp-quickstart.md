---
title: "Démarrage rapide avec Namefi MCP : Claude Code, Cursor et Windsurf"
date: '2026-07-10'
language: 'fr'
tags: ['ai-agents', 'guide']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/mcp-quickstart-og.jpg
description: "Configuration MCP propre à Claude Code, Cursor et Windsurf, suivie d'un démarrage rapide en 5 étapes pour passer d'une nouvelle application à un domaine personnalisé actif, sans quitter l'éditeur."
keywords: ["domaine mcp claude code", "domaine mcp cursor", "domaine mcp windsurf", "enregistrement de domaine dans l'éditeur", "enregistrement de domaine par un agent de codage", "enregistrer un domaine depuis l'éditeur", "démarrage rapide mcp", "configuration mcp namefi", "domaine personnalisé vercel namefi", "domaine personnalisé cloudflare pages namefi", "déployer un domaine personnalisé avec un agent IA", "démarrage rapide enregistrement de domaine", "configuration mcp x-api-key", "faire pointer un domaine vers un déploiement"]
relatedArticles:
  - /fr/blog/ai-agent-register/
  - /fr/blog/claude-mcp-domains/
  - /fr/blog/namefi-mcp/
  - /fr/blog/wallet-checkout/
  - /fr/blog/vibe-coding-domain/
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
  - /fr/glossary/nameserver/
  - /fr/glossary/domain-renewal/
---

Vous êtes déjà dans l'éditeur. L'application est initialisée, le premier déploiement vient d'être publié sur un sous-domaine de la plateforme et il ne reste plus qu'à lui attribuer un vrai domaine avant de pouvoir le partager. Ce guide de démarrage rapide vous montre comment effectuer cette étape d'enregistrement sans ouvrir d'onglet dans le navigateur, remplir un formulaire de paiement ni quitter la session avec l'[Agent IA](/fr/glossary/ai-agent/) qui a créé l'application : configuration de connexion [MCP](https://modelcontextprotocol.io) exacte pour Claude Code, Cursor et Windsurf, procédure condensée en cinq étapes et — le point que la plupart des guides sur les domaines passent sous silence — méthode pour faire réellement pointer le domaine que vous venez d'enregistrer vers le déploiement que vous venez de publier.

Ce guide couvre volontairement trois éditeurs. Si vous utilisez plutôt OpenAI Codex, Gemini CLI ou Claude Desktop, [Comment enregistrer un domaine avec votre agent IA sur Namefi](/fr/blog/ai-agent-register/) constitue le guide de référence, avec une configuration vérifiée pour les six clients ainsi que la méthode REST brute pour tout outil non compatible nativement avec MCP. Tous les exemples présentés ici se connectent au même serveur MCP [Namefi](https://namefi.io) que celui documenté dans ce guide de référence : rien de ce qui suit ne le contredit. Cette page en propose simplement une version condensée, centrée sur les outils de développement, avec une étape de déploiement que le guide principal n'aborde pas.

## Pourquoi enregistrer le domaine depuis l'éditeur

« Enregistrer un domaine » impose un changement de contexte particulièrement coûteux pour une tâche de cinq minutes : quitter l'éditeur, ouvrir le site d'un bureau d'enregistrement, rechercher un nom, subir une succession d'offres additionnelles pour une protection de la confidentialité et un hébergement de messagerie dont vous n'avez pas besoin, payer, puis revenir déterminer quels enregistrements DNS ajouter.

L'autre solution consiste à laisser le même agent qui a initialisé le projet et configuré le déploiement s'occuper aussi de la dernière étape : vérifier le nom, l'enregistrer et configurer le DNS, le tout sous forme d'appels d'outils dans la conversation déjà en cours. [Cloudflare présente une version de cette même idée pour sa propre API Registrar](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=An%20agent%20using%20the%20API%20can%20suggest%20domain%20names%2C%20check%20registrability%2C%20and%20complete%20the%20purchase%20without%20the%20user%20leaving%20their%20current%20context) — preuve qu'il ne s'agit pas d'une préférence de niche, mais d'un flux de travail vers lequel tendent plusieurs bureaux d'enregistrement. La comparaison en fin d'article revient précisément sur l'approche de Cloudflare. Celle de Namefi offre en plus l'option d'un [Domaine Tokenisé](/fr/glossary/tokenized-domain/) et un paiement signé par un portefeuille, sans aucun compte, présenté dans [Payer des domaines avec un portefeuille crypto](/fr/blog/wallet-checkout/).

## Configurer la connexion : trois éditeurs, trois fichiers de configuration

Les trois éditeurs ci-dessous se connectent au même point de terminaison, `https://api.namefi.io/mcp`, via Streamable HTTP, et transmettent votre [clé API](https://namefi.io/api-key) Namefi dans un en-tête `x-api-key`. Seuls le format du fichier et la commande qui l'écrit changent d'un éditeur à l'autre.

### Claude Code

La documentation de Claude Code fournit une commande CLI directe pour ajouter un serveur HTTP distant avec un en-tête personnalisé :

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

Exécutez-la une fois depuis un terminal ouvert dans votre projet, après avoir remplacé la clé d'exemple par la vôtre. Par défaut, le serveur est enregistré avec la portée **local** : il n'est accessible que par vous, dans ce projet. Ajoutez `--scope user` pour le rendre accessible dans tous les projets de votre machine, puis confirmez la connexion avec `claude mcp list`.

### Cursor

Cursor lit les serveurs MCP dans `mcp.json` : soit dans `.cursor/mcp.json` pour le projet, soit dans `~/.cursor/mcp.json` pour la configuration globale. Le format documenté pour les serveurs distants accepte une authentification par en-tête avec interpolation d'une variable d'environnement, de sorte que la clé elle-même n'a pas à figurer dans le fichier :

```json
{
  "mcpServers": {
    "namefi": {
      "url": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

`${env:NAMEFI_API_KEY}` prend la valeur de cette variable dans le shell depuis lequel Cursor a été lancé : exportez-la avant d'ouvrir l'éditeur.

### Windsurf (Cascade)

L'intégration MCP de Windsurf, appelée Cascade, lit le fichier `~/.codeium/windsurf/mcp_config.json`. Les serveurs distants y utilisent un champ `serverUrl` au lieu de `url`, avec les mêmes `headers` et le même format `${env:VAR}` que Cursor :

```json
{
  "mcpServers": {
    "namefi": {
      "serverUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

Un point mérite d'être signalé : à la date de publication de ce guide, `docs.windsurf.com/windsurf/cascade/mcp` redirige vers `docs.devin.ai/desktop/cascade/mcp`. La documentation de Windsurf est désormais hébergée sous le domaine de documentation produit Devin de Cognition, et le format de configuration ci-dessus correspond à celui présenté sur cette page actuelle. Si vous utilisez une version plus ancienne, vérifiez les noms de champs dans la documentation vers laquelle pointe l'aide intégrée à votre version.

## Démarrage rapide en cinq étapes : d'une nouvelle application à un DNS actif

Une fois l'une des connexions ci-dessus active, le reste de la procédure est identique quel que soit votre éditeur.

1. **Obtenez une clé API** sur [namefi.io/api-key](https://namefi.io/api-key), générée à partir du portefeuille qui doit détenir le nouveau domaine.
2. **Connectez l'éditeur** en suivant sa configuration ci-dessus, puis vérifiez que tout fonctionne en demandant : « Vérifie si `<yourapp>.com` est disponible sur Namefi et indique-moi quel outil tu as appelé. » Il s'agit d'un appel `checkAvailability` en lecture seule, qui fonctionne donc avant même d'avoir approvisionné quoi que ce soit.
3. **Enregistrez le domaine.** Confirmez le nom et la durée en langage naturel — « Enregistre-le pour un an. » L'agent envoie `registerDomain` et interroge l'état de la commande jusqu'à ce qu'elle atteigne `SUCCEEDED` (ou un état d'échec définitif). Un enregistrement classique se termine après quelques cycles d'interrogation.
4. **Faites-le pointer vers votre déploiement.** L'étape suivante explique précisément comment procéder : ajoutez, dans la même conversation, les enregistrements DNS demandés par votre plateforme d'hébergement.
5. **Vérifiez sa résolution.** La [Propagation DNS](/fr/glossary/dns-propagation/) n'est pas instantanée. Attendez donc quelques minutes, puis effectuez une requête DNS publique ou ouvrez simplement le domaine dans un navigateur.

## Faire pointer le nouveau domaine vers le déploiement que vous venez de publier

Cette étape est absente des guides génériques sur l'enregistrement d'un domaine, car elle intervient après l'enregistrement, du côté de la plateforme d'hébergement. Pourtant, c'est précisément l'intérêt de tout faire depuis l'éditeur : votre agent sait déjà sur quelle plateforme il a déployé l'application et peut configurer le DNS dans la foulée de l'enregistrement.

### Vercel

La documentation de Vercel sur les domaines décrit le parcours dans le tableau de bord de votre projet, sous **Settings → Domains** : ajoutez le domaine, puis Vercel vous indique l'enregistrement à créer selon qu'il s'agit d'un domaine racine ou d'un sous-domaine. Pour un **domaine racine** (`yourapp.com`), Vercel demande un **enregistrement A** pointant vers son adresse IP de service. Pour un **sous-domaine** (`www.yourapp.com`), Vercel demande un **CNAME**. Et — détail utile avant de reprendre un exemple d'un ancien guide — [la documentation de Vercel précise que cette cible CNAME est propre à chaque projet](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record) : elle apparaît dans votre tableau de bord plutôt que sous la forme d'un nom d'hôte fixe partagé par tous les projets.

Une fois cette valeur obtenue, la configuration DNS ne demande plus qu'une requête à l'agent :

> « Ajoute un enregistrement A pour `@` pointant vers `76.76.21.21`, ainsi qu'un CNAME pour `www` pointant vers la cible CNAME indiquée par Vercel. »

Cette requête appelle deux fois `createDnsRecord`, une fois pour chaque enregistrement : le même outil de [Types d'enregistrements DNS (A, AAAA, CNAME, MX, TXT)](/fr/glossary/dns-record-types/) utilisé pour toute écriture DNS sur Namefi. La règle du point final s'applique comme partout ailleurs : le champ `rdata` d'une cible CNAME doit se terminer par un point, contrairement au champ `zoneName` (votre domaine).

### Cloudflare Pages

Si votre déploiement cible Cloudflare Pages et que le DNS de votre domaine n'est pas déjà géré par Cloudflare, [la documentation de Cloudflare sur les domaines personnalisés](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain) demande un seul enregistrement **CNAME** pointant vers le sous-domaine `.pages.dev` de votre projet. Aucun enregistrement A n'est nécessaire, car Pages sert tout par l'intermédiaire de cette cible CNAME. Vous devez d'abord effectuer l'étape correspondante dans le tableau de bord Cloudflare (Workers & Pages → votre projet → Custom domains → Set up a domain). Ce n'est qu'ensuite que la cible CNAME sera résolue correctement.

> « Ajoute un CNAME pour `app` pointant vers `my-project.pages.dev.` »

Même appel d'outil, même règle du point final pour la cible, plateforme différente.

<!-- TODO : vérifier les étapes exactes de Vercel et Cloudflare Pages pour l'émission et le renouvellement du certificat TLS d'un domaine personnalisé nouvellement associé, afin d'indiquer avec certitude si ces opérations sont automatiques sur les deux plateformes ou si elles exigent un déclenchement manuel -->

## Comparaison avec l'enregistrement dans l'éditeur proposé par Cloudflare

Cloudflare est l'autre bureau d'enregistrement qui met activement en avant l'enregistrement depuis un éditeur, et mérite donc d'être cité directement. Son API Registrar, [présentée comme étant en version bêta en avril 2026](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/), s'intègre elle aussi aux éditeurs compatibles MCP, notamment Cursor et Claude Code. Un agent peut ainsi rechercher, tarifer et enregistrer un domaine de manière synchrone sans quitter le contexte en cours : c'est la même idée fondamentale que celle mise en œuvre dans ce guide pour Namefi. Le même article indique qu'à ce stade de la version bêta, l'API de Cloudflare ne couvre pas encore la gestion après enregistrement, comme les transferts et les renouvellements, prévus plus tard en 2026.

Le serveur MCP de Namefi couvre déjà l'ensemble du cycle de vie : enregistrement, DNS et [Renouvellement de domaine (Renouvellement automatique)](/fr/glossary/domain-renewal/). Il propose en outre deux possibilités absentes de l'approche de Cloudflare : le domaine est enregistré par défaut sous forme de NFT [Domaine Tokenisé](/fr/glossary/tokenized-domain/) (transférable vers n'importe quel portefeuille), et Namefi accepte un paiement signé par un portefeuille sans aucun compte, comme expliqué dans [Payer des domaines avec un portefeuille crypto](/fr/blog/wallet-checkout/). Les deux acteurs construisent le même flux « sans quitter l'éditeur ». Le meilleur choix dépend de votre préférence entre un enregistrement classique et un domaine qui constitue également un actif on-chain.

## Questions fréquentes

### Ce guide couvre-t-il aussi Codex ou Gemini CLI ?
Non. Ce guide se limite volontairement à Claude Code, Cursor et Windsurf. [Comment enregistrer un domaine avec votre agent IA sur Namefi](/fr/blog/ai-agent-register/) fournit la même configuration exacte et vérifiée pour Codex CLI, Gemini CLI et Claude Desktop.

### Dois-je disposer d'un compte Namefi avant de pouvoir essayer ?
Non. Une vérification de disponibilité en lecture seule ne nécessite aucune authentification. Vous pouvez donc connecter n'importe lequel des éditeurs ci-dessus et exécuter l'invite de test de l'étape 2 avant même de générer une clé API ou d'approvisionner quoi que ce soit.

### Que faire si ma plateforme de déploiement n'est ni Vercel ni Cloudflare Pages ?
Le principe reste le même partout : le tableau de bord de votre plateforme vous indique le type d'enregistrement DNS nécessaire — presque toujours un enregistrement A pour un domaine racine et un CNAME pour un sous-domaine — puis vous transmettez cette valeur à votre agent, qui l'écrit par l'intermédiaire de `createDnsRecord`.

### Le domaine est-il automatiquement tokenisé lorsque je l'enregistre ainsi ?
Oui, par défaut : le domaine est enregistré sous forme de NFT sur Base, dans le portefeuille associé à votre clé API, sauf si vous indiquez un autre `nftReceivingWallet` dans la requête. Consultez [Que sont les domaines tokenisés ?](/fr/blog/what-are-tokenized-domains/) si cette notion ne vous est pas familière.

### Puis-je me passer entièrement de clé API ?
Oui, avec une réserve : le parcours de paiement [x402](/fr/glossary/x402/) signé par un portefeuille de Namefi permet à un portefeuille approvisionné de régler un enregistrement sans compte ni clé API. Ce parcours mérite une explication distincte, disponible dans [Payer des domaines avec un portefeuille crypto](/fr/blog/wallet-checkout/).

## Publiez le nom avec l'application

Le domaine est un élément d'infrastructure, au même titre que la cible de déploiement et la base de données. Il n'y a aucune raison que ce soit encore le seul composant de la publication d'une application qui exige de quitter vos outils et de remplir un formulaire web. Connectez l'une des trois configurations ci-dessus, suivez les cinq étapes, et le domaine sera mis en ligne en pointant vers le déploiement que votre agent vient de créer, sans ouvrir le moindre onglet de navigateur.

**[Générez une clé API Namefi](https://namefi.io/api-key)** et essayez la requête de vérification de disponibilité dans l'éditeur que vous utilisez déjà. Vous pouvez aussi consulter le [guide complet de Claude Code avec une transcription annotée](/fr/blog/claude-mcp-domains/) pour voir chaque étape en détail.

## Sources et lectures complémentaires

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (URL du serveur MCP, transport, authentification, référence des points de terminaison d'enregistrement et de DNS — source principale de toutes les affirmations propres à Namefi dans ce guide)
- Namefi — [docs.namefi.io : Enregistrer un domaine](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (champs de la requête d'enregistrement, procédure d'interrogation, valeurs d'état des commandes)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (descripteur de découverte MCP)
- Anthropic / Claude Code — [Connecter Claude Code à des outils via MCP](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (syntaxe de `claude mcp add --transport http`, options `--header` et `--scope`)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (format des serveurs distants dans `mcp.json`, `headers`, interpolation `${env:VAR}`, emplacements des configurations projet et globale)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (redirige vers [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp) à la date de publication de ce guide ; format de `mcp_config.json`, `serverUrl`, `headers`)
- Vercel — [Ajouter et configurer un domaine personnalisé](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record) (enregistrement A pour le domaine racine, cible CNAME propre à chaque projet pour les sous-domaines, méthode par serveurs de noms)
- Vercel — [Présentation des domaines](https://vercel.com/docs/domains#:~:text=76.76.21.21) (adresse IP de service `76.76.21.21` utilisée pour les enregistrements A des domaines racines)
- Cloudflare — [Domaines personnalisés pour Pages](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain) (procédure CNAME vers `.pages.dev` pour les domaines qui ne sont pas gérés par Cloudflare)
- webhosting.today — [Les agents IA peuvent désormais enregistrer des domaines sans intervention humaine](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/) (article sur la version bêta de l'API Cloudflare Registrar : intégrations aux éditeurs et limitations de la version bêta)
- Model Context Protocol — [modelcontextprotocol.io](https://modelcontextprotocol.io) (présentation du protocole)
