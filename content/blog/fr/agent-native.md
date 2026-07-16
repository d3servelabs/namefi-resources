---
title: "Qu’est-ce qu’un bureau d’enregistrement de domaines conçu pour les agents ?"
date: '2026-07-10'
language: 'fr'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['alan-machin']
draft: false
format: explainer
ogImage: ../../assets/agent-native-og.jpg
description: "Les bureaux d’enregistrement disposent d’API depuis des décennies, mais une API seule ne suffit pas à être conçue pour les agents. La checklist : découverte, documentation, erreurs, paiement et contrôles de politique."
keywords: ["bureau d’enregistrement natif pour agents", "définition agent-native", "qu’est-ce qu’un bureau d’enregistrement natif pour agents", "api prête pour les agents", "serveur mcp", "llms.txt", "erreurs lisibles par machine", "idempotence", "paiements agentiques", "enregistrement de domaine par agent ia", "documentation api en langage naturel", "contrôles de politique agent ia", "facturation par clé api", "paiement de domaine en crypto par portefeuille"]
relatedArticles:
  - /fr/blog/ai-domain-platforms/
  - /fr/blog/cf-namecom-namefi/
  - /fr/blog/ai-agent-register/
  - /fr/blog/claude-mcp-domains/
  - /fr/blog/airo-vs-namefi/
relatedTopics:
  - /fr/topics/web3-foundations/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/blockchain-concepts/
  - /fr/series/tokenize-your-com/
relatedGlossary:
  - /fr/glossary/ai-agent/
  - /fr/glossary/registrar/
  - /fr/glossary/icann/
  - /fr/glossary/epp/
  - /fr/glossary/x402/
---

Les bureaux d’enregistrement de domaines disposent depuis longtemps d’interfaces de programmation applicative. L’[Extensible Provisioning Protocol](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol) (EPP), le langage machine-à-machine dont les bureaux d’enregistrement se servent pour communiquer avec les registres, a atteint le statut Proposed Standard en [March 2004](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004) — il y a plus de deux décennies. Depuis lors, chaque [bureau d’enregistrement](/fr/glossary/registrar/) accrédité par l’[ICANN](/fr/glossary/icann/) et construit sur ce protocole a proposé une forme d’API REST ou SOAP pour vérifier la disponibilité, soumettre un enregistrement et mettre à jour des données. La réponse honnête à la question « ce bureau d’enregistrement a-t-il une API ? » est donc, pour presque tous les acteurs du marché : oui, et ce depuis des années.

Cette question s’avère être la mauvaise. Un [Agent IA](/fr/glossary/ai-agent/) qui tente d’enregistrer un domaine en votre nom n’échoue pas parce que le bureau d’enregistrement n’a pas d’API. Il échoue parce que l’API a été conçue pour un développeur qui lit une fois la documentation, écrit à la main le code d’intégration et le déploie — non pour un système qui doit découvrir l’API à l’exécution, décider à partir d’une réponse JSON de ce qui s’est passé, puis finaliser un achat sans qu’une personne surveille une page de paiement. Ce sont des exigences différentes ; satisfaire la seconde série est ce que cet article entend par **conçu pour les agents**.

Cet article définit précisément le terme, présente une checklist pour évaluer n’importe quel bureau d’enregistrement (ou n’importe quelle API) à cette aune, puis applique honnêtement cette checklist aux plateformes livrées en 2026, dont [Namefi](https://namefi.io). Pour une comparaison plateforme par plateforme plutôt que pour la définition, consultez [Cloudflare vs Name.com vs Namefi : les bureaux d’enregistrement conçus pour les agents](/fr/blog/cf-namecom-namefi/) ou le guide plus large des [plateformes de domaines agentiques](/fr/blog/ai-domain-platforms/). Si vous considérez encore « l’IA et les domaines » comme un générateur de noms proposant des chaînes adaptées à une marque, la checklist ci-dessous montre à quel point le niveau requis pour les agents est plus élevé — consultez [Au-delà du générateur de noms de domaine IA : l’ère des agents](/fr/blog/beyond-generators/) pour cette différence en détail.

## Pourquoi « avoir une API » et « être conçu pour les agents » ne désignent pas la même chose

Une API traditionnelle de bureau d’enregistrement suppose qu’un humain intervient au moment de sa conception, non lors de son exécution. Un développeur crée un compte, lit une page de référence écrite pour des humains, copie un exemple de code et intègre en dur dans son application l’endpoint, l’en-tête d’authentification et la structure de réponse attendue. Une fois cela fait, l’intégration s’exécute sans supervision — mais uniquement parce qu’une personne a déjà accompli le travail d’interprétation. Rien dans l’API elle-même n’est intelligible pour un système qui arrive sans contexte, sans intégration préalable, et doit comprendre en situation quelles opérations existent et comment les appeler.

Un agent arrive sans contexte, en permanence. Chaque conversation avec un agent de programmation, chaque nouveau client MCP équivaut à un développeur qui n’a jamais vu votre API et ne dispose que de quelques secondes de budget de contexte pour la comprendre. Si la réponse à « comment un agent apprend-il à utiliser cette API ? » est « un humain a lu la documentation et écrit du code d’adaptation il y a des années », l’API garde une personne coincée en permanence dans son chemin d’exécution, même si aucun humain ne clique au moment de l’achat. Cet article traite de ce qui doit être vrai du bureau d’enregistrement lui-même pour que cet agent à démarrage à froid réussisse — pour la vision de ce même passage du point de vue de l’acheteur, consultez [Comment les agents IA achètent des domaines sans humain (2026)](/fr/blog/agents-buy-domains/).

## La checklist des agents

Un bureau d’enregistrement conçu pour les agents est un bureau avec lequel un Agent IA peut découvrir, comprendre et effectuer une transaction entièrement par lui-même — sans navigateur, sans humain ayant lu la documentation à l’avance, sans personne saisissant un numéro de carte. Cela exige que six conditions précises soient remplies, et non simplement « avoir une API » :

| Exigence | Bureau d’enregistrement avec API | Bureau d’enregistrement conçu pour les agents |
| --- | --- | --- |
| Découvrabilité | Les endpoints existent, mais l’agent doit recevoir hors bande l’URL de base et le schéma d’authentification | Un emplacement standard (`llms.txt`, un serveur [MCP](https://modelcontextprotocol.io)) qu’un agent peut trouver et lire sans assistance |
| Documentation en langage naturel | La documentation de référence est écrite pour un humain qui parcourt une page | La documentation est structurée pour qu’un agent la consomme au moment de l’inférence — opération, champs requis et effet réunis au même endroit |
| Erreurs lisibles par machine | Codes de statut HTTP et texte destiné à une personne lisant un journal | Code d’erreur stable, indicateur `retryable` et détail structuré sur lequel un agent peut effectuer un branchement programmatique |
| Achat sans navigateur | L’enregistrement se termine sur une page de paiement hébergée, parfois derrière un CAPTCHA | L’enregistrement se termine via l’API ou le protocole lui-même, de bout en bout, sans rendu de page requis |
| Paiement programmatique | Le paiement suppose une carte enregistrée liée au compte de facturation d’un humain | Paiement par clé API facturée à un compte, ou transaction signée par un portefeuille — quelque chose qu’un non-humain peut détenir |
| Contrôles de politique | Rien n’empêche un script de faire tout ce que ses identifiants permettent | Limites de dépenses, étapes de confirmation ou clés à portée limitée qu’un humain configure une fois, afin que l’agent opère dans une limite |

Voici la version synthétique de la définition : **un bureau d’enregistrement conçu pour les agents obtient « oui » sur la découvrabilité, la documentation en langage naturel, les erreurs lisibles par machine, l’achat sans navigateur et le paiement programmatique — les contrôles de politique étant l’élément que toute la catégorie cherche encore à résoudre.**

## Découvrabilité : llms.txt et MCP sont le plan de site des agents

Un développeur humain trouve une API en effectuant une recherche ou en parcourant un site de documentation. Un agent a besoin soit d’un fichier qu’il peut récupérer et lire d’un seul coup, soit d’une connexion de protocole qu’il peut interroger pour connaître les opérations disponibles. Deux éléments remplissent aujourd’hui ce rôle.

[llms.txt](https://llmstxt.org) est, selon les propres termes de la proposition, [« une proposition visant à normaliser l’utilisation d’un fichier `/llms.txt` pour fournir des informations aidant les LLM à utiliser un site web au moment de l’inférence »](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time). C’est la même idée que `robots.txt`, mais au lieu d’indiquer à un crawler ce qu’il peut indexer, le fichier indique à un modèle de langage ce qu’est un site et comment l’utiliser. Consultez [llms.txt pour les domaines : une API que tout Agent IA peut lire](/fr/blog/llms-txt/) pour voir à quoi ressemble ce fichier lorsqu’un bureau d’enregistrement le publie.

[MCP (Model Context Protocol)](https://modelcontextprotocol.io) résout un problème adjacent : c’est [« un standard open source pour connecter des applications IA à des systèmes externes »](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems). Là où llms.txt est un document qu’un agent lit une fois pour s’orienter, MCP est une connexion active que le client de l’agent ouvre vers un serveur exposant un ensemble défini d’outils appelables. Ils sont complémentaires, non concurrents : llms.txt permet à l’agent de découvrir qu’un bureau d’enregistrement existe et de comprendre approximativement ce qu’il peut faire ; MCP permet au client de l’agent de se connecter et d’appeler réellement les opérations.

Namefi publie les deux. Le point d’entrée [namefi.io/llms.txt](https://namefi.io/llms.txt) documente un serveur MCP à `api.namefi.io/mcp`, un fichier de découverte MCP à `namefi.io/.well-known/mcp/servers.json` et une référence REST complète, avec des fichiers compagnons pour le paiement par portefeuille et les workflows d’agents sortants. Vérification directe de deux acteurs historiques : la documentation de registrar de Cloudflare publie son propre `llms.txt` à `developers.cloudflare.com/registrar/llms.txt`, mais rien dans sa documentation publique n’affirme que Cloudflare exploite un serveur MCP dédié pour le produit de bureau d’enregistrement. Selon les reportages, l’argument de vente de la beta est plus restreint : [l’API est « conçue pour fonctionner dans les outils où les développeurs travaillent déjà : des éditeurs de code prenant en charge MCP tels que Cursor et Claude Code »](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=The%20API%20is%20designed%20to%20work%20inside%20the%20tools%20where%20developers%20already%20operate%2C%20code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code) ; l’éditeur est compatible MCP, pas nécessairement le registrar de Cloudflare lui-même. Le portail développeur de GoDaddy, vérifié directement, documente des endpoints REST pour un développeur humain et ne présente aucune référence à `llms.txt` ni à un serveur MCP à ce jour.

## Paiement : pourquoi la carte enregistrée ne convient pas aux agents, et ce qui la remplace

L’étape d’achat est celle où l’hypothèse d’un humain dans la boucle est la plus difficile à supprimer, car la pile de paiement du web grand public est construite autour d’une personne : une carte enregistrée, une adresse de facturation, parfois un CAPTCHA conçu pour filtrer tout ce qui n’en est pas une. Un agent ne peut pas remplir un formulaire de carte, et lui remettre le numéro brut de carte d’un humain afin qu’il se fasse passer pour lui constitue un mauvais modèle de sécurité, même lorsque c’est techniquement possible.

Deux remplacements sont disponibles. Le premier est la facturation par clé API : le bureau d’enregistrement émet un identifiant lié à un compte préfinancé ou facturé, et l’agent authentifie chaque appel avec cette clé plutôt qu’avec une carte. La documentation de Namefi décrit la génération de cette clé à [namefi.io/api-key](https://namefi.io/api-key) et son passage dans un en-tête `x-api-key` à chaque requête — sans session navigateur, sans formulaire de carte. La tarification `.ai` de Cloudflare suit la même logique de prix coûtant : [elle propose « des enregistrements et renouvellements de domaines .ai à des prix de gros, sans aucune majoration supplémentaire »](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups). Un prix fixe et prévisible est plus facile à raisonner pour un agent qu’un prix variant selon les promotions.

Le second remplacement est le paiement signé par portefeuille, qui élimine le compte lui-même, pas seulement la carte. La documentation `web3` de Namefi décrit un flux fondé sur le code d’état HTTP 402 et le schéma [x402](/fr/glossary/x402/) : une demande de domaine sans paiement renvoie un prix dans une réponse 402, le portefeuille de l’appelant signe une autorisation EIP-3009 et l’autorisation signée est renvoyée comme en-tête afin de finaliser l’enregistrement et le règlement en une étape — explicitement [« aucun compte Namefi ni signature EIP-712 requis »](https://namefi.io/web3/llms.txt). L’idée est plus limitée : il s’agit d’un moyen de paiement qu’un logiciel peut détenir et utiliser seul, ce qu’une carte de crédit enregistrée ne peut structurellement pas faire. Consultez [Payer des domaines avec un portefeuille crypto : aucun compte nécessaire](/fr/blog/wallet-checkout/) pour parcourir ce flux de bout en bout.

## Contrôles de politique : la ligne que toute la catégorie n’a pas encore résolue

Voici la lacune honnête. La découvrabilité, la documentation lisible par machine, les erreurs structurées et le paiement programmatique sont des éléments qu’un bureau d’enregistrement peut construire une fois puis livrer. Les contrôles de politique — plafonds de dépenses, étape de confirmation au-delà d’un seuil, clé limitée à un TLD ou à un budget — sont différents, car ils protègent l’humain qui a délégué l’autorité, non la facilité d’utilisation de l’API.

Vérification de la documentation de Namefi, le cas le plus vérifiable : elle signale certaines opérations comme conséquentes et documente des erreurs structurées et lisibles par machine (codes stables, indicateur `retryable`, détail structuré) — de vrais progrès sur cette ligne. Mais nous n’avons trouvé ni primitive documentée de plafond de dépenses ni barrière de confirmation côté serveur dans la référence d’API publique à ce jour ; cette protection se situe actuellement une couche plus haut, dans la politique que l’humain définit sur le client MCP lui-même. Nous n’avons pas non plus trouvé de documentation publique sur une primitive de plafond de dépenses dans les API de registrar de Cloudflare ou de Name.com — c’est la ligne que chaque bureau d’enregistrement conçu pour les agents devrait ensuite être tenu de compléter.

## Évaluation des plateformes actuelles au regard de la checklist

Voici comment les trois plateformes les plus souvent citées dans cet espace se situent par rapport à la checklist en six points, selon ce que nous avons vérifié directement dans la documentation live de chacune plutôt que dans le discours marketing :

| Bureau d’enregistrement | Découvrabilité | Documentation en langage naturel | Erreurs lisibles par machine | Achat sans navigateur | Paiement programmatique | Contrôles de politique |
| --- | --- | --- | --- | --- | --- | --- |
| Namefi | Oui — llms.txt + serveur MCP | Oui — famille llms.txt | Oui — codes structurés | Oui — REST + MCP | Oui — clé API ou portefeuille (x402) | Pas encore documentés |
| Cloudflare Registrar | Partielle — son propre llms.txt ; MCP au niveau de l’éditeur, pas un serveur dédié confirmé | Incertaine — non vérifiée au-delà de l’index llms.txt | Incertaines — non vérifiées dans la documentation publique | Oui — piloté par API selon les reportages de la beta | Oui — clé API, prix coûtant | Pas encore documentés |
| Name.com | Incertaine — aucun llms.txt trouvé à la racine du domaine vérifiée | Revendiquée dans la propre annonce de Name.com, sans vérification indépendante supplémentaire | Non trouvées dans la documentation historique vérifiée ; incertaines pour la nouvelle API | Non vérifié indépendamment | Partiel — seule la facturation par crédit de compte est documentée | Pas encore documentés |

La ligne qui reste vide partout — les contrôles de politique — est une véritable lacune à l’échelle du secteur, non un reproche à une plateforme en particulier. Elle mérite d’être vérifiée à nouveau à mesure que cet espace évolue.

## Questions fréquentes

### Qu’est-ce qu’un bureau d’enregistrement de domaines conçu pour les agents ?

Un bureau d’enregistrement conçu pour les agents est un bureau qu’un Agent IA peut découvrir, comprendre et utiliser pour effectuer une transaction par lui-même — sans navigateur, sans humain ayant lu la documentation au préalable, sans personne saisissant un numéro de carte. Il obtient « oui » pour la découvrabilité (un fichier `llms.txt` ou un serveur MCP), la documentation en langage naturel, les erreurs lisibles par machine, l’achat sans navigateur et le paiement programmatique, les contrôles de politique (plafonds de dépenses, barrières de confirmation) restant l’élément que la catégorie est encore en train de construire.

### Pourquoi les agents IA ne peuvent-ils pas utiliser les API normales des bureaux d’enregistrement ?

Ils peuvent techniquement appeler les endpoints, mais la plupart des API de bureaux d’enregistrement supposent qu’un développeur humain a déjà lu la documentation et écrit le code d’intégration à l’avance. Un agent sans intégration préalable n’a aucun moyen standard de découvrir l’URL de base, d’apprendre le schéma d’authentification ou d’interpréter un message d’erreur en prose — l’API ne fonctionne que parce qu’une personne a déjà fait ce travail d’interprétation, non parce qu’elle est intelligible pour un agent à démarrage à froid.

### Quelle est la différence entre llms.txt et MCP ?

`llms.txt` est un fichier texte brut qu’un agent lit une fois pour apprendre ce qu’est un site ou une API et comment l’utiliser — le même rôle que joue `robots.txt` pour les crawlers, mais écrit pour les modèles de langage. [MCP](https://modelcontextprotocol.io) est une connexion de protocole active que le client de l’agent ouvre vers un serveur exposant des outils appelables. Ils sont complémentaires : llms.txt sert à la découverte, MCP est la connexion qu’un agent utilise pour agir. Consultez [llms.txt pour les domaines : une API que tout Agent IA peut lire](/fr/blog/llms-txt/) pour en savoir plus sur la partie découverte.

### Comment rendre ma propre API utilisable par un agent ?

Publiez un `llms.txt` décrivant votre API pour les modèles, exposez un serveur MCP (ou au minimum des endpoints documentés via OpenAPI), retournez des erreurs structurées avec des codes stables au lieu de prose, assurez-vous que chaque opération d’écriture peut se terminer sans page de paiement hébergée, prenez en charge un moyen de paiement qui ne suppose pas une carte humaine, et ajoutez des limites de dépenses ou de confirmation afin que la personne détenant les identifiants puisse borner ce qu’un agent est autorisé à faire.

### Namefi est-il conçu pour les agents ?

Selon la checklist ci-dessus, Namefi obtient « oui » sur cinq des six lignes vérifiées directement : il publie une famille `llms.txt` et un serveur MCP, sa documentation est structurée pour la consommation par des agents, son API sortante retourne des erreurs structurées et lisibles par machine, l’enregistrement se termine entièrement via l’API ou le flux de portefeuille basé sur x402 sans tableau de bord requis, et le paiement fonctionne par clé API ou transaction signée par portefeuille sans compte nécessaire. Les contrôles de politique ne sont pas encore documentés dans la référence d’API publique ; ce contrôle se situe actuellement côté client. <!-- TODO: confirm with team — whether a spend-cap or purchase-confirmation feature is on the near-term roadmap -->

### Le fait d’avoir un serveur MCP rend-il automatiquement un bureau d’enregistrement conçu pour les agents ?

Non. La prise en charge de MCP couvre la découvrabilité et l’achat sans navigateur, mais un bureau d’enregistrement peut exposer un serveur MCP tout en renvoyant des erreurs non structurées, tout en exigeant une carte enregistrée ou tout en n’ayant aucun mécanisme de plafond de dépenses. Être conçu pour les agents signifie satisfaire à l’ensemble de la checklist, pas à une seule ligne.

## Sources et lectures complémentaires

- Wikipedia — [Extensible Provisioning Protocol (EPP standardisé comme Proposed Standard, March 2004)](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- CircleID — [L’univers des domaines en 2026 : IA, sécurité, maturité du marché et nouvelle frontière des gTLD (« les agents IA agissent de plus en plus comme des revendeurs de domaines... »)](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)
- webhosting.today — [Les agents IA peuvent désormais enregistrer des domaines, aucun humain requis (beta de la Cloudflare Registrar API, April 2026)](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=The%20API%20is%20designed%20to%20work%20inside%20the%20tools%20where%20developers%20already%20operate%2C%20code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code)
- Name.com — [La première plateforme de domaines native pour l’IA (« prise en charge par des standards modernes comme le Model Context Protocol... »)](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=Our%20platform%20is%20supported%20by%20modern%20standards%20like%20Model%20Context%20Protocol)
- llmstxt.org — [La proposition de fichier /llms.txt](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)
- modelcontextprotocol.io — [Qu’est-ce que le Model Context Protocol (MCP) ?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Schema.org — [FAQPage](https://schema.org/FAQPage)
- Cloudflare — [Acheter des domaines .ai au prix coûtant](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)
- Cloudflare Developers — [Index de la documentation Registrar (llms.txt)](https://developers.cloudflare.com/registrar/llms.txt)
- Namefi — [namefi.io/llms.txt (référence de l’API et du serveur MCP — source de vérité pour les affirmations produit de Namefi dans cet article)](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt (flux de paiement x402 / signé par portefeuille, « aucun compte Namefi ni signature EIP-712 requis »)](https://namefi.io/web3/llms.txt)
