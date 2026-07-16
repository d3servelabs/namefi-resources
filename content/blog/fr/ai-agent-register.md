---
title: "Comment enregistrer un domaine avec votre Agent IA sur Namefi"
date: '2026-07-10'
language: 'fr'
tags: ['ai-agents', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
format: guide
ogImage: ../../assets/ai-agent-register-og.jpg
description: "Le guide de référence pour enregistrer un domaine sur Namefi avec n’importe quel Agent IA — Claude, Codex, Cursor et plus encore — via MCP, REST ou paiement par portefeuille."
keywords: ["enregistrer domaine agent ia", "tutoriel namefi", "enregistrement domaine claude", "enregistrement domaine codex", "domaine mcp cursor", "domaine mcp windsurf", "domaine mcp gemini cli", "comment faire domaine agent", "x-api-key", "serveur mcp", "paiement par portefeuille", "enregistrement de domaine namefi mcp", "agent ia acheter domaine namefi", "tutoriel mcp enregistrement domaine"]
relatedArticles:
  - /fr/blog/claude-mcp-domains/
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
  - /fr/glossary/wallet/
  - /fr/glossary/x402/
  - /fr/glossary/tokenized-domain/
---

Voici la page à mettre en favori si vous souhaitez qu’un [Agent IA](/fr/glossary/ai-agent/) — n’importe quel Agent IA, et non celui d’un fournisseur précis — enregistre pour vous un vrai domaine sur [Namefi](https://namefi.io), un [bureau d’enregistrement](/fr/glossary/registrar/) accrédité par l’[ICANN](/fr/glossary/icann/). Elle couvre les mécanismes qui ne changent pas, quel que soit le client dans lequel vous tapez, puis fournit des étapes de configuration exactes et vérifiées individuellement pour les six agents que les utilisateurs emploient réellement aujourd’hui : Claude Desktop, Claude Code, OpenAI Codex, Cursor, Windsurf et Gemini CLI. Si votre agent ne figure pas dans cette liste, le guide se termine par un chemin REST brut qui fonctionne avec tout ce qui peut effectuer une requête HTTP, car toute la surface d’API de Namefi est également publiée en texte brut précisément à cette fin.

Ce guide est rédigé et maintenu par l’équipe Namefi : la partie Namefi de chaque étape est donc de première main. Il présente sous une forme lisible par l’humain la même API que nous publions pour les agents sur [namefi.io/llms.txt](https://namefi.io/llms.txt) et [docs.namefi.io](https://docs.namefi.io). La configuration de chaque fournisseur d’agents a été vérifiée dans la documentation actuelle de ce fournisseur à la date de publication du guide ; lorsque la documentation d’un fournisseur ne donne pas de réponse nette, cela est signalé explicitement plutôt que comblé par une supposition.

Si vous savez déjà que vous utilisez Claude et souhaitez le guide complet annoté avec une transcription réelle, [Acheter un domaine avec Claude : guide pas à pas de Namefi MCP](/fr/blog/claude-mcp-domains/) va plus loin que les sections Claude condensées ici. Cette page est le moyeu ; ce guide-là et les autres liens disséminés au fil du texte en sont les rayons.

## Ce que signifie réellement « enregistrer un domaine avec un Agent IA »

Deux conditions doivent être réunies pour qu’un agent puisse enregistrer un domaine en votre nom sans que vous remplissiez vous-même un formulaire. Premièrement, l’agent doit pouvoir *découvrir et appeler* l’API de Namefi : c’est le [Model Context Protocol](https://modelcontextprotocol.io) (MCP), un standard ouvert qui permet à un client IA de se connecter à un serveur d’outils externe et d’afficher une liste définie d’opérations appelables, ou une requête HTTP ordinaire si l’agent est scripté plutôt que conversationnel. Deuxièmement, l’agent doit avoir une *autorisation de dépenser* : une clé API liée à un solde approvisionné ou un [portefeuille](/fr/glossary/wallet/) crypto capable de signer une transaction sur-le-champ. Tout ce qui figure dans ce guide relève de l’un ou l’autre de ces deux volets.

Namefi exploite un seul serveur MCP pour toute son API, à `https://api.namefi.io/mcp`, via le transport HTTP Streamable. Un agent — ou la personne qui le configure — peut le découvrir sans jamais lire cette page : nous publions à [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) un descripteur lisible par machine qui nomme le serveur `namefi-api` et indique son transport comme `streamable-http`. Chaque client ci-dessous se connecte à la même URL ; seule la manière dont le fichier de configuration ou la ligne de commande de chaque client lui demande de la cibler diffère.

## Le flux universel en cinq étapes

Voici la séquence qui sous-tend chaque section spécifique à un agent plus bas. Une fois comprise ici, les instructions par agent ne sont plus que « comment effectuer l’étape 2 dans cet outil précis ».

1. **Obtenez des identifiants.** Générez une [clé API](https://namefi.io/api-key) — une chaîne préfixée par `nfk_` qui fonctionne pour chaque opération : enregistrement, création d’enregistrements DNS, mises à jour et suppressions. La clé hérite des autorisations du portefeuille qui l’a générée ; générez-la donc depuis le portefeuille qui doit posséder le domaine. Si vous préférez ne pas détenir de clé API Namefi, passez au chemin de paiement par portefeuille ci-dessous : il ne nécessite aucun compte.
2. **Connectez votre agent au serveur MCP.** Dirigez votre client vers `https://api.namefi.io/mcp` avec l’en-tête `x-api-key` contenant votre clé. La syntaxe exacte est propre à chaque client ; consultez la section de votre agent ci-dessous.
3. **Recherchez et obtenez le prix.** Demandez en langage naturel si un nom est disponible. Cela appelle l’opération `checkAvailability` (`GET /v-next/search/availability?domain=…`), qui ne requiert aucune authentification, ou sa variante groupée pour examiner plusieurs candidats à la fois.
4. **Enregistrez, puis interrogez le statut.** Confirmez, et l’agent soumet `registerDomain` (`POST /v-next/orders/register-domain`), ou la variante combinée `register-domain/records` si vous souhaitez définir le DNS dans le même appel. L’enregistrement est asynchrone : le corps de la requête contient `normalizedDomainName` et `durationInYears`, et l’endpoint `register-domain/records` accepte en plus un tableau `records` (`name`, `type`, `rdata`, `ttl` pour chaque enregistrement), afin que le DNS soit écrit dès que la commande se termine. L’agent (ou vous) interroge `getOrder` (`GET /v-next/orders/{orderId}`) jusqu’à atteindre un statut terminal : `SUCCEEDED`, `FAILED`, `CANCELLED` ou `PARTIALLY_COMPLETED`.
5. **Configurez le DNS et vérifiez.** Ajoutez ou ajustez des [enregistrements DNS](/fr/glossary/dns-record-types/) avec `createDnsRecord` (`POST /v-next/dns/records`), pointez la délégation au niveau du [serveur de noms](/fr/glossary/nameserver/) si nécessaire, puis laissez quelques minutes à la [propagation DNS](/fr/glossary/dns-propagation/) avant de confirmer que le domaine se résout.

La requête d’enregistrement accepte aussi un objet `domainSetupOptions` avec des paramètres propres à chaque domaine : `autoPark`, `autoEns`, `autoRenew`, `dnssec` et `keepExistingNameservers` (ce dernier indique à Namefi de laisser intacte la délégation actuelle des serveurs de noms du domaine au lieu de la rediriger, ce qui est utile si vous enregistrez un domaine qui doit immédiatement continuer à se résoudre ailleurs). Un champ facultatif `nftReceivingWallet` contrôle l’endroit où atterrit le jeton de propriété du domaine ; omettez-le et le domaine est enregistré comme NFT sur Base dans le portefeuille lié à votre clé API.

## Matrice de configuration par agent

| Agent | Méthode de connexion | Emplacement de la configuration | En-tête d’authentification personnalisé pris en charge | Documentation de référence |
| --- | --- | --- | --- | --- |
| Claude Code | MCP, HTTP Streamable | Commande CLI `claude mcp add` (écrit dans `~/.claude.json` ou `.mcp.json`) | Oui — indicateur `--header` | [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp), vérifié le 2026-07-10 |
| Claude Desktop / claude.ai | MCP, HTTP Streamable via Custom Connector | Settings → Connectors → Add custom connector | Invite d’authentification pilotée par le serveur (OAuth, clé API ou identifiants, selon ce que demande le serveur) | [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers), vérifié le 2026-07-10 |
| OpenAI Codex CLI | MCP, HTTP Streamable | `~/.codex/config.toml`, table `[mcp_servers.<name>]` | Oui — `http_headers` (statique) ou `env_http_headers` (depuis des variables d’environnement) | [learn.chatgpt.com/docs/extend/mcp](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (cible actuelle de la redirection de `developers.openai.com/codex/mcp`), vérifié le 2026-07-10 |
| Cursor | MCP, HTTP Streamable | `.cursor/mcp.json` (projet) ou `~/.cursor/mcp.json` (global) | Oui — objet `headers`, avec interpolation `${env:VAR}` | [cursor.com/docs/mcp](https://cursor.com/docs/mcp), vérifié le 2026-07-10 |
| Windsurf (Cascade) | MCP, HTTP Streamable | `~/.codeium/windsurf/mcp_config.json` | Oui — objet `headers` dans une entrée `serverUrl`, avec interpolation `${env:VAR}` | [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (à la date de publication de ce guide, cette URL redirige vers `docs.devin.ai/desktop/cascade/mcp` — voir la section Windsurf ci-dessous), vérifié le 2026-07-10 |
| Gemini CLI | MCP, HTTP Streamable | `~/.gemini/settings.json` (utilisateur) ou `.gemini/settings.json` (projet) | Oui — objet `headers` dans une entrée `httpUrl` | [geminicli.com/docs/tools/mcp-server](https://geminicli.com/docs/tools/mcp-server/), vérifié le 2026-07-10 |
| Tout autre client MCP | MCP, HTTP Streamable | Le format de configuration documenté par ce client | Dépend du client — le côté serveur de Namefi ne change pas | [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) |
| Tout script ou agent non-MCP | REST brut | N/A — appels HTTPS directs | Oui — en-tête `x-api-key` à chaque appel d’écriture | [namefi.io/llms.txt](https://namefi.io/llms.txt), [docs.namefi.io](https://docs.namefi.io) |

Chaque ligne ci-dessus se connecte au même serveur et accède au même ensemble d’opérations. La seule différence d’un agent à l’autre est la syntaxe utilisée pour dire à ce client précis : « voici un serveur MCP distant, et voici l’en-tête à envoyer avec lui ».

**La même invite de test, à chaque fois.** Après avoir connecté chacun des agents ci-dessous, lancez cette invite exacte afin de comparer les résultats d’un client à l’autre :

> « Vérifie si `example.com` est disponible à l’enregistrement sur Namefi, et indique-moi quel outil ou quelle opération tu as appelée pour le déterminer. N’enregistre encore rien. »

Cet appel est en lecture seule : comme `checkAvailability` ne requiert aucune authentification, vous pouvez l’exécuter sans risque sur un agent fraîchement connecté, même avant d’avoir approvisionné quoi que ce soit. Il indique immédiatement si la connexion et la liste des outils fonctionnent.

## Claude Desktop et claude.ai

Claude Desktop et claude.ai se connectent aux serveurs MCP distants au moyen de **Custom Connectors**. Ouvrez Settings, allez dans Connectors, choisissez « Add custom connector », puis saisissez `https://api.namefi.io/mcp` comme URL de serveur. Après avoir cliqué sur Add, Claude vous invite à terminer l’authentification : la documentation d’Anthropic décrit cette étape comme impliquant fréquemment « OAuth, des clés API ou des combinaisons nom d’utilisateur/mot de passe », l’invite exacte étant déterminée par ce qu’exige le serveur connecté.

<!-- TODO: verify — the exact field Claude Desktop's Custom Connector screen presents for an x-api-key-style header --> Si votre configuration Desktop ne présente pas d’endroit évident où coller la clé, Claude Code (section suivante) est aujourd’hui le chemin vérifié pour les opérations d’écriture, et les outils en lecture seule tels que la recherche de disponibilité fonctionnent via le connecteur sans clé. Le guide complet, y compris l’apparence du flux du connecteur une fois connecté, se trouve dans [Acheter un domaine avec Claude : guide pas à pas de Namefi MCP](/fr/blog/claude-mcp-domains/).

## Claude Code

La documentation de Claude Code fournit une syntaxe générale et exacte pour ajouter un serveur MCP HTTP distant avec un en-tête personnalisé :

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

Exécutez cette commande une fois depuis un terminal en y remplaçant par votre vraie clé. Par défaut, elle écrit le serveur au périmètre **local** — disponible seulement pour vous, dans votre projet actuel (les anciennes versions de Claude Code appelaient ce périmètre « project »). Ajoutez `--scope user` si vous voulez que la connexion soit disponible dans chaque projet de votre machine, ou `--scope project` pour la partager avec toutes les personnes du projet via un fichier `.mcp.json` versionné dans le dépôt. Confirmez la connexion avec `claude mcp list` et vérifiez le nombre d’outils actifs dans une session avec `/mcp`.

## OpenAI Codex CLI

Codex CLI stocke sa configuration MCP dans un fichier TOML, par défaut `~/.codex/config.toml` (ou `.codex/config.toml` limité au projet pour les projets de confiance). Chaque serveur a sa propre table et le transport est déduit des clés présentes : une clé `command` signifie un serveur stdio local, une clé `url` signifie HTTP Streamable. La documentation de Codex précise que le nom de table doit être `mcp_servers` avec un trait de soulignement : `mcp-servers` ou des variantes similaires sont ignorés silencieusement.

```toml
# ~/.codex/config.toml
[mcp_servers.namefi]
url = "https://api.namefi.io/mcp"
env_http_headers = { "x-api-key" = "NAMEFI_API_KEY" }
```

Cette forme récupère la clé dans une variable d’environnement nommée `NAMEFI_API_KEY` plutôt que de l’écrire dans le fichier ; définissez-la dans votre shell avant de lancer Codex. Si vous préférez l’intégrer en dur (ce qui n’est pas recommandé dans un fichier que vous pourriez ajouter au dépôt), la forme statique équivalente est `http_headers = { "x-api-key" = "YOUR_KEY" }`. Codex documente aussi un champ `bearer_token_env_var` destiné spécifiquement à une authentification de type `Authorization: Bearer …`, mais l’en-tête `x-api-key` de Namefi exige les champs génériques `http_headers` / `env_http_headers`, et non celui spécifique au bearer.

## Cursor

Cursor lit les définitions de serveurs MCP dans `mcp.json` — une copie limitée au projet à `.cursor/mcp.json` à la racine de votre dépôt, ou une copie globale à `~/.cursor/mcp.json` qui s’applique partout. La documentation de Cursor donne directement la structure du serveur distant, avec authentification par en-tête et interpolation de variable d’environnement afin que la clé ne doive pas figurer dans le fichier :

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

`${env:NAMEFI_API_KEY}` se résout à la valeur de cette variable d’environnement au moment de la connexion. Consultez [Guide de démarrage rapide Namefi MCP : Claude Code, Cursor et Windsurf](/fr/blog/mcp-quickstart/) pour la version condensée de cette même configuration.

## Windsurf (Cascade)

L’intégration MCP de Windsurf — appelée **Cascade** dans le produit — lit sa liste de serveurs dans `~/.codeium/windsurf/mcp_config.json`. Les serveurs HTTP distants utilisent un champ `serverUrl` (et non `command`), avec le même type d’objet `headers` et l’interpolation `${env:VAR}` que Cursor :

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

Il faut signaler un point clairement : à la date de publication de ce guide, `docs.windsurf.com/windsurf/cascade/mcp` redirige vers `docs.devin.ai/desktop/cascade/mcp`. La documentation de Windsurf vit désormais sous le domaine de documentation produit Devin de Cognition, et la page elle-même fait référence à la fois à « Windsurf » et « Cascade », ainsi qu’à « Devin Desktop ». Le format de configuration ci-dessus est celui que documente cette page actuelle ; si vous utilisez une version plus ancienne de Windsurf, les noms de champs devraient correspondre, mais vérifiez-les avec l’URL de documentation vers laquelle renvoie l’aide intégrée à votre version.

## Gemini CLI

Gemini CLI lit les serveurs MCP dans `settings.json` — une copie au niveau utilisateur à `~/.gemini/settings.json`, ou une copie au niveau projet à `.gemini/settings.json` qui ne s’applique que dans ce projet. La structure du serveur distant emploie `httpUrl` plutôt que `url` :

```json
{
  "mcpServers": {
    "namefi": {
      "httpUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "YOUR_KEY"
      }
    }
  }
}
```

La documentation de Gemini CLI décrit aussi un champ `timeout` (en millisecondes, 600 000 par défaut) si un appel d’outil spécifique prend plus de temps que d’habitude. L’interrogation de l’enregistrement ne devrait pas en avoir besoin, car le client n’attend que chaque appel individuel, non l’ensemble de la boucle d’interrogation.

## Tout autre agent compatible MCP

Si votre agent prend en charge MCP mais n’est pas l’un des six ci-dessus, le côté serveur est identique quel que soit le client qui se connecte : pointez-le vers `https://api.namefi.io/mcp` via HTTP Streamable, avec `x-api-key: YOUR_KEY` comme en-tête personnalisé. Consultez la documentation propre à votre client pour son fichier de configuration ou sa syntaxe de commande. Le descripteur de découverte à [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) existe précisément pour qu’un agent (ou une personne qui le configure) puisse trouver l’URL, le transport et les exigences d’authentification du serveur sans qu’un humain les colle manuellement.

Un schéma utile à connaître si votre client ne prend en charge que les serveurs MCP **locaux (stdio)**, sans HTTP distant ni SSE directement : le package communautaire `mcp-remote` relie un serveur HTTP Streamable distant à un processus local que votre client peut lancer normalement, en transmettant les en-têtes que vous configurez. Ce guide ne peut pas le vérifier dans la documentation de Namefi, car il s’agit d’un pont tiers et non d’un chemin publié par Namefi. Considérez-le comme une solution de repli si votre client précis ne dispose vraiment d’aucune prise en charge native du HTTP distant, non comme le choix par défaut. <!-- TODO: verify — an exact mcp-remote invocation for Namefi's server if a client without native Streamable HTTP support needs it -->

## Sans MCP : le chemin REST brut

Chaque opération décrite ci-dessus est aussi un endpoint HTTPS ordinaire, documenté endpoint par endpoint à [namefi.io/llms.txt](https://namefi.io/llms.txt) et intégralement à [docs.namefi.io](https://docs.namefi.io). Un framework d’agent capable d’effectuer des appels HTTP mais ne parlant pas MCP — un script personnalisé, un autre runtime d’agent, une tâche CI — peut piloter directement le même flux :

```bash
# 1. Check availability (no auth required)
curl "https://api.namefi.io/v-next/search/availability?domain=example.com"

# 2. Register (requires x-api-key)
curl -X POST "https://api.namefi.io/v-next/orders/register-domain" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"normalizedDomainName": "example.com", "durationInYears": 1}'

# 3. Poll the order until it reaches a terminal status
curl "https://api.namefi.io/v-next/orders/{orderId}" \
  -H "x-api-key: YOUR_KEY"
```

llms.txt est une convention de texte brut — un index lisible par machine qu’un site publie à sa racine précisément pour qu’un Agent IA puisse découvrir ce que fait une API sans explorer des pages de documentation rendues. Le fichier de Namefi est suffisamment court pour être lu directement à [namefi.io/llms.txt](https://namefi.io/llms.txt) si vous voulez la version complète au lieu du résumé condensé ci-dessus. Consultez [llms.txt pour les domaines : une API que tout Agent IA peut lire](/fr/blog/llms-txt/) pour en savoir plus sur la convention elle-même.

## Paiement : clé API ou paiement par portefeuille

Tout ce qui figure dans les sections ci-dessus suppose une clé API facturée sur un solde NFSC (Namefi Service Credit) approvisionné : vérifiez-le à tout moment à `GET /v-next/balance` (`x-api-key` requis), rechargez-le via un endpoint faucet dans les environnements de développement ou via le tableau de bord Namefi en production. <!-- TODO: confirm with team — the exact production NFSC top-up flow: accepted payment methods, and whether it's purchasable through chat/API or only the dashboard UI -->

Namefi prend aussi en charge l’enregistrement d’un domaine avec un portefeuille crypto et **sans aucun compte Namefi**, via le protocole [x402](/fr/glossary/x402/) : le portefeuille de l’agent signe une autorisation EIP-3009, l’API répond avec un HTTP 402 indiquant le prix si aucune autorisation n’était encore jointe, et l’enregistrement est réglé dès l’arrivée d’un paiement signé valide — généralement dans un [stablecoin](/fr/glossary/stablecoin/) comme USDC. Il existe aussi une variante apparentée MPP (Machine Payable Protocol) de type défi-réponse et un chemin de signature EIP-712 manuel pour les portefeuilles n’utilisant aucune de ces deux solutions. Ce parcours centré sur le portefeuille est particulièrement pertinent pour les agents visés par ce guide : il supprime entièrement l’étape de création de compte, si bien qu’un processus autonome n’a jamais à détenir — ni à compromettre — une clé API. Consultez [Payer des domaines avec un portefeuille crypto : aucun compte nécessaire](/fr/blog/wallet-checkout/) pour ce flux isolément.

## Garde-fous avant de donner à un agent le pouvoir d’acheter

Un agent capable d’enregistrer un domaine peut aussi dépenser de l’argent et modifier la configuration DNS d’un domaine en production. Quelques décisions méritent donc d’être prises délibérément plutôt que par défaut :

- **Limitez la portée de la clé API au strict nécessaire.** Une clé hérite des autorisations du portefeuille qui l’a générée : générez-la depuis le portefeuille destiné à détenir les nouveaux enregistrements, et non depuis un portefeuille contenant des actifs auxquels vous ne voulez pas que la clé donne accès.
- **Plafonnez ce que l’agent peut dépenser.** Un solde NFSC constitue lui-même un plafond de dépenses : ne l’approvisionnez qu’à hauteur du montant que vous acceptez qu’un agent dépense sans supervision, plutôt que de maintenir un solde important en permanence.
- **Décidez où un humain reste dans la boucle.** Les opérations en lecture seule telles que la recherche de disponibilité ne requièrent aucune authentification et ne présentent aucun risque. Dès qu’un appel soumet `registerDomain`, active le renouvellement automatique ou écrit un enregistrement DNS sur un domaine qui sert déjà du trafic, c’est le point où une confirmation explicite doit être exigée au lieu de laisser l’agent poursuivre de façon autonome.
- **Vérifiez les écritures DNS avant de les confirmer**, comme vous vérifieriez toute modification d’infrastructure. La validation de Namefi rejette les enregistrements mal formés au lieu de les accepter silencieusement (voir le tableau de dépannage ci-dessous), mais elle détecte les erreurs de formatage, non une valeur syntaxiquement correcte mais erronée.

[Qu’est-ce qu’un bureau d’enregistrement de domaines conçu pour les agents ?](/fr/blog/agent-native/) dresse une liste de contrôle plus complète — découvrabilité, erreurs lisibles par machine et chemins de paiement qui ne supposent pas qu’un humain tient une carte de crédit — pour évaluer l’interface destinée aux agents de n’importe quel bureau d’enregistrement, y compris Namefi.

## Dépannage

| Symptôme | Cause probable | Correctif |
| --- | --- | --- |
| `401 UNAUTHORIZED` sur tout appel d’écriture | Clé API invalide, expirée ou générée depuis un portefeuille qui ne possède pas le domaine cible | Générez une nouvelle clé à [namefi.io/api-key](https://namefi.io/api-key) depuis le portefeuille qui possède (ou possédera) le domaine |
| `403 FORBIDDEN` | La clé est valide, mais son portefeuille ne possède pas ce domaine précis | Vérifiez la propriété avant de réessayer |
| Codex ignore votre entrée `[mcp_servers.namefi]` | Faute de frappe dans le nom de table : Codex exige la forme avec trait de soulignement `mcp_servers`, non `mcp-servers` | Corrigez l’en-tête de table dans `config.toml` |
| Cursor ou Windsurf affiche le serveur comme déconnecté | Objet `headers` mal formé, ou `${env:VAR}` fait référence à une variable non définie | Vérifiez que le JSON est valide et que la variable d’environnement référencée est réellement exportée dans le shell qui a lancé l’éditeur |
| Gemini CLI ne trouve pas la configuration | Mauvais `settings.json` modifié : les fichiers utilisateur et projet sont distincts | Confirmez si vous vouliez modifier `~/.gemini/settings.json` ou `.gemini/settings.json` dans le projet actuel |
| Commande d’enregistrement bloquée dans un statut non terminal | Normal : l’enregistrement est asynchrone | Continuez d’interroger `getOrder` ; ne le considérez bloqué que s’il n’atteint jamais `SUCCEEDED`, `FAILED`, `CANCELLED` ou `PARTIALLY_COMPLETED` |
| Création/mise à jour d’un enregistrement DNS rejetée avec une erreur de validation | `zoneName` a un point final, ou une valeur `rdata` CNAME/MX/NS ne comporte pas son point final requis | `zoneName` = aucun point final ; les valeurs `rdata` de type FQDN = point final requis |
| L’enregistrement échoue complètement | Solde NFSC insuffisant dans le portefeuille payeur | Vérifiez `GET /v-next/balance`, rechargez via le faucet (dev) ou le tableau de bord (production) |
| L’agent indique qu’aucun outil de domaine n’est disponible | Serveur MCP non connecté ou connecté sans l’en-tête requis pour les opérations d’écriture | Vérifiez à nouveau le fichier de configuration de votre client ou relancez sa commande d’ajout de serveur avec l’en-tête inclus |

## Questions fréquentes

### Dois-je choisir un seul agent et m’y tenir ?

Non. Le serveur MCP et chaque endpoint REST sont identiques, quel que soit le client qui se connecte : vous pouvez configurer Claude Code aujourd’hui puis Cursor demain avec la même clé API et le même solde NFSC, sans étape de migration.

### Lequel de ces agents est le « meilleur » pour enregistrer un domaine ?

Il n’existe pas de différence de capacité significative pour cette tâche, car chaque client appelle les mêmes opérations côté serveur. Les différences résident entièrement dans la syntaxe de configuration MCP propre à chaque client. C’est précisément pourquoi ce guide donne à chacun sa propre section et la même invite de test : exécutez-la une fois par client et comparez vous-même les transcriptions.

### Que faire si mon agent ne prend pas du tout en charge MCP ?

Utilisez le chemin REST brut ci-dessus. Chaque opération atteinte par un appel d’outil MCP est aussi un endpoint HTTPS documenté, et `namefi.io/llms.txt` est précisément conçu comme point d’entrée en texte brut qu’un agent (ou la personne qui le configure) peut lire sans navigateur.

### Mon domaine est-il automatiquement tokenisé lorsque je l’enregistre ainsi ?

Oui, par défaut. Si vous ne spécifiez pas de `nftReceivingWallet` dans la requête d’enregistrement, le domaine est enregistré comme NFT sur Base dans le portefeuille lié à votre clé API. Vous pouvez le rediriger vers un autre portefeuille au moment de l’enregistrement.

### Un agent peut-il enregistrer un domaine sans que je détienne du tout de clé API ?

Oui : le parcours de paiement x402 signé par le portefeuille ne requiert ni compte Namefi ni clé API, seulement un portefeuille approvisionné. La section sur le paiement ci-dessus couvre l’essentiel de ce flux ; consultez [Payer des domaines avec un portefeuille crypto : aucun compte nécessaire](/fr/blog/wallet-checkout/) pour le guide complet.

### L’enregistrement par un agent coûte-t-il plus cher que l’enregistrement via le site web de Namefi ?

Ce guide ne prétend à aucune comparaison de prix. <!-- TODO: confirm with team — whether Namefi's MCP/API pricing matches its standard registration pricing, or differs --> Dans tous les cas, chaque chemin utilise le même solde NFSC, que la requête provienne d’un navigateur, d’un script ou de l’appel d’outil d’un agent.

## Commencez avec l’agent que vous avez déjà ouvert

Vous n’avez pas besoin de six clients installés pour utiliser ce guide : il vous faut exactement un client, plus une clé API Namefi ou un portefeuille approvisionné. Choisissez ci-dessus la section correspondant à l’outil avec lequel vous êtes déjà en conversation, exécutez la configuration et essayez l’invite de test. À partir de là, le reste du flux de cette page — recherche, enregistrement, configuration DNS — se déroule dans la même conversation.

**[Générez une clé API Namefi](https://namefi.io/api-key)** ou approfondissez avec le [guide Claude comprenant une transcription complète](/fr/blog/claude-mcp-domains/) et la [comparaison directe des bureaux d’enregistrement conçus pour les agents](/fr/blog/cf-namecom-namefi/). Pour les éléments sous-jacents à ce guide, consultez [Serveur MCP Namefi : outils de domaine pour les agents IA](/fr/blog/namefi-mcp/), [Guide de démarrage rapide Namefi MCP : Claude Code, Cursor et Windsurf](/fr/blog/mcp-quickstart/), [Payer des domaines avec un portefeuille crypto : aucun compte nécessaire](/fr/blog/wallet-checkout/) et [llms.txt pour les domaines : une API que tout Agent IA peut lire](/fr/blog/llms-txt/).

## Sources et lectures complémentaires

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (URL du serveur MCP, transport, authentification, référence des endpoints d’enregistrement/DNS, champs `domainSetupOptions` — source primaire de chaque affirmation spécifique à Namefi dans ce guide)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (flux de paiement par portefeuille x402, MPP et EIP-712)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (descripteur de découverte MCP : nom du serveur, URL, transport, type d’authentification)
- Namefi — [docs.namefi.io : Authentification](https://docs.namefi.io/docs/02-authentication.mdx) (modes d’authentification par clé API, EIP-712 et SIWE ; exigences d’authentification par opération)
- Namefi — [docs.namefi.io : Enregistrer un domaine](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (champs de requête d’enregistrement, flux d’interrogation, valeurs de statut de commande)
- Namefi — [docs.namefi.io : Gérer votre solde](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (solde NFSC et endpoints de faucet)
- Anthropic / Claude Code — [Connecter Claude Code à des outils via MCP](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (syntaxe `claude mcp add --transport http`, indicateurs `--header`, `--scope`)
- Model Context Protocol — [Se connecter à des serveurs MCP distants](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication) (flux Custom Connectors de Claude Desktop / claude.ai)
- OpenAI — [learn.chatgpt.com : Model Context Protocol (Codex CLI)](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (table `[mcp_servers.<name>]` de `config.toml`, champs `url`, `http_headers`, `env_http_headers`, `bearer_token_env_var`)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (format de serveur distant dans `mcp.json`, `headers`, interpolation `${env:VAR}`, emplacements de configuration projet et globale)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (redirige vers [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp) à la date de publication de ce guide ; format de `mcp_config.json`, `serverUrl`, `headers`)
- Google — [geminicli.com : serveurs MCP avec Gemini CLI](https://geminicli.com/docs/tools/mcp-server/) (format `settings.json`, `httpUrl`, `headers`, `timeout`)
- llmstxt.org — [Le fichier /llms.txt](https://llmstxt.org) (spécification et justification de la convention de découverte suivie par `namefi.io/llms.txt`)
