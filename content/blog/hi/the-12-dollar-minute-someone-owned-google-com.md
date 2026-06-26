---
title: '$12 वाला एक मिनट: जब किसी ने चुपचाप Google.com खरीद लिया'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'सितंबर 2015 में, Google के एक पूर्व कर्मचारी ने Google Domains के ज़रिए google.com को $12 में खरीद लिया और लगभग एक मिनट तक दुनिया के सबसे मूल्यवान डोमेन का प्रशासनिक नियंत्रण हासिल किया। Sanmay Ved की कहानी, $6,006.13 का बाउंटी पुरस्कार, और यह एक मिनट की मालिकी हमें डोमेन नियंत्रण के बारे में क्या बताती है।'
keywords: ['google.com domain', 'sanmay ved', 'google domains bug', 'domain security', 'who owns google.com', 'domain hijacking', 'webmaster tools access', 'google bug bounty', '6006.13 reward', 'domain registration vulnerability', 'domain control', 'dns security', 'domain ownership verification']
relatedArticles:
  - /hi/blog/the-godaddy-multi-year-breach/
  - /hi/blog/the-fox-it-dns-hijack/
  - /hi/blog/the-lenovo-com-dns-hijack/
  - /hi/blog/the-sex-com-heist-the-forged-letter/
  - /hi/blog/the-2024-squarespace-defi-domain-hijacks/
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
  - /hi/glossary/tld/
  - /hi/glossary/registry/
---

29 सितंबर 2015 की रात, लगभग एक मिनट के लिए, इंटरनेट का सबसे मूल्यवान पता Google का नहीं था।

वह पता Sanmay Ved नाम के Google के एक पूर्व कर्मचारी का था, जिसने अभी-अभी **google.com** को केवल **$12** में खरीदा था।

उसने कोई सेंधमारी नहीं की। उसने कोई बफर ओवरफ्लो का फायदा नहीं उठाया और न ही किसी एडमिनिस्ट्रेटर को फिश किया। वह Google के अपने रिटेल स्टोरफ्रंट — Google Domains — पर गया, दुनिया का सबसे प्रसिद्ध डोमेन नाम टाइप किया, और चेकआउट प्रक्रिया को वह काम करते हुए देखा जो उसे कभी नहीं करना चाहिए था: उसने उसे भुगतान करने दिया। उसका कार्ड चार्ज हुआ। ऑर्डर पूरा हो गया। और लगभग साठ सेकंड के लिए, google.com के आधिकारिक [रजिस्ट्रेंट](/hi/glossary/registrant/) के रूप में Massachusetts में एक ग्रेजुएट छात्र का नाम दर्ज था।

यह है **Domain Mayday / 域名浩劫**, हमारी वह श्रृंखला जो उन पलों पर केंद्रित है जब डोमेन सुरक्षा सार्वजनिक रूप से विफल हुई। अधिकांश एपिसोड उन नामों के बारे में हैं जो हमलावरों द्वारा चुराए गए। यह एक अलग है — और अधिक चिंताजनक — क्योंकि कोई हमला ही नहीं हो रहा था। पृथ्वी का सबसे महत्वपूर्ण डोमेन उस पहले व्यक्ति को सूचीबद्ध मूल्य पर बेच दिया गया, जिसने उसे शॉपिंग कार्ट में डाला।

## google.com सामान्यतः क्या है

यह बताना मुश्किल है कि google.com कितना मूल्यवान है, क्योंकि वह संख्या वास्तव में कोई संख्या नहीं है।

Google.com धरती पर सबसे अधिक उपयोग किए जाने वाले सर्च इंजन का मुख्य द्वार है, Gmail, Maps, Ads, YouTube अकाउंट फ्लो का आधार है, और अरबों लोगों के लिए प्रमाणीकरण की रीढ़ है। Slate ने इस घटना को कवर करते हुए इसे ["दुनिया का सबसे अधिक ट्रैफिक वाला डोमेन"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20cost%20to%20buy%20the%20most%2Dtrafficked%20domain%20in%20the%20world%3F%20Only%20%2412.) कहा। Tesla.com या Cars.com चाहे जितने में बिके हों, google.com एक अलग श्रेणी में है: यह कोई ब्रांड संपत्ति नहीं है, यह *बुनियादी ढांचा* है जिसे मानवता का एक बड़ा हिस्सा प्रतिदिन उपयोग करता है।

ऐसा डोमेन अछूत होना चाहिए। उसे लॉक, फ्लैग, रजिस्ट्री-होल्ड, सर्वर-होल्ड, ट्रांसफर-प्रोहिबिटेड — हर वह सुरक्षा से लपेटा जाना चाहिए जो एक [रजिस्ट्रार](/hi/glossary/registrar/) लागू कर सके। डोमेन सुरक्षा का पूरा आधार यही है कि नाम जितना अधिक महत्वपूर्ण, उसे हिलाना उतना ही कठिन।

और फिर, $12 में, वह हिल गया।

## $12 वाला एक मिनट

![Vivid colorful concept art of a glowing globe-shaped domain wearing a tiny twelve-dollar price tag, a single coin dropping into a checkout slot as a one-minute hourglass begins to run](../../assets/the-12-dollar-minute-someone-owned-google-com-01-the-minute.jpg)

Ved किसी मुसीबत की तलाश में नहीं था। वह एक पूर्व Googler था — उसने कंपनी में Account Strategist के रूप में काम किया था — और देर रात वह Google Domains, Google की तब-नई रजिस्ट्रार सेवा, पर डोमेन नाम देख रहा था। एक आवेग में उसने सबसे बड़ा नाम टाइप किया।

उसने खुद बताया कि परिणाम देखकर वह स्तब्ध रह गया: ["मैंने Google.com टाइप किया और मुझे आश्चर्य हुआ कि यह उपलब्ध दिखाया गया,"](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=I%20type%20in%20Google.com%20and%20to%20my%20surprise%20it%20showed%20it%20as%20available) Ved ने Business Insider को बताया। "प्रीमियम" नहीं, "ऑफर करें" नहीं, "यह डोमेन लिया जा चुका है" नहीं। *उपलब्ध।* मानक $12 पंजीकरण शुल्क पर।

उसने इसे कार्ट में जोड़ा और चेकआउट किया, यह पूरी उम्मीद रखते हुए कि सिस्टम उसे अस्वीकार कर देगा। नहीं किया। लेनदेन पूरा हो गया। जैसा कि The Hacker News ने संक्षेप में बताया, एक पूर्व Googler ने ["Google की अपनी Domains सेवा के ज़रिए दुनिया का सबसे अधिक देखा जाने वाला डोमेन Google.com केवल $12 में खरीदने में कामयाबी हासिल की।"](https://thehackernews.com/2015/10/google-bounty-charity.html#:~:text=managed%20to%20buy%20the%20world%27s%20most%2Dvisited%20domain)

और फिर उसका इनबॉक्स भरने लगा। वे सिस्टम जो [डोमेन स्वामित्व](/hi/glossary/domain-ownership/) पर निर्भर होते हैं — जो किसी सत्यापित डोमेन मालिक को अलर्ट और नियंत्रण भेजते हैं — एक नए रजिस्ट्रेंट को देखकर अपना काम करने लगे। Security Affairs ने उस पल का वर्णन किया: ["कुछ ही सेकंड में उसका इनबॉक्स और Google Webmaster Tools वेबमास्टर संबंधी संदेशों से भर गया जो Google.com डोमेन की मालिकी की पुष्टि कर रहे थे।"](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=In%20a%20few%20seconds%20his%20inbox%20and%20Google%20Webmaster%20Tools%20were%20flooded)

उस एक मिनट के लिए, Ved केवल कागज़ पर मालिक के रूप में सूचीबद्ध नहीं था। मशीन उसके साथ मालिक जैसा व्यवहार कर रही थी।

## उस एक मिनट में आप वास्तव में क्या नियंत्रित करते हैं

यही वह हिस्सा है जो एक मज़ेदार किस्से को एक सुरक्षा कहानी में बदल देता है।

जब आप Google के पारिस्थितिकी तंत्र में किसी डोमेन के सत्यापित मालिक होते हैं, तो आपको **Webmaster Tools** (अब Search Console) तक पहुंच मिलती है — वह डैशबोर्ड जिसे साइट के मालिक यह देखने के लिए उपयोग करते हैं कि कोई प्रॉपर्टी कैसे इंडेक्स की जाती है, साइटमैप सबमिट करते हैं, आंतरिक संदेश देखते हैं, और यह प्रबंधित करते हैं कि डोमेन सर्च में कैसे दिखता है। Ved ने बाद में कहा कि इसका निहितार्थ उनसे छिपा नहीं था: ["डरावना हिस्सा यह था कि मेरे पास एक मिनट के लिए वेबमास्टर नियंत्रण तक पहुंच थी,"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20scary%20part%20was%20I%20had%20access%20to%20the%20webmaster%20controls%20for%20a%20minute) उन्होंने समझाया।

उस समय की रिपोर्टिंग में नोट किया गया कि उस अवधि के दौरान उसके पास ["Google.com तक प्रशासनिक पहुंच"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=he%20had%20administrative%20access%20to%20Google.com) थी और ["उसका Google Search Console डैशबोर्ड Google.com डोमेन के लिए संदेशों से अपडेट हो गया था।"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=his%20Google%20Search%20Console%20dashboard%20was%20updated) सोचिए कि डोमेन का मालिक होना वास्तव में आपको क्या दे सकता है: [DNS](/hi/glossary/dns/) रिकॉर्ड, मेल रूटिंग, तीसरे पक्ष के सामने "स्वामित्व" साबित करने की क्षमता, और सर्च-इंजन नियंत्रण जो तय करते हैं कि कोई प्रॉपर्टी दुनिया को कैसे प्रस्तुत की जाती है। पंजीकरण मास्टर कुंजी है। इससे जुड़ी हर चीज़ — DNS, सर्टिफिकेट, ईमेल, सिंगल साइन-ऑन, सर्च इंडेक्सिंग — यह मान लेती है कि रजिस्ट्रेंट वही है जो वह कहता है।

Ved ने ज़िम्मेदार काम किया। उसने एक भी रिकॉर्ड नहीं बदला। उसने तुरंत रिपोर्ट किया। लेकिन सीख अपनी जगह बनी रहती है: "एक जिज्ञासु छात्र" और "एक आपदा" के बीच का फर्क कोई तकनीकी नियंत्रण नहीं था। यह एक व्यक्ति की अच्छे तरीके से व्यवहार करने की पसंद थी।

## Google की पकड़ — और उसकी प्रतिक्रिया

![Vivid colorful concept art of a giant glowing key held briefly in an open hand, then gently pulled back by a beam of light, against a colorful circuit-board sky with a refunded coin floating away](../../assets/the-12-dollar-minute-someone-owned-google-com-02-how.jpg)

Google के स्वचालित सिस्टम ने जल्दी से इस विसंगति को पकड़ लिया। लगभग एक मिनट के भीतर, ऑर्डर पलट दिया गया। Fox News ने रद्दीकरण को सीधे शब्दों में रिपोर्ट किया: ["Google Domains ने एक मिनट बाद बिक्री रद्द कर दी, यह कहते हुए कि किसी ने उसके पहले साइट रजिस्टर की थी, और Ved को $12 वापस कर दिया।"](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=Google%20Domains%20canceled%20the%20sale%20a%20minute%20later) "जिस किसी" ने पहले इसे रजिस्टर किया था, वह निश्चित रूप से Google खुद था।

फिर Google ने वह किया जिसने इसे किंवदंती बना दिया। अपने Vulnerability Reward Program के ज़रिए, उसने Ved को एक बाउंटी दी — और कंपनी ने जानबूझकर वह संख्या चुनी। 2015 की अपनी आधिकारिक सुरक्षा वार्षिक समीक्षा में, Google ने लिखा: ["Sanmay को हमारा प्रारंभिक वित्तीय पुरस्कार — $6,006.13 — अंकों में Google लिखता था (थोड़ा ध्यान से देखें तो दिखेगा!)। जब Sanmay ने अपना पुरस्कार दान किया, तो हमने इस राशि को दोगुना कर दिया।"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/#:~:text=Our%20initial%20financial%20reward%20to%20Sanmay) (इसे अंकों में पढ़ें: 6-0-0-6-1-3 → G-O-O-G-L-E।)

Ved ने पैसे दान करने का फैसला किया। उसने अनुरोध किया कि यह Art of Living India Foundation को जाए, जो भारत भर में निःशुल्क विद्यालयों का समर्थन करती है — और जब Google को दान के बारे में पता चला, तो उसने पुरस्कार को दोगुना कर दिया, जिससे कुल राशि लगभग **$12,012.26** हो गई। पूरे प्रसंग पर Ved का अपना दृष्टिकोण कभी भुगतान के बारे में नहीं था। ["मुझे पैसे की परवाह नहीं है। यह कभी पैसे के बारे में नहीं था,"](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=I%20don%27t%20care%20about%20the%20money.%20It%20was%20never%20about%20the%20money) उन्होंने Business Insider को बताया।

$12 की एक गलती एक चतुर बाउंटी, एक उदार दान, और एक ऐसी कंपनी की कहानी बन गई जिसने उसे मैच किया। लेकिन सद्भावना को हटा दें तो अंतर्निहित तथ्य स्पष्ट है: एक रजिस्ट्रार ने अपने ही राज्य की चाबियां बांट दीं, और उन्हें वापस खींचने वाली एकमात्र चीज़ एक तेज़ स्वचालित पकड़ थी — और एक खरीदार जो ईमानदार निकला।

## इतने महत्वपूर्ण पंजीकरण में चूक कैसे होती है?

पृथ्वी का सबसे अधिक संरक्षित डोमेन स्व-सेवा चेकआउट में "$12 में उपलब्ध" के रूप में कैसे दिख सकता है?

सच्चा जवाब यह है कि Google के बाहर किसी के पास पूरा आंतरिक पोस्ट-मॉर्टम नहीं है, और हम ऐसा दावा नहीं करेंगे। लेकिन विफलता का *आकार* उन सभी लोगों से परिचित है जिन्होंने डोमेन सिस्टम के साथ काम किया है, और हम जो कह सकते हैं और जो नहीं, उसके बारे में सटीक होना उचित है।

जो सत्यापन योग्य है वह दृश्य व्यवहार है। उस समय की रिपोर्टिंग में दो सामान्य स्पष्टीकरण सामने आए: ["यह Google Domains में एक बग हो सकता था या कंपनी ने समय आने पर अपना डोमेन नाम नवीनीकृत करने में विफलता की।"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=It%20could%20have%20been%20a%20bug%20in%20Google%20Domains%20or%20the%20company%20simply%20failed%20to%20renew) किसी भी तरह से, एक संक्षिप्त अवधि के लिए स्टोरफ्रंट के "क्या यह नाम रजिस्ट्रेशन के लिए उपलब्ध है?" तर्क ने एक ऐसे नाम के लिए गलत उत्तर दिया जिसे बिक्री के लिए अयोग्य के रूप में हार्ड-कोड किया जाना चाहिए था।

गहरा सबक वास्तुशिल्पीय है। किसी डोमेन की सुरक्षा उतनी ही अच्छी है जितनी उसे बदलने का *सबसे कमज़ोर रास्ता*। एक रजिस्ट्री सर्वर-होल्ड और ट्रांसफर-प्रोहिबिटेड फ्लैग लागू कर सकती है; एक रजिस्ट्रार किसी नाम को लॉक कर सकता है; एक संगठन रजिस्ट्रार-स्तरीय मल्टी-फैक्टर और अनुमोदन वर्कफ्लो सक्षम कर सकता है। लेकिन अगर कोई एकल इंटरफ़ेस — एक रिटेल चेकआउट, एक आंतरिक एडमिन टूल, एक सपोर्ट ओवरराइड, एक API एंडपॉइंट — उन गार्डों को सक्रिय किए बिना स्वामित्व बदल सकता है, तो नाम उतना ही सुरक्षित है जितना वह एकमात्र सबसे कमज़ोर इंटरफ़ेस। डोमेन टेकओवर का विस्फोट त्रिज्या विशाल है (DNS, ईमेल, सर्टिफिकेट, लॉगिन), लेकिन इसे ट्रिगर करने वाली सतह छोटी हो सकती है: एक फॉर्म जिसे "नहीं" कहना चाहिए था और उसने "हां" कहा।

वह विषमता ही पूरी समस्या है। दांव पर मूल्य अधिकतम है। इसे हिलाने के लिए आवश्यक कार्रवाई न्यूनतम हो सकती है।

## यह डोमेन नियंत्रण के बारे में क्या सिखाता है

$12 वाले एक मिनट से कुछ स्थायी सबक निकलते हैं:

1. **रजिस्ट्रेंट रिकॉर्ड मास्टर कुंजी है।** DNS, TLS सर्टिफिकेट, ईमेल डिलीवरेबिलिटी, और "सत्यापित करें कि आप इस डोमेन के मालिक हैं" फ्लो सभी उनके नीचे के पंजीकरण पर भरोसा करते हैं। जो पंजीकरण नियंत्रित करता है वह इससे जुड़ी हर चीज़ नियंत्रित करता है। उस परत को उसी रूट पासवर्ड की तरह सुरक्षित करें जो वह प्रभावी रूप से है।

2. **महत्व और सुरक्षा स्वचालित रूप से सहसंबद्ध नहीं हैं।** आप मान लेंगे कि दुनिया का सबसे महत्वपूर्ण डोमेन सबसे अधिक लॉक-डाउन है। एक मिनट के लिए, वह नहीं था। महत्व खुद को लागू नहीं करता; स्पष्ट लॉक, होल्ड, और अनुमोदन गेट करते हैं। उनकी ऑडिट करें; उन्हें मान न लें।

3. **कंट्रोल प्लेन DNS से बड़ा है।** लोग अपने नेमसर्वर सुरक्षित करते हैं और रजिस्ट्रार अकाउंट, सपोर्ट चैनल, बिलिंग ईमेल, और आंतरिक टूलिंग को भूल जाते हैं। एक डोमेन किसी भी ऐसे दरवाज़े से खोया जा सकता है जो स्वामित्व को फिर से लिख सकता है — सिर्फ उस दरवाज़े से नहीं जिस पर "DNS" लिखा हो।

4. **आप अक्सर एक ईमानदार व्यक्ति की दूरी पर आपदा से होते हैं।** Google भाग्यशाली था कि खरीदार एक सुरक्षा-जागरूक पूर्व कर्मचारी था जिसने तुरंत रिपोर्ट किया। जो सुरक्षा आने वाले व्यक्ति की नेकनीयती पर निर्भर करती है, वह सुरक्षा नहीं है। सिस्टम, न कि आगंतुक, को वह होना चाहिए जो "नहीं" कहे।

5. **तेज़ पहचान एक वास्तविक नियंत्रण है।** Google का ~एक-मिनट स्वचालित पकड़ ने वास्तव में नुकसान को सीमित किया। आप हर गलती को नहीं रोक सकते, लेकिन स्वामित्व परिवर्तनों की कड़ी निगरानी उस खिड़की को छोटा कर देती है जिसमें एक चूक एक उल्लंघन बन जाती है।

इस कहानी का आश्वस्त करने वाला हिस्सा यह है कि Google के सिस्टम ने इसे नोटिस किया और पलट दिया। असहज करने वाला हिस्सा यह है कि उन्हें करना पड़ा।

## Namefi का नज़रिया

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-12-dollar-minute-someone-owned-google-com-03-namefi-angle.jpg)

$12 वाला एक मिनट, मूल रूप में, एक रिकॉर्ड के बारे में एक प्रश्न है: *इस नाम का सत्यापित मालिक अभी कौन है, और उसे चुपचाप बदलना कितना कठिन है?*

पारंपरिक मॉडल में, उत्तर किसी रजिस्ट्रार के डेटाबेस के अंदर रहता है, जो उन इंटरफेस के माध्यम से बदला जा सकता है जो वह रजिस्ट्रार उजागर करता है — रिटेल चेकआउट, एडमिन ओवरराइड, सपोर्ट टिकट, API। उनमें से अधिकांश इंटरफेस अच्छी तरह से संरक्षित हैं। लेकिन स्वामित्व उतना ही सुरक्षित है जितना सबसे कम संरक्षित इंटरफेस, और मालिक आमतौर पर वास्तविक समय में नहीं देख पाता जब उनका रिकॉर्ड हाथ बदलता है। Sanmay Ved को पता चला कि उसने google.com "खरीद लिया" क्योंकि उसका इनबॉक्स जल जाया — न कि इसलिए कि किसी मजबूत बहीखाते ने एक सत्यापित, अधिकृत ट्रांसफर की घोषणा की।

[Namefi](https://namefi.io) इस आधार से शुरू होता है कि डोमेन स्वामित्व **सत्यापन योग्य और टैंपर-एविडेंट** होना चाहिए, न कि एकल परिवर्तनशील पंक्ति में दबा हुआ। डोमेन नियंत्रण को एक टोकनाइज़्ड, ऑन-चेन संपत्ति के रूप में प्रस्तुत करके जो DNS के साथ संगत रहती है, "इस डोमेन का मालिक कौन है" का कार्य कुछ ऐसा बन जाता है जिसे आप स्वतंत्र रूप से सत्यापित और ऑडिट कर सकते हैं — और एक ट्रांसफर एक स्पष्ट, अधिकृत, दृश्यमान घटना बन जाती है, न कि वह चेकआउट जो चुपचाप सफल हो जाता है। लक्ष्य डोमेन को विदेशी बनाना नहीं है; यह मास्टर कुंजी को गलती से गलत व्यक्ति को देना कठिन बनाना है, और बिना निशान छोड़े इसे हिलाना असंभव।

Google.com एक मिनट में वापस आ गया क्योंकि Google ने एक भंगुर आदिम के ऊपर तेज़ पहचान बनाई। बेहतर उत्तर यह है कि आदिम को ही भरोसेमंद बनाया जाए: स्वामित्व जिसे आप साबित कर सकें, ट्रांसफर जो आप देख सकें, और नियंत्रण जो किसी एकल फॉर्म पर निर्भर न हो कि वह "नहीं" कहना याद रखे।

## स्रोत और आगे पढ़ने के लिए

- Google Online Security Blog — [Google Security Rewards — 2015 Year in Review](https://security.googleblog.com/2016/01/google-security-rewards-2015-year-in.html?m=1) ($6,006.13 पुरस्कार और दोगुने दान का प्राथमिक स्रोत)
- The American Bazaar — [Google paid $6,006.13 to ex-Googler who registered "Google.com"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/) (Google के ब्लॉग को शब्दशः उद्धृत करता है)
- Slate — [Ex-Googler Sanmay Ved bought the search engine's domain for one minute](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html)
- Fox News — [Student manages to buy domain name of Google.com for $12](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12)
- Fox News — [Why Google handed out a $6,006.13 reward](https://www.foxnews.com/tech/why-google-handed-out-a-6006-13-reward)
- The Hacker News — [Google Rewarded the Guy Who Accidentally Bought Google.com, But He Donated It to Charity](https://thehackernews.com/2015/10/google-bounty-charity.html)
- Security Affairs — [Sanmay Ved who bought Google.com donates Google reward](https://securityaffairs.com/40904/breaking-news/google-com-charity.html)
- Yahoo Finance — [Google Briefly Lost Ownership Of Its Domain After It Was Mistakenly Sold For $12](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html)
- Vocal Media — [The Man Who Owned Google.com — for One Minute](https://vocal.media/fyi/the-man-who-owned-google-com-for-one-minute-rc1vud0zhq)
- Namefi — [namefi.io](https://namefi.io)
