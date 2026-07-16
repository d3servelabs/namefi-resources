---
title: 'Domain Mayday EP03: 2020 का Twitter Bitcoin अकाउंट टेकओवर'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['nirmit-buddhiraja']
draft: false
description: '15 जुलाई 2020 को, हमलावरों ने फोन के जरिए Twitter में घुसपैठ की, Obama, Biden, Musk, Gates, Apple और Uber के वेरिफाइड अकाउंट्स को हाईजैक किया, और एक Bitcoin दोगुना करने का घोटाला चलाया — जिससे लगभग $118,000 की कमाई हुई। एक ऑनलाइन पहचान के नियंत्रण की चोरी पर गहरी पड़ताल, और यह किसी नाम के स्वामित्व के बारे में क्या सिखाता है।'
keywords: ['2020 twitter hack', 'twitter bitcoin scam', 'graham ivan clark', 'vishing', 'phone spear phishing', 'social engineering', 'account takeover', 'online identity security', 'verified account hijacking', 'twitter admin tool', 'agent tool', 'insider risk', 'domain security', 'ny dfs twitter report']
relatedArticles:
  - /hi/blog/the-bitcoin-org-dns-hijack/
  - /hi/blog/the-godaddy-multi-year-breach/
  - /hi/blog/the-2024-squarespace-defi-domain-hijacks/
  - /hi/blog/the-12-dollar-minute-someone-owned-google-com/
  - /hi/blog/the-fox-it-dns-hijack/
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
  - /hi/glossary/tld/
  - /hi/glossary/web3/
---

एक बुधवार की दोपहर कुछ घंटों के लिए, इंटरनेट पर सबसे भरोसेमंद आवाजें सभी एक ही बात कहने लगीं: मुझे Bitcoin भेजो, और मैं तुम्हें दोगुना लौटाऊंगा।

Barack Obama ने यह कहा। Joe Biden ने यह कहा। Elon Musk ने यह कहा। Bill Gates, Jeff Bezos, Kanye West, Apple, Uber — वे नीले-टिक वाले, पहचान-सत्यापित अकाउंट जिन पर करोड़ों लोगों को भरोसा करना सिखाया गया था — सभी ने लगभग शब्द-दर-शब्द एक ही कच्चा क्रिप्टो घोटाला पोस्ट किया। उन लोगों में से किसी ने एक भी अक्षर नहीं टाइप किया। उनके *अकाउंट्स* ने किया, क्योंकि कोई और उन चाबियों को थामे हुए था।

यह है **Domain Mayday EP03**। पहले दो एपिसोड नामों के बारे में थे — कौन उन्हें रखता है, कौन उन्हें ले सकता है। यह एपिसोड एक अलग वेशभूषा में उसी सवाल के बारे में है। एक Twitter हैंडल, एक वेरिफाइड बैज, एक डोमेन नाम: प्रत्येक एक पहचान का दावा है जिस पर हम बाकी लोग भरोसा करते हैं। और 15 जुलाई 2020 को, हमलावरों ने यह साबित कर दिया कि उस दावे को हड़पने के लिए कितना कम लगता है — न किसी मैलवेयर से, न किसी जीरो-डे से, बल्कि एक फोन कॉल से।

## एक हैंडल में बसता भरोसा

एक वेरिफाइड अकाउंट भरोसे का शॉर्टकट है। जब `@BarackObama` पोस्ट करते हैं, तो आप यह दोबारा सत्यापित नहीं करते कि यह वाकई वही हैं; हैंडल और बैज मिलकर *ही* सत्यापन हैं। यह शॉर्टकट अत्यंत मूल्यवान है — और अत्यंत नाजुक भी, क्योंकि सारा भरोसा अकाउंट पर जमा होता जाता है, जबकि अकाउंट का नियंत्रण कहीं और हो सकता है।

यही संरचना एक डोमेन नाम की भी है। `whitehouse.gov` पर इसलिए भरोसा किया जाता है क्योंकि हर विजिटर सर्टिफिकेट चेन की जांच नहीं करता, बल्कि इसलिए कि नाम अपने आप में अधिकार रखता है। उस नाम को नियंत्रित करें — [रजिस्ट्रार](/hi/glossary/registrar/) पर, [DNS](/hi/glossary/dns/) पर, एडमिन पैनल पर — और आप तुरंत वह सारा भरोसा विरासत में पा लेते हैं जो लोगों ने उसमें डाला है, चाहे वह कभी आपका रहा हो या न हो।

2020 का Twitter हैक *भरोसे* और *नियंत्रण* के बीच उस अंतर का सबसे साफ प्रदर्शन है जो हमारे पास है। न्यूयॉर्क के वित्तीय नियामक ने, जिसने इसलिए जांच की क्योंकि विनियमित क्रिप्टो फर्में पीड़ितों में शामिल थीं, सीधे शब्दों में कहा: यह हमला "[एक चेतावनी की कहानी है कि अपरिष्कृत साइबर अपराधियों द्वारा भी असाधारण नुकसान किया जा सकता है](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20is%20a%20cautionary%20tale%20about%20the%20extraordinary%20damage%20that%20can%20be%20caused%20even%20by%20unsophisticated%20cybercriminals)।"

## 15 जुलाई 2020: टेकओवर

![एक एकल चमकती मास्टर चाबी की ज्वलंत रंगीन कॉन्सेप्ट आर्ट जो समान नीले वेरिफाइड बैजों की एक विशाल दीवार को खोल रही है, प्रत्येक बैज क्रम में खुल रहा है](../../assets/the-2020-twitter-bitcoin-account-takeover-01-takeover.jpg)

यह तेजी से और दिन के उजाले में हुआ। Wikipedia के पुनर्निर्माण के अनुसार, "[15 जुलाई 2020 को, 20:00 और 22:00 UTC के बीच, 130 हाई-प्रोफाइल Twitter अकाउंट्स से समझौता किया गया](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=On%20July%2015%2C%202020%2C%20between%2020%3A00%20and%2022%3A00%20UTC%2C%20130%20high%2Dprofile%20Twitter%20accounts%20were%20compromised)।"

न्यूयॉर्क डिपार्टमेंट ऑफ फाइनेंशियल सर्विसेज (DFS) की रिपोर्ट इसकी कोरियोग्राफी बताती है। हमलावरों ने पहले क्रिप्टो पर वार्मअप किया: "[हैकर्स ने पहले प्रसिद्ध क्रिप्टोकरेंसी कंपनियों और व्यक्तियों से जुड़े Twitter अकाउंट्स में हेरफेर किया](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20first%20manipulated%20Twitter%20accounts%20connected%20to%20well%2Dknown%20cryptocurrency%20companies%20and%20individuals)," Bitcoin [वॉलेट](/hi/glossary/wallet/) की ओर इशारा करते हुए डायरेक्ट मैसेज और ट्वीट भेजे। फिर उन्होंने दांव बढ़ाया: "[हैकर्स ने फिर दांव काफी ऊंचा किया और लाखों फॉलोअर्स वाले वेरिफाइड Twitter अकाउंट्स को निशाना बनाया](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20then%20raised%20the%20stakes%20significantly%20and%20targeted%20verified%20Twitter%20accounts%20with%20millions%20of%20followers)।"

जिन अकाउंट्स को निशाना बनाया गया उनकी सूची प्लेटफॉर्म के सबसे भरोसेमंद अकाउंट्स की मेहमान सूची जैसी लगती है। Wikipedia नोट करता है कि "[कथित रूप से समझौता किए गए अकाउंट्स में Barack Obama, Joe Biden, Bill Gates, Jeff Bezos जैसे प्रसिद्ध व्यक्तियों... और Apple, Uber और Cash App जैसी कंपनियों के शामिल थे](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=well%2Dknown%20individuals%20such%20as%20Barack%20Obama%2C%20Joe%20Biden%2C%20Bill%20Gates%2C%20Jeff%20Bezos)।"

संदेश एक जैसा और बेतुके तरीके से सरल था। Apple के अकाउंट से, जैसा Wikipedia ने दर्ज किया: "[हम अपने समुदाय को वापस दे रहे हैं। हम Bitcoin का समर्थन करते हैं और मानते हैं कि आपको भी करना चाहिए! हमारे पते पर भेजा गया सारा Bitcoin आपको दोगुना करके वापस भेजा जाएगा!](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=We%20are%20giving%20back%20to%20our%20community.%20We%20support%20Bitcoin%20and%20believe%20you%20should%20too!%20All%20Bitcoin%20sent%20to%20our%20addresses%20will%20be%20sent%20back%20to%20you%2C%20doubled!)" एक ही प्रस्ताव, दुनिया के दर्जनों सबसे विश्वसनीय मुखों से एक साथ दोहराया गया।

हर अकाउंट का उपयोग नहीं किया गया। छुए गए 130 में से, नियामक ने पाया, "[कुल मिलाकर, Twitter हैक के दौरान 130 Twitter यूजर अकाउंट्स से समझौता किया गया। उनमें से, 45 अकाउंट्स का उपयोग ट्वीट भेजने के लिए किया गया](https://www.dfs.ny.gov/Twitter_Report#:~:text=Overall%2C%20130%20Twitter%20user%20accounts%20were%20compromised%20during%20the%20Twitter%20Hack.%20Of%20those%2C%2045%20accounts%20were%20used%20to%20send%20tweets)।" पैंतालीस मेगाफोन काफी से ज्यादा थे।

## वास्तव में क्या खोया

कच्चे डॉलर में, कमाई कम थी। DFS रिपोर्ट बताती है कि "[हैकर्स ने Twitter हैक के जरिए लगभग $118,000 मूल्य का Bitcoin चुराया](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20stole%20approximately%20%24118%2C000%20worth%20of%20bitcoin%20through%20the%20Twitter%20Hack)।" Wikipedia नोट करता है कि एक ही स्कैम वॉलेट "[320 से अधिक जमा प्राप्त हुए जिनका मूल्य US$110,000 से अधिक था, इससे पहले कि स्कैम संदेश हटाए गए](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=received%20over%20320%20deposits%20with%20a%20value%20of%20over%20US%24110%2C000%20before%20the%20scam%20messages%20were%20removed)।" इस परिमाण के उल्लंघन के लिए, $118,000 लगभग शर्मनाक रूप से मामूली है।

लेकिन डॉलर का आंकड़ा नुकसान को बहुत कम आंकता है। उस दोपहर जो वास्तव में गिरा वह था *भरोसे के संकेत के रूप में वेरिफाइड हैंडल की अखंडता*। दो घंटे के लिए, एक नीले टिक का कोई मतलब नहीं था। प्लेटफॉर्म की पूरी पहचान परत — वह चीज जो आपको विश्वास दिलाती थी कि एक ट्वीट उस व्यक्ति से आया जिसका नाम उस पर था — स्पष्ट रूप से, एक साथ एक किशोर द्वारा नियंत्रणीय थी। Twitter की प्रतिक्रिया बताने वाली थी: उसने अस्थायी रूप से कई वेरिफाइड अकाउंट्स की ट्वीट करने की क्षमता को फ्रीज कर दिया। भरोसेमंद अकाउंट्स को झूठ बोलने से रोकने का एकमात्र तरीका उन्हें चुप करना था।

यही पहचान के टेकओवर की असली कीमत है। पैसा एक फुटनोट है। नुकसान यह है कि "यह अकाउंट = यह व्यक्ति" सच रहना बंद हो जाता है, और हर कोई जो उस समीकरण पर निर्भर था, वह उजागर हो जाता है।

## यह कैसे हुआ: एक फोन कॉल, फिर एक एडमिन पैनल

![एक टेलीफोन हैंडसेट की ज्वलंत रंगीन कॉन्सेप्ट आर्ट जो मछली पकड़ने की लाइन की तरह डाली गई है, उसका हुक स्विच और टॉगल से भरे एक चमकते आंतरिक कंट्रोल पैनल के डैशबोर्ड को फंसा रहा है](../../assets/the-2020-twitter-bitcoin-account-takeover-02-vishing.jpg)

कोई एक्सप्लॉइट नहीं था। DFS रिपोर्ट जोर देकर कहती है: "[Twitter हैक में साइबरअटैक में अक्सर इस्तेमाल की जाने वाली हाई-टेक या परिष्कृत तकनीकों में से कोई भी शामिल नहीं थी — न मैलवेयर, न एक्सप्लॉइट, और न बैकडोर](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20did%20not%20involve%20any%20of%20the%20high%2Dtech%20or%20sophisticated%20techniques%20often%20used%20in%20cyberattacks%20%E2%80%93%20no%20malware%2C%20no%20exploits%2C%20and%20no%20backdoors)।" इसके बजाय, "[हैकर्स ने एक पारंपरिक स्कैम आर्टिस्ट की तकनीकों के समान बुनियादी तकनीकों का उपयोग किया: फोन कॉल जहां उन्होंने Twitter के Information Technology विभाग से होने का नाटक किया](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20used%20basic%20techniques%20more%20akin%20to%20those%20of%20a%20traditional%20scam%20artist%3A%20phone%20calls%20where%20they%20pretended%20to%20be%20from%20Twitter%E2%80%99s%20Information%20Technology%20department)।"

यह है **vishing** — वॉइस फिशिंग। हमलावरों ने "[कई Twitter कर्मचारियों को फोन किया और Twitter के IT विभाग के Help Desk से बात करने का दावा किया](https://www.dfs.ny.gov/Twitter_Report#:~:text=called%20several%20Twitter%20employees%20and%20claimed%20to%20be%20calling%20from%20the%20Help%20Desk%20in%20Twitter%E2%80%99s%20IT%20department)," और "[दावा किया कि वे उस रिपोर्ट की गई समस्या का जवाब दे रहे हैं जो कर्मचारी को Twitter के Virtual Private Network के साथ हो रही थी](https://www.dfs.ny.gov/Twitter_Report#:~:text=claimed%20they%20were%20responding%20to%20a%20reported%20problem%20the%20employee%20was%20having%20with%20Twitter%E2%80%99s%20Virtual%20Private%20Network)।" Twitter ने खुद बाद में इसे "[फोन स्पीयर फिशिंग अटैक](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=phone%20spear%20phishing%20attack)" के रूप में वर्णित किया जो "[कुछ कर्मचारियों को गुमराह करने और मानवीय कमजोरियों का फायदा उठाने के एक महत्वपूर्ण और संगठित प्रयास](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=a%20significant%20and%20concerted%20attempt%20to%20mislead%20certain%20employees%20and%20exploit%20human%20vulnerabilities)" पर निर्भर था।

विश्वास दिलाने वाली बात तकनीकी कौशल नहीं, बल्कि रिसर्च थी। जैसा कि सुरक्षा पत्रकार Brian Krebs ने दस्तावेज किया, हमलावरों ने प्रोफाइल डेटा पर भरोसा किया — LinkedIn और पिछले डेटा लीक से खींचे गए नाम, भूमिकाएं, व्यक्तिगत विवरण — असली सहयोगियों की तरह लगने के लिए। एक बार जब एक कर्मचारी को कॉलर पर विश्वास हो गया, तो उस कर्मचारी ने क्रेडेंशियल सौंप दिए, और क्रेडेंशियल ने पुरस्कार का दरवाजा खोला: Twitter का आंतरिक अकाउंट-प्रबंधन टूलिंग।

वह टूल पूरी कहानी का केंद्र है। Krebs ने रिपोर्ट किया कि "[Twitter के एडमिन टूल्स के भीतर, जाहिर तौर पर आप किसी भी Twitter यूजर का ईमेल पता अपडेट कर सकते हैं](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=within%20Twitter%E2%80%99s%20admin%20tools%2C%20apparently%20you%20can%20update%20the%20email%20address%20of%20any%20Twitter%20user)" — ईमेल बदलें, पासवर्ड रीसेट ट्रिगर करें, और अकाउंट आपका है, बैज सहित। DFS रिपोर्ट उस संरचनात्मक विफलता की ओर इशारा करती है जिसने एक टूटे हुए कर्मचारी को इतना विनाशकारी बना दिया: "[Twitter ने आंतरिक टूल्स तक पहुंच सीमित की, लेकिन 1,000 से अधिक Twitter कर्मचारियों की फिर भी उन तक पहुंच थी](https://www.dfs.ny.gov/Twitter_Report#:~:text=Twitter%20did%20limit%20access%20to%20the%20internal%20tools%2C%20but%20over%201%2C000%20Twitter%20employees%20still%20had%20access%20to%20them)।" एक हजार से अधिक लोगों के पास प्लेटफॉर्म पर हर पहचान की मास्टर चाबी थी, और कंपनी के पास इसे देखने के लिए कोई मुख्य सूचना सुरक्षा अधिकारी नहीं था — Twitter "[दिसंबर 2019 से, Twitter हैक से सात महीने पहले से, मुख्य सूचना सुरक्षा अधिकारी ("CISO") नहीं था](https://www.dfs.ny.gov/Twitter_Report#:~:text=had%20not%20had%20a%20chief%20information%20security%20officer%20(%E2%80%9CCISO%E2%80%9D)%20since%20December%202019%2C%20seven%20months%20before%20the%20Twitter%20Hack)।"

इस सब के नीचे एक बाजार भी था। सेलिब्रिटी घोटाला शुरू होने से पहले, गिरोह चोरी किए हुए छोटे "OG" हैंडल बेच रहा था। Krebs ने नोट किया कि Obama/Biden/Musk/Gates के ब्लास्ट से पहले, "[कई अत्यधिक वांछनीय शॉर्ट-कैरेक्टर Twitter अकाउंट नाम हाथ बदल गए](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=several%20highly%20desirable%20short%2Dcharacter%20Twitter%20account%20names%20changed%20hands)," क्योंकि उस समुदाय में "[शॉर्ट-कैरेक्टर प्रोफाइल नाम स्थिति और धन का माप देते हैं](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=short%2Dcharacter%20profile%20names%20confer%20a%20measure%20of%20status%20and%20wealth)" और "[पुनर्विक्रय होने पर अक्सर हजारों डॉलर प्राप्त कर सकते हैं](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=can%20often%20fetch%20thousands%20of%20dollars%20when%20resold)।" दुर्लभता मूल्य वाले नाम, चोरी किए गए और एक फोरम पर बेचे गए — एक पैटर्न जिसे कोई भी डोमेन निवेशक तुरंत पहचान लेगा।

## परिणाम और गिरफ्तारियां

उजागर होना हैक जितना ही तेज था। दो सप्ताह के भीतर, अभियोजक आगे बढ़े। Krebs ने आरोपों की रिपोर्ट दी: "[Mason 'Chaewon' Sheppard, U.K. के Bognor Regis का 19 वर्षीय, को California में वायर फ्रॉड करने की साजिश, मनी लॉन्ड्रिंग और कंप्यूटर तक अनधिकृत पहुंच के आरोपों में आरोपित किया गया था](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Mason%20%E2%80%9CChaewon%E2%80%9D%20Sheppard%2C%20a%2019%2Dyear%2Dold%20from%20Bognor%20Regis%2C%20U.K.%2C%20also%20was%20charged%20in%20California%20with%20conspiracy%20to%20commit%20wire%20fraud%2C%20money%20laundering%20and%20unauthorized%20access%20to%20a%20computer)," और "[Orlando, Fla. के 22 वर्षीय Nima 'Rolex' Fazeli को Northern California में एक संरक्षित कंप्यूटर तक जानबूझकर पहुंच में सहायता और उकसावे के आपराधिक शिकायत में आरोपित किया गया था](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Nima%20%E2%80%9CRolex%E2%80%9D%20Fazeli%2C%20a%2022%2Dyear%2Dold%20from%20Orlando%2C%20Fla.%2C%20was%20charged%20in%20a%20criminal%20complaint%20in%20Northern%20California%20with%20aiding%20and%20abetting%20intentional%20access%20to%20a%20protected%20computer)।"

लेकिन कथित मुख्य आरोपी और भी छोटा था। "[Tampa, Fla. का 17 वर्षीय Graham Clark 15 जुलाई के Twitter हैक में आरोपित लोगों में था](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=17%2Dyear%2Dold%20Graham%20Clark%20of%20Tampa%2C%20Fla.%20was%20among%20those%20charged%20in%20the%20July%2015%20Twitter%20hack)," और एक नाबालिग के रूप में उस पर संघीय अदालत के बजाय Florida के राज्य अटॉर्नी द्वारा आरोप लगाए गए। उसे "[30 फेलोनी आरोपों का सामना करना पड़ा, जिसमें संगठित धोखाधड़ी, संचार धोखाधड़ी शामिल है](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=was%20hit%20with%2030%20felony%20charges%2C%20including%20organized%20fraud%2C%20communications%20fraud)।"

अगले मार्च में, Clark ने एक समझौता किया। CyberScoop ने रिपोर्ट किया कि उसने "[एक ऐसी योजना के पीछे होने को स्वीकार किया जिसमें उसने कई सार्वजनिक हस्तियों के Twitter अकाउंट्स पर कब्जा करके $117,000 से अधिक चुराए](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/#:~:text=admitted%20to%20being%20behind%20a%20scheme%20that%20saw%20him%20steal%20more%20than%20%24117%2C000%20by%20taking%20over%20the%20Twitter%20accounts%20of%20numerous%20public%20figures)।" सार्वजनिक रेडियो स्टेशन WUSF ने सजा की रिपोर्ट दी: "[एक किशोर सुविधा में तीन साल, उसके बाद तीन साल की परिवीक्षा](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=three%20years%20in%20a%20juvenile%20facility%20to%20be%20followed%20by%20three%20years%20of%20probation)," जो "[राज्य के युवा अपराधी कानून के तहत अनुमत अधिकतम थी](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=the%20maximum%20allowed%20under%20the%20state%E2%80%99s%20youthful%20offender%20law)।"

बाद में एक चौथा व्यक्ति सामने आया। Wikipedia दर्ज करता है कि "[अप्रैल 2023 में, ऑनलाइन हैंडल PlugwalkJoe वाले 23 वर्षीय British नागरिक Joseph James O'Connor को आरोपों का सामना करने के लिए Spain से New York प्रत्यर्पित किया गया था](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=In%20April%202023%2C%2023%2Dyear%2Dold%20Joseph%20James%20O%E2%80%99Connor%2C%20a%20British%20citizen%20with%20the%20online%20handle%20PlugwalkJoe%2C%20was%20extradited%20from%20Spain)," और बाद में उसे संघीय जेल में पांच साल की सजा सुनाई गई।

## ऑनलाइन पहचान को नियंत्रित करने के बारे में यह क्या सिखाता है

सेलिब्रिटी के नाम और क्रिप्टो को हटा दें, और 2020 का Twitter हैक *एक* पहचान *रखने* और उसे *नियंत्रित करने* के बीच के अंतर का एक शुद्ध पाठ है। इसमें से कुछ सिद्धांत निकलते हैं:

1. **भरोसा नाम पर जमा होता है; नियंत्रण बैक ऑफिस में रहता है।** करोड़ों लोगों ने `@BarackObama` पर भरोसा किया। उस भरोसे में से किसी ने भी अकाउंट की रक्षा नहीं की, क्योंकि अकाउंट का नियंत्रण सतह एक आंतरिक एडमिन पैनल था जिस तक एक हजार से अधिक कर्मचारी पहुंच सकते थे। जो भी बैक ऑफिस को नियंत्रित करता है वह पहचान को नियंत्रित करता है, चाहे सामने किसी का भी नाम हो।

2. **सबसे कमजोर कड़ी लगभग कभी भी क्रिप्टोग्राफी नहीं होती।** कोई एक्सप्लॉइट नहीं, कोई मैलवेयर नहीं, कोई बैकडोर नहीं — बस एक आश्वस्त करने वाला फोन कॉल। पहचान प्रणालियां गणित की परत की तुलना में मानवीय और प्रक्रिया परत पर कहीं अधिक बार विफल होती हैं। एक दरवाजे पर एक परफेक्ट ताला जिसे कोई भी मददगार कर्मचारी अनुरोध पर खोल देगा, ताला नहीं है।

3. **कुल नियंत्रण का एक बिंदु, कुल विफलता का एक बिंदु है।** एक पुन: उपयोग योग्य आंतरिक टूल जो *किसी भी* अकाउंट का ईमेल बदल सकता था, इसका मतलब था कि एक समझौता किया गया कर्मचारी = प्लेटफॉर्म-व्यापी टेकओवर। केंद्रित, प्रतिवर्ती, अपारदर्शी नियंत्रण ही कमजोरी है।

4. **दुर्लभ नाम निशाना होते हैं।** जिस गिरोह ने राष्ट्रपतियों को हाईजैक किया, वह चुपचाप छोटे "OG" हैंडल भी हजारों डॉलर में बेच रहा था। मूल्यवान नाम चोरी को आकर्षित करते हैं, और एक नाम की कीमत ही है जो उसके नियंत्रण को चुराने लायक बनाती है।

5. **रिकवरी प्लेटफॉर्म की दया पर निर्भर नहीं होनी चाहिए।** जब भरोसेमंद अकाउंट झूठ बोलने लगे, तो Twitter का एकमात्र उपाय उन्हें फ्रीज करना था। पहचान के मालिकों के पास "यह वाकई मैं हूं" साबित करने या नियंत्रण वापस पाने का कोई स्वतंत्र तरीका नहीं था — वे पूरी तरह एक केंद्रीकृत ऑपरेटर के आंतरिक टूलिंग और सदिच्छा पर निर्भर थे।

## Namefi का नजरिया

![ऑनलाइन पहचान के सत्यापन योग्य, छेड़छाड़-प्रतिरोधी स्वामित्व का रंगीन चित्रण — एक हरे शील्ड, एक हरे Namefi टोकन, और निरंतरता द्वारा सुरक्षित](../../assets/the-2020-twitter-bitcoin-account-takeover-03-namefi-angle.jpg)

एक डोमेन नाम एक ऑनलाइन पहचान है जिसमें वही भरोसे-बनाम-नियंत्रण अंतर है जो Twitter के वेरिफाइड हैंडल में था — और अक्सर वही तरह का अपारदर्शी बैक ऑफिस। अधिकांश डोमेन के लिए, "स्वामित्व" एक रजिस्ट्रार अकाउंट में रहता है, एक पासवर्ड और एक सपोर्ट टीम द्वारा बचाव किया गया। एक आश्वस्त करने वाला फोन कॉल, एक सोशल-इंजीनियर्ड सपोर्ट प्रतिनिधि, एक आंतरिक पैनल के जरिए एक ईमेल बदलाव — 2020 का Twitter प्लेबुक लगभग एक-से-एक एक रजिस्ट्रार अकाउंट टेकओवर पर मैप होता है। दुनिया ने आपके डोमेन में जो भरोसा डाला है वह उसकी रक्षा नहीं करता यदि उस डोमेन का नियंत्रण एक हेल्प डेस्क के पीछे है जिसे किसी भी बात पर राजी किया जा सकता है।

[Namefi](https://namefi.io) उस अंतर को बंद करने के लिए मौजूद है। मूल विचार यह है कि एक डोमेन का नियंत्रण *सत्यापन योग्य और मालिक-अधीन* होना चाहिए, न कि किसी और के एडमिन टूल में एक सेटिंग। DNS के साथ संगत रहते हुए [डोमेन स्वामित्व](/hi/glossary/domain-ownership/) को एक टोकनाइज्ड, ऑन-चेन एसेट के रूप में प्रस्तुत करके, Namefi "इस नाम को कौन नियंत्रित करता है?" सवाल का जवाब किसी सपोर्ट एजेंट के दबाव में फैसले के बजाय क्रिप्टोग्राफिक रूप से देने योग्य बनाता है। कोई एकल आंतरिक पैनल नहीं है जिस तक एक हजार कर्मचारी चुपचाप आपका नाम फिर से असाइन करने के लिए पहुंच सकें; नियंत्रण का प्रमाण मालिक के पास रहता है, और ट्रांसफर सुधारे जाने योग्य की बजाय ऑडिट योग्य हैं।

2020 का Twitter हैक इसलिए काम किया क्योंकि पहचान और नियंत्रण को चुपचाप अलग कर दिया गया था — नाम एक बात कहता था जबकि एक छिपा हुआ एडमिन टूल दूसरा फैसला करता था। जो कोई भी किसी नाम पर निर्भर है उसके लिए सबक यह है कि नियंत्रण को उतना ही स्पष्ट और मालिक-केंद्रित बनाएं जितना भरोसा नाम रखता है। एक हैंडल, एक बैज, एक डोमेन: प्रत्येक केवल उतना ही सुरक्षित है जितना उसके पीछे का बैक ऑफिस। Namefi का दांव यह है कि बैक ऑफिस एक सत्यापन योग्य बहीखाता होना चाहिए जिसे आप नियंत्रित करते हैं, न कि एक फोन लाइन जिसका जवाब देने के लिए किसी और को धोखा दिया जा सकता है।

## स्रोत और आगे पढ़ने के लिए

- New York Department of Financial Services — [Twitter Investigation Report](https://www.dfs.ny.gov/Twitter_Report)
- Wikipedia — [2020 Twitter account hijacking](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking)
- Krebs on Security — [Who's Behind Wednesday's Epic Twitter Hack?](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/)
- Krebs on Security — [Twitter Hacking for Profit and the LoLs](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/)
- Krebs on Security — [Three Charged in July 15 Twitter Compromise](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/)
- CyberScoop — [Twitter hacker pleads guilty, sentenced to 3 years](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/)
- WUSF — [Tampa Twitter Hacker Sentenced To Three Years In Prison, Three Years Probation](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation)
- U.S. Department of Justice — [Three Individuals Charged for Alleged Roles in Twitter Hack](https://www.justice.gov/usao-ndca/pr/three-individuals-charged-alleged-roles-twitter-hack)
- ABC News — [Florida man who pleaded guilty to hacking Twitter as 17-year-old sentenced to 3 years](https://abcnews.go.com/Politics/florida-man-pleaded-guilty-hacking-twitter-17-year/story?id=76513232)
