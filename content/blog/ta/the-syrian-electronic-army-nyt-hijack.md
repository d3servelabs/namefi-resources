---
title: 'Domain Mayday EP10: Phishing-க்கு ஆளான reseller வழியாக Syrian Electronic Army NYTimes.com-ஐ எவ்வாறு முடக்கியது'
date: '2026-06-17'
language: ta
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['arivu-iyandhiran']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 23
format: case-study
description: 'ஆகஸ்ட் 27, 2013 அன்று, Syrian Electronic Army, Melbourne IT-ன் reseller ஒருவரை phishing செய்து, nytimes.com மற்றும் Twitter-ன் டொமைன்களுக்கான DNS பதிவுகளை மாற்றி எழுதி, New York Times-ஐ பல மணி நேரம் offline ஆக்கியது. Registrar சங்கிலியின் பலவீனமான இணைப்பு, ஒரு செய்தித்தாளின் முன்வாசல் தோல்வியாக எப்படி மாறியது — registry locks எதை மாற்றியிருக்கும் — என்பது குறித்த ஆழமான ஆய்வு.'
keywords: ['nytimes.com hack', 'syrian electronic army', 'melbourne it', 'dns கடத்தல்', 'டொமைன் கடத்தல்', 'registrar பாதுகாப்பு', 'reseller phishing', 'registry lock', 'dns பதிவுகள்', 'டொமைன் பெயர்ச்சேவையகத் தாக்குதல்', 'twitter dns 2013', 'டொமைன் பாதுகாப்பு', 'serverupdateprohibited']
relatedArticles:
  - /ta/blog/the-fox-it-dns-hijack/
  - /ta/blog/the-lenovo-com-dns-hijack/
  - /ta/blog/the-godaddy-multi-year-breach/
  - /ta/blog/the-panix-com-domain-hijack/
  - /ta/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-basics/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/name-change-game-change/
relatedGlossary:
  - /ta/glossary/registrar/
  - /ta/glossary/dns/
  - /ta/glossary/icann/
  - /ta/glossary/registry/
  - /ta/glossary/tld/
---

ஒரு செய்தித்தாளின் டொமைன் பெயர் அதன் முன்வாசல். நீங்கள் `nytimes.com` என்று தட்டச்சிடும்போது, கண்ணுக்குத் தெரியாத ஒரு சங்கிலியை — domain registry, ஒரு [registrar](/ta/glossary/registrar/), சில நேரங்களில் அந்த registrar-க்குக் கீழே ஒரு [reseller](/ta/glossary/reseller/) — நம்பி, அது உண்மையான செய்தியறைக்கே உங்களை அழைத்துச் செல்லும் என்றும் வேறு எங்கும் அழைத்துச் செல்லாது என்றும் எதிர்பார்க்கிறீர்கள். வழக்கமான நாளில் அந்தச் சங்கிலியைப் பற்றி நீங்கள் நினைப்பதே இல்லை. ஆகஸ்ட் 27, 2013 அன்று அது முறிந்தது; *The New York Times*-ன் முன்வாசலுக்குச் சென்ற பல மில்லியன் வாசகர்கள், அதை வேறு யாருடைய வாசலோ மாற்றியிருப்பதைக் கண்டனர்.

அந்த வேறு தரப்பு, 2013 முழுவதும் மேற்கத்திய ஊடக நிறுவனங்களை ஒவ்வொன்றாகக் குறிவைத்த Assad ஆதரவு hacker கூட்டமைப்பான **Syrian Electronic Army** (SEA). இந்த முறை அவர்கள் ஒரு கட்டுரையை மட்டும் deface செய்யவோ content management system-க்குள் ஊடுருவவோ இல்லை. ஒரு டொமைன் எங்கு சுட்டிக்காட்டுகிறது என்பதைத் தீர்மானிக்கும் **DNS பதிவுகளுக்குள்** — இன்னும் ஓர் அடுக்கு ஆழமாக — சென்று, உலகில் மிக அதிகமாகப் படிக்கப்படும் செய்தித் தளங்களில் ஒன்றின் முகவரியைச் சில மணி நேரங்களுக்கு அவர்கள் கட்டுப்படுத்தினர்.

## ஒரு டொமைன் முன்வாசல்; ஆனால் அதன் பூட்டு உங்கள் கட்டுப்பாட்டில் இல்லை

*The New York Times* போன்ற நிறுவனம் ஒரு டொமைனைப் பதிவு செய்யும்போது, "இது யாருக்குச் சொந்தம், எங்கு சுட்டிக்காட்டுகிறது" என்பதற்கான அதிகாரப்பூர்வப் பதிவு [registry](/ta/glossary/registry/)-யிடம் இருக்கும் (`.com`-க்கு அது Verisign); அது ஒரு **registrar** வழியாக நிர்வகிக்கப்படுகிறது. பெரிய registrar-கள் **reseller**-கள் வழியாகவும் விற்கின்றனர் — டொமைன் சேவைகளை மறுவிற்பனை செய்யும் சிறிய நிறுவனங்களான அவை, registrar-ன் அமைப்புகளுக்கான தங்களது சொந்த login-ஐ வைத்திருக்கின்றன.

அந்த அடுக்கமைப்பு வசதியானது. அதே நேரத்தில், மிகவும் பலவீனமான இணைப்பே முழுச் சங்கிலியின் பாதுகாப்பை நிர்ணயிக்கும் ஒரு நம்பிக்கைச் சங்கிலியும் அது. [Registrant](/ta/glossary/registrant/), registrar ஊழியர் அல்லது reseller என அந்தச் சங்கிலியில் உள்ள *யாராவது ஒருவராக* தாக்குதலாளர் authenticate செய்ய முடிந்தால், registrar-ன் அமைப்புகள் வடிவமைப்பின்படியே அவரை சட்டப்பூர்வ உரிமையாளராகக் கருதும். Melbourne IT-ன் சொந்த chief executive, தோல்வி ஏற்பட்ட விதத்தை அழுத்தமான ஒரே வாக்கியத்தில் கூறினார்: ["அவர்கள் முன்வாசல் வழியாகவே உள்ளே வந்தனர்"](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door) என்று AP-யிடம் தெரிவித்தார். செல்லுபடியாகும் username மற்றும் password உங்களிடம் இருந்தால், அங்கீகரிக்கப்பட்ட உரிமையாளர் நீங்கள்தான் என்று அமைப்பு கருதுகிறது. பிரச்சினை முழுவதையும் சுருக்கமாகச் சொன்னால் இதுதான்.

## ஆகஸ்ட் 27, 2013: nytimes.com வேறு இடத்தைச் சுட்டிக்காட்டிய நாள்

![மாபெரும் செய்தித்தாள் முன்வாசலின் பெயர்ப்பலகை கழற்றப்பட்டு வேறொரு வாசலின் மேல் மீண்டும் பொருத்தப்படுவதையும், ஒளிரும் சிவப்பு routing அம்புகள் வாசகர்கள் கூட்டத்தைப் பாதைமாற்றி இருண்ட பக்கச்சந்துக்குள் இழுப்பதையும் காட்டும் துடிப்பான வண்ணமயமான கருத்தோவியம்](../../assets/the-syrian-electronic-army-nyt-hijack-01-hijack.jpg)

செவ்வாய்க்கிழமை பிற்பகலில் வாசகர்களால் *Times*-ஐ அணுக முடியாமல் போனது. [New York Times இணையதளம் "சில பயனர்களுக்கு இருண்டுவிட்டது"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=gone%20dark%20for%20some%20users) என்று ABC News தெரிவித்தது; தனது domain registrar மீதான தாக்குதலுக்குப் பிறகு [தளம் "செவ்வாய்க்கிழமை பிற்பகலில் வாசகர்களுக்குக் கிடைக்கவில்லை"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=unavailable%20to%20readers%20on%20Tuesday%20afternoon) என்று செய்தித்தாளும் உறுதிப்படுத்தியது. இது ஒரு கணநேரத் தடங்கல் அல்ல. செவ்வாய்க்கிழமை ["பல மணி நேரம் பார்வையாளர்களுக்கு வெற்றுத் திரைகளே தெரிந்தன"](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=greeted%20with%20blank%20browser%20screens%20for%20several%20hours) என்று Christian Science Monitor தெரிவித்தது — நிலைமையை மேலும் மோசமாக்கும் வகையில், தளம் செயலிழந்தது ["அந்த மாதத்தில் இரண்டாவது முறை"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=second%20time%20this%20month) ஆகும்.

உண்மையில் நடந்தது registrar மட்டத்தில் ஒரு **DNS hijack**. `nytimes.com`-ஐ ஓர் [IP address](/ta/glossary/ip-address/)-ஆக மொழிபெயர்க்கும் பதிவுகளைத் தாக்குதலாளர்கள் அணுகி மாற்றி எழுதினர். சம்பவம் குறித்த Wikipedia பதிவின்படி, [`NYTimes.com`-ன் "DNS, 'Hacked by SEA' என்ற செய்தியைக் காட்டிய ஒரு பக்கத்துக்குத் திருப்பிவிடப்பட்டது"](https://en.wikipedia.org/wiki/Syrian_Electronic_Army#:~:text=had%20its%20DNS%20redirected%20to%20a%20page%20that%20displayed%20the%20message). முன்வாசல் வேறொரு வாசலின் மீது மீண்டும் பொருத்தப்பட்டிருந்தது.

அந்தக் கணக்கில் இருந்த ஒரே இலக்கு *Times* அல்ல. நிகழ்நேரத்தில் செய்தி வெளியிட்ட TechCrunch, ["The New York Times மற்றும் Twitter ஆகிய இரண்டின் name servers-உம் registrar Melbourne IT வழியாகப் பதிவு செய்யப்பட்டிருப்பதாகத் தெரிகிறது"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=name%20servers%20appear%20to%20have%20been%20registered%20through%20the%20registrar%20Melbourne%20IT) என்றும், [Twitter படங்களையும் avatars-ஐயும் வழங்கும் `twimg.com` டொமைனிலும், SEA கட்டுப்பாட்டில் இருப்பதாகத் தோன்றிய servers-ஐச் சுட்டிக்காட்டும் மாற்றங்கள் தெரிந்தன](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=which%20serves%20up%20Twitter%20images%20and%20avatars) என்றும் கண்டறிந்தது. Twitter-ன் முதன்மைத் தளம் பெரும்பாலும் பாதிப்பின்றி இயங்கியது; ஆனால் அதன் image-and-avatar டொமைன் தடுமாறியது — சில பயனர்களுக்குப் படங்கள் சிறிது நேரம் தெரியாமல் போகும் அளவுக்கு.

## பாதிப்பு: பல மணி நேர இருள், நம்ப முடியாத ஒரு redirect

ஒரு செய்தி நிறுவனத்துக்கு, கடத்தலின் விலை இழந்த pageviews-ஆல் மட்டும் அளவிடப்படுவதில்லை. அது நம்பிக்கையால் அளவிடப்படுகிறது. சேவைத் தடங்கல் நீடித்த நேரத்தில் `nytimes.com`-ஐ அணுகிய அனைவரும் தாக்குதலாளர் தேர்ந்தெடுத்த இடத்துக்கே வழிமாற்றப்பட்டனர். செய்தித்தாளின் சொந்த chief information officer Mark Frons, இந்த இடையூறு ["Syrian Electronic Army அல்லது தாங்கள்தான் அது என்று மிகவும் தீவிரமாகக் காட்ட முயன்ற யாரோ ஒருவர் நடத்திய தீங்கிழைக்கும் வெளிப்புறத் தாக்குதலின் விளைவு"](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=was%20the%20result%20of%20a%20malicious%20external%20attack) என்று ஊழியர்களிடம் தெரிவித்தார் — டொமைன் செய்தித்தாளின் கட்டுப்பாட்டுக்கு வெளியே இருந்தபோது மின்னஞ்சலைக் கவனமாகப் பயன்படுத்துமாறும் எச்சரித்தார்.

கடத்தப்பட்ட DNS பதிவு உண்மையில் என்ன செய்ய உதவுகிறது என்று சிந்தித்துப் பாருங்கள். பெயர் எங்கு resolve ஆக வேண்டும் என்பதைத் தாக்குதலாளர் கட்டுப்படுத்துகிறார்; அதனால் அவர்கள் செய்ததுபோல் defacement பக்கத்தை வழங்க முடியும். அதே எளிதில் நம்பத்தகுந்த போலி login பக்கத்தை வழங்கவோ, credentials-ஐச் சேகரிக்கவோ, traffic-ஐ இடைமறிக்கவோ முடியும். Defacement சத்தமாகவும் வெளிப்படையாகவும் இருக்கும். *அமைதியான* DNS கடத்தல் இன்னும் ஆபத்தானது — இரண்டையும் சாத்தியமாக்குவது ஒரே பலவீனம்தான். இதே சம்பவத்தில் Huffington Post UK-ன் டொமைனும் சிக்கியது; இது ஒரே ஒரு செய்தியறைக்கு எதிரான தனித்த prank அல்ல, registrar-account compromise என்பதைக் காட்டுகிறது.

## அது எப்படி நடந்தது: செய்தித்தாளை அல்ல, reseller-ஐ phish செய்தல்

![Phishing செய்யப்பட்ட தங்கச் சாவி, ஒளிரும் routing dial-கள் கொண்ட கட்டுப்பாட்டு அறைக் கதவுக்குள் நழுவிச் செல்வதையும், போலி மின்னஞ்சல் உறை பூட்டுக்குள் கரையும்போது நிழலான ஒரு கை முகவரி அம்புகளின் ஒளிரும் ledger-ஐ மாற்றி எழுதுவதையும் காட்டும் துடிப்பான வண்ணமயமான கருத்தோவியம்](../../assets/the-syrian-electronic-army-nyt-hijack-02-reseller-phish.jpg)

சற்று நிதானமாகச் சிந்திக்க வேண்டிய பகுதி இதுதான்: SEA ஒருபோதும் *The New York Times*-க்குள் ஊடுருவ வேண்டியிருக்கவில்லை. அவர்கள் செய்தித்தாளின் servers-ஐயோ CMS-ஐயோ தொடவில்லை. Registrar-க்குக் *கீழே* இருந்த சங்கிலியைத் தாக்கினர்.

Melbourne IT-ன் அமெரிக்காவைச் சேர்ந்த reseller ஒருவருக்கு அனுப்பப்பட்ட **spear-phishing email** தான் நுழைவுப் புள்ளி. The Next Web தெரிவித்தபடி, [login விவரங்களைப் பெற SEA phishing முறைகளைப் பயன்படுத்தியதை Melbourne IT "உறுதிப்படுத்தியது"](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter#:~:text=used%20phishing%20tactics%20to%20get%20hold%20of%20the%20log) — reseller நிறுவனத்தின் ஊழியர்கள் தங்கள் email credentials-ஐ ஒப்படைக்க ஏமாற்றப்பட்டனர்; பின்னர் தாக்குதலாளர்கள் registrar login-களைத் தேடி அந்த mailboxes-ஐ ஆராய்ந்தனர். அதற்குப் பிறகு எல்லாம் எளிதாக இருந்தது: [Melbourne IT reseller ஒருவரின் credentials (username மற்றும் password), Melbourne IT-ன் அமைப்புகளில் உள்ள reseller கணக்கை அணுகப் பயன்படுத்தப்பட்டன](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=credentials%20of%20a%20Melbourne%20IT%20reseller); உள்ளே நுழைந்த பிறகு, [தாக்குதலாளர்கள் *Times*-க்கானவை உட்பட "பல டொமைன் பெயர்களின் DNS பதிவுகளை மாற்றினர்"](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=changed%20the%20DNS%20records%20of%20several%20domain%20names).

TechCrunch-ன் விவரிப்பும் இதே அளவுக்கு நேரடியானது: [அந்த reseller கணக்கிலிருந்த "பல டொமைன் பெயர்களின் DNS பதிவுகள் மாற்றப்பட்டன — `nytimes.com` உட்பட"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=DNS%20records%20of%20several%20domain%20names%20on%20that%20reseller%20account%20were%20changed).

Registrar சங்கிலி மீதான தாக்குதல்களை இவ்வளவு கவர்ச்சியாக்கும் asymmetry இதுதான். *Times* தனது சொந்த infrastructure-ஐ எவ்வளவு கடுமையாகப் பாதுகாத்திருந்தாலும் அது பயனளித்திருக்காது; ஏனெனில் பாதிப்புக்குள்ளான கணக்கு செய்தியறையிலிருந்து பல படிகள் விலகியிருந்த மூன்றாம் தரப்பு reseller-க்குச் சொந்தமானது. ஒரு சிறிய நிறுவனத்தின் சில ஊழியர்களுக்கு எதிரான ஒரே spear-phish, பல மில்லியன் பேர் படிக்கும் செய்தித்தாளைத் திசைமாற்றப் போதுமானதாக இருந்தது.

## எதிர்வினையும் பின்விளைவுகளும்

நடந்ததை Melbourne IT புரிந்துகொண்டதும், சரிசெய்தல் நேரடியானதாக இருந்தது — *registrar-ஐ நீங்கள் கட்டுப்படுத்தினால்* இந்தத் தாக்குதல்களைத் திருப்புவது எவ்வளவு எளிது என்பதையும் அது காட்டுகிறது. நிறுவனம் சரியான settings-ஐ மீட்டமைத்தது: மாற்றப்பட்ட DNS பதிவுகளை [முந்தைய நிலைக்கு மாற்றி, மேலும் மாற்றப்படாமல் அவற்றை "lock" செய்தது](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=reverted%20the%20altered%20DNS%20records). Compromise ஆன reseller கணக்கின் password-ஐ மாற்றி, ஊடுருவலைக் கண்டறிய logs-ஐ எடுத்தது. *Times* புதன்கிழமை அதிகாலைக்குள் சேவையை மீட்டது.

ஆனால் இந்தச் சம்பவம் குறித்த மிகப் பயனுள்ள விவரம், சேதம் ஏன் அந்த அளவுடன் நின்றது என்பதே. அதே reseller கணக்கில் இருந்த சில டொமைன்கள் பாதிக்கப்படவே இல்லை — ஏனெனில் அவற்றின் உரிமையாளர்கள் வலுவான பாதுகாப்பை இயக்கியிருந்தனர். Melbourne IT-ன் சொந்த வார்த்தைகளில், ["முக்கியப் பணிக்கான பெயர்களுக்கு, .com உட்பட domain registries வழங்கும் கூடுதல் registry lock வசதிகளை domain name owners பயன்படுத்துமாறு பரிந்துரைக்கிறோம் — reseller கணக்கில் குறிவைக்கப்பட்ட சில டொமைன் பெயர்களில் இந்த lock வசதிகள் செயல்பாட்டில் இருந்ததால் அவை பாதிக்கப்படவில்லை"](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=For%20mission%20critical%20names%20we%20recommend%20that%20domain%20name%20owners%20take%20advantage%20of%20additional%20registry%20lock).

Registry lock, டொமைனை ஒரு நிலையில் வைக்கிறது — `serverUpdateProhibited` போன்ற flag-களாக அதை [WHOIS](/ta/glossary/whois/)-இல் காணலாம் — அதில் இன்னும் கடுமையான out-of-band செயல்முறை பின்பற்றப்படாவிட்டால் registry மாற்றங்களை மறுக்கும். அக்கால domain-industry பார்வையாளர்கள் குறிப்பிட்டபடி, Twitter-ன் பதிவுகளில் அந்த வகையான [Verisign-lock நிலை](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/#:~:text=serverUpdateProhibited) இருந்தது. Phishing செய்யப்பட்ட reseller password மட்டும் ஒரு [registry lock](/ta/glossary/registry-lock/)-ஐத் தாண்டப் போதாது — "பல மணி நேரம் செயலிழப்பு" என்பதற்கும் "எந்தப் பாதிப்பும் இல்லை" என்பதற்கும் இடையிலான கோடு அந்த ஒரே configuration தேர்வாகும்.

## Registrar மற்றும் reseller சங்கிலிகளும் registry lock-களும் கற்பிக்கும் பாடங்கள்

தோல்விச் சங்கிலியின் ஒவ்வொரு இணைப்பும் தெளிவாகத் தெரிவதால், ஆகஸ்ட் 27 கடத்தல் கிட்டத்தட்ட முழுமையான கற்பித்தல் case ஆகும்.

1. **உங்கள் டொமைனை மாற்றக்கூடிய மிகவும் பலவீனமான கணக்கின் அளவுக்கே அதன் பாதுகாப்பும் இருக்கும்.** அதில் உங்கள் registrar-ன் ஊழியர்களும் அவர்களுக்குக் கீழே உள்ள reseller-களும் அடங்குவர் — அவர்களில் யாரையும் நீங்கள் நேரடியாகக் கட்டுப்படுத்துவதில்லை. *Times* தனது சொந்த servers-இல் எந்தத் தவறும் செய்யவில்லை; compromise பல படிகள் தள்ளி நடந்தது.
2. **Phishing, firewalls-ஐ வெல்கிறது.** எந்த exotic exploit-உம் பயன்படுத்தப்படவில்லை. சில reseller ஊழியர்களுக்கு அனுப்பப்பட்ட போலி email, registrar-ன் அமைப்புகள் முழுமையாக அங்கீகரிக்கப்பட்டவை என்று ஏற்றுக்கொண்ட credentials-ஐ வழங்கியது. ["அவர்கள் முன்வாசல் வழியாகவே உள்ளே வந்தனர்."](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door)
3. **உண்மையில் முக்கியமான கட்டுப்பாடு registry lock.** [கூடுதல் registry lock வசதிகள்](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=additional%20registry%20lock%20features) இருந்த டொமைன்கள் "அதனால் பாதிக்கப்படவில்லை." எந்த mission-critical டொமைனுக்கும் registry lock (மேலும் registrar-lock மற்றும் registrar கணக்கில் 2FA) விருப்பப் பாதுகாப்பு அல்ல — அது அடிப்படை.
4. **DNS மாற்றங்கள் சக்திவாய்ந்தவை; வேகமானவை.** Name-server அல்லது A record ஒன்றை ஒரே முறை மாற்றுவது ஒரு brand முழுவதையும் உடனடியாகத் திசைமாற்றுகிறது. Compromise ஆன ஒரே கணக்கின் blast radius, அது தொடக்கூடிய ஒவ்வொரு டொமைனும் ஆகும்.
5. **உங்கள் பதிவுகளை நீங்களே கண்காணியுங்கள்.** WHOIS மற்றும் DNS monitoring, அங்கீகரிக்கப்படாத மாற்றத்தைச் சில நிமிடங்களில் சுட்டிக்காட்டியிருக்கும். எதிர்பாராத name-server மாற்றத்தை எவ்வளவு விரைவில் கவனிக்கிறீர்களோ, outage அவ்வளவு சிறியதாக இருக்கும்.

## Namefi கோணம்

![சரிபார்க்கக்கூடிய, சேதப்படுத்த கடினமான டொமைன் ownership-ஐக் காட்டும் வண்ணமயமான ஓவியம் — பச்சைக் கேடயத்தால் பாதுகாக்கப்பட்ட ஒரு டொமைன் அட்டை, பச்சை Namefi token மற்றும் DNS தொடர்ச்சி](../../assets/the-syrian-electronic-army-nyt-hijack-03-namefi-angle.jpg)

SEA கடத்தல் ஒரு **DNS-administration authority** பிரச்சினை. Phishing செய்யப்பட்ட reseller credentials, Melbourne IT-ன் அமைப்புகள் ஏற்றுக்கொண்ட மாற்றங்களைத் தாக்குதலாளர்கள் சமர்ப்பிக்க அனுமதித்தன. Registry locks, out-of-band confirmation, least privilege மற்றும் monitoring ஆகியவை அந்தக் குறிப்பிட்ட DNS மற்றும் registry operations-க்கான தடையை உயர்த்துகின்றன.

[Namefi](https://namefi.io), [on-chain](/ta/glossary/on-chain/) [domain ownership](/ta/glossary/domain-ownership/) மற்றும் token transfer-க்கான ஓர் அடுக்கை வழங்குகிறது. அதனால் tokenized ownership state-ஐத் தனித்தனியாக audit செய்ய முடியும்; ஆனால் DNS மற்றும் registry அடுக்குகள் தனியாகவே இருக்கின்றன. Compromise ஆன reseller அல்லது registrar பாதை, on-chain ownership token மாறாமல் இருக்கும்போதே nameservers அல்லது மற்ற registry தரவை மாற்ற முடியும்; tokenization மட்டும் *Times* redirect-ஐத் தடுத்திருக்காது, அது நடந்ததை அவசியம் வெளிப்படுத்தியிருக்கவும் மாட்டாது.

ஒரு செய்தித்தாளின் டொமைன் அதன் முன்வாசல். ஆகஸ்ட் 27, 2013 அளிக்கும் பாடம், அதன் delegation-ஐ மாற்றக்கூடிய ஒவ்வொரு நிறுவனத்தையும் கணக்கையும் பாதுகாக்க வேண்டும் என்பதும், ownership verification-ஐ DNS security-க்கான மாற்றாகக் கருதாமல் registry-level update controls மற்றும் monitoring-ஐப் பயன்படுத்த வேண்டும் என்பதும் ஆகும்.

## ஆதாரங்களும் மேலதிக வாசிப்பும்

- The Register — [New York Times மற்றும் Twitter டொமைன் கடத்தலாளர்கள் "முன்வாசல் வழியாக வந்தனர்"](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/)
- TechCrunch — [Melbourne IT registrar வழியாக Twitter மற்றும் NYT-ன் DNS பதிவுகளை Syrian Electronic Army hack செய்ததாகத் தெரிகிறது](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/)
- ABC News — [New York Times இணையதளம் hack செய்யப்பட்டது; Syrian Electronic Army பொறுப்பேற்றதாகத் தெரிகிறது](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043)
- Christian Science Monitor — [New York Times hack செய்யப்பட்டது; Syrian Electronic Army பொறுப்பேற்றது](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit)
- iTnews — [Melbourne IT compromise, NY Times மற்றும் HuffPo வாசகர்களைத் திசைமாற்றியது](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935)
- The Next Web — [New York Times மற்றும் Twitter hack செய்யப்பட்ட விதம்](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter)
- Domain Name Wire — [Twitter மற்றும் NY Times டொமைன்கள் compromise ஆனதில் Melbourne IT பலவீனமான இணைப்பு](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/)
- Wikipedia — [Syrian Electronic Army](https://en.wikipedia.org/wiki/Syrian_Electronic_Army)
- NBC News — [Twitter மற்றும் New York Times-ஐ hack செய்த Syrian குழு](https://www.nbcnews.com/id/wbna52864470)
- Al Jazeera — [New York Times இணையதளத்தைக் குறிவைத்த Syrian hackers](https://www.aljazeera.com/news/2013/8/28/syria-hackers-target-new-york-times-website)
