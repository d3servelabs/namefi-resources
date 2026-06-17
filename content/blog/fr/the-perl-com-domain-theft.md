---
title: "Le vol du domaine Perl.com : Comment le foyer d'une communauté de 30 ans a été discrètement dérobé"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "Fin janvier 2021, perl.com — le foyer depuis des décennies de la communauté de programmation Perl — a été volé via la compromission d'un compte au niveau du registraire, transféré par la Chine, redirigé vers une adresse IP liée à des logiciels malveillants, et mis en vente pour 190 000 $. Voici comment cela s'est produit, comment il a été récupéré, et ce que cela nous apprend sur la sécurité des comptes de registraires."
keywords: ['perl.com', 'vol de domaine perl.com', 'détournement de domaine', 'vol de domaine', 'compromission de compte registraire', 'ingénierie sociale', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'détournement DNS', 'sécurité de domaine', 'prise de contrôle de compte', 'BizCN']
---

Certains domaines sont des infrastructures qui ressemblent par hasard à un nom. **perl.com** est l'un d'entre eux. Ce n'est pas un atout marketing ou une marque construite l'année dernière — c'est un élément du mobilier d'Internet autour duquel la communauté de programmation Perl a vécu depuis les premiers jours du web, la porte d'entrée canonique vers la documentation, les articles et le visage public du langage.

Ainsi, lorsque, le matin du 27 janvier 2021, cette porte d'entrée a soudainement appartenu à quelqu'un d'autre, il ne s'agissait pas d'une manœuvre de marque astucieuse ou d'une vente négociée. C'était un vol. Le domaine avait été discrètement soustrait au contrôle de son propriétaire légitime des mois plus tôt, baladé de registraire en registraire, et pointé vers une adresse IP ayant un passé de distribution de logiciels malveillants. Les opérateurs réseau de la communauté l'ont dit sans détour : ["Le domaine perl.com a été piraté ce matin, et pointe actuellement vers un site de parking."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

Voici l'histoire de l'épisode 19 de notre série Domain Mayday : comment un domaine communautaire vieux de trente ans a été volé sans que personne ne pirate le moindre serveur, et ce qu'il a fallu faire pour le récupérer.

## Un domaine détenu depuis le début des années 90

Pour comprendre ce vol, il faut comprendre à quel point la configuration était ordinaire — et comment cette banalité constituait en soi la vulnérabilité.

perl.com n'était pas conservé dans une chambre forte d'entreprise ultra-sécurisée. Il était géré de la même manière que la plupart des domaines de longue date : par une personne de confiance, chez un registraire grand public, renouvelé année après année sans histoire. L'éditeur du site, brian d foy, a par la suite décrit cette lignée dans son propre récit de l'incident : ["Ce domaine a été enregistré au début des années 90, Tom Christiansen en a pris le contrôle peu de temps après, et a essentiellement continué à payer les frais d'enregistrement."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

C'est exactement le profil d'une énorme proportion des noms les plus importants d'Internet. Une personne, un identifiant de registraire et trois décennies passées à payer la facture en silence. Cela fonctionne parfaitement — jusqu'à ce que le compte du registraire lui-même devienne la cible.

## 27 janvier 2021 : la porte d'entrée change de serrure

![Art conceptuel vif et coloré d'un vieux panneau indicateur communautaire en bois discrètement dévissé de son poteau la nuit et emporté, sur fond de ciel en circuit imprimé lumineux](../../assets/the-perl-com-domain-theft-01-theft.jpg)

La première alerte publique est venue des personnes qui gèrent l'infrastructure de la communauté Perl. Le blog du NOC (Network Operations Center) de Perl a publié que le domaine avait été détourné "ce matin" et pointait désormais vers un endroit où il ne devrait pas. Pire qu'une simple page de parking, les opérateurs ont averti qu'["il y a certains signaux indiquant qu'il pourrait être lié à des sites ayant distribué des logiciels malveillants par le passé."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)

brian d foy a soulevé le problème publiquement le même jour. Les rapports sur l'incident ont confirmé la chronologie en termes clairs : ["Le 27 janvier, l'auteur de programmation Perl et éditeur de Perl.com, brian d foy, a tweeté que le domaine perl.com avait été soudainement enregistré au nom d'une autre personne."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

La réponse de la communauté fut rapide et pragmatique. Alors que les travaux de récupération commençaient, le NOC a redirigé les lecteurs vers une sauvegarde : ["Si vous cherchez le contenu, vous pouvez visiter perldotcom.perl.org."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) Le nom canonique avait disparu, mais le contenu restait accessible.

## Ce qui était en jeu : une adresse IP liée à des malwares

Un domaine volé est dangereux proportionnellement à la confiance qu'il inspire — et perl.com en inspirait beaucoup. Des millions de développeurs, de tutoriels, d'outils CPAN et d'anciens liens à travers le web pointaient tous vers lui. Quiconque contrôlait le nom contrôlait l'endroit vers lequel toute cette confiance était redirigée.

Et le nouveau propriétaire ne l'a pas fait pointer vers un endroit inoffensif. Comme l'a documenté BleepingComputer, ["Le nom de domaine perl.com a été volé et pointe désormais vers une adresse IP associée à des campagnes de logiciels malveillants."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

Les empreintes techniques étaient spécifiques. Les enregistrements DNS ont été réécrits de sorte que ["les adresses IP assignées au domaine ont été changées de 151.101.2.132 à l'adresse IP Google Cloud 35.186.238[.]101."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) Cette destination avait un passé : ["En 2019, l'adresse IP 35.186.238[.]101 était liée à un domaine distribuant un exécutable malveillant pour le ransomware Locky, aujourd'hui disparu."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

Ajoutez ces deux faits et le danger devient évident. Un nom auquel les développeurs font confiance par réflexe, résolvant soudainement vers une IP ayant un historique de logiciels malveillants, constitue une configuration quasi parfaite pour tromper précisément le type de public technique et sensible à la sécurité qui est normalement difficile à duper.

## Comment c'est arrivé : le compte du registraire, pas le serveur

![Art conceptuel vif et coloré d'un faux bordereau de changement de propriété glissé sur le bureau d'un service de registre, un tampon officiel rougeoyant, de la paperasse tourbillonnant dans une lumière néon — sans logos de marque](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

Voici la partie qui fait de cet incident un cas d'école plutôt qu'une simple note de bas de page : personne n'a piraté le serveur web de perl.com, et personne n'a deviné un mot de passe DNS. L'attaque s'est produite une couche au-dessus, chez le registraire — l'entreprise qui détient l'enregistrement faisant autorité quant à l'identité du propriétaire du nom.

Dans son analyse post-mortem, brian d foy a décrit la théorie retenue sans détour : ["Nous pensons qu'il y a eu une attaque d'ingénierie sociale sur Network Solutions, incluant de faux documents et autres."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) La presse l'a présenté de la même manière : le vol était ["une attaque d'ingénierie sociale qui a convaincu le registraire Network Solutions de modifier les enregistrements du domaine sans autorisation valide."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)

Le détail le plus troublant est la chronologie. La communauté ne s'en est *rendue compte* qu'en janvier, mais la véritable compromission était bien plus ancienne. Le travail d'investigation numérique mis en lumière par l'avocat spécialisé en domaines John Berryhill a repoussé la date réelle de plusieurs mois ; comme le relate le compte rendu de perl.com, ["John Berryhill a fourni un travail d'investigation sur Twitter qui a montré que la compromission s'était en fait produite en septembre."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) SecurityWeek a confirmé la patience de l'attaquant : ["L'attaque, explique-t-il, a eu lieu en septembre 2020"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020) — soit environ quatre mois avant que quiconque n'en voie les effets.

Pourquoi une si longue attente ? Parce que les règles de transfert de domaine récompensent la patience. ["L'ICANN interdit le transfert d'un domaine pendant 60 jours suivant la mise à jour des informations de contact."](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) Un attaquant qui s'empare discrètement d'un compte de registraire en septembre ne peut pas immédiatement subtiliser le domaine — il s'est donc installé, a laissé le temps passer, et est passé à l'action une fois le verrouillage expiré.

Lorsqu'il est finalement passé à l'action, l'attaquant a blanchi le nom à travers différents registraires et frontières pour rendre sa récupération plus difficile. The Register a documenté le premier saut : ["Le domaine a été transféré vers le registraire BizCN en décembre, mais les serveurs de noms n'ont pas été modifiés."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) BleepingComputer a retracé le même parcours géographiquement : le domaine ["a été volé en septembre 2020 alors qu'il se trouvait chez Network Solutions, transféré à un registraire en Chine le jour de Noël"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day) avant le dernier saut en janvier, lorsque ["Le domaine a de nouveau été transféré en janvier vers un autre registraire, Key Systems, GmbH."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

Et puis, il a essayé d'encaisser l'argent. Avec le nom fraîchement relocalisé, ["le déclarant non autorisé a essayé de vendre le domaine pour 190 000 $ sur le marché de domaines Afternic."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) Un atout communautaire de trente ans, volé par le biais de formalités administratives, mis en vente comme un vulgaire meuble d'occasion.

## La récupération : des semaines de paperasse pour annuler de la paperasse

La même mécanique qui a permis le vol — les registraires, les registres et les enregistrements de propriété — était également le seul chemin de retour. Il n'y avait pas de serveur à re-sécuriser ni de correctif à déployer. Quelqu'un devait *prouver*, à travers la chaîne du registraire et du registre, que Tom Christiansen était le véritable propriétaire et que le nouveau "propriétaire" était un fraudeur.

Ce travail a commencé en quelques jours. Dès le 30 janvier, le NOC de Perl rapportait que ["Network Solutions travaille avec Tom Christiansen, le déclarant légitime, sur la récupération du domaine Perl.com."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.) Ces efforts ont ["finalement conduit à la restitution du domaine à son ancien propriétaire, Tom Christiansen, début février."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

Mais "restauré" ne signifiait pas "réparé". La formulation même de brian d foy saisit à la fois le soulagement et le travail inachevé : ["Le domaine Perl.com est de retour entre les mains de Tom Christiansen et nous travaillons sur les différentes mises à jour de sécurité pour que cela ne se reproduise plus."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) Parce que le domaine avait pointé vers une adresse IP liée à des logiciels malveillants, les produits de sécurité l'avaient mis sur liste noire et certains résolveurs DNS l'avaient placé en "sinkhole" (trou noir). Même après la correction de l'enregistrement du registre, il a fallu des semaines supplémentaires pour que le nom retrouve la confiance des systèmes de réputation d'Internet — une longue traîne qui a prolongé l'épreuve complète sur environ deux mois.

Le titre, pour reprendre les mots de foy, était presque un euphémisme : ["Pendant une semaine, nous avons perdu le contrôle du domaine Perl.com."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) Une semaine de vol actif ; des mois de compromission latente auparavant ; des semaines de nettoyage ensuite.

## Ce que cela nous apprend sur la sécurité des comptes de registraires et les domaines de longue date

Le vol de perl.com est d'autant plus instructif qu'il ne s'est rien passé d'exotique. Si l'on va à l'essentiel, les leçons qui en découlent sont d'une banalité troublante :

1. **Votre compte de registraire est le véritable joyau de la couronne.** Tout le monde renforce ses serveurs et son hôte DNS. Mais l'*enregistrement de propriété* du domaine réside chez le registraire, et ce compte est souvent protégé par guère plus qu'un mot de passe et une équipe de support qui peut être convaincue d'effectuer des changements. perl.com a été volé à ce niveau, et non à la périphérie.

2. **L'ingénierie sociale l'emporte sur les contrôles techniques.** Pas d'exploit, pas de logiciel malveillant du côté de la victime — juste ["de faux documents et autres"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.) suffisamment convaincants pour déplacer un enregistrement réel. L'authentification à deux facteurs sur votre propre connexion ne sert à rien si les *humains* du registraire peuvent être persuadés de la contourner.

3. **Les domaines détenus depuis longtemps sont des cibles faciles.** Un nom enregistré au début des années 90 et renouvelé en pilote automatique pendant trente ans a tendance à accumuler des informations de contact obsolètes, un point de défaillance humain unique, et un propriétaire qui ne surveille pas l'enregistrement WHOIS quotidiennement. Une stabilité tranquille est exactement ce qui permet à une compromission de septembre de passer inaperçue jusqu'en janvier.

4. **Les règles de transfert sont à double tranchant.** Le verrouillage de transfert de 60 jours post-mise à jour, censé *protéger* les propriétaires, est devenu la salle d'attente de l'attaquant. La patience, combinée au blanchiment à travers des registraires et des frontières, a transformé une résolution rapide en une récupération multipartite de plusieurs semaines.

5. **La récupération est plus lente que le vol.** Voler le nom a nécessité un document falsifié. Le récupérer a impliqué des registraires, un registre, les preuves du propriétaire légitime, puis des semaines de reconstruction de la réputation auprès des listes de blocage et des résolveurs. Le vol est une transaction unique ; la restitution en nécessite de multiples.

Le sombre résumé : pour un domaine comme perl.com, la solidité de votre mot de passe importe moins que la possibilité de piéger votre registraire pour l'amener à l'ignorer.

## L'approche Namefi

![Illustration colorée d'une propriété de domaine vérifiable et inviolable — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert, et une continuité DNS](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

Chaque étape du vol de perl.com a reposé sur une seule faiblesse : la propriété n'était qu'un *enregistrement dans le compte de quelqu'un d'autre*, modifiable par quiconque parvenait à persuader le bon agent du support. L'attaquant n'a jamais eu besoin des clés du propriétaire. Il a eu besoin de la confiance du registraire — et un bout de papier falsifié a suffi pour transférer un atout de trente ans à l'autre bout de la planète et le mettre en vente.

[Namefi](https://namefi.io) est construit sur le principe inverse : la propriété d'un domaine devrait être cryptographiquement vérifiable et difficile à réécrire silencieusement. En représentant le contrôle d'un domaine comme un actif tokenisé "on-chain" qui reste compatible avec le DNS, la réponse faisant autorité à la question "à qui appartient ce nom ?" cesse d'être une ligne modifiable dans la base de données d'un registraire qu'un coup de fil convaincant peut altérer. Les transferts deviennent des événements signés et auditables plutôt que des formalités de back-office — et un "changement de propriété" frauduleux n'a plus de porte dérobée par laquelle s'engouffrer.

Cela n'aurait pas rendu perl.com impossible à voler du jour au lendemain ; les registraires et les registres font toujours partie de la chaîne. Mais cela s'attaque au mode de défaillance exact qui a défini cet incident — le fossé entre *payer pour un nom pendant trente ans* et *être capable de prouver, de manière inviolable, qu'il est à vous* — et cela réduit la fenêtre durant laquelle un domaine volé peut être blanchi avant que quiconque ne puisse s'y opposer.

perl.com a récupéré sa porte d'entrée. La question la plus difficile que laisse cet épisode est de savoir pourquoi la serrure a jamais été quelque chose qu'un inconnu avec les bons documents pouvait ouvrir.

## Sources et lectures complémentaires

- The Perl NOC — [perl.com hijacked](https://log.perl.org/2021/01/perlcom-hijacked.html)
- perl.com (brian d foy) — [The Hijacking of Perl.com](https://www.perl.com/article/the-hijacking-of-perl-com/)
- BleepingComputer — [Perl.com domain stolen, now using IP address tied to malware](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/)
- The Register — [Perl.com theft blamed on social engineering attack](https://www.theregister.com/2021/03/02/perl_domain_theft/)
- SecurityWeek — [Hackers Controlled Perl.com Domain Months Before Hijack](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/)
- Security Affairs — [Attackers took over the Perl.com domain in September 2020](https://securityaffairs.com/115208/cyber-crime/perl-com-hijack-september.html)
- The Daily Swig (PortSwigger) — [Domain for popular programming website Perl.com stolen in 'hack'](https://portswigger.net/daily-swig/domain-for-popular-programming-website-perl-com-stolen-in-hack)
- Slashdot — [Perl.com Domain Stolen, Now Using IP Address of Past Malware Campaigns](https://developers.slashdot.org/story/21/01/31/0220252/perlcom-domain-stolen-now-using-ip-address-of-past-malware-campaigns)
- INCIBE-CERT — [The perl.com domain has been hijacked](https://www.incibe.es/en/incibe-cert/publications/cybersecurity-highlights/perlcom-domain-has-been-hijacked)
- GIGAZINE — [Perl.com editors tell the truth about the Perl.com domain hijacking case](https://gigazine.net/gsc_news/en/20210303-hijacking-of-perl-com/)