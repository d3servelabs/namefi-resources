---
title: 'जब ICANN खुद फिश हो गया: 2014 का स्पियर-फिशिंग ब्रीच जो इंटरनेट के केंद्र में था'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'वर्ष 2014 के अंत में, ICANN — वह संस्था जो इंटरनेट डोमेन नाम प्रणाली का समन्वय करती है — ने स्वीकार किया कि उसके अपने डोमेन की नकल करके भेजे गए एक स्पियर-फिशिंग ईमेल ने स्टाफ की साख चुरा ली और हमलावरों को सेंट्रलाइज्ड ज़ोन डेटा सिस्टम तक प्रशासनिक पहुँच दे दी। Domain Mayday की यह गहरी पड़ताल बताती है कि DNS प्राधिकरण को कैसे फिश किया गया, क्या उजागर हुआ, और यह अभी भी क्यों महत्वपूर्ण है।'
keywords: ['icann breach', 'icann spear phishing', 'czds', 'centralized zone data system', 'dns security', 'domain security', 'spear phishing attack', 'credential phishing', 'zone files', 'iana', 'salted password hashes', 'domain name system breach', 'icann 2014 hack']
---

एक विशेष प्रकार की सुर्खी होती है जो पूरे सुरक्षा उद्योग को ठिठका देती है। न "एक और रिटेलर का डेटा चोरी," न "एक और स्टार्टअप का डेटाबेस लीक" — बल्कि वह दिन जब वह संस्था, जिस पर बाकी सब *भरोसा* करते हैं, यह स्वीकार करती है कि उसे सबसे सामान्य तरीके से हैक किया गया।

दिसंबर 2014 में, वह संस्था ICANN थी। इंटरनेट कॉर्पोरेशन फॉर असाइन्ड नेम्स एंड नंबर्स — वह गैर-लाभकारी संस्था जो पूरी डोमेन नाम प्रणाली का समन्वय करती है, जो उन नियमों की रखवाली करती है जिनसे `namefi.io` और `google.com` और पृथ्वी पर हर दूसरा पता किसी सर्वर तक पहुँचता है — ने खुलासा किया कि उसके कुछ कर्मचारियों ने एक फर्जी ईमेल में एक लिंक पर क्लिक किया, एक नकली लॉगिन पृष्ठ पर अपना पासवर्ड टाइप किया, और हमलावरों को आंतरिक प्रणालियों की चाबियाँ सौंप दीं — जिसमें सेंट्रलाइज्ड ज़ोन डेटा सिस्टम (CZDS) भी शामिल था, जो वह भंडार है जहाँ से दुनिया के टॉप-लेवल-डोमेन ज़ोन फाइलें अनुरोध की जाती हैं और एक्सेस की जाती हैं।

जो संस्था इंटरनेट पर भरोसे के काम करने के तरीके को परिभाषित करती है, उसे फिश किया गया। एक नकली ईमेल से। जो ICANN होने का ढोंग कर रहा था।

यह **Domain Mayday का EP11** है — और यह वह एपिसोड है जहाँ फोन घर के भीतर से ही आ रहा है।

## ICANN क्या है, और वहाँ का उल्लंघन प्रतीकात्मक क्यों है

यह समझने के लिए कि यह खबर इतनी गहरी चोट क्यों करती है, आपको यह समझना होगा कि ICANN वास्तव में क्या करती है।

ICANN वह कंपनी नहीं है जिससे आप डोमेन खरीदते हैं। यह उससे एक स्तर ऊपर बैठती है। यह अद्वितीय पहचानकर्ताओं की वैश्विक प्रणाली का समन्वय करती है जो इंटरनेट को नेविगेट करने योग्य बनाती है: टॉप-लेवल डोमेन (`.com`, `.org`, `.io`, और सैकड़ों नए वाले), रजिस्ट्रियों और रजिस्ट्रारों द्वारा पालन किए जाने वाले नियम, और — अपने IANA कार्य के माध्यम से — DNS पदानुक्रम का सबसे ऊपरी भाग, रूट ज़ोन जिस पर हर दूसरा लुकअप अंततः निर्भर करता है।

यदि डोमेन इंटरनेट के पते हैं, तो ICANN डाकघर की मुख्य निर्देशिका चलाती है। एक रजिस्ट्रार पर उल्लंघन बुरा है। ICANN पर उल्लंघन प्रतीकात्मक है, क्योंकि ICANN को *प्राधिकरण* माना जाता है — वह एकमात्र संस्था जिसका काम नामकरण प्रणाली को व्यवस्थित और विश्वसनीय रखना है। जब इंटरनेट नामों के प्राधिकरण को समझौता किया जाता है, तो असुविधाजनक सवाल स्पष्ट हो जाता है: यदि *वे* फिश हो सकते हैं, तो कौन नहीं हो सकता?

## 2014 के अंत में: समझौता

![विशद रंगीन अवधारणा-कला जिसमें एक धोखाधड़ी वाला आधिकारिक पत्र एक विशाल रक्षक के पास से गुजर रहा है जो इंटरनेट की मास्टर कुंजियों की एक चमकती अंगूठी पकड़े हुए है, पत्र लाल चमकता है जबकि चाबियाँ नीले रंग में चमकती हैं](../../assets/the-icann-spear-phishing-breach-01-breach.jpg)

ICANN ने [अपनी सार्वजनिक घोषणा](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=We%20believe%20a%20%22spear%20phishing%22%20attack%20was%20initiated%20in%20late%20November%202014.) में समयरेखा स्पष्ट की, जो 16 दिसंबर 2014 को उल्लेखनीय स्पष्टता के साथ प्रकाशित हुई: "हमारा मानना है कि नवंबर 2014 के अंत में एक 'स्पियर फिशिंग' हमला शुरू किया गया था।"

तंत्र लगभग अपमानजनक रूप से सरल था। जैसा कि ICANN ने वर्णन किया, हमले में "[ऐसे ईमेल संदेश शामिल थे जो हमारे अपने डोमेन से आते प्रतीत होने के लिए तैयार किए गए थे और हमारे स्टाफ सदस्यों को भेजे गए थे](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=It%20involved%20email%20messages%20that%20were%20crafted%20to%20appear%20to%20come%20from%20our%20own%20domain%20being%20sent%20to%20members%20of%20our%20staff.)।" स्टाफ को ऐसे ईमेल मिले जो `icann.org` से — ICANN के भीतर से ही आते प्रतीत होते थे। कुछ ने क्लिक किया। जैसा कि The Register ने पुनर्निर्माण किया, कर्मचारियों ने "[संदेशों में एक लिंक पर क्लिक किया जो उन्हें एक नकली लॉगिन पृष्ठ पर ले गया — जिसमें स्टाफ ने अपने यूज़रनेम और पासवर्ड टाइप किए](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=clicked%20on%20a%20link%20in%20the%20messages%20that%20took%20them%20to%20a%20bogus%20login%20page)," और हमलावरों को उनके काम के ईमेल क्रेडेंशियल सौंप दिए। गायब बचाव पर The Register का सूखा निर्णय: "[टू-फैक्टर ऑथेंटिकेशन का कोई संकेत नहीं, तो।](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)"

परिणाम, ICANN के अपने शब्दों में: "[हमले के परिणामस्वरूप कई ICANN स्टाफ सदस्यों के ईमेल क्रेडेंशियल से समझौता हुआ।](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attack%20resulted%20in%20the%20compromise%20of%20the%20email%20credentials%20of%20several%20ICANN%20staff%20members.)" Help Net Security ने इसे और सादे शब्दों में रखा: "[कई स्टाफ सदस्यों को हमलावरों को उनके ईमेल क्रेडेंशियल सौंपने के लिए बेवकूफ बनाया गया](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=Several%20staff%20members%20were%20fooled%20into%20handing%20over%20their%20email%20credentials)।"

कोई जीरो-डे नहीं। कोई विदेशी मैलवेयर नहीं। एक विश्वसनीय ईमेल और एक नकली लॉगिन बॉक्स — इंटरनेट की सबसे पुरानी चाल, उन लोगों के खिलाफ चलाई गई जो इंटरनेट चलाने में मदद करते हैं।

## क्या एक्सेस किया गया: केंद्र में ज़ोन-डेटा सिस्टम

चोरी किए गए ईमेल क्रेडेंशियल अपने आप में बुरे हैं। जो चीज इस उल्लंघन को *Domain Mayday* एपिसोड बनाती है वह यह है कि हमलावर उनके *साथ* क्या तक पहुँचे।

दिसंबर 2014 की शुरुआत में, ICANN को पता चला कि समझौता किए गए लॉगिन को अन्य प्रणालियों में प्रवेश के लिए पुनः उपयोग किया गया था। सबसे गंभीर था **सेंट्रलाइज्ड ज़ोन डेटा सिस्टम** — CZDS, वह मंच जहाँ अधिकृत पक्ष दुनिया के जेनेरिक टॉप-लेवल डोमेन के लिए ज़ोन फाइलें अनुरोध करते और डाउनलोड करते हैं। ICANN का खुलासा स्पष्ट है: "[हमलावर ने CZDS में सभी फाइलों तक प्रशासनिक पहुँच प्राप्त की।](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attacker%20obtained%20administrative%20access%20to%20all%20files%20in%20the%20CZDS.)"

*प्रशासनिक* पहुँच। *सभी* फाइलों तक। The Register ने समझाया कि यह क्यों मायने रखता है: CZDS "[अधिकृत पक्षों को दुनिया के जेनेरिक टॉप-लेवल डोमेन की सभी ज़ोन फाइलों तक पहुँच देता है](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=gives%20authorized%20parties%20access%20to%20all%20the%20zone%20files%20of%20the%20world%27s%20generic%20top%2Dlevel%20domains)।" सिस्टम के *उपयोगकर्ता* साधारण लोग नहीं हैं — वे हैं, जैसा कि The Register ने नोट किया, "[दुनिया की रजिस्ट्रियों और रजिस्ट्रारों के कई प्रशासक](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=many%20of%20the%20administrators%20of%20the%20world%27s%20registries%20and%20registrars)।" हमलावर केवल एक डेटाबेस में नहीं घुसे; वे उस डेटाबेस में घुसे जिसमें नामकरण प्रणाली के द्वारपाल स्वयं लॉग इन करते हैं।

ज़ोन फाइलों से परे, उल्लंघन ने CZDS उपयोगकर्ताओं के व्यक्तिगत डेटा को उजागर किया जो उन्होंने पंजीकृत किया था। ICANN के अनुसार, चोरी में "[सिस्टम में ज़ोन फाइलों की प्रतियों के साथ-साथ उपयोगकर्ताओं द्वारा दर्ज की गई जानकारी जैसे नाम, डाक पता, ईमेल पता, फैक्स और टेलीफोन नंबर, यूज़रनेम, और पासवर्ड शामिल थे](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=This%20included%20copies%20of%20the%20zone%20files%20in%20the%20system%2C%20as%20well%20as%20information%20entered%20by%20users)।" TLDs का प्रबंधन करने वाले लोगों के यूज़रनेम और पासवर्ड — एक ऐसी प्रणाली में जिसमें एक हमलावर चोरी का बैज पहनकर घुस गया।

क्रेडेंशियल आगे भी पहुँचे। ICANN ने पुष्टि की कि हमलावरों ने **GAC Wiki** (सरकारी सलाहकार समिति का स्थान), **ICANN Blog**, और **WHOIS सूचना पोर्टल** को भी छुआ, हालांकि उसने [बाद की दो प्रणालियों पर कोई प्रभाव नहीं](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=The%20latter%20two%20were%20not%20affected%20in%20any%20way.) होने की सूचना दी और विकी पर केवल सीमित देखना हुआ।

## यह कैसे हुआ: वह बैज जिस पर "ICANN" लिखा था

![विशद रंगीन अवधारणा-कला जिसमें रात में डोमेन नाम प्रणाली के लिए एक नियंत्रण टॉवर है, एक एकल जाली चमकती बैज जिस पर एक चेकमार्क है उसके दरवाजे खोल रहा है जबकि असली गार्ड पास में खड़े हैं अनजान, लाल रोशनी की किरणें बाहर रिस रही हैं](../../assets/the-icann-spear-phishing-breach-02-spear-phishing.jpg)

तकनीकी परतों को हटा दें और हमला एक विश्वास का खेल है।

स्पियर फिशिंग साधारण फिशिंग से अपनी सटीकता में भिन्न है। यह लाखों स्पैम ईमेल नहीं है जो उम्मीद करते हैं कि कोई चारा खाएगा; यह विशिष्ट लोगों पर निशाना साधे गए ध्यानपूर्वक तैयार किए गए संदेशों की एक छोटी संख्या है, जो नियमित आंतरिक यातायात की तरह दिखने के लिए डिज़ाइन किए गए हैं। यहाँ भेष सबसे मजबूत संभव था: ईमेल `icann.org` से आता प्रतीत होता था। जैसा कि The Register ने संक्षेप में कहा, "[हमलावरों ने स्टाफ को icann.org से आते प्रतीत होने वाले नकली ईमेल भेजे।](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Attackers%20sent%20staff%20spoofed%20emails%20appearing%20to%20coming%20from%20icann.org.)"

मनोविज्ञान के बारे में सोचें। आपके अपने संगठन के डोमेन से एक ईमेल अलार्म नहीं बजाता। एक लॉगिन पृष्ठ जो उस जैसा दिखता है जिसे आप हर दिन उपयोग करते हैं, वह भी नहीं। पूरे हमले ने इस तथ्य का शोषण किया कि *आंतरिक* और *परिचित* *सुरक्षित* के समान लगते हैं — और वे समान चीज नहीं हैं। एड्रेस बार ने एक बात कही; इसके पीछे के पृष्ठ ने उसमें टाइप की गई हर चीज़ को काट लिया।

ICANN का एकमात्र वास्तविक शमन भंडारण पक्ष पर था: चोरी किए गए पासवर्ड सादे टेक्स्ट में नहीं रखे गए थे। जैसा कि खुलासे में नोट किया गया है, "[पासवर्ड सॉल्टेड क्रिप्टोग्राफिक हैश के रूप में संग्रहीत किए गए थे](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=Although%20the%20passwords%20were%20stored%20as%20salted%20cryptographic%20hashes)" — विकल्प से बेहतर, लेकिन, जैसा कि The Register ने बताया, सुरक्षा केवल तभी काम करती है जब उपयोगकर्ताओं ने उन्हीं लॉगिन को अन्यत्र पुनः उपयोग न किया हो, क्योंकि हैश को अभी भी ऑफलाइन क्रैक किया जा सकता था। उल्लंघन डाउनलोड के साथ समाप्त नहीं हुआ; इसने रक्षकों के पासवर्ड रोटेट करने और हमलावरों के उन्हें उलटने की कोशिश के बीच एक धीमी दौड़ शुरू की।

## प्रतिक्रिया और परिणाम

इसके श्रेय में, ICANN ने उल्लंघन की तुलना में खुलासे को बेहतर तरीके से संभाला।

यह हफ्तों के भीतर सार्वजनिक हुआ, CZDS पासवर्ड निष्क्रिय किए, प्रभावित उपयोगकर्ताओं को सूचित किया, और — विशेष रूप से — पारदर्शिता को एक दायित्व के बजाय एक कर्तव्य के रूप में प्रस्तुत किया। संस्था ने कहा कि वह "[इस घटना के बारे में सार्वजनिक रूप से जानकारी प्रदान कर रही है, न केवल हमारी खुलेपन और पारदर्शिता के प्रति प्रतिबद्धता के कारण, बल्कि इसलिए भी क्योंकि साइबर सुरक्षा जानकारी साझा करने से सभी संबंधित पक्षों को उनके सिस्टम के लिए खतरों का आकलन करने में मदद मिलती है](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=providing%20information%20about%20this%20incident%20publicly%2C%20not%20just%20because%20of%20our%20commitment%20to%20openness%20and%20transparency)।" इसने यह भी बताया कि उस वर्ष पहले शुरू किए गए एक सुरक्षा-संवर्धन कार्यक्रम ने "[हमले में प्राप्त अनधिकृत पहुँच को सीमित करने में मदद की](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=these%20enhancements%20helped%20limit%20the%20unauthorized%20access%20obtained%20in%20the%20attack)।"

व्यापक इंटरनेट के लिए सबसे महत्वपूर्ण पंक्ति वह थी जो *नहीं* गिरी। ICANN ने पुष्टि की: "[यह हमला किसी भी IANA-संबंधित प्रणाली को प्रभावित नहीं करता है](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=this%20attack%20does%20not%20impact%20any%20IANA%2Drelated%20systems)।" IANA — जैसा कि Help Net Security ने वर्णन किया, वह कार्य जो "[डोमेन नाम प्रणाली (DNS) में रूट ज़ोन का प्रबंधन करता है](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=manages%20the%20root%20zone%20in%20the%20Domain%20Name%20System)" — इंटरनेट के नामकरण पिरामिड का वास्तविक शीर्ष है। यदि हमलावर वहाँ पहुँच जाते, तो यह एक शर्मनाक डेटा उल्लंघन नहीं होता; यह एक संरचनात्मक आपातकाल होता।

समय ने शर्मिंदगी को और बदतर बना दिया। The Register की हेडलाइन ने इसे स्पष्ट रूप से कहा: "[स्पियर-फिशिंग हमले का समय डोमेन नाम निरीक्षक के लिए बदतर नहीं हो सकता था](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Spear%2Dphishing%20attack%20timing%20couldn%27t%20be%20worse%20for%20domain%20name%20overseer)।" क्यों? क्योंकि ICANN "[अगले साल महत्वपूर्ण IANA अनुबंध का नियंत्रण सौंपे जाने की उम्मीद करता है](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=it%20will%20prove%20extremely%20embarrassing%20to%20ICANN%2C%20which%20hopes%20to%20be%20handed%20control%20of%20the%20critical%20IANA%20contract%20next%20year)" — वही प्रबंधन संक्रमण जो तब बातचीत में था। फिश होना "हम पर DNS के दिल का भरोसा करें" के लिए एक खराब ऑडिशन है। (संदर्भ के लिए, 2014 में यह ICANN का CZDS के साथ पहला डर भी नहीं था: The Register ने एक पहले अप्रैल की घटना का उल्लेख किया जिसमें "[कई उपयोगकर्ताओं को गलती से सिस्टम तक व्यवस्थापक पहुँच दे दी गई थी](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=a%20number%20of%20users%20were%20wrongly%20given%20admin%20access%20to%20the%20system)।")

और डेटा का एक लंबा जीवन था। 21 फरवरी 2017 के एक अपडेट में जो अपनी ही घोषणा में जोड़ा गया था, ICANN ने स्वीकार किया कि उल्लंघन से जानकारी फिर से सामने आ रही थी: "[2014 में हमारी घोषित स्पियर फिशिंग घटना में प्राप्त कुछ जानकारी भूमिगत फोरमों पर बिक्री के लिए पेश की जा रही है](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=some%20information%20obtained%20in%20the%20spear%20phishing%20incident%20we%20announced%20in%202014%20is%20being%20offered%20for%20sale%20on%20underground%20forums)।" CyberScoop ने वर्षों बाद की दर बताई: "[डेटा अभी भी काले बाजारों पर $300 में बेचा और पास किया जा रहा है](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/#:~:text=the%20data%20is%20still%20being%20passed%20around%20and%20sold%20on%20black%20markets%20for%20%24300)," यह दावे के साथ कि यह पहले कभी लीक नहीं हुआ था। 2014 के अंत में एक एकल क्लिक 2017 में भी बिक्री उत्पन्न कर रहा था।

## इससे क्या सीखें: सब फिश हो सकते हैं, यहाँ तक कि DNS प्राधिकरण भी

EP11 का सबक यह नहीं है कि "ICANN लापरवाह था।" यह कुछ और विनम्र करने वाला है।

**हर कोई फिश हो सकता है।** लापरवाह नहीं। अप्रशिक्षित नहीं। *हर कोई।* वह संस्था जो शाब्दिक रूप से इंटरनेट नामों को नियंत्रित करती है — जो लोगों से भरी है जो DNS, सुरक्षा, और बुनियादी ढाँचे के बारे में जीवन यापन के लिए सोचते हैं — के कई कर्मचारियों ने फिर भी एक नकली पृष्ठ पर अपने क्रेडेंशियल टाइप किए क्योंकि ईमेल आंतरिक लगा। फिशिंग आपके ज्ञान को नहीं हराती; यह आपके ध्यान को हराती है, उन दो सेकंड के लिए जो क्लिक करने में लगते हैं।

इससे कुछ टिकाऊ सबक निकलते हैं:

1. **क्रेडेंशियल परिधि हैं।** हमलावरों ने ICANN की क्रिप्टोग्राफी को कभी नहीं तोड़ा या सर्वर दोष का शोषण नहीं किया। उन्होंने एक पासवर्ड उधार लिया। एक बार जब पहचान गेट है, तो चोरी की पहचान उल्लंघन है — यही कारण है कि फिशिंग दुनिया का सबसे विश्वसनीय हमला बना हुआ है।
2. **विशेषाधिकार प्राप्त प्रणालियों के लिए मल्टी-फैक्टर ऑथेंटिकेशन वैकल्पिक नहीं है।** The Register का "[टू-फैक्टर ऑथेंटिकेशन का कोई संकेत नहीं](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)" पर व्यंग्य ही पूरी बात है। एक दूसरा कारक शायद क्रेडेंशियल चोरी को एक गैर-घटना में बदल देता।
3. **पार्श्व आंदोलन गुणक है।** नुकसान *पुनः उपयोग* से आया — ईमेल लॉगिन को CZDS, विकी, और पोर्टल तक पहुँचने के लिए पुनः उपयोग किया गया। पहुँच को विभाजित करना और एक चोरी किए गए क्रेडेंशियल को कई दरवाजे न खोलने देना वही है जो एक उल्लंघन को नियंत्रित करता है।
4. **उल्लंघन किया गया डेटा हमेशा के लिए है।** 2017 का पुनः बिक्री साबित करती है कि "हमने पासवर्ड रीसेट कर दिए" घटना को बंद करता है लेकिन एक्सपोज़र को नहीं। नाम, पते, और फोन नंबर लीक होने के बाद वापस नहीं आते।
5. **प्राधिकरण प्रतिरक्षा के समान नहीं है।** भरोसे को परिभाषित करने वाली संस्था होना आपको उस पर सबसे बुनियादी हमले से प्रतिरक्षित नहीं बनाता। यदि कुछ भी हो, तो यह आपको बेहतर लक्ष्य बनाता है।

## Namefi का दृष्टिकोण

![रंगीन चित्रण जिसमें सत्यापन योग्य, छेड़छाड़-प्रतिरोधी डोमेन स्वामित्व दिखाया गया है — एक हरी ढाल से सुरक्षित डोमेन कार्ड, एक हरा Namefi टोकन, और DNS निरंतरता](../../assets/the-icann-spear-phishing-breach-03-namefi-angle.jpg)

ICANN उल्लंघन, अपने मूल में, *रिकॉर्ड को कौन नियंत्रित करता है* की एक कहानी है — और वह नियंत्रण एक केंद्रीकृत प्रणाली पर एकल चोरी किए गए लॉगिन के माध्यम से कैसे हाईजैक किया गया।

यही वह संरचनात्मक कमजोरी है जिस पर बैठने लायक है। जब महत्वपूर्ण डोमेन डेटा तक पहुँचने या प्रबंधन करने के लिए अधिकृत होने का प्रमाण एक प्लेटफॉर्म पर एक यूज़रनेम और पासवर्ड के पीछे रहता है, तो पूरा भरोसे का मॉडल उस पल ध्वस्त हो जाता है जब वे क्रेडेंशियल फिश हो जाते हैं। कोई दूसरी जाँच नहीं। एक विश्वसनीय ईमेल और एक पुनः उपयोग किया गया पासवर्ड नामकरण दुनिया के केंद्र में ज़ोन-डेटा सिस्टम तक प्रशासनिक पहुँच देने के लिए पर्याप्त थे।

[Namefi](https://namefi.io) एक अलग आधार पर बनाया गया है: कि डोमेन स्वामित्व और नियंत्रण **सत्यापन योग्य, छेड़छाड़-प्रतिरोधी, और एकल इनबॉक्स में एकल रहस्य पर निर्भर नहीं होना चाहिए।** डोमेन स्वामित्व को ऑन-चेन टोकन के रूप में प्रस्तुत करके जो DNS के साथ संगत रहते हैं, नियंत्रण कुछ ऐसा बन जाता है जिसे आप क्रिप्टोग्राफिक रूप से साबित और ऑडिट कर सकते हैं — न कि केवल कुछ ऐसा जो एक पासवर्ड द्वारा संरक्षित है जिसे एक स्पियर-फिशिंग ईमेल चुरा सकता है। यह किसी को फिशिंग से प्रतिरक्षित नहीं बनाता; कुछ भी नहीं बनाता। लेकिन यह विस्फोट के दायरे को कम करता है, ताकि एक उधार लिया गया क्रेडेंशियल राज्य की चाबियों से एक कदम दूर न रहे।

EP11 की स्थायी छवि वह नकली पत्र है जो इंटरनेट की मास्टर कुंजियों के संरक्षक के पास से इसलिए गुजर गया क्योंकि उसने सही वर्दी पहनी थी। समाधान एक चतुर संरक्षक नहीं है। यह एक ऐसी प्रणाली है जहाँ चाबियाँ स्वयं साबित कर सकती हैं कि वे वास्तविक हैं।

## स्रोत और आगे पढ़ने के लिए

- ICANN — [ICANN Targeted in Spear Phishing Attack | Enhanced Security Measures Implemented](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en) (प्राथमिक स्रोत, 2017 अपडेट सहित)
- The Register — [ICANN HACKED: Intruders poke around global DNS innards](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044)
- Help Net Security — [ICANN systems breached via spear-phishing emails](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/)
- Computerworld — [ICANN data compromised in spearphishing attack](https://www.computerworld.com/article/1487605/icann-data-compromised-in-spearphishing-attack.html)
- WeLiveSecurity (ESET) — [ICANN computers compromised by hackers](https://www.welivesecurity.com/2014/12/18/icann-computers-compromised-hackers/)
- Associations Now — [ICANN Systems Infiltrated in "Spear Phishing" Attack](https://associationsnow.com/2014/12/icann-systems-infiltrated-spear-phishing-attack/)
- Slate — [ICANN Got Hacked](https://slate.com/technology/2014/12/icann-hacked-in-spear-phishing-campaign.html)
- Domain Incite — [Hacked ICANN data for sale on black market](http://domainincite.com/21562-hacked-icann-data-for-sale-on-black-market)
- Slashdot — [Hackers Compromise ICANN, Access Zone File Data System](https://tech.slashdot.org/story/14/12/18/1540233/hackers-compromise-icann-access-zone-file-data-system)
- CyberScoop — [Hacked ICANN data still sells for hundreds of dollars years after breach](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/)
- DomainGang — [ICANN alerts users of CZDS & ICANN Wiki about security breach](https://domaingang.com/domain-news/icann-alerts-users-czds-icann-wiki-security-breach/)
