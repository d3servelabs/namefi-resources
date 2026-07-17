---
title: 'La Minute à 12 Dollars : Quand Quelqu''un a Discrètement Acheté Google.com'
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['alan-machin']
draft: false
description: 'En septembre 2015, un ancien employé de Google a acheté google.com via Google Domains pour 12 dollars et a détenu le contrôle administratif du domaine le plus précieux au monde pendant environ une minute. L''histoire de Sanmay Ved, la prime de 6 006,13 dollars, et ce qu''une minute de propriété révèle sur celui qui contrôle vraiment un domaine.'
keywords: ['domaine google.com', 'sanmay ved', 'bug google domains', 'sécurité des domaines', 'qui possède google.com', 'détournement de domaine', 'accès webmaster tools', 'programme de récompense google', 'récompense 6006.13', 'vulnérabilité enregistrement domaine', 'contrôle domaine', 'sécurité dns', 'vérification propriété domaine']
relatedArticles:
  - /fr/blog/the-godaddy-multi-year-breach/
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/the-lenovo-com-dns-hijack/
  - /fr/blog/the-sex-com-heist-the-forged-letter/
  - /fr/blog/the-2024-squarespace-defi-domain-hijacks/
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
  - /fr/glossary/tld/
  - /fr/glossary/registry/
---

Pendant environ une minute dans la nuit du 29 septembre 2015, l'adresse la plus précieuse d'internet n'appartenait pas à Google.

Elle appartenait à un ancien employé de Google nommé Sanmay Ved, qui venait d'acheter **google.com** pour **12 dollars**.

Il n'a pas forcé l'entrée. Il n'a pas exploité un dépassement de tampon ni usurpé l'identité d'un administrateur. Il s'est rendu sur la propre boutique en ligne de Google — Google Domains — a tapé le nom de domaine le plus célèbre au monde, et a regardé le processus de paiement faire quelque chose qu'il n'aurait jamais dû faire : il l'a laissé payer. Sa carte a été débitée. La commande a été validée. Et pendant environ soixante secondes, le titulaire officiel de google.com était un étudiant en master dans le Massachusetts.

Il s'agit de **Domain Mayday / 域名浩劫**, notre série sur les moments où la sécurité des domaines a échoué publiquement. La plupart des épisodes concernent des noms volés par des attaquants. Celui-ci est différent — et plus troublant — parce que personne n'attaquait quoi que ce soit. Le domaine le plus important de la planète a été vendu, au prix catalogue, à la première personne qui l'a mis dans un panier d'achat.

## Ce qu'est normalement google.com

Il est difficile de surestimer la valeur de google.com, car le chiffre n'est pas vraiment un chiffre.

Google.com est la porte d'entrée du moteur de recherche le plus utilisé sur la planète, l'ancre de Gmail, Maps, Ads, des flux de comptes YouTube, et l'épine dorsale d'authentification pour des milliards de personnes. Slate, couvrant l'incident, l'a qualifié de [« domaine le plus fréquenté au monde »](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20cost%20to%20buy%20the%20most%2Dtrafficked%20domain%20in%20the%20world%3F%20Only%20%2412.). Quel que soit le prix auquel Tesla.com ou Cars.com ont été vendus, google.com appartient à une catégorie à part : ce n'est pas un actif de marque, c'est une *infrastructure* qu'une grande partie de la population mondiale utilise chaque jour.

Un domaine comme celui-là est censé être intouchable. Il devrait être verrouillé, signalé, maintenu par le registre, mis en attente de serveur, interdit de transfert — protégé par toutes les mesures qu'un [registraire](/fr/glossary/registrar/) peut appliquer. Toute la logique de la sécurité des domaines repose sur le principe que plus le nom est critique, plus il est difficile à déplacer.

Et pourtant, pour 12 dollars, il a été déplacé.

## La minute à 12 dollars

![Art conceptuel coloré et vivant d'un globe lumineux en forme de domaine portant un petit étiquette de prix de douze dollars, une pièce tombant dans une fente de caisse tandis qu'un sablier d'une minute commence à s'écouler](../../assets/the-12-dollar-minute-someone-owned-google-com-01-the-minute.jpg)

Ved ne cherchait pas les ennuis. C'était un ex-Googler — il avait travaillé dans l'entreprise en tant que stratège de compte quelques années auparavant — et tard dans la nuit, il explorait Google Domains, le service de registraire alors récent de Google, en regardant des noms de domaine. Par fantaisie, il a tapé le grand nom.

Dans ses propres mots, le résultat l'a pétrifié : [« Je tape Google.com et à ma grande surprise, il s'affichait comme disponible »](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=I%20type%20in%20Google.com%20and%20to%20my%20surprise%20it%20showed%20it%20as%20available), a confié Ved à Business Insider. Pas « premium », pas « faire une offre », pas « ce domaine est pris ». *Disponible.* Pour les 12 dollars habituels des frais d'enregistrement.

Il l'a ajouté à son panier et a finalisé l'achat, s'attendant pleinement à ce que le système le rejette. Ce ne fut pas le cas. La transaction a été complétée. Comme l'a résumé The Hacker News, un ex-Googler avait [« réussi à acheter le domaine le plus visité au monde, Google.com, via le propre service Google Domains de Google pour seulement 12 dollars. »](https://thehackernews.com/2015/10/google-bounty-charity.html#:~:text=managed%20to%20buy%20the%20world%27s%20most%2Dvisited%20domain)

Puis sa boîte de réception a commencé à se remplir. Les systèmes qui reposent sur la propriété d'un domaine — ceux qui envoient des alertes et des contrôles à un propriétaire de domaine vérifié — ont vu un nouveau titulaire et ont commencé à faire leur travail. Security Affairs a décrit le moment : [« En quelques secondes, sa boîte de réception et Google Webmaster Tools ont été inondés de messages liés aux webmasters qui confirmaient la propriété des domaines Google.com. »](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=In%20a%20few%20seconds%20his%20inbox%20and%20Google%20Webmaster%20Tools%20were%20flooded)

Pendant cette minute, Ved n'était pas seulement répertorié comme propriétaire sur le papier. La machine le traitait comme le propriétaire.

## Ce que vous contrôlez réellement pendant cette minute

C'est la partie qui transforme une anecdote amusante en histoire de sécurité.

Lorsque vous êtes le propriétaire vérifié d'un domaine dans l'écosystème Google, vous accédez à **Webmaster Tools** (désormais Search Console) — le tableau de bord que les propriétaires de sites utilisent pour voir comment une propriété est indexée, soumettre des sitemaps, consulter les messages internes et gérer la façon dont le domaine apparaît dans les recherches. Ved a déclaré plus tard que l'implication ne lui avait pas échappé : [« La partie effrayante, c'est que j'avais accès aux contrôles webmaster pendant une minute »](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20scary%20part%20was%20I%20had%20access%20to%20the%20webmaster%20controls%20for%20a%20minute), a-t-il expliqué.

Les reportages de l'époque ont noté que pendant cette fenêtre, il avait [« accès administratif à Google.com »](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=he%20had%20administrative%20access%20to%20Google.com) et que son [« tableau de bord Google Search Console avait été mis à jour avec des messages pour le domaine Google.com. »](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=his%20Google%20Search%20Console%20dashboard%20was%20updated) Pensez à ce que posséder un domaine vous permet réellement d'atteindre : les enregistrements [DNS](/fr/glossary/dns/), le routage des e-mails, la capacité à prouver la « propriété » à des tiers, et les contrôles du moteur de recherche qui décident comment une propriété est présentée au monde. L'enregistrement est la clé maîtresse. Tout ce qui en découle — DNS, certificats, e-mail, authentification unique, indexation dans les moteurs de recherche — suppose que le titulaire est bien celui qu'il prétend être.

Ved a fait la chose responsable. Il n'a modifié aucun enregistrement. Il l'a immédiatement signalé. Mais la leçon demeure : la différence entre « un étudiant curieux » et « une catastrophe » n'était pas un contrôle technique. C'était le choix d'une seule personne de se comporter honnêtement.

## La détection par Google — et sa réponse

![Art conceptuel coloré et vivant d'une énorme clé lumineuse tenue brièvement dans une main ouverte, puis doucement reprise par un rayon de lumière, sur fond d'un ciel en circuit imprimé coloré avec une pièce remboursée flottant au loin](../../assets/the-12-dollar-minute-someone-owned-google-com-02-how.jpg)

Les systèmes automatisés de Google ont détecté l'anomalie rapidement. En environ une minute, la commande a été annulée. Fox News a rapporté l'annulation clairement : [« Google Domains a annulé la vente une minute plus tard, disant que quelqu'un avait enregistré le site avant lui, et a remboursé à Ved les 12 dollars. »](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=Google%20Domains%20canceled%20the%20sale%20a%20minute%20later) Le « quelqu'un » qui l'avait enregistré en premier était, bien sûr, Google lui-même.

Google a ensuite fait ce qui a transformé cet événement en légende. Via son programme Vulnerability Reward Program, il a versé une prime à Ved — et l'entreprise a choisi le montant délibérément. Dans son bilan officiel de sécurité 2015, Google a écrit : [« Notre récompense financière initiale à Sanmay — 6 006,13 dollars — épelle Google de manière numérique (regardez attentivement et vous verrez !). Nous avons ensuite doublé ce montant lorsque Sanmay a fait don de sa récompense à une œuvre de bienfaisance. »](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/#:~:text=Our%20initial%20financial%20reward%20to%20Sanmay) (Lus comme des chiffres : 6-0-0-6-1-3 → G-O-O-G-L-E.)

Ved a choisi de donner l'argent. Il a demandé qu'il aille à l'Art of Living India Foundation, qui soutient des écoles gratuites à travers l'Inde — et lorsque Google a appris ce don, il a doublé la récompense, portant le total à environ **12 012,26 dollars**. L'interprétation que fait Ved de toute l'affaire n'a jamais porté sur la prime. [« L'argent, je m'en fiche. Ça n'a jamais été une question d'argent »](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=I%20don%27t%20care%20about%20the%20money.%20It%20was%20never%20about%20the%20money), a-t-il confié à Business Insider.

Une erreur à 12 dollars est devenue une histoire de prime astucieuse, de don généreux et d'une entreprise qui l'a doublé. Mais en faisant abstraction de la bonne volonté, le fait sous-jacent est saisissant : un registraire a remis les clés de son propre royaume, et la seule chose qui les a récupérées a été une détection automatique rapide — et un acheteur qui s'est avéré honnête.

## Comment un enregistrement aussi important a-t-il pu passer entre les mailles du filet ?

Comment le domaine le mieux protégé au monde s'est-il retrouvé affiché comme « disponible pour 12 dollars » dans un système de paiement en libre-service ?

La réponse honnête est que personne en dehors de Google ne dispose du post-mortem interne complet, et nous n'allons pas prétendre le contraire. Mais la *forme* de l'échec est familière à quiconque a travaillé avec des systèmes de domaines, et il vaut la peine d'être précis sur ce que nous pouvons et ne pouvons pas dire.

Ce qui est vérifiable, c'est le comportement visible. Les reportages de l'époque ont avancé les deux explications habituelles : [« Cela pourrait avoir été un bug dans Google Domains ou l'entreprise n'a tout simplement pas renouvelé son nom de domaine à temps. »](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=It%20could%20have%20been%20a%20bug%20in%20Google%20Domains%20or%20the%20company%20simply%20failed%20to%20renew) Dans tous les cas, pendant une brève fenêtre, la logique « ce nom est-il disponible à l'enregistrement ? » de la boutique a renvoyé la mauvaise réponse pour un nom qui aurait dû être codé en dur comme invendable.

La leçon plus profonde est architecturale. La protection d'un domaine n'est solide que si elle l'est sur *le chemin le plus faible vers sa modification*. Un registre peut appliquer des indicateurs de mise en attente de serveur et d'interdiction de transfert ; un registraire peut verrouiller un nom ; une organisation peut activer l'authentification multifacteur au niveau du registraire et les flux d'approbation. Mais si une seule interface — une caisse en ligne, un outil d'administration interne, une dérogation de support, un point de terminaison d'API — peut modifier la propriété sans que ces garde-fous s'activent, alors le nom est exactement aussi sécurisé que cette interface la plus faible. Le rayon d'action d'une prise de contrôle de domaine est énorme (DNS, e-mail, certificats, connexion), mais la surface qui la déclenche peut être minuscule : un formulaire qui aurait dû dire « non » et a dit « oui » à la place.

Cette asymétrie est tout le problème. La valeur en jeu est maximale. L'action requise pour la déplacer peut être minimale.

## Ce que cela enseigne sur le contrôle des domaines

Quelques leçons durables ressortent de la minute à 12 dollars :

1. **L'enregistrement du titulaire est la clé maîtresse.** Les DNS, les certificats TLS, la délivrabilité des e-mails et les flux « prouvez que vous êtes propriétaire de ce domaine » font tous confiance à l'enregistrement sous-jacent. Celui qui contrôle l'enregistrement contrôle tout ce qui en dépend. Protégez cette couche comme le mot de passe root qu'elle est effectivement.

2. **Criticité et protection ne sont pas automatiquement corrélées.** Vous supposeriez que le domaine le plus important au monde est le mieux verrouillé. Pendant une minute, ce ne fut pas le cas. L'importance ne s'applique pas d'elle-même ; ce sont les verrous explicites, les mises en attente et les portes d'approbation qui le font. Auditez-les ; ne supposez pas qu'ils existent.

3. **Le plan de contrôle est plus vaste que le DNS.** Les gens sécurisent leurs serveurs de noms et oublient le compte du registraire, le canal de support, l'e-mail de facturation et les outils internes. Un domaine peut être perdu par n'importe quelle porte pouvant réécrire la propriété — pas seulement celle étiquetée « DNS ».

4. **Vous n'êtes souvent qu'à une seule personne honnête d'une catastrophe.** Google a eu de la chance que l'acheteur soit un ex-employé sensibilisé à la sécurité qui l'a signalé instantanément. La sécurité qui dépend de la bonne volonté de quiconque s'aventure dans le système n'est pas de la sécurité. C'est le système, et non le visiteur, qui devrait dire non.

5. **Une détection rapide est un vrai contrôle.** La détection automatique de Google en environ une minute a véritablement limité les dégâts. Vous ne pouvez pas prévenir toutes les erreurs, mais une surveillance étroite des changements de propriété réduit la fenêtre pendant laquelle un glissement devient une brèche.

La partie rassurante de cette histoire est que les systèmes de Google l'ont remarqué et inversé. La partie inconfortable, c'est qu'ils ont dû le faire.

## L'angle Namefi

![Illustration colorée d'une propriété de domaine vérifiable et résistante aux falsifications — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert, et la continuité DNS](../../assets/the-12-dollar-minute-someone-owned-google-com-03-namefi-angle.jpg)

La minute à 12 dollars est, au fond, une question de registre : *qui est le propriétaire vérifié de ce nom, en ce moment précis, et dans quelle mesure est-il difficile de le modifier discrètement ?*

Dans le modèle traditionnel, la réponse réside dans la base de données d'un registraire, modifiable via les interfaces que ce registraire expose — caisse en ligne, dérogation administrative, ticket de support, API. La plupart de ces interfaces sont bien gardées. Mais la propriété n'est sûre qu'autant que la moins protégée d'entre elles, et le propriétaire ne peut généralement pas voir, en temps réel, le moment où son enregistrement change de mains. Sanmay Ved a appris qu'il « possédait » google.com parce que sa boîte de réception s'est allumée — pas parce qu'un registre sécurisé a annoncé un transfert vérifié et autorisé.

[Namefi](https://namefi.io) part du principe que la propriété d'un domaine devrait être **vérifiable et à l'épreuve des falsifications**, et non enfouie dans une ligne modifiable unique. En représentant le contrôle du domaine comme un actif tokenisé et on-chain restant compatible avec le DNS, l'acte « qui possède ce domaine » devient quelque chose que vous pouvez vérifier et auditer de manière indépendante — et un transfert devient un événement explicite, autorisé et visible, plutôt qu'une caisse qui réussit discrètement. L'objectif n'est pas de rendre les domaines exotiques ; c'est de rendre la clé maîtresse plus difficile à remettre accidentellement à la mauvaise personne, et impossible à déplacer sans laisser de trace.

Google.com a repris sa forme en une minute parce que Google a construit une détection rapide par-dessus un primitif fragile. La meilleure réponse est de rendre le primitif lui-même digne de confiance : une propriété que vous pouvez prouver, des transferts que vous pouvez voir, et un contrôle qui ne dépend pas d'un seul formulaire se souvenant de dire « non ».

## Sources et lectures complémentaires

- Google Online Security Blog — [Google Security Rewards — 2015 Year in Review](https://security.googleblog.com/2016/01/google-security-rewards-2015-year-in.html?m=1) (source principale pour la récompense de 6 006,13 dollars et le don doublé)
- The American Bazaar — [Google paid $6,006.13 to ex-Googler who registered "Google.com"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/) (cite le blog de Google mot pour mot)
- Slate — [Ex-Googler Sanmay Ved bought the search engine's domain for one minute](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html)
- Fox News — [Student manages to buy domain name of Google.com for $12](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12)
- Fox News — [Why Google handed out a $6,006.13 reward](https://www.foxnews.com/tech/why-google-handed-out-a-6006-13-reward)
- The Hacker News — [Google Rewarded the Guy Who Accidentally Bought Google.com, But He Donated It to Charity](https://thehackernews.com/2015/10/google-bounty-charity.html)
- Security Affairs — [Sanmay Ved who bought Google.com donates Google reward](https://securityaffairs.com/40904/breaking-news/google-com-charity.html)
- Yahoo Finance — [Google Briefly Lost Ownership Of Its Domain After It Was Mistakenly Sold For $12](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html)
- Vocal Media — [The Man Who Owned Google.com — for One Minute](https://vocal.media/fyi/the-man-who-owned-google-com-for-one-minute-rc1vud0zhq)
- Namefi — [namefi.io](https://namefi.io)
