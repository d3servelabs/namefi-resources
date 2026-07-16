---
title: 'Dyn DNS हमला: जब हैक किए गए कैमरों के Mirai बॉटनेट ने आधे इंटरनेट को ठप कर दिया'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
description: '21 अक्टूबर 2016 को, Mirai IoT बॉटनेट द्वारा संचालित एक DDoS हमले ने DNS प्रदाता Dyn को तीन लहरों में निशाना बनाया, जिससे Twitter, Netflix, Reddit, Spotify, GitHub, Airbnb और PayPal घंटों के लिए ऑफलाइन हो गए — DNS प्रदाता केंद्रीकरण पर एक Domain Mayday केस स्टडी।'
keywords: ['dyn dns हमला', 'mirai botnet', 'october 21 2016 ddos', 'dns ddos attack', 'iot botnet', 'dns provider outage', 'domain security', 'dns single point of failure', 'dyn ddos 2016', 'mirai malware', 'internet outage 2016', 'dns redundancy', 'hacked iot cameras']
relatedArticles:
  - /hi/blog/the-godaddy-multi-year-breach/
  - /hi/blog/the-curve-finance-dns-hijack/
  - /hi/blog/the-fox-it-dns-hijack/
  - /hi/blog/the-myetherwallet-bgp-dns-attack/
  - /hi/blog/the-lenovo-com-dns-hijack/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-basics/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/name-change-game-change/
relatedGlossary:
  - /hi/glossary/dns/
  - /hi/glossary/registrar/
  - /hi/glossary/icann/
  - /hi/glossary/tld/
  - /hi/glossary/web3/
---

अक्टूबर 2016 के एक शुक्रवार को कुछ घंटों के लिए, इंटरनेट खुद को ढूंढना भूल गया।

Twitter एक खाली पेज दिखाने लगा। Netflix स्पिन होता रहा और फिर बंद हो गया। Reddit, Spotify, GitHub, Airbnb, PayPal — सभी वहाँ थे, सभी ऑनलाइन थे, अपने सर्वर पर बिल्कुल ठीक से चल रहे थे, और फिर भी पूरी तरह से अपहुँच हो गए थे। कोई हैक नहीं हुआ था। कोई डेटा चोरी नहीं हुआ था। वेबसाइटें ठीक वहीं थीं जहाँ वे हमेशा से रही थीं। जो टूटा वह था इंटरनेट का वह हिस्सा जो *आपको बताता है कि चीज़ें कहाँ हैं*।

हमले ने Twitter या Netflix को नहीं मारा। उसने एक ऐसी कंपनी को मारा जिसके बारे में उनके अधिकांश उपयोगकर्ताओं ने कभी नहीं सुना था: **Dyn**, न्यू हैम्पशायर की एक फर्म जो DNS — इंटरनेट की पता-पुस्तिका — चलाती थी, आधुनिक वेब के एक बड़े हिस्से के लिए। और हथियार कोई सर्वर फ़ार्म या किसी राष्ट्र-राज्य का शस्त्रागार नहीं था। यह हैक किए गए बेबी मॉनिटर, वेबकैम और होम राउटर का एक झुंड था: साधारण घरेलू उपकरण, चुपचाप एक सेना में भर्ती किए गए जिसे **Mirai** कहा गया।

यह है **Domain Mayday EP08** — वह दिन जब असुरक्षित स्मार्ट-कैमरों ने इंटरनेट की फ़ोन बुक को ठप कर दिया।

## DNS: इंटरनेट की फ़ोन बुक, और उसमें Dyn की जगह

जब भी आप एक डोमेन नाम टाइप करते हैं, तो आपके कंप्यूटर को किसी भी चीज़ से कनेक्ट होने से पहले उसे एक संख्यात्मक IP पते में बदलना होता है। यह अनुवाद [DNS](/hi/glossary/dns/), डोमेन नेम सिस्टम का काम है। यह मानव-अनुकूल नाम और उस मशीन के बीच लुकअप परत है जिसकी ओर नाम इंगित करता है।

Dyn उस लुकअप सेवा के बड़े प्रबंधित प्रदाताओं में से एक था। जब किसी साइट ने अपना DNS Dyn को आउटसोर्स किया, तो Dyn के नेमसर्वर "यह डोमेन कहाँ रहता है?" के लिए आधिकारिक स्रोत बन गए। The Register ने हमले के दौरान स्पष्ट रूप से निर्भरता को बताया: Dyn को ऑफलाइन करके, Google और ISP द्वारा चलाए जाने वाले सार्वजनिक DNS रिसॉल्वर [netizens के लिए hostnames lookup करने के लिए Dyn से संपर्क करने में असमर्थ थे, जिससे लोग Dyn को DNS के लिए उपयोग करने वाली साइटों तक पहुँचने से वंचित हो गए](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=unable%20to%20contact%20Dyn%20to%20lookup%20hostnames)।

यही इस कहानी के केंद्र में शांत नाज़ुकपन है। एक वेबसाइट बेदाग हो सकती है — अनावश्यक सर्वर, सही अपटाइम, विश्व स्तरीय इंजीनियर — और फिर भी इंटरनेट से गायब हो सकती है यदि "यह कहाँ है?" का उत्तर देने वाला एक प्रदाता अंधेरे में चला जाए। जैसा कि Carnegie Mellon के CyLab ने बाद में सारांशित किया, प्रभावित डोमेन [एक तृतीय-पक्ष DNS, Dyn पर गंभीर रूप से निर्भर थे। दूसरे शब्दों में, वे केवल Dyn पर निर्भर थे, इसलिए जब Dyn नीचे गया, तो वे भी नीचे चले गए](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=critically%20dependent%20on%20Dyn)।

## 21 अक्टूबर 2016: हमला लहरों में आया

![ग्लोइंग जंक ट्रैफ़िक की एक ज्वारीय लहर का जीवंत रंगीन अवधारणा कला जो एक विशाल प्रकाशित फ़ोन-बुक स्विचबोर्ड से टकरा रही है, एक अंधेरे नक्शे पर डायरेक्टरी की लाइटें टिमटिमा कर बंद हो रही हैं](../../assets/the-dyn-dns-mirai-attack-01-attack.jpg)

हमला शुक्रवार, 21 अक्टूबर 2016 की सुबह शुरू हुआ, और यह एक ही प्रहार के रूप में नहीं आया। यह दिन के दौरान अलग-अलग लहरों में आया।

Wikipedia का घटना का रिकॉर्ड Dyn के खिलाफ [तीन लगातार distributed denial-of-service हमलों](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=three%20consecutive%20distributed%20denial%2Dof%2Dservice%20attacks) को सूचीबद्ध करता है, जो UTC 11:10 के आसपास शुरू हुए। यांत्रिकी एक पाठ्यपुस्तक distributed denial-of-service थी: [DDoS हमला करोड़ों IP पतों से DNS lookup अनुरोधों के माध्यम से पूरा किया गया](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=numerous%20DNS%20lookup%20requests%20from%20tens%20of%20millions%20of%20IP%20addresses), Dyn के नेमसर्वर को इतने जंक ट्रैफ़िक में डुबो दिया कि वैध लुकअप नहीं हो सके।

लहरों ने इसे अथक महसूस कराया। The Register ने इसे लाइव कवर करते हुए उस पल का वर्णन किया जब Dyn ठीक होता लगा — और फिर नहीं हुआ: [जंक ट्रैफ़िक की प्रारंभिक ज्वारीय लहर शुरू होने के दो घंटे बाद, Dyn ने घोषणा की कि उसने हमले को कम कर दिया है और सेवा सामान्य हो रही है। लेकिन राहत अल्पकालिक थी: लगभग एक घंटे बाद ही, हमला फिर से शुरू हो गया](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=After%20two%20hours%20into%20the%20initial%20tidal%20wave)। जो अंत जैसा लग रहा था वह बस राउंड्स के बीच का अंतर था।

कच्ची मात्रा में, हमला उस युग के लिए विशाल था — उस बिंदु तक देखी गई सबसे बड़ी DDoS घटनाओं में से एक, जिसे The Register ने [1 TBps से अधिक](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/#:~:text=more%20than%201TBps) की चरम के रूप में चित्रित किया। (Dyn ने स्वयं चेतावनी दी थी कि वैध ट्रैफ़िक के "retry storm" ने कुछ प्रारंभिक अनुमानों को बढ़ा-चढ़ाकर दिखाया, एक बिंदु जिस पर हम वापस आएंगे।)

## कौन सी साइटें अंधेरे में गईं — और यह कैसा लगा

जब Dyn के नेमसर्वर उत्तर नहीं दे सके, तो विफलता उन सभी लोगों तक फैल गई जो उन पर निर्भर थे। यह वेब का कोई अस्पष्ट कोना नहीं था। यह उपभोक्ता इंटरनेट का पहला पृष्ठ था।

The Register की लाइव रिपोर्ट ने कुछ हताहतों को सीधे नाम दिया: Dyn पर एक असाधारण, केंद्रित हमला जो [सैकड़ों कंपनियों के इंटरनेट सेवाओं को बाधित करता रहा, जिसमें ऑनलाइन दिग्गज Twitter, Amazon, AirBnB, Spotify और अन्य शामिल हैं](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=disrupt%20internet%20services%20for%20hundreds%20of%20companies)। Wikipedia की प्रभावित सेवाओं की सूची उस युग की सबसे बड़ी साइटों की एक फहरिस्त जैसी पढ़ी जाती है: [Airbnb, Amazon.com, CNN, GitHub, Netflix, PayPal, Reddit, Spotify, Twitter](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=Airbnb), और दर्जनों और।

Brian Krebs, जिनकी अपनी साइट को हफ्तों पहले उसी मैलवेयर ने मारा था, ने उपभोक्ता अनुभव का वर्णन किया — हमले ने [इंटरनेट उपयोगकर्ताओं के लिए साइटों की एक श्रृंखला तक पहुँचने में समस्याएं पैदा करनी शुरू कर दीं, जिनमें Twitter, Amazon, Tumblr, Reddit, Spotify और Netflix शामिल हैं](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=an%20array%20of%20sites%2C%20including%20Twitter)। साधारण उपयोगकर्ताओं के लिए, कोई ऐसी त्रुटि नहीं थी जो समझ में आती। साइटें बस लोड नहीं होती थीं — पहले US East Coast के साथ, फिर जैसे-जैसे बाद की लहरें आईं, अमेरिका भर में और यूरोप तक फैलती गईं।

## यह कैसे हुआ: असुरक्षित स्मार्ट डिवाइस की एक सेना

![हज़ारों छोटे मुस्कुराते हैक किए गए स्मार्ट-कैमरों, टोस्टरों और बेबी मॉनिटरों का जीवंत रंगीन अवधारणा कला जो ग्लोइंग कीड़ों की तरह एक ओवरलोडेड डायरेक्टरी टॉवर की ओर झुंड में आ रहे हैं](../../assets/the-dyn-dns-mirai-attack-02-mirai-botnet.jpg)

यहाँ वह हिस्सा है जिसने Dyn हमले को एक महत्वपूर्ण मोड़ बना दिया: आग्नेय शक्ति कंप्यूटरों से नहीं आई। यह *चीज़ों* से आई।

Mirai एक मैलवेयर है जो Internet-of-Things डिवाइस — कैमरे, राउटर, DVR — की तलाश करता है और उन्हें हाईजैक करता है। यह उपभोक्ता हार्डवेयर में सबसे आलसी कमज़ोरी का फायदा उठाकर काम करता है: वह पासवर्ड जो डिवाइस शिप के साथ आया था। जैसा कि The Register ने इसका वर्णन किया, Mirai वेब पर फैलता है, आज्ञाकारी ज़ॉम्बी की अपनी रैंक बढ़ाता है, [Telnet और SSH के माध्यम से उनके डिफ़ॉल्ट, फ़ैक्टरी-सेट पासवर्ड का उपयोग करके डिवाइस में लॉग इन करके](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/#:~:text=logging%20into%20devices%20using%20their%20default%2C%20factory%2Dset%20passwords)। Krebs ने यंत्रविधि को उतनी ही सीधी तरह से बताया: Mirai [IoT डिवाइस के लिए वेब खंगालता है जो केवल फ़ैक्टरी-डिफ़ॉल्ट उपयोगकर्ता नाम और पासवर्ड से सुरक्षित हैं, और फिर डिवाइस को हमलों में शामिल कर लेता है](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=scours%20the%20Web%20for%20IoT%20devices)।

Dyn हमले के केंद्र में डिवाइस मुख्य रूप से सस्ते वेबकैम और DVR थे। Krebs ने बॉटनेट को [मुख्य रूप से डिजिटल वीडियो रिकॉर्डर (DVR) और IP कैमरों से समझौता किए गए, जो XiongMai Technologies नामक एक चीनी हाई-टेक कंपनी द्वारा बनाए गए थे](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=mainly%20compromised%20digital%20video%20recorders) तक ट्रेस किया — ऐसे डिवाइस जिनके डिफ़ॉल्ट क्रेडेंशियल, कई मामलों में, [एक उपयोगकर्ता व्यावहारिक रूप से बदल नहीं सकता](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=A%20user%20cannot%20feasibly%20change%20this%20password) क्योंकि पासवर्ड फर्मवेयर में हार्डकोड था।

दो चीज़ों ने Mirai को परेशानी से तबाही में बदल दिया। पहला, मैलवेयर के लेखक ने [सितंबर 2016 के अंत में इसका सोर्स कोड जारी किया था, जिससे प्रभावी रूप से कोई भी अपनी खुद की हमले की सेना बना सकता था](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=released%20the%20source%20code%20for%20it)। दूसरा, कमज़ोर डिवाइस की आबादी विशाल थी। Dyn ने हमले के हस्ताक्षर की पुष्टि की: कंपनी [यह पुष्टि करने में सक्षम थी कि हमले के ट्रैफ़िक की एक महत्वपूर्ण मात्रा Mirai-based बॉटनेट से उत्पन्न हुई थी](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=confirm%20that%20a%20significant%20volume%20of%20attack%20traffic%20originated%20from%20Mirai), और Wikipedia बॉटनेट को [इंटरनेट-कनेक्टेड डिवाइस — जैसे प्रिंटर, IP कैमरे, रेज़िडेंशियल गेटवे और बेबी मॉनिटर — के एक झुंड के रूप में वर्णित करता है जो Mirai मैलवेयर से संक्रमित थे](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=printers%2C%20IP%20cameras%2C%20residential%20gateways%20and%20baby%20monitors)।

## परिणाम: झुंड की गिनती — और अपराधियों की

जब धूल जम गई, तो *यह कितना बड़ा था* का बुनियादी सवाल भी मुश्किल साबित हुआ। Dyn का अपना घटना-पश्चात विश्लेषण, EVP Scott Hilton के माध्यम से, बॉटनेट का अनुमान [100,000 दुर्भावनापूर्ण endpoints तक](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=up%20to%20100%2C000%20malicious%20endpoints) लगाया — बड़ा, लेकिन कुछ शुरुआती आंकड़ों द्वारा सुझाए गए "करोड़ों IPs" से छोटा। विसंगति एक फीडबैक लूप से आई: दुर्भावनापूर्ण हमले कम से कम एक बॉटनेट से उत्पन्न हुए, [retry storm के साथ endpoints के एक महत्वपूर्ण रूप से बड़े सेट का झूठा संकेत प्रदान करते हुए जितना हम अब जानते हैं](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=with%20the%20retry%20storm%20providing%20a%20false%20indicator)। दूसरे शब्दों में, इंटरनेट के अपने स्वचालित "पुनः प्रयास करें" व्यवहार ने अराजकता को बढ़ा दिया।

कानूनी परिणाम ने एक मोड़ जोड़ा। Mirai के पीछे तीन युवा — Paras Jha, Josiah White, और Dalton Norman — अंततः ["Mirai botnet" बनाने, संचालित करने और उसकी पहुँच बेचने में उनकी भूमिका के लिए दोषी साबित हुए](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=pleaded%20guilty%20for%20their%20role%20in%20creating)। लेकिन Dyn हमले के समय तक, Jha पहले ही सोर्स कोड सार्वजनिक रूप से जारी कर चुका था — और अभियोजकों और पत्रकारों ने ध्यान देने योग्य रूप से नोट किया है कि Dyn हमलावर जरूरी नहीं कि मूल तीनों थे। जैसा कि CyberScoop ने रिपोर्ट किया, यह [अभी तक स्पष्ट नहीं है, उदाहरण के लिए, इंटरनेट परफॉर्मेंस मैनेजमेंट कंपनी Dyn के खिलाफ सबसे अधिक प्रोफाइल वाले Mirai-linked हमले के पीछे कौन था](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=not%20yet%20clear%2C%20for%20example%2C%20who%20was%20behind)। एक बार हथियार ओपन-सोर्स हो गया, कोई भी ट्रिगर खींच सकता था।

Dyn के लिए, व्यावसायिक नुकसान वास्तविक था: उसके बाद के महीनों में, हजारों डोमेन ने अपना DNS कहीं और ले जाया, एक बुरे दिन के बाद ग्राहक विश्वास में एक महंगा सबक।

## यह DNS प्रदाता केंद्रीकरण के बारे में क्या सिखाता है

Dyn हमले को IoT-सुरक्षा की कहानी के रूप में याद किया जाता है, और यह है भी। लेकिन इसका गहरा सबक *वास्तुकला* के बारे में है: इंटरनेट के बहुत अधिक हिस्से को एक चोकपॉइंट के माध्यम से रूट करने का खतरा।

21 अक्टूबर को अंधेरे में गई हर साइट ने वही उचित लगने वाला निर्णय लिया था — DNS को एक उत्कृष्ट प्रदाता को आउटसोर्स करें। व्यक्तिगत रूप से, स्मार्ट। सामूहिक रूप से, इसका मतलब था कि एक कंपनी को खटखटाने से एक साथ वेब का एक महत्वपूर्ण अंश खाली हो सकता था। CyLab का फैसला था कि हमले के सबक [केवल उन कुछ मुट्ठी भर वेबसाइटों द्वारा ही अमल में लाए गए हैं जो सीधे प्रभावित हुई थीं](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=have%20only%20been%20acted%20upon%20by%20a%20handful), यहाँ तक कि वर्षों बाद भी।

रक्षात्मक उत्तर अतिरेक है: एक से अधिक प्रदाता में आधिकारिक DNS फैलाना ताकि कोई एकल आउटेज घातक न हो। Dyn के दो साल बाद, The Register को पता चला कि यह अभी भी दुर्लभ था और अभी भी कष्टदायक था — Infoblox के Cricket Liu ने नोट किया कि [कई आधिकारिक DNS प्रदाताओं का उपयोग करना आसान नहीं हो गया है, उदाहरण के लिए (जैसे Dyn plus Verisign या Neustar)। कई प्रदाताओं का उपयोग करने में सक्षम होना एक बड़ा अंतर करेगा](https://www.theregister.com/2018/10/11/dns_insecurity_survey/#:~:text=hasn%27t%20gotten%20any%20easier%20to%20use%20multiple%20authoritative%20DNS%20providers)। डोमेन पर निर्भर किसी के लिए भी मुख्य बातें:

1. **एक डोमेन में उसके [रजिस्ट्रार](/hi/glossary/registrar/) से अधिक विफलता बिंदु होते हैं।** "यह नाम कहाँ इंगित करता है?" का उत्तर देने वाला प्रदाता उतना ही बोझ उठाने वाला है जितना कि इसके पीछे के सर्वर।
2. **सिंगल-प्रदाता DNS एकल विफलता बिंदु है।** सामान्य परिस्थितियों में उत्कृष्ट अपटाइम 1 Tbps बाढ़ के तहत व्यवहार के बारे में कुछ नहीं कहता।
3. **केंद्रीकरण सुविधाजनक और नाज़ुक है।** वही दक्षता जो एक प्रदाता को आकर्षक बनाती है, उसकी आउटेज को व्यापक रूप से महसूस कराती है।
4. **लचीलापन स्वामित्व की एक संपत्ति है, न कि केवल होस्टिंग की।** जब कुछ टूटता है, तो आपको अपने डोमेन के कॉन्फ़िगरेशन को इतनी साफ़ तरह से नियंत्रित करने में सक्षम होना चाहिए कि आप तेज़ी से पुनः रूट कर सकें।

## Namefi का कोण

![रंगीन चित्रण सत्यापन योग्य, लचीले डोमेन स्वामित्व का — एक हरे रंग की ढाल, एक हरे Namefi टोकन, और DNS निरंतरता द्वारा सुरक्षित एक डोमेन कार्ड](../../assets/the-dyn-dns-mirai-attack-03-namefi-angle.jpg)

Dyn हमले ने एक भी डोमेन चोरी नहीं किया। इसने कोई ट्रांसफर नहीं किया और न ही किसी रजिस्ट्रार खाते को हाईजैक किया। और फिर भी, कुछ घंटों के लिए, जो लोग उन डोमेन के *मालिक* थे उन्होंने प्रभावी रूप से यह नियंत्रण खो दिया कि उनके नाम कहाँ इंगित करते हैं — इसलिए नहीं कि उनका स्वामित्व संदेह में था, बल्कि इसलिए कि उनके डोमेन के नीचे की परिचालन परत एक साथ विफल हो गई।

वह अंतर — एक नाम का *मालिक होने* और *विश्वसनीय रूप से नियंत्रण करने* के बीच कि यह कहाँ रिज़ॉल्व होता है — ठीक वही सीम है जिसे इस तरह के हमले एक्सप्लॉइट करते हैं। डोमेन उन सबसे मूल्यवान संपत्तियों में से हैं जो एक व्यवसाय रखता है, फिर भी उनका नियंत्रण अक्सर अपारदर्शी, केंद्रीकृत बुनियादी ढांचे के पीछे बैठता है जिसे मालिक न तो सत्यापित कर सकता है और न ही दबाव में जल्दी से पुनर्कॉन्फ़िगर कर सकता है।

[Namefi](https://namefi.io) इस विचार पर बना है कि डोमेन को इंटरनेट-नेटिव संपत्तियों की तरह व्यवहार करना चाहिए: स्वामित्व जो क्रिप्टोग्राफिक रूप से सत्यापन योग्य और पोर्टेबल हो, जबकि DNS के साथ पूरी तरह से संगत रहे। सत्यापन योग्य, मालिक-नियंत्रित [डोमेन स्वामित्व](/hi/glossary/domain-ownership/) एक बॉटनेट को नहीं रोकता — लेकिन यह दुनिया को एक ऐसे इंटरनेट की ओर धकेलता है जहाँ एक नाम का नियंत्रण साबित किया जा सकता है, ऑडिट किया जा सकता है, और चुपचाप एक प्रदाता के सबसे बुरे दिन पर निर्भर नहीं है। Mirai-Dyn हमला एक अनुस्मारक है कि आप जो डोमेन "अपना" रखते हैं वह उतना ही लचीला है जितनी कि उसके लिए उत्तर देने वाली परत। लचीलापन स्वामित्व और नियंत्रण को कुछ ऐसा बनाने से शुरू होता है जिसे आप वास्तव में सत्यापित कर सकें।

## स्रोत और आगे पढ़ने के लिए

- Krebs on Security — [Hacked Cameras, DVRs Powered Today's Massive Internet Outage](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/)
- Wikipedia — [DDoS attacks on Dyn](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn)
- The Register — [DNS devastation: Top websites whacked offline as Dyn dies again](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/)
- The Register — [Today the web was broken by countless hacked devices: your 60-second summary](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/)
- The Register — [Mirai, Mirai, pwn them all: who's the greatest botnet on the whole?](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/)
- The Register — [In the two years since Dyn went dark, what have we learned? Not much, it appears](https://www.theregister.com/2018/10/11/dns_insecurity_survey/)
- BankInfoSecurity — [Botnet Army of 'Up to 100,000' IoT Devices Disrupted Dyn](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486)
- Carnegie Mellon CyLab — [Four years since the Mirai-Dyn attack… is the Internet safer?](https://cylab.cmu.edu/news/2020/10/30-dynattack.html)
- CyberScoop — [Three men plead guilty for roles in Mirai botnet empire](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/)
