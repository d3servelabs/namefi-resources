---
title: "DNS over HTTPS vs DNS Split-Horizon d'Entreprise : Une Impasse Qui Ne Se Résoudra Pas Toute Seule"
date: '2026-05-04'
language: fr
tags: ['dns', 'doh', 'entreprise', 'sécurité', 'réseau']
authors: ['namefiteam']
draft: false
description: "Le DNS over HTTPS (DoH) protège la confidentialité des utilisateurs en chiffrant les requêtes DNS dans le trafic HTTPS. Le DNS split-horizon d'entreprise, quant à lui, nécessite que le réseau puisse voir ces requêtes. La collision entre ces deux technologies redéfinit la façon dont les réseaux d'entreprise, les navigateurs et les systèmes d'exploitation gèrent la résolution de noms."
ogImage: ../../assets/dns-over-https-vs-enterprise-split-horizon-dns-og.jpg
keywords: ["dns over https", "doh", "dns split horizon", "dns d'entreprise", "dot", "dns chiffré", "dns interne", "résolution de noms", "namefi"]
---

Pendant la majeure partie de l'histoire d'Internet, les requêtes DNS ont circulé en clair sur le port 53. Quiconque se trouvant sur le chemin réseau pouvait les lire, les journaliser et les modifier. C'était un problème de confidentialité que l'IETF a fini par traiter avec deux alternatives chiffrées : [DNS over TLS (DoT, RFC 7858)](https://datatracker.ietf.org/doc/html/rfc7858) en 2016 et [DNS over HTTPS (DoH, RFC 8484)](https://datatracker.ietf.org/doc/html/rfc8484) en 2018.

Le DoH, en particulier, a changé la donne, car il dissimule le DNS *à l'intérieur* d'un flux HTTPS classique. Pour un observateur du réseau, une requête DoH est identique à n'importe quelle autre connexion TLS vers un serveur de contenu. C'est excellent pour les utilisateurs qui naviguent sur le réseau hostile d'un café. C'est beaucoup moins excellent pour une équipe informatique d'entreprise qui a besoin de voir — et d'orienter — chaque requête DNS qui traverse son périmètre.

C'est là toute l'impasse. Les deux camps ont des exigences légitimes et bien définies. Les organismes de normalisation, les éditeurs de navigateurs et les concepteurs de systèmes d'exploitation ont passé la majeure partie d'une décennie à essayer de faire fonctionner les deux en même temps. Le résultat est un ensemble de compromis délicats que quiconque gérant un réseau d'entreprise en 2026 se doit de comprendre.

## Ce que fait réellement le DoH

Un client DoH envoie les requêtes DNS sous forme de requêtes HTTPS POST ou GET, généralement vers `https://dns.google/dns-query`, `https://cloudflare-dns.com/dns-query`, ou un autre résolveur public. La réponse revient sous la forme d'un corps de réponse HTTPS normal. Trois propriétés sont importantes :

- **Chiffrement en transit.** Les observateurs du réseau ne peuvent lire ni le nom de la requête ni la réponse.
- **Serveur authentifié.** Le client vérifie le certificat TLS du résolveur, empêchant ainsi toute usurpation par une attaque de l'homme du milieu (man-in-the-middle).
- **Indiscernable du trafic web.** Port 443, TLS 1.3, modèles SNI normaux. Il n'y a pas de trafic reconnaissable comme du DNS sur lequel on pourrait filtrer.

La troisième propriété est celle qui définit le conflit. Le DoT chiffre également les requêtes, mais il le fait sur un port *dédié* (853), qu'un réseau peut facilement bloquer ou rediriger. Le DoH ne peut pas être bloqué de manière sélective sans bloquer également la navigation web ordinaire.

## Ce que fait réellement le DNS split-horizon d'entreprise

La plupart des grandes organisations utilisent un **DNS split-horizon** (à horizon partagé). Le même nom (`vpn.example.corp`, `git.example.com`, `intranet.example.com`) se résout en différentes adresses IP selon que la requête provient de l'intérieur ou de l'extérieur du réseau.

À l'intérieur du réseau :
- Le résolveur est le DNS interne de l'entreprise, souvent intégré à Active Directory.
- `git.example.com` peut se résoudre en une adresse privée RFC 1918 comme `10.0.4.7`.
- Les zones purement internes (`example.corp`, `example.internal`) peuvent ne pas exister du tout sur l'Internet public.
- Les outils de DLP (prévention des fuites de données) et de sécurité voient chaque requête et peuvent signaler les requêtes DNS vers des domaines connus pour être malveillants.

À l'extérieur du réseau (ou sur un appareil personnel via un réseau Wi-Fi domestique) :
- La même requête est envoyée à un résolveur public.
- `git.example.com` se résout vers l'équilibreur de charge public.
- Les noms purement internes ne se résolvent tout simplement pas.

Ce n'est pas une pratique exotique. C'est la norme pour presque toutes les entreprises de plus de quelques centaines d'employés. Elle repose sur une hypothèse fondamentale : **le terminal (endpoint) utilise le résolveur que le réseau lui indique**, via DHCP, un déploiement de stratégies ou une configuration VPN.

Le DoH brise cette hypothèse. Si le navigateur intègre son propre résolveur, ou si le système d'exploitation contourne le résolveur système, le terminal cesse complètement de consulter le DNS interne. Les noms d'hôtes internes ne se résolvent plus. Les outils de sécurité cessent de voir les requêtes dont ils dépendent pour la détection.

## Comment les navigateurs et les OS ont tenté de gérer cela

Les éditeurs n'ont pas ignoré le problème. Les compromis qui existent aujourd'hui s'empilent et sont un peu ad hoc.

### Le modèle de « mise à niveau automatique » de Chrome

L'implémentation du DoH dans Chrome ne met à niveau le résolveur système vers le DoH que si ce dernier figure dans la liste d'autorisation de Chrome des fournisseurs compatibles DoH (Google, Cloudflare, Quad9, etc.). Si le système est configuré pour utiliser un résolveur d'entreprise interne qui n'est pas sur cette liste, Chrome n'y touche pas. Les politiques d'entreprise peuvent également désactiver complètement le DoH via le paramètre [`DnsOverHttpsMode` de Chrome](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode).

### Le modèle TRR (Trusted Recursive Resolver) de Firefox

L'approche de Firefox a été plus controversée. Dans les régions où Mozilla a activé le DoH par défaut, Firefox utilise un résolveur par défaut comme Cloudflare aux États-Unis, mais il exécute également des heuristiques d'entreprise et de réseau avant d'activer le DoH. Un signal important est le domaine canari `use-application-dns.net` : lorsque le résolveur local renvoie un résultat négatif, Firefox désactive le DNS au niveau de l'application pour les utilisateurs dont le DoH était activé par défaut. Mozilla documente également une nuance importante concernant le split-horizon : les noms purement internes peuvent revenir au DNS ordinaire si la résolution DoH échoue, mais les noms publics qui se résolvent différemment à l'intérieur du réseau nécessitent une politique d'entreprise pour désactiver le DoH.

### Le DNS chiffré d'Apple (iOS 14+, macOS Big Sur+)

Apple permet aux applications et aux profils de configuration d'opter pour le DoH ou le DoT pour l'ensemble du système, tout en respectant les politiques MDM qui imposent un résolveur spécifique. Les appareils gérés par l'entreprise fonctionnent correctement d'emblée.

### Le DoH natif de Windows

Depuis Windows 11, et sur Windows Server 2022 et versions ultérieures, l'OS lui-même peut utiliser le DoH pour le résolveur système. La Stratégie de groupe (Group Policy) permet de définir si le DoH est autorisé, requis ou interdit, et Windows n'active le DoH que vers les serveurs DNS configurés qui sont connus pour le supporter. C'est sans doute le modèle le plus propre : l'équipe de sécurité choisit la politique, l'OS l'applique.

La tendance est claire : **le DoH qui réside dans une seule application (le navigateur) est difficile à contrôler pour le réseau ; le DoH qui réside dans le résolveur au niveau de l'OS est contrôlable via les canaux MDM habituels**. L'IETF et les éditeurs d'OS s'accordent largement sur le fait que la politique appartient à la couche du système d'exploitation.

## Les options réalistes pour une entreprise en 2026

Compte tenu des outils mentionnés ci-dessus, il existe trois stratégies viables, et une quatrième qui ne fonctionnera pas.

### Stratégie A : Tout en interne, DoH bloqué

Déployer une politique qui désactive le DoH dans chaque navigateur, bloque le port 443 vers les points de terminaison DoH publics connus, et force tout le trafic DNS à passer par le résolveur interne. Le résolveur interne lui-même peut communiquer en DoH avec des résolveurs publics en amont, mais à l'intérieur du réseau, tout passe par lui.

C'est l'option la plus prescriptive. Elle préserve parfaitement le split-horizon et donne une visibilité totale aux outils de sécurité. Le coût de cette approche est que vous devez maintenir des listes de blocage pour les nouveaux points de terminaison DoH, et toute application installée par l'utilisateur qui gère son propre DoH (certains clients de messagerie, certains VPN) risque de mal fonctionner.

### Stratégie B : DoH interne

Mettre en place un serveur DoH interne (Cloudflared, AdGuard, ou un serveur DNS Windows avec DoH activé), configurer les terminaux pour qu'ils l'utilisent, et exécuter le split-horizon au niveau de ce serveur DoH interne. Les terminaux bénéficient du DNS chiffré sans que le réseau ne perde sa visibilité.

C'est l'option la plus propre et celle vers laquelle s'orientent la plupart des grandes entreprises. Elle préserve l'avantage en matière de confidentialité (les requêtes sont chiffrées sur le réseau local) tout en conservant l'avantage en matière de sécurité (le résolveur interne voit toujours et peut filtrer chaque requête). Microsoft, Google et Apple prennent tous en charge la configuration au niveau de l'OS pour ce scénario.

### Stratégie C : Domaine canari / signal réseau

Publier le domaine canari de Mozilla. Déployer les politiques appropriées pour Chrome et Edge. Compter sur les navigateurs pour détecter qu'ils sont sur un réseau géré et pour s'en remettre au résolveur système. C'est l'option la plus légère et elle est suffisante pour de nombreuses petites et moyennes organisations.

### Stratégie D (ne fonctionne pas) : « Nous allons simplement ignorer le DoH »

Faire semblant que le conflit n'existe pas, laisser les paramètres par défaut en place et supposer que tout le trafic DNS passe toujours par le résolveur de l'entreprise. C'est la situation la plus courante et elle produit des échecs prévisibles : des développeurs qui signalent que les URL purement internes fonctionnent sous Edge mais pas sous Firefox, des équipes de sécurité qui constatent des failles dans les journaux DNS, des bugs DNS-VPN intermittents qui prennent des heures à diagnostiquer. Le problème ne disparaît pas. Il devient seulement plus difficile à identifier.

## La confidentialité n'est pas le seul enjeu du DoH

Un effet plus subtil du DoH est la centralisation des résolveurs. Lorsqu'un navigateur ou un OS est configuré pour utiliser un résolveur DoH public, une plus grande partie du flux DNS de cet utilisateur peut être dirigée vers un seul opérateur de résolveur. Le mode automatique de Chrome est explicitement conçu pour préserver le fournisseur DNS existant de l'utilisateur dans la mesure du possible, et le déploiement par défaut de Firefox dépend de la région et d'heuristiques, de sorte qu'il ne s'agit pas littéralement de « chaque requête » dans chaque déploiement. Mais le compromis architectural demeure : le DNS chiffré peut déplacer la confiance du réseau local ou du FAI vers un ensemble plus restreint d'opérateurs de résolveurs sélectionnés.

Que ce compromis soit acceptable dépend du modèle de menace. Pour un utilisateur sur le réseau hostile d'un café, centraliser la confiance auprès de Cloudflare est une nette amélioration par rapport au fait de faire confiance au café. Pour une entreprise qui avait déjà une relation contractuelle avec son FAI, cela peut être une régression. L'[EFF écrit sur ce compromis](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet) depuis les premiers déploiements du DoH.

La réponse la plus propre est la même que la Stratégie B ci-dessus : exploitez votre propre résolveur DoH, de sorte que le DNS chiffré n'exige pas de confier l'intégralité du flux de requêtes à un tiers.

## Ce que cela signifie pour les propriétaires de domaines

Si vous gérez un domaine qui est utilisé par des entreprises — une application SaaS, un outil pour développeurs, une API — les faits importants sont les suivants :

- Une partie de vos utilisateurs vous résoudra via un point de terminaison DoH public, en particulier sur des appareils non gérés ou des navigateurs explicitement configurés. Les chaînes CNAME, les délégations de sous-domaines et toutes les astuces DNS que vous utilisez pour la personnalisation doivent fonctionner de la même manière lorsqu'elles sont résolues à partir d'un résolveur public arbitraire que depuis le résolveur interne d'un client.
- Le contournement de la censure basée sur le DNS est un cas d'usage réel du DoH. Si votre domaine est bloqué par le filtre DNS d'un gouvernement (comme l'ont été plusieurs domaines de messagerie chiffrée et de VPN), les utilisateurs vous atteindront via le DoH depuis un résolveur public. La mécanique est la même ; les enjeux politiques sont différents.
- Le split-horizon interne ne devrait jamais résoudre un nom public vers quelque chose d'*uniquement significatif en interne*, d'une manière qui planterait si un utilisateur effectuait accidentellement une requête via DoH. L'échec classique est le domaine purement interne `app.example.com` qui renvoie une adresse IP privée qu'aucun utilisateur DoH ne peut atteindre — puis un employé distant dans un hôtel découvre que le même nom d'hôte est inaccessible et signale un bug. Utilisez une zone purement interne clairement distincte (`app.example.internal`).

## La position de Namefi

Namefi considère le DNS comme le plan de contrôle (control plane) public — l'endroit où le nommage global rencontre les politiques locales. Nos flux de travail DNS supposent que les requêtes peuvent provenir de n'importe quel résolveur, y compris des points de terminaison DoH que nous ne pouvons pas énumérer, et que les noms que nous publions fonctionnent de manière cohérente quoi qu'il arrive. Pour les clients qui gèrent un split-horizon en interne, nous nous situons du côté public : la réponse faisant autorité pour `example.com` est celle que nous fournissons, et ce que le résolveur interne remplace pour les utilisateurs internes relève de leur responsabilité et de la politique de leurs terminaux.

Le point fondamental : le DNS chiffré est là pour durer, tout comme la visibilité en entreprise. La façon de les concilier n'est pas de combattre les standards, mais de déplacer le point d'application des politiques depuis le réseau vers le système d'exploitation. Les organismes de normalisation, Microsoft, Apple, Google et Mozilla ont tous convergé vers cette réponse. Le travail qu'il reste à accomplir est principalement d'ordre opérationnel.

## Sources et lectures complémentaires

- IETF — [DNS over HTTPS, RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) et [DNS over TLS, RFC 7858](https://datatracker.ietf.org/doc/html/rfc7858).
- Chrome Enterprise — [Contrôles des règles DoH (DoH policy controls)](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode).
- Mozilla — [Programme Trusted Recursive Resolver](https://wiki.mozilla.org/Trusted_Recursive_Resolver), [comportement du domaine canari](https://support.mozilla.org/en-US/kb/canary-domain-use-application-dnsnet#:~:text=A%20negative%20result%20will%20be%20a%20signal%20to%20disable%20application%20DNS%2C%20(i.e.%2C%20DoH).), et [guide de repli du split-horizon](https://support.mozilla.org/gu-IN/kb/dns-over-https-doh-faqs#:~:text=If%20Firefox%20fails%20to%20resolve%20a%20domain%20via%20DoH%2C%20it%20will%20fall%20back%20to%20the%20DNS.).
- Chromium — [Modèle de mise à niveau automatique DoH vers le même fournisseur de Chrome](https://www.chromium.org/developers/dns-over-https/#:~:text=Chrome's%20auto%2Dupgrade%20approach%20does%20not%20change%20the%20DNS%20provider).
- Microsoft — [Configurer DNS over HTTPS dans Windows](https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support#:~:text=Allow%20DoH.%20Queries%20will%20be%20performed%20using%20DoH%20if%20the%20specified%20DNS%20servers%20support%20the%20protocol.).
- EFF — [Le DNS chiffré pourrait aider à combler l'une des plus grandes lacunes d'Internet en matière de confidentialité](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet).