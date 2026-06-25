---
title: "L'attaque interne de SushiSwap MISO : comment un commit malveillant a détourné ~3 M$ d'une vente aux enchères de tokens"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "En septembre 2021, un prestataire anonyme a glissé sa propre adresse de portefeuille dans le front-end du launchpad MISO de SushiSwap via un commit malveillant, détournant 864,8 ETH (~3 M$) de la vente aux enchères Jay Pegs Auto Mart. Un deep-dive Domain Mayday sur les chaînes d'approvisionnement logicielles, la confiance accordée aux front-ends, et ce que cela enseigne sur la propriété vérifiable."
keywords: ['sushiswap miso hack', 'attaque supply chain miso', 'aristok3', 'jay pegs auto mart', 'attaque front-end defi', '864.8 eth', 'chaîne d approvisionnement logicielle', 'commit malveillant', 'menace interne', 'auctionwallet', 'joseph delong', 'sécurité chaîne web', 'sécurité des domaines']
---

La plupart des attaques forcent une porte. Celle-ci est entrée par la façade.

En septembre 2021, les responsables du launchpad MISO de SushiSwap n'ont pas été victimes de phishing, n'ont pas perdu une clé privée et n'ont pas livré un [smart contract](/fr/glossary/smart-contract/) défectueux. Ils ont fait quelque chose de bien plus ordinaire : ils ont fait confiance à un contributeur. Un prestataire anonyme disposant d'un accès commit au code a substitué sa propre adresse de [portefeuille](/fr/glossary/wallet/) dans le front-end de la vente aux enchères, l'a poussé, et a laissé le pipeline de déploiement faire le reste. Lorsqu'une seule vente aux enchères de NFT s'est conclue, environ **864,8 ETH — soit environ 3 millions de dollars** — ont afflué non vers le projet qui organisait la vente, mais vers le développeur qui avait discrètement réécrit la destination des fonds.

Aucun exploit. Aucune faille zero-day. Juste une ligne de code que personne n'a vérifiée, signée par quelqu'un qui était censé faire partie de l'équipe.

Voici l'épisode 15 de Domain Mayday. C'est une histoire qui ne touche aux smart contracts que par les bords. Au fond, c'est une histoire sur la partie du web que personne n'audite jamais : la chaîne d'approvisionnement logicielle, le front-end, et le fait gênant que « qui est autorisé à modifier cela ? » est une question de sécurité aussi sérieuse que « qui détient les clés ? »

## La confiance accordée au code d'un launchpad

Un launchpad [DeFi](/fr/glossary/defi/) comme MISO — Minimal Initial SushiSwap Offering — existe pour faire une seule chose efficacement : collecter des fonds auprès d'une foule d'inconnus et les acheminer vers un projet organisant une vente de tokens ou de NFT. Pour y parvenir, il assemble des smart contracts audités [on-chain](/fr/glossary/on-chain/) et un front-end web off-chain. Les utilisateurs interagissent avec le front-end. Le front-end indique à leur portefeuille quelle transaction signer.

Cette jonction est le ventre mou du système. Les gens obsèdent sur la couche des smart contracts parce que c'est là que vivent les audits, les programmes de bug bounty et les gros titres. Mais le front-end — le JavaScript qui décide *quelle adresse* une vente aux enchères paie — n'est qu'un code dans un dépôt, déployé par un pipeline, modifiable par quiconque dispose d'un accès en écriture. Auditez le coffre-fort autant que vous le souhaitez ; si un initié peut changer le panneau qui dit « déposez l'argent ici », le coffre-fort n'entre jamais en jeu.

Le code de MISO était ouvert et collaboratif, comme l'est souvent l'infrastructure crypto. Cette ouverture est un avantage : elle invite les contributeurs, accélère les livraisons et permet à une petite équipe centrale de dépasser largement ses forces. C'est aussi exactement la surface d'attaque dont a besoin un attaquant de chaîne d'approvisionnement. Il n'est pas nécessaire de forcer l'entrée si l'on peut simplement être invité à contribuer.

## Septembre 2021 : le commit malveillant

![Art conceptuel coloré et vivant d'une brique sabotée, luisant en rouge, discrètement échangée dans un mur de briques open source par ailleurs propre par une main gantée anonyme](../../assets/the-sushiswap-miso-insider-attack-01-attack.jpg)

Le vendredi 17 septembre 2021, le directeur technique de SushiSwap de l'époque, Joseph Delong, s'est exprimé sur Twitter pour expliquer ce qui s'était passé. Le compte rendu de CoinDesk est sans détour : Delong a déclaré qu'[un prestataire anonyme utilisant le pseudonyme GitHub « AristoK3 » a injecté du code malveillant dans le front-end de MISO lors d'une attaque de la chaîne d'approvisionnement](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=an%20anonymous%20contractor%20using%20the%20Github%20handle).

La mécanique était d'une simplicité presque insultante. Selon Delong, l'attaquant [a remplacé l'adresse du portefeuille de la vente aux enchères par la sienne](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=replaced%20the%20auction%27s%20wallet%20address%20with%20their%20own). PYMNTS a décrit l'acte en termes de chaîne d'approvisionnement : le prestataire [a poussé un commit de code malveillant qui a été distribué sur le front-end de la plateforme](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=pushed%20a%20malicious%20code%20commit%20that%20was%20distributed%20on%20the%20platform%27s%20front%20end).

Un post-mortem de l'incident résume l'essentiel en une phrase : un développeur recruté pour travailler sur la vente aux enchères [a inséré sa propre adresse de portefeuille dans le contrat à la place de l'auctionWallet](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=inserted%20his%20own%20wallet%20address%20into%20the%20contract%20instead%20of%20the) — en modifiant la valeur que le front-end injectait au moment du déploiement, sans pour autant toucher à la logique on-chain auditée. Une seule variable. `auctionWallet` était censé pointer vers le projet organisant la vente. À la place, il pointait vers le prestataire. Chaque dollar qu'un enchérisseur pensait envoyer au bénéficiaire de la vente partait ailleurs, et le code avait l'air parfaitement normal.

## Ce qui a été détourné : ~864,8 ETH, ~3 millions de dollars

La cible était une vente aux enchères unique, presque comique. Comme le rapportait CryptoSlate, MISO a subi une attaque de la chaîne d'approvisionnement qui [a drainé 864,8 ETH du contrat de vente aux enchères de tokens « Jay Pegs Auto Mart »](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=drained%20864.8%20ETH%20from%20the). Jay Pegs Auto Mart était un projet d'art NFT se présentant comme un concessionnaire de voitures d'occasion — un décor crypto-culturel ludique sur ce qui était, financièrement, une vente de tokens bien réelle.

Les chiffres concordaient d'une source à l'autre. PYMNTS a rapporté que [le hacker a transféré 864,8 Ethereum — environ 3 millions de dollars — dans son portefeuille](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=transferred%20864.8%20Ethereum%20coins). The Crypto Times a confirmé que l'attaquant [a drainé 864,8 ETH](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=drained%20864.8%20ETH), et que [le seul projet de vente aux enchères à avoir été piraté et exploité jusqu'à présent est Jay Pegs Auto Mart](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=The%20only%20auction%20project%20that%20has%20been%20hacked%20and%20exploited).

Ce dernier détail est important. Le code empoisonné était distribué via le front-end, ce qui signifie qu'en principe, il aurait pu rediriger *n'importe quelle* vente aux enchères qu'il touchait. En pratique, seule Jay Pegs Auto Mart s'est finalisée vers l'adresse de l'attaquant avant que l'équipe ne s'en aperçoive. Les autres ventes affectées ont été corrigées avant de pouvoir être vidées — quelques heures d'écart entre un seul mauvais titre de presse et une catastrophe.

## Comment c'est arrivé : la confiance accordée à un initié, non une serrure fracturée

![Art conceptuel coloré et vivant d'un initié dans l'ombre détournant discrètement un tuyau d'argent lumineux pour que son flux se déverse dans un seau privé plutôt que dans le réservoir prévu](../../assets/the-sushiswap-miso-insider-attack-02-malicious-commit.jpg)

Ôtez le vocabulaire crypto et vous avez une attaque classique de la chaîne d'approvisionnement logicielle — de la même catégorie qu'un paquet npm empoisonné ou un serveur de compilation altéré, simplement avec un gain libellé en ETH.

La chaîne de confiance était la suivante. Un contributeur s'est vu accorder un accès en écriture au code qui alimentait des ventes aux enchères en production. Il a utilisé cet accès pour committer une modification qui a échangé l'adresse de destination. Le pipeline de déploiement a fait ce que font les pipelines — il a pris le dernier code et l'a expédié vers le front-end que de vrais utilisateurs chargeaient dans leurs navigateurs. Ces utilisateurs ont connecté leurs portefeuilles, signé ce que le front-end leur indiquait de signer, et financé une vente aux enchères dont le bénéficiaire avait été silencieusement réécrit. Le compte rendu de Coinspeaker correspond aux autres : [un prestataire anonyme avec le pseudonyme GH AristoK3 a injecté du code malveillant dans le front-end de MISO](https://www.coinspeaker.com/sushiswap-miso-attack-nft/#:~:text=an%20anonymous%20contractor%20with%20the%20GH%20handle%20AristoK3%20injected%20malicious%20code%20into%20the%20Miso%20front%20end).

Notez ce qui n'était *pas* nécessaire. L'attaquant n'avait pas besoin de trouver une faille dans un smart contract. Il n'avait pas besoin de voler une clé ni de compromettre un serveur de l'extérieur. Il lui fallait exactement une chose : être suffisamment fiable pour modifier le code. Le rapport d'incident est précis — [le front-end de MISO est devenu la victime d'une attaque de la chaîne d'approvisionnement](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=The%20Miso%20front%20end%20has%20become%20the%20victim%20of%20a%20supply%20chain%20attack) — menée par un prestataire anonyme utilisant le pseudonyme GitHub AristoK3, qui [a injecté du code malveillant dans le front-end de MISO](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=injected%20malicious%20code%20into%20the%20Miso%20front%20end).

C'est ce qui rend les attaques d'initiés contre les chaînes d'approvisionnement si dangereuses. Chaque défense externe — pare-feux, audits, multisigs sur la trésorerie — suppose que la menace vient de l'extérieur et cherche à entrer. Un initié disposant de droits commit est déjà au-delà de tout cela. La modification malveillante a emprunté le propre processus de déploiement légitime et fiable du projet pour aller directement en production. Le pipeline n'a pas été subverti. Il a été *utilisé*.

## Réponse et rétablissement : identifié, nommé et remboursé

La réponse de SushiSwap a été rapide, publique et combative. Delong n'a pas mené une investigation discrète ; il a nommé le pseudonyme GitHub, cité une identité réelle supposée et fixé un délai. Selon CoinDesk, l'avertissement était explicite : si les fonds n'étaient pas restitués, l'exchange DeFi [déposerait une plainte auprès du FBI](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=file%20a%20complaint%20with%20the%20FBI).

Cela a fonctionné. L'attaquant a fait marche arrière. CryptoSlate a rapporté que, quelques heures seulement après que l'équipe est sortie publiquement, [le hacker a restitué 865 ETH au contrat MISO original](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=the%20hacker%20returned%20865%20ETH%20to%20the%20original%20MISO%20contract) — légèrement *plus* que les 864,8 ETH qui étaient partis. The Crypto Times a confirmé la destination : [l'adresse multisignature de SushiSwap a récupéré 865 ETH](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=the%20multisign%20address%20of%20Sushiswap%20got%20865%20ETH%20back). La propre mise à jour de Delong était aussi lapidaire que la menace initiale. Decrypt consigne sa confirmation qu'en moins d'une journée environ, c'était [All funds returned](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum#:~:text=All%20funds%20returned).

La fin heureuse mérite un bémol. L'argent est revenu non pas parce que l'architecture a détecté le vol, mais parce que l'attaquant a choisi de le rendre sous la lumière crue de l'exposition publique et d'une menace crédible de poursuites pénales. Le pseudonymat sur un registre public est à double tranchant : il a permis au prestataire d'agir anonymement, et il a aussi rendu la trace on-chain des fonds détournés visible de tous, ce qui est exactement le levier qui a fait de la restitution la voie de la moindre résistance. La récupération ici était une négociation, pas une garantie. Le prochain initié pourrait ne pas ciller.

## Ce que cela enseigne sur les chaînes d'approvisionnement logicielles et la confiance accordée aux front-ends

L'incident MISO est modeste en dollars selon les standards DeFi et riche en enseignements. Quelques-uns à retenir :

1. **Le front-end fait partie de votre périmètre de sécurité.** Les utilisateurs signent ce que l'interface leur dit de signer. Si un attaquant contrôle quelle adresse l'interface affiche, il n'a pas besoin du smart contract du tout. N'auditer que le code on-chain, c'est n'auditer que la moitié du système.
2. **L'accès en écriture est la vraie surface d'attaque.** La cryptographie la plus robuste au monde n'aide pas si la personne qui peut éditer le code décide de le faire. « Qui peut modifier ceci, et qui le vérifie avant qu'il soit déployé ? » est un contrôle de sécurité, pas un détail de processus.
3. **La revue de code obligatoire n'est pas de la bureaucratie — c'est une défense.** Un seul deuxième regard requis sur le commit qui a remplacé `auctionWallet` aurait probablement stoppé net l'attaque. Les attaques de chaîne d'approvisionnement prospèrent sur des modifications que personne ne vérifie indépendamment avant le déploiement.
4. **Les contributeurs pseudonymes augmentent les enjeux.** La contribution ouverte est un atout, mais accorder un accès affectant le déploiement à une identité anonyme signifie faire confiance à du code qu'on ne peut pas pleinement attribuer. La confiance devrait évoluer avec la vérification, pas avec l'enthousiasme.
5. **La récupération est une question de chance, pas d'architecture.** Les fonds sont revenus grâce à la pression publique et à un registre traçable. Concevoir un système qui *dépend* de la bonne volonté de l'attaquant n'est pas une conception sécurisée.

Le fil conducteur : l'intégrité de *qui est autorisé à faire une modification*, et la *vérification que la modification déployée est bien celle prévue*, est aussi fondamentale que n'importe quelle clé cryptographique. La confiance accordée à la chaîne d'approvisionnement n'est pas une préoccupation culturelle et vague. C'est le bord dur du système.

## L'angle Namefi

![Illustration colorée de la propriété vérifiable et inviolable — sécurisée par un bouclier vert, un token Namefi vert, et la continuité](../../assets/the-sushiswap-miso-insider-attack-03-namefi-angle.jpg)

MISO a perdu de l'argent parce que la *destination de la valeur* pouvait être silencieusement réécrite par quelqu'un en qui le système avait confiance, et personne n'a vérifié la modification avant qu'elle n'entre en production. Ce mode de défaillance n'est pas propre aux launchpads DeFi. Il a la même forme qu'un domaine dont la propriété ou les enregistrements DNS peuvent être discrètement modifiés par quiconque détient le bon accès — un compte de registrar, un panneau interne, un prestataire avec des identifiants.

Un domaine est l'un des paramètres de « destination » les plus conséquents d'internet. Ses enregistrements DNS décident où vont réellement votre trafic, vos e-mails et vos utilisateurs. Si ceux-ci peuvent être modifiés par un initié ou un compte compromis sans laisser de trace inviolable et vérifiable indépendamment de qui a changé quoi, vous avez le problème MISO habillé différemment : la serrure est parfaite, mais le panneau sur la porte peut être échangé.

[Namefi](https://namefi.io) aborde cela en traitant la propriété de domaine comme un actif vérifiable et inviolable plutôt qu'une entrée dans un compte privé. La propriété tokenisée rend le contrôle auditable et transférable on-chain tout en restant compatible avec le DNS — ainsi, « qui possède ceci et qui est autorisé à le modifier » devient un fait que vous pouvez vérifier, non une confiance à accorder à l'aveugle. Le prestataire MISO a pu réécrire une adresse de paiement précisément parce que le système n'avait pas de réponse appliquée et vérifiable indépendamment à la question « cette modification est-elle autorisée ? » La leçon que Namefi tire des attaques de chaîne d'approvisionnement est que la propriété et le contrôle doivent être prouvables par conception, afin que l'écart dangereux entre *faire confiance* et *vérifier* ne s'ouvre jamais.

## Sources et lectures complémentaires

- CoinDesk — [$3M in Ether Stolen From SushiSwap's MISO Launchpad](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad)
- Decrypt — [SushiSwap's Token Launchpad Hacked for Over $3M in Ethereum](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum)
- CryptoSlate — [Hacker returns 865 ETH stolen from Sushi's token launch platform MISO](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/)
- PYMNTS — [SushiSwap Crypto Platform Victimized by $3M Hack](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/)
- The Crypto Times — [Sushiswap's Miso Launchpad Loses $3 Million In An Attack](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/)
- Coinspeaker — [SushiSwap Launchpad Miso Suffers Attack with 864.8 ETH NFT Project Fund Carted Away](https://www.coinspeaker.com/sushiswap-miso-attack-nft/)
- CryptoBriefing — [Sushi's Initial Offering Launchpad Suffers $3M Exploit](https://cryptobriefing.com/sushiswaps-miso-token-launchpad-suffers-3m-exploit/)
- CryptoPotato — [Another DeFi Hack: $3M in ETH Stolen From SushiSwap's Token Platform](https://cryptopotato.com/another-defi-hack-3m-in-eth-stolen-from-sushiswaps-token-platform/)
- Quadriga Initiative — [SushiSwap MISO Jaypegs Automart case study](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php)
