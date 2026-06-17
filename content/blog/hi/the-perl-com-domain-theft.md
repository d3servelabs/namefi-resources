---
title: 'Perl.com डोमेन की चोरी: कैसे एक 30 साल पुराना कम्युनिटी होम चुपचाप चुरा लिया गया'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'जनवरी 2021 के अंत में, perl.com — Perl प्रोग्रामिंग कम्युनिटी का दशकों पुराना घर — एक रजिस्ट्रार-स्तरीय अकाउंट से सेंधमारी के जरिए चुरा लिया गया, चीन के माध्यम से ट्रांसफर किया गया, मालवेयर से जुड़े IP पर पॉइंट किया गया, और $190,000 में बिक्री के लिए लिस्ट कर दिया गया। यहाँ बताया गया है कि यह कैसे हुआ, इसे कैसे रिकवर किया गया, और यह रजिस्ट्रार अकाउंट की सुरक्षा के बारे में क्या सिखाता है।'
keywords: ['perl.com', 'perl.com डोमेन चोरी', 'डोमेन हाईजैकिंग', 'डोमेन चोरी', 'रजिस्ट्रार अकाउंट हैक', 'सोशल इंजीनियरिंग', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'DNS हाईजैक', 'डोमेन सुरक्षा', 'अकाउंट टेकओवर', 'BizCN']
---

कुछ डोमेन ऐसे इंफ्रास्ट्रक्चर होते हैं जो महज़ एक नाम की तरह दिखते हैं। **perl.com** उनमें से एक है। यह कोई मार्केटिंग एसेट या पिछले साल बनाया गया कोई ब्रांड नहीं है — यह इंटरनेट के उस बुनियादी ढाँचे का हिस्सा है जिसके इर्द-गिर्द Perl प्रोग्रामिंग कम्युनिटी वेब के शुरुआती दिनों से रह रही है, जो डॉक्यूमेंटेशन, आर्टिकल्स और इस भाषा की पब्लिक पहचान का मुख्य दरवाज़ा है।

इसलिए जब 27 जनवरी 2021 की सुबह यह मुख्य दरवाज़ा अचानक किसी और का हो गया, तो यह कोई चतुर ब्रांड प्ले या कोई बिक्री समझौता नहीं था। यह एक चोरी थी। इस डोमेन को महीनों पहले इसके असली मालिक के नियंत्रण से चुपचाप छीन लिया गया था, कई रजिस्ट्रार्स के बीच घुमाया गया, और एक ऐसे IP एड्रेस पर पॉइंट कर दिया गया जिसका मालवेयर फैलाने का इतिहास रहा है। कम्युनिटी के अपने नेटवर्क ऑपरेटरों ने इसे स्पष्ट शब्दों में कहा: ["perl.com डोमेन को आज सुबह हाईजैक कर लिया गया है, और यह वर्तमान में एक पार्किंग साइट को पॉइंट कर रहा है।"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

यह हमारी Domain Mayday सीरीज़ के EP19 की कहानी है: कैसे एक तीस साल पुराना कम्युनिटी डोमेन बिना एक भी सर्वर तोड़े (हैक किए) चुरा लिया गया, और इसे वापस पाने के लिए क्या कुछ करना पड़ा।

## 90 के दशक की शुरुआत से होल्ड किया गया एक डोमेन

इस चोरी को समझने के लिए, आपको यह समझना होगा कि इसका सेटअप कितना साधारण था — और कैसे वह साधारणपन ही इसकी सबसे बड़ी कमज़ोरी बन गया।

perl.com को किसी मज़बूत कॉर्पोरेट तिजोरी के अंदर नहीं रखा गया था। इसे उसी तरह होल्ड किया गया था जैसे ज़्यादातर लंबे समय तक चलने वाले डोमेन रखे जाते हैं: एक भरोसेमंद व्यक्ति के द्वारा, एक मेनस्ट्रीम रजिस्ट्रार पर, जिसे बिना किसी ड्रामे के साल-दर-साल रिन्यू किया जाता रहा। साइट के एडिटर, brian d foy ने बाद में इस घटना के अपने विवरण में इसके इतिहास का वर्णन किया: ["यह डोमेन 90 के दशक की शुरुआत में रजिस्टर किया गया था, इसके कुछ ही समय बाद Tom Christiansen को इसका नियंत्रण दे दिया गया था, और मूल रूप से वे ही इसका रजिस्ट्रेशन शुल्क देते रहे।"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

इंटरनेट के सबसे महत्वपूर्ण नामों के एक बहुत बड़े हिस्से की पूरी प्रोफाइल बस यही होती है। एक व्यक्ति, एक रजिस्ट्रार लॉगिन, और चुपचाप बिल का भुगतान करते हुए तीन दशक। यह बिल्कुल सही तरीके से काम करता है — तब तक, जब तक कि वह रजिस्ट्रार अकाउंट ही निशाना न बन जाए।

## 27 जनवरी 2021: मुख्य दरवाज़े के ताले बदल दिए गए

![Vivid colorful concept art of a decades-old wooden community signpost being quietly unscrewed from its post at night and carried off, against a glowing circuit-board sky](../../assets/the-perl-com-domain-theft-01-theft.jpg)

पहली सार्वजनिक चेतावनी (पब्लिक अलार्म) उन लोगों की तरफ से आई जो Perl कम्युनिटी का इंफ्रास्ट्रक्चर चलाते हैं। Perl NOC (Network Operations Center) ब्लॉग ने पोस्ट किया कि डोमेन को "आज सुबह" हाईजैक कर लिया गया है और अब यह किसी ऐसी जगह पॉइंट कर रहा है जहाँ इसे नहीं होना चाहिए। महज़ एक साधारण पार्किंग पेज होने से भी बुरी बात यह थी, जिसकी चेतावनी ऑपरेटर्स ने दी, कि ["कुछ ऐसे संकेत मिले हैं कि यह उन साइटों से संबंधित हो सकता है जिन्होंने अतीत में मालवेयर फैलाए हैं।"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)

brian d foy ने उसी दिन इसे सार्वजनिक रूप से उठाया। घटना की रिपोर्टिंग ने स्पष्ट शब्दों में इस समय की पुष्टि की: ["27 जनवरी को, Perl प्रोग्रामिंग के लेखक और Perl.com के एडिटर brian d foy ने ट्वीट किया कि perl.com डोमेन अचानक किसी अन्य व्यक्ति के नाम पर रजिस्टर हो गया है।"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

कम्युनिटी की प्रतिक्रिया तेज़ और व्यावहारिक थी। जबकि रिकवरी का काम शुरू हुआ, NOC ने पाठकों को एक बैकअप पर रीडायरेक्ट कर दिया: ["यदि आप कंटेंट ढूंढ रहे हैं, तो आप perldotcom.perl.org पर जा सकते हैं।"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) कैनोनिकल नाम जा चुका था, लेकिन कंटेंट अभी भी एक्सेस किया जा सकता था।

## ख़तरा क्या था: एक मालवेयर से जुड़ा IP

कोई चोरी हुआ डोमेन उतना ही खतरनाक होता है जितना उस पर भरोसा किया जाता है — और perl.com पर लोगों का बहुत ज़्यादा भरोसा था। लाखों डेवलपर्स, ट्यूटोरियल्स, CPAN टूलिंग, और वेब पर मौजूद पुराने लिंक्स इसी को पॉइंट करते थे। जो कोई भी इस नाम को नियंत्रित करता, वह यह भी नियंत्रित करता कि यह सारा भरोसा कहाँ जाकर रिज़ॉल्व होगा।

और नए मालिक ने इसे किसी सुरक्षित जगह पर पॉइंट नहीं किया। जैसा कि BleepingComputer ने दस्तावेज़ित किया था, ["डोमेन नाम perl.com चुरा लिया गया है और अब यह मालवेयर अभियानों से जुड़े एक IP एड्रेस को पॉइंट कर रहा है।"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

तकनीकी फ़िंगरप्रिंट्स (सुराग) विशिष्ट थे। DNS रिकॉर्ड्स को इस तरह फिर से लिखा गया था कि ["डोमेन को असाइन किए गए IP एड्रेस को 151.101.2.132 से बदलकर Google Cloud IP एड्रेस 35.186.238[.]101 कर दिया गया था।"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) उस डेस्टिनेशन का एक इतिहास रहा है: ["2019 में, IP एड्रेस 35.186.238[.]101 एक ऐसे डोमेन से जुड़ा था जो अब बंद हो चुके Locky रैंसमवेयर के लिए मालवेयर एक्ज़ीक्यूटेबल बाँट रहा था।"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

इन दो तथ्यों को मिलाएँ तो ख़तरा साफ़ नज़र आता है। एक ऐसा नाम जिस पर डेवलपर्स आँख मूँद कर भरोसा करते हों, वह अचानक एक ऐसे IP पर रिज़ॉल्व होने लगे जिसका मालवेयर का इतिहास रहा हो, तो यह उस तरह की तकनीकी और सुरक्षा के प्रति जागरूक ऑडियंस को धोखा देने का एक लगभग परफ़ेक्ट सेटअप है, जिन्हें आमतौर पर मूर्ख बनाना मुश्किल होता है।

## यह कैसे हुआ: रजिस्ट्रार अकाउंट, न कि सर्वर

![Vivid colorful concept art of a forged change-of-ownership slip being slid across a registry service desk, an official rubber stamp glowing red, paperwork swirling in neon light — no brand logos](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

यहाँ वह बात है जो इस घटना को महज़ एक फुटनोट (संदर्भ) के बजाय एक क्लासिक केस स्टडी बनाती है: किसी ने perl.com का वेब सर्वर हैक नहीं किया, और किसी ने DNS पासवर्ड का अंदाज़ा नहीं लगाया। यह हमला एक लेयर ऊपर, रजिस्ट्रार के स्तर पर हुआ — वह कंपनी जो यह प्रमाणित रिकॉर्ड रखती है कि इस नाम का मालिक कौन है।

अपने पोस्ट-मॉर्टम (समीक्षा) में, brian d foy ने इस वर्किंग थ्योरी (कार्यकारी सिद्धांत) का सीधे तौर पर वर्णन किया: ["हमें लगता है कि Network Solutions पर सोशल इंजीनियरिंग के ज़रिए हमला किया गया था, जिसमें जाली दस्तावेज़ आदि शामिल थे।"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) प्रेस ने भी इसे इसी तरह से प्रस्तुत किया: यह चोरी ["एक सोशल इंजीनियरिंग हमला था जिसने रजिस्ट्रार Network Solutions को वैध ऑथराइज़ेशन (अनुमति) के बिना डोमेन के रिकॉर्ड बदलने के लिए मना लिया।"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)

सबसे परेशान करने वाली बात इसकी टाइमलाइन है। कम्युनिटी ने केवल जनवरी में इस पर *गौर किया*, लेकिन असल सेंधमारी बहुत पहले हो चुकी थी। डोमेन अटॉर्नी John Berryhill द्वारा सामने लाए गए फोरेंसिक काम ने वास्तविक तारीख को महीनों पीछे धकेल दिया; जैसा कि perl.com का अकाउंट रिकॉर्ड बताता है, ["John Berryhill ने Twitter पर कुछ फोरेंसिक काम प्रदान किया जिससे पता चला कि सेंधमारी वास्तव में सितंबर में हुई थी।"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) SecurityWeek ने हमलावर के धैर्य की पुष्टि की: ["वे बताते हैं कि यह हमला सितंबर 2020 में हुआ था"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020) — इसके प्रभाव किसी को दिखने से लगभग चार महीने पहले।

इतना लंबा इंतज़ार क्यों? क्योंकि डोमेन ट्रांसफर के नियम धैर्य का ईनाम देते हैं। ["ICANN संपर्क जानकारी (contact info) के अपडेट होने के बाद 60 दिनों तक डोमेन के ट्रांसफर पर रोक लगाता है।"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) एक हमलावर जो सितंबर में चुपचाप रजिस्ट्रार अकाउंट पर कब्ज़ा कर लेता है, वह तुरंत डोमेन को उड़ाकर नहीं ले जा सकता — इसलिए वे इंतज़ार करते रहे, समय बीतने दिया, और लॉक ख़त्म होने के बाद अपनी चाल चली।

जब उन्होंने आखिरकार कदम उठाया, तो उन्होंने रिकवरी को मुश्किल बनाने के लिए रजिस्ट्रार्स और सीमाओं के पार नाम को 'लॉन्डर' (घुमाया) किया। The Register ने इस पहले पड़ाव का दस्तावेज़ीकरण किया: ["डोमेन को दिसंबर में BizCN रजिस्ट्रार को ट्रांसफर कर दिया गया था, लेकिन नेमसर्वर नहीं बदले गए थे।"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) BleepingComputer ने उसी रास्ते को भौगोलिक रूप से ट्रेस किया: यह डोमेन ["सितंबर 2020 में चोरी हो गया था जब यह Network Solutions पर था, जिसे क्रिसमस के दिन चीन के एक रजिस्ट्रार को ट्रांसफर कर दिया गया"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day) इसके बाद जनवरी में अंतिम पड़ाव आया, जब ["डोमेन को जनवरी में फिर से एक अन्य रजिस्ट्रार, Key Systems, GmbH को ट्रांसफर कर दिया गया।"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

और फिर उन्होंने इससे पैसे बनाने की कोशिश की। नाम के ताज़ा-ताज़ा रीलोकेट (स्थानांतरित) होने के बाद, ["अनधिकृत (unauthorized) रजिस्ट्रेंट ने डोमेन मार्केट Afternic पर इस डोमेन को $190,000 में बेचने की कोशिश की।"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) एक तीस साल पुरानी कम्युनिटी एसेट, जिसे कागज़ी कार्रवाई के ज़रिए चुराया गया, पुराने फ़र्नीचर की तरह बिक्री के लिए लिस्ट कर दिया गया।

## रिकवरी: कागज़ी कार्रवाई को पलटने के लिए हफ़्तों की कागज़ी कार्रवाई

वही तंत्र जिसने चोरी होने दी — रजिस्ट्रार्स, रजिस्ट्रीज़ और ओनरशिप रिकॉर्ड्स — वही वापसी का एकमात्र रास्ता भी था। दोबारा सुरक्षित करने के लिए कोई सर्वर नहीं था और लागू करने के लिए कोई पैच (अपडेट) नहीं था। किसी को रजिस्ट्रार और रजिस्ट्री चेन के माध्यम से यह *साबित* करना था कि Tom Christiansen असली मालिक थे और नया "मालिक" एक धोखेबाज़ था।

वह काम कुछ ही दिनों में शुरू हो गया। 30 जनवरी तक, Perl NOC ने बताया कि ["Network Solutions, Perl.com डोमेन की रिकवरी पर असली रजिस्ट्रेंट, Tom Christiansen के साथ काम कर रहा है।"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.) इस कोशिश के ["नतीजतन फरवरी की शुरुआत में यह डोमेन अपने पिछले मालिक, Tom Christiansen को वापस मिल गया।"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

लेकिन "वापस मिलने" (रिस्टोर होने) का मतलब यह नहीं था कि "सब ठीक हो गया"। brian d foy का अपना बयान राहत और अधूरे काम दोनों को दर्शाता है: ["Perl.com डोमेन Tom Christiansen के हाथों में वापस आ गया है और हम विभिन्न सुरक्षा अपडेट्स पर काम कर रहे हैं ताकि ऐसा दोबारा न हो।"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) चूँकि डोमेन ने मालवेयर से जुड़े एक IP को पॉइंट किया था, इसलिए सुरक्षा उत्पादों ने इसे ब्लैकलिस्ट कर दिया था और कुछ DNS रिज़ॉल्वर इसे सिंकहोल (ब्लॉक) कर रहे थे। रजिस्ट्री रिकॉर्ड सही होने के बाद भी, इंटरनेट के रेपुटेशन सिस्टम (प्रतिष्ठा प्रणालियों) में इस नाम पर फिर से भरोसा कायम होने में कई अतिरिक्त हफ़्ते लग गए — यह एक लंबी प्रक्रिया थी जिसने इस पूरी अग्निपरीक्षा को लगभग दो महीने तक खींच दिया।

foy के शब्दों में, हेडलाइन (सुर्खी) लगभग कमतर करके आंकी गई थी: ["एक हफ़्ते के लिए हमने Perl.com डोमेन से अपना नियंत्रण खो दिया था।"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) एक हफ़्ते की सक्रिय चोरी; उससे पहले महीनों की छिपी हुई सेंधमारी; और उसके बाद हफ़्तों की साफ़-सफ़ाई।

## यह रजिस्ट्रार अकाउंट की सुरक्षा और लंबे समय से रखे गए डोमेन के बारे में क्या सिखाता है

perl.com की चोरी इतनी शिक्षाप्रद इसलिए है क्योंकि इसमें कुछ भी अनोखा (हाई-टेक) नहीं हुआ था। इसका बारीकी से विश्लेषण करें तो मिलने वाली सीख काफी हद तक सामान्य हैं:

1. **आपका रजिस्ट्रार अकाउंट ही असली ख़ज़ाना है।** हर कोई अपने सर्वर और अपने DNS होस्ट को सुरक्षित करता है। लेकिन डोमेन का *ओनरशिप रिकॉर्ड* (स्वामित्व रिकॉर्ड) रजिस्ट्रार के पास रहता है, और वह अकाउंट अक्सर केवल एक पासवर्ड और एक ऐसी सपोर्ट टीम द्वारा सुरक्षित होता है जिसे बातों में फंसाकर बदलाव करवाए जा सकते हैं। perl.com को वहीं से चुराया गया था, न कि एज (सर्वर लेवल) पर।

2. **सोशल इंजीनियरिंग तकनीकी नियंत्रणों को मात दे देती है।** कोई एक्सप्लॉइट नहीं, पीड़ित की तरफ कोई मालवेयर नहीं — बस ["जाली दस्तावेज़ आदि"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.) जो एक असली रिकॉर्ड को बदलने के लिए पर्याप्त रूप से प्रेरक थे। आपके अपने लॉगिन पर टू-फैक्टर ऑथेंटिकेशन (2FA) मदद नहीं करता अगर रजिस्ट्रार के *इंसानों* (कर्मचारियों) को इसे ओवरराइड करने के लिए मना लिया जाए।

3. **लंबे समय से रखे गए डोमेन आसान शिकार होते हैं (सॉफ्ट टारगेट)।** 90 के दशक की शुरुआत में रजिस्टर किया गया और तीस वर्षों तक ऑटोपायलट पर रिन्यू किया गया नाम, पुरानी संपर्क जानकारी, मानव विफलता का एक सिंगल पॉइंट (single point of human failure) और एक ऐसा मालिक इकट्ठा कर लेता है जो रोज़ाना WHOIS रिकॉर्ड नहीं देख रहा होता। यही वह शांतिपूर्ण स्थिरता है जिसकी वजह से सितंबर में हुई सेंधमारी जनवरी तक किसी की नज़र में नहीं आती।

4. **ट्रांसफर के नियम दोनों तरफ से काम करते हैं।** 60 दिन का पोस्ट-अपडेट ट्रांसफर लॉक जिसे मालिकों की *सुरक्षा* करनी चाहिए, वह हमलावर का वेटिंग रूम (प्रतीक्षालय) बन गया। धैर्य के साथ-साथ रजिस्ट्रार्स और सीमाओं के पार इस लॉन्ड्रिंग ने एक त्वरित समाधान को मल्टी-पार्टी, कई हफ़्तों की रिकवरी में बदल दिया।

5. **चोरी की तुलना में रिकवरी धीमी होती है।** नाम चुराने में सिर्फ एक जाली दस्तावेज़ लगा। इसे वापस पाने के लिए रजिस्ट्रार्स, एक रजिस्ट्री, असली मालिक के सबूत, और फिर ब्लॉकलिस्ट और रिज़ॉल्वर्स के साथ प्रतिष्ठा (reputation) को फिर से बनाने में हफ़्तों का समय लगा। चोरी एक ट्रांज़ेक्शन (लेनदेन) है; जबकि वापसी (restitution) कई।

कड़वा सारांश यह है: perl.com जैसे डोमेन के लिए, आपके पासवर्ड की मज़बूती इस बात से कम मायने रखती है कि क्या आपके रजिस्ट्रार को इसे नज़रअंदाज़ करने के लिए धोखा दिया जा सकता है।

## Namefi का दृष्टिकोण (एंगल)

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

perl.com की चोरी का हर कदम एक कमज़ोरी पर निर्भर था: ओनरशिप (स्वामित्व) *किसी और के अकाउंट में मौजूद एक रिकॉर्ड* था, जिसे कोई भी वह व्यक्ति बदल सकता था जो सही सपोर्ट एजेंट को राज़ी कर सके। हमलावर को कभी मालिक की चाबियों (पासवर्ड/कीज़) की ज़रूरत नहीं पड़ी। उन्हें रजिस्ट्रार के भरोसे की ज़रूरत थी — और एक जाली कागज़ का टुकड़ा एक तीस साल पुरानी संपत्ति (एसेट) को दुनिया भर में ट्रांसफर करने और उसे बिक्री के लिए लिस्ट करने के लिए काफी था।

[Namefi](https://namefi.io) इसके ठीक विपरीत सिद्धांत पर बना है: कि डोमेन ओनरशिप को क्रिप्टोग्राफ़िक रूप से वेरिफ़ाई करने योग्य होना चाहिए और इसे चुपचाप बदलना (रीराइट करना) मुश्किल होना चाहिए। डोमेन कंट्रोल को एक टोकनयुक्त (tokenized), ऑन-चेन एसेट के रूप में प्रदर्शित करके जो DNS के अनुकूल बना रहता है, इस सवाल का प्रामाणिक जवाब कि "इस नाम का मालिक कौन है?" रजिस्ट्रार के डेटाबेस में एक ऐसी परिवर्तनीय लाइन नहीं रह जाता जिसे एक चालाकी भरा फोन कॉल बदल सके। ट्रांसफर, बैक-ऑफ़िस कागज़ी कार्रवाई के बजाय साइन्ड (हस्ताक्षरित) और ऑडिट करने योग्य ईवेंट्स बन जाते हैं — और इस तरह धोखे से किए गए "मालिक के बदलाव" के पास गुज़रने के लिए कोई चोर दरवाज़ा नहीं बचता।

यह रातों-रात perl.com को चोरी न हो पाने वाला नहीं बना देता; रजिस्ट्रार और रजिस्ट्रीज़ अभी भी इस चेन का हिस्सा हैं। लेकिन यह उस सटीक 'फेलियर मोड' पर प्रहार करता है जिसने इस घटना को परिभाषित किया था — *तीस वर्षों तक किसी नाम के लिए भुगतान करने* और *छेड़छाड़-प्रतिरोधी (tamper-resistantly) तरीके से यह साबित कर पाने कि यह आपका है* के बीच की खाई — और यह उस समय-सीमा (विंडो) को सिकोड़ देता है जिसमें चोरी किए गए डोमेन को किसी के आपत्ति जताने से पहले घुमाया (लॉन्डर किया) जा सके।

perl.com को अपना मुख्य दरवाज़ा वापस मिल गया। यह घटना अपने पीछे जो अधिक कठिन प्रश्न छोड़ जाती है वह यह है कि आख़िरकार इसका ताला ऐसा क्यों था जिसे सही कागज़ात वाला कोई अजनबी खोल सकता था।

## स्रोत और आगे पढ़ने के लिए (Sources and further reading)

- The Perl NOC — [perl.com hijacked](https://log.perl.org/2021/01/perlcom-hijacked.html)
- perl.com (brian d foy) — [The Hijacking of Perl.com](https://www.perl.com/article/the-hijacking-of-perl-com/)
- BleepingComputer — [Perl.com domain stolen, now using IP address tied to malware](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/)
- The Register — [Perl.com theft blamed on social engineering attack](https://www.theregister.com/2021/03/02/perl_domain_theft/)
- SecurityWeek — [Hackers Controlled Perl.com Domain Months Before Hijack](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/)
- Security Affairs — [Attackers took over the Perl.com domain in September 2020](https://securityaffairs.com/115208/cyber-crime/perl-com-hijack-september.html)
- The Daily Swig (PortSwigger) — [Domain for popular programming website Perl.com stolen in 'hack'](https://portswigger.net/daily-swig/domain-for-popular-programming-website-perl-com-stolen-in-hack)
- Slashdot — [Perl.com Domain Stolen, Now Using IP Address of Past Malware Campaigns](https://developers.slashdot.org/story/21/01/31/0220252/perlcom-domain-stolen-now-using-ip-address-of-past-malware-campaigns)
- INCIBE-CERT — [The perl.com domain has been hijacked](https://www.incibe.es/en/incibe-cert/publications/cybersecurity-highlights/perlcom-domain-has-been-hijacked)
- GIGAZINE — [Perl.com editors tell the truth about the Perl.com domain hijacking case](https://gigazine.net/gsc_news/en/20210303-hijacking-of-perl-com/)