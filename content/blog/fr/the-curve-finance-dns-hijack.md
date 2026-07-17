---
title: "Le détournement DNS de Curve Finance : quand les « contrats audités » n'ont pas protégé la porte d'entrée"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['alan-machin']
draft: false
description: "En août 2022, les smart contracts de Curve Finance étaient intacts — mais des attaquants ont détourné le domaine curve.fi au niveau du registrar, cloné le site et siphonné environ 570 000 $ aux utilisateurs. Une analyse approfondie de l'attaque DNS sur une interface DeFi, et ce qu'elle nous enseigne sur la sécurité des noms de domaine."
keywords: ['détournement dns curve finance', 'hijack curve.fi', 'dns hijacking defi', 'compromission iwantmyname', 'compromission nameserver', 'wallet drainer', 'attaque front-end defi', 'sécurité des domaines', 'sécurité dns', 'phishing crypto', 'attaque site cloné', 'compromission compte registrar', 'domain mayday']
relatedArticles:
  - /fr/blog/the-badgerdao-frontend-attack/
  - /fr/blog/the-2024-squarespace-defi-domain-hijacks/
  - /fr/blog/the-bitcoin-org-dns-hijack/
  - /fr/blog/the-myetherwallet-bgp-dns-attack/
  - /fr/blog/the-lenovo-com-dns-hijack/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/name-change-game-change/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/dns/
  - /fr/glossary/icann/
  - /fr/glossary/web3/
  - /fr/glossary/tld/
---

Les smart contracts étaient intacts.

C'est la première chose à comprendre sur ce qui est arrivé à Curve Finance le 9 août 2022, et c'est ce qui continue de déconcerter les ingénieurs en sécurité des années plus tard. Le code [on-chain](/fr/glossary/on-chain/) de Curve — l'automated market maker audité et éprouvé qui détenait des milliards en stablecoins — n'a jamais été touché. Aucun bug de réentrance. Aucune manipulation d'oracle. Aucun exploit de flash loan. La [blockchain](/fr/glossary/blockchain/) a fait exactement ce qu'elle était censée faire.

Et les utilisateurs ont tout de même perdu environ **570 000 $**.

L'attaque ne s'est pas produite via les contrats. Elle s'est produite via le **domaine**. Quelqu'un a pris le contrôle de `curve.fi` au niveau du registrar, l'a dirigé vers un site cloné connecté à un wallet-drainer, et a laissé la réputation du protocole faire le reste. Chaque audit de sécurité que Curve avait jamais passé était sans pertinence, car l'attaquant n'a jamais frappé à cette porte. Il est entré par la façade — l'adresse web que les utilisateurs tapaient sans réfléchir.

Voici l'épisode 13 de *Domain Mayday*. C'est l'histoire de la façon dont la partie la plus sécurisée d'un système peut être parfaitement sûre tandis que la partie en laquelle tout le monde *fait confiance sans vérifier* — le nom de domaine — devient silencieusement la surface d'attaque.

## Les « contrats audités » ne protègent pas la porte d'entrée

La [DeFi](/fr/glossary/defi/) a passé des années à construire une culture de sécurité des contrats. Les audits sont devenus la norme minimale. Les bug bounties ont atteint des millions. « Vérifié sur Etherscan » est devenu un signal de confiance. Le modèle mental collectif s'est cristallisé en quelque chose comme : *si les contrats sont sécurisés, le protocole est sécurisé.*

Mais un utilisateur n'interagit presque jamais directement avec un contrat. Il se rend sur un site web. Il tape `curve.fi`, son navigateur résout ce nom en [adresse IP](/fr/glossary/ip-address/), charge une page, et cette page indique à son portefeuille quoi signer. Chacune de ces étapes se produit *avant* qu'une seule ligne de Solidity audité ne s'exécute — et chacune d'elles réside dans une infrastructure que l'audit n'a jamais couverte.

Le nom de domaine est le tout premier maillon de cette chaîne. C'est aussi le maillon que la plupart des équipes traitent comme une chose définie une fois pour toutes : enregistrer, configurer le DNS, et ne plus y penser. Comme l'a expliqué un analyste après l'incident, ce type d'attaque [« exploite la couche de confiance »](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) entre l'utilisateur et l'interface d'une application décentralisée, plutôt que de compromettre la blockchain du protocole. Les contrats peuvent être irréprochables. Si un attaquant contrôle vers où pointe `curve.fi`, rien de tout cela n'a d'importance.

## 9 août 2022 : le détournement

![Art conceptuel coloré d'une devanture dont l'enseigne d'adresse est remplacée pour rediriger les clients vers une boutique factice identique avec un plancher à trappe cachée, tons chauds et froids, métaphore surréaliste de sécurité, sans logos de marque](../../assets/the-curve-finance-dns-hijack-01-hijack.jpg)

Dans l'après-midi du 9 août 2022, la principale interface de Curve a cessé d'être celle de Curve.

L'analyse post-incident de CertiK a précisé la chronologie : [« À environ 16h20 EST le 09 août 2022, l'enregistrement DNS de Curve Finance a été compromis et redirigé vers un site malveillant cloné. »](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Pour quiconque visitait `curve.fi`, rien ne semblait anormal. La page s'affichait. Le logo était là. Les pools, l'interface, les couleurs — tout était fidèlement reproduit.

La différence était invisible et totale : le site chargé dans le navigateur de l'utilisateur n'était plus servi par Curve. C'était un clone, hébergé sur l'infrastructure de l'attaquant, attendant que quelqu'un connecte un portefeuille.

Le chercheur en sécurité Lefteris Karapetsas a décrit les mécanismes sans détour — les attaquants avaient [« cloné le site, fait pointer le DNS vers leur IP où le site cloné est déployé, et ajouté des demandes d'autorisation vers un contrat malveillant. »](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) L'explication ultérieure de Cointelegraph a décrit le même schéma : [« Les attaquants avaient cloné le site web de Curve Finance et interféré avec ses paramètres DNS pour envoyer les utilisateurs vers une version dupliquée du site. »](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Puis ils ont attendu.

## Ce que les utilisateurs ont perdu

Lorsqu'un utilisateur atterrissait sur le clone et tentait de l'utiliser, la page demandait à son portefeuille de faire quelque chose qu'il fait des milliers de fois par jour sur des sites DeFi légitimes : approuver un token. Selon CertiK, [« l'attaquant a injecté du code malveillant dans ce site qui demandait aux utilisateurs d'accorder des autorisations de token à un contrat non vérifié. »](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Coingape a décrit le piège en termes plus simples : [« Les pirates ont réussi à déployer un contrat malveillant sur la page d'accueil, qui, une fois approuvé par la victime, vidait complètement les portefeuilles des utilisateurs. »](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)

Approuver une autorisation de token semble anodin. C'est le même clic que les utilisateurs font pour effectuer un swap sur un exchange légitime. Mais ici, le contrat approuvé appartenait à l'attaquant — et une fois approuvé, il pouvait déplacer les stablecoins de la victime.

La comptabilité on-chain était précise. CertiK a rapporté que [« au total, 7 utilisateurs ont été affectés par l'exploit, entraînant environ 612 000 $ de pertes »](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis), avec le montant décomposé en [« 612 724,16 $ en USDC et DAI »](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) que le pirate a ensuite échangés contre de l'ETH. rekt.news a retenu un chiffre plus rond et largement cité : [« Les fonds volés (340 ETH, soit environ 575 000 $, au total). »](https://rekt.news/curve-finance-rekt) La plupart des reportages contemporains se situaient dans la même fourchette — Cryptopotato a rapporté que [les pirates avaient volé environ 570 000 $ d'ETH](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) ; CryptoDaily a noté que [le pirate avait volé plus de 573 000 $](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack). Le total exact varie légèrement selon le moment où le relevé a été pris et le prix de l'ETH à ce moment-là. La forme est claire : entre quelques centaines de milliers et un peu plus, pris à une poignée d'utilisateurs, par un site qui ressemblait exactement à celui en lequel ils avaient confiance.

Et voici le point sur lequel il faut s'arrêter. Tronweekly l'a résumé clairement : cette attaque [« n'a pas touché les smart contracts Ethereum de Curve ni aucun des 5,7 milliards de dollars d'actifs qui y étaient stockés. »](https://www.tronweekly.com/curve-finance-dns-hijacking/) Cinq virgule sept milliards de dollars d'actifs du protocole, parfaitement en sécurité. Curve elle-même, comme le note le même article, [« n'est pas touchée et n'a subi aucune perte. »](https://www.tronweekly.com/curve-finance-dns-hijacking/) Le protocole a gagné. Les utilisateurs ont perdu. Parce que l'attaque n'était jamais dirigée contre le protocole.

## Comment c'est arrivé : le domaine, pas la chaîne

![Art conceptuel coloré et vivide d'un standardiste téléphonique reroutant secrètement un câble d'appel lumineux vers un bâtiment identique contrefait, câbles et circuits néon, métaphore surréaliste du reroutage DNS, sans logos de marque](../../assets/the-curve-finance-dns-hijack-02-dns-compromise.jpg)

Comment un attaquant fait-il en sorte que `curve.fi` se résolve vers *son* serveur plutôt que vers celui de Curve ?

Commençons par ce que fait le [DNS](/fr/glossary/dns/). Un nom de domaine comme `curve.fi` est une étiquette compréhensible par l'humain. Les ordinateurs ont besoin d'une adresse IP. Le Domain Name System est la couche de correspondance qui traduit l'un en l'autre — l'explication de Cointelegraph le compare à [« un annuaire téléphonique »](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) qui [« convertit ces noms de domaine conviviaux en adresses IP requises par les ordinateurs pour se connecter. »](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) Le détournement DNS consiste à falsifier cette correspondance afin que l'annuaire donne le mauvais numéro — [« en altérant la résolution des requêtes DNS, redirigeant les utilisateurs vers des sites malveillants à leur insu. »](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Fait crucial, on n'a pas besoin de compromettre l'ordinateur de l'utilisateur pour y parvenir. On modifie la réponse autoritaire à sa source — le **nameserver** vers lequel le domaine délègue. Et cette source se trouve chez le registrar du domaine.

Le fondateur de Curve, Michael Egorov, a été direct sur l'emplacement de la défaillance. Cité par rekt.news, [« le registrar dns iwantmyname a eu ses ns compromis »](https://rekt.news/curve-finance-rekt), et l'équipe a estimé que [« Curve pense que le nameserver sous-jacent a été compromis, plutôt qu'une vulnérabilité au niveau du compte. »](https://rekt.news/curve-finance-rekt) En d'autres termes : ce n'était pas (autant que Curve pouvait en juger) un mot de passe volé sur le propre compte registrar de Curve. C'était un problème une couche plus profond — au niveau de l'infrastructure nameserver qu'exploitait le registrar lui-même. L'explication ultérieure de Cointelegraph a confirmé le registrar par son nom, notant que le projet [« utilisait le même registrar, 'iwantmyname', au moment de l'attaque précédente. »](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Cette distinction est extrêmement importante pour la leçon à en tirer. Une équipe peut imposer un mot de passe fort, activer l'authentification à deux facteurs et sécuriser parfaitement sa propre connexion au registrar — et *quand même* perdre son domaine si le nameserver sous-jacent est compromis. Le propriétaire du domaine n'a pas nécessairement commis d'erreur. La confiance qu'il accordait à la couche inférieure a simplement été trahie. La formulation de Cointelegraph sur le fonctionnement de ces attaques généralise le risque : [« Si la correspondance d'un site change à cause d'identifiants volés ou d'une vulnérabilité du registrar, les utilisateurs peuvent être redirigés vers des serveurs malveillants sans s'en rendre compte. »](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Une fois que le nameserver a répondu avec l'IP de l'attaquant, le reste était automatique. Chaque utilisateur tapant `curve.fi` se voyait silencieusement diriger vers le clone. L'annuaire avait été falsifié, et presque personne ne vérifie l'annuaire.

## Réponse et conséquences

L'équipe de Curve a réagi rapidement, et cette réaction est instructive précisément en raison de ce qu'elle pouvait et ne pouvait pas faire.

Ce qu'elle pouvait faire *immédiatement*, c'était alerter. L'équipe a dit clairement aux utilisateurs : [« Veuillez ne pas effectuer d'approbations ou de swaps. Nous essayons de localiser le problème, mais pour l'instant, pour votre sécurité, n'utilisez pas curve.fi ou curve.exchange. »](https://www.tronweekly.com/curve-finance-dns-hijacking/) Elle a orienté les utilisateurs vers la solution de repli encore saine — [« Veuillez utiliser https://curve.exchange pour l'instant jusqu'à ce que la propagation pour https://curve.fi revienne à la normale »](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/) — car `curve.exchange` reposait sur une infrastructure différente et n'avait pas été empoisonnée.

Ce qu'elle ne pouvait *pas* faire instantanément, c'était effacer le mal déjà fait. Ils ont changé le nameserver, mais le DNS ne se met pas à jour partout en même temps. Comme le note rekt.news, [« Le site miroir du pirate a été retiré rapidement, mais certains nameservers n'avaient pas encore été mis à jour. »](https://rekt.news/curve-finance-rekt) Pendant un certain temps, même après la correction, des caches du monde entier continuaient à servir l'ancienne réponse malveillante. Ce délai de propagation est une propriété inhérente du DNS — et un avantage structurel pour l'attaquant.

Pour les utilisateurs qui avaient déjà approuvé le contrat malveillant, la seule défense était la révocation. Le message a été répété partout : [« Si vous avez approuvé des contrats sur Curve au cours des dernières heures, veuillez révoquer immédiatement. »](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) rekt.news a publié l'adresse spécifique du drainer que les utilisateurs devaient révoquer — `0x9eb5f8e83359bb5013f3d8eee60bdce5654e8881` — afin que les victimes puissent couper l'autorisation avant que davantage ne soit prélevé.

Les fonds volés se sont dispersés via les canaux de blanchiment habituels. CertiK a retracé le flux — [« FixedFloat : 292 ETH, Tornado Cash : 27,7 ETH, Binance : 20 ETH »](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) — et a noté un rebondissement temporel : avec Tornado Cash fraîchement sanctionné par l'OFAC quelques jours plus tôt, [« la récente sanction de Tornado Cash par l'OFAC a probablement suffisamment préoccupé le pirate pour qu'il envoie la majorité des fonds volés vers FixedFloat, »](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) un exchange centralisé. Ce choix a aidé : rekt.news a rapporté que parmi les fonds envoyés à FixedFloat, [112 ETH ont été gelés](https://rekt.news/curve-finance-rekt). En quelques heures, Curve a confirmé que [« le problème a été trouvé et résolu. »](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)

## Ce que cela enseigne sur le DNS pour les interfaces DeFi

L'incident Curve est une leçon condensée sur l'emplacement réel de la surface d'attaque de la DeFi. Quelques enseignements généralisables bien au-delà de Curve :

1. **Votre domaine fait partie de votre périmètre de sécurité.** Il est tentant de traiter le domaine comme une infrastructure marketing — une étiquette, pas un système. Mais le domaine est la première instruction que suit le navigateur de l'utilisateur. S'il est erroné, tout ce qui suit est erroné. Les audits qui s'arrêtent à la frontière du contrat laissent le maillon le plus fiable sans couverture.

2. **La sécurité du registrar et du nameserver est en amont de vous.** L'hygiène du propre compte de Curve était peut-être irréprochable ; la compromission était supposément au niveau de la couche nameserver. Vous héritez de la posture de sécurité de chaque fournisseur dans votre chaîne DNS. Choisissez des registrars et des hébergeurs DNS qui prennent en charge les verrous de registrar, des protections de compte robustes, et idéalement [DNSSEC](/fr/glossary/dnssec/) — et comprenez que même dans ce cas, vous faites confiance à une couche que vous ne contrôlez pas entièrement.

3. **Les utilisateurs ne voient pas le DNS.** Le clone était identique parce que le *nom* était identique. Le cadenas était vert ; l'URL était correcte. Rien de ce qu'un utilisateur prudent vérifie normalement n'aurait signalé le problème. C'est ce qui rend le détournement DNS si efficace même contre des publics avertis — la tromperie se produit sous la couche que les humains inspectent.

4. **Ayez une solution de repli propre.** L'atout salutaire de Curve était `curve.exchange` sur une infrastructure séparée. Une deuxième voie d'accès — un domaine différent, un fournisseur DNS différent, un miroir [IPFS](/fr/glossary/ipfs/) ou [ENS](/fr/glossary/ens/) — vous donne un endroit vers lequel rediriger les utilisateurs quand votre nom principal est empoisonné.

5. **Les autorisations de token sont la charge utile.** Chaque attaque de front-end de cette famille se termine de la même façon : une autorisation d'apparence anodine vers un contrat hostile. Les portefeuilles, les interfaces et les utilisateurs doivent tous traiter les invites d'autorisation sur une page fraîchement chargée comme l'action à haut risque qu'elles sont.

## La perspective Namefi

![Illustration colorée d'une propriété de domaine vérifiable et inviolable — une carte de domaine sécurisée par un bouclier vert, un token Namefi vert, et une continuité DNS](../../assets/the-curve-finance-dns-hijack-03-namefi-angle.jpg)

Le détournement de Curve est, à sa racine, une question de **qui contrôle le nom** — et comment ce contrôle peut être vérifié, détenu et récupéré de manière fiable.

Dans le modèle traditionnel, le contrôle d'un domaine est un ensemble fragile : un compte de registrar, un ensemble d'enregistrements nameserver, et une chaîne de fournisseurs à qui il faut faire confiance en silence. Lorsqu'un maillon quelconque de cette chaîne est compromis — comme le nameserver d'iwantmyname était supposément l'être — le propriétaire légitime peut perdre le contrôle effectif de son propre nom sans jamais avoir commis d'erreur, et sans trace évidente et inviolable de *ce qui a changé et quand*.

[Namefi](https://namefi.io) est construit autour de l'idée que les domaines devraient se comporter comme des actifs natifs d'internet — que la propriété et le contrôle peuvent être rendus vérifiables, auditables et inviolables tout en restant compatibles avec le DNS. La leçon profonde de Curve n'est pas « la DeFi est dangereuse ». C'est que **la couche des domaines est une infrastructure de sécurité portante**, et qu'elle a été traitée pendant des années comme une décoration. Que vous gériez un protocole DeFi, une boutique en ligne ou un blog, le nom que tapent vos utilisateurs est une promesse — et l'intégrité de cette promesse n'est aussi solide que la surface de contrôle qui la sous-tend.

Les contrats de Curve ont protégé cinq virgule sept milliards de dollars sans une égratignure. Le domaine a cédé un demi-million en un après-midi. Cet écart résume tout.

## Sources et lectures complémentaires

- CertiK — [Curve Finance Hack Incident Analysis](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)
- rekt.news — [Curve Finance — REKT](https://rekt.news/curve-finance-rekt)
- Cointelegraph (via TradingView) — [What is DNS hijacking? How it took down Curve Finance's website](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)
- Cryptopotato — [Curve Finance Issues Warning About Compromised Front End Amid $570K Theft](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)
- Coingape — [Curve Finance DNS Hijacked, Attackers Stole $570K from User Wallets](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)
- Tronweekly — [Curve Finance's Hackers Loot $570K Via DNS Hijacking](https://www.tronweekly.com/curve-finance-dns-hijacking/)
- CryptoDaily — [Curve Finance Asks Users To Revoke Recent Contracts After DNS Hack](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)
