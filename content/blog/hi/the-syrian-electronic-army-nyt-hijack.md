---
title: 'Domain Mayday EP10: सीरियाई इलेक्ट्रॉनिक आर्मी ने एक फ़िश्ड रिसेलर के ज़रिए NYTimes.com को कैसे बंद किया'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
description: '27 अगस्त 2013 को, सीरियाई इलेक्ट्रॉनिक आर्मी ने Melbourne IT के एक रिसेलर को फ़िश किया, nytimes.com और Twitter के डोमेन के DNS रिकॉर्ड्स को फिर से लिखा, और न्यूयॉर्क टाइम्स को घंटों के लिए ऑफ़लाइन कर दिया। एक गहरी पड़ताल कि कैसे रजिस्ट्रार-चेन की कमज़ोर कड़ी एक अखबार की सामने की दरवाज़े की विफलता बनी — और रजिस्ट्री लॉक ने क्या बदला होता।'
keywords: ['nytimes.com हैक', 'सीरियाई इलेक्ट्रॉनिक आर्मी', 'melbourne it', 'dns हाइजैक', 'डोमेन हाइजैकिंग', 'रजिस्ट्रार सुरक्षा', 'रिसेलर फ़िशिंग', 'रजिस्ट्री लॉक', 'dns रिकॉर्ड्स', 'डोमेन नेम सर्वर अटैक', 'twitter dns 2013', 'डोमेन सुरक्षा', 'serverupdateprohibited']
relatedArticles:
  - /hi/blog/the-fox-it-dns-hijack/
  - /hi/blog/the-lenovo-com-dns-hijack/
  - /hi/blog/the-godaddy-multi-year-breach/
  - /hi/blog/the-panix-com-domain-hijack/
  - /hi/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-basics/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/name-change-game-change/
relatedGlossary:
  - /hi/glossary/registrar/
  - /hi/glossary/dns/
  - /hi/glossary/icann/
  - /hi/glossary/registry/
  - /hi/glossary/tld/
---

एक अखबार का डोमेन नाम उसका मुख्य द्वार होता है। जब आप `nytimes.com` टाइप करते हैं, तो आप एक अदृश्य श्रृंखला पर भरोसा कर रहे होते हैं — एक डोमेन रजिस्ट्री, एक [रजिस्ट्रार](/hi/glossary/registrar/), और कभी-कभी उस रजिस्ट्रार के नीचे एक रिसेलर — जो आपको असली न्यूज़रूम तक और कहीं नहीं पहुंचाती है। किसी सामान्य दिन आप उस श्रृंखला के बारे में कभी नहीं सोचते। 27 अगस्त 2013 को, वह टूट गई, और लाखों पाठक *The New York Times* के मुख्य द्वार पर पहुंचे तो पाया कि उसे किसी और के द्वार से बदल दिया गया है।

वह "कोई और" था **Syrian Electronic Army** (SEA), एक असद-समर्थक हैकर समूह जिसने 2013 भर पश्चिमी मीडिया आउटलेट्स को निशाना बनाया। इस बार उन्होंने किसी एक लेख को नहीं बदला और न ही किसी कंटेंट मैनेजमेंट सिस्टम में सेंध लगाई। वे एक स्तर और गहरे गए — **DNS रिकॉर्ड्स** तक, जो तय करते हैं कि एक डोमेन कहाँ इशारा करता है — और कुछ घंटों के लिए उन्होंने ग्रह के सर्वाधिक पढ़ी जाने वाली न्यूज़ साइटों में से एक का पता अपने नियंत्रण में ले लिया।

## डोमेन सामने का द्वार है, और उस द्वार पर एक ताला है जिसे आप नियंत्रित नहीं करते

जब *The New York Times* जैसी कोई कंपनी एक डोमेन रजिस्टर करती है, तो "यह किसका है और यह कहाँ इशारा करता है" का आधिकारिक रिकॉर्ड [रजिस्ट्री](/hi/glossary/registry/) पर रहता है (`.com` के लिए, यह Verisign है) और एक **रजिस्ट्रार** के ज़रिए प्रबंधित होता है। बड़े रजिस्ट्रार **रिसेलर्स** के ज़रिए भी बेचते हैं — छोटी फर्में जो डोमेन सेवाओं को री-सेल करती हैं और रजिस्ट्रार के सिस्टम में अपना लॉगिन रखती हैं।

यह परत-दर-परत व्यवस्था सुविधाजनक है। लेकिन यह विश्वास की एक ऐसी श्रृंखला भी है जहाँ सबसे कमज़ोर कड़ी पूरी चीज़ की सुरक्षा तय करती है। अगर कोई हमलावर उस श्रृंखला में *किसी भी* के रूप में प्रमाणीकरण कर सके — [रजिस्ट्रेंट](/hi/glossary/registrant/), रजिस्ट्रार स्टाफ, या रिसेलर — तो रजिस्ट्रार का सिस्टम डिज़ाइन के अनुसार उन्हें वैध मालिक मान लेगा। Melbourne IT के अपने मुख्य कार्यकारी अधिकारी ने इस विफलता के तरीके को एक विनाशकारी वाक्य में कह दिया: ["वे सामने के दरवाज़े से आए,"](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door) उन्होंने AP को बताया। यदि आपके पास एक वैध उपयोगकर्ता नाम और पासवर्ड है, तो सिस्टम मान लेता है कि आप अधिकृत मालिक हैं। यही पूरी समस्या का सार है।

## 27 अगस्त 2013: वह दिन जब nytimes.com कहीं और इशारा करने लगा

![विशाल अखबार के मुख्य-द्वार के साइन को खोलते और एक अलग दरवाज़े पर फिर से लगाते हुए की ज्वलंत रंगीन कॉन्सेप्ट आर्ट, चमकते लाल रूटिंग तीर पाठकों की भीड़ को एक अंधेरी गली में खींच रहे हैं](../../assets/the-syrian-electronic-army-nyt-hijack-01-hijack.jpg)

एक मंगलवार की देर दोपहर को, पाठक *Times* तक पहुंचना बंद हो गए। [New York Times की वेबसाइट "कुछ उपयोगकर्ताओं के लिए अंधेरे में चली गई थी,"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=gone%20dark%20for%20some%20users) ABC News ने रिपोर्ट किया, और अखबार ने पुष्टि की कि [उसकी साइट "मंगलवार की दोपहर पाठकों के लिए अनुपलब्ध थी"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=unavailable%20to%20readers%20on%20Tuesday%20afternoon) अपने डोमेन रजिस्ट्रार पर हमले के बाद। यह कोई संक्षिप्त व्यवधान नहीं था। [आगंतुकों को "मंगलवार को कई घंटों तक खाली ब्राउज़र स्क्रीन से रूबरू होना पड़ा,"](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=greeted%20with%20blank%20browser%20screens%20for%20several%20hours) Christian Science Monitor ने रिपोर्ट किया — और इसे और बुरा बनाने के लिए, यह ["इस महीने दूसरी बार"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=second%20time%20this%20month) था जब साइट डाउन हो गई थी।

जो वास्तव में हुआ था वह रजिस्ट्रार स्तर पर एक **DNS हाइजैक** था। हमलावरों ने उन रिकॉर्ड्स में प्रवेश किया जो `nytimes.com` को एक IP पते में अनुवाद करते हैं और उन्हें फिर से लिख दिया। घटना के Wikipedia के विवरण के अनुसार, [`NYTimes.com` "के DNS को एक पेज पर रीडायरेक्ट किया गया था जिसमें संदेश 'Hacked by SEA' प्रदर्शित था।"](https://en.wikipedia.org/wiki/Syrian_Electronic_Army#:~:text=had%20its%20DNS%20redirected%20to%20a%20page%20that%20displayed%20the%20message) सामने का द्वार एक अलग दरवाज़े पर फिर से लगा दिया गया था।

*Times* उस अकाउंट पर एकमात्र लक्ष्य नहीं था। TechCrunch, रियल टाइम में रिपोर्ट करते हुए, पाया कि ["New York Times और Twitter दोनों के नेम सर्वर ऐसे प्रतीत होते हैं जो रजिस्ट्रार Melbourne IT के ज़रिए रजिस्टर किए गए थे,"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=name%20servers%20appear%20to%20have%20been%20registered%20through%20the%20registrar%20Melbourne%20IT) और कि [`twimg.com` डोमेन, "जो Twitter की छवियाँ और अवतार प्रदान करता है, उसमें भी बदलाव दिखाई देते हैं जो ऐसे सर्वर की ओर इशारा करते हैं जो स्पष्ट रूप से SEA के स्वामित्व में हैं।"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=which%20serves%20up%20Twitter%20images%20and%20avatars) Twitter की मुख्य साइट काफी हद तक सुरक्षित रही, लेकिन उसका इमेज-और-अवतार डोमेन डगमगा गया — इतना काफी था कि कुछ उपयोगकर्ताओं ने संक्षिप्त रूप से टूटी हुई छवियाँ देखीं।

## प्रभाव: अंधकार के घंटे, और एक रीडायरेक्ट जिस पर भरोसा नहीं किया जा सकता था

एक समाचार संगठन के लिए, हाइजैक की कीमत केवल खोए हुए पेजव्यू में नहीं मापी जाती। यह विश्वास में मापी जाती है। आउटेज की अवधि के दौरान, `nytimes.com` तक पहुंचने वाले किसी भी व्यक्ति को हमलावर द्वारा रूट किया जा रहा था। *Times* के अपने मुख्य सूचना अधिकारी, Mark Frons, ने स्टाफ को बताया कि व्यवधान ["Syrian Electronic Army या उनके बनने की कोशिश करने वाले किसी के द्वारा किए गए दुर्भावनापूर्ण बाहरी हमले का परिणाम था"](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=was%20the%20result%20of%20a%20malicious%20external%20attack) — और कर्मचारियों को ईमेल के साथ सतर्क रहने की चेतावनी दी जबकि डोमेन अखबार के हाथ से बाहर था।

सोचें कि एक हाइजैक किया हुआ DNS रिकॉर्ड वास्तव में क्या सक्षम करता है। हमलावर नियंत्रित करता है कि नाम कहाँ resolve होता है, जिसका अर्थ है कि वे एक defacement पेज serve कर सकते हैं (जैसा उन्होंने किया), लेकिन वे उतनी ही आसानी से एक विश्वसनीय नकली लॉगिन serve कर सकते थे, क्रेडेंशियल्स एकत्र कर सकते थे, या ट्रैफिक को इंटरसेप्ट कर सकते थे। Defacement शोरगुल वाला और स्पष्ट होता है। एक *शांत* DNS हाइजैक कहीं अधिक खतरनाक होता है — और दोनों को वही कमज़ोरी सक्षम करती है। Huffington Post UK का डोमेन उसी घटना में फंस गया था, जो इस बात को रेखांकित करता है कि यह एक रजिस्ट्रार-अकाउंट समझौता था, न कि किसी एकल न्यूज़रूम के विरुद्ध एकबारगी मज़ाक।

## यह कैसे हुआ: अखबार को नहीं, रिसेलर को फ़िश करो

![एक फ़िश किए गए सोने के चाबी के अमूर्त रूटिंग डायल से चिह्नित एक चमकते कंट्रोल-रूम के दरवाज़े में खिसकने की ज्वलंत रंगीन कॉन्सेप्ट आर्ट, एक छायादार हाथ पते के तीरों की एक प्रकाशमान बही को फिर से लिख रहा है जबकि एक नकली ईमेल लिफाफा ताले में घुल जाता है](../../assets/the-syrian-electronic-army-nyt-hijack-02-reseller-phish.jpg)

यह वह हिस्सा है जिस पर विचार करना आवश्यक है: SEA को कभी *The New York Times* में सेंध लगाने की ज़रूरत नहीं पड़ी। उन्होंने अखबार के सर्वर या उसके CMS को कभी नहीं छुआ। उन्होंने रजिस्ट्रार के *नीचे* की श्रृंखला पर हमला किया।

प्रवेश बिंदु Melbourne IT के एक US-आधारित रिसेलर को भेजा गया **स्पीयर-फ़िशिंग ईमेल** था। जैसा The Next Web ने रिपोर्ट किया, Melbourne IT ने ["पुष्टि की कि SEA ने लॉग-इन विवरण प्राप्त करने के लिए फ़िशिंग रणनीति का उपयोग किया"](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter#:~:text=used%20phishing%20tactics%20to%20get%20hold%20of%20the%20log) — रिसेलर के स्टाफ को उनके ईमेल क्रेडेंशियल्स सौंपने के लिए बरगलाया गया, और हमलावरों ने फिर उन मेलबॉक्स से रजिस्ट्रार लॉगिन खोद निकाले। वहाँ से यह सरल था: [Melbourne IT के एक रिसेलर के क्रेडेंशियल्स (उपयोगकर्ता नाम और पासवर्ड) का उपयोग Melbourne IT के सिस्टम पर एक रिसेलर अकाउंट तक पहुंचने के लिए किया गया,](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=credentials%20of%20a%20Melbourne%20IT%20reseller) और अंदर जाकर, [हमलावरों ने "कई डोमेन नामों के DNS रिकॉर्ड्स बदल दिए ... जिनमें *Times* के भी शामिल थे।"](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=changed%20the%20DNS%20records%20of%20several%20domain%20names)

TechCrunch का विवरण उतना ही स्पष्ट है: ["उस रिसेलर अकाउंट पर कई डोमेन नामों के DNS रिकॉर्ड्स बदल दिए गए — जिनमें `nytimes.com` भी शामिल था।"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=DNS%20records%20of%20several%20domain%20names%20on%20that%20reseller%20account%20were%20changed)

यही असमानता रजिस्ट्रार-चेन हमलों को इतना आकर्षक बनाती है। *Times* अपने स्वयं के बुनियादी ढांचे को चाँद तक कठोर कर सकता था और यह मायने नहीं रखता, क्योंकि कमज़ोर अकाउंट एक तृतीय-पक्ष रिसेलर का था जो न्यूज़रूम से कई कदम दूर था। एक छोटी कंपनी के कुछ कर्मचारियों पर एक स्पीयर-फ़िश लाखों पाठकों द्वारा पढ़े जाने वाले अखबार को रीडायरेक्ट करने के लिए पर्याप्त था।

## प्रतिक्रिया और उपरांत

एक बार जब Melbourne IT समझ गया कि क्या हुआ था, तो सुधार सीधा था — और यह दिखाता है कि *अगर आप रजिस्ट्रार को नियंत्रित करते हैं* तो ये हमले कितने उलटने योग्य हैं। कंपनी ने सही सेटिंग्स बहाल कीं: इसने [बदले हुए DNS रिकॉर्ड्स को वापस लिया और उन्हें आगे के परिवर्तन के विरुद्ध "लॉक" कर दिया।](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=reverted%20the%20altered%20DNS%20records) इसने समझौता किए गए रिसेलर अकाउंट पर पासवर्ड बदला और घुसपैठ का पता लगाने के लिए लॉग खींचे। *Times* ने बुधवार की सुबह तक सेवा बहाल कर ली।

लेकिन पूरे प्रकरण में सबसे शिक्षाप्रद विवरण यह है कि *क्षति वहीं क्यों रुक गई जहाँ रुकी।* उसी रिसेलर अकाउंट के कुछ डोमेन कभी प्रभावित ही नहीं हुए — क्योंकि उनके मालिकों ने एक मज़बूत सुरक्षा चालू की थी। Melbourne IT के अपने शब्दों में, ["महत्वपूर्ण नामों के लिए हम सुझाते हैं कि डोमेन नाम के मालिक .com सहित डोमेन नाम रजिस्ट्रियों से उपलब्ध अतिरिक्त रजिस्ट्री लॉक सुविधाओं का लाभ उठाएं — रिसेलर अकाउंट पर लक्षित कुछ डोमेन नामों में ये लॉक सुविधाएं सक्रिय थीं और इसलिए वे प्रभावित नहीं हुए।"](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=For%20mission%20critical%20names%20we%20recommend%20that%20domain%20name%20owners%20take%20advantage%20of%20additional%20registry%20lock)

एक [रजिस्ट्री लॉक](/hi/glossary/registry-lock/) डोमेन को एक ऐसी स्थिति में रखता है (आप इसे [WHOIS](/hi/glossary/whois/) में `serverUpdateProhibited` जैसे फ्लैग के रूप में देख सकते हैं) जहाँ रजिस्ट्री तब तक बदलाव करने से इनकार करेगी जब तक एक सख्त, आउट-ऑफ-बैंड प्रक्रिया का पालन न किया जाए। जैसा कि उस समय डोमेन-इंडस्ट्री के जानकारों ने नोट किया, Twitter के रिकॉर्ड में ठीक उसी तरह का [Verisign-lock status](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/#:~:text=serverUpdateProhibited) था। एक फ़िश किया गया रिसेलर पासवर्ड रजिस्ट्री लॉक को हराने के लिए पर्याप्त नहीं है — और यह एकल कॉन्फ़िगरेशन विकल्प "घंटों के लिए डाउन" और "कभी प्रभावित नहीं" के बीच की रेखा है।

## यह रजिस्ट्रार और रिसेलर चेन, और रजिस्ट्री लॉक के बारे में क्या सिखाता है

27 अगस्त का हाइजैक एक लगभग-परिपूर्ण शिक्षण मामला है क्योंकि विफलता श्रृंखला की हर कड़ी दिखाई देती है।

1. **आपका डोमेन उतना ही सुरक्षित है जितना उसे बदल सकने वाला सबसे कमज़ोर अकाउंट।** इसमें आपके रजिस्ट्रार का स्टाफ और उनके नीचे कोई भी रिसेलर शामिल है — जिनमें से किसी को भी आप सीधे नियंत्रित नहीं करते। *Times* ने अपने सर्वर पर कुछ गलत नहीं किया; समझौता कई कदम दूर था।
2. **फ़िशिंग फ़ायरवॉल को मात देती है।** कोई विदेशी exploit का उपयोग नहीं किया गया था। एक नकली ईमेल ने कुछ रिसेलर कर्मचारियों को वे क्रेडेंशियल्स दे दिए जिन्हें रजिस्ट्रार के सिस्टम ने पूरी तरह से अधिकृत माना। ["वे सामने के दरवाज़े से आए।"](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door)
3. **रजिस्ट्री लॉक वह नियंत्रण है जो वास्तव में मायने रखता था।** [अतिरिक्त रजिस्ट्री लॉक सुविधाओं](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=additional%20registry%20lock%20features) वाले डोमेन "इस प्रकार प्रभावित नहीं हुए।" किसी भी मिशन-क्रिटिकल डोमेन के लिए, रजिस्ट्री लॉक (साथ ही रजिस्ट्रार-लॉक और रजिस्ट्रार अकाउंट पर 2FA) वैकल्पिक कठोरीकरण नहीं है — यह आधार रेखा है।
4. **DNS परिवर्तन शक्तिशाली और तेज़ हैं।** नेम-सर्वर या A रिकॉर्ड का एकल पुनर्लेखन तुरंत एक पूरे ब्रांड को रीडायरेक्ट कर देता है। एक समझौता किए गए अकाउंट का विस्फोट क्षेत्र वे सभी डोमेन हैं जिन्हें वह छू सकता है।
5. **अपने स्वयं के रिकॉर्ड्स की निगरानी करें।** WHOIS और DNS निगरानी मिनटों में अनधिकृत परिवर्तन को फ़्लैग कर देती। जितनी जल्दी आप एक अप्रत्याशित नेम-सर्वर परिवर्तन नोटिस करते हैं, आउटेज उतना ही छोटा होता है।

## Namefi का दृष्टिकोण

![सत्यापन योग्य, छेड़छाड़-प्रतिरोधी डोमेन स्वामित्व का रंगीन चित्रण — एक हरे ढाल, एक हरे Namefi टोकन, और DNS निरंतरता द्वारा सुरक्षित एक डोमेन कार्ड](../../assets/the-syrian-electronic-army-nyt-hijack-03-namefi-angle.jpg)

SEA हाइजैक, अपने मूल में, एक **प्राधिकरण** समस्या थी। रजिस्ट्रार का सिस्टम असली मालिक और एक फ़िश किए गए पासवर्ड को रखने वाले किसी व्यक्ति के बीच का अंतर नहीं बता सका, इसलिए उसने वही किया जो वह करने के लिए बना था और परिवर्तन स्वीकार कर लिया। हर वह बचाव जो काम किया — रजिस्ट्री लॉक, आउट-ऑफ-बैंड पुष्टि, सावधानीपूर्वक निगरानी — वास्तव में यह साबित करने की बाधा बढ़ाने का तरीका है कि परिवर्तन अनुरोध वास्तव में मालिक से आया है।

[Namefi](https://namefi.io) उसी सटीक आधार से शुरू करता है: [डोमेन स्वामित्व](/hi/glossary/domain-ownership/) और नियंत्रण **सत्यापन योग्य और छेड़छाड़-प्रतिरोधी** होना चाहिए, न कि एक रिसेलर के इनबॉक्स में तैरता हुआ एकल पुन: उपयोग योग्य पासवर्ड। डोमेन स्वामित्व को एक [ऑन-चेन](/hi/glossary/on-chain/), क्रिप्टोग्राफ़िक रूप से सत्यापन योग्य एसेट के रूप में प्रदर्शित करके जो DNS के साथ संगत रहता है, Namefi "इस डोमेन को बदलने की अनुमति किसे है" के सवाल को एक मज़बूत, ऑडिट योग्य उत्तर देता है, न कि जो भी लॉग इन किया उस पर निहित विश्वास। नियंत्रण परिवर्तन स्पष्ट, हस्ताक्षरित क्रियाएं बन जाते हैं जो मालिक से बंधी होती हैं — एक रजिस्ट्री लॉक के करीब जिसकी चाबी आपके पास हो, न कि एक ऐसे सामने के दरवाज़े के जिसे सही पासवर्ड वाला कोई भी खोल सकता है।

एक अखबार का डोमेन उसका सामने का दरवाज़ा है। 27 अगस्त 2013 का सबक यह है कि सबसे मज़बूत संभव डेडबोल्ट किसी काम का नहीं है यदि कई इमारतें दूर कोई अजनबी चाबी की एक प्रति देने के लिए बरगलाया जा सकता हो। समाधान यह है कि स्वामित्व को स्वयं साबित करने योग्य बनाया जाए — ताकि "सामने के दरवाज़े से आए" ऐसी बात हो जो कोई अजनबी कभी न कह सके।

## स्रोत और आगे पढ़ने के लिए

- The Register — [New York Times, Twitter domain hijackers 'came in through front door'](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/)
- TechCrunch — [Syrian Electronic Army Apparently Hacks DNS Records Of Twitter, NYT Through Registrar Melbourne IT](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/)
- ABC News — [New York Times Website Hacked, Syrian Electronic Army Appears to Take Credit](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043)
- Christian Science Monitor — [New York Times hacked, Syrian Electronic Army takes credit](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit)
- iTnews — [Melbourne IT compromise redirects NY Times, HuffPo readers](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935)
- The Next Web — [Here's How the New York Times and Twitter Got Hacked](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter)
- Domain Name Wire — [Melbourne IT the weak link as Twitter and NY Times domain names compromised](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/)
- Wikipedia — [Syrian Electronic Army](https://en.wikipedia.org/wiki/Syrian_Electronic_Army)
- NBC News — [Syrian group hacks Twitter, New York Times](https://www.nbcnews.com/id/wbna52864470)
- Al Jazeera — [Syria hackers target New York Times website](https://www.aljazeera.com/news/2013/8/28/syria-hackers-target-new-york-times-website)
