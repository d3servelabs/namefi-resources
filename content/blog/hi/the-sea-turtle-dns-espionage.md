---
title: 'Sea Turtle: वह राज्य-प्रायोजित अभियान जिसने सरकारों की जासूसी के लिए DNS को हाईजैक किया'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '"Sea Turtle" — 2019 में Cisco Talos द्वारा उजागर किया गया एक राज्य-प्रायोजित अभियान — ने रजिस्ट्रारों, रजिस्ट्रियों और DNS प्रदाताओं से समझौता करके DNS को हाईजैक किया, सरकारों, मंत्रालयों और ऊर्जा कंपनियों को हमलावरों के सर्वरों पर पुनर्निर्देशित किया, वैध प्रमाणपत्र जाली बनाए और यहाँ तक कि एक राष्ट्रीय TLD रजिस्ट्री का उल्लंघन किया।'
keywords: ['sea turtle dns hijacking', 'cisco talos sea turtle', 'dns hijacking attack', 'state-sponsored dns attack', 'registry compromise', 'registrar compromise', 'dns espionage campaign', 'lets encrypt mitm certificate', 'netnod compromise', 'ics-forth greece ccTLD', 'cisa emergency directive 19-01', 'dns security', 'domain ownership security', 'nation state cyberattack']
---

अधिकांश साइबर हमले किसी लक्ष्य के *अंदर* घुसने की कोशिश करते हैं। Sea Turtle अभियान ने कुछ अधिक शांत और कहीं अधिक खतरनाक काम किया: इसने उस **नक्शे** को तोड़ा जो पूरे इंटरनेट को बताता है कि लक्ष्य कहाँ रहता है।

जब आप किसी सरकारी मंत्रालय का वेब पता टाइप करते हैं, या उसके अधिकारियों को ईमेल भेजते हैं, तो आपका कंप्यूटर पहले Domain Name System — [DNS](/hi/glossary/dns/) — से उस मानव-पठनीय नाम को सही सर्वर के संख्यात्मक पते में अनुवाद करने के लिए कहता है। यह लुकअप इतना बुनियादी है कि इंटरनेट पर लगभग कुछ भी इसे सत्यापित नहीं करता। हम बस यह मान लेते हैं कि नाम उस स्थान तक पहुँचता है जहाँ उसे पहुँचना चाहिए। Sea Turtle के ऑपरेटरों ने इस भरोसे को पूरी तरह समझा, और उन्होंने दो से अधिक वर्षों तक मध्य पूर्व और उत्तरी अफ्रीका की सरकारों की जासूसी करने के लिए इसका दुरुपयोग किया।

अप्रैल 2019 में Cisco Talos द्वारा उजागर किया गया, Sea Turtle DNS को राष्ट्र-राज्य जासूसी के एक उपकरण के रूप में हथियार बनाने का सबसे स्पष्ट केस स्टडी है। हमलावरों ने व्यक्तिगत कर्मचारियों को फिश करके उम्मीद नहीं की। वे [रजिस्ट्रार](/hi/glossary/registrar/)ों, रजिस्ट्रियों और DNS प्रदाताओं के पीछे गए जो अपने लक्ष्यों के *ऊपर* बैठे थे — वे संस्थाएँ जो नियंत्रित करती हैं कि नाम कैसे हल होते हैं — और उस सुविधाजनक स्थिति से उन्होंने संपूर्ण संगठनों के ट्रैफिक को पुनर्निर्देशित किया, क्रेडेंशियल एकत्र किए और वे क्रिप्टोग्राफिक प्रमाणपत्र जाली बनाए जो प्रतिरूपण को असंभव बनाने वाले थे।

## राष्ट्र-राज्य जासूसी के लिए DNS एक लक्ष्य के रूप में

DNS को कभी-कभी इंटरनेट की फोन बुक कहा जाता है, लेकिन यह इसे कम आँकना है। यह डाक रूटिंग सिस्टम के करीब है: हर ईमेल, हर लॉगिन, हर API कॉल एक नाम को हल करने से शुरू होती है। यदि आप रिज़ॉल्यूशन को नियंत्रित करते हैं, तो आप गंतव्य को नियंत्रित करते हैं — और आप उन वार्तालापों के बीच में अदृश्य रूप से बैठ सकते हैं जिन्हें दोनों पक्ष निजी और प्रत्यक्ष मानते हैं।

यह DNS को लगभग एक आदर्श जासूसी लक्ष्य बनाता है। एक DNS प्रदाता से समझौता करना हर उस संगठन के ट्रैफिक को उजागर कर सकता है जो उस पर निर्भर है। और एंडपॉइंट पर मैलवेयर के विपरीत, DNS हेरफेर पीड़ित की अपनी मशीनों को अछूता छोड़ देता है: स्कैन करने के लिए कुछ नहीं है, क्वारंटाइन करने के लिए कुछ नहीं है। रिकॉर्ड बस कहीं नई ओर इंगित करते हैं।

Talos इस तंत्र के बारे में स्पष्ट थे। जैसा कि उनकी रिपोर्ट में कहा गया है, [DNS हाईजैकिंग तब होती है जब अभिनेता DNS नाम रिकॉर्ड को अवैध रूप से संशोधित करके उपयोगकर्ताओं को अभिनेता-नियंत्रित सर्वरों पर इंगित कर सकता है](https://blog.talosintelligence.com/seaturtle/#:~:text=DNS%20hijacking%20occurs%20when%20the%20actor%20can%20illicitly%20modify%20DNS%20name%20records%20to%20point%20users%20to%20actor%2Dcontrolled%20servers)। वर्णन करना सरल; व्यवहार में विनाशकारी।

## Sea Turtle अभियान (2017–2019)

![एक छायादार राज्य अभिनेता की विशद रंगीन अवधारणा कला जो एक कछुए के रूप में चुपचाप एक क्षेत्र के शैलीबद्ध नक्शे पर चमकते तीरों को छिपे हुए सर्वरों की ओर पुनर्निर्देशित कर रहा है, नियॉन नेटवर्क लाइनें मुड़ रही हैं](../../assets/the-sea-turtle-dns-espionage-01-campaign.jpg)

Sea Turtle कोई झटपट काम नहीं था। Talos ने आकलन किया कि [यह चल रहा ऑपरेशन जनवरी 2017 की शुरुआत में शुरू हुआ और 2019 की पहली तिमाही तक जारी रहा](https://blog.talosintelligence.com/seaturtle/#:~:text=The%20ongoing%20operation%20likely%20began%20as%20early%20as%20January%202017%20and%20has%20continued%20through%20the%20first%20quarter%20of%202019) — दो से अधिक वर्षों के धैर्यपूर्ण, निरंतर ऑपरेशन।

उस अवधि में, Talos की गणना के अनुसार, [इस अभियान के दौरान 13 अलग-अलग देशों में कम से कम 40 अलग-अलग संगठनों से समझौता किया गया](https://blog.talosintelligence.com/seaturtle/#:~:text=at%20least%2040%20different%20organizations%20across%2013%20different%20countries%20were%20compromised%20during%20this%20campaign)। TechCrunch ने इसकी पहुँच का सारांश दिया: समूह ने [दो से अधिक वर्षों तक 13 देशों में 40 सरकारी और खुफिया एजेंसियों, दूरसंचार कंपनियों और इंटरनेट दिग्गजों को लक्षित किया था](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/), जिनमें [आर्मेनिया, मिस्र, तुर्की, स्वीडन, जॉर्डन और संयुक्त अरब अमीरात](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/) जैसे देशों में पीड़ित पाए गए।

Talos ने अभियान को किसी विशिष्ट सरकार से सार्वजनिक रूप से जोड़ने से मना कर दिया, लेकिन ऑपरेटर के स्तर के बारे में आश्वस्त थे। जैसा कि Cisco Talos के Craig Williams ने TechCrunch को बताया, [यह एक नया समूह है जो अपेक्षाकृत अनोखे तरीके से काम कर रहा है जो हमने पहले नहीं देखा है, नई रणनीति, तकनीकों और प्रक्रियाओं का उपयोग करते हुए](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/), और टीम ने समूह की [प्राथमिक प्रेरणाओं को जासूसी करना](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/) बताया।

## किसे लक्षित किया गया, और क्या दाँव पर था

पीड़ितों की सूची एक खुफिया संग्रह की इच्छा सूची की तरह लगती है। Talos ने प्राथमिक लक्ष्यों को [राष्ट्रीय सुरक्षा संगठनों, विदेश मंत्रालयों और प्रमुख ऊर्जा संगठनों](https://blog.talosintelligence.com/seaturtle/#:~:text=national%20security%20organizations%2C%20ministries%20of%20foreign%20affairs%2C%20and%20prominent%20energy%20organizations) के रूप में पहचाना — ठीक वे संस्थाएँ जिनके आंतरिक संचार को एक शत्रु राज्य सबसे अधिक पढ़ना चाहेगा।

पीड़ितों का एक दूसरा स्तर, एक अर्थ में, और भी अधिक खुलासा करने वाला था। Talos ने पाया कि हमलावरों ने [कई DNS रजिस्ट्रारों, दूरसंचार कंपनियों और इंटरनेट सेवा प्रदाताओं](https://blog.talosintelligence.com/seaturtle/#:~:text=numerous%20DNS%20registrars%2C%20telecommunication%20companies%2C%20and%20internet%20service%20providers) पर भी हमला किया। ये अंतिम पुरस्कार नहीं थे; वे *साधन* थे। बुनियादी ढाँचे के प्रदाताओं के मालिक बनकर, हमलावरों ने डाउनस्ट्रीम वास्तविक लक्ष्यों के लिए DNS में हेरफेर करने का लाभ उठाया।

BleepingComputer के सारांश ने पुरस्कार को स्पष्ट रूप से कैप्चर किया: मुख्य लक्ष्य [विदेश मंत्रालय, सैन्य संगठन, खुफिया एजेंसियाँ, ऊर्जा कंपनियाँ](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/) थे। जब आप एक विदेशी मंत्रालय के ईमेल और लॉगिन ट्रैफिक को चुपचाप इंटरसेप्ट कर सकते हैं, तो आपको एन्क्रिप्शन तोड़ने की जरूरत नहीं है — आप बस क्रेडेंशियल एकत्र कर सकते हैं और मेल पढ़ सकते हैं जैसे वह बहती है।

## यह कैसे हुआ: विश्वास की श्रृंखला को हाईजैक करना

![एक man-in-the-middle आकृति की विशद रंगीन अवधारणा कला जो चमकते सरकारी लिफाफों की एक धारा को इंटरसेप्ट कर रही है और प्रत्येक पर एक जाली हरी मुहर लगाने के बाद उन्हें आगे भेज रही है, दो ताले एक टूटी हुई पाइपलाइन के आर-पार एक-दूसरे का सामना कर रहे हैं](../../assets/the-sea-turtle-dns-espionage-02-registry-compromise.jpg)

यही वह था जिसने Sea Turtle को असामान्य रूप से परिष्कृत बनाया: हमलावर शायद ही कभी सीधे अपने पीड़ितों पर गए। इसके बजाय उन्होंने विश्वास की श्रृंखला पर चढ़ाई की।

Talos द्वारा पुनर्निर्मित और स्वतंत्र रिपोर्टिंग द्वारा पुष्टि किया गया पैटर्न मोटे तौर पर इस प्रकार था। पहले, DNS प्रदाता, रजिस्ट्रार, या [रजिस्ट्री](/hi/glossary/registry/) में एक पैर जमाएँ — आम तौर पर स्पीयर-फिशिंग के माध्यम से या किसी ज्ञात कमज़ोरी का फायदा उठाकर। उस पहुँच के साथ, [DNS रिकॉर्ड को संशोधित करें ताकि लक्ष्य के वैध उपयोगकर्ताओं को अभिनेता-नियंत्रित सर्वरों पर इंगित किया जा सके](https://blog.talosintelligence.com/seaturtle/#:~:text=Modified%20DNS%20records%20to%20point%20legitimate%20users%20of%20the%20target%20to%20actor%2Dcontrolled%20servers)। वे सर्वर एक man-in-the-middle परत के रूप में स्थापित किए गए थे: BleepingComputer के अनुसार, [Sea Turtle ऑपरेटरों ने एक man-in-the-middle (MitM) फ्रेमवर्क स्थापित किया जो पीड़ित द्वारा उपयोग की जाने वाली वैध सेवाओं का प्रतिरूपण करता था, जिसका उद्देश्य लॉगिन क्रेडेंशियल चोरी करना था](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)। पीड़ित अपने सामान्य मेल या VPN पोर्टल जैसे दिखने वाली जगह पर लॉग इन करते, और हमलावर [जब उपयोगकर्ता इन अभिनेता-नियंत्रित सर्वरों के साथ इंटरैक्ट करते तो वैध उपयोगकर्ता क्रेडेंशियल कैप्चर करते](https://blog.talosintelligence.com/seaturtle/#:~:text=Captured%20legitimate%20user%20credentials%20when%20users%20interacted%20with%20these%20actor%2Dcontrolled%20servers), फिर उन्हें चुपचाप वास्तविक सेवा पर रिले करते ताकि कुछ भी गड़बड़ न लगे।

सबसे चतुर — और सबसे चिंताजनक — टुकड़ा यह था कि उन्होंने ताले को कैसे हराया। ट्रैफिक को पुनर्निर्देशित करना एक बात है; ब्राउज़र प्रमाणपत्र चेतावनी ट्रिगर किए बिना ऐसा करना दूसरी बात है। Sea Turtle ने इसे उन डोमेन के लिए वास्तविक, वैध प्रमाणपत्र प्राप्त करके हल किया जिनका वे प्रतिरूपण कर रहे थे। Talos ने पाया कि हमलावरों ने [उसी डोमेन के लिए किसी अन्य प्रदाता से certificate authority-signed X.509 प्रमाणपत्र प्राप्त किया](https://blog.talosintelligence.com/seaturtle/#:~:text=obtained%20a%20certificate%20authority%2Dsigned%20X.509%20certificate), यह नोट करते हुए कि [ये अभिनेता अपने MitM सर्वरों में Let's Encrypt, Comodo, Sectigo और self-signed प्रमाणपत्रों का उपयोग करते हैं](https://blog.talosintelligence.com/seaturtle/#:~:text=use%20Let%27s%20Encrypts%2C%20Comodo%2C%20Sectigo%2C%20and%20self%2Dsigned%20certificates)। चूँकि वे DNS रिकॉर्ड को नियंत्रित करते थे, वे उन स्वचालित डोमेन-सत्यापन जाँचों को पास कर सकते थे जिन पर मुफ्त certificate authorities निर्भर करती हैं — और एक ऐसे डोमेन के लिए एक वैध हरे ताले के साथ निकल सकते थे जिसके वे मालिक नहीं थे।

Brian Krebs, जो इससे निकटता से संबंधित पहले की लहर का दस्तावेजीकरण कर रहे थे, ने वही प्लेबुक वर्णित की: हमलावर [इन डोमेन के DNS रिकॉर्ड को बदलते प्रतीत हुए ताकि डोमेन यूरोप में उन सर्वरों पर इंगित करें जिन्हें वे नियंत्रित करते थे](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/), और फिर [SSL प्रदाताओं Comodo और/या Let's Encrypt से उन डोमेन के लिए SSL प्रमाणपत्र प्राप्त करने में सक्षम थे](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)। उद्धृत पीड़ितों में से एक [mail.gov.ae था, जो संयुक्त अरब अमीरात के सरकारी कार्यालयों के लिए ईमेल संभालता है](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)।

### रजिस्ट्री समझौते

अभियान की उच्चतम सीमा उन संगठनों का समझौता था जो DNS का केवल *उपयोग* नहीं करते बल्कि पूरे देशों के लिए इसे *चलाते* हैं।

पहले सार्वजनिक रूप से पुष्टि किए गए मामले में स्वीडन का Netnod शामिल था। जैसा कि Krebs ने रिपोर्ट किया, हमलावरों ने [Netnod के domain name registrar पर खातों तक पहुँच प्राप्त की](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/), और Netnod ने खुद बताया कि उसे [2 जनवरी को हमले में अपनी भूमिका का पता चला](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)। महत्वपूर्ण रूप से, Netnod गंतव्य नहीं था — यह एक दरवाजा था। BleepingComputer ने नोट किया कि Netnod ने कहा [वे हमलों का लक्ष्य नहीं थे बल्कि हमलावर के लिए "इंटरनेट सेवाओं के लॉगिन विवरण को कैप्चर" करने का एक मार्ग थे](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)।

Talos ने व्यापक महत्व को स्पष्ट शब्दों में वर्णित किया: ऑपरेटर [एक root server zone का प्रबंधन करने वाले संगठनों के खिलाफ पहले सार्वजनिक रूप से पुष्टि किए गए मामले के लिए जिम्मेदार थे](https://blog.talosintelligence.com/seaturtle/#:~:text=responsible%20for%20the%20first%20publicly%20confirmed%20case%20against%20an%20organizations%20that%20manages%20a%20root%20server%20zone)। जब इंटरनेट की मूल पता पुस्तिका के एक टुकड़े को चलाने वाले लोगों को चुपचाप प्रतिरूपित किया जा सकता है, तो यह धारणा कि DNS डिफ़ॉल्ट रूप से भरोसेमंद है, टिकना बंद हो जाती है।

## प्रतिक्रिया और परिणाम: वे नहीं रुके

इस पैमाने पर DNS हाईजैकिंग ने एक आधिकारिक प्रतिक्रिया को आकर्षित किया। जनवरी 2019 में, अमेरिकी Cybersecurity and Infrastructure Security Agency ने [Emergency Directive 19-01, "Mitigate DNS Infrastructure Tampering"](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed) जारी किया — CISA द्वारा कभी भी जारी की गई पहली emergency directive — संघीय एजेंसियों को अपने DNS रिकॉर्ड की ऑडिट करने, DNS प्रबंधन खातों पर क्रेडेंशियल बदलने और उन खातों पर multi-factor authentication सक्षम करने का आदेश दिया। यह एक मौन स्वीकृति थी कि DNS प्रशासन राष्ट्रीय सुरक्षा की अग्रिम पंक्ति बन गया था।

Sea Turtle के बारे में सबसे चौंकाने वाली बात, हालाँकि, वह है जो इसके उजागर होने के *बाद* हुआ। अधिकांश अभियान एक बार जब Talos जैसा कोई विक्रेता उनकी ट्रेडक्राफ्ट प्रकाशित करता है तो शांत हो जाते हैं। Sea Turtle ने विपरीत किया।

जुलाई 2019 के एक अनुवर्ती में, Talos ने रिपोर्ट किया कि समूह को नए पीड़ित मिले थे, जिनमें [एक country code top-level domain (ccTLD) रजिस्ट्री शामिल थी, जो उस विशेष देश कोड का उपयोग करने वाले हर डोमेन के DNS रिकॉर्ड का प्रबंधन करती है](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=a%20country%20code%20top%2Dlevel%20domain%20%28ccTLD%29%20registry)। विशेष रूप से, [ग्रीस के लिए ccTLD, Institute of Computer Science of the Foundation for Research and Technology - Hellas (ICS-Forth)](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=The%20Institute%20of%20Computer%20Science%20of%20the%20Foundation%20for%20Research%20and%20Technology%20%2D%20Hellas%20%28ICS%2DForth%29%2C%20the%20ccTLD%20for%20Greece) — वह निकाय जो `.gr` namespace चलाता है — से समझौता किया गया था। SecurityWeek ने नोट किया कि ICS-Forth द्वारा सार्वजनिक रूप से उल्लंघन स्वीकार करने के बाद भी, [Cisco टेलीमेट्री ने पुष्टि की कि समझौता कम से कम पाँच और दिनों तक जारी रहा](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/)।

समूह पर Talos का आकलन असामान्य रूप से तीखा था: [यह समूह असामान्य रूप से निडर प्रतीत होता है, और आगे जाकर इसे रोका जाने की संभावना नहीं है](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=this%20group%20appears%20to%20be%20unusually%20brazen%2C%20and%20will%20be%20unlikely%20to%20be%20deterred%20going%20forward)। वे सही थे। Sea Turtle एकबारगी नहीं था; यह एक प्रदर्शन था कि DNS-परत की जासूसी काम करती है, और इसे करने वाले लोग खुलेआम जारी रखने के इच्छुक हैं।

## यह DNS को महत्वपूर्ण बुनियादी ढाँचे के रूप में क्या सिखाता है

भू-राजनीति को अलग कर दें और Sea Turtle के पीछे इंटरनेट की नामकरण परत वास्तव में कैसे काम करती है, इसके बारे में असहज सबक का एक समूह बचता है।

1. **DNS विश्वास की एक श्रृंखला है, और आप इसे पूरी तरह से नियंत्रित नहीं करते।** आपकी सुरक्षा उत्कृष्ट हो सकती है। लेकिन आपके डोमेन का रिज़ॉल्यूशन एक रजिस्ट्रार और एक रजिस्ट्री से गुज़रता है, और यदि कोई भी समझौता किया जाता है, तो आपके नेटवर्क को छुए बिना आपके रिकॉर्ड बदले जा सकते हैं। Sea Turtle ने साबित किया कि हमलावर जानबूझकर उस कड़ी को लक्षित करेंगे जिसमें आपकी सबसे कम दृश्यता है।

2. **एक वैध प्रमाणपत्र एक वैध गंतव्य का प्रमाण नहीं है।** हरा ताला प्रमाणित करता है कि कनेक्शन *जो भी डोमेन को अभी नियंत्रित करता है* उसके लिए एन्क्रिप्टेड है — और यदि किसी हमलावर ने DNS को हाईजैक किया है, तो वह वे हैं। Domain-validated प्रमाणपत्र केवल उतने ही भरोसेमंद हैं जितना DNS जिसके खिलाफ वे सत्यापन करते हैं।

3. **DNS हेरफेर पीड़ित को लगभग अदृश्य है।** पीड़ित की मशीनों पर कोई मैलवेयर नहीं चलता। Endpoint स्कैनर कुछ नहीं देखते। एकमात्र संकेत यह है कि रिकॉर्ड कहीं ऐसी जगह इंगित कर रहे हैं जहाँ उन्हें नहीं होना चाहिए — जो कि ठीक यही कारण है कि अप्रत्याशित परिवर्तनों के लिए DNS रिकॉर्ड की निगरानी करना और उन्हें लॉक करना बहुत महत्वपूर्ण है।

4. **रजिस्ट्रार और रजिस्ट्री खाता सुरक्षा राष्ट्रीय-सुरक्षा बुनियादी ढाँचा है।** CISA की पहली कभी emergency directive मूल रूप से DNS प्रबंधन खातों पर क्रेडेंशियल के बारे में थी। Multi-factor authentication, registry locks, और DNS रिकॉर्ड बदल सकने वाले खातों तक कड़ाई से नियंत्रित पहुँच स्वच्छता की बारीकियाँ नहीं हैं — ये एक डोमेन के मालिक होने और केवल ऐसा दिखने के बीच का अंतर हैं।

## Namefi का दृष्टिकोण

![सत्यापन योग्य, छेड़छाड़-प्रतिरोधी डोमेन स्वामित्व का रंगीन चित्रण — एक हरे ढाल, एक हरे Namefi टोकन और DNS निरंतरता द्वारा सुरक्षित एक डोमेन कार्ड](../../assets/the-sea-turtle-dns-espionage-03-namefi-angle.jpg)

Sea Turtle, मूल रूप से, इस बारे में एक कहानी है कि *कौन किसी डोमेन के रिकॉर्ड बदलने की अनुमति रखता है* — और यह कितना कठिन है कि बाकी दुनिया यह बता सके कि वह अधिकार कब चुपचाप चुरा लिया गया है।

पारंपरिक मॉडल उस अधिकार को रजिस्ट्रार और रजिस्ट्री खातों में केंद्रित करता है जो अक्सर केवल एक पासवर्ड और एक ईमेल पते से सुरक्षित होते हैं। जब वे खाते गिरते हैं, तो डोमेन का नियंत्रण उनके साथ चुपचाप गिरता है। कोई अंतर्निहित, स्वतंत्र रूप से सत्यापन योग्य रिकॉर्ड नहीं है कि कौन वैध रूप से एक नाम रखता है, और नियंत्रण हाथ बदलने पर कोई छेड़छाड़-स्पष्ट ट्रेल नहीं है।

[Namefi](https://namefi.io) [डोमेन स्वामित्व](/hi/glossary/domain-ownership/) को ऐसी चीज़ के रूप में देखता है जो **डिज़ाइन द्वारा सत्यापन योग्य और छेड़छाड़-प्रतिरोधी** होनी चाहिए, जबकि DNS के साथ संगत रहे। स्वामित्व को टोकनाइज़ करना एक ऑडिटयोग्य, क्रिप्टोग्राफिक रूप से लंगर डाला गया रिकॉर्ड बनाता है कि कौन एक डोमेन को नियंत्रित करता है — जिससे अनधिकृत स्थानांतरण और चुप्पी से अधिग्रहण को बिना कोई स्पष्ट निशान छोड़े खींचना बहुत कठिन हो जाता है। यह, अपने आप में, एक रजिस्ट्री को फिश होने से नहीं रोकता। लेकिन व्यापक सबक जो Sea Turtle घर तक पहुँचाता है वह वही है जिस पर Namefi बना है: डोमेन महत्वपूर्ण बुनियादी ढाँचा है, और *यह नाम वास्तव में किसका है* का सवाल "जो भी कंट्रोल पैनल में लॉग इन कर सकता है" से अधिक मजबूत उत्तर का हकदार है।

अभियान ने *किसी डोमेन को रखने* और *यह साबित करने* के बीच की खाई का फायदा उठाकर सरकारों को पुनर्निर्देशित किया। उस खाई को बंद करना — स्वामित्व को सत्यापन योग्य, स्थानांतरण को ऑडिटयोग्य और नियंत्रण निरंतरता को सिद्ध करने योग्य बनाना — ठीक वही प्रकार का लचीलापन है जिसकी नामकरण परत को अभी भी आवश्यकता है।

## स्रोत और आगे पढ़ना

- Cisco Talos — [DNS Hijacking Abuses Trust In Core Internet Service](https://blog.talosintelligence.com/seaturtle/)
- Cisco Talos — [Sea Turtle keeps on swimming, finds new victims, DNS hijacking techniques](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/)
- TechCrunch — [A new state-backed hacker group is hijacking government domains at a phenomenal pace](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)
- BleepingComputer — ['Sea Turtle' Campaign Focuses on DNS Hijacking to Compromise Targets](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)
- SecurityWeek — [Sea Turtle's DNS Hijacking Continues Despite Exposure](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/)
- BankInfoSecurity — ['Sea Turtle' DNS Hijacking Group Conducts Espionage: Report](https://www.bankinfosecurity.com/sea-turtle-dns-hijacking-group-conducts-espionage-report-a-12390)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)
- SDxCentral — [Cisco Talos Says a Nation State Is Behind Sea Turtle DNS Hijacking Attacks](https://www.sdxcentral.com/articles/news/cisco-talos-says-a-nation-state-is-behind-sea-turtle-dns-hijacking-attacks/2019/04/)
- SecurityWeek — [State-Sponsored Hackers Use Sophisticated DNS Hijacking in Ongoing Attacks](https://www.securityweek.com/state-sponsored-hackers-use-sophisticated-dns-hijacking-ongoing-attacks/)
