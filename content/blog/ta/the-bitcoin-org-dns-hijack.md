---
title: 'Bitcoin.org இணையதளக் கடத்தல்: Bitcoin-ன் முகப்புப் பக்கம் "உங்கள் நாணயங்களை இரட்டிப்பாக்குங்கள்" மோசடியாக மாறிய விதம்'
date: '2026-06-17'
language: ta
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 8
format: case-study
description: '2021 செப்டம்பரில், Cobra என்ற புனைபெயர் கொண்ட இயக்குநரால் நடத்தப்படும் Bitcoin-ன் நீண்டகாலத் தகவல் மையமான Bitcoin.org, தளம் முடக்கப்படுவதற்கு முன் போலியான "உங்கள் Bitcoin-ஐ இரட்டிப்பாக்குங்கள்" பரிசளிப்பு மோசடியைக் காட்டியது. Nameserver மற்றும் WHOIS மாற்றங்களால் பார்வையாளர்கள் DNS ஊடுருவலைச் சந்தேகித்தனர்; ஆனால் பொதுவில் அதன் மூலக் காரணம் உறுதிப்படுத்தப்படவில்லை. சாதாரண டொமைன் உள்கட்டமைப்பைச் சார்ந்திருக்கும் கிரிப்டோ-சார்ந்த தளங்களுக்கு இந்தச் சம்பவம் கற்பிக்கும் பாடங்கள் இவை.'
keywords: ['bitcoin.org', 'bitcoin.org ஊடுருவல்', 'dns கடத்தல்', 'டொமைன் கடத்தல்', 'bitcoin இரட்டிப்பு மோசடி', 'கிரிப்டோ பரிசளிப்பு மோசடி', 'cobra bitcoin.org', 'cloudflare dns', 'namecheap', 'dns பாதுகாப்பு', 'டொமைன் பாதுகாப்பு', 'nameserver கடத்தல்', 'whois மாற்றத் தாக்குதல்']
relatedArticles:
  - /ta/blog/the-curve-finance-dns-hijack/
  - /ta/blog/the-lenovo-com-dns-hijack/
  - /ta/blog/the-myetherwallet-bgp-dns-attack/
  - /ta/blog/the-fox-it-dns-hijack/
  - /ta/blog/the-godaddy-multi-year-breach/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-tokenization/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/name-change-game-change/
relatedGlossary:
  - /ta/glossary/dns/
  - /ta/glossary/registrar/
  - /ta/glossary/icann/
  - /ta/glossary/tld/
  - /ta/glossary/registry/
---

பத்தாண்டுகளுக்கும் மேலாக, “Bitcoin என்றால் என்ன, அதைப் பாதுகாப்பாகப் பயன்படுத்துவது எப்படி?” என்பதற்கான எளிய, எந்த விற்பனையாளரையும் சாராத பதிலை நீங்கள் விரும்பினால், இணையம் உங்களை ஒரே முகவரிக்கு அனுப்பியது: **Bitcoin.org**.

அது ஒருபோதும் exchange ஆக இருந்ததில்லை. எதையும் விற்றதுமில்லை. உலகின் மிகவும் எதிர்ப்புத்தன்மை கொண்ட, நம்பிக்கை தேவையற்ற பணத்துக்கு இருந்த *அதிகாரபூர்வமான* வரவேற்புப் பாய்க்கு மிக நெருக்கமானது அது—[2008 ஆகஸ்ட் 18 அன்று பதிவுசெய்யப்பட்ட](https://en.wikipedia.org/wiki/Bitcoin#:~:text=The%20domain%20name%20bitcoin.org%20was%20registered), genesis block-ஐவிடப் பழமையான தளம்; Bitcoin white paper இருந்த இடம்; கிரிப்டோவின் முதல் விதியைப் புதிதாக வருபவர்களுக்குக் கற்றுக்கொடுத்த இடம்: *உங்கள் வங்கியாக நீங்களே இருங்கள்; உங்கள் சாவிகளை யாரிடமும் நம்பி ஒப்படைக்காதீர்கள்.*

எனவே **2021 செப்டம்பர் 23, வியாழக்கிழமை** நடந்ததில் கொடூரமான முரண்பாடு உள்ளது. கிரிப்டோ உலகில் அதிகம் மீண்டும் மீண்டும் சொல்லப்படும் பாதுகாப்புப் பாடம்—*யாராவது உங்கள் நாணயங்களை இரட்டிப்பாக்குவதாகச் சொன்னால், அது மோசடி*—Bitcoin-ன் சொந்த முன்வாசலிலிருந்து தலைகீழாக ஒலிபரப்பப்பட்டது. சில மணிநேரம், “உங்கள் Bitcoin-ஐ இரட்டிப்பாக்குங்கள்” மோசடியில் விழாதீர்கள் என்று கற்பித்த இணையதளமே அந்த மோசடியாக *மாறியது*. பொதுச் சான்றுகள் டொமைன் வழித்தட அடுக்கைச் சுட்டிக்காட்டின; ஆனால் சம்பவத்திற்குப் பிந்தைய அறிக்கைகளில் துல்லியமான ஊடுருவல் பாதை உறுதியாக நிறுவப்படவில்லை.

## Bitcoin-க்கான குறியீட்டுச் சிறப்பு கொண்ட, நம்பகமான இல்லம்

இந்தக் கடத்தல் ஏன் இவ்வளவு பாதித்தது என்பதைப் புரிந்துகொள்ள, Bitcoin.org எதைக் குறித்தது என்பதை அறிய வேண்டும்.

Bitcoin-க்கு CEO இல்லை, தலைமையகம் இல்லை, அதிகாரபூர்வப் பேச்சாளரும் இல்லை. பல ஆண்டுகளாக அதற்கிருந்தது சமூகத்தால் நடத்தப்பட்ட சில reference தளங்கள்; அவற்றில் Bitcoin.org முதன்மையானது. இது [BTC தொடர்பான மிகப் பழைய இணையதளம்; 13 ஆண்டுகளுக்கு முன்பே பதிவுசெய்யப்பட்டது](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/#:~:text=the%20oldest%20website%20in%20relation%20to) என்று CryptoPotato அழைத்தது. அது [பணப்பை](/ta/glossary/wallet/) பரிந்துரைகள், தொடக்க வழிகாட்டிகள், Satoshi Nakamoto-வின் white paper நகல் ஆகியவற்றை வழங்கியது.

Bitcoin-க்கு ஏற்றவாறே, அதைப் பேய் போன்ற ஒருவர் நடத்தினார். **Cobra** என்ற புனைபெயரால் மட்டுமே அறியப்படும், கொள்கை ரீதியாக அநாமதேயமான இயக்குநர் தளத்தைப் பராமரிக்கிறார். சில மாதங்களுக்கு முன்பு இந்தக் கொள்கை நீதிமன்றத்தில் சோதிக்கப்பட்டது: தன்னை “Satoshi” என்று கூறிய Craig Wright, Bitcoin.org white paper-ஐ அகற்றுமாறு கட்டாயப்படுத்திய UK பதிப்புரிமை வழக்கில் வென்றார்; [UK-இல் Wright-ன் பதிப்புரிமையை Cobra மீறக் கூடாது என்ற injunction](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=injunction%20prohibiting%20Cobra%20from%20infringing) பிறப்பிக்கப்பட்டது. தனது அநாமதேயத்தைக் காத்த Cobra கூறியது கவிதைபோல இருந்தது: [நீதிமன்ற விதிகள் என்னைப் புனைபெயரில் வழக்குத் தொடர அனுமதித்தன; ஆனால் புனைபெயரில் என்னைப் பாதுகாத்துக்கொள்ள முடியவில்லை](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=the%20court%20rules%20allowed%20for%20me%20to%20be%20sued%20pseudonymously).

Bitcoin.org பதின்மூன்று ஆண்டுகளில் அமைதியாகச் சேர்த்த *நம்பிக்கையை*—தலைவரற்ற ஓர் இயக்கத்துக்கு இருக்கக்கூடாத நிறுவனமயமான நம்பிக்கையை—சுமந்தது. அதுவே அதை இலக்காக்கியது. மோசடியை வழங்கும் தளம் அதிக நம்பகமானதாக இருந்தால், மோசடி சிறப்பாகச் செயல்படும். கிரிப்டோவில் Bitcoin-ன் சொந்தப் பெயரைவிட நம்பகமான தளங்கள் வெகு சிலவே.

இங்கே இன்னொரு கூர்மையான முரண்பாடு உள்ளது. Bitcoin.org-ன் மொத்த நெறியும் *சுயக் காவல்*: உங்கள் சாவிகளை வைத்திருங்கள், பாதுகாவலரை நம்பாதீர்கள், அனைத்தையும் சரிபாருங்கள். அந்தப் பாடத்தை முழுமையாக உள்வாங்கியவர், இரட்டிப்பாகத் தருவதாகக் கூறும் அந்நியரின் பணப்பைக்கு நாணயங்களை அனுப்ப மாட்டார். ஆனால் பரிசளிப்பு மோசடி அந்நியரை நம்பச் சொல்லவில்லை—பல ஆண்டுகளாகப் பாதுகாப்பான தொடக்க இடம் எனக் கூறப்பட்ட *Bitcoin.org-ஐயே* நம்பச் சொன்னது. தாக்குதல் பாடத்தைத் தோற்கடிக்கவில்லை; செய்தியாளரைக் கடத்தியது.

## செப்டம்பர் 2021: கடத்தலும் போலிப் பரிசளிப்பும்

![நம்பகமான கடற்கரை கலங்கரை விளக்க டொமைன் கடத்தப்பட்டு, அதன் ஒளிக்கீற்று சிறிய படகுகளை நோக்கி "உங்கள் நாணயங்களை இரட்டிப்பாக்குங்கள்" என்ற போலிப் பலகையை ஒளிரச் செய்யும் வண்ணமயமான கருத்துக் கலை](../../assets/the-bitcoin-org-dns-hijack-01-hijack.jpg)

2021 செப்டம்பர் 23 காலையில், Bitcoin.org பார்வையாளர்கள் பணப்பை வழிகாட்டிகளைப் பார்க்கவில்லை. Bitcoin-ன் மிக நம்பகமான reference தளத்தின் முகப்பில் பதிக்கப்பட்ட, சுத்தமான, அதிகாரபூர்வமாகத் தோன்றிய pop-up modal ஒன்றைக் கண்டனர்.

கிரிப்டோவின் மிகப் பழைய தந்திரம் கடன் வாங்கிய அதிகாரத்தை அணிந்திருந்தது. **Bitcoin Foundation** [சமூகத்துக்குத் திருப்பிக் கொடுக்கிறது](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=giving%20back%20to%20the%20community) என்று அது கூறியது; [முதல் 10,000 பயனர்களுக்கு](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=first%2010%2C000) மட்டுமே சலுகை என்றும், [இந்த முகவரிக்கு Bitcoin அனுப்புங்கள்; இரட்டிப்பு தொகையைத் திருப்பி அனுப்புவோம்!](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=Send%20Bitcoin%20to%20this%20address%2C%20and%20we%20will%20send%20double) என்றும் வாக்குறுதி அளித்தது. QR code இதை எளிதாக்கியது. CoinDesk வர்ணித்தபடி, நடைமுறை எப்போதும் ஒன்றே: [QR code வழியாக ஒரு பணப்பை முகவரிக்கு முதலில் தொகை அனுப்பினால் அதை இரட்டிப்பாக்குவதாகப் பொய் வாக்குறுதி அளிக்கின்றன](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=these%20schemes%20give%20false%20promises%20of%20doubling). விளைவும் ஒன்றே: [பாதிக்கப்பட்டவர்களுக்கு எதுவும் திரும்பக் கிடைக்காது; அனுப்பிய கிரிப்டோவை இழப்பார்கள்](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=Victims%2C%20in%20fact%2C%20receive%20nothing).

தளம் [ஊடுருவப்பட்டுள்ளது; தாக்குதலாளர்கள் எப்படி மோசடிச் சாளரத்தை வைத்தனர் என்பதை தற்போது ஆராய்கிறோம்](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=has%20been%20compromised.%20Currently%20looking%20into%20how%20the%20hackers) என்று Cobra நேரடியாக உறுதிப்படுத்தினார்.

## பார்வையாளர்கள் இழந்தது என்ன

“உங்கள் பணத்தை இரட்டிப்பாக்குங்கள்” மோசடிக்குச் சிலர் நம்பினால் போதும். தற்செயல் இணையதளத்தில் கிட்டத்தட்ட யாரும் நம்ப மாட்டார்கள். *Bitcoin.org-இல்* சிலர் நம்பினர்.

மோசடிப் பணப்பை காலியாக இருக்கவில்லை. அதன் [கடைசியாகப் புதுப்பிக்கப்பட்ட இருப்பு 0.40571238 BTC; அப்போது சுமார் US$17,000](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=0.40571238%20BTC%20or%20approximately%20US%2417%2C000) என்று BleepingComputer தெரிவித்தது. நேரலையில் பதிவு செய்த CoinDesk, [பரிசளிப்பு முகவரிக்கு சிறிய பரிவர்த்தனைகளில் $17,700-க்கும் மேல் வந்தது](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=received%20over%20%2417%2C700%20in%20small%20transactions) என்று குறிப்பிட்டது. அந்த ஆன்-செயின் வரவுகள் முகவரிக்கு நிதி வந்ததைக் காட்டுகின்றன; ஒவ்வொரு வைப்பும் பாதிக்கப்பட்டவரின் இழப்பு என்பதை அவை தனியாக நிரூபிக்காது, ஏனெனில் பரிசளிப்பு நம்பகமாகத் தோன்ற மோசடியாளர்கள் தங்கள் பணப்பைக்கே தொடக்க நிதி அனுப்பக்கூடும்.

உண்மையான பாதிக்கப்பட்டவர்கள் அனுப்பிய தொகைகளில், உறுதிசெய்யப்பட்டதும் பரிவர்த்தனை இறுதியானது: கட்டணத் திரும்பப்பெறுதல், மோசடிப் பிரிவு அல்லது வங்கித் திருப்பம் எதுவும் இல்லை. எனவே தெரிவிக்கப்பட்ட பணப்பைத் தொகையை, சரிபார்க்கப்பட்ட நிகர இழப்பாக அல்லாமல் மோசடி முகவரியின் செயல்பாடாகப் படிப்பதே சரி.

டாலர் தொகை முக்கியப் புள்ளிக்கு அடுத்ததுதான். Bitcoin.org பதின்மூன்று ஆண்டுகள் கட்டியெழுப்பிய ஒன்றுக்கே உண்மையான சேதம் ஏற்பட்டது—எல்லா முகவரிகளிலும் *இந்த* முகவரி நம்புவதற்குப் பாதுகாப்பானது என்ற அனுமானம்.

## இது நடந்த விதம்: DNS மாற்றங்களுக்கான சான்றுகள், ஆனால் உறுதிப்படுத்தப்படாத மூலக் காரணம்

![ஒளிரும் சாலைப் பிரிவில் ஒரு வழிகாட்டிப் பலகையின் அம்பு ரகசியமாக மாற்றப்பட்டு, போக்குவரத்தை நாணய வடிவப் பொன் வலைக்குச் செலுத்த, அசல் பாதுகாப்புப் பாதை இருளில் இருப்பதைக் காட்டும் வண்ணமயமான கருத்துக் கலை](../../assets/the-bitcoin-org-dns-hijack-02-fake-giveaway.jpg)

இதை மற்றொரு [ஃபிஷிங்](/ta/glossary/phishing/) கதையாக இல்லாமல் *Domain Mayday* கதையாக மாற்றும் விவரம் இதுதான்: கிடைத்த சான்றுகள் Bitcoin.org-ன் அசல் சேவையகத்திலிருந்து போக்குவரத்து வழிமாற்றப்பட்டதுடன் ஒத்திருந்தன; ஆனால் பொதுவான சம்பவப் பிந்தைய ஆய்வு ஆரம்ப அணுகல் பாதையை உறுதியாகக் கண்டறியவில்லை.

[ஊடுருவலின்போது என் உண்மையான சேவையகத்துக்கு எந்தப் போக்குவரத்தும் வரவில்லை](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=my%20actual%20server%20didn%27t%20get%20any%20traffic%20during%20the%20hack) என்று Cobra கூறினார். [ஊடுருவல் நேரத்தில் WHOIS தகவல் புதுப்பிக்கப்பட்டது; nameserver-களும் DNS-மும் மாறின](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack) என்றும் பார்வையாளர்கள் தெரிவித்தனர். இவை சேர்ந்து DNS அல்லது ரெஜிஸ்ட்ரார் அடுக்கு கருதுகோளை ஆதரிக்கின்றன: nameserver-களைக் கட்டுப்படுத்தினால் நம்பகமான பெயரைத் தாக்குதலாளரின் சேவையகத்துக்குத் திருப்ப முடியும்; உண்மையான origin-ஐ மாற்ற வேண்டியதில்லை. ஆனால் எந்தக் கணக்கு, வழங்குநர் அல்லது configuration முதலில் ஊடுருவப்பட்டது என்பதை இவை காட்டவில்லை.

Cobra [DNS](/ta/glossary/dns/) அடுக்கையும் சமீபத்திய உள்கட்டமைப்பு மாற்றத்தையும் சந்தேகித்தார். அவர் கூறியபடி: [Bitcoin.org ஒருபோதும் ஊடுருவப்படவில்லை. பின்னர் Cloudflare-க்கு மாறினோம்; இரண்டு மாதங்களில் ஊடுருவப்பட்டோம்.](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=Bitcoin.org%20hasn%27t%20been%20hacked%2C%20ever.%20And%20then%20we%20move%20to%20Cloudflare) [தாக்குதலாளர்கள் DNS-இல் ஏதோ ஒரு குறையைப் பயன்படுத்தியதாகத் தெரிகிறது](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20attackers%20just%20seem%20to%20have%20exploited%20some%20flaw%20in%20the%20DNS) என்பதே அவரது செயல்பாட்டுக் கருதுகோள். Cloudflare மாற்றத்துக்குப் பிந்தைய DNS configuration குறையாக Decrypt இதைத் தெரிவித்தது; அது உறுதிப்படுத்தப்பட்ட forensic முடிவு அல்ல.

மூலக் காரணம் தவறான அமைப்பா, [ரெஜிஸ்ட்ரார்](/ta/glossary/registrar/) அடுக்கு ஊடுருவலா, DNS வழங்குநர் கணக்கா அல்லது வேறு பாதையா என்பது பொதுவில் முழுமையாகத் தீர்மானிக்கப்படவில்லை. [இணையதளக் கடத்தலின் மூலக் காரணம் உறுதிப்படுத்தப்படவில்லை; சிலர் இதை DNS கடத்தல் எனச் சந்தேகித்தனர்](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=root%20cause%20of%20the%20website%20hijack%20remains%20unconfirmed) என்று BleepingComputer வெளிப்படையாகக் குறிப்பிட்டது. இருந்தாலும் சம்பவம் ஆபத்தைக் காட்டுகிறது: நம்பகமான டொமைன் தாக்குதலாளரின் உள்ளடக்கத்துக்குத் தீர்வாகும்போது, பயன்பாட்டு நிரல் அல்லது தனிப்பட்ட சாவி ஊடுருவலுக்கான பொதுச் சான்று இல்லாமலேயே பயனர்கள் பாதிக்கப்படலாம்.

## பதிலும் பின்விளைவுகளும்

தீர்வும், குறிப்பிடத்தக்க வகையில், டொமைன் அடுக்கிலேயே நடந்தது.

உடனடி பதில் டொமைன் அடுக்கில் நடந்தது. ரெஜிஸ்ட்ராரான **Namecheap**, டொமைனைத் தற்காலிகமாக முடக்கியது—BleepingComputer-வின்படி, [நாங்கள் டொமைனைத் தற்காலிகமாக முடக்கியுள்ளோம்](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=We%20have%20temporarily%20disabled%20the%20domain). சிறிது நேரம் பார்வையாளர்களுக்கு மோசடியோ முகப்புப் பக்கமோ கிடைக்கவில்லை; [“இந்தத் தளத்தை அடைய முடியவில்லை”](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=This%20site%20can%27t%20be%20reached) என்று காட்டப்பட்டதாக CoinDesk தெரிவித்தது. Bitcoin-ன் மிக நம்பகமான reference பக்கம் இருண்டது.

சில மணிநேர விசாரணைக்குப் பிறகு, டொமைன் மீண்டும் சரியாகச் சுட்டிக்காட்டப்பட்டு, தளம் ஊடுருவலுக்கு முந்தைய நிலைக்கு மீட்டெடுக்கப்பட்டது. சாளரம் குறுகியது—ஒரு நாள் அல்லது அதற்கும் குறைவு—மேலும் கிரிப்டோ குற்றத் தரத்தில் டாலர் இழப்பு மிதமானது. ஆனால் இது *எந்த* தளம் என்பதால்தான் சம்பவம் கடுமையாகப் பட்டது. “நம்பாதீர்கள், சரிபாருங்கள்” என்று பெருமைப்படும் ஓர் இயக்கம், தனது சொந்த அதிகாரபூர்வ “எங்களை நம்புங்கள்” பக்கம் பயனர்களுக்கு எதிராகச் சரிபார்க்கக்கூடிய விதத்தில் ஆயுதமாக்கப்பட்டதைக் கண்டது.

## கிரிப்டோ-சார்ந்த தளங்களும் DNS-ஐச் சார்ந்திருப்பதிலிருந்து கிடைக்கும் பாடங்கள்

![நம்பகமாகத் தோன்றும் அகன்ற வாயில் ஒளிரும் பொன் நாணயங்கள் விழுந்து, குறுகிய அடியில் இருளுக்குள் மறையும் மோசடிப் புனலைக் காட்டும் வண்ணமயமான படம்](../../assets/the-bitcoin-org-dns-hijack-03-namefi-angle.jpg)

Bitcoin.org கடத்தலின் மிகவும் சங்கடமான பாடம்: **கிரிப்டோ-சார்ந்ததாக இருப்பது கிட்டத்தட்ட எதிலிருந்தும் உங்களைக் காப்பாற்றாது.**

Bitcoin decentralize செய்யப்பட்டதாகும். அதன் ledger-ஐ மாற்றுவது மிகவும் கடினம். சரியாக வைத்திருந்தால் அதன் சாவிகள் உங்களுடையவை மட்டுமே. இவை எதுவும் இணையதளத்தின் *முன்வாசலை*—எந்த e-commerce கடை அல்லது உள்ளூர் bakery போலவே அதே DNS, ரெஜிஸ்ட்ரார், [nameserver](/ta/glossary/nameserver/) அமைப்பில் பயணிக்கும் சாதாரண டொமைன் பெயரை—பாதுகாக்கவில்லை. [Blockchain](/ta/glossary/blockchain/) தொடப்படவில்லை; பொதுத் தளத்தின் பாதை அப்படியில்லை.

இதிலிருந்து சில நீடித்த பாடங்கள் கிடைக்கின்றன:

1. **உங்கள் டொமைன் உங்கள் தாக்குதல் பரப்பின் ஒரு பகுதி—பல நேரங்களில் *மிகப் பெரிய* பகுதி.** குறைபாடற்ற நிரல் எழுதலாம், சாவிகளை இணையத் தொடர்பில்லாத சேமிப்பில் வைக்கலாம், எல்லா சேவையகங்களையும் உறுதிப்படுத்தலாம்; ஆனால் nameserver அல்லது ரெஜிஸ்ட்ரார் கணக்கைக் கட்டுப்படுத்தும் தாக்குதலாளர் உங்களை முழுமையாகப் போலியாக நடிக்க முடியும். பெயரே முன்வாசல்; கடத்தப்பட்ட பெயர் அந்நியரை அதற்குப் பதிலளிக்க வைக்கிறது.

2. **DNS/ரெஜிஸ்ட்ரார் மாற்றங்கள் அமைதியானவை, அதிக ஆற்றல் கொண்டவை.** [Nameserver-களும் DNS-மும் மாறியபோது](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=nameservers%20%2B%20DNS%20changed), பெரும்பாலான கண்காணிப்பு உடனடியாகக் கண்டுபிடிக்கும் வகையில் எதுவும் “உடையவில்லை”—தளம் தொடர்ந்து ஏற்றப்பட்டது, ஆனால் தவறான இடத்திலிருந்து. ரெஜிஸ்ட்ரார் பூட்டு, [registry lock](/ta/glossary/registry-lock/), [DNSSEC](/ta/glossary/dnssec/), ரெஜிஸ்ட்ரார்/DNS வழங்குநர் கணக்குகளின் கடுமையான access control ஆகியவை விருப்பமான hygiene அல்ல; அனைவரும் மறக்கும் கதவின் பூட்டுகள்.

3. **உண்மையில் திருடப்படுவது நற்பெயர்தான்.** தாக்குதலாளர்களுக்கு Bitcoin.org-ன் $17,000 சேவையகம் வேண்டியதில்லை; பதின்மூன்று ஆண்டுகள் சேர்த்த அதன் *நம்பகத்தன்மையை* சில மணிநேரம் கடன் வாங்கி பழைய மோசடியை நம்பத்தகுந்ததாக மாற்ற விரும்பினர். உங்கள் டொமைன் அதிகம் நம்பப்பட்டால், அதைக் கடத்துவது அதிக மதிப்புடையது—அது எங்கே சுட்டுகிறது என்பதை யார் மாற்ற முடியும் என்பதில் நீங்கள் அதிகக் கவனமாக இருக்க வேண்டும்.

4. **“நம்பிக்கை தேவையற்ற” உள்கட்டமைப்பும் நம்பகமான பெயர்களின் மீது தங்கியுள்ளது.** இடைத்தரகர்களை அகற்றுவதற்கான சிறந்த எடுத்துக்காட்டான Bitcoin கூட, hierarchical, இடைத்தரகு கொண்ட, மாற்றக்கூடிய DNS வழியாகவே பயனர்களை அடைகிறது. பணத்தை decentralize செய்வது முன்வாசலை decentralize செய்யாது.

5. **பாதுகாப்பின் அழகைவிடக் கண்டறிதலின் வேகம் மேலானது.** சமூகம் மோசடியை விரைவாகக் கண்டதும், ரெஜிஸ்ட்ரார் சில மணிநேரங்களில் டொமைனை நிறுத்தியதும் Bitcoin.org மிதமான இழப்புடன் மீள உதவின. கடத்தப்பட்ட பெயர் தாக்குதலாளருக்குத் தொடர்ந்து தீர்வாகும் நேரம் அதிகரிக்கும்போது, இழப்பும் நற்பெயர்ச் சேதமும் பெருகும். உங்கள் பெயரின் கட்டுப்பாடு அல்லது வழித்தடம் மாறும் *அந்தக் கணமே* அறிதல், எந்தத் தனி நிலையான lock-ஐவிடவும் மதிப்புடையது.

## Namefi-யின் பார்வை

Bitcoin.org சம்பவம் *கட்டுப்பாடு மற்றும் சரிபார்ப்புத் தன்மை* குறித்த சிக்கல். Blockchain உறுதியாக இருந்தது; பொதுத் தளப் பாதை மாற்றப்பட்டது. Nameserver அல்லது DNS பதில்கள் எதிர்பாராத விதமாக மாறும்போது—[ஊடுருவல் நேரத்தில் WHOIS தகவல் புதுப்பிக்கப்பட்டது](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack) என்று பார்வையாளர்கள் தெரிவித்தனர்—மற்ற அடுக்குகள் எவ்வளவு வலுவாக இருந்தாலும் நம்பிக்கை மறையலாம்.

ஆதரிக்கப்படும் டொமைன்களுக்கு [Namefi](https://namefi.io) ஒரு டோக்கன்-கட்டுப்பாட்டு அடுக்கைச் சேர்க்கிறது; பணப்பை உரிமையும் டோக்கன் மாற்றங்களும் [ஆன்-செயினில்](/ta/glossary/on-chain/) பொதுவாகத் தணிக்கை செய்யக்கூடியவை. அது nameserver அல்லது DNS பதிவு மாற்றங்களை ஆன்-செயின் நிகழ்வுகளாக **மாற்றாது**. Namefi-யின் [DNS வழிகாட்டி விளக்குவதுபோல்](https://namefi.io/r/en/blog/dns-on-tokenized-domains), DNS பெயர்த் தீர்மானமும் டோக்கனும் தனித்தனி அடுக்குகள்; DNS மாற்றங்களுக்கு இன்னும் ரெஜிஸ்ட்ரார்/DNS வழங்குநர் கட்டுப்பாடும் கண்காணிப்பும் தேவை. டோக்கன் நகர்ந்ததா என்பதை டோக்கன் வரலாறு கூறும்; வழித்தடம் மாறியதா என்பதை DNSSEC, பதிவகம் அல்லது ரெஜிஸ்ட்ரார் பூட்டுகள், MFA, எச்சரிக்கைகள், வழங்குநர் தணிக்கைப் பதிவுகள் கையாளும்.

நீங்கள் சரிபார்ப்பதை நிறுத்தி நம்பத் தொடங்கும் தருணமே ஆபத்தானது என்று Bitcoin.org பதின்மூன்று ஆண்டுகள் உலகுக்குக் கற்றுக்கொடுத்தது. 2021 செப்டம்பரில் சில மணிநேரம், அதன் சொந்த டொமைன் அந்தப் பாடத்தை கடினமாக நிரூபித்தது. மற்ற அனைவருக்குமான பாடம் எளிது: இணையத்தில் உங்கள் டொமைனே உங்கள் அடையாளம்—அதற்குப் பின்னுள்ள சாவிகளைப் போலவே பெயரையும் பாதுகாப்பாக வைத்திருங்கள்.

## ஆதாரங்களும் மேலதிக வாசிப்பும்

- BleepingComputer — [Bitcoin.org hackers steal $17,000 in 'double your cash' scam](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/)
- CoinDesk — [Bitcoin.org Website Inaccessible After Being Hacked by Apparent Giveaway Scam](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/)
- Bitcoin.com News — [Hackers Compromise Web Portal Bitcoin.org — DNS Hijack Replaces Site With BTC Doubler Scam](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/)
- Decrypt — [Bitcoin.org Compromised, Fraudulent Crypto Giveaway Advertised](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/)
- Cointelegraph — [Bitcoin.org goes offline after suffering scam attack](https://cointelegraph.com/news/bitcoin-org-goes-offline-after-suffering-scam-attack)
- CryptoPotato — [BitcoinOrg Hacked: Giveaway Scam Promising Users to Double Their BTC](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/)
- NewsBTC — [Bitcoin.org Hacked By Scammers For A Few Minutes. Someone Sent Them 0.4 BTC](https://www.newsbtc.com/news/bitcoin-org-hacked-by-scammers/)
- CoinDesk — [UK Court Orders Bitcoin.org to Remove White Paper Following Craig Wright Lawsuit](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit)
- Wikipedia — [Bitcoin (history of the bitcoin.org domain)](https://en.wikipedia.org/wiki/Bitcoin)
- Namefi — [DNS on Tokenized Domains](https://namefi.io/r/en/blog/dns-on-tokenized-domains) (DNS மற்றும் ஆன்-செயின் டோக்கன் தனித்தனி அடுக்குகள்)
