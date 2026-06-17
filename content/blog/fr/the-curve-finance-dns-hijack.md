---
title: 'Le piratage DNS de Curve Finance : quand les "contrats audités" n''ont pas pu sauver la porte d''entrée'
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'En août 2022, les contrats intelligents de Curve Finance sont restés intacts, mais des attaquants ont détourné le domaine curve.fi au niveau de son bureau d''enregistrement, cloné le site et siphonné environ 570 000 $ aux utilisateurs. Plongée au cœur d''une attaque DNS sur une interface DeFi et des leçons à en tirer sur la sécurité des domaines.'
keywords: ['piratage dns curve finance', 'détournement curve.fi', 'piratage dns defi', 'compromission iwantmyname', 'compromission serveur de noms', 'siphonneur de portefeuille', 'attaque front-end defi', 'sécurité de domaine', 'sécurité dns', 'hameçonnage crypto', 'attaque site web cloné', 'compromission compte registrar', 'domain mayday']
---

Les contrats intelligents étaient intacts.

C'est la première chose à comprendre concernant ce qui est arrivé à Curve Finance le 9 août 2022, et c'est ce qui continue de troubler les ingénieurs en sécurité des années plus tard. Le code on-chain de Curve — le teneur de marché automatisé audité, éprouvé et détenant des milliards en stablecoins — n'a jamais été touché. Aucun bug de réentrance. Aucune manipulation d'oracle. Aucune faille de prêt éclair (*flash-loan*). La blockchain a fait exactement ce qu'elle était censée faire.

Et pourtant, les utilisateurs ont perdu environ **570 000 $**.

L'attaque n'est pas venue des contrats. Elle est venue du **domaine**. Quelqu'un a pris le contrôle de `curve.fi` au niveau du bureau d'enregistrement (*registrar*), l'a fait pointer vers un site web cloné relié à un siphonneur de portefeuille (*wallet-drainer*), et a laissé la propre réputation du protocole faire le reste. Tous les audits de sécurité que Curve avait passés n'avaient plus aucune importance, car l'attaquant n'a jamais frappé à cette porte. Ils sont entrés par la porte d'entrée — l'adresse web que les utilisateurs tapaient sans y penser.

Voici l'épisode 13 de *Domain Mayday*. C'est l'histoire de la façon dont la partie la plus sécurisée d'un système peut être parfaitement à l'abri, tandis que celle à laquelle tout le monde *fait confiance sans vérifier* — le nom de domaine — devient discrètement la surface d'attaque.

## Les "contrats audités" ne protègent pas la porte d'entrée

La DeFi a passé des années à bâtir une culture de la sécurité des contrats. Les audits sont devenus la norme indispensable. Les primes aux bugs (*bug bounties*) ont atteint des millions. « Vérifié sur Etherscan » est devenu un signal de confiance. Le modèle mental collectif s'est figé autour de l'idée suivante : *si les contrats sont sûrs, le protocole est sûr.*

Mais un utilisateur n'interagit presque jamais directement avec un contrat. Il se rend sur un site web. Il tape `curve.fi`, son navigateur résout ce nom en une adresse IP, charge une page, et cette page indique à son portefeuille ce qu'il doit signer. Chacune de ces étapes se produit *avant* même qu'une seule ligne de code Solidity audité ne s'exécute — et chacune d'entre elles réside dans une infrastructure que l'audit n'a jamais couverte.

Le nom de domaine est le tout premier maillon de cette chaîne. C'est aussi le maillon que la plupart des équipes traitent comme un élément à configurer et à oublier : l'enregistrer une fois, faire pointer le DNS, et ne plus jamais y penser. Comme l'a expliqué un article après l'incident, ce type d'attaque ["exploits the trust layer" between the user and a decentralized app's interface](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) (exploite la couche de confiance entre l'utilisateur et l'interface d'une application décentralisée) plutôt que de s'en prendre à la blockchain du protocole. Les contrats ont beau être sans faille, si un attaquant contrôle vers où *pointe* `curve.fi`, tout cela n'a plus d'importance.

## Le 9 août 2022 : le détournement

![Vivid colorful concept art of a storefront whose address sign is being swapped to redirect shoppers into an identical fake shop with a hidden trapdoor floor, warm and cool tones, surreal security metaphor, no brand logos](../../assets/the-curve-finance-dns-hijack-01-hijack.jpg)

L'après-midi du 9 août 2022, l'interface principale (*front-end*) de Curve a cessé d'appartenir à Curve.

L'analyse post-incident de CertiK a établi la chronologie avec précision : ["At approximately 4:20 PM EST Aug. 09 2022, Curve Finance's DNS record was compromised and pointed to a cloned malicious site."](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) (À environ 16 h 20 EST le 9 août 2022, l'enregistrement DNS de Curve Finance a été compromis et a pointé vers un site malveillant cloné.) Pour quiconque visitait `curve.fi`, rien ne semblait anormal. La page s'affichait. Le logo était là. Les pools, l'interface, les couleurs — tout était fidèlement reproduit.

La différence était invisible mais totale : le site chargé dans le navigateur de l'utilisateur n'était plus hébergé par Curve. C'était un clone, placé sur l'infrastructure de l'attaquant, attendant que quelqu'un y connecte son portefeuille.

Le chercheur en sécurité Lefteris Karapetsas a décrit le mécanisme sans détour — les attaquants avaient ["cloned the site, made the DNS point to their IP where the cloned site is deployed, and added approval requests to a malicious contract."](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) (cloné le site, fait pointer le DNS vers leur IP où le site cloné est déployé, et ajouté des demandes d'approbation à un contrat malveillant). Un article explicatif de Cointelegraph a par la suite décrit le même mode opératoire : ["The attackers had cloned the Curve Finance website and interfered with its DNS settings to send users to a duplicate version of the website."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Ensuite, ils ont attendu.

## Ce que les utilisateurs ont perdu

Lorsqu'un utilisateur atterrissait sur le clone et essayait de l'utiliser, la page demandait à son portefeuille de faire une action qu'il réalise des milliers de fois par jour sur des sites DeFi légitimes : approuver un jeton (*token*). Selon CertiK, ["the attacker injected malicious code into that site that asked users to give token approvals to an unverified contract."](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) (l'attaquant a injecté un code malveillant sur ce site qui demandait aux utilisateurs de donner des approbations de jetons à un contrat non vérifié). Coingape a décrit le piège en termes plus simples : ["The hackers managed to deploy a malicious contract on the home page, which when approved by the victim would completely drain the user wallets."](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)

Approuver une allocation de jetons semble être une action de routine. C'est le même clic que les utilisateurs font pour échanger sur une plateforme légitime. Mais ici, le contrat approuvé appartenait à l'attaquant — et une fois approuvé, il pouvait transférer les stablecoins de la victime vers l'extérieur.

La comptabilité on-chain était précise. CertiK a signalé qu'["in total, 7 users were affected by the exploit culminating in ~$612k losses,"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) (au total, 7 utilisateurs ont été touchés par l'exploit, pour des pertes cumulées d'environ 612 k$), un chiffre qui se décomposait en ["$612,724.16 in USDC and DAI"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) que le pirate a ensuite échangés contre de l'ETH. rekt.news s'est arrêté sur un chiffre plus rond et largement cité : ["The stolen funds (340 ETH, or ~$575k, in total)."](https://rekt.news/curve-finance-rekt) La plupart des articles de l'époque tombaient dans la même fourchette — Cryptopotato a rapporté que [hackers stole around $570,000 worth of ETH](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) ; CryptoDaily a noté que [the hacker had stolen over $573,000](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack). Le total exact varie légèrement selon le moment où la capture a été prise et le cours de l'ETH. L'ordre de grandeur, lui, ne change pas : des sommes à six chiffres basses à moyennes, dérobées à une poignée d'utilisateurs par un site qui ressemblait trait pour trait à celui en qui ils avaient confiance.

Et c'est ici qu'il convient de s'attarder. Tronweekly l'a parfaitement résumé : cette attaque ["did not touch Curve's Ethereum smart contracts or any of the $5.7B of assets stored in them."](https://www.tronweekly.com/curve-finance-dns-hijacking/) (n'a pas touché les contrats intelligents Ethereum de Curve ni aucun des 5,7 milliards de dollars d'actifs qui y sont stockés). Cinq virgule sept milliards de dollars d'actifs du protocole, en totale sécurité. Curve elle-même, comme le note le même article, ["is unharmed and has incurred no losses."](https://www.tronweekly.com/curve-finance-dns-hijacking/) (est indemne et n'a subi aucune perte). Le protocole a gagné. Les utilisateurs ont perdu. Parce que l'attaque ne visait en rien le protocole.

## Comment c'est arrivé : le domaine, pas la blockchain

![Vivid colorful concept art of a telephone switchboard operator secretly rerouting one glowing call cable to a counterfeit identical building, neon cables and circuits, surreal DNS rerouting metaphor, no brand logos](../../assets/the-curve-finance-dns-hijack-02-dns-compromise.jpg)

Alors, comment un attaquant fait-il en sorte que `curve.fi` renvoie vers *son* propre serveur plutôt que vers celui de Curve ?

Commençons par le rôle du DNS. Un nom de domaine comme `curve.fi` est une étiquette lisible pour les humains. Les ordinateurs, eux, ont besoin d'une adresse IP. Le système de noms de domaine (DNS) est la couche de recherche qui traduit l'un en l'autre — l'explication de Cointelegraph le compare à ["a phonebook"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) qui ["converts these user-friendly domain names into the IP addresses computers require to connect."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) Le piratage DNS (*DNS hijacking*) consiste à altérer cette recherche pour que l'annuaire donne le mauvais numéro — ["altering how DNS queries are resolved, rerouting users to malicious sites without their knowledge."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Un point crucial : il n'est pas nécessaire de pirater l'ordinateur de l'utilisateur pour y parvenir. Il suffit de modifier la réponse faisant autorité à sa source — le **serveur de noms** (*nameserver*) vers lequel le domaine délègue. Et cette source se trouve chez le bureau d'enregistrement (*registrar*) du domaine.

Le fondateur de Curve, Michael Egorov, a été très direct quant à l'origine de la faille. Comme l'a cité rekt.news, ["dns registrar iwantmyname had their ns compromised,"](https://rekt.news/curve-finance-rekt) et l'analyse de l'équipe était que ["Curve believes that the underlying nameserver was compromised, rather than a vulnerability at the account level."](https://rekt.news/curve-finance-rekt) En d'autres termes : il ne s'agissait pas (pour autant que Curve puisse le dire) d'un mot de passe volé sur le propre compte d'enregistrement de Curve. C'était un problème situé une couche en dessous — au niveau de l'infrastructure du serveur de noms que le bureau d'enregistrement exploitait lui-même. L'explication de Cointelegraph a plus tard confirmé le nom du bureau d'enregistrement, notant que le projet ["was using the same registrar, 'iwantmyname,' at the time of the previous attack."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Cette distinction est extrêmement importante pour la leçon à en tirer. Une équipe peut imposer un mot de passe fort, activer l'authentification à deux facteurs et verrouiller parfaitement sa propre connexion au registrar — et *quand même* perdre son domaine si le serveur de noms sous-jacent est compromis. Le propriétaire du domaine n'a pas nécessairement commis une erreur. La confiance qu'il a placée dans la couche inférieure a tout simplement été trahie. La formulation de Cointelegraph sur le fonctionnement de ces attaques généralise le risque : ["If a site's mapping changes due to stolen credentials or a registrar's vulnerability, users may be redirected to harmful servers without realizing it."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Une fois que le serveur de noms a répondu avec l'IP de l'attaquant, le reste a été automatique. Chaque utilisateur tapant `curve.fi` s'est vu discrètement présenter le clone. L'annuaire avait été modifié, et presque personne ne vérifie l'annuaire.

## Réaction et conséquences

L'équipe de Curve a agi rapidement, et sa réaction est instructive précisément en raison de ce qu'elle pouvait et ne pouvait pas faire.

Ce qu'elle *pouvait* faire immédiatement, c'était d'alerter. L'équipe a dit clairement aux utilisateurs : ["Please do not perform any approvals or swaps. We're trying to locate the issue, but for now, for your safety, do not use curve.fi or curve.exchange."](https://www.tronweekly.com/curve-finance-dns-hijacking/) Ils ont orienté les utilisateurs vers l'alternative de secours qui était restée saine — ["Please use https://curve.exchange for now until the propagation for https://curve.fi reverts to normal"](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/) — car `curve.exchange` reposait sur une infrastructure différente et n'avait pas été empoisonné.

Ce qu'elle ne *pouvait pas* faire instantanément, c'était de revenir en arrière. Ils ont changé le serveur de noms, mais le DNS ne se met pas à jour partout en même temps. Comme l'a noté rekt.news, ["The hacker's mirrored site was taken down quickly, however some nameservers are still to be updated."](https://rekt.news/curve-finance-rekt) Pendant un certain temps, même après l'application du correctif, les caches du monde entier ont continué à fournir l'ancienne réponse malveillante. Ce délai de propagation est une propriété inhérente du DNS — et un avantage intégré pour l'attaquant.

Pour les utilisateurs qui avaient déjà approuvé le contrat malveillant, la seule défense était la révocation. Le message a été répété partout : ["If you have approved any contracts on Curve in the past few hours, please revoke immediately."](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) rekt.news a publié l'adresse exacte du siphonneur que les utilisateurs devaient révoquer — `0x9eb5f8e83359bb5013f3d8eee60bdce5654e8881` — afin que les victimes puissent annuler l'autorisation avant que davantage de fonds ne soient prélevés.

Les fonds volés se sont dispersés via les réseaux de blanchiment habituels. CertiK a retracé le flux — ["FixedFloat: 292 ETH, Tornado Cash: 27.7 ETH, Binance: 20 ETH"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) — et a noté un détail troublant concernant le timing : Tornado Cash ayant été fraîchement sanctionné par l'OFAC quelques jours plus tôt, ["the recent sanctioning of Tornado Cash from OFAC likely concerned the hacker enough to send the majority of the stolen funds to FixedFloat,"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) une plateforme d'échange centralisée. Ce choix a d'ailleurs aidé : rekt.news a rapporté que sur les fonds envoyés à FixedFloat, [112 ETH were frozen](https://rekt.news/curve-finance-rekt). En quelques heures, Curve a confirmé que ["the issue has been found and reverted."](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)

## Ce que cela nous apprend sur le DNS pour les interfaces DeFi

L'incident de Curve est une leçon condensée sur l'emplacement de la véritable surface d'attaque de la DeFi. Quelques points à retenir s'appliquent bien au-delà de Curve :

1. **Votre domaine fait partie de votre périmètre de sécurité.** Il est tentant de considérer le domaine comme une infrastructure marketing — une étiquette, pas un système. Mais le domaine est la première instruction que le navigateur d'un utilisateur suit. S'il est erroné, tout ce qui suit l'est aussi. Les audits qui s'arrêtent à la frontière du contrat laissent à découvert le maillon auquel on accorde le plus de confiance.

2. **La sécurité du bureau d'enregistrement et du serveur de noms se trouve en amont.** L'hygiène informatique du compte de Curve était peut-être irréprochable ; la compromission se situerait au niveau de la couche du serveur de noms. Vous héritez de la posture de sécurité de chaque fournisseur de votre chaîne DNS. Choisissez des bureaux d'enregistrement et des hébergeurs DNS qui prennent en charge le verrouillage du registre (*registrar lock*), des protections de compte robustes, et idéalement DNSSEC — tout en comprenant que même ainsi, vous faites confiance à une couche que vous ne contrôlez pas totalement.

3. **Les utilisateurs ne voient pas le DNS.** Le clone semblait identique parce que le *nom* était identique. Le cadenas était vert ; l'URL était correcte. Rien de ce qu'un utilisateur prudent vérifie normalement ne l'aurait signalé. C'est ce qui rend le piratage DNS si efficace, même contre des publics avertis — la tromperie se produit sous la couche que les humains inspectent.

4. **Ayez une solution de secours saine.** Le salut de Curve fut `curve.exchange`, hébergé sur une infrastructure distincte. Une deuxième voie d'accès au *front-end* — un domaine différent, un fournisseur DNS différent, un miroir basé sur IPFS ou ENS — vous offre un endroit où rediriger les utilisateurs lorsque votre nom principal est empoisonné.

5. **Les approbations de jetons sont la charge utile (*payload*).** Chaque attaque de *front-end* de cette famille se termine de la même manière : une approbation d'apparence routinière envers un contrat hostile. Les portefeuilles, les interfaces et les utilisateurs doivent tous traiter les demandes d'approbation sur une page fraîchement chargée comme l'action à haut risque qu'elles sont.

## L'approche Namefi

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-curve-finance-dns-hijack-03-namefi-angle.jpg)

Le détournement de Curve est, à la base, une question de savoir **qui contrôle le nom** — et avec quelle clarté ce contrôle peut être vérifié, détenu et récupéré.

Dans le modèle traditionnel, le contrôle d'un domaine est un ensemble fragile : un compte chez un bureau d'enregistrement, un ensemble d'enregistrements de serveurs de noms et une chaîne de fournisseurs auxquels vous devez faire confiance aveuglément. Lorsqu'un maillon de cette chaîne est compromis — comme on pense que ce fut le cas pour le serveur de noms d'iwantmyname —, le propriétaire légitime peut perdre le contrôle effectif de son propre nom sans jamais commettre d'erreur, et sans qu'il n'y ait de registre évident et infalsifiable de *ce qui a changé et quand*.

[Namefi](https://namefi.io) est construit autour de l'idée que les domaines devraient se comporter comme des actifs natifs d'Internet — que la propriété et le contrôle peuvent être rendus vérifiables, auditables et infalsifiables, tout en restant compatibles avec le DNS. La leçon plus profonde de l'affaire Curve n'est pas « la DeFi n'est pas sûre ». C'est que **la couche des noms de domaine est une infrastructure de sécurité porteuse**, et que pendant des années, elle a été traitée comme une simple décoration. Que vous gériez un protocole DeFi, une boutique en ligne ou un blog, le nom que tapent vos utilisateurs est une promesse — et l'intégrité de cette promesse n'a d'égale que la robustesse de la surface de contrôle qui l'étaye.

Les contrats de Curve abritaient 5,7 milliards de dollars sans la moindre égratignure. Le domaine a concédé un demi-million en une après-midi. Cet écart résume toute l'histoire.

## Sources et lectures complémentaires

- CertiK — [Curve Finance Hack Incident Analysis](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)
- rekt.news — [Curve Finance — REKT](https://rekt.news/curve-finance-rekt)
- Cointelegraph (via TradingView) — [What is DNS hijacking? How it took down Curve Finance's website](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)
- Cryptopotato — [Curve Finance Issues Warning About Compromised Front End Amid $570K Theft](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)
- Coingape — [Curve Finance DNS Hijacked, Attackers Stole $570K from User Wallets](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)
- Tronweekly — [Curve Finance's Hackers Loot $570K Via DNS Hijacking](https://www.tronweekly.com/curve-finance-dns-hijacking/)
- CryptoDaily — [Curve Finance Asks Users To Revoke Recent Contracts After DNS Hack](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)