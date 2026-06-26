---
title: "DNS over HTTPS vs DNS Split-Horizon d'Entreprise : Une Impasse Qui Ne Se Résoudra Pas Toute Seule"
date: '2026-05-04'
language: fr
tags: ['dns', 'doh', 'entreprise', 'sécurité', 'réseau']
authors: ['namefiteam']
draft: false
description: "Le DNS over HTTPS (DoH) protège la confidentialité des utilisateurs en chiffrant les requêtes DNS dans le protocole HTTPS. Le DNS split-horizon d'entreprise repose sur la capacité du réseau à voir ces requêtes. La collision entre les deux redéfinit la façon dont les réseaux d'entreprise, les navigateurs et les systèmes d'exploitation gèrent la résolution de noms."
ogImage: ../../assets/dns-over-https-vs-enterprise-split-horizon-dns-og.jpg
keywords: ['dns over https', 'doh', 'dns split horizon', 'dns entreprise', 'dot', 'dns chiffré', 'dns interne', 'résolution de nom', 'namefi']
relatedArticles:
  - /fr/blog/what-are-tokenized-domains/
  - /fr/blog/the-myetherwallet-bgp-dns-attack/
  - /fr/blog/the-dnspionage-campaign/
  - /fr/blog/the-godaddy-multi-year-breach/
  - /fr/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/name-change-game-change/
relatedGlossary:
  - /fr/glossary/dns/
  - /fr/glossary/registrar/
  - /fr/glossary/icann/
  - /fr/glossary/tld/
  - /fr/glossary/web3/
---

Pendant la majeure partie de l'histoire d'Internet, les requêtes [DNS](/fr/glossary/dns/) ont transité en clair sur le port 53. Toute personne sur le chemin réseau pouvait les lire, les journaliser et les modifier. C'était un problème de confidentialité que l'IETF a fini par résoudre avec deux alternatives chiffrées : [DNS over TLS (DoT, RFC 7858)](https://datatracker.ietf.org/doc/html/rfc7858) en 2016 et [DNS over HTTPS (DoH, RFC 8484)](https://datatracker.ietf.org/doc/html/rfc8484) en 2018.

Le DoH en particulier a changé la donne, car il dissimule le DNS *à l'intérieur* d'un flux HTTPS classique. Pour un observateur du réseau, une requête DoH semble identique à n'importe quelle autre connexion TLS vers un serveur de contenu. C'est excellent pour les utilisateurs naviguant sur un réseau de café hostile. C'est beaucoup moins bien pour une équipe informatique d'entreprise qui a besoin de voir—et de diriger—chaque requête DNS qui traverse son périmètre.

C'est là que se situe l'impasse. Les deux camps ont des exigences légitimes et bien articulées. Les organismes de normalisation, les éditeurs de navigateurs et de systèmes d'exploitation ont passé la majeure partie de la décennie à essayer de faire fonctionner les deux en même temps. Le résultat est un ensemble de compromis délicats que toute personne gérant un réseau d'entreprise en 2026 se doit de comprendre.

## Ce que fait réellement le DoH

Un client DoH envoie des requêtes DNS sous forme de requêtes HTTP POST ou GET, généralement vers `https://dns.google/dns-query`, `https://cloudflare-dns.com/dns-query`, ou un autre résolveur public. La réponse revient sous la forme d'un corps de réponse HTTPS normal. Trois propriétés sont importantes :

- **Chiffrement en transit.** Les observateurs du réseau ne peuvent pas lire le nom de la requête ni la réponse.
- **Serveur authentifié.** Le client vérifie le certificat TLS du résolveur, de sorte qu'une attaque de l'homme du milieu (man-in-the-middle) ne peut pas usurper son identité.
- **Indiscernable du trafic web.** Port 443, TLS 1.3, schémas SNI normaux. Il n'y a pas de trafic dont le format trahit le DNS et sur lequel on pourrait filtrer.

La troisième propriété est celle qui définit le conflit. Le DoT chiffre également les requêtes, mais il le fait sur un port *dédié* (853), qu'un réseau peut facilement bloquer ou rediriger. Le DoH ne peut pas être bloqué sélectivement sans bloquer également la navigation web ordinaire.

## Ce que fait réellement le DNS split-horizon d'entreprise

La plupart des grandes organisations utilisent un **DNS split-horizon** (à horizon partagé). Le même nom (`vpn.example.corp`, `git.example.com`, `intranet.example.com`) se résout en différentes adresses IP selon que la requête provient de l'intérieur ou de l'extérieur du réseau.

À l'intérieur du réseau :
- Le résolveur est le DNS interne de l'entreprise, souvent intégré à Active Directory.
- `git.example.com` pourrait être résolu vers une adresse privée RFC 1918 comme `10.0.4.7`.
- Les zones purement internes (`example.corp`, `example.internal`) peuvent ne pas exister du tout sur l'Internet public.
- Les outils de sécurité et de prévention des pertes de données (DLP) voient chaque requête et peuvent signaler les requêtes DNS vers des domaines malveillants connus.

À l'extérieur du réseau (ou sur un appareil personnel via un réseau Wi-Fi domestique) :
- La même requête est envoyée à un résolveur public.
- `git.example.com` se résout vers l'équilibreur de charge (load balancer) public.
- Les noms purement internes ne se résolvent tout simplement pas.

Ce n'est pas un cas exotique. C'est la configuration par défaut de presque toutes les entreprises de plus de quelques centaines d'employés. Elle repose sur une hypothèse fondamentale : **le point de terminaison (endpoint) utilise le résolveur que le réseau lui indique d'utiliser**, via DHCP, par déploiement de stratégies ou configuration VPN.

Le DoH brise cette hypothèse. Si le navigateur intègre son propre résolveur, ou si le système d'exploitation contourne le résolveur système, le point de terminaison cesse complètement de consulter le DNS interne. Les noms d'hôtes internes ne se résolvent plus. Les outils de sécurité cessent de voir les requêtes sur lesquelles ils s'appuient pour la détection des menaces.

## Comment les navigateurs et les OS ont essayé de gérer cela

Les éditeurs n'ont pas ignoré ce problème. Les compromis existants aujourd'hui se superposent et sont un peu ad hoc.

### Le modèle de « mise à niveau automatique » de Chrome

L'implémentation du DoH par Chrome ne met à niveau le résolveur système vers le DoH que si ce résolveur système figure lui-même sur la liste d'autorisation des fournisseurs compatibles DoH de Chrome (Google, Cloudflare, Quad9, etc.). Si le système est configuré pour utiliser un résolveur d'entreprise interne qui n'est pas sur cette liste, Chrome le laisse tel quel. Les stratégies d'entreprise peuvent également désactiver complètement le DoH via le paramètre [`DnsOverHttpsMode` de Chrome](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode).

### Le modèle TRR (Trusted Recursive Resolver) de Firefox

L'approche de Firefox a été plus controversée. Dans les régions où Mozilla a activé le DoH par défaut, Firefox utilise un résolveur par défaut comme Cloudflare aux États-Unis, mais exécute également des heuristiques d'entreprise et de réseau avant d'activer le DoH. Un signal important est le domaine canari (canary domain) `use-application-dns.net` : lorsque le résolveur local renvoie un résultat négatif, Firefox désactive le DNS au niveau de l'application pour les utilisateurs dont le DoH était activé par défaut. Mozilla documente également une nuance importante concernant le split-horizon : les noms purement internes peuvent se rabattre sur le DNS ordinaire si la résolution DoH échoue, mais pour que les noms publics qui se résolvent différemment au sein du réseau fonctionnent correctement, il faut qu'une stratégie d'entreprise désactive le DoH.

### Le DNS chiffré d'Apple (iOS 14+, macOS Big Sur+)

Apple permet aux applications et aux profils de configuration d'activer le DoH ou le DoT pour l'ensemble du système, tout en respectant les politiques MDM qui imposent un résolveur spécifique. Les appareils gérés par l'entreprise se comportent correctement de façon native.

### Le DoH natif de Windows

Depuis Windows 11, et sur Windows Server 2022 et versions ultérieures, le système d'exploitation lui-même peut utiliser le DoH pour le résolveur système. Les stratégies de groupe (Group Policy) contrôlent si le DoH est autorisé, requis ou interdit, et Windows n'active le DoH que pour les serveurs DNS configurés dont on sait qu'ils le prennent en charge. C'est sans doute le modèle le plus propre : l'équipe de sécurité choisit la politique, le système d'exploitation l'applique.

La tendance est claire : **le DoH qui réside dans une seule application (le navigateur) est difficile à contrôler pour le réseau ; le DoH qui réside dans le résolveur au niveau de l'OS peut être contrôlé via les canaux MDM normaux**. L'IETF et les fournisseurs d'OS ont largement convenu que l'application des stratégies appartient à la couche système (OS).

## Les options réalistes pour une entreprise en 2026

Compte tenu des outils ci-dessus, il existe trois stratégies viables et une quatrième qui ne fonctionnera pas.

### Stratégie A : Tout interne, DoH bloqué

Déployer une stratégie qui désactive le DoH dans chaque navigateur, bloque le port 443 vers les terminaux DoH publics connus et force tout le trafic DNS à passer par le résolveur interne. Ce résolveur interne peut lui-même communiquer en DoH avec des résolveurs publics en amont, mais à l'intérieur du réseau, tout passe par lui.

C'est l'option la plus prescriptive. Elle préserve parfaitement le split-horizon et donne une visibilité totale aux outils de sécurité. Le prix à payer est de devoir maintenir des listes de blocage des nouveaux terminaux DoH, et de risquer des dysfonctionnements avec toute application installée par l'utilisateur intégrant son propre DoH (certains clients de messagerie, certains VPN).

### Stratégie B : DoH interne

Mettre en place un serveur DoH interne (Cloudflared, AdGuard, ou un serveur DNS Windows avec le DoH activé), configurer les terminaux pour l'utiliser et exécuter le split-horizon au niveau de ce serveur DoH interne. Les points de terminaison bénéficient d'un DNS chiffré sans que le réseau ne perde en visibilité.

C'est l'option la plus propre et celle vers laquelle s'orientent la plupart des grandes entreprises. Elle préserve l'avantage de la confidentialité (les requêtes sont chiffrées sur le réseau local) tout en conservant l'avantage sécuritaire (le résolveur interne voit toujours chaque requête et peut les filtrer). Microsoft, Google et Apple prennent tous en charge la configuration au niveau de l'OS pour ce scénario.

### Stratégie C : Domaine canari / signal réseau

Publier le domaine canari de Mozilla. Déployer les stratégies pertinentes pour Chrome et Edge. Compter sur les navigateurs pour détecter qu'ils sont sur un réseau géré et se remettre au résolveur système. Il s'agit de l'option la plus légère, suffisante pour de nombreuses petites et moyennes organisations.

### Stratégie D (ne fonctionne pas) : « Nous allons simplement ignorer le DoH »

Faire comme si le conflit n'existait pas, conserver les valeurs par défaut et supposer que tout le trafic DNS passe toujours par le résolveur d'entreprise. Il s'agit de la situation la plus courante et elle entraîne des pannes prévisibles : des développeurs qui signalent que des URL purement internes fonctionnent sous Edge mais pas sous Firefox, des équipes de sécurité qui constatent des lacunes dans les journaux DNS, des bugs intermittents liés au VPN-DNS qui prennent des heures à diagnostiquer. Le problème ne disparaît pas. Il devient seulement plus difficile à isoler.

## La confidentialité n'est pas la seule chose que le DoH remet en question

Un effet plus subtil du DoH est la centralisation des résolveurs. Lorsqu'un navigateur ou un système d'exploitation est configuré pour utiliser un résolveur DoH public, une plus grande partie du trafic DNS de cet utilisateur peut aller vers un seul opérateur de résolveur. Le mode automatique de Chrome est explicitement conçu pour préserver le fournisseur DNS existant de l'utilisateur lorsque cela est possible, et le déploiement par défaut de Firefox dépend de la région et d'heuristiques, de sorte qu'il ne s'agit pas littéralement de « chaque requête » dans tous les déploiements. Mais le compromis architectural demeure : le DNS chiffré peut déplacer la confiance du réseau local ou du FAI vers un ensemble plus restreint d'opérateurs de résolveurs sélectionnés.

La question de savoir si ce compromis est acceptable dépend du modèle de menace. Pour un utilisateur sur un réseau de café hostile, centraliser la confiance auprès de Cloudflare est une nette amélioration par rapport au fait de faire confiance au café. Pour une entreprise qui avait déjà une relation contractuelle avec son FAI, cela peut être une régression. L'[EFF écrit sur ce compromis](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet) depuis les premiers déploiements du DoH.

La réponse la plus claire est la même que la Stratégie B ci-dessus : exécutez votre propre résolveur DoH, afin que le DNS chiffré ne nécessite pas de confier l'intégralité du flux de requêtes à un tiers.

## Ce que cela signifie pour les propriétaires de domaines

Si vous gérez un domaine utilisé par des entreprises — une application SaaS, un outil pour développeurs, une API — les faits pertinents sont les suivants :

- Une fraction de vos utilisateurs vous résoudra via un point de terminaison DoH public, en particulier sur des appareils non gérés ou des navigateurs configurés explicitement. Les chaînes de CNAME, les délégations de sous-domaines et toutes les astuces DNS intelligentes que vous utilisez pour la personnalisation doivent fonctionner de la même manière lorsqu'elles sont résolues depuis un résolveur public arbitraire que depuis le résolveur interne d'un client.
- Le contournement de la censure basée sur le DNS est un cas d'usage réel pour le DoH. Si votre domaine est bloqué par le filtre DNS d'un gouvernement (comme l'ont été plusieurs domaines de messagerie chiffrée et de VPN), les utilisateurs vous atteindront via un résolveur public en DoH. Les mécanismes sont les mêmes ; les enjeux politiques sont différents.
- Le split-horizon interne ne devrait jamais résoudre un nom public vers quelque chose de *significatif uniquement en interne*, d'une manière qui planterait si un utilisateur l'interrogeait accidentellement via le DoH. L'échec classique est un `app.example.com` purement interne renvoyant une IP privée qu'aucun utilisateur DoH ne peut joindre — puis un employé à distance dans un hôtel découvre que le même nom d'hôte est inaccessible et signale un bug. Utilisez une zone clairement séparée et purement interne (`app.example.internal`).

## Comment Namefi s'intègre

Namefi traite le DNS comme le plan de contrôle public — le point de rencontre entre le nommage global et la stratégie locale. Nos workflows DNS supposent que les requêtes peuvent provenir de n'importe quel résolveur, y compris des points de terminaison DoH que nous ne pouvons pas énumérer, et que les noms que nous publions fonctionnent de manière cohérente dans tous les cas. Pour les clients exécutant un split-horizon en interne, nous nous situons du côté public : la réponse faisant autorité pour `example.com` est ce que nous servons, et ce que le résolveur interne remplace pour les utilisateurs internes ne regarde que ces derniers et la politique de leur point de terminaison.

L'idée plus profonde est la suivante : le DNS chiffré est là pour durer, tout comme le besoin de visibilité des entreprises. La manière de les réconcilier n'est pas de combattre les normes, mais de déplacer le point d'application de la politique du réseau vers le système d'exploitation. Les organismes de normalisation, Microsoft, Apple, Google et Mozilla ont tous convergé vers cette réponse. Le travail restant est principalement d'ordre opérationnel.

## Sources et lectures complémentaires

- IETF — [DNS over HTTPS, RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) et [DNS over TLS, RFC 7858](https://datatracker.ietf.org/doc/html/rfc7858).
- Chrome Enterprise — [Contrôles des règles DoH](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode).
- Mozilla — [Programme Trusted Recursive Resolver](https://wiki.mozilla.org/Trusted_Recursive_Resolver), [comportement du domaine canari](https://support.mozilla.org/en-US/kb/canary-domain-use-application-dnsnet#:~:text=A%20negative%20result%20will%20be%20a%20signal%20to%20disable%20application%20DNS%2C%20(i.e.%2C%20DoH).), et [conseils de basculement split-horizon](https://support.mozilla.org/gu-IN/kb/dns-over-https-doh-faqs#:~:text=If%20Firefox%20fails%20to%20resolve%20a%20domain%20via%20DoH%2C%20it%20will%20fall%20back%20to%20the%20DNS.).
- Chromium — [Modèle de mise à niveau automatique DoH de Chrome pour le même fournisseur](https://www.chromium.org/developers/dns-over-https/#:~:text=Chrome's%20auto%2Dupgrade%20approach%20does%20not%20change%20the%20DNS%20provider).
- Microsoft — [Configurer le DNS over HTTPS sous Windows](https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support#:~:text=Allow%20DoH.%20Queries%20will%20be%20performed%20using%20DoH%20if%20the%20specified%20DNS%20servers%20support%20the%20protocol.).
- EFF — [Le DNS chiffré pourrait aider à combler l'une des plus grandes lacunes d'Internet en matière de confidentialité](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet).