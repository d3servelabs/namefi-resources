---
title: 'MyEtherWallet BGP + DNS अटैक: कैसे अपहृत इंटरनेट रूटिंग ने $150K का ETH चुराया'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['nirmit-buddhiraja']
draft: false
description: '24 अप्रैल 2018 को, हमलावरों ने Amazon Route 53 के लिए इंटरनेट रूटिंग को हाईजैक किया, myetherwallet.com के DNS उत्तरों को जहरीला किया, और एक सेल्फ-साइन्ड सर्टिफिकेट के पीछे एक फिशिंग क्लोन परोसा — जिससे लगभग $150,000 का Ethereum निकाला गया। Domain Mayday की गहन पड़ताल — क्यों DNS एक ऐसी रूटिंग परत पर निर्भर है जो डिफ़ॉल्ट रूप से भरोसा करती है।'
keywords: ['myetherwallet', 'bgp hijack', 'dns hijacking', 'amazon route 53', 'route 53 hijack', 'dns security', 'bgp routing security', 'ethereum phishing', 'self-signed certificate', 'enet as10297', 'rpki roa', 'crypto wallet phishing', 'domain security']
relatedArticles:
  - /hi/blog/the-fox-it-dns-hijack/
  - /hi/blog/the-curve-finance-dns-hijack/
  - /hi/blog/the-bitcoin-org-dns-hijack/
  - /hi/blog/the-godaddy-multi-year-breach/
  - /hi/blog/the-dnspionage-campaign/
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

जब आप किसी वेबसाइट का नाम ब्राउज़र में टाइप करते हैं, तो आप दो अदृश्य प्रणालियों पर भरोसा कर रहे होते हैं कि वे आपके साथ ईमानदार रहेंगी।

पहला है **DNS** — इंटरनेट की फोन बुक — जो `myetherwallet.com` जैसे नाम को एक संख्यात्मक IP पते में बदलता है। दूसरा है **BGP**, Border Gateway Protocol, जो यह तय करता है कि आपके पैकेट उस पते तक पहुँचने के लिए कौन सा भौतिक मार्ग लेंगे। लगभग कोई भी इनमें से किसी के बारे में नहीं सोचता। ये बस काम करते हैं, दिन में अरबों बार, चुपचाप।

**24 अप्रैल 2018** की सुबह, दोनों ने एक साथ झूठ बोला। लगभग दो घंटे के लिए, जो कोई भी `myetherwallet.com` टाइप करके एक ब्राउज़र चेतावनी पर क्लिक करके आगे बढ़ा, उसे एक फिशिंग क्लोन की ओर भेज दिया गया जो उस सर्वर पर चल रहा था जहाँ वे सोच रहे थे वहाँ से बहुत दूर था। जब तक रूटिंग सही की गई, हमलावर वास्तविक उपयोगकर्ताओं के [वॉलेट](/hi/glossary/wallet/) से लगभग **$150,000 का [Ethereum](/hi/glossary/ethereum/)** निकाल चुके थे।

इस घटना को सुरक्षा पाठ्यक्रमों में स्थायी स्थान जो चीज़ दिलाती है वह डॉलर की राशि नहीं है — क्रिप्टो चोरियाँ तब से इससे कहीं आगे निकल चुकी हैं। वह है *तंत्र*। हमलावरों ने MyEtherWallet के सर्वर में कभी सेंध नहीं लगाई। उन्होंने कभी कोई पासवर्ड अनुमान नहीं किया। उन्होंने **सड़क** पर हमला किया, इमारत पर नहीं — DNS को ज़हरीला करने के लिए इंटरनेट की रूटिंग परत को हाईजैक करके।

## DNS एक ऐसी रूटिंग परत के ऊपर बैठता है जो डिफ़ॉल्ट रूप से भरोसा करती है

यह समझने के लिए कि क्या हुआ, आपको पृथ्वी पर हर डोमेन नाम के नीचे की असहज बुनियाद को समझना होगा।

DNS इस प्रश्न का उत्तर देता है: "`myetherwallet.com` का IP पता क्या है?" लेकिन आपकी DNS क्वेरी सही सर्वर तक पहुँचे, इसके लिए इंटरनेट के राउटर्स को यह जानना होगा कि *कौन सा नेटवर्क* उस DNS सर्वर के IP पते का मालिक है — और यह जानने के लिए, वे BGP पर निर्भर करते हैं।

यहाँ पेंच है। BGP, डिज़ाइन से, एक ट्रस्ट-आधारित प्रणाली है। Wikipedia पर Cloudflare-शैली के सारांश के अनुसार, [डिफ़ॉल्ट रूप से BGP प्रोटोकॉल सभी रूट घोषणाओं पर भरोसा करने के लिए डिज़ाइन किया गया है जो peers द्वारा भेजी जाती हैं](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers)। सुरक्षा शोधकर्ता Bob Cromwell मूल इरादे को और भी स्पष्ट रूप से बताते हैं: [BGP को अच्छे इरादे वाले ISP और विश्वविद्यालयों के बीच विश्वास की एक श्रृंखला बनाने के लिए डिज़ाइन किया गया था जो अंधे होकर उन्हें मिली जानकारी पर विश्वास करते हैं](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html#:~:text=BGP%20was%20designed%20to%20be%20a%20chain%20of%20trust)।

दूसरे शब्दों में: जब कोई नेटवर्क ऑपरेटर खड़ा होकर दुनिया को घोषणा करता है कि "*इन* IP पतों के लिए ट्रैफिक *मेरे* माध्यम से आना चाहिए," तो बाकी इंटरनेट ने ऐतिहासिक रूप से बस उस पर विश्वास किया है। BGP में एक more-specific-route टाईब्रेकर बना हुआ है — यदि दो नेटवर्क समान पतों का दावा करते हैं, तो *संकरे*, अधिक विशिष्ट ब्लॉक की घोषणा करने वाला जीत जाता है। यही टाईब्रेकर वह लीवर है जिसे एक हमलावर खींचता है।

इसलिए किसी भी डोमेन की अटैक सर्फेस उसके [रजिस्ट्रार](/hi/glossary/registrar/) से बड़ी है, उसके DNS प्रदाता से बड़ी है, और उसके वेब होस्ट से बड़ी है। इसमें संपूर्ण वैश्विक रूटिंग फैब्रिक शामिल है जो आपकी DNS क्वेरी को सही जगह पहुँचाती है। MyEtherWallet को यह कठिन तरीके से पता चला।

## 24 अप्रैल 2018 को उपयोगकर्ताओं ने क्या खोया

![इंटरनेट ट्रैफिक की ज्वलंत रंगीन अवधारणा कला जो एक चमकती डेटा हाईवे के साथ बह रही है, अचानक एक नकली डिटोर संकेत द्वारा एक नकली सड़क पर मोड़ दी गई जो एक ढोंगी इमारत की ओर जाती है, प्रकाश के पैकेट एक जाल में बिखर रहे हैं](../../assets/the-myetherwallet-bgp-dns-attack-01-attack.jpg)

नुकसान लगभग दो घंटे की खिड़की में केंद्रित था। The Register के अनुसार, दुर्भावनापूर्ण रूटिंग उस दिन [11am से 1pm UTC के बीच](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Between%2011am%20and%201pm%20UTC) चली। उस खिड़की में, `myetherwallet.com` तक पहुँचने की कोशिश कर रहे हर किसी का एक अंश चुपचाप एक ढोंगी को सौंप दिया गया।

ढोंगी विश्वासजनक था। यह MyEtherWallet जैसा दिखता था क्योंकि यह एक लगभग सटीक क्लोन था। इसे एकमात्र चीज़ जो उजागर करती थी वह एक सर्टिफिकेट चेतावनी थी — और महत्वपूर्ण रूप से, उपयोगकर्ता उस चेतावनी के माध्यम से सीधे क्लिक कर सकते थे। जिन्होंने ऐसा किया, और फिर लॉगिन किया, उन्होंने अपने फंड की चाबियाँ सौंप दीं। BleepingComputer ने रिपोर्ट किया, [जिन्होंने लॉगिन किया उनकी वॉलेट प्राइवेट कीज़ चुरा ली गईं, जिनका उपयोग हमलावर ने खातों को खाली करने के लिए किया](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=Those%20who%20logged%20in%20had%20their%20wallet%20private%20keys%20stolen)।

विभिन्न मीडिया आउटलेट में आंकड़े थोड़े भिन्न हैं, लेकिन मूल संख्या सुसंगत है। BleepingComputer ने इसे [215 Ether, लेनदेन के समय $160,000 के बराबर](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=215%20Ether%2C%20the%20equivalent%20of%20%24160%2C000) बताया। CyberScoop ने रिपोर्ट किया कि चोरों ने [215 Ether चुराने में कामयाबी हासिल की, जो उस समय लगभग $152,000 था](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/#:~:text=215%20Ether%2C%20amounting%20to%20about%20%24152%2C000)। Help Net Security ने संक्षेप में बताया कि हमलावर [लगभग $150,000 का Ethereum चुराने में सफल रहे](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=approximately%20%24150%2C000%20in%20Ethereum)। वही 215 ETH; डॉलर की संख्या बस चोरी के समय की विनिमय दर के साथ बदलती है।

यही रूटिंग-प्लस-DNS अटैक की क्रूर अर्थव्यवस्था है जो एक क्रिप्टो वॉलेट पर लागू होती है। कोई धोखाधड़ी-रिवर्सल विभाग नहीं है, कोई चार्जबैक नहीं, कोई बैंक नहीं जिसे फोन किया जा सके। एक बार जब प्राइवेट कीज़ हमलावर के क्लोन में दर्ज हो जाती हैं और फंड [ऑन-चेन](/hi/glossary/on-chain/) स्थानांतरित हो जाते हैं, तो वे चली जाती हैं।

## यह कैसे हुआ: रूट हाईजैक करें, उत्तर को ज़हरीला करें, क्लोन परोसें

![एक हाईजैक किए गए चमकते विश्व मानचित्र की ज्वलंत रंगीन अवधारणा कला जहाँ एक ढोंगी हाथ GPS मार्ग को दोबारा बना रहा है, यात्रियों को एक नकली लैंडमार्क इमारत की ओर ले जाया जा रहा है जबकि असली गंतव्य दूरी में अनदेखा चमकता है](../../assets/the-myetherwallet-bgp-dns-attack-02-bgp-hijack.jpg)

अटैक ने दो विफलताओं को एक साथ जोड़ा। अकेले दोनों में से कोई भी काम नहीं करता। एक साथ वे विनाशकारी थे।

**चरण एक: Amazon के DNS सर्वरों के मार्ग को हाईजैक करें।** MyEtherWallet ने Amazon की प्रबंधित DNS सेवा का उपयोग किया। जैसा कि Help Net Security ने सीधे नोट किया, [MyEtherWallet.com Amazon की Route 53 DNS सेवा का उपयोग करता है](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=MyEtherWallet.com%20uses%20Amazon%27s%20Route%2053%20DNS%20service)। हमलावरों ने Route 53 में सेंध नहीं लगाई। इसके बजाय, The Register के अनुसार, [कोई इंटरनेट के कोर राउटर्स को BGP – Border Gateway Protocol – संदेश भेजने में सक्षम था ताकि उन्हें AWS के कुछ सर्वरों के लिए निर्धारित ट्रैफिक को एक विद्रोही बॉक्स पर भेजने के लिए मना सकें](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=someone%20was%20able%20to%20send%20BGP)।

इसे करने वाली घोषणा एक अप्रत्याशित स्थान से आई। The Register ने रिपोर्ट किया कि [नेटवर्क ब्लॉक AS10297, Ohio स्थित वेबसाइट होस्टिंग कंपनी eNet से संबंधित, ने घोषणा की कि वह AWS के कुछ IP पतों के लिए निर्धारित ट्रैफिक संभाल सकती है](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=the%20network%20block%20AS10297%2C%20belonging%20to%20Ohio-based%20website%20hosting%20biz%20eNet)। और क्योंकि BGP अधिक-विशिष्ट मार्गों को पसंद करता है और अपने peers पर भरोसा करता है, नकली घोषणा फैल गई। Wikipedia पैमाने को दर्ज करता है: [Amazon Web Services स्पेस के भीतर लगभग 1300 IP पते, Amazon Route 53 के लिए समर्पित, eNet (या उसके किसी ग्राहक) द्वारा हाईजैक किए गए, जो Columbus, Ohio में एक ISP है। कई peering partners, जैसे Hurricane Electric, ने घोषणाओं को अंधे होकर प्रचारित किया](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=Roughly%201300%20IP%20addresses%20within%20Amazon%20Web%20Services%20space)। "अंधे होकर प्रचारित" BGP के ट्रस्ट मॉडल की पूरी कहानी दो शब्दों में है।

**चरण दो: DNS सर्वर बनें और झूठ बोलें।** एक बार रूट हाईजैक हो जाने के बाद, Amazon के वास्तविक DNS सर्वरों पर जाने वाली क्वेरीज़ इसके बजाय हमलावर के बॉक्स पर पहुँचीं। उस बॉक्स ने Route 53 का नाटक किया। The Register ने परिणाम का वर्णन किया: [उस नकली मशीन ने फिर AWS की DNS सेवा के रूप में काम किया, और MyEtherWallet.com के लिए गलत IP पते दिए, कुछ दुर्भाग्यशाली आगंतुकों को डॉट-कॉम से एक फिशिंग साइट की ओर इंगित किया](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=That%20rogue%20machine%20then%20acted%20as%20AWS%27s%20DNS%20service)। Kentik का विश्लेषण DNS पक्ष से उसी तथ्य को प्रस्तुत करता है: [ढोंगी authoritative DNS सर्वर ने myetherwallet.com के लिए नकली प्रतिक्रियाएँ लौटाईं, उपयोगकर्ताओं को MyEtherWallet की वेबसाइट के एक ढोंगी संस्करण की ओर गलत दिशा में भेजा](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=The%20imposter%20authoritative%20DNS%20server%20returned%20bogus%20responses%20for%20myetherwallet.com)।

**चरण तीन: फिशिंग क्लोन परोसें — रूस से।** जहरीले DNS उत्तरों ने उपयोगकर्ताओं को रूस में एक सर्वर पर इंगित किया जो नकली वॉलेट होस्ट कर रहा था। Help Net Security ने रिपोर्ट किया कि हमलावरों ने हाईजैक का उपयोग किया [MyEtherWallet.com के लिए निर्धारित ट्रैफिक को लुकअलाइक फिशिंग साइट पर रीडायरेक्ट करने के लिए, जो रूस में एक सर्वर पर होस्ट की गई थी](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=they%20redirect%20traffic%20meant%20for%20MyEtherWallet.com%20to%20the%20lookalike%20phishing%20site%2C%20hosted%20on%20a%20server%20in%20Russia)।

**एक सुरक्षा उपाय जो लगभग काम किया: सर्टिफिकेट।** यहाँ वह हिस्सा है जिस पर हर पाठक को विचार करना चाहिए। हमलावरों ने डोमेन के *रेज़ोल्यूशन* और *सर्वर* को नियंत्रित किया, लेकिन वे किसी विश्वसनीय प्राधिकरण द्वारा जारी `myetherwallet.com` के लिए एक वैध TLS सर्टिफिकेट नहीं बना सके। इसलिए ब्राउज़र ने वही किया जो उसे करना था — उसने एक चेतावनी दी। Help Net Security ने इसे सटीक रूप से वर्णित किया: [एकमात्र चीज़ जो यह संकेत देती थी कि फिशिंग साइट वह नहीं है जो वह होने का दावा करती है, वह चेतावनी थी जो आगंतुकों को दिखाई गई कि साइट द्वारा उपयोग किया जाने वाला TLS सर्टिफिकेट एक अज्ञात प्राधिकरण द्वारा हस्ताक्षरित था (यानी, सेल्फ-साइन्ड था)](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=the%20only%20thing%20that%20gave%20some%20indication)। BleepingComputer ने सहमति जताई कि ध्यान देने वाले किसी के लिए संकेत स्पष्ट था: [नकली वेबसाइट को पहचानना आसान था क्योंकि हमलावरों ने एक सेल्फ-साइन्ड TLS सर्टिफिकेट का उपयोग किया था जिसने सभी आधुनिक ब्राउज़रों के साथ एक त्रुटि उत्पन्न की](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=The%20fake%20website%20was%20easy%20to%20spot)।

लेकिन "पहचानना आसान" यह मानता है कि उपयोगकर्ता रुकता है। ESET की WeLiveSecurity ने पकड़ा कि सुरक्षा वास्तव में कितनी पतली थी: [एकमात्र स्पष्ट संकेत जो एक सामान्य उपयोगकर्ता देख सकता था वह यह था कि जब वे नकली MyEtherWallet साइट पर गए तो उन्हें एक त्रुटि संदेश दिखाई दिया जो उन्हें बताता था कि साइट एक अविश्वसनीय SSL सर्टिफिकेट का उपयोग कर रही है](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/#:~:text=The%20only%20obvious%20clue%20that%20a%20typical%20user%20might%20have%20spotted)। ब्राउज़र ने हाथ उठाया और कहा *यह गलत है*। जिन उपयोगकर्ताओं ने पैसे गँवाए वे वे हैं जो फिर भी क्लिक करके आगे बढ़े — और पीड़ितों को [एक HTTPS त्रुटि संदेश के माध्यम से क्लिक करना पड़ा, क्योंकि नकली MyEtherWallet.com एक अविश्वसनीय TLS/SSL सर्टिफिकेट का उपयोग कर रहा था](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Victims%20had%20to%20click%20through%20a%20HTTPS%20error%20message)।

## प्रतिक्रिया और परिणाम

रूटिंग पर नज़र रखने वाले लोगों के लिए हाईजैक सूक्ष्म नहीं था। नेटवर्किंग मॉनिटर ने नकली, अधिक-विशिष्ट प्रीफिक्स को उसी दो घंटे की खिड़की के भीतर प्रकट होते और फिर वापस लिए जाते देखा, और एक बार नकली घोषणा वापस लिए जाने के बाद, Route 53 पर सामान्य रूटिंग वापस आ गई।

MyEtherWallet ने खुद जोर देकर कहा कि उसके अपने इन्फ्रास्ट्रक्चर में कोई उल्लंघन नहीं हुआ था। जैसा कि कंपनी ने तत्काल बाद में जोर दिया, समस्या इंटरनेट की प्लंबिंग थी, उसका एप्लिकेशन नहीं — यह BGP के माध्यम से प्राप्त रेज़ोल्यूशन पथ का एक [DNS हाईजैकिंग](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=DNS%20hijacking) था, न कि MEW के सर्वर या कोड का कोई समझौता।

गहरा समाधान रूटिंग परत पर उतरा। यह प्रकरण **RPKI** (Resource Public Key Infrastructure) और **ROAs** (Route Origin Authorizations) के लिए सबसे अधिक उद्धृत तर्कों में से एक बन गया — क्रिप्टोग्राफिक रिकॉर्ड जो नेटवर्क को सत्यापन योग्य तरीके से घोषित करने देते हैं कि कौन से autonomous systems को कौन से IP प्रीफिक्स की घोषणा करने की *अनुमति* है। वैध ROAs के साथ, Ohio ISP से "मैं Amazon के पते ले लूँगा" की एक आवारा घोषणा को **RPKI-invalid** के रूप में चिह्नित किया जा सकता है और [अंधे होकर प्रचारित](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=blindly%20propagated%20the%20announcements) होने के बजाय गिराया जा सकता है। Kentik परिणाम को सीधे नोट करता है: यदि आज एक उचित रूप से हस्ताक्षरित प्रीफिक्स के खिलाफ वही घोषणा की जाती, [तो इसे RPKI-invalid के रूप में मूल्यांकन किया जाता](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=it%20would%20have%20been%20evaluated%20as%20RPKI-invalid)। इस तरह के हमलों के बाद के वर्षों में, बड़े नेटवर्क ने ठीक इस वर्ग के मार्ग के लिए ROAs प्रकाशित करने में तेज़ी लाई।

लेकिन RPKI अपनाना एक वैश्विक, बहु-वर्षीय, ऑप्ट-इन प्रयास है। बाकी सभी के लिए सबक सरल और अधिक तत्काल था: आपके डोमेन की सुरक्षा उन परतों पर निर्भर करती है जिनके आप मालिक नहीं हैं और जिन्हें आप देख नहीं सकते।

## यह BGP और DNS के डिफ़ॉल्ट-ट्रस्ट के बारे में क्या सिखाता है

यह घटना याद रखने योग्य है क्योंकि यह "डोमेन सुरक्षा" की सामान्य मानसिक अवधारणा को उलट देती है।

अधिकांश लोग सोचते हैं कि डोमेन सुरक्षा का मतलब एक मजबूत रजिस्ट्रार पासवर्ड, दो-कारक प्रमाणीकरण, और एक रजिस्ट्रार लॉक है। यह सब वास्तविक और आवश्यक है — और इनमें से **कोई भी 24 अप्रैल 2018 को नहीं रोक सकता था।** हमलावरों ने रजिस्ट्रार को कभी नहीं छुआ, MyEtherWallet के DNS रिकॉर्ड को कभी नहीं छुआ, इसके सर्वर को कभी नहीं छुआ। रिकॉर्ड पूरे समय सही चीज़ कह रहे थे। इंटरनेट ने बस उन्हें रखने वाली जगह तक क्वेरीज़ पहुँचाना बंद कर दिया।

कुछ स्थायी निष्कर्ष:

1. **आपका डोमेन उधार के भरोसे पर चलता है।** रेज़ोल्यूशन BGP पर निर्भर करता है, और BGP, [डिफ़ॉल्ट रूप से... peers द्वारा भेजी गई सभी रूट घोषणाओं पर भरोसा करने के लिए डिज़ाइन किया गया है](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers)। आपके पास एक त्रुटिहीन DNS कॉन्फ़िगरेशन हो सकता है और फिर भी एक परत नीचे हाईजैक हो सकता है।

2. **DNS poisoning DNS को कभी छुए बिना प्राप्त की जा सकती है।** DNS सर्वर के मार्ग को हाईजैक करें और आप उत्तरों को नियंत्रित करते हैं, तब भी जब authoritative रिकॉर्ड अछूते हों।

3. **TLS एक वास्तविक बैकस्टॉप है — और एक नाजुक।** सर्टिफिकेट चेतावनी उपयोगकर्ताओं और कुल नुकसान के बीच खड़ी एकमात्र चीज़ थी। यह तकनीकी रूप से काम किया और व्यवहारिक रूप से विफल रहा। एक सुरक्षा नियंत्रण जिसे उपयोगकर्ता क्लिक करके पार कर सकता है, केवल उतना ही मजबूत है जितना उपयोगकर्ता का धैर्य।

4. **ऑन-चेन अंतिमता सुरक्षा जाल हटा देती है।** बैंक लॉगिन के लिए, एक ज़हरीला सत्र बुरा है। क्रिप्टो वॉलेट के लिए, यह अपरिवर्तनीय है। किसी अलग तरह की साइट के खिलाफ वही हमला एक डर होता; यहाँ यह स्थायी नुकसान था।

5. **डिफेंस इन डेप्थ में रूटिंग परत शामिल होनी चाहिए।** नेटवर्क स्तर पर RPKI/ROA, साथ ही आपके प्रीफिक्स की अप्रत्याशित उत्पत्ति घोषणाओं की निगरानी, अब किसी भी उच्च-मूल्य वाली चीज़ के लिए बुनियादी आवश्यकताएं हैं।

## Namefi का नज़रिया

![सत्यापन योग्य, टैंपर-प्रतिरोधी डोमेन स्वामित्व का रंगीन चित्रण — एक हरी ढाल, एक हरे Namefi टोकन, और DNS निरंतरता द्वारा सुरक्षित एक डोमेन कार्ड](../../assets/the-myetherwallet-bgp-dns-attack-03-namefi-angle.jpg)

MyEtherWallet अटैक एक तीखी याद दिलाता है कि एक डोमेन एकल चीज़ नहीं है जिसके आप "मालिक" हैं — यह विश्वास संबंधों का एक स्टैक है, जिसकी कोई भी परत को पलटा जा सकता है: [रजिस्ट्री](/hi/glossary/registry/), रजिस्ट्रार, DNS प्रदाता, और वैश्विक रूटिंग फैब्रिक जो उस प्रदाता को क्वेरीज़ पहुँचाता है।

[Namefi](https://namefi.io) उस स्टैक की *स्वामित्व* परत को सत्यापन योग्य और टैंपर-प्रतिरोधी बनाने के इर्द-गिर्द बनाया गया है। टोकनाइज़्ड डोमेन स्वामित्व का मतलब है कि किसी डोमेन के नियंत्रण को क्रिप्टोग्राफिक रूप से सिद्ध और स्थानांतरित किया जा सकता है जो ऑडिट करने योग्य है, बजाय इसके कि यह केवल एक प्रदाता पर एक खाता पासवर्ड पर निर्भर हो — जबकि DNS के साथ संगत रहे। यह अपने आप में BGP को ठीक नहीं करता; स्वामित्व परत पर कुछ भी यह नहीं बदलता कि इंटरनेट पैकेट को कैसे रूट करता है। लेकिन यह उसी अंतर्निहित बीमारी पर हमला करता है जिसे इस घटना ने उजागर किया: **बहुत अधिक महत्वपूर्ण इंटरनेट भरोसा अंतर्निहित है, असत्यापनीय है, और जो सही संदेश को स्पूफ कर सके उसके द्वारा उलटनीय है।**

डोमेन सुरक्षा का भविष्य एक मजबूत पासवर्ड जैसा कम और हर परत पर क्रिप्टोग्राफिक प्रमाण जैसा अधिक दिखता है — सत्यापन योग्य स्वामित्व, सत्यापन योग्य रूटिंग (RPKI), सत्यापन योग्य पहचान (TLS)। MyEtherWallet के उपयोगकर्ताओं ने उन परतों के बीच के अंतर में पैसे गँवाए। उस अंतर को, एक सत्यापन योग्य परत एक बार में, बंद करना पूरी परियोजना है।

24 अप्रैल 2018 को डोमेन रिकॉर्ड कभी गलत नहीं थे। इंटरनेट ने बस उन तक पहुँचने के बारे में एक झूठ में विश्वास किया। "कौन किसका मालिक है, और आप उस तक कैसे पहुँचते हैं" को मान लिए जाने के बजाय सिद्ध करने योग्य बनाना यह सुनिश्चित करने का तरीका है कि अगली जाली घोषणा का पालन करने के बजाय उसे गिरा दिया जाए।

## स्रोत और आगे पढ़ने के लिए

- The Register — [Cryptocurrency thieves snatch ~$150k after BGP hijack reroutes MyEtherWallet DNS](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
- BleepingComputer — [Hacker Hijacks DNS Server of MyEtherWallet to Steal $160,000](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/)
- Help Net Security — [MyEtherWallet users robbed after successful DNS hijacking attack](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/)
- CyberScoop — [Amazon DNS service server hijacked for $152,000 Ether theft](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/)
- ESET WeLiveSecurity — [Ethereum cryptocurrency wallets raided after Amazon's internet domain service hijacked](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/)
- Kentik — [What can be learned from recent BGP hijacks targeting cryptocurrency services?](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/)
- Wikipedia — [BGP hijacking](https://en.wikipedia.org/wiki/BGP_hijacking)
- Bob Cromwell — [BGP Hijacking](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html)
- Neptune Mutual — [How Was MEW (MyEtherWallet) DNS Spoofed?](https://medium.com/neptune-mutual/how-was-mew-myetherwallet-dns-spoofed-cb813fab15f0)
- WCCFTech — [Hackers Hijacked DNS Servers to Steal from MyEtherWallet Users](https://wccftech.com/hackers-domain-service-to-empty-ethereum-wallets/)
