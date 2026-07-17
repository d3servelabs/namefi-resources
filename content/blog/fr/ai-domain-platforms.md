---
title: "Plateformes de domaines agentiques : le guide 2026"
date: '2026-07-10'
language: 'fr'
tags: ['ai-agents', 'domains', 'guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['alan-machin']
draft: false
format: guide
ogImage: ../../assets/ai-domain-platforms-og.jpg
description: "Toutes les plateformes où un agent IA peut rechercher, tarifer et enregistrer un domaine en 2026 — Cloudflare, Name.com, Namefi — par interface, paiement et autonomie."
keywords: ["enregistrement de domaine agent ia", "plateforme de domaine agentique", "acheter un domaine avec ia", "achat de domaine en langage naturel", "bureau d'enregistrement de domaine mcp", "api de domaine ia", "plateformes d'enregistrement de domaine agentiques", "bureau d'enregistrement natif des agents", "cloudflare registrar api", "namefi mcp", "name.com api native ia", "bureau d'enregistrement de domaine llms.txt", "une ia peut-elle acheter un domaine", "plateforme agent ia achat de noms de domaine 2026", "quelles plateformes permettent aux agents ia d'enregistrer des domaines"]
relatedArticles:
  - /fr/blog/cf-namecom-namefi/
  - /fr/blog/agent-native/
  - /fr/blog/claude-mcp-domains/
  - /fr/blog/ai-agent-register/
  - /fr/blog/airo-vs-namefi/
relatedTopics:
  - /fr/topics/domain-tokenization/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/tokenize-your-com/
  - /fr/series/best-tlds-by-industry/
relatedGlossary:
  - /fr/glossary/ai-agent/
  - /fr/glossary/registrar/
  - /fr/glossary/tld/
  - /fr/glossary/tokenized-domain/
  - /fr/glossary/wallet/
---

Il y a un an, « IA et domaines » signifiait un générateur de noms : vous saisissiez une idée d'entreprise dans un champ, il produisait une liste de suggestions en `.com` et `.ai`, puis vous passiez à un paiement humain ordinaire. Cette catégorie existe toujours et reste utile. Mais elle ne raconte plus toute l'histoire.

Depuis le début de 2026, une deuxième catégorie est devenue réelle : des plateformes où un [Agent IA](/fr/glossary/ai-agent/) — et non une personne cliquant avec une souris — peut rechercher la disponibilité, lire un prix et finaliser lui-même l'enregistrement, comme une étape d'une tâche plus longue du type « crée une landing page pour cette idée et mets-la sur un vrai domaine ». Il s'agit de quelque chose de sensiblement différent d'une boîte de suggestions plus intelligente, et les deux sont constamment confondus, y compris dans de nombreux textes marketing qui les décrivent.

Ce guide est la carte de ce paysage. Il couvre les modèles d'interface qui rendent une plateforme utilisable par un agent, passe en revue les plateformes précises qui prennent aujourd'hui en charge l'enregistrement agentique (ce que chacune peut et ne peut pas réellement faire, vérifié dans leur propre documentation) et les oppose à ce que proposent les grands bureaux d'enregistrement établis. Il se termine par un tableau de décision et une FAQ. Si vous connaissez déjà les chiffres comparatifs que vous cherchez, passez directement à [Cloudflare vs Name.com vs Namefi](/fr/blog/cf-namecom-namefi/).

Une note avant de commencer : plusieurs des plateformes ci-dessous sont en bêta publique, et les fonctionnalités bêta évoluent. Tout ce qui suit a été vérifié dans la documentation en direct à la date de publication de ce guide ; considérez chaque affirmation précise sur une capacité comme actuelle à cette date, non comme une spécification permanente.

## Pourquoi l'enregistrement de domaines est entré dans la couche des agents

Pendant plus de vingt ans, enregistrer un domaine nécessitait une session dans un navigateur : un champ de recherche, un panier, un formulaire de paiement et souvent un CAPTCHA pour prouver qu'un humain était aux commandes. Les bureaux d'enregistrement ont disposé d'API programmatiques pendant la majeure partie de cette période, mais elles étaient conçues pour d'autres systèmes logiciels — un tableau de bord d'hébergement, un script de renouvellement en masse —, pas pour un modèle de langage qui décide, au milieu d'une conversation, qu'un projet a besoin d'un nom.

Deux évolutions se sont succédé rapidement. D'abord, en juillet 2025, Name.com a annoncé ce qu'il a appelé la première plateforme de domaines native de l'IA : une API construite autour du [Model Context Protocol](https://modelcontextprotocol.io) (MCP) et de schémas OpenAPI, explicitement conçue pour qu'un agent de programmation puisse lire la spécification et écrire un code d'enregistrement fonctionnel à partir d'une demande en langage naturel telle que « ajoute l'enregistrement de domaines à mon application » ([Name.com](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20first%20registrar%20to%20bring%20together%20intelligent%20domain%20capabilities%20and%20seamless%20integration%20for%20AI%20agents)). Ensuite, le 15 avril 2026, Cloudflare a placé une API de bureau d'enregistrement en bêta publique en annonçant explicitement que « l'API Registrar permet de rechercher des domaines, de vérifier leur disponibilité et de les enregistrer par programmation » (blog Cloudflare, via une [couverture sectorielle](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/)) — et, fait notable, l'a raccordée directement au serveur MCP de Cloudflare auquel les agents de Cursor et Claude Code avaient déjà accès.

Ce second mouvement est celui qui a été largement commenté, car Cloudflare est un bureau d'enregistrement connu et de grande taille, et le cadrage était direct : l'enregistrement de domaines, une tâche qui avait résisté à l'automatisation parce qu'elle exigeait qu'un humain clique sur « J'accepte » et saisisse un numéro de carte, était discrètement devenu une sous-routine qu'un agent pouvait exécuter. L'enquête de CircleID à la mi-2026 sur le secteur des domaines l'a formulé directement : « Les agents IA agissent de plus en plus comme des revendeurs de domaines, vérifiant la disponibilité, enregistrant des noms et configurant le DNS sans intervention humaine » ([CircleID, avril 2026](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)).

Rien de tout cela n'est arrivé parce que les registres ont changé leurs règles. Cela s'est produit parce qu'une poignée de plateformes ont décidé de rendre leur parcours d'achat existant intelligible pour un appelant machine, plutôt que pour un navigateur seulement. Or cela exige davantage que de « publier une API ».

## Trois modèles d'interface : API brute, serveur MCP et llms.txt

Toute API n'est pas utilisable par un agent, et l'écart est suffisamment important pour mériter d'être nommé avec précision. Voir [Qu'est-ce qu'un bureau d'enregistrement de domaines natif des agents ?](/fr/blog/agent-native/) pour la liste de contrôle complète ; en bref, trois modèles qui se chevauchent apparaissent dans les plateformes de ce guide.

- **Une API REST brute.** C'est le modèle le plus ancien. Tout bureau d'enregistrement doté d'une API pour développeurs permet techniquement à un logiciel d'enregistrer un domaine. Le problème est la découverte : un agent doit déjà savoir que l'API existe, avoir déjà la documentation dans son contexte et disposer déjà d'un client écrit pour elle. Une API REST seule n'indique ni à un agent généraliste qu'elle existe ni comment l'utiliser correctement.
- **Un serveur MCP.** Le [MCP](https://modelcontextprotocol.io) est un protocole ouvert, indépendant des modèles — décrit par ses mainteneurs comme « une façon standardisée de connecter les applications IA à des systèmes externes », comparable à « un port USB-C pour les applications IA » ([modelcontextprotocol.io](https://modelcontextprotocol.io#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications)). Il expose un ensemble défini d'outils appelables à tout client IA compatible : Claude, Cursor, Windsurf et d'autres. Un bureau d'enregistrement qui livre un serveur MCP remet à l'agent un menu d'opérations exactes (`search_domain`, `register_domain`, `set_dns_record`) plutôt qu'un mur de documentation REST à rétroconcevoir.
- **Une API découvrable via llms.txt.** [llms.txt](https://llmstxt.org) est une convention en texte brut — un fichier `/llms.txt` à la racine d'un site — proposée en 2024 pour donner aux modèles de langage un index concis et organisé de la documentation et des capacités clés d'un site, de la même manière que `robots.txt` donne aux robots des règles d'accès. Un bureau d'enregistrement qui en publie un, par exemple sous `namefi.io/llms.txt`, permet à un agent qui n'a jamais vu la plateforme de découvrir ce qu'elle peut faire sans qu'un humain doive d'abord coller la documentation de l'API dans la conversation.

Ce ne sont pas des normes concurrentes ; les plateformes les plus solides superposent les trois, en utilisant llms.txt pour la découverte, un serveur MCP pour les appels d'outils eux-mêmes et l'API REST sous-jacente aux deux.

## Plateforme par plateforme

### API Cloudflare Registrar (bêta)

La bêta de Cloudflare, disponible depuis le 15 avril 2026, couvre trois opérations : recherche, vérification de disponibilité et de prix, puis enregistrement. Cloudflare les présente lui-même comme « le premier moment critique du cycle de vie d'un domaine », les transferts, renouvellements et mises à jour des contacts étant prévus plus tard dans l'année (blog Cloudflare). Les prix suivent le modèle de longue date de Cloudflare pour les bureaux d'enregistrement : « nous facturons exactement ce que facture le registre », sans majoration, que l'appel provienne du tableau de bord, de l'API ou d'un agent (blog Cloudflare).

La partie destinée aux agents est l'intégration, pas un produit distinct : « l'API Registrar fait partie de l'API Cloudflare complète, ce qui signifie que les agents y ont déjà accès aujourd'hui par l'intermédiaire du MCP de Cloudflare », et « un agent travaillant dans Cursor, Claude Code ou tout environnement compatible MCP peut découvrir et appeler les points de terminaison du Registrar » (blog Cloudflare). La propre description de Cloudflare du flux prévu conserve un point de contrôle : un agent peut « suggérer des noms, confirmer lequel est réellement enregistrable, afficher le prix pour approbation, puis finaliser l'achat » (blog Cloudflare). Mais d'après la documentation, il s'agit d'une recommandation de conception, non d'un mécanisme de plafond de dépense imposé par l'API elle-même.

Deux réserves à connaître avant de planifier autour de cette bêta : elle ne couvre pas encore tout le catalogue de TLD de Cloudflare, seulement ce que Cloudflare appelle « un ensemble organisé de TLD populaires pour commencer » (blog Cloudflare), et elle est facturée sur un compte Cloudflare existant, une relation en monnaie fiduciaire associée à un humain, même lorsque l'agent est celui qui appelle l'API.

### API native de l'IA de Name.com

La plateforme de Name.com, annoncée en juillet 2025, repose sur la même idée de passage du langage naturel au code : un développeur ou un agent décrit ce qu'il souhaite (« ajoute l'enregistrement de domaines à mon application ») et la documentation de la plateforme est structurée pour qu'un client IA transforme cette demande en code d'intégration fonctionnel. Elle utilise MCP et OpenAPI comme infrastructure sous-jacente, offre un accès développeur en libre-service et prend en charge des outils comme Claude et Cursor ([Name.com](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=leverages%20modern%20standards%20including%20Model%20Context%20Protocol)). Les prix sont transparents et fondés sur le volume, selon une structure de majoration de type revendeur courante dans les API de bureaux d'enregistrement.

L'annonce de Name.com ne documente pas de parcours de paiement crypto ou par portefeuille, ni d'étape explicite de confirmation humaine intégrée à l'API elle-même. Ces deux éléments sont plausibles dans un modèle standard de compte développeur, mais ne figurent pas dans la source. Traitez donc la facturation fiduciaire fondée sur un compte comme l'hypothèse de travail, non comme un détail entièrement confirmé.

### Namefi : serveur MCP et paiement par portefeuille

L'index de capacités lisible par machine de Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) — est lui-même un exemple du troisième modèle d'interface ci-dessus et constitue la source de vérité unique pour ce qui suit. Namefi exploite un serveur MCP sous `api.namefi.io/mcp` via Streamable HTTP, qui expose des outils typés pour l'enregistrement, les vérifications de disponibilité et la gestion DNS ; il peut être ajouté à Claude Code avec une seule commande (`claude mcp add --transport http namefi https://api.namefi.io/mcp`). En dessous se trouve une API REST (`api.namefi.io/v-next/`) authentifiée par l'en-tête `x-api-key`. La clé doit être générée depuis le portefeuille qui possède le domaine, ce qui relie l'accès API directement à la garde On-Chain plutôt qu'à un flux distinct de récupération de compte.

La différence déterminante est le paiement. Namefi documente deux voies : le parcours standard par clé API, facturé sur un solde prépayé NFSC (Namefi Service Credits), et une voie native crypto utilisant des signatures de portefeuille — notamment SIWE (Sign-In With Ethereum) — pour ce que sa documentation décrit comme des utilisateurs Web3 et des « portefeuilles agentiques », permettant d'autoriser un achat sans créer de compte auprès d'un bureau d'enregistrement. Après l'enregistrement, Namefi prend en charge le CRUD complet des enregistrements DNS (A, AAAA, CNAME, MX, TXT et autres), le renouvellement automatique, le parking et la redirection de domaines, la génération automatique d'enregistrements ENS et — la fonctionnalité qui le distingue structurellement des deux autres plateformes ici — le [Domaine Tokenisé](/fr/glossary/tokenized-domain/) : représenter un vrai domaine enregistré auprès de l'ICANN comme un actif On-Chain détenu dans un [Portefeuille](/fr/glossary/wallet/). La configuration pas à pas — pour Claude, Codex, Cursor et trois autres agents — se trouve dans [Comment enregistrer un domaine avec votre agent IA sur Namefi](/fr/blog/ai-agent-register/), avec l'étude détaillée spécifique à Claude dans [Acheter un domaine avec Claude : guide Namefi MCP pas à pas](/fr/blog/claude-mcp-domains/). Pour voir à quoi ressemble réellement cette demande en langage naturel, voir [Comment acheter un domaine avec le langage naturel (2026)](/fr/blog/nl-domain-purchase/).

Une lacune mérite d'être signalée clairement : le fichier llms.txt de Namefi ne publie pas une liste fixe des TLD pris en charge. <!-- TODO: confirmer avec l'équipe — liste complète des TLD pris en charge --> Si la couverture des TLD est le facteur décisif de votre cas d'usage, vérifiez-la directement dans la documentation actuelle avant de vous engager.

## Ce que proposent à la place les acteurs établis comme GoDaddy et Namecheap

Il importe d'être précis sur la raison pour laquelle les grands [Bureaux d'enregistrement](/fr/glossary/registrar/) grand public ne figurent pas dans le tableau ci-dessus, car [« recherche de domaines par IA » sert à décrire deux produits réellement différents](/fr/blog/ai-search-meanings/). Les grands acteurs établis ont beaucoup investi dans les suggestions de noms et l'onboarding assistés par IA : des outils qui prennent une description de votre entreprise et génèrent des candidats à des noms de marque, parfois associés à un générateur de logo ou de site de départ. C'est un produit réel et utile. Ce n'est pas la même catégorie que les plateformes ci-dessus, car l'IA de ce flux aide la décision d'un humain ; elle ne détient pas l'autorité de rechercher, tarifer et finaliser elle-même un enregistrement, appelée comme outil par un agent externe. Une personne arrive toujours sur une page de paiement et clique sur acheter. Tant qu'un acteur établi ne publie pas une API appelable par agent, un serveur MCP ou un fichier llms.txt avec la même autorité que celle documentée par les trois plateformes ci-dessus, il appartient à la catégorie « l'IA aide un humain à choisir », non à celle-ci.

## Le tableau principal de décision

| Plateforme | Interface | Paiement | Humain dans la boucle | Couverture TLD |
| --- | --- | --- | --- | --- |
| **API Cloudflare Registrar** (bêta) | API REST + MCP Cloudflare ; fonctionne nativement dans Cursor, Claude Code et tout client MCP | Monnaie fiduciaire, facturée à un compte Cloudflare existant | Le modèle de conception affiche le prix « pour approbation » avant l'achat ; aucun plafond de dépense documenté n'est imposé par l'API elle-même | Ensemble organisé de TLD populaires au lancement de la bêta — pas tout le catalogue Cloudflare |
| **API native de l'IA de Name.com** | REST + schéma OpenAPI, compatible MCP ; flux du langage naturel au code | Monnaie fiduciaire, facturation standard par compte développeur, prix au volume de type revendeur | Non documenté dans l'annonce publique | Non détaillée dans l'annonce |
| **Namefi** | API REST (`x-api-key`) + serveur MCP (`api.namefi.io/mcp`, Streamable HTTP) | Monnaie fiduciaire via un solde prépayé par clé API, **ou** signature de portefeuille crypto (SIWE) sans compte requis | Optionnel par conception : le parcours par clé API est borné par un solde prépayé ; le parcours par portefeuille exige une signature par transaction | Non détaillée dans la documentation publique — vérifiez la couverture actuelle pour votre TLD |

Pour la version complète, fonctionnalité par fonctionnalité, de ce tableau — recherche de disponibilité, gestion DNS, automatisation des renouvellements, propriété tokenisée et plus encore — voir [Cloudflare vs Name.com vs Namefi : bureaux d'enregistrement natifs des agents](/fr/blog/cf-namecom-namefi/).

## Comment choisir

- **Vous vivez déjà dans l'écosystème Cloudflare et avez simplement besoin aujourd'hui de rechercher, vérifier et enregistrer.** L'API Registrar est l'option qui présente le moins de friction si vos domaines et votre DNS sont déjà chez Cloudflare, au prix d'une liste de TLD et d'un ensemble de fonctionnalités encore plus restreints en bêta qu'un bureau d'enregistrement complet.
- **Vous construisez un produit de revendeur ou multi-tenant au-dessus de l'enregistrement de domaines.** Les tarifs au volume et l'accès développeur en libre-service de Name.com ont été conçus en pensant aux revendeurs.
- **Votre agent doit effectuer une transaction sans compte préexistant détenu par un humain, ou vous souhaitez que le domaine soit lui-même un actif portable détenu dans un portefeuille.** C'est précisément le manque que [Namefi](https://namefi.io) comble : un paiement signé par portefeuille sans étape d'inscription, ainsi qu'une propriété de [Domaine Tokenisé](/fr/glossary/tokenized-domain/) si vous souhaitez que le domaine se déplace et prouve sa garde comme tout autre actif On-Chain.
- **Vous n'êtes pas certain d'avoir besoin d'une autorité d'achat agentique.** Si vous voulez en réalité de l'aide pour choisir un nom tout en laissant une personne cliquer sur « acheter », un générateur de noms assisté par IA vous conviendra mieux que toute plateforme de ce guide. Voir [« Recherche de domaines par IA » signifie deux choses différentes en 2026](/fr/blog/ai-search-meanings/) pour la distinction complète.

## Questions fréquemment posées

### ChatGPT ou Claude peuvent-ils m'acheter un domaine dès maintenant ?

Tout dépend des outils auxquels ce client de chat précis a accès, et non du modèle lui-même. Un modèle tel que Claude n'a aucune capacité intégrée d'enregistrer un domaine : il doit être connecté au serveur MCP ou à l'API d'une plateforme (par exemple le serveur MCP de Namefi ou l'API Registrar de Cloudflare via le MCP de Cloudflare) avant de pouvoir rechercher, tarifer et finaliser un achat. Sans cette connexion, un assistant IA ne peut que suggérer des noms que vous devrez enregistrer vous-même.

### Est-il sûr de laisser un agent IA enregistrer des domaines et dépenser de l'argent sans vérifier avec moi d'abord ?

Traitez cela comme toute autorité d'achat automatisée : encadrez-la avant de l'accorder. Les modèles les plus sûrs documentés par ces plateformes sont un solde prépayé qui plafonne l'exposition totale (le parcours par clé API de Namefi), une signature par transaction qui ne peut pas être réutilisée (paiement signé par portefeuille), ou une étape de confirmation manuelle avant l'appel final d'achat. Aucune des plateformes de ce guide n'impose un plafond de dépense universel pour votre compte : vous définissez le garde-fou, généralement via des limites de financement du compte ou une étape de confirmation explicite dans le flux de votre propre agent.

### Quelle est la différence réelle entre une API, un serveur MCP et llms.txt ?

Une API REST est l'ensemble sous-jacent des opérations appelables. Un serveur MCP conditionne un sous-ensemble défini de ces opérations sous forme d'outils distincts que tout client IA compatible MCP peut appeler directement, sans code d'intégration personnalisé. Un fichier llms.txt est une couche de découverte — un index court et organisé à la racine d'un site qui indique à un agent quelle documentation et quelles capacités existent en premier lieu, comme robots.txt indique à un robot ce qu'il peut indexer. Une plateforme peut disposer de l'un des trois éléments isolément, mais les plateformes natives des agents les plus solides combinent les trois : llms.txt pour être trouvées, MCP pour être appelées et REST sous les deux.

### Ai-je besoin d'un portefeuille de cryptomonnaies pour utiliser l'une de ces plateformes ?

Non. Cloudflare et Name.com utilisent tous deux une facturation classique en monnaie fiduciaire fondée sur un compte, et Namefi prend aussi en charge le même type de facturation par clé API sur un solde prépayé. Un portefeuille n'est requis que si vous voulez précisément le parcours sans compte de Namefi, signé par portefeuille, ou sa fonctionnalité de propriété tokenisée.

### Laquelle de ces plateformes est la plus « terminée » aujourd'hui ?

Aucune ne doit être considérée comme une spécification achevée et immuable : celle de Cloudflare est explicitement étiquetée bêta et sa liste de TLD est plus étroite que son catalogue complet ; les fonctionnalités bêta sont par définition susceptibles d'évoluer. Vérifiez les capacités actuelles dans la documentation en direct de chaque plateforme avant de créer une dépendance sur une fonctionnalité précise.

## Achetez et tokenisez votre prochain domaine sur Namefi

Quel que soit le modèle d'interface adapté à votre flux de travail, [Namefi](https://namefi.io) est conçu pour le cas où l'acheteur est aussi souvent un agent, un portefeuille ou un script qu'une personne cliquant dans un formulaire : un [ICANN](/fr/glossary/icann/)-[Bureau d'enregistrement](/fr/glossary/registrar/) accrédité avec un serveur MCP, une API REST documentée et un parcours de paiement signé par portefeuille qui évite entièrement la création de compte, plus un [Domaine Tokenisé](/fr/glossary/tokenized-domain/) optionnel pour que le domaine lui-même devienne un actif que le portefeuille de votre agent peut détenir et déplacer.

**[Rechercher et enregistrer un domaine sur Namefi](https://namefi.io).**

## Sources et lectures complémentaires

- Blog Cloudflare — [Annonce de la bêta de l'API Registrar](https://blog.cloudflare.com/registrar-api-beta/) (date de lancement, opérations prises en charge, prix de revient, intégration MCP, ensemble de TLD organisé)
- webhosting.today — [Les agents IA peuvent maintenant enregistrer des domaines, aucun humain nécessaire](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/) (cadrage sectoriel de la bêta de Cloudflare et de ses implications de gouvernance)
- Name.com — [La première plateforme de domaines native de l'IA](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20first%20registrar%20to%20bring%20together%20intelligent%20domain%20capabilities%20and%20seamless%20integration%20for%20AI%20agents) (annonce, juillet 2025)
- CircleID — [L'univers des domaines en 2026 : IA, sécurité, maturité du marché et nouvelle frontière des gTLD](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention) (analyse des agents comme revendeurs, avril 2026)
- dev.to — [Comment enregistrer un nom de domaine avec votre agent IA, sans humain nécessaire](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26) (tutoriel MCP tiers construit sur l'API Registrar de Cloudflare)
- llmstxt.org — [Le fichier /llms.txt](https://llmstxt.org) (spécification et justification)
- modelcontextprotocol.io — [Qu'est-ce que le Model Context Protocol ?](https://modelcontextprotocol.io#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (aperçu du protocole)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (index de capacités de Namefi : API, serveur MCP, modèle d'authentification, DNS et fonctionnalités de tokenisation)
