---
title: "État des lieux de la gestion agentique des domaines en 2026"
date: '2026-07-10'
language: 'fr'
tags: ['ai-agents', 'domains', 'analysis']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
format: analysis
ogImage: ../../assets/state-of-agentic-og.jpg
description: "Le passage de l’enregistrement de domaines à la couche agent : une chronologie sourcée, un audit de ce qui est livré ou seulement annoncé, y compris chez Namefi, et des prédictions vérifiables pour 2027."
keywords: ["état de la gestion agentique des domaines", "gestion agentique des domaines 2026", "tendances de l’industrie des domaines IA", "adoption de l’IA par l’industrie des domaines", "chronologie de la couche agent", "prédictions bureaux d’enregistrement 2027", "adoption de l’enregistrement de domaines par MCP", "enregistrements de domaines .ai 2026", "version bêta de l’API Cloudflare Registrar", "API conçue pour l’IA de Name.com", "thèse des agents revendeurs de domaines", "rapport Verisign sur l’industrie des noms de domaine", "identité des agents IA ancrée dans le DNS"]
relatedArticles:
  - /fr/blog/agents-buy-domains/
  - /fr/blog/cf-namecom-namefi/
  - /fr/blog/ai-domain-platforms/
  - /fr/blog/agent-native/
  - /fr/blog/ai-agent-register/
relatedTopics:
  - /fr/topics/domain-basics/
  - /fr/topics/web3-foundations/
relatedSeries:
  - /fr/series/blockchain-concepts/
  - /fr/series/domain-apocalypse/
relatedGlossary:
  - /fr/glossary/ai-agent/
  - /fr/glossary/epp/
  - /fr/glossary/registrar/
  - /fr/glossary/registry/
  - /fr/glossary/reseller/
---

À la mi-2026, l’idée selon laquelle « les agents IA vont changer la manière dont les domaines sont enregistrés » peut être confrontée à des événements réels plutôt qu’à des prévisions. Une partie s’est concrétisée à une date précise et vérifiable. Le reste n’est encore qu’une étiquette bêta, un billet de positionnement ou un brouillon en attente dans la file d’un organisme de normalisation. Cet article sépare ces deux catégories : une chronologie sourcée de ce qui a rapproché l’enregistrement de domaines de la [couche agent](/fr/blog/agents-buy-domains/), un audit honnête de ce qui est réellement livré et de ce qui est seulement annoncé — Namefi compris, lacunes incluses —, la thèse des « agents comme revendeurs » qui circule dans la presse spécialisée, ainsi qu’une série de prédictions pour 2027 formulées de sorte que le lecteur puisse les déclarer vraies ou fausses sans dépendre de notre interprétation.

## Les chiffres d’adoption et leur véritable origine

Deux chiffres sont constamment cités cette année dans les articles consacrés à « l’IA et aux domaines », alors qu’ils ne méritent pas le même degré de confiance.

Le premier est une affirmation de Name.com : [« 91 % des répondants imaginent que les agents IA prendront en charge au moins une partie de la gestion de leurs domaines au cours des deux prochaines années »](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years), issue d’un billet publié par l’entreprise le **10 juillet 2025**. Name.com attribue ce chiffre à « notre récente enquête auprès des clients », sans publier ni taille d’échantillon, ni méthodologie, ni vérification indépendante. Il faut donc le considérer pour ce qu’il est : **Name.com rapporte** que ses propres clients, interrogés par Name.com, ont répondu ainsi. Il s’agit d’un sentiment rapporté par l’entreprise, pas d’une statistique indépendante sur l’ensemble du secteur.

Le second chiffre est vérifiable et corroboré de manière indépendante. Le **28 janvier 2026**, le gouvernement d’Anguilla a annoncé que le [ccTLD](/fr/glossary/cctld/) `.ai` avait dépassé le million de domaines enregistrés, un jalon [rapporté directement par Domain Name Wire](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/) : environ 598 000 domaines `.ai` au début de 2025, puis plus d’un million quelque treize mois plus tard, au terme d’une progression de cinq ans depuis une base d’environ 40 000 enregistrements en 2020. L’article de CircleID sur l’industrie des domaines cite indépendamment ce même jalon, et la note sectorielle de Hogan Lovells consacrée au `.ai` confirme la trajectoire. Il s’agit donc d’un chiffre confirmé par plusieurs sources, et non d’une simple affirmation auto-déclarée.

Pour situer ce chiffre par rapport au marché des domaines dans son ensemble : le [Domain Name Industry Brief](https://www.dnib.com) de Verisign pour le T1 2026 fait état de 392,5 millions d’enregistrements de noms de domaine, tous TLD confondus, soit une hausse de 1,4 % en glissement trimestriel et de 6,5 % sur un an — un chiffre que [l’article de CircleID consacré à la publication](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29) reprend directement. Le million environ d’enregistrements en `.ai` représente, au sein de ces 392,5 millions, une part encore modeste mais en croissance rapide : la dynamique est réelle, sans pour autant bouleverser déjà la structure du marché. Ni le DNIB ni les documents publics d’Identity Digital ne précisent quelle proportion des enregistrements passe par un agent plutôt que par une page de paiement dans un navigateur. C’est la lacune que le reste de cet article contourne : nous pouvons vérifier *que* des infrastructures destinées aux agents ont été lancées, et approximativement quand, mais pas encore *quel volume* transite par elles.

## Chronologie : le passage à la couche agent

Chaque date ci-dessous a été vérifiée à partir d’une annonce primaire, d’une documentation officielle ou d’un article de presse spécialisée consulté directement, et non d’un agrégateur secondaire répétant un chiffre non sourcé.

| Date | Événement | Source |
| --- | --- | --- |
| 2004-03 | [EPP](/fr/glossary/epp/) (Extensible Provisioning Protocol), le langage machine-à-machine que les bureaux d’enregistrement utilisent encore pour communiquer avec les registres, atteint le statut Proposed Standard | [RFC 3730 à 3734, publiées en mars 2004](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004) |
| 2024-09-03 | La proposition de fichier `/llms.txt` est publiée afin d’offrir aux sites une manière standard de se décrire auprès des modèles de langage au moment de l’inférence | [llmstxt.org, publié par Jeremy Howard](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time) |
| 2024-11-25 | Anthropic publie le [Model Context Protocol](https://modelcontextprotocol.io), un standard ouvert permettant de connecter des applications d’IA à des serveurs d’outils externes | [Annonce de MCP par Anthropic](https://www.anthropic.com/news/model-context-protocol) |
| 2025-07-10 | Name.com publie son billet de positionnement sur la « première plateforme de domaines conçue pour l’IA », fondée sur MCP et OpenAPI, qui contient notamment la statistique auto-déclarée de 91 % citée plus haut | [Blog de Name.com](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI) |
| 2026-01-28 | Le `.ai` dépasse le million de domaines enregistrés, selon une annonce du gouvernement d’Anguilla | [Domain Name Wire](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/) |
| 2026-04-15 | Durant son « Agents Week », Cloudflare lance la version bêta publique de son API Registrar, qui relie l’enregistrement, la recherche et la tarification à la couche MCP | [Annonce de la version bêta de l’API Registrar de Cloudflare](https://blog.cloudflare.com/registrar-api-beta/) ; [article sectoriel](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer) |
| 2026-04-20 | CircleID publie son analyse consacrée aux « agents comme revendeurs de domaines » | [CircleID, Simone Catania](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention) |
| 2026-04-24 | Le Domain Name Industry Brief du T1 2026 publié par Verisign fait état de 392,5 millions d’enregistrements de domaines au total, fournissant le contexte de marché de tous les chiffres précédents | [DNIB.com](https://www.dnib.com) ; [article de CircleID](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29) |
| 2026-04-27 | Identity Digital — maison mère du registre `.ai` et de [Name.com](https://www.name.com) — lance un « standard d’identité neutre et ancré dans le DNS pour les agents IA », qui propose d’inscrire dans les enregistrements DNS le propriétaire responsable d’un agent | [Salle de presse d’Identity Digital](https://www.globenewswire.com/news-release/2026/04/27/3281553/0/en/identity-digital-launches-neutral-dns-anchored-identity-standard-for-ai-agents.html) |
| 2026-06-04 | Innovation Labs, l’entité d’Identity Digital, formalise cette proposition dans un Internet-Draft de l’IETF intitulé « DNS-Anchored Durable Identity for AI Agents (DNSid) » | [GlobeNewswire](https://www.globenewswire.com/news-release/2026/06/04/3306702/0/en/innovation-labs-by-identity-digital-submits-dns-anchored-durable-identity-proposal-for-ai-agents-to-the-ietf.html#:~:text=Which%20accountable%20entity%20is%20responsible%20for%20this%20agent%2C%20and%20can%20that%20be%20verified%20independently%20across%20systems) ; [brouillon dans le Datatracker de l’IETF](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/) |

Lue dans l’ordre, cette chronologie révèle le schéma suivant : un protocole de provisionnement vieux de vingt ans, puis deux standards généralistes pour agents IA qui n’ont pas été conçus pour les domaines (llms.txt et MCP), ensuite des bureaux d’enregistrement qui adaptent ces standards un à un à leurs parcours d’achat, et enfin la même famille de registres — Identity Digital — qui dépasse le cadre de son propre bureau d’enregistrement et propose le DNS comme infrastructure d’*identité* des agents, et non plus seulement comme infrastructure d’*achat*. Cette dernière étape est la plus récente et la moins établie : un Internet-Draft est une proposition soumise à discussion, pas un standard ratifié.

## Ce qui est réellement livré et ce qui est seulement annoncé

L’expression « conçu pour les agents » est employée de manière assez vague dans les communications marketing. Le tableau ci-dessous distingue ce que chaque acteur a réellement livré — vérifié dans la documentation en ligne de chaque plateforme — de ce qui demeure une étiquette bêta, une affirmation de positionnement ou une proposition en cours de normalisation sans code opérationnel pour l’accompagner.

| Plateforme | Fonctionnalité | État | Preuve |
| --- | --- | --- | --- |
| Namefi | Serveur MCP (`api.namefi.io/mcp`, Streamable HTTP, découvrable à l’adresse `/.well-known/mcp/servers.json`) | **Livré** | [namefi.io/llms.txt](https://namefi.io/llms.txt) |
| Namefi | Paiement en USDC signé par portefeuille via [x402](/fr/glossary/x402/) (`transferWithAuthorization` d’EIP-3009, aucun compte requis) | **Livré** | [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) |
| Namefi | Découverte fondée sur `llms.txt` pour les outils d’agents et la référence REST | **Livré** | [namefi.io/llms.txt](https://namefi.io/llms.txt) |
| Namefi | Plafond de dépenses ou mécanisme de confirmation d’achat au niveau de l’API | **Non livré** — aucun contrôle documenté au moment de la rédaction ; la protection se trouve actuellement dans le client MCP, pas sur le serveur | Notre propre [analyse selon la checklist des plateformes conçues pour les agents](/fr/blog/agent-native/), vérifiée directement pour cet article à partir de `namefi.io/llms.txt` et `namefi.io/web3/llms.txt` |
| Cloudflare | API Registrar : recherche, vérification de disponibilité, vérification du prix et enregistrement synchrone | **Livrée, en version bêta publique** depuis le 2026-04-15 | [Annonce de la version bêta de l’API Registrar de Cloudflare](https://blog.cloudflare.com/registrar-api-beta/) |
| Cloudflare | Gestion des enregistrements DNS, transferts, renouvellements et mise à jour des coordonnées via la même API | **Annoncée, en développement** — le propre billet de Cloudflare indique que l’entreprise « travaille activement à l’extension de l’API afin de couvrir une plus grande partie de l’expérience Registrar », avec un objectif fixé plus tard en 2026 | [Annonce de la version bêta de l’API Registrar de Cloudflare](https://blog.cloudflare.com/registrar-api-beta/) |
| Name.com | Positionnement axé sur l’IA, MCP et OpenAPI, ainsi que sur la transformation du langage naturel en code d’intégration | **Annoncé** — il s’agit d’un billet de positionnement, et non d’une spécification détaillée des fonctionnalités | [Blog de Name.com](https://www.name.com/blog/the-first-ai-native-domain-platform) |
| Name.com | Fichier `llms.txt` découvrable ou serveur MCP dédié, vérifiés directement à la racine du domaine | **Non trouvé** lors de notre examen | Vérification directe sur `name.com`, recoupée dans [Cloudflare vs Name.com vs Namefi](/fr/blog/cf-namecom-namefi/) |
| Identity Digital | DNSid : un enregistrement du propriétaire responsable des agents IA, ancré dans le DNS et vérifiable par cryptographie | **Proposé** — un Internet-Draft de l’IETF soumis à discussion, non un standard ratifié, et qui n’est intégré à aucun paiement en ligne d’un bureau d’enregistrement | [Datatracker de l’IETF : draft-ihsanullah-dnsid](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/) |

Deux enseignements ressortent de ce tableau. Premièrement, aucune plateforme examinée — Namefi comprise — n’a livré de plafond de dépenses documenté et imposé par l’API ; toutes les protections se situent une couche plus haut, dans la politique définie côté client par l’humain, ce qui rejoint la conclusion à laquelle est arrivée notre [checklist des plateformes conçues pour les agents](/fr/blog/agent-native/) dans son évaluation de cette catégorie. Deuxièmement, l’idée d’utiliser le DNS comme ancre d’identité de l’agent lui-même, et non seulement du domaine qu’il achète, en est toujours au stade de la « soumission à l’IETF pour discussion » — il faudra attendre des mois avant qu’un bureau d’enregistrement puisse l’intégrer à un parcours d’achat en production, même si la proposition est bien accueillie.

## La thèse du revendeur

L’expression reprise dans les articles de 2026 consacrés à l’industrie des domaines est que les agents IA deviennent des *revendeurs*. L’analyse de CircleID publiée le 20 avril 2026 l’affirme directement : [« les agents IA agissent de plus en plus comme des revendeurs de domaines, en vérifiant la disponibilité, en enregistrant des noms et en configurant le DNS sans intervention humaine »](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention).

Il convient de distinguer le choix de ce mot de ce qu’il implique. Dans le vocabulaire propre à l’industrie des domaines, un [revendeur](/fr/glossary/reseller/) désigne une entité précise et formelle : une partie qui vend ou provisionne des domaines dans le cadre de l’accord d’accréditation d’un bureau d’enregistrement auprès de l’[ICANN](/fr/glossary/icann/), avec des obligations contractuelles envers le bureau d’enregistrement et, par son intermédiaire, envers l’ICANN. Le simple fait qu’un agent appelle aujourd’hui une API d’enregistrement ne crée en rien cette relation : l’agent agit comme délégué du client final, authentifié au moyen de la clé API ou du portefeuille de celui-ci, et non comme une partie accréditée à part entière. Le cadrage de CircleID est descriptif, pas une affirmation concernant le statut d’accréditation : le *comportement* d’un revendeur — rechercher, obtenir un prix, enregistrer et configurer le DNS de manière répétée et à grande échelle pour le compte d’un tiers — apparaît désormais dans les flux de travail des agents, même lorsque l’opérateur n’est pas une entreprise ayant signé un accord de revente.

Reste à savoir si ce comportement finira par prendre une forme officiellement reconnue par les registres. Pour cela, les registres et les bureaux d’enregistrement devraient décider si l’activité à grande échelle d’agents soumis à des politiques nécessite un niveau d’accréditation, une politique de limitation du débit ou une catégorie de surveillance des abus qui lui soient propres, distincts de ceux d’un revendeur humain. Aucun élément de la chronologie ci-dessus — ni la version bêta de Cloudflare, ni le billet de Name.com, ni le brouillon DNSid d’Identity Digital — ne propose encore un tel niveau. DNSid s’en approche le plus, puisqu’il vise explicitement à vérifier qui répond des actions d’un agent, mais « qui est responsable » et « qui est officiellement accrédité comme revendeur » sont deux questions différentes, et le brouillon ne répond qu’à la première. Pour comprendre les mécanismes d’un achat individuel, consultez [Comment les agents IA achètent des domaines sans humain](/fr/blog/agents-buy-domains/).

## Prédictions pour 2027

Chacune des prédictions suivantes est formulée pour pouvoir être vérifiée à l’aide de preuves publiques : il s’agit d’une affirmation précise, pas d’une impression générale. Un lecteur qui reviendra à la mi-2027 pourra ainsi la classer comme vraie, fausse ou non résolue sans avoir besoin de notre interprétation.

1. **D’ici juillet 2027, Cloudflare, Name.com ou un autre bureau d’enregistrement grand public comparable aura publié un mécanisme documenté de plafond de dépenses ou de confirmation d’achat imposé par l’API** — pas de simples recommandations côté client. Au moment de la rédaction, cette case est vide pour toutes les plateformes examinées, Namefi comprise.
2. **L’API Registrar de Cloudflare aura abandonné son étiquette « bêta » et livré au moins l’une des fonctions suivantes : gestion des enregistrements DNS, automatisation des renouvellements ou prise en charge des transferts**, d’ici la fin de 2027. Cela correspond à la formulation « plus tard en 2026 » de sa propre annonce de version bêta, à laquelle nous ajoutons une année de marge.
3. **L’Internet-Draft DNSid — ou un successeur direct répondant à la question « qui est responsable de cet agent ? » — sera toujours au stade de brouillon de l’IETF, et non de RFC approuvée**, en juillet 2027. Les documents soumis au processus de normalisation prennent généralement plusieurs années après leur dépôt, et celui-ci a été déposé en juin 2026.
4. **Les enregistrements en `.ai` dépasseront 1,5 million** d’ici juillet 2027, poursuivant la courbe de croissance documentée par Domain Name Wire et Identity Digital au lieu de plafonner près du million franchi en janvier 2026.
5. **Au moins une des plateformes comparées ici emploiera publiquement le mot « reseller » ou « agent-reseller »** dans ses propres communications marketing ou sa documentation concernant les activités d’enregistrement pilotées par des agents, officialisant le cadrage utilisé par CircleID en avril 2026 au lieu de le laisser cantonné à la presse spécialisée.

## Questions fréquentes

### Combien de domaines sont réellement enregistrés par des agents IA aujourd’hui ?

Aucun registre ni bureau d’enregistrement que nous avons examiné — DNIB, Identity Digital, Cloudflare ou Name.com — ne publie de chiffre distinguant les enregistrements initiés par des agents de ceux effectués par des humains. Ce qui est vérifiable, c’est l’infrastructure : quelles plateformes ont livré un parcours d’enregistrement utilisable par un agent — Namefi, Cloudflare en version bêta, Name.com dans son positionnement — et à quelle date. Le volume d’adoption attribuable aux agents n’est pas une donnée publique au moment de la rédaction.

### La statistique de 91 % publiée par Name.com est-elle un chiffre sectoriel fiable ?

Il faut la considérer comme un sentiment rapporté par l’entreprise, et non comme une enquête indépendante. Le billet de Name.com de juillet 2025 attribue ce chiffre à « notre récente enquête auprès des clients », sans publier de méthodologie, de taille d’échantillon ou d’auditeur externe. C’est un indicateur de ce que les clients de Name.com ont déclaré à l’entreprise, pas une statistique valable pour l’ensemble du marché.

### Le `.ai` a-t-il vraiment atteint le million d’enregistrements, et qui l’a confirmé ?

Oui, et le chiffre est corroboré de manière indépendante. Le gouvernement d’Anguilla, qui administre le [ccTLD](/fr/glossary/cctld/) `.ai`, a directement annoncé ce jalon, tandis que Domain Name Wire a rapporté les chiffres de croissance avec une date précise — le 28 janvier 2026. CircleID et une note sectorielle de Hogan Lovells citent tous deux ce même jalon de manière indépendante : le niveau de preuve est donc différent de celui d’une statistique auto-déclarée par une entreprise.

### Qu’est-ce que DNSid, et change-t-il la manière dont les domaines sont enregistrés ?

DNSid est un Internet-Draft — une proposition formelle, pas un standard ratifié — soumis à l’IETF en juin 2026 par Innovation Labs, l’entité d’Identity Digital. Il propose d’utiliser des enregistrements DNS comme trace durable et vérifiable de « qui est responsable de cet agent IA ». Il s’agit d’un problème différent de l’enregistrement lui-même : identifier l’agent, et non acheter le domaine. Au moment de la rédaction, DNSid n’est intégré à aucun parcours d’achat en production chez un bureau d’enregistrement.

### Un bureau d’enregistrement a-t-il déjà livré un plafond de dépenses ou un contrôle empêchant l’agent de trop dépenser ?

Pas au niveau de l’API, pour autant que nous ayons pu le vérifier en consultant directement la documentation de chaque plateforme. Namefi, Cloudflare et Name.com laissent tous cette protection à la politique définie côté client par un humain — le client MCP, le cadre logiciel des agents ou la limite de financement de la clé API — plutôt qu’à un contrôle de confirmation imposé par le bureau d’enregistrement lui-même. C’est la seule ligne que tous les tableaux d’évaluation des plateformes « conçues pour les agents » dans ce secteur, y compris le nôtre, considèrent encore comme incomplète.

### Où puis-je lire les mécanismes d’un achat individuel par un agent plutôt qu’une vue d’ensemble du secteur ?

[Comment les agents IA achètent des domaines sans humain](/fr/blog/agents-buy-domains/) détaille, étape par étape, la séquence recherche-prix-authentification-enregistrement-configuration. [Cloudflare vs Name.com vs Namefi](/fr/blog/cf-namecom-namefi/) compare les fonctionnalités des trois plateformes, tandis que [Qu’est-ce qu’un bureau d’enregistrement de domaines conçu pour les agents ?](/fr/blog/agent-native/) présente la checklist qui sous-tend le tableau des fonctionnalités livrées ou annoncées de cet article.

## Enregistrez votre domaine avec un agent qui livre déjà toute la pile technologique

La plupart des lacunes documentées ici — plafonds de dépenses non documentés, étiquettes bêta, billets de positionnement sans spécification détaillée — ne sont pas propres à une plateforme ; elles reflètent l’état de la catégorie à la mi-2026. [Namefi](https://namefi.io) livre aujourd’hui ce qui est réellement disponible : un serveur MCP auquel votre agent se connecte directement, une API REST découvrable via `llms.txt`, et un paiement en USDC signé par portefeuille grâce à [x402](/fr/glossary/x402/), sans compte requis, ainsi qu’un [Domaine Tokenisé](/fr/glossary/tokenized-domain/) si vous souhaitez que le domaine soit détenu dans le portefeuille d’un agent.

**[Recherchez et enregistrez un domaine sur Namefi](https://namefi.io).**

## Sources et lectures complémentaires

- Domain Name Wire — [L’espace de noms .AI atteint 1 million de noms de domaine (28 janvier 2026)](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/)
- CircleID — [L’univers des domaines en 2026 : IA, sécurité, maturité du marché et nouvelle frontière des gTLD (20 avril 2026)](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)
- CircleID — [Le DNIB fait état de 392,5 millions d’enregistrements de noms de domaine au T1 2026](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29)
- Verisign / DNIB.com — [Domain Name Industry Brief](https://www.dnib.com)
- Cloudflare — [Annonce de la version bêta de l’API Registrar (15 avril 2026)](https://blog.cloudflare.com/registrar-api-beta/)
- webhosting.today — [Les agents IA peuvent désormais enregistrer des domaines sans intervention humaine](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer)
- Name.com — [La première plateforme de domaines conçue pour l’IA (10 juillet 2025)](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years)
- Identity Digital — [Identity Digital lance un standard d’identité neutre et ancré dans le DNS pour les agents IA (27 avril 2026)](https://www.globenewswire.com/news-release/2026/04/27/3281553/0/en/identity-digital-launches-neutral-dns-anchored-identity-standard-for-ai-agents.html)
- Identity Digital / GlobeNewswire — [Innovation Labs d’Identity Digital soumet à l’IETF une proposition d’identité durable des agents ancrée dans le DNS (4 juin 2026)](https://www.globenewswire.com/news-release/2026/06/04/3306702/0/en/innovation-labs-by-identity-digital-submits-dns-anchored-durable-identity-proposal-for-ai-agents-to-the-ietf.html#:~:text=Which%20accountable%20entity%20is%20responsible%20for%20this%20agent%2C%20and%20can%20that%20be%20verified%20independently%20across%20systems)
- Datatracker de l’IETF — [draft-ihsanullah-dnsid : identité durable des agents IA ancrée dans le DNS](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/)
- llmstxt.org — [Proposition de fichier /llms.txt (publiée le 3 septembre 2024)](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)
- Anthropic — [Présentation du Model Context Protocol (25 novembre 2024)](https://www.anthropic.com/news/model-context-protocol)
- Wikipédia — [Extensible Provisioning Protocol (Proposed Standard, mars 2004)](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- Namefi — [namefi.io/llms.txt (serveur MCP et référence de l’API REST)](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt (référence du paiement x402 signé par portefeuille)](https://namefi.io/web3/llms.txt)
