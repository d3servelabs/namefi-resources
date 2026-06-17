---
title: 'माईईथरवॉलेट (MyEtherWallet) BGP + DNS अटैक: कैसे हाईजैक किए गए इंटरनेट रूटिंग ने $150K मूल्य का ETH खाली कर दिया'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '24 अप्रैल 2018 को, हमलावरों ने अमेज़न रूट 53 (Amazon Route 53) के लिए इंटरनेट रूटिंग को हाईजैक किया, myetherwallet.com के लिए DNS उत्तरों में छेड़छाड़ की, और एक सेल्फ-साइंड सर्टिफिकेट के पीछे एक फ़िशिंग क्लोन परोसकर - लगभग $150,000 का एथेरियम चुरा लिया। इस बात पर डोमेन मेडे (Domain Mayday) का एक विस्तृत विश्लेषण कि क्यों DNS एक ऐसे रूटिंग लेयर पर निर्भर करता है जो डिफ़ॉल्ट रूप से भरोसा करता है।'
keywords: ['माईईथरवॉलेट', 'BGP हाईजैक', 'DNS हाईजैकिंग', 'अमेज़न रूट 53', 'रूट 53 हाईजैक', 'DNS सुरक्षा', 'BGP रूटिंग सुरक्षा', 'एथेरियम फ़िशिंग', 'सेल्फ-साइंड सर्टिफिकेट', 'enet as10297', 'rpki roa', 'क्रिप्टो वॉलेट फ़िशिंग', 'डोमेन सुरक्षा']
---

जब आप ब्राउज़र में किसी वेबसाइट का नाम टाइप करते हैं, तो आप दो अदृश्य सिस्टम्स पर भरोसा करते हैं कि वे आपके साथ ईमानदार रहेंगे।

पहला है **DNS** — इंटरनेट की फोन बुक — जो `myetherwallet.com` जैसे नाम को एक न्यूमेरिक IP एड्रेस में बदल देता है। दूसरा है **BGP**, बॉर्डर गेटवे प्रोटोकॉल (Border Gateway Protocol), जो यह तय करता है कि आपके पैकेट्स उस एड्रेस तक पहुँचने के लिए किस भौतिक रास्ते (physical path) का उपयोग करेंगे। लगभग कोई भी इन दोनों के बारे में नहीं सोचता। वे बस काम करते हैं, दिन में अरबों बार, चुपचाप।

**24 अप्रैल, 2018** की सुबह, दोनों ने एक ही समय पर झूठ बोला। लगभग दो घंटों के लिए, जो भी व्यक्ति `myetherwallet.com` टाइप करता और एक ब्राउज़र चेतावनी (browser warning) को अनदेखा करके आगे बढ़ता, उसे एक फ़िशिंग क्लोन (phishing clone) पर भेज दिया जाता, जो उस सर्वर से बहुत दूर चल रहा था जहाँ उन्हें लगा था कि वे जा रहे हैं। जब तक रूटिंग को सुधारा गया, तब तक हमलावरों ने असली यूज़र्स के वॉलेट्स से लगभग **$150,000 मूल्य का एथेरियम (Ethereum)** चुरा लिया था।

जो बात इस घटना को सुरक्षा पाठ्यक्रमों (security curricula) का एक स्थायी हिस्सा बनाती है, वह डॉलर की रकम नहीं है — इसके बाद से क्रिप्टो चोरियों का आंकड़ा इससे कहीं अधिक रहा है। वह है इसका *तरीका (mechanism)*। हमलावर कभी भी MyEtherWallet के सर्वर में नहीं घुसे। उन्होंने कभी कोई पासवर्ड गेस नहीं किया। उन्होंने इमारत पर नहीं, बल्कि **रास्ते** पर हमला किया — इंटरनेट की रूटिंग लेयर को हाईजैक करके खुद DNS में ही छेड़छाड़ की।

## DNS एक ऐसी रूटिंग लेयर के ऊपर बैठता है जो डिफ़ॉल्ट रूप से भरोसा करती है

यह समझने के लिए कि क्या हुआ, आपको पृथ्वी पर मौजूद हर डोमेन नाम के नीचे छिपी एक असहज बुनियाद (uncomfortable foundation) को समझना होगा।

DNS इस सवाल का जवाब देता है कि "`myetherwallet.com` का IP एड्रेस क्या है?" लेकिन आपकी DNS क्वेरी को सही सर्वर तक पहुँचने के लिए, इंटरनेट के राउटर्स को यह पता होना चाहिए कि उस DNS सर्वर के IP एड्रेस का स्वामित्व *किस नेटवर्क* के पास है — और यह पता लगाने के लिए, वे BGP पर निर्भर करते हैं।

समस्या यहीं पर है। BGP, अपने डिज़ाइन से ही, भरोसे पर आधारित (trust-based) सिस्टम है। जैसा कि विकिपीडिया पर क्लाउडफ्लेयर (Cloudflare) शैली का सारांश कहता है, [डिफ़ॉल्ट रूप से BGP प्रोटोकॉल को पियर्स (peers) द्वारा भेजे गए सभी रूट अनाउंसमेंट पर भरोसा करने के लिए डिज़ाइन किया गया है](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers)। सुरक्षा शोधकर्ता बॉब क्रॉमवेल इसके मूल इरादे का वर्णन और भी स्पष्ट रूप से करते हैं: [BGP को अच्छे इरादे वाले ISPs और विश्वविद्यालयों के बीच भरोसे की एक श्रृंखला (chain of trust) के रूप में डिज़ाइन किया गया था, जो उन्हें मिलने वाली जानकारी पर आँख बंद करके विश्वास करते हैं](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html#:~:text=BGP%20was%20designed%20to%20be%20a%20chain%20of%20trust)।

दूसरे शब्दों में: जब कोई नेटवर्क ऑपरेटर खड़ा होकर दुनिया को यह घोषणा करता है कि "*इन* IP एड्रेस के लिए ट्रैफ़िक *मेरे* ज़रिए आना चाहिए," तो बाकी इंटरनेट ने ऐतिहासिक रूप से इस पर बस विश्वास ही किया है। BGP में एक 'मोर-स्पेसिफिक-रूट टाईब्रेकर' (more-specific-route tiebreaker) अंतर्निहित है — यदि दो नेटवर्क समान एड्रेस का दावा करते हैं, तो जो *संकीर्ण (narrower)*, अधिक विशिष्ट ब्लॉक की घोषणा करता है, वह जीत जाता है। यही वह लीवर है जिसे कोई हमलावर खींचता है।

इसलिए किसी भी डोमेन का अटैक सरफेस (attack surface) उसके रजिस्ट्रार से बड़ा, उसके DNS प्रदाता से बड़ा, और उसके वेब होस्ट से भी बड़ा होता है। इसमें वह संपूर्ण वैश्विक रूटिंग फैब्रिक (global routing fabric) शामिल है जो आपकी DNS क्वेरी को सही जगह पहुँचाता है। MyEtherWallet को यह बात बड़े ही कड़वे अनुभव से पता चली।

## 24 अप्रैल 2018 को यूज़र्स ने क्या खोया

![Vivid colorful concept art of internet traffic flowing along a glowing data highway, suddenly diverted by a counterfeit detour sign onto a fake road leading to an impostor building, packets of light scattering into a trap](../../assets/the-myetherwallet-bgp-dns-attack-01-attack.jpg)

यह नुकसान लगभग दो घंटे की विंडो में केंद्रित था। द रजिस्टर (The Register) के अनुसार, उस दिन दुर्भावनापूर्ण रूटिंग [सुबह 11 बजे से दोपहर 1 बजे UTC के बीच](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Between%2011am%20and%201pm%20UTC) चली। उस समय सीमा में, `myetherwallet.com` तक पहुँचने का प्रयास करने वाले सभी लोगों के एक हिस्से को चुपचाप एक बहरूपिए (impostor) के हवाले कर दिया गया।

यह बहरूपिया बहुत असली लगता था। यह MyEtherWallet जैसा ही दिखता था क्योंकि यह लगभग उसका सटीक क्लोन (clone) था। *एकमात्र* चीज़ जिससे इसकी पोल खुलती थी, वह थी एक सर्टिफिकेट चेतावनी (certificate warning) — और महत्वपूर्ण बात यह है कि यूज़र्स उस चेतावनी पर सीधे क्लिक करके आगे बढ़ सकते थे। जिन लोगों ने ऐसा किया, और फिर लॉग इन किया, उन्होंने अपने ही फंड की चाबियाँ सौंप दीं। जैसा कि BleepingComputer ने रिपोर्ट किया, [जिन लोगों ने लॉग इन किया, उनके वॉलेट की प्राइवेट कीज़ (private keys) चुरा ली गईं, जिनका इस्तेमाल हमलावर ने अकाउंट खाली करने के लिए किया](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=Those%20who%20logged%20in%20had%20their%20wallet%20private%20keys%20stolen)।

अलग-अलग आउटलेट्स द्वारा चोरी का आंकड़ा थोड़ा अलग बताया गया है, लेकिन मुख्य संख्या एक समान है। BleepingComputer ने इसे [215 इथर (Ether), जो ट्रांज़ेक्शन के समय $160,000 के बराबर था](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=215%20Ether%2C%20the%20equivalent%20of%20%24160%2C000) बताया। साइबरस्कूप (CyberScoop) ने रिपोर्ट किया कि चोरों ने [215 इथर चुराने में कामयाबी हासिल की, जिसकी कीमत उस समय लगभग $152,000 थी](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/#:~:text=215%20Ether%2C%20amounting%20to%20about%20%24152%2C000)। हेल्प नेट सिक्योरिटी (Help Net Security) ने सारांशित किया कि हमलावरों ने [एथेरियम में लगभग $150,000 चुराने में कामयाबी हासिल की](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=approximately%20%24150%2C000%20in%20Ethereum)। वही 215 ETH; चोरी के समय विनिमय दर (exchange rate) के साथ बस डॉलर का आंकड़ा बदलता रहा है।

यह एक क्रिप्टो वॉलेट पर रूटिंग-प्लस-DNS हमले का क्रूर अर्थशास्त्र (brutal economics) है। यहाँ कोई फ्रॉड-रिवर्सल विभाग नहीं है, कोई चार्ज बैक नहीं है, कॉल करने के लिए कोई बैंक नहीं है। एक बार जब प्राइवेट कीज़ को हमलावर के क्लोन में दर्ज कर दिया जाता है और फंड्स को ऑन-चेन ट्रांसफर कर दिया जाता है, तो वे हमेशा के लिए चले जाते हैं।

## यह कैसे हुआ: रूट को हाईजैक करना, उत्तर में छेड़छाड़ करना, और क्लोन परोसना

![Vivid colorful concept art of a hijacked glowing world map where a GPS route is rerouted by an impostor hand redrawing the path, travelers led toward a fake landmark building while the real destination glows ignored in the distance](../../assets/the-myetherwallet-bgp-dns-attack-02-bgp-hijack.jpg)

इस हमले ने दो विफलतायों को एक साथ जोड़ दिया। इनमें से कोई भी अकेले काम नहीं करता। दोनों मिलकर विनाशकारी साबित हुए।

**पहला कदम: अमेज़न (Amazon) के DNS सर्वर के रूट को हाईजैक करना।** MyEtherWallet ने अमेज़न की प्रबंधित DNS सेवा (managed DNS service) का उपयोग किया। जैसा कि हेल्प नेट सिक्योरिटी (Help Net Security) ने स्पष्ट रूप से उल्लेख किया है, [MyEtherWallet.com अमेज़न की रूट 53 (Route 53) DNS सेवा का उपयोग करता है](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=MyEtherWallet.com%20uses%20Amazon%27s%20Route%2053%20DNS%20service)। हमलावरों ने रूट 53 (Route 53) को नहीं तोड़ा। इसके बजाय, द रजिस्टर (The Register) के अनुसार, [कोई इंटरनेट के कोर राउटर्स को BGP (Border Gateway Protocol) संदेश भेजने में सक्षम था, जिससे उन्हें यह विश्वास दिलाया जा सके कि वे AWS के कुछ सर्वरों के लिए अभिप्रेत ट्रैफ़िक को एक दुष्ट (renegade) बॉक्स में भेज दें](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=someone%20was%20able%20to%20send%20BGP)।

यह काम करने वाली घोषणा (announcement) एक अप्रत्याशित जगह से आई थी। द रजिस्टर ने रिपोर्ट किया कि [ओहियो स्थित वेबसाइट होस्टिंग कंपनी eNet से संबंधित नेटवर्क ब्लॉक AS10297 ने घोषणा की कि वह AWS के कुछ IP एड्रेस के लिए आने वाले ट्रैफ़िक पर कब्ज़ा कर सकता है](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=the%20network%20block%20AS10297%2C%20belonging%20to%20Ohio-based%20website%20hosting%20biz%20eNet)। और क्योंकि BGP अधिक-विशिष्ट मार्गों (more-specific routes) को प्राथमिकता देता है और अपने पियर्स (peers) पर भरोसा करता है, यह नकली घोषणा फैल गई। विकिपीडिया इसके पैमाने को दर्ज करता है: [अमेज़न वेब सर्विस स्पेस (Amazon Web Services space) के भीतर लगभग 1300 IP एड्रेस, जो अमेज़न रूट 53 (Amazon Route 53) को समर्पित थे, उन्हें कोलंबस, ओहियो के एक ISP, eNet (या उसके किसी ग्राहक) द्वारा हाईजैक कर लिया गया था। कई पीयरिंग पार्टनर्स, जैसे हरिकेन इलेक्ट्रिक (Hurricane Electric), ने आँख बंद करके इन घोषणाओं को फैला दिया](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=Roughly%201300%20IP%20addresses%20within%20Amazon%20Web%20Services%20space)। "आँख बंद करके फैलाना (Blindly propagated)" दो शब्दों में BGP के ट्रस्ट मॉडल की पूरी कहानी है।

**दूसरा कदम: DNS सर्वर बनना और झूठ बोलना।** एक बार जब मार्ग (route) को हाईजैक कर लिया गया, तो जो क्वेरीज़ अमेज़न के असली DNS सर्वर पर जानी चाहिए थीं, वे हमलावर के बॉक्स पर पहुँच गईं। उस बॉक्स ने रूट 53 (Route 53) का रूप धारण कर लिया। द रजिस्टर ने इसका परिणाम बताया: [वह दुष्ट मशीन तब AWS की DNS सेवा के रूप में काम करने लगी, और उसने MyEtherWallet.com के लिए गलत IP एड्रेस दे दिए, जिससे डॉट-कॉम (dot-com) पर आने वाले कुछ दुर्भाग्यशाली आगंतुकों को एक फ़िशिंग साइट की ओर भेज दिया गया](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=That%20rogue%20machine%20then%20acted%20as%20AWS%27s%20DNS%20service)। केंटिक (Kentik) का विश्लेषण इसी तथ्य को DNS की तरफ से प्रस्तुत करता है: [बहरूपिए आधिकारिक (authoritative) DNS सर्वर ने myetherwallet.com के लिए नकली प्रतिक्रियाएँ (bogus responses) वापस कीं, जिससे यूज़र्स MyEtherWallet की वेबसाइट के एक नकली संस्करण (imposter version) की ओर गुमराह हो गए](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=The%20imposter%20authoritative%20DNS%20server%20returned%20bogus%20responses%20for%20myetherwallet.com)।

**तीसरा कदम: फ़िशिंग क्लोन परोसना — रूस से।** छेड़छाड़ किए गए DNS उत्तरों ने यूज़र्स को रूस में स्थित एक सर्वर की ओर निर्देशित किया जहाँ नकली वॉलेट होस्ट किया गया था। हेल्प नेट सिक्योरिटी ने रिपोर्ट किया कि हमलावरों ने हाईजैक का इस्तेमाल करके [MyEtherWallet.com के लिए आने वाले ट्रैफ़िक को रूस के एक सर्वर पर होस्ट की गई मिलती-जुलती (lookalike) फ़िशिंग साइट पर रीडायरेक्ट कर दिया](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=they%20redirect%20traffic%20meant%20for%20MyEtherWallet.com%20to%20the%20lookalike%20phishing%20site%2C%20hosted%20on%20a%20server%20in%20Russia)।

**एक सुरक्षा उपाय जो लगभग काम कर गया था: सर्टिफिकेट।** यह वह हिस्सा है जिस पर हर पाठक को ध्यान देना चाहिए। हमलावरों ने डोमेन के *रिज़ॉल्यूशन (resolution)* और *सर्वर* को नियंत्रित कर लिया था, लेकिन वे किसी विश्वसनीय अथॉरिटी (trusted authority) द्वारा जारी किया गया `myetherwallet.com` के लिए एक मान्य TLS सर्टिफिकेट तैयार नहीं कर सके। इसलिए ब्राउज़र ने वही किया जो उसे करना चाहिए था — उसने एक चेतावनी (warning) दी। हेल्प नेट सिक्योरिटी ने इसका सटीक वर्णन किया: [एकमात्र चीज़ जिसने यह संकेत दिया कि फ़िशिंग साइट वह नहीं थी जो वह होने का दिखावा कर रही थी, वह थी आगंतुकों को दिखाई गई चेतावनी जिसमें कहा गया था कि साइट द्वारा उपयोग किया गया TLS सर्टिफिकेट एक अज्ञात अथॉरिटी द्वारा साइन किया गया था (यानी, सेल्फ-साइंड था)](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=the%20only%20thing%20that%20gave%20some%20indication)। BleepingComputer ने भी माना कि जो लोग ध्यान दे रहे थे उनके लिए यह संकेत स्पष्ट था: [नकली वेबसाइट को पहचानना आसान था क्योंकि हमलावरों ने एक सेल्फ-साइंड (self-signed) TLS सर्टिफिकेट का इस्तेमाल किया था जिसने सभी आधुनिक ब्राउज़रों में एक त्रुटि (error) को ट्रिगर कर दिया था](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=The%20fake%20website%20was%20easy%20to%20spot)।

लेकिन "पहचानना आसान" इस धारणा पर आधारित है कि यूज़र रुक जाएगा। ESET की वीलाइवसिक्योरिटी (WeLiveSecurity) ने बताया कि असल में यह सुरक्षा कितनी कमज़ोर थी: [एकमात्र स्पष्ट सुराग जो किसी सामान्य यूज़र को दिखाई दे सकता था, वह यह था कि जब वे नकली MyEtherWallet साइट पर जाते, तो उन्हें एक त्रुटि संदेश (error message) दिखाई देता जिसमें बताया गया होता कि साइट एक अविश्वसनीय SSL सर्टिफिकेट का उपयोग कर रही थी](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/#:~:text=The%20only%20obvious%20clue%20that%20a%20typical%20user%20might%20have%20spotted)। ब्राउज़र ने अपना हाथ उठाया और कहा *यह गलत है*। जिन यूज़र्स ने पैसे खोए, वे वे थे जिन्होंने फिर भी आगे बढ़ने के लिए क्लिक किया — और पीड़ितों को [एक HTTPS त्रुटि संदेश (error message) पर क्लिक करके आगे बढ़ना पड़ा, क्योंकि नकली MyEtherWallet.com एक अविश्वसनीय TLS/SSL सर्टिफिकेट का उपयोग कर रहा था](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Victims%20had%20to%20click%20through%20a%20HTTPS%20error%20message)।

## प्रतिक्रिया और परिणाम

जो लोग पेशेवर रूप से रूटिंग की निगरानी करते हैं, उनके लिए यह हाईजैक कोई छिपी हुई बात नहीं थी। नेटवर्किंग मॉनिटर्स ने देखा कि उसी दो घंटे की विंडो के भीतर नकली, अधिक-विशिष्ट प्रीफ़िक्स (prefixes) दिखाई दिए और फिर वापस ले लिए गए, और एक बार जब दुष्ट घोषणा (rogue announcement) को हटा लिया गया, तो रूट 53 (Route 53) की सामान्य रूटिंग वापस आ गई।

MyEtherWallet ने खुद इस बात पर ज़ोर दिया कि उसके अपने इंफ्रास्ट्रक्चर में सेंध नहीं लगी थी। जैसा कि कंपनी ने इसके तुरंत बाद ज़ोर दिया, समस्या इंटरनेट की प्लंबिंग में थी, न कि इसके एप्लिकेशन में — यह MEW के सर्वर या कोड के समझौते (compromise) के बजाय, BGP के माध्यम से प्राप्त किए गए रिज़ॉल्यूशन पथ (resolution path) की एक [DNS हाईजैकिंग](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=DNS%20hijacking) थी।

इसका गहरा समाधान रूटिंग लेयर पर हुआ। यह घटना **RPKI** (Resource Public Key Infrastructure) और **ROA** (Route Origin Authorizations) के लिए सबसे अधिक उद्धृत (most-cited) तर्कों में से एक बन गई — यह ऐसे क्रिप्टोग्राफ़िक रिकॉर्ड (cryptographic records) हैं जो नेटवर्क को सत्यापन योग्य तरीके (verifiable way) से यह घोषित करने देते हैं कि किन ऑटोनॉमस सिस्टम्स (autonomous systems) को किन IP प्रीफ़िक्स (IP prefixes) की घोषणा करने की *अनुमति* है। मान्य ROA (Route Origin Authorizations) लागू होने के साथ, ओहियो के एक ISP की ओर से की गई भटकती हुई "मैं अमेज़न के एड्रेस ले लूँगा" घोषणा को **RPKI-अमान्य (RPKI-invalid)** के रूप में फ़्लैग (flag) किया जा सकता है और उसे [आँख बंद करके फैलाने (blindly propagated)](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=blindly%20propagated%20the%20announcements) के बजाय ड्रॉप किया जा सकता है। केंटिक सीधे परिणाम को नोट करता है: यदि आज एक उचित रूप से साइन किए गए प्रीफ़िक्स के खिलाफ वही घोषणा की जाती है, तो [इसका मूल्यांकन RPKI-अमान्य के रूप में किया जाता](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=it%20would%20have%20been%20evaluated%20as%20RPKI-invalid)। इस तरह के हमलों के बाद के वर्षों में, बड़े नेटवर्क ने ठीक इसी श्रेणी के रूट के लिए ROA प्रकाशित करने में तेज़ी लाई।

लेकिन RPKI को अपनाना एक वैश्विक, बहु-वर्षीय (multi-year), स्वैच्छिक (opt-in) प्रयास है। बाकी सभी के लिए सबक सरल और अधिक तत्काल था: आपके डोमेन की सुरक्षा उन परतों (layers) पर निर्भर करती है जिनके आप मालिक नहीं हैं और जिन्हें आप देख नहीं सकते।

## BGP और DNS के डिफ़ॉल्ट रूप से भरोसेमंद होने के बारे में यह क्या सिखाता है

इस घटना को याद रखना ज़रूरी है क्योंकि यह "डोमेन सुरक्षा (domain security)" के सामान्य मानसिक मॉडल (mental model) को उलट देती है।

ज़्यादातर लोग सोचते हैं कि डोमेन सुरक्षा का मतलब है एक मज़बूत रजिस्ट्रार पासवर्ड, टू-फैक्टर ऑथेंटिकेशन (2FA) और एक रजिस्ट्रार लॉक। यह सब वास्तविक और आवश्यक है — और **इसमें से कोई भी 24 अप्रैल, 2018 की घटना को नहीं रोक पाता।** हमलावरों ने कभी रजिस्ट्रार को नहीं छुआ, कभी MyEtherWallet के DNS रिकॉर्ड्स को नहीं छुआ, कभी इसके सर्वर को नहीं छुआ। रिकॉर्ड्स पूरे समय सही बात बता रहे थे। इंटरनेट ने बस क्वेरीज़ को उस स्थान तक पहुँचाना बंद कर दिया जहाँ वे रखे हुए थे।

कुछ स्थायी सीखें (takeaways):

1. **आपका डोमेन उधार के भरोसे पर चलता है।** रिज़ॉल्यूशन (Resolution) BGP पर निर्भर करता है, और BGP, [डिफ़ॉल्ट रूप से... पियर्स द्वारा भेजे गए सभी रूट अनाउंसमेंट पर भरोसा करने के लिए डिज़ाइन किया गया है](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers)। आपका DNS कॉन्फ़िगरेशन दोषरहित (flawless) हो सकता है और फिर भी एक लेयर नीचे हाईजैक हो सकता है।

2. **DNS पॉइज़निंग को बिना DNS छुए हासिल किया जा सकता है।** DNS सर्वर के रूट को हाईजैक करें और आप उत्तरों (answers) को नियंत्रित करते हैं, भले ही आधिकारिक रिकॉर्ड (authoritative records) अछूते हों।

3. **TLS एक वास्तविक बचाव है — और एक नाज़ुक भी।** सर्टिफिकेट चेतावनी ही एकमात्र चीज़ थी जो यूज़र्स और कुल नुकसान के बीच खड़ी थी। यह तकनीकी रूप से काम कर गया और व्यवहारिक रूप से विफल रहा। कोई सुरक्षा नियंत्रण (security control) जिसे यूज़र क्लिक करके पार कर सकता है, वह केवल यूज़र के धैर्य जितना ही मज़बूत होता है।

4. **ऑन-चेन फ़ाइनलिटी (On-chain finality) सुरक्षा जाल (safety net) को हटा देती है।** एक बैंक लॉगिन के लिए, एक दूषित सेशन (poisoned session) बुरा है। एक क्रिप्टो वॉलेट के लिए, यह अपरिवर्तनीय (irreversible) है। एक अलग प्रकार की साइट के खिलाफ यही हमला एक डर (scare) होता; यहाँ यह एक स्थायी नुकसान था।

5. **गहन सुरक्षा (Defense in depth) में रूटिंग लेयर को शामिल किया जाना चाहिए।** नेटवर्क स्तर पर RPKI/ROA, और आपके प्रीफ़िक्स (prefixes) के अप्रत्याशित मूल घोषणाओं (origin announcements) की निगरानी, अब किसी भी उच्च-मूल्य वाली चीज़ के लिए आवश्यक बुनियादी आवश्यकताएँ (table stakes) हैं।

## नेम्फी (Namefi) का दृष्टिकोण (angle)

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-myetherwallet-bgp-dns-attack-03-namefi-angle.jpg)

MyEtherWallet हमला इस बात की एक तीखी याद दिलाता है कि डोमेन कोई एक चीज़ नहीं है जिसके आप "मालिक" हैं — यह विश्वास संबंधों (trust relationships) का एक स्टैक (stack) है, जिसकी किसी भी परत (layer) को नष्ट किया जा सकता है: रजिस्ट्री, रजिस्ट्रार, DNS प्रदाता, और वह वैश्विक रूटिंग फैब्रिक (global routing fabric) जो उस प्रदाता तक क्वेरीज़ पहुँचाता है।

[नेम्फी (Namefi)](https://namefi.io) को उस स्टैक की *स्वामित्व (ownership)* परत को सत्यापन योग्य (verifiable) और छेड़छाड़-प्रतिरोधी (tamper-resistant) बनाने के इर्द-गिर्द बनाया गया है। टोकनाइज़्ड डोमेन स्वामित्व (Tokenized domain ownership) का मतलब है कि डोमेन के नियंत्रण को क्रिप्टोग्राफ़िक रूप से साबित किया जा सकता है और इस तरह से ट्रांसफर किया जा सकता है जिसका ऑडिट किया जा सके, न कि केवल एक प्रदाता के पास अकाउंट पासवर्ड पर पूरी तरह से निर्भर रहा जाए — और वह भी DNS के साथ संगत (compatible) रहते हुए। यह अपने आप में BGP को ठीक नहीं करता; स्वामित्व परत (ownership layer) पर कुछ भी इस बात को दोबारा नहीं लिखता कि इंटरनेट पैकेट्स को कैसे रूट करता है। लेकिन यह उसी अंतर्निहित बीमारी (underlying disease) पर प्रहार करता है जिसे इस घटना ने उजागर किया था: **बहुत अधिक महत्वपूर्ण इंटरनेट विश्वास (internet trust) निहित (implicit), असत्यापनीय (unverifiable) और उस व्यक्ति द्वारा प्रतिवर्ती (reversible) है जो सही संदेश को स्पूफ़ (spoof) कर सकता है।**

डोमेन सुरक्षा का भविष्य एक मज़बूत पासवर्ड जैसा कम, और हर परत पर क्रिप्टोग्राफ़िक प्रमाण (cryptographic proof) जैसा अधिक दिखता है — सत्यापन योग्य स्वामित्व (verifiable ownership), सत्यापन योग्य रूटिंग (RPKI), सत्यापन योग्य पहचान (TLS)। MyEtherWallet के यूज़र्स ने उन परतों के बीच की खाई (gap) में पैसे खो दिए। एक-एक सत्यापन योग्य परत करके उस खाई को पाटना ही पूरी परियोजना (project) है।

24 अप्रैल, 2018 को डोमेन रिकॉर्ड्स कभी गलत नहीं थे। इंटरनेट ने उन तक पहुँचने के तरीके के बारे में बस एक झूठ पर विश्वास कर लिया था। "कौन किस चीज़ का मालिक है, और आप उस तक कैसे पहुँचते हैं" को मान लेने के बजाय साबित करने योग्य (provable) बनाना ही यह सुनिश्चित करने का तरीका है कि अगली जाली घोषणा (forged announcement) का पालन करने के बजाय उसे ड्रॉप कर दिया जाए।

## स्रोत और आगे पढ़ने के लिए सामग्री (Sources and further reading)

- द रजिस्टर — [क्रिप्टोकरेंसी चोरों ने BGP हाईजैक द्वारा MyEtherWallet DNS को री-रूट करने के बाद ~$150k चुराए](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
- BleepingComputer — [हैकर ने MyEtherWallet का DNS सर्वर हाईजैक कर $160,000 चुराए](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/)
- हेल्प नेट सिक्योरिटी — [सफल DNS हाईजैकिंग हमले के बाद MyEtherWallet यूज़र्स लूटे गए](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/)
- साइबरस्कूप — [$152,000 के इथर की चोरी के लिए अमेज़न DNS सेवा सर्वर हाईजैक किया गया](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/)
- ESET वीलाइवसिक्योरिटी — [अमेज़न की इंटरनेट डोमेन सेवा के हाईजैक होने के बाद एथेरियम क्रिप्टोकरेंसी वॉलेट पर छापा](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/)
- केंटिक — [क्रिप्टोकरेंसी सेवाओं को लक्षित करने वाले हालिया BGP हाईजैक से क्या सीखा जा सकता है?](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/)
- विकिपीडिया — [BGP हाईजैकिंग (BGP hijacking)](https://en.wikipedia.org/wiki/BGP_hijacking)
- बॉब क्रॉमवेल — [BGP हाईजैकिंग (BGP Hijacking)](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html)
- नेपच्यून म्यूचुअल — [MEW (MyEtherWallet) DNS को कैसे स्पूफ़ किया गया?](https://medium.com/neptune-mutual/how-was-mew-myetherwallet-dns-spoofed-cb813fab15f0)
- WCCFTech — [हैकर्स ने MyEtherWallet यूज़र्स से चोरी करने के लिए DNS सर्वर हाईजैक किए](https://wccftech.com/hackers-domain-service-to-empty-ethereum-wallets/)