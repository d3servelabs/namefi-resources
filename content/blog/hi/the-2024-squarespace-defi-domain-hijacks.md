---
title: 'Domain Mayday EP05: 2024 का Squarespace DeFi डोमेन मास-हाईजैक'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
description: 'जुलाई 2024 में, Google Domains से Squarespace पर एक रजिस्ट्रार माइग्रेशन ने कमज़ोर डिफ़ॉल्ट प्रमाणीकरण को एक बड़े हमले की सतह में बदल दिया। हमलावरों ने क्रिप्टो और DeFi प्रोजेक्ट्स — Compound Finance, Celer Network, Pendle, Unstoppable Domains — के डोमेन हाईजैक कर लिए और उन्हें वॉलेट-ड्रेनर फ़िशिंग साइट्स पर री-डायरेक्ट कर दिया। जानें कैसे एक "सहज" माइग्रेशन ने सैकड़ों खुले दरवाज़े बना दिए, और रजिस्ट्रार सुरक्षा और MFA के बारे में इससे क्या सीखा जा सकता है।'
keywords: ['squarespace domain hijack', 'google domains migration', 'defi dns hijack', 'compound finance hijack', 'celer network hijack', 'wallet drainer', 'inferno drainer', 'domain security', 'registrar migration', 'mfa multi-factor authentication', 'oauth account takeover', 'dns hijacking', 'crypto phishing']
relatedArticles:
  - /hi/blog/the-curve-finance-dns-hijack/
  - /hi/blog/the-badgerdao-frontend-attack/
  - /hi/blog/the-fox-it-dns-hijack/
  - /hi/blog/the-godaddy-multi-year-breach/
  - /hi/blog/the-dnspionage-campaign/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-tokenization/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/name-change-game-change/
relatedGlossary:
  - /hi/glossary/registrar/
  - /hi/glossary/dns/
  - /hi/glossary/icann/
  - /hi/glossary/web3/
  - /hi/glossary/tld/
---

जुलाई 2024 में, किसी क्रिप्टो प्रोजेक्ट की वेबसाइट के लिए सबसे खतरनाक चीज़ कोई स्मार्ट-कॉन्ट्रैक्ट बग या कोई लीक हुई [प्राइवेट की](/hi/glossary/private-key/) नहीं थी। वह था वह [रजिस्ट्रार](/hi/glossary/registrar/) जिसके पास डोमेन की बागडोर थी।

उस महीने कुछ दिनों के लिए, जो उपयोगकर्ता अपने ब्राउज़र में एक परिचित पता टाइप करते थे — किसी भरोसेमंद [लेंडिंग प्रोटोकॉल](/hi/glossary/lending-protocol/) की आधिकारिक साइट, एक ब्रिज जिसका वे सैकड़ों बार उपयोग कर चुके थे — वे ठीक वहीं पहुँचते थे जहाँ उन्हें उम्मीद थी, एक ऐसे पेज पर जो बिल्कुल सही दिखता था, और फिर अपने [वॉलेट](/hi/glossary/wallet/) को खाली होते देखते थे। सामान्य अर्थ में कुछ भी हैक नहीं हुआ था। न किसी ने कोई पासवर्ड तोड़ा था, न किसी [सीड फ्रेज़](/hi/glossary/seed-phrase/) को फ़िश किया था। हमलावर बस *डोमेन* के मुख्य दरवाज़े से अंदर चले गए थे, क्योंकि वह दरवाज़ा एक कॉर्पोरेट बदलाव के दौरान खुला छूट गया था जिस पर इन अधिकांश प्रोजेक्ट्स का ध्यान ही नहीं गया।

वह बदलाव था Google Domains का Squarespace पर माइग्रेशन। खुला दरवाज़ा था Squarespace के प्रमाणीकरण के डिफ़ॉल्ट। और परिणाम था एक समन्वित [DNS](/hi/glossary/dns/) हाईजैक की लहर, जिसने एक शोधकर्ता के शब्दों में, अरबों डॉलर की संपत्ति को नियंत्रित करने वाले क्रिप्टो और [DeFi](/hi/glossary/defi/) प्रोजेक्ट्स को निशाना बनाया।

## एक रजिस्ट्रार माइग्रेशन ने कैसे एक बड़ी हमले की सतह तैयार की

डोमेन्स को आमतौर पर एक बेड़े के रूप में नहीं सोचा जाता। हर डोमेन एकल, निजी चीज़ जैसा लगता है — आपका पता, आपका कंट्रोल पैनल, आपके DNS रिकॉर्ड। लेकिन रजिस्ट्रार उन्हें बड़ी संख्या में रखते हैं, और जब एक रजिस्ट्रार का पूरा ग्राहक आधार दूसरे में चला जाता है, तो हर अकाउंट *एक ही* माइग्रेशन लॉजिक के साथ, *एक ही* डिफ़ॉल्ट के साथ, *एक ही* समय पर चलता है। उस लॉजिक में जो भी कमज़ोरी होती है वह एकल बग नहीं होती। वह पूरे बेड़े की विशेषता होती है।

यही बात 2024 की इस घटना को व्यक्तिगत दुर्भाग्यपूर्ण समझौतों की एक कड़ी के बजाय एक *सामूहिक* घटना बनाती है।

जून 2023 में, [Squarespace ने Google Domains से लगभग 1 करोड़ डोमेन नाम खरीदे](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20purchased%20roughly%2010%20million%20domain%20names%20from%20Google%20Domains%20in%20June%202023), जब Google ने अपना रजिस्ट्रार बंद करने की घोषणा की। अगले एक साल में, [Squarespace इस लेनदेन में खरीदे गए लगभग 1 करोड़ डोमेन नामों के लिए उपयोगकर्ताओं को माइग्रेट करता रहा](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=Squarespace%20has%20been%20migrating%20users%20for%20roughly%2010%20million%20domain%20names%20purchased%20in%20the%20transaction)। संक्रमण को सहज बनाने के लिए, Squarespace ने प्रत्येक माइग्रेट किए गए डोमेन से जुड़े लोगों के लिए पूर्व-निर्मित खाते बनाए, जो Google के पास मौजूद ईमेल पतों से जोड़े गए थे।

सहज होना ही असल समस्या थी। जो माइग्रेशन उपयोगकर्ता से कुछ नहीं माँगती, वह ऐसी माइग्रेशन है जहाँ उपयोगकर्ता ने कुछ भी सिद्ध नहीं किया — न अपना पासवर्ड, न अपनी पहचान, न ईमेल पर अपना नियंत्रण। खाते अस्तित्व में थे, डोमेन जुड़े हुए थे, और किसी डोमेन और जो भी पहले आया उसके बीच एकमात्र बाधा एक लॉगिन स्क्रीन थी, जो इन माइग्रेट किए गए खातों के लिए लगभग कुछ भी नहीं माँगती थी।

## जुलाई 2024 के हाईजैक

![Vivid colorful concept-art illustration of a mass migration of domain-house keys spilling out of a moving truck during a relocation, some keys tumbling into shadowy reaching hands, a row of small houses each labeled with a glowing web address](../../assets/the-2024-squarespace-defi-domain-hijacks-01-mass-hijack.jpg)

[हमले 9 जुलाई को शुरू हुए](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=The%20attacks%20started%20on%20July%209) और अगले कुछ दिनों तक जारी रहे। ये किसी भी तरह से सूक्ष्म नहीं थे। BleepingComputer की रिपोर्ट के अनुसार, [Squarespace रजिस्ट्रार का उपयोग करने वाले विकेंद्रीकृत वित्त (DeFi) क्रिप्टोकरेंसी डोमेन को लक्षित करके समन्वित DNS हाईजैकिंग हमलों की एक लहर ने आगंतुकों को वॉलेट ड्रेनर होस्ट करने वाली फ़िशिंग साइट्स पर रीडायरेक्ट किया](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=A%20wave%20of%20coordinated%20DNS%20hijacking%20attacks%20targets%20decentralized%20finance%20%28DeFi%29%20cryptocurrency%20domains%20using%20the%20Squarespace%20registrar%2C%20redirecting%20visitors%20to%20phishing%20sites%20hosting%20wallet%20drainers)।

पहला जिसने सबका ध्यान खींचा वह DeFi लेंडिंग के सबसे बड़े नामों में से एक था। इस घटना की जाँच करने वाली सुरक्षा फर्म Blockaid ने पाया कि [इन साइट्स पर जाने वाले आगंतुकों को कनेक्टेड वॉलेट से फंड निकालने के लिए डिज़ाइन किए गए दुर्भावनापूर्ण पेजों पर रीडायरेक्ट किया जा रहा था](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=Visitors%20to%20these%20sites%20were%20being%20redirected%20to%20malicious%20pages%20designed%20to%20drain%20funds%20from%20connected%20wallets)। नकली साइट्स कच्ची नकलें नहीं थीं। Blockaid के अनुसार, [ये नकली dApps Inferno ड्रेनिंग किट के नवीनतम संस्करण को चला रहे थे, जो उपयोगकर्ताओं को ऐसे लेनदेन पर हस्ताक्षर करने के लिए धोखा देने के लिए डिज़ाइन किया गया था जो उनके वॉलेट को खाली कर दे](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=These%20fake%20dApps%20were%20running%20the%20latest%20iteration%20of%20the%20Inferno%20draining%20kit%2C%20designed%20to%20trick%20users%20into%20signing%20transactions%20that%20would%20empty%20their%20wallets)।

पुष्टि किए गए पीड़ितों की सूची इकोसिस्टम के एक रोल कॉल जैसी थी। हाईजैक किए गए प्रतिष्ठानों में [Celer Network, Compound Finance, Pendle Finance, और Unstoppable Domains](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Celer%20Network%2C%20Compound%20Finance%2C%20Pendle%20Finance%2C%20and%20Unstoppable%20Domains) शामिल थे। Compound के लिए, [उसके मुख्य डोमेन पर फ़िशिंग पेज प्रदर्शित करने के लिए कब्जा कर लिया गया था](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=its%20main%20domain%20had%20been%20taken%20over%20to%20display%20a%20phishing%20page)। Celer ने प्रयास को पकड़ा और [तुरंत अपने DNS रिकॉर्ड पुनः प्राप्त कर लिए](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=swiftly%20recovered%20its%20DNS%20records); Pendle को [भी इसी तरह की समस्याओं का सामना करना पड़ा](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=experienced%20similar%20issues) और उसने अपने उपयोगकर्ताओं को वॉलेट अनुमोदन रद्द करने की चेतावनी दी।

## क्या दाँव पर था — और उपयोगकर्ताओं ने क्या खोया

डोमेन हाईजैक की क्रूरता यह है कि यह उन सभी आदतों को विफल कर देती है जिन पर उपयोगकर्ताओं को भरोसा करना सिखाया जाता है। URL जाँचें। सुनिश्चित करें कि यह वास्तविक साइट है। लॉक आइकन देखें। यह सारी सलाह इस धारणा पर आधारित है कि डोमेन अभी भी वहीं इशारा करता है जहाँ उसे करना चाहिए। जब हमलावर डोमेन के DNS को नियंत्रित करता है, तो URL *वास्तविक* होता है — यह प्रोजेक्ट का असली पता है — और यह हमलावर के सर्वर पर जाता है। पैडलॉक हरा है। एड्रेस बार ईमानदार है। पेज एक जाल है।

इसीलिए Inferno जैसी वॉलेट-ड्रेनर किट DNS हाईजैकिंग के साथ इतनी स्वाभाविक रूप से काम करती हैं। ड्रेनर को पासवर्ड चुराने की ज़रूरत नहीं है; उसे पीड़ित को *वॉलेट कनेक्ट करने और हस्ताक्षर करने* की ज़रूरत है। और जो उपयोगकर्ता अपने लेंडिंग प्रोटोकॉल के वास्तविक डोमेन पर पहुँचा है, उसके पास किसी लेनदेन को मंजूरी देने से पहले हिचकिचाने का कोई कारण नहीं है। [फ़िशिंग](/hi/glossary/phishing/) साइट को वह सारा विश्वास मिल जाता है जो वैध डोमेन ने वर्षों में अर्जित किया था।

यह कितना बुरा हो सकता था? जो संख्या इसके दायरे को दर्शाती थी वह पुष्टि की गई चोरियों की गिनती नहीं थी, बल्कि *उजागर* प्रोजेक्ट्स की गिनती थी। Blockaid का विश्लेषण, जिसे Decrypt ने रिपोर्ट किया, स्पष्ट था: [लगभग 228 DeFi प्रोटोकॉल फ्रंट एंड अभी भी खतरे में हैं](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack#:~:text=roughly%20228%20DeFi%20protocol%20front%20ends%20are%20still%20at%20risk), क्योंकि उनमें से हर एक उसी माइग्रेट-अकाउंट की कमज़ोरी के पीछे बैठा था। जो हाईजैक हुए वे एक नमूना थे। हमले की सतह वह पूरा क्रिप्टो समूह था जो Google-से-Squarespace माइग्रेशन पर सवार हुआ था।

## यह कैसे हुआ: माइग्रेशन की प्रमाणीकरण खामी

![Vivid colorful concept-art illustration of a long row of mailboxes outside a new building, each mailbox door hanging open and unlocked, a faceless figure quietly slipping letters into one before the rightful owner arrives, warm and cold light contrast](../../assets/the-2024-squarespace-defi-domain-hijacks-02-migration-flaw.jpg)

एक बार जब शोधकर्ताओं ने इसे पुनर्निर्माण किया, तो तंत्र लगभग शर्मनाक रूप से सरल था — जो इसे बड़े पैमाने पर खतरनाक बनाता था।

दो डिज़ाइन विकल्पों से शुरुआत करें। पहला, Squarespace ने यह सत्यापित नहीं किया कि लॉग इन करने वाला व्यक्ति वास्तव में खाते के ईमेल को नियंत्रित करता है। जैसा कि शोधकर्ताओं ने कहा, [Squarespace पासवर्ड के साथ बनाए गए नए खातों के लिए ईमेल सत्यापन की आवश्यकता नहीं रखता](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts#:~:text=Squarespace%20doesn%27t%20require%20email%20verification%20for%20new%20accounts%20created%20with%20a%20password)। दूसरा, माइग्रेट किए गए खाते पूर्व-निर्मित थे लेकिन अभी तक दावा नहीं किए गए थे — उनमें कोई पासवर्ड सेट नहीं था। इसलिए जब कोई सही ईमेल के साथ आया, [चूँकि खाते पर कोई पासवर्ड नहीं है, यह उन्हें सीधे 'अपने नए खाते के लिए पासवर्ड बनाएं' प्रवाह पर भेज देता है](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=since%20there%27s%20no%20password%20on%20the%20account%2C%20it%20just%20shoots%20them%20to%20the)।

इन्हें एक साथ रखें और हमला खुद लिखा जाता है। माइग्रेट किए गए डोमेन से जुड़े ईमेल पते गुप्त नहीं थे — व्यवस्थापक और [रजिस्ट्रेंट](/hi/glossary/registrant/) संपर्क अक्सर सार्वजनिक या अनुमान योग्य होते हैं। एक हमलावर जिसने बस पहले खाता रजिस्टर किया, एक ज्ञात माइग्रेट ईमेल का उपयोग करके, इससे पहले कि वास्तविक मालिक कभी लॉग इन करे, डोमेन का नियंत्रण लेकर चला गया। MetaMask के लीड प्रोडक्ट मैनेजर Taylor Monahan, जो इस घटना को विच्छेद करने वाले शोधकर्ताओं में से एक थे, ने इस अंधे स्थान को सटीक रूप से वर्णित किया: [Squarespace ने इस संभावना का कभी हिसाब नहीं लगाया कि कोई खतरा अभिनेता किसी हाल ही में माइग्रेट किए गए डोमेन से जुड़े ईमेल का उपयोग करके खाते के लिए साइन अप कर सकता है, इससे पहले कि वैध ईमेल धारक ने स्वयं खाता बनाया हो](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20never%20accounted%20for%20the%20possibility%20that%20a%20threat%20actor%20might%20sign%20up%20for%20an%20account%20using%20an%20email%20associated%20with%20a%20recently%2Dmigrated%20domain%20before%20the%20legitimate%20email%20holder%20created%20the%20account%20themselves)।

पूर्व-लिंकिंग पहले स्थान पर क्यों मौजूद थी? सुविधा के लिए। शोधकर्ताओं ने निष्कर्ष निकाला कि [Squarespace ने मान लिया कि Google Domains से माइग्रेट करने वाले सभी उपयोगकर्ता सोशल लॉगिन विकल्प चुनेंगे](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20assumed%20all%20users%20migrating%20from%20Google%20Domains%20would%20select%20the%20social%20login%20options) — Google OAuth — न कि ईमेल-और-पासवर्ड। सिस्टम [सभी ईमेल को डोमेन से पूर्व-लिंक करता था, चाहे खाता पहले से मौजूद हो या नहीं, संभवतः इसलिए क्योंकि वे चाहते थे कि उपयोगकर्ता Google के साथ OAuth करें और तुरंत अपने सभी डोमेन तक पहुँच सकें](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/#:~:text=pre%2Dlinking%20all%20emails%20to%20domains%2C%20regardless%20of%20whether%20the%20account%20already%20exists%2C%20likely%20because%20they%20wanted%20users%20to%20be%20able%20to%20OAuth%20with%20Google%20and%20immediately%20have%20access%20to%20all%20their%20domains), जैसा कि शोधकर्ताओं ने The Register को समझाया। लेकिन ईमेल-और-पासवर्ड पथ कभी बंद नहीं किया गया, और उस पथ पर इनबॉक्स के नियंत्रण को कुछ भी सिद्ध नहीं करता था।

एक और त्वरक था। माइग्रेशन के दौरान, जो सुरक्षा इसे पकड़ लेती वह बंद कर दी गई: [Squarespace में संक्रमण के एक हिस्से के रूप में, खातों पर मल्टी-फैक्टर प्रमाणीकरण बंद कर दिया गया था](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=as%20part%20of%20the%20transition%20to%20Squarespace%2C%20multi%2Dfactor%20authentication%20was%20turned%20off%20on%20accounts)। यहाँ तक कि एक डोमेन मालिक जिसने Google Domains पर ध्यान से MFA सक्षम किया था, Squarespace पर वह MFA हटाए हुए पहुँचा। कोई पासवर्ड तोड़ने की ज़रूरत नहीं, कोई दूसरा कारक बायपास करने की ज़रूरत नहीं, कोई ईमेल इंटरसेप्ट करने की ज़रूरत नहीं — एक माइग्रेट, अनक्लेम्ड खाते के लिए, एक अनुमान योग्य ईमेल पता होना ही पूरी प्रमाणीकरण कहानी थी।

## प्रतिक्रिया और शमन

क्रिप्टो-सुरक्षा समुदाय रजिस्ट्रार से तेज़ी से आगे बढ़ा। शोधकर्ताओं — जिनमें [Samczsun, Taylor Monahan, और Andrew Mohawk](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=Samczsun%2C%20Taylor%20Monahan%2C%20and%20Andrew%20Mohawk) शामिल थे — ने तंत्र प्रकाशित किया, और Blockaid ने अभी भी कमज़ोर फ्रंट एंड की सूचियाँ प्रसारित कीं ताकि प्रोजेक्ट जाँच सकें कि वे उजागर हैं या नहीं। प्रभावित प्रोजेक्ट्स अपने खाते पुनः प्राप्त करने, DNS रिकॉर्ड रीसेट करने और उपयोगकर्ताओं को दुर्भावनापूर्ण साइट्स को दी गई टोकन अनुमतियाँ रद्द करने की चेतावनी देने के लिए दौड़ पड़े।

तुरंत उपचार की सलाह अभी भी माइग्रेट किए गए खाते पर मौजूद सभी के लिए एक जैसी थी: खाते में लॉग इन करें और इसे किसी हमलावर से पहले दावा करें, एक मजबूत अनूठा पासवर्ड सेट करें, और — सबसे ऊपर — मल्टी-फैक्टर प्रमाणीकरण फिर से सक्षम करें, जिसे माइग्रेशन ने चुपचाप हटा दिया था। Squarespace ने अपनी ओर से, माइग्रेट किए गए खातों और खाता-निर्माण प्रवाह को लॉक करने का काम किया। लेकिन संरचनात्मक सबक पैच से आगे तक जीवित रहा: एक सुरक्षा नियंत्रण जिसे कोई विक्रेता माइग्रेशन के दौरान बंद कर देता है, उस माइग्रेशन की अवधि के लिए, एक ऐसा नियंत्रण है जो मौजूद नहीं है।

## यह रजिस्ट्रार सुरक्षा और MFA के बारे में क्या सिखाता है

Squarespace हाईजैक वास्तव में एक कंपनी की गलत कॉन्फ़िगरेशन की कहानी नहीं है। यह इस बारे में एक कहानी है कि डोमेन नियंत्रण वास्तव में कहाँ रहता है, और [ब्लॉकचेन](/hi/glossary/blockchain/) के ऊपर की परत कितनी नाज़ुक है।

कुछ सबक जुलाई 2024 से परे भी सामान्य रूप से लागू होते हैं:

1. **रजिस्ट्रार खाता ही वास्तविक विश्वास की जड़ है — स्मार्ट कॉन्ट्रैक्ट नहीं।** प्रभावित किसी भी प्रोटोकॉल में कोई कॉन्ट्रैक्ट बग नहीं था। उनका [ऑन-चेन](/hi/glossary/on-chain/) कोड ठीक था। हमलावरों ने *डोमेन* लिया, और डोमेन वही है जो उपयोगकर्ता टाइप करते हैं, भरोसा करते हैं, और अपने वॉलेट कनेक्ट करते हैं। एक प्रोजेक्ट ऑन-चेन बेदाग हो सकता है और फिर भी अगर उसका DNS कंट्रोल प्लेन कमज़ोर है तो अपने उपयोगकर्ताओं को किसी हमलावर के हाथ सौंप सकता है।

2. **MFA तभी सुरक्षा है जब यह माइग्रेशन के बाद भी बचा रहे।** यहाँ दर्दनाक विवरण यह है कि MFA हमले में विफल नहीं हुआ — इसे हमले से पहले, माइग्रेशन की सुविधा के रूप में, *हटाया* गया था। MFA स्थिति को हर खाता चाल, हस्तांतरण, या विक्रेता परिवर्तन के बाद फिर से सत्यापित करने वाली चीज़ के रूप में मानें, न कि एक बार सेट करके भूल जाने वाली।

3. **"सहज" एक सुरक्षा समझौता है।** हर वह कदम जो एक माइग्रेशन उपयोगकर्ता की सुविधा के लिए छोड़ता है, एक ऐसा कदम है जहाँ पहचान असिद्ध रह जाती है। पूर्व-निर्मित खाते, स्वतः-लिंक किए गए ईमेल, और बिना सत्यापन के लॉगिन — ये सब वह घर्षण है जो उपयोगकर्ता ने महसूस नहीं किया — और घर्षण, अक्सर, वही होता है जो हमलावरों को बाहर रखता था।

4. **अनुमानित पहचानकर्ता छद्म प्रमाणपत्र हैं।** वह "रहस्य" जिसने इन डोमेन को खोला वह एक ईमेल पता था जो कभी गुप्त नहीं था। कोई भी सिस्टम जहाँ सार्वजनिक पहचानकर्ता जानने से नियंत्रण मिलता है, वह एक प्रतिरूपण से समझौते से एक कदम दूर है।

5. **एक रजिस्ट्रार का विस्फोट त्रिज्या उसके पूरे ग्राहक आधार के बराबर है।** व्यक्तिगत डोमेन सुरक्षा मायने नहीं रखती अगर रजिस्ट्रार का डिफ़ॉल्ट व्यवहार कमज़ोर है, क्योंकि डिफ़ॉल्ट एक साथ सभी पर लागू होता है। आपका डोमेन कहाँ रहता है, और वह संरक्षक प्रमाणीकरण को कैसे संभालता है, यह उतना ही परिणामी सुरक्षा निर्णय है जितना आप ऑन-चेन करते हैं।

## Namefi का दृष्टिकोण

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-2024-squarespace-defi-domain-hijacks-03-namefi-angle.jpg)

2024 के हाईजैक "कौन वास्तव में इस डोमेन का मालिक है" और "इसे नियंत्रित करने वाले खाते में कौन लॉग इन कर सकता है" के बीच की खाई में हुए। पारंपरिक मॉडल में, ये दोनों चीज़ें केवल शिथिल रूप से जुड़ी हैं: स्वामित्व एक रजिस्ट्रार के डेटाबेस में एक रिकॉर्ड है, और उस तक पहुँच जो भी प्रमाणीकरण वह रजिस्ट्रार उस सप्ताह लागू करता है, उसी से नियंत्रित होती है — जिसमें 1 करोड़ डोमेन माइग्रेशन के बीच भी शामिल है जहाँ द्वार, कुछ समय के लिए, पूरी तरह खुला था।

[Namefi](https://namefi.io) उस खाई को बंद करने के लिए बनाया गया है। [डोमेन स्वामित्व](/hi/glossary/domain-ownership/) को एक टोकनयुक्त, ऑन-चेन संपत्ति के रूप में दर्शाकर जो DNS के साथ संगत रहती है, नियंत्रण एक ऐसी चीज़ बन जाती है जिसे आप *क्रिप्टोग्राफ़िक रूप से सत्यापित* कर सकते हैं, न कि कुछ जो एक अनुमान योग्य ईमेल और एक विक्रेता के लॉगिन डिफ़ॉल्ट पर निर्भर करता है। स्वामित्व एक वॉलेट में रहता है जिसे आप नियंत्रित करते हैं, हस्तांतरण ऑडिटयोग्य होते हैं, और "इस डोमेन के रिकॉर्ड बदलने की अनुमति किसे है" सवाल का एक छेड़छाड़-प्रतिरोधी जवाब होता है, न कि ग्राहक-समर्थन का जवाब।

इससे Squarespace का माइग्रेशन बेदाग नहीं हो जाता। लेकिन यह विफलता का तरीका बदल देता है। एक हमलावर जो एक ज्ञात ईमेल से खाता रजिस्टर करता है, वह इससे टोकनयुक्त डोमेन का मालिक नहीं बन जाता — स्वामित्व एक ऐसी पंक्ति नहीं है जिस पर एक अर्ध-आरंभिक खाता चुपचाप दावा कर सके। एक नाम का नियंत्रण विमान उन संपत्तियों जितना ही मुश्किल से जाली बनाना चाहिए जिनकी वह रक्षा करता है। जुलाई 2024 में, सैकड़ों क्रिप्टो प्रोजेक्ट्स के लिए, ऐसा नहीं था। वह खाई ही वह है जिसे इंजीनियरिंग करके दूर करना उचित है।

## स्रोत और आगे पढ़ें

- Krebs on Security — [Researchers: Weak Security Defaults Enabled Squarespace Domains Hijacks](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/)
- BleepingComputer — [DNS hijacks target crypto platforms registered with Squarespace](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/)
- Blockaid — [Squarespace Domain Hijacking Incident: Attack Report](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident)
- SecurityWeek — [Hackers Exploit Flaw in Squarespace Migration to Hijack Domains](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/)
- Decrypt — [More Than 220 DeFi Protocols Still 'at Risk' From Squarespace DNS Hijack](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack)
- The Register — [Infoseccers claim Squarespace migration linked to DNS hijackings at Web3 firms](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/)
- Socket — [Squarespace Domain Hijacks Enabled by Email Address Exploit on Migrated Accounts](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts)
- SiliconANGLE — [Multiple crypto domains hijacked from Squarespace due to Google Domains migration flaw](https://siliconangle.com/2024/07/15/multiple-crypto-domains-hijacked-squarespace-due-google-domains-migration-flaw/)
- Cybernews — [Squarespace crypto domains under DNS attack, lack of MFA to blame](https://cybernews.com/security/squarespace-dns-hijack-attack-crypto-domains-mfa/)
- Hackread — [DeFi Hack Alert: Squarespace Domains Vulnerable to DNS Hijacking](https://hackread.com/defi-hack-alert-squarespace-domains-dns-hijacking/)
- CircleID — [Security Lapses Lead to Squarespace Domain Hijacks](https://circleid.com/posts/20240716-security-lapses-lead-to-squarespace-domain-hijacks)
