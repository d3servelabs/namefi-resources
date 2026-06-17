---
title: "La minute à 12 $ : Quand quelqu'un a discrètement acheté Google.com"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "En septembre 2015, un ancien employé de Google a acheté google.com via Google Domains pour 12 $ et a détenu le contrôle administratif du domaine le plus précieux au monde pendant environ une minute. Voici l'histoire de Sanmay Ved, de la prime de 6 006,13 $ et de ce qu'une minute de propriété révèle sur qui contrôle réellement un domaine."
keywords: ["domaine google.com", "sanmay ved", "bug google domains", "sécurité des domaines", "à qui appartient google.com", "détournement de domaine", "accès webmaster tools", "prime de bug google", "récompense de 6006.13", "vulnérabilité d'enregistrement de domaine", "contrôle de domaine", "sécurité dns", "vérification de propriété de domaine"]
---

Pendant environ une minute dans la nuit du 29 septembre 2015, l'adresse la plus précieuse d'Internet n'appartenait pas à Google.

Elle appartenait à un ancien employé de Google nommé Sanmay Ved, qui venait d'acheter **google.com** pour **12 $**.

Il ne s'est pas introduit par effraction. Il n'a pas exploité de dépassement de tampon (buffer overflow) ni hameçonné un administrateur. Il s'est rendu sur la propre boutique de Google — Google Domains —, a tapé le domaine le plus célèbre au monde et a regardé le processus de paiement faire quelque chose qu'il n'aurait jamais dû faire : le laisser payer. Sa carte a été débitée. La commande est passée. Et pendant environ soixante secondes, le titulaire enregistré pour google.com était un étudiant diplômé du Massachusetts.

Ceci est **Domain Mayday / 域名浩劫**, notre série sur les moments où la sécurité des domaines a publiquement failli. La plupart des épisodes traitent de noms de domaine volés par des attaquants. Celui-ci est différent — et plus troublant — car personne n'attaquait quoi que ce soit. Le domaine le plus important sur Terre a été vendu, au prix catalogue, à la première personne qui l'a par hasard mis dans son panier.

## Ce qu'est normalement google.com

Il est difficile d'exagérer la valeur de google.com, car ce chiffre n'est pas vraiment un chiffre.

Google.com est la porte d'entrée du moteur de recherche le plus utilisé de la planète, le point d'ancrage de Gmail, Maps, Ads, des flux de comptes YouTube et l'épine dorsale de l'authentification pour des milliards de personnes. Slate, en couvrant l'incident, l'a qualifié de ["domaine le plus visité au monde"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20cost%20to%20buy%20the%20most%2Dtrafficked%20domain%20in%20the%20world%3F%20Only%20%2412.). Quel que soit le prix auquel Tesla.com ou Cars.com ont pu être vendus, google.com est dans une catégorie à part : ce n'est pas un actif de marque, c'est une *infrastructure* qu'une grande partie de la population humaine touche tous les jours.

Un tel domaine est censé être intouchable. Il devrait être verrouillé, signalé, retenu par le registre (registry-held), mis en attente par le serveur (server-hold), interdit de transfert — enveloppé de toutes les protections qu'un bureau d'enregistrement (registrar) peut appliquer. Tout le principe de la sécurité des domaines repose sur le fait que plus le nom est critique, plus il est difficile de le déplacer.

Et puis, pour 12 $, il a bougé.

## La minute à 12 $

![Concept art vif et coloré d'un domaine lumineux en forme de globe portant une minuscule étiquette de prix de douze dollars, une seule pièce tombant dans une fente de paiement alors qu'un sablier d'une minute commence à s'écouler](../../assets/the-12-dollar-minute-someone-owned-google-com-01-the-minute.jpg)

Ved ne cherchait pas les ennuis. C'était un ancien employé de Google — il avait travaillé dans l'entreprise en tant que stratège de compte (Account Strategist) des années auparavant — et tard dans la nuit, il fouinait sur Google Domains, le service d'enregistrement alors tout nouveau de Google, en regardant des noms de domaine. Sur un coup de tête, il a tapé le plus gros de tous.

Selon ses propres mots, le résultat l'a figé sur place : ["Je tape Google.com et à ma grande surprise, il est apparu comme disponible",](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=I%20type%20in%20Google.com%20and%20to%20my%20surprise%20it%20showed%20it%20as%20available) a déclaré Ved à Business Insider. Pas « premium », pas « faire une offre », pas « ce domaine est déjà pris ». *Disponible*. Pour les frais d'enregistrement standards de 12 $.

Il l'a ajouté à son panier et a procédé au paiement, s'attendant pleinement à ce que le système le rejette. Ce ne fut pas le cas. La transaction a abouti. Comme The Hacker News l'a résumé, un ancien de Google avait ["réussi à acheter le domaine le plus visité au monde, Google.com, via le propre service Domains de Google pour seulement 12 $."](https://thehackernews.com/2015/10/google-bounty-charity.html#:~:text=managed%20to%20buy%20the%20world%27s%20most%2Dvisited%20domain)

Et puis sa boîte de réception a commencé à se remplir. Les systèmes qui se basent sur la propriété du domaine — ceux qui envoient au propriétaire vérifié des alertes et des contrôles — ont vu un nouveau titulaire et ont commencé à faire leur travail. Security Affairs a décrit le moment : ["En quelques secondes, sa boîte de réception et les outils Google Webmaster Tools ont été inondés de messages liés aux webmasters confirmant la propriété des domaines Google.com."](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=In%20a%20few%20seconds%20his%20inbox%20and%20Google%20Webmaster%20Tools%20were%20flooded)

Pendant cette minute, Ved n'était pas seulement désigné comme le propriétaire sur le papier. La machine l'a traité comme le véritable propriétaire.

## Ce que vous contrôlez réellement pendant cette minute

C'est la partie qui transforme une anecdote amusante en une véritable histoire de sécurité.

Lorsque vous êtes le propriétaire vérifié d'un domaine dans l'écosystème de Google, vous obtenez l'accès aux **Webmaster Tools** (aujourd'hui la Search Console) — le tableau de bord que les propriétaires de sites utilisent pour voir comment une propriété est indexée, soumettre des sitemaps, consulter la messagerie interne et gérer l'apparence du domaine dans les résultats de recherche. Ved a déclaré plus tard que les implications ne lui avaient pas échappé : ["La partie effrayante était que j'avais accès aux contrôles webmaster pendant une minute",](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20scary%20part%20was%20I%20had%20access%20to%20the%20webmaster%20controls%20for%20a%20minute) a-t-il expliqué.

Les reportages de l'époque ont noté que pendant cette fenêtre, il avait ["un accès administratif à Google.com"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=he%20had%20administrative%20access%20to%20Google.com) et que son ["tableau de bord Google Search Console a été mis à jour avec des messages pour le domaine Google.com."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=his%20Google%20Search%20Console%20dashboard%20was%20updated) Pensez à ce que la possession d'un domaine vous permet réellement d'atteindre : les enregistrements DNS, le routage des e-mails, la capacité de prouver la « propriété » à des tiers, et les contrôles des moteurs de recherche qui décident comment une propriété est présentée au monde. L'enregistrement est la clé maîtresse. Tout ce qui se trouve en aval — DNS, certificats, e-mails, authentification unique (SSO), indexation des recherches — présume que le titulaire est bien celui qu'il prétend être.

Ved a agi de manière responsable. Il n'a modifié aucun enregistrement. Il a immédiatement signalé le problème. Mais la leçon demeure : la différence entre un « étudiant curieux » et une « catastrophe » n'était pas un contrôle technique. C'était le choix d'une personne de bien se comporter.

## L'intervention de Google — et sa réponse

![Concept art vif et coloré d'une clé géante et lumineuse tenue brièvement dans une main ouverte, puis doucement ramenée par un faisceau de lumière, contre un ciel coloré en forme de circuit imprimé avec une pièce remboursée qui s'envole](../../assets/the-12-dollar-minute-someone-owned-google-com-02-how.jpg)

Les systèmes automatisés de Google ont rapidement détecté l'anomalie. En l'espace d'environ une minute, la commande a été annulée. Fox News a rapporté l'annulation de manière claire : ["Google Domains a annulé la vente une minute plus tard, déclarant que quelqu'un avait enregistré le site avant lui, et a remboursé les 12 $ à Ved."](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=Google%20Domains%20canceled%20the%20sale%20a%20minute%20later) Ce « quelqu'un » qui l'avait enregistré en premier, bien sûr, c'était Google lui-même.

Ensuite, Google a fait ce qui a transformé cette histoire en légende. Via son programme de récompense des vulnérabilités (Vulnerability Reward Program), l'entreprise a versé une prime à Ved — et elle a délibérément choisi le montant. Dans son bilan officiel sur la sécurité de 2015, Google a écrit : ["Notre récompense financière initiale pour Sanmay — 6 006,13 $ — épelait Google numériquement (plissez un peu les yeux et vous le verrez !). Nous avons ensuite doublé ce montant lorsque Sanmay a fait don de sa récompense à une œuvre caritative."](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/#:~:text=Our%20initial%20financial%20reward%20to%20Sanmay) (Lisez-le comme des chiffres : 6-0-0-6-1-3 → G-O-O-G-L-E.)

Ved a choisi de faire don de l'argent. Il a demandé qu'il soit versé à la Fondation Art of Living India, qui soutient des écoles gratuites à travers l'Inde — et quand Google a appris l'existence de ce don, l'entreprise a doublé la récompense, portant le total à environ **12 012,26 $**. Pour Ved, cet épisode n'a jamais été une question d'argent. ["Je me fiche de l'argent. Il n'a jamais été question d'argent",](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=I%20don%27t%20care%20about%20the%20money.%20It%20was%20never%20about%20the%20money) a-t-il déclaré à Business Insider.

Une erreur à 12 $ est devenue l'histoire d'une prime astucieuse, d'un don généreux et d'une entreprise qui l'a égalé. Mais si l'on écarte la bienveillance, le fait sous-jacent est frappant : un bureau d'enregistrement a distribué les clés de son propre royaume, et la seule chose qui les a récupérées fut un système de détection automatisé rapide — et un acheteur qui s'est avéré honnête.

## Comment un enregistrement aussi important passe-t-il entre les mailles du filet ?

Comment le domaine le plus protégé sur Terre peut-il s'afficher comme « disponible pour 12 $ » dans un processus de paiement en libre-service ?

La réponse honnête est que personne en dehors de Google ne dispose de l'analyse post-mortem interne complète, et nous ne prétendrons pas l'avoir. Mais la *forme* de cette défaillance est familière à quiconque a travaillé avec des systèmes de domaines, et il vaut la peine d'être précis sur ce que nous pouvons ou ne pouvons pas dire.

Ce qui est vérifiable, c'est le comportement visible. Les reportages de l'époque avançaient deux explications classiques : ["Il pourrait s'agir d'un bug dans Google Domains ou l'entreprise a simplement omis de renouveler son nom de domaine le moment venu."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=It%20could%20have%20been%20a%20bug%20in%20Google%20Domains%20or%20the%20company%20simply%20failed%20to%20renew) Quoi qu'il en soit, pendant une brève fenêtre, la logique « ce nom est-il disponible à l'enregistrement ? » de la vitrine a renvoyé la mauvaise réponse pour un nom qui aurait dû être codé en dur comme invendable.

La leçon la plus profonde est architecturale. La protection d'un domaine n'a d'égal que le *chemin le plus faible pour la modifier*. Un registre peut appliquer des drapeaux server-hold (mise en attente par le serveur) et transfer-prohibited (interdiction de transfert) ; un bureau d'enregistrement peut verrouiller un nom ; une organisation peut activer une authentification multifacteur et des flux d'approbation au niveau du registrar. Mais si une seule interface — un processus de paiement, un outil d'administration interne, une dérogation du support, un point d'accès API — peut modifier la propriété sans que ces protections ne se déclenchent, alors le nom est exactement aussi sécurisé que cette interface la plus faible. Le rayon d'impact d'un détournement de domaine est énorme (DNS, e-mail, certificats, connexion), mais la surface qui le déclenche peut être minuscule : un seul formulaire qui aurait dû dire « non » et qui a dit « oui » à la place.

Cette asymétrie résume tout le problème. La valeur en jeu est maximale. L'action requise pour la transférer peut être minimale.

## Ce que cela nous apprend sur le contrôle des domaines

Quelques leçons durables se dégagent de cette minute à 12 $ :

1. **L'enregistrement du titulaire est la clé maîtresse.** Le DNS, les certificats TLS, la délivrabilité des e-mails et les flux de « vérification de propriété de ce domaine » font tous confiance à l'enregistrement qui les sous-tend. Celui qui contrôle l'enregistrement contrôle tout ce qui en découle. Protégez cette couche comme le mot de passe root qu'elle est en réalité.

2. **La criticité et la protection ne sont pas automatiquement corrélées.** On pourrait supposer que le domaine le plus important au monde est le plus verrouillé. Pendant une minute, il ne l'était pas. L'importance ne s'impose pas d'elle-même ; les verrouillages explicites, les suspensions (holds) et les portails d'approbation le font. Auditez-les ; ne les prenez pas pour acquis.

3. **Le plan de contrôle est plus vaste que le DNS.** Les gens sécurisent leurs serveurs de noms et oublient le compte du bureau d'enregistrement, le canal de support, l'e-mail de facturation et les outils internes. Un domaine peut être perdu par n'importe quelle porte capable de réécrire la propriété — pas seulement celle étiquetée « DNS ».

4. **Il ne manque souvent qu'une personne honnête pour frôler le désastre.** Google a eu la chance que l'acheteur soit un ancien employé soucieux de la sécurité qui a signalé l'incident instantanément. Une sécurité qui dépend de la bonne volonté de quiconque tombe dessus n'est pas une sécurité. C'est le système, et non le visiteur, qui devrait dire non.

5. **Une détection rapide est un véritable contrôle.** L'interception automatisée de Google en environ une minute a véritablement limité les dégâts. Vous ne pouvez pas prévenir chaque erreur, mais une surveillance étroite des changements de propriété réduit la fenêtre durant laquelle une erreur devient une faille.

Ce qui est rassurant dans cette histoire, c'est que les systèmes de Google l'ont remarqué et ont inversé la situation. Ce qui est dérangeant, c'est qu'ils aient eu besoin de le faire.

## Le point de vue de Namefi

![Illustration colorée d'une propriété de domaine vérifiable et inviolable — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert et une continuité DNS](../../assets/the-12-dollar-minute-someone-owned-google-com-03-namefi-angle.jpg)

La minute à 12 $ est, au fond, une question liée à un enregistrement : *qui est le propriétaire vérifié de ce nom, à cet instant précis, et à quel point est-il difficile de changer cela discrètement ?*

Dans le modèle traditionnel, la réponse se trouve dans la base de données d'un bureau d'enregistrement, modifiable via toutes les interfaces que ce bureau expose — processus de paiement, dérogation d'administrateur, ticket de support, API. La plupart de ces interfaces sont bien protégées. Mais la propriété n'est aussi sûre que l'interface la moins surveillée, et le propriétaire ne peut généralement pas voir, en temps réel, le moment où son enregistrement change de mains. Sanmay Ved a appris qu'il « possédait » google.com parce que sa boîte de réception s'est allumée — et non parce qu'un registre inviolable a annoncé un transfert vérifié et autorisé.

[Namefi](https://namefi.io) part du principe que la propriété d'un domaine doit être **vérifiable et résistante aux manipulations** (tamper-evident), et non enterrée dans une simple ligne modifiable d'une base de données. En représentant le contrôle du domaine comme un actif tokénisé sur la blockchain (on-chain) qui reste compatible avec le DNS, la question de « qui possède ce domaine » devient quelque chose que vous pouvez vérifier et auditer de manière indépendante — et un transfert devient un événement explicite, autorisé et visible plutôt qu'un passage en caisse qui réussit discrètement. Le but n'est pas de rendre les domaines exotiques ; c'est de rendre la clé maîtresse plus difficile à remettre à la mauvaise personne par accident, et impossible à déplacer sans laisser de trace.

Google.com a été récupéré en une minute parce que Google a construit une détection rapide au-dessus d'une primitive fragile. La meilleure solution est de rendre la primitive elle-même digne de confiance : une propriété que vous pouvez prouver, des transferts que vous pouvez voir, et un contrôle qui ne dépend pas d'un simple formulaire qui doit se souvenir de dire « non ».

## Sources et lectures complémentaires

- Google Online Security Blog — [Google Security Rewards — 2015 Year in Review](https://security.googleblog.com/2016/01/google-security-rewards-2015-year-in.html?m=1) (source principale pour la récompense de 6 006,13 $ et le don doublé)
- The American Bazaar — [Google paid $6,006.13 to ex-Googler who registered "Google.com"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/) (cite textuellement le blog de Google)
- Slate — [Ex-Googler Sanmay Ved bought the search engine's domain for one minute](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html)
- Fox News — [Student manages to buy domain name of Google.com for $12](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12)
- Fox News — [Why Google handed out a $6,006.13 reward](https://www.foxnews.com/tech/why-google-handed-out-a-6006-13-reward)
- The Hacker News — [Google Rewarded the Guy Who Accidentally Bought Google.com, But He Donated It to Charity](https://thehackernews.com/2015/10/google-bounty-charity.html)
- Security Affairs — [Sanmay Ved who bought Google.com donates Google reward](https://securityaffairs.com/40904/breaking-news/google-com-charity.html)
- Yahoo Finance — [Google Briefly Lost Ownership Of Its Domain After It Was Mistakenly Sold For $12](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html)
- Vocal Media — [The Man Who Owned Google.com — for One Minute](https://vocal.media/fyi/the-man-who-owned-google-com-for-one-minute-rc1vud0zhq)
- Namefi — [namefi.io](https://namefi.io)