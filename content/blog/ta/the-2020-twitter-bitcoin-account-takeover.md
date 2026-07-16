---
title: 'Domain Mayday EP03: 2020 Twitter Bitcoin கணக்குக் கைப்பற்றல்'
date: '2026-06-17'
language: ta
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 5
format: case-study
description: '2020 ஜூலை 15 அன்று, தாக்குதலாளர்கள் தொலைபேசி வழியாக Twitter-க்குள் நுழைந்து Obama, Biden, Musk, Gates, Apple, Uber ஆகியோரின் சரிபார்க்கப்பட்ட கணக்குகளைக் கைப்பற்றி, Bitcoin இரட்டிப்பாக்கும் மோசடியை நடத்தி சுமார் $118,000 ஈட்டினர். ஓர் ஆன்லைன் அடையாளத்தின் கட்டுப்பாடு எவ்வாறு திருடப்பட்டது, ஒரு பெயரைச் சொந்தமாக வைத்திருப்பது பற்றி அது என்ன கற்பிக்கிறது என்பதன் ஆழமான ஆய்வு.'
keywords: ['2020 twitter hack', 'twitter bitcoin scam', 'graham ivan clark', 'vishing', 'தொலைபேசி spear phishing', 'social engineering', 'கணக்குக் கைப்பற்றல்', 'ஆன்லைன் அடையாளப் பாதுகாப்பு', 'சரிபார்க்கப்பட்ட கணக்குக் கடத்தல்', 'twitter admin tool', 'agent tool', 'உள்ளக நபர் ஆபத்து', 'டொமைன் பாதுகாப்பு', 'ny dfs twitter report']
relatedArticles:
  - /ta/blog/the-bitcoin-org-dns-hijack/
  - /ta/blog/the-godaddy-multi-year-breach/
  - /ta/blog/the-2024-squarespace-defi-domain-hijacks/
  - /ta/blog/the-12-dollar-minute-someone-owned-google-com/
  - /ta/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-tokenization/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/name-change-game-change/
relatedGlossary:
  - /ta/glossary/registrar/
  - /ta/glossary/dns/
  - /ta/glossary/icann/
  - /ta/glossary/tld/
  - /ta/glossary/web3/
---

ஒரு புதன்கிழமை பிற்பகலில் சில மணிநேரங்களுக்கு, இணையத்தில் மிகவும் நம்பப்பட்ட குரல்கள் அனைத்தும் ஒரே விஷயத்தைச் சொல்லத் தொடங்கின: எனக்கு Bitcoin அனுப்புங்கள், நான் உங்களுக்கு இரட்டிப்பாகத் திருப்பி அனுப்புகிறேன்.

Barack Obama அதைச் சொன்னார். Joe Biden அதைச் சொன்னார். Elon Musk அதைச் சொன்னார். Bill Gates, Jeff Bezos, Kanye West, Apple, Uber—கோடிக்கணக்கான மக்கள் நம்புவதற்குப் பழக்கப்பட்டிருந்த நீலச் சரிபார்ப்புக் குறியுடன், அடையாளம் சரிபார்க்கப்பட்ட கணக்குகள்—அனைத்தும் ஏறக்குறைய வார்த்தைக்கு வார்த்தை ஒரே மாதிரியான மலிவான கிரிப்டோ மோசடியைப் பதிவிட்டன. அவர்களில் எவரும் ஒரு எழுத்தைக்கூடத் தட்டச்சு செய்யவில்லை. வேறொருவர் சாவிகளை வைத்திருந்ததால், அவர்களுடைய *கணக்குகள்தான்* அதைச் செய்தன.

இது **Domain Mayday EP03**. முதல் இரண்டு அத்தியாயங்களும் பெயர்களைப் பற்றியவை—அவற்றை யார் சொந்தமாக வைத்திருக்கிறார்கள், யார் அவற்றைப் பறிக்க முடியும் என்பவை. வேறு வேடம் அணிந்த அதே கேள்வியைத்தான் இந்த அத்தியாயம் பேசுகிறது. Twitter handle, சரிபார்க்கப்பட்ட badge, டொமைன் பெயர்: ஒவ்வொன்றும் மற்றவர்கள் நம்பிக்கையின் அடிப்படையில் ஏற்றுக்கொள்ளும் அடையாள உரிமைகோரல். 2020 ஜூலை 15 அன்று, அந்த உரிமைகோரலைக் கைப்பற்ற எவ்வளவு குறைவாகவே போதுமானது என்பதைத் தாக்குதலாளர்கள் நிரூபித்தனர்—malware அல்லது zero-day மூலம் அல்ல, ஒரு தொலைபேசி அழைப்பால்.

## ஒரு handle-இல் வாழும் நம்பிக்கை

சரிபார்க்கப்பட்ட கணக்கு என்பது நம்பிக்கைக்கான குறுக்குவழி. `@BarackObama` பதிவிடும்போது, அது உண்மையில் அவர்தானா என்று நீங்கள் மறுபடியும் சரிபார்ப்பதில்லை; handle-உம் badge-உமே *சரிபார்ப்பு*. அந்தக் குறுக்குவழி மிகப் பெரும் மதிப்புடையது—அதே அளவு எளிதில் உடையக்கூடியதும் கூட. ஏனெனில் எல்லா நம்பிக்கையும் கணக்கின் மீது குவிகிறது; ஆனால் கணக்கின் கட்டுப்பாடு முற்றிலும் வேறொரு இடத்தில் இருக்கலாம்.

டொமைன் பெயரின் அமைப்பும் இதேதான். ஒவ்வொரு வருகையாளரும் certificate chain-ஐ ஆராய்வதால் `whitehouse.gov` நம்பப்படுவதில்லை; அந்தப் பெயரே அதிகாரத்தைத் தாங்குவதால்தான் அது நம்பப்படுகிறது. அந்தப் பெயரை—[ரெஜிஸ்ட்ராரிடம்](/ta/glossary/registrar/), [DNS](/ta/glossary/dns/) அமைப்பில், நிர்வாகப் பலகையில்—கட்டுப்படுத்தினால், அது ஒருபோதும் உங்களுடையதாக இல்லாவிட்டாலும்கூட, மக்கள் அதில் செலுத்திய எல்லா நம்பிக்கையையும் உடனடியாக நீங்கள் பெற்றுவிடுகிறீர்கள்.

*நம்பிக்கைக்கும்* *கட்டுப்பாட்டுக்கும்* இடையிலான அந்த இடைவெளிக்கு 2020 Twitter hack-ஐவிடத் தெளிவான எடுத்துக்காட்டு இல்லை. ஒழுங்குபடுத்தப்பட்ட கிரிப்டோ நிறுவனங்களும் பாதிக்கப்பட்டதால் விசாரணை நடத்திய New York நிதி ஒழுங்குபடுத்துநர், இதை நேரடியாகக் கூறியது: இந்தத் தாக்குதல் "[அதிநவீன திறனற்ற சைபர் குற்றவாளிகள்கூட ஏற்படுத்தக்கூடிய அசாதாரண சேதம் பற்றிய ஓர் எச்சரிக்கைக் கதை](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20is%20a%20cautionary%20tale%20about%20the%20extraordinary%20damage%20that%20can%20be%20caused%20even%20by%20unsophisticated%20cybercriminals)."

## 2020 ஜூலை 15: கைப்பற்றல்

![ஒளிரும் ஒற்றை master key, ஒரே மாதிரியான பொதுவான நீல verified badge-கள் நிறைந்த பெரும் சுவரைத் திறக்க, ஒவ்வொரு badge-உம் தொடர்ச்சியாகத் திறப்பதைச் சித்தரிக்கும் துடிப்பான வண்ணமயமான கருத்துப் படம்](../../assets/the-2020-twitter-bitcoin-account-takeover-01-takeover.jpg)

அது வேகமாகவும் பட்டப்பகலிலும் நடந்தது. Wikipedia-வின் நிகழ்வு மறுகட்டமைப்பின்படி, "[2020 ஜூலை 15 அன்று 20:00 முதல் 22:00 UTC வரை, உயர்மட்ட 130 Twitter கணக்குகள் சமரசப்படுத்தப்பட்டன](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=On%20July%2015%2C%202020%2C%20between%2020%3A00%20and%2022%3A00%20UTC%2C%20130%20high%2Dprofile%20Twitter%20accounts%20were%20compromised)."

New York Department of Financial Services (DFS) அறிக்கை நிகழ்வுகளின் வரிசையை விளக்குகிறது. தாக்குதலாளர்கள் முதலில் கிரிப்டோ கணக்குகளில் ஒத்திகை பார்த்தனர்: "[Hackers முதலில் பிரபலமான cryptocurrency நிறுவனங்கள் மற்றும் நபர்களுடன் தொடர்புடைய Twitter கணக்குகளைக் கையாண்டனர்](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20first%20manipulated%20Twitter%20accounts%20connected%20to%20well%2Dknown%20cryptocurrency%20companies%20and%20individuals)"; Bitcoin [wallet](/ta/glossary/wallet/) ஒன்றைச் சுட்டிய direct message-களையும் tweet-களையும் விதைத்தனர். பின்னர் தாக்குதலை அதிகரித்தனர்: "[Hackers பின்னர் ஆபத்தை குறிப்பிடத்தக்க அளவில் உயர்த்தி, கோடிக்கணக்கான followers கொண்ட சரிபார்க்கப்பட்ட Twitter கணக்குகளைக் குறிவைத்தனர்](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20then%20raised%20the%20stakes%20significantly%20and%20targeted%20verified%20Twitter%20accounts%20with%20millions%20of%20followers)."

பாதிக்கப்பட்டவர்களின் பட்டியல், தளத்தில் மிக அதிகம் நம்பப்பட்ட கணக்குகளின் விருந்தினர் பட்டியலைப் போலத் தெரிகிறது. "[சமரசப்படுத்தப்பட்டதாகக் கருதப்பட்ட கணக்குகளில் Barack Obama, Joe Biden, Bill Gates, Jeff Bezos போன்ற பிரபலங்களின் கணக்குகளும்... Apple, Uber, Cash App போன்ற நிறுவனங்களின் கணக்குகளும் அடங்கின](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=well%2Dknown%20individuals%20such%20as%20Barack%20Obama%2C%20Joe%20Biden%2C%20Bill%20Gates%2C%20Jeff%20Bezos)" என்று Wikipedia குறிப்பிடுகிறது.

செய்தி ஒரே மாதிரியாகவும், நம்பமுடியாத அளவு எளிமையாகவும் இருந்தது. Wikipedia பதிவு செய்துள்ள Apple கணக்கின் செய்தி: "[நாங்கள் எங்கள் சமூகத்திற்குத் திருப்பிக் கொடுக்கிறோம். Bitcoin-ஐ ஆதரிக்கிறோம்; நீங்களும் ஆதரிக்க வேண்டும் என்று நம்புகிறோம்! எங்கள் முகவரிகளுக்கு அனுப்பப்படும் அனைத்து Bitcoin-உம் இரட்டிப்பாக உங்களுக்குத் திருப்பி அனுப்பப்படும்!](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=We%20are%20giving%20back%20to%20our%20community.%20We%20support%20Bitcoin%20and%20believe%20you%20should%20too!%20All%20Bitcoin%20sent%20to%20our%20addresses%20will%20be%20sent%20back%20to%20you%2C%20doubled!)" உலகில் மிகவும் நம்பகமான டஜன் கணக்கான குரல்கள் வழியாக ஒரே நேரத்தில் அதே சலுகை மீண்டும் மீண்டும் ஒலித்தது.

ஒவ்வொரு கணக்கும் பயன்படுத்தப்படவில்லை. தொடப்பட்ட 130 கணக்குகளில், "[மொத்தமாக 130 Twitter பயனர் கணக்குகள் Twitter Hack-இல் சமரசப்படுத்தப்பட்டன. அவற்றில் 45 கணக்குகள் tweet அனுப்பப் பயன்படுத்தப்பட்டன](https://www.dfs.ny.gov/Twitter_Report#:~:text=Overall%2C%20130%20Twitter%20user%20accounts%20were%20compromised%20during%20the%20Twitter%20Hack.%20Of%20those%2C%2045%20accounts%20were%20used%20to%20send%20tweets)" என்று ஒழுங்குபடுத்துநர் கண்டறிந்தது. நாற்பத்தைந்து ஒலிபெருக்கிகளே போதுமானதைவிட அதிகம்.

## உண்மையில் இழக்கப்பட்டது என்ன

நேரடி டாலர் மதிப்பில், கொள்ளை சிறியது. "[Twitter Hack மூலம் Hackers சுமார் $118,000 மதிப்புள்ள bitcoin-ஐத் திருடினர்](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20stole%20approximately%20%24118%2C000%20worth%20of%20bitcoin%20through%20the%20Twitter%20Hack)" என்று DFS அறிக்கை கூறுகிறது. ஒரே ஒரு மோசடி wallet-இல் "[மோசடிச் செய்திகள் அகற்றப்படுவதற்கு முன்பு US$110,000-க்கும் அதிக மதிப்பில் 320-க்கும் மேற்பட்ட வைப்புகள் வந்தன](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=received%20over%20320%20deposits%20with%20a%20value%20of%20over%20US%24110%2C000%20before%20the%20scam%20messages%20were%20removed)" என்று Wikipedia குறிப்பிடுகிறது. இவ்வளவு பெரிய breach-க்கு $118,000 என்பது ஏறக்குறைய வெட்கப்படத்தக்க அளவு குறைவு.

ஆனால் டாலர் தொகை இழப்பை மிக மோசமாகக் குறைத்து மதிப்பிடுகிறது. அன்று பிற்பகல் உண்மையில் வீழ்ந்தது, *நம்பிக்கைச் சின்னமாக இருந்த verified handle-இன் ஒருமைப்பாடு*. இரண்டு மணிநேரங்களுக்கு, நீல checkmark எதையும் நிரூபிக்கவில்லை. ஒரு teenager-ஆல் தளத்தின் முழு அடையாள அடுக்கையும்—ஒரு tweet யாருடைய பெயரில் இருக்கிறதோ அவரிடமிருந்தே வந்தது என்று நம்ப வைத்த அமைப்பை—ஒரே நேரத்தில் கட்டுப்படுத்த முடியும் என்பது வெளிப்படையாக நிரூபிக்கப்பட்டது. Twitter-இன் பதில் இதைத் தெளிவாகக் காட்டியது: பல சரிபார்க்கப்பட்ட கணக்குகள் tweet செய்யும் திறனை அது தற்காலிகமாக முடக்கியது. நம்பப்பட்ட கணக்குகள் பொய் சொல்வதை நிறுத்துவதற்கான ஒரே வழி, அவற்றை மௌனமாக்குவதுதான்.

அடையாளக் கைப்பற்றலின் உண்மையான செலவு இதுதான். பணம் ஒரு துணைக்குறிப்பு மட்டுமே. "இந்தக் கணக்கு = இந்த நபர்" என்பது உண்மையல்லாமல் போவதே சேதம்; அந்தச் சமன்பாட்டை நம்பியிருந்த கீழ்நிலை அமைப்புகள் அனைத்தும் அதனால் வெளிப்பட்டுவிடுகின்றன.

## அது நடந்த விதம்: ஒரு தொலைபேசி அழைப்பு, பின்னர் ஓர் admin panel

![தூண்டில் கயிறுபோல் வீசப்பட்ட தொலைபேசிக் கைப்பிடி, switches மற்றும் toggles நிறைந்த ஒளிரும் உள் கட்டுப்பாட்டுப் பலகையை அதன் கொக்கியில் சிக்கவைத்திருப்பதைச் சித்தரிக்கும் துடிப்பான வண்ணமயமான கருத்துப் படம்](../../assets/the-2020-twitter-bitcoin-account-takeover-02-vishing.jpg)

எந்த exploit-உம் இல்லை. DFS அறிக்கை இதைத் திட்டவட்டமாகக் கூறுகிறது: "[Twitter Hack-இல் சைபர் தாக்குதல்களில் அடிக்கடி பயன்படுத்தப்படும் எந்த high-tech அல்லது அதிநவீன நுட்பமும் இடம்பெறவில்லை—malware இல்லை, exploit இல்லை, backdoor இல்லை](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20did%20not%20involve%20any%20of%20the%20high%2Dtech%20or%20sophisticated%20techniques%20often%20used%20in%20cyberattacks%20%E2%80%93%20no%20malware%2C%20no%20exploits%2C%20and%20no%20backdoors)." அதற்கு பதிலாக, "[Hackers பாரம்பரிய மோசடிக்காரரின் நுட்பங்களையே ஒத்த அடிப்படை வழிமுறைகளைப் பயன்படுத்தினர்: Twitter-இன் Information Technology பிரிவிலிருந்து அழைப்பதாக நடித்து தொலைபேசி அழைப்புகளை மேற்கொண்டனர்](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20used%20basic%20techniques%20more%20akin%20to%20those%20of%20a%20traditional%20scam%20artist%3A%20phone%20calls%20where%20they%20pretended%20to%20be%20from%20Twitter%E2%80%99s%20Information%20Technology%20department)."

இதுதான் **vishing**—குரல் வழி [phishing](/ta/glossary/phishing/). தாக்குதலாளர்கள் "[பல Twitter ஊழியர்களை அழைத்து, Twitter-இன் IT துறையிலுள்ள Help Desk-இலிருந்து அழைப்பதாகக் கூறினர்](https://www.dfs.ny.gov/Twitter_Report#:~:text=called%20several%20Twitter%20employees%20and%20claimed%20to%20be%20calling%20from%20the%20Help%20Desk%20in%20Twitter%E2%80%99s%20IT%20department)"; மேலும் "[Twitter-இன் Virtual Private Network தொடர்பாக ஊழியர் தெரிவித்த சிக்கலுக்குப் பதிலளிப்பதாகக் கூறினர்](https://www.dfs.ny.gov/Twitter_Report#:~:text=claimed%20they%20were%20responding%20to%20a%20reported%20problem%20the%20employee%20was%20having%20with%20Twitter%E2%80%99s%20Virtual%20Private%20Network)." பின்னர் Twitter இதை "[தொலைபேசி spear phishing attack](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=phone%20spear%20phishing%20attack)" என்று விவரித்தது; அது "[குறிப்பிட்ட ஊழியர்களைத் தவறாக வழிநடத்தவும், மனிதப் பலவீனங்களைப் பயன்படுத்திக்கொள்ளவும் மேற்கொள்ளப்பட்ட குறிப்பிடத்தக்க, ஒருங்கிணைந்த முயற்சியை](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=a%20significant%20and%20concerted%20attempt%20to%20mislead%20certain%20employees%20and%20exploit%20human%20vulnerabilities)" நம்பியிருந்தது.

அவர்களை நம்ப வைத்தது ஆராய்ச்சியே, தொழில்நுட்பத் திறன் அல்ல. பாதுகாப்புச் செய்தியாளர் Brian Krebs ஆவணப்படுத்தியபடி, உண்மையான சக ஊழியர்களைப் போலத் தோன்றுவதற்காக தாக்குதலாளர்கள் profile தரவுகளை—LinkedIn மற்றும் முந்தைய data leak-களிலிருந்து பெறப்பட்ட பெயர்கள், பங்குகள், தனிப்பட்ட விவரங்கள்—பயன்படுத்தினர். ஓர் ஊழியர் அழைத்தவரை நம்பியவுடன், அந்த ஊழியரின் credentials தாக்குதலாளர்களுக்குக் கிடைத்தன; அவை Twitter-இன் உள் account-management கருவிகளான முக்கிய இலக்கிற்கான கதவைத் திறந்தன.

அந்தக் கருவிதான் இந்தக் கதையின் மையம். "[Twitter-இன் admin tool-களுக்குள் எந்த Twitter பயனரின் email address-ஐயும் மாற்ற முடியும் என்று தெரிகிறது](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=within%20Twitter%E2%80%99s%20admin%20tools%2C%20apparently%20you%20can%20update%20the%20email%20address%20of%20any%20Twitter%20user)" என்று Krebs தெரிவித்தார்—email-ஐ மாற்றி, password reset-ஐத் தூண்டினால், badge உட்பட கணக்கு உங்களுடையதாகிவிடும். சமரசப்படுத்தப்பட்ட ஒரே ஊழியரே இவ்வளவு பேரழிவை ஏற்படுத்தக் காரணமான கட்டமைப்புத் தோல்வியை DFS அறிக்கை சுட்டிக்காட்டுகிறது: "[Twitter உள் கருவிகளுக்கான அணுகலைக் கட்டுப்படுத்தியிருந்தாலும், 1,000-க்கும் மேற்பட்ட Twitter ஊழியர்களுக்கு அவற்றை அணுகும் உரிமை இருந்தது](https://www.dfs.ny.gov/Twitter_Report#:~:text=Twitter%20did%20limit%20access%20to%20the%20internal%20tools%2C%20but%20over%201%2C000%20Twitter%20employees%20still%20had%20access%20to%20them)." ஆயிரத்துக்கும் மேற்பட்டோர் தளத்தின் ஒவ்வொரு அடையாளத்திற்குமான master key-ஐ வைத்திருந்தனர்; அதை கவனிக்க நிறுவனத்தில் chief information security officer-உம் இல்லை—Twitter "[Twitter Hack-க்கு ஏழு மாதங்களுக்கு முன்பான 2019 டிசம்பரிலிருந்து chief information security officer (\"CISO\") இல்லாமல் இருந்தது](https://www.dfs.ny.gov/Twitter_Report#:~:text=had%20not%20had%20a%20chief%20information%20security%20officer%20(%E2%80%9CCISO%E2%80%9D)%20since%20December%202019%2C%20seven%20months%20before%20the%20Twitter%20Hack)."

இந்த அனைத்திற்கும் கீழே ஒரு [marketplace](/ta/glossary/marketplace/) கூட இருந்தது. பிரபலங்களின் கணக்குகளிலிருந்து மோசடிச் செய்திகள் வெளியாவதற்கு முன்பு, குழுவினர் திருடப்பட்ட குறுகிய, "OG" handle-களை விற்பதில் மும்முரமாக இருந்தனர். Obama/Biden/Musk/Gates தாக்குதலுக்கு முன்பு, "[மிகவும் விரும்பப்பட்ட பல குறுகிய எழுத்துகளைக் கொண்ட Twitter கணக்குப் பெயர்கள் கைமாறின](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=several%20highly%20desirable%20short%2Dcharacter%20Twitter%20account%20names%20changed%20hands)" என்று Krebs குறிப்பிட்டார்; ஏனெனில் அந்தச் சமூகத்தில் "[குறுகிய எழுத்துகளைக் கொண்ட profile பெயர்கள் ஓரளவு அந்தஸ்தையும் செல்வத்தையும் அளிக்கின்றன](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=short%2Dcharacter%20profile%20names%20confer%20a%20measure%20of%20status%20and%20wealth)"; மேலும் அவை "[மறுவிற்பனை செய்யப்படும்போது பல ஆயிரம் டாலர்களை எளிதில் ஈட்டக்கூடும்](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=can%20often%20fetch%20thousands%20of%20dollars%20when%20resold)." பற்றாக்குறை மதிப்பு கொண்ட பெயர்கள் திருடப்பட்டு forum ஒன்றில் புரட்டிவிற்கப்பட்டன—எந்த domain investor-உம் உடனடியாக அடையாளம் காணக்கூடிய முறை.

## பின்னடைவும் கைதுகளும்

Hack அவிழ்ந்த வேகம், அது நடந்த வேகத்தை ஏறக்குறைய ஒத்திருந்தது. இரு வாரங்களுக்குள் அரசு வழக்கறிஞர்கள் நடவடிக்கை எடுத்தனர். Krebs குற்றச்சாட்டுகளைப் பதிவு செய்தார்: "[U.K.-வின் Bognor Regis-ஐச் சேர்ந்த 19 வயதான Mason 'Chaewon' Sheppard மீதும் California-வில் wire fraud செய்யச் சதி, money laundering மற்றும் அனுமதியின்றி கணினியை அணுகுதல் ஆகிய குற்றச்சாட்டுகள் சுமத்தப்பட்டன](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Mason%20%E2%80%9CChaewon%E2%80%9D%20Sheppard%2C%20a%2019%2Dyear%2Dold%20from%20Bognor%20Regis%2C%20U.K.%2C%20also%20was%20charged%20in%20California%20with%20conspiracy%20to%20commit%20wire%20fraud%2C%20money%20laundering%20and%20unauthorized%20access%20to%20a%20computer)"; மேலும் "[Florida-வின் Orlando-வைச் சேர்ந்த 22 வயதான Nima 'Rolex' Fazeli மீது Northern California-வில் பாதுகாக்கப்பட்ட கணினியை வேண்டுமென்றே அணுகுவதற்கு உதவியதாகவும் துணைபுரிந்ததாகவும் criminal complaint ஒன்றில் குற்றம் சுமத்தப்பட்டது](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Nima%20%E2%80%9CRolex%E2%80%9D%20Fazeli%2C%20a%2022%2Dyear%2Dold%20from%20Orlando%2C%20Fla.%2C%20was%20charged%20in%20a%20criminal%20complaint%20in%20Northern%20California%20with%20aiding%20and%20abetting%20intentional%20access%20to%20a%20protected%20computer)."

ஆனால் குற்றச்சாட்டின்படி தலைமை வகித்தவர் அதைவிட இளையவர். "[Florida-வின் Tampa-வைச் சேர்ந்த 17 வயதான Graham Clark, ஜூலை 15 Twitter hack தொடர்பாகக் குற்றம் சுமத்தப்பட்டவர்களில் ஒருவர்](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=17%2Dyear%2Dold%20Graham%20Clark%20of%20Tampa%2C%20Fla.%20was%20among%20those%20charged%20in%20the%20July%2015%20Twitter%20hack)"; minor என்பதால் federal court-க்கு பதிலாக Florida state attorney அவர்மீது குற்றம் சுமத்தினார். அவர் "[organized fraud, communications fraud உள்ளிட்ட 30 felony குற்றச்சாட்டுகளை எதிர்கொண்டார்](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=was%20hit%20with%2030%20felony%20charges%2C%20including%20organized%20fraud%2C%20communications%20fraud)."

அடுத்த மார்ச் மாதம், Clark ஒரு plea deal-ஐ ஏற்றார். அவர் "[பல பொது நபர்களின் Twitter கணக்குகளைக் கைப்பற்றி $117,000-க்கும் அதிகமாகத் திருடிய திட்டத்தின் பின்னால் தானிருந்ததை ஒப்புக்கொண்டார்](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/#:~:text=admitted%20to%20being%20behind%20a%20scheme%20that%20saw%20him%20steal%20more%20than%20%24117%2C000%20by%20taking%20over%20the%20Twitter%20accounts%20of%20numerous%20public%20figures)" என்று CyberScoop செய்தி வெளியிட்டது. தண்டனை "[juvenile facility ஒன்றில் மூன்று ஆண்டுகள்; அதைத் தொடர்ந்து மூன்று ஆண்டுகள் probation](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=three%20years%20in%20a%20juvenile%20facility%20to%20be%20followed%20by%20three%20years%20of%20probation)" என்று பொது வானொலி நிலையமான WUSF தெரிவித்தது; இது "[மாநிலத்தின் youthful offender சட்டத்தின் கீழ் அனுமதிக்கப்பட்ட அதிகபட்ச தண்டனை](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=the%20maximum%20allowed%20under%20the%20state%E2%80%99s%20youthful%20offender%20law)" என்றும் அது குறிப்பிட்டது.

நான்காவது நபர் பின்னர் வெளிப்பட்டார். "[2023 ஏப்ரலில் PlugwalkJoe என்ற online handle-ஐப் பயன்படுத்திய 23 வயதான பிரிட்டிஷ் குடிமகன் Joseph James O'Connor, குற்றச்சாட்டுகளை எதிர்கொள்ள Spain-இலிருந்து New York-க்கு நாடு கடத்தப்பட்டார்](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=In%20April%202023%2C%2023%2Dyear%2Dold%20Joseph%20James%20O%E2%80%99Connor%2C%20a%20British%20citizen%20with%20the%20online%20handle%20PlugwalkJoe%2C%20was%20extradited%20from%20Spain)" என்று Wikipedia பதிவு செய்கிறது; பின்னர் அவருக்கு federal prison-இல் ஐந்து ஆண்டுகள் தண்டனை விதிக்கப்பட்டது.

## ஆன்லைன் அடையாளத்தைக் கட்டுப்படுத்துவது பற்றி இது கற்பிப்பவை

பிரபலங்களின் பெயர்களையும் கிரிப்டோவையும் நீக்கிவிட்டுப் பார்த்தால், ஓர் அடையாளத்தை *வைத்திருப்பதற்கும்* அதை *கட்டுப்படுத்துவதற்கும்* இடையிலான வேறுபாட்டைப் பற்றிய தூய பாடமே 2020 Twitter hack. அதிலிருந்து சில கோட்பாடுகள் வெளிப்படுகின்றன:

1. **நம்பிக்கை பெயரின் மீது குவிகிறது; கட்டுப்பாடு back office-இல் வாழ்கிறது.** கோடிக்கணக்கான மக்கள் `@BarackObama`-வை நம்பினர். அந்த நம்பிக்கையில் எதுவும் கணக்கைப் பாதுகாக்கவில்லை; ஏனெனில் ஆயிரத்துக்கும் மேற்பட்ட ஊழியர்கள் அணுகக்கூடிய உள் admin panel ஒன்றில்தான் கணக்கின் கட்டுப்பாட்டுப் பரப்பு இருந்தது. முன்புறத்தில் யாருடைய பெயர் இருந்தாலும், back office-ஐக் கட்டுப்படுத்துபவரே அடையாளத்தைக் கட்டுப்படுத்துகிறார்.

2. **மிகவும் பலவீனமான இணைப்பு ஏறக்குறைய ஒருபோதும் cryptography அல்ல.** Exploit இல்லை, malware இல்லை, backdoor இல்லை—நம்ப வைக்கும் ஒரு தொலைபேசி அழைப்பு மட்டுமே. அடையாள அமைப்புகள் கணித அடுக்கைவிட மனித மற்றும் செயல்முறை அடுக்கில்தான் மிக அடிக்கடி தோல்வியடைகின்றன. வேண்டுகோள் விடுக்கும் எவருக்கும் உதவிகரமான ஊழியர் திறந்துவிடும் கதவில் பொருத்தப்பட்ட மிகச் சிறந்த பூட்டும் ஒரு பூட்டே அல்ல.

3. **மொத்தக் கட்டுப்பாட்டின் ஒற்றைப் புள்ளி, மொத்தத் தோல்வியின் ஒற்றைப் புள்ளி.** *எந்தக்* கணக்கின் email-ஐயும் மாற்றக்கூடிய, மீண்டும் பயன்படுத்தத்தக்க ஒரே உள் கருவி இருந்ததால், சமரசப்படுத்தப்பட்ட ஓர் ஊழியர் முழுத் தளத்தையும் கைப்பற்றுவதற்குச் சமமானார். குவிக்கப்பட்ட, மாற்றியமைக்கக்கூடிய, வெளிப்படையற்ற கட்டுப்பாடே பலவீனம்.

4. **பற்றாக்குறையுள்ள பெயர்கள் இலக்குகள்.** அதிபர்களின் கணக்குகளைக் கைப்பற்றிய அதே குழு, குறுகிய "OG" handle-களை அமைதியாக ஆயிரக்கணக்கான டாலர்களுக்கு விற்றது. மதிப்புமிக்க பெயர்கள் திருடர்களை ஈர்க்கின்றன; ஒரு பெயரின் மதிப்பே அதன் கட்டுப்பாட்டைத் திருடத் தகுந்ததாக ஆக்குகிறது.

5. **மீட்பு, தளத்தின் கருணையைச் சார்ந்திருக்கக்கூடாது.** நம்பப்பட்ட கணக்குகள் பொய் சொல்லத் தொடங்கியபோது, அவற்றை முடக்குவதுதான் Twitter-க்கு இருந்த ஒரே வழி. அடையாள உரிமையாளர்களுக்கு "இது உண்மையில் நான்தான்" என்று சுயாதீனமாக நிரூபிக்கவோ, கட்டுப்பாட்டை மீட்கவோ வழியில்லை—மையப்படுத்தப்பட்ட operator-இன் உள் கருவிகளையும் நல்லெண்ணத்தையும் அவர்கள் முழுமையாகச் சார்ந்திருந்தனர்.

## Namefi-யின் கோணம்

![சிதைக்க முடியாத, சரிபார்க்கக்கூடிய ஆன்லைன் அடையாள உரிமை—பச்சைக் கேடயம், பச்சை Namefi token மற்றும் தொடர்ச்சியால் பாதுகாக்கப்படுவதைச் சித்தரிக்கும் வண்ணமயமான படம்](../../assets/the-2020-twitter-bitcoin-account-takeover-03-namefi-angle.jpg)

Twitter-இன் verified handle-களில் இருந்த அதே நம்பிக்கை-எதிர்-கட்டுப்பாட்டு இடைவெளியைக் கொண்ட ஆன்லைன் அடையாளமே ஒரு டொமைன் பெயர்—அதற்குப் பின்னாலும் பெரும்பாலும் அதே போன்ற வெளிப்படையற்ற back office இருக்கும். பெரும்பாலான டொமைன்களில், "உரிமை" என்பது password மற்றும் support team-ஆல் பாதுகாக்கப்படும் ரெஜிஸ்ட்ரார் கணக்கில் வாழ்கிறது. நம்ப வைக்கும் ஒரு தொலைபேசி அழைப்பு, social engineering-க்கு ஆளான support பிரதிநிதி, உள் panel வழியாகத் தள்ளப்பட்ட email மாற்றம்—2020 Twitter playbook, ரெஜிஸ்ட்ரார் கணக்குக் கைப்பற்றலுக்கு ஏறக்குறைய ஒன்றுக்கு ஒன்று பொருந்துகிறது. உலகம் உங்கள் டொமைனில் செலுத்திய நம்பிக்கை, யாருடைய பேச்சுக்கும் இணங்கும் help desk ஒன்றின் பின்னால் அதன் கட்டுப்பாடு இருந்தால், அந்த டொமைனைப் பாதுகாக்காது.

அந்த இடைவெளியை மூடுவதற்காகவே [Namefi](https://namefi.io) இருக்கிறது. ஒரு டொமைனின் கட்டுப்பாடு, வேறொருவரின் admin tool-இலுள்ள setting ஆக இல்லாமல், *சரிபார்க்கக்கூடியதாகவும் உரிமையாளரிடம் இருப்பதாகவும்* இருக்க வேண்டும் என்பதே மையக் கருத்து. DNS-உடன் இணக்கமாகத் தொடரும், tokenized on-chain asset ஆக [டொமைன் உரிமையை](/ta/glossary/domain-ownership/) பிரதிநிதித்துவப்படுத்துவதன் மூலம், "இந்தப் பெயரை யார் கட்டுப்படுத்துகிறார்?" என்ற கேள்விக்கு அழுத்தத்தின் கீழ் support agent எடுக்கும் முடிவால் அல்லாமல் cryptography மூலம் பதிலளிக்க Namefi வழிசெய்கிறது. ஆயிரம் ஊழியர்கள் அணுகி உங்கள் பெயரை அமைதியாக மறுஒதுக்கக்கூடிய ஒற்றை உள் panel எதுவும் இல்லை; கட்டுப்பாட்டுச் சான்று உரிமையாளரிடமே இருக்கிறது, மேலும் transfers தற்காலிகமாகத் தீர்மானிக்கப்படாமல் audit செய்யக்கூடியவையாக இருக்கின்றன.

அடையாளமும் கட்டுப்பாடும் கவனமின்றிப் பிரிக்கப்பட்டிருந்ததால்தான் 2020 Twitter hack வெற்றி பெற்றது—பெயர் ஒன்றைச் சொன்னபோது, மறைந்திருந்த admin tool வேறொன்றைத் தீர்மானித்தது. ஒரு பெயரைச் சார்ந்திருக்கும் எவருக்கும் கிடைக்கும் பாடம், அந்தப் பெயர் தாங்கும் நம்பிக்கையைப் போலவே கட்டுப்பாட்டையும் தெளிவாகவும் உரிமையாளரிடம் வேரூன்றியதாகவும் ஆக்குவது. Handle, badge, domain: ஒவ்வொன்றும் அதன் பின்னாலுள்ள back office அளவுக்கே பாதுகாப்பானது. அந்த back office நீங்கள் கட்டுப்படுத்தும் சரிபார்க்கக்கூடிய ledger ஆக இருக்க வேண்டும்; வேறொருவரை ஏமாற்றி பதிலளிக்க வைக்கக்கூடிய தொலைபேசி இணைப்பாக இருக்கக்கூடாது என்பதே Namefi-யின் பந்தயம்.

## ஆதாரங்களும் மேலதிக வாசிப்பும்

- New York Department of Financial Services — [Twitter விசாரணை அறிக்கை](https://www.dfs.ny.gov/Twitter_Report)
- Wikipedia — [2020 Twitter கணக்குக் கடத்தல்](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking)
- Krebs on Security — [புதன்கிழமையின் பிரம்மாண்ட Twitter hack-க்குப் பின்னால் யார்?](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/)
- Krebs on Security — [லாபத்திற்காகவும் கேளிக்கைக்காகவும் Twitter hacking](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/)
- Krebs on Security — [ஜூலை 15 Twitter சமரசம் தொடர்பாக மூவர் மீது குற்றச்சாட்டு](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/)
- CyberScoop — [Twitter hacker குற்றத்தை ஒப்புக்கொண்டு 3 ஆண்டுகள் தண்டனை பெற்றார்](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/)
- WUSF — [Tampa Twitter Hacker-க்கு மூன்று ஆண்டுகள் சிறையும் மூன்று ஆண்டுகள் probation-உம்](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation)
- U.S. Department of Justice — [Twitter Hack-இல் கூறப்படும் பங்குகளுக்காக மூவர் மீது குற்றச்சாட்டு](https://www.justice.gov/usao-ndca/pr/three-individuals-charged-alleged-roles-twitter-hack)
- ABC News — [17 வயதில் Twitter-ஐ hack செய்ததை ஒப்புக்கொண்ட Florida நபருக்கு 3 ஆண்டுகள் தண்டனை](https://abcnews.go.com/Politics/florida-man-pleaded-guilty-hacking-twitter-17-year/story?id=76513232)
