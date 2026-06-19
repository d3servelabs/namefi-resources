---
title: 'Curve Finance DNS हाईजैक: जब "ऑडिटेड कॉन्ट्रैक्ट्स" मुख्य दरवाज़ा नहीं बचा सके'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'अगस्त 2022 में, Curve Finance के स्मार्ट कॉन्ट्रैक्ट्स अछूते रहे — लेकिन हमलावरों ने curve.fi डोमेन को रजिस्ट्रार स्तर पर हाईजैक किया, साइट का क्लोन बनाया, और उपयोगकर्ताओं से लगभग $570K निकाल लिए। एक DeFi फ्रंट-एंड पर DNS हमले की गहराई से जांच, और यह डोमेन सुरक्षा के बारे में क्या सिखाता है।'
keywords: ['curve finance dns hijack', 'curve.fi hijack', 'dns hijacking defi', 'iwantmyname compromise', 'nameserver compromise', 'wallet drainer', 'defi front-end attack', 'domain security', 'dns security', 'crypto phishing', 'cloned website attack', 'registrar account compromise', 'domain mayday']
---

स्मार्ट कॉन्ट्रैक्ट्स बिल्कुल ठीक थे।

यह पहली बात है जो 9 अगस्त, 2022 को Curve Finance के साथ हुई घटना को समझने के लिए ज़रूरी है, और यही वह पहलू है जो सुरक्षा इंजीनियरों को वर्षों बाद भी बेचैन करता है। Curve का ऑन-चेन कोड — ऑडिटेड, युद्ध-परीक्षित ऑटोमेटेड मार्केट मेकर जो अरबों स्टेबलकॉइन्स संभाल रहा था — कभी छुआ ही नहीं गया। कोई reentrancy बग नहीं। कोई oracle manipulation नहीं। कोई flash-loan exploit नहीं। ब्लॉकचेन ने वही किया जो उसे करना था।

और फिर भी उपयोगकर्ताओं ने लगभग **$570,000** गंवाए।

हमला कॉन्ट्रैक्ट्स के ज़रिए नहीं आया। यह **डोमेन** के ज़रिए आया। किसी ने रजिस्ट्रार स्तर पर `curve.fi` का नियंत्रण हासिल किया, उसे एक wallet-drainer से जुड़ी क्लोन वेबसाइट पर निर्देशित किया, और प्रोटोकॉल की अपनी प्रतिष्ठा को बाकी काम करने दिया। Curve ने कितने भी सुरक्षा ऑडिट पास किए हों — सब अप्रासंगिक थे, क्योंकि हमलावर ने उस दरवाज़े पर कभी दस्तक ही नहीं दी। वह सामने से घुसा — उस वेब पते से जो उपयोगकर्ता बिना सोचे टाइप करते हैं।

यह *Domain Mayday* एपिसोड 13 है। यह एक कहानी है कि कैसे किसी सिस्टम का सबसे सुरक्षित हिस्सा पूरी तरह सुरक्षित हो सकता है, जबकि वह हिस्सा जिस पर सभी *बिना जांचे भरोसा करते हैं* — डोमेन नाम — चुपचाप अटैक सर्फेस बन जाता है।

## "ऑडिटेड कॉन्ट्रैक्ट्स" मुख्य दरवाज़ा नहीं बचाते

DeFi ने वर्षों कॉन्ट्रैक्ट सुरक्षा की संस्कृति बनाने में बिताए। ऑडिट अनिवार्य हो गए। बग बाउंटी लाखों तक पहुंच गई। "Verified on Etherscan" एक विश्वास का संकेत बन गया। सामूहिक मानसिकता कुछ ऐसी बन गई: *अगर कॉन्ट्रैक्ट्स सुरक्षित हैं, तो प्रोटोकॉल सुरक्षित है।*

लेकिन एक उपयोगकर्ता लगभग कभी भी सीधे कॉन्ट्रैक्ट से इंटरैक्ट नहीं करता। वह एक वेबसाइट पर जाता है। वह `curve.fi` टाइप करता है, उसका ब्राउज़र उस नाम को एक IP पते में बदलता है, एक पेज लोड होता है, और वह पेज उसके वॉलेट को बताता है कि क्या साइन करना है। ये सभी चरण किसी भी ऑडिटेड Solidity कोड के चलने से *पहले* होते हैं — और ये सभी ऐसे इन्फ्रास्ट्रक्चर पर चलते हैं जिसे ऑडिट ने कभी कवर नहीं किया।

डोमेन नाम उस श्रृंखला की पहली कड़ी है। और यही वह कड़ी है जिसे अधिकांश टीमें एक बार सेट करके भूल जाती हैं: एक बार रजिस्टर करो, DNS पॉइंट करो, फिर कभी मत सोचो। जैसा कि घटना के बाद एक विश्लेषण में कहा गया, इस तरह का हमला उपयोगकर्ता और एक विकेंद्रीकृत ऐप के इंटरफेस के बीच ["ट्रस्ट लेयर का फायदा उठाता है"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) बजाय प्रोटोकॉल के ब्लॉकचेन को तोड़ने के। कॉन्ट्रैक्ट्स निर्दोष हो सकते हैं। अगर कोई हमलावर नियंत्रित करता है कि `curve.fi` *कहां पॉइंट करता है*, तो कुछ भी मायने नहीं रखता।

## 9 अगस्त, 2022: हाईजैक

![Vivid colorful concept art of a storefront whose address sign is being swapped to redirect shoppers into an identical fake shop with a hidden trapdoor floor, warm and cool tones, surreal security metaphor, no brand logos](../../assets/the-curve-finance-dns-hijack-01-hijack.jpg)

9 अगस्त, 2022 की दोपहर को, Curve का मुख्य फ्रंट एंड Curve का नहीं रहा।

CertiK के पोस्ट-इंसिडेंट विश्लेषण ने समयरेखा को सटीक रूप से पकड़ा: ["लगभग 4:20 PM EST Aug. 09 2022 को, Curve Finance का DNS रिकॉर्ड समझौता हो गया और एक क्लोन दुर्भावनापूर्ण साइट की ओर इंगित किया गया।"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) `curve.fi` पर आने वाले किसी भी व्यक्ति को कुछ गलत नहीं लगा। पेज रेंडर हुआ। लोगो वहां था। पूल, इंटरफेस, रंग — सब वफादारी से पुनः प्रस्तुत।

अंतर अदृश्य और संपूर्ण था: उपयोगकर्ता के ब्राउज़र में लोड हो रही साइट अब Curve द्वारा सर्व नहीं की जा रही थी। यह एक क्लोन था, हमलावर के इन्फ्रास्ट्रक्चर पर बैठा, किसी के वॉलेट कनेक्ट करने का इंतजार कर रहा था।

सुरक्षा शोधकर्ता Lefteris Karapetsas ने यांत्रिकी को स्पष्ट रूप से वर्णित किया — हमलावरों ने ["साइट को क्लोन किया, DNS को अपने IP पर पॉइंट किया जहां क्लोन साइट डिप्लॉय है, और एक दुर्भावनापूर्ण कॉन्ट्रैक्ट में approval requests जोड़ीं।"](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) Cointelegraph के बाद के विश्लेषण ने उसी पैटर्न का वर्णन किया: ["हमलावरों ने Curve Finance वेबसाइट को क्लोन किया और उपयोगकर्ताओं को वेबसाइट के डुप्लीकेट संस्करण पर भेजने के लिए इसकी DNS सेटिंग्स में हस्तक्षेप किया।"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

फिर वे इंतजार करते रहे।

## उपयोगकर्ताओं ने क्या खोया

जब कोई उपयोगकर्ता क्लोन पर आया और इसे उपयोग करने की कोशिश की, तो पेज ने उनके वॉलेट से वही करने के लिए कहा जो यह वैध DeFi साइटों पर हर दिन हज़ारों बार करता है: एक टोकन को अप्रूव करना। CertiK के अनुसार, ["हमलावर ने उस साइट में दुर्भावनापूर्ण कोड इंजेक्ट किया जिसने उपयोगकर्ताओं से एक अनवेरिफाइड कॉन्ट्रैक्ट को टोकन approvals देने के लिए कहा।"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Coingape ने जाल को सरल शब्दों में बताया: ["हैकर्स ने होम पेज पर एक दुर्भावनापूर्ण कॉन्ट्रैक्ट डिप्लॉय किया, जिसे पीड़ित द्वारा approve करने पर उपयोगकर्ता वॉलेट पूरी तरह खाली हो जाते थे।"](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)

टोकन allowance को approve करना सामान्य लगता है। यह वही क्लिक है जो उपयोगकर्ता एक वैध एक्सचेंज पर स्वैप करने के लिए करते हैं। लेकिन यहां जिस कॉन्ट्रैक्ट को approve किया जा रहा था वह हमलावर का था — और एक बार approve होने पर, वह पीड़ित के stablecoins निकाल सकता था।

ऑन-चेन हिसाब विशिष्ट था। CertiK ने बताया कि ["कुल मिलाकर, 7 उपयोगकर्ता exploit से प्रभावित हुए, जिससे ~$612k का नुकसान हुआ,"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) जिसमें आंकड़ा ["USDC और DAI में $612,724.16"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) के रूप में टूटा, जिसे हैकर ने ETH में बदल दिया। rekt.news एक गोल, व्यापक रूप से उद्धृत संख्या पर पहुंचा: ["चोरी किए गए फंड (340 ETH, या ~$575k, कुल)।"](https://rekt.news/curve-finance-rekt) अधिकांश समकालीन कवरेज उसी बैंड में थी — Cryptopotato ने बताया कि [हैकर्स ने लगभग $570,000 मूल्य का ETH चुराया](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/); CryptoDaily ने नोट किया [हैकर ने $573,000 से अधिक चुराया](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)। सटीक कुल स्नैपशॉट लिए जाने के समय और ETH की कीमत के आधार पर थोड़ा बदलता है। इसका स्वरूप नहीं बदलता: कम से मध्य छह अंक, मुट्ठी भर उपयोगकर्ताओं से, एक ऐसी साइट द्वारा जो बिल्कुल उस साइट की तरह दिखती थी जिस पर वे भरोसा करते थे।

और यहाँ वह हिस्सा है जो सोचने लायक है। Tronweekly ने इसे स्पष्ट रूप से कहा: इस हमले ने ["Curve के Ethereum स्मार्ट कॉन्ट्रैक्ट्स या उनमें संग्रहीत $5.7B की संपत्तियों को नहीं छुआ।"](https://www.tronweekly.com/curve-finance-dns-hijacking/) पांच दशमलव सात बिलियन डॉलर की प्रोटोकॉल संपत्तियां, पूरी तरह सुरक्षित। Curve खुद, जैसा कि उसी टुकड़े ने नोट किया, ["अप्रभावित है और कोई नुकसान नहीं उठाया।"](https://www.tronweekly.com/curve-finance-dns-hijacking/) प्रोटोकॉल जीता। उपयोगकर्ता हारे। क्योंकि हमला कभी प्रोटोकॉल पर नहीं था।

## यह कैसे हुआ: चेन नहीं, डोमेन

![Vivid colorful concept art of a telephone switchboard operator secretly rerouting one glowing call cable to a counterfeit identical building, neon cables and circuits, surreal DNS rerouting metaphor, no brand logos](../../assets/the-curve-finance-dns-hijack-02-dns-compromise.jpg)

तो कोई हमलावर `curve.fi` को Curve के सर्वर के बजाय *अपने* सर्वर पर रिज़ॉल्व कैसे करता है?

DNS क्या करता है, इससे शुरू करते हैं। `curve.fi` जैसा डोमेन नाम एक मानव-अनुकूल लेबल है। कंप्यूटरों को IP पते की ज़रूरत होती है। Domain Name System वह लुकअप लेयर है जो एक को दूसरे में अनुवाद करती है — Cointelegraph का विश्लेषण इसे ["एक फोनबुक"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) से तुलना करता है जो ["इन उपयोगकर्ता-अनुकूल डोमेन नामों को IP पतों में बदलती है जो कंप्यूटरों को कनेक्ट करने के लिए चाहिए।"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) DNS hijacking का मतलब है उस लुकअप के साथ छेड़छाड़ करना ताकि फोनबुक गलत नंबर दे — ["DNS queries को हल करने के तरीके को बदलकर, उपयोगकर्ताओं को उनकी जानकारी के बिना दुर्भावनापूर्ण साइटों पर पुनर्निर्देशित करना।"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

महत्वपूर्ण रूप से, इसके लिए उपयोगकर्ता के कंप्यूटर को तोड़ना नहीं पड़ता। आप स्रोत पर आधिकारिक उत्तर बदलते हैं — **nameserver** जिसे डोमेन सौंपता है। और वह स्रोत डोमेन के रजिस्ट्रार के पास होता है।

Curve के संस्थापक Michael Egorov ने स्पष्ट रूप से बताया कि विफलता कहां हुई। जैसा कि rekt.news ने उद्धृत किया, ["dns registrar iwantmyname का ns समझौता हो गया,"](https://rekt.news/curve-finance-rekt) और टीम का पढ़ना था कि ["Curve का मानना है कि अंतर्निहित nameserver से समझौता हुआ, न कि account स्तर पर कोई vulnerability।"](https://rekt.news/curve-finance-rekt) दूसरे शब्दों में: यह (जहाँ तक Curve बता सकता था) Curve के अपने रजिस्ट्रार अकाउंट पर चुराया गया पासवर्ड नहीं था। यह एक परत गहरी समस्या थी — nameserver इन्फ्रास्ट्रक्चर पर जिसे रजिस्ट्रार खुद संचालित करता था। Cointelegraph के विश्लेषण ने बाद में रजिस्ट्रार का नाम से पुष्टि की, यह नोट करते हुए कि परियोजना ["पिछले हमले के समय उसी रजिस्ट्रार, 'iwantmyname,' का उपयोग कर रही थी।"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

यह अंतर सबक के लिए बहुत महत्वपूर्ण है। एक टीम मज़बूत पासवर्ड लागू कर सकती है, two-factor authentication सक्षम कर सकती है, और अपने रजिस्ट्रार लॉगिन को पूरी तरह से लॉक कर सकती है — और *फिर भी* अपना डोमेन खो सकती है अगर नीचे का nameserver समझौता हो जाए। डोमेन मालिक ने ज़रूरी नहीं गलती की हो। उन्होंने नीचे की परत में जो भरोसा रखा वह बस टूट गया। इन हमलों के काम करने के तरीके के बारे में Cointelegraph का फ्रेमिंग जोखिम को सामान्यीकृत करता है: ["यदि चोरी किए गए credentials या रजिस्ट्रार की vulnerability के कारण किसी साइट का मैपिंग बदल जाता है, तो उपयोगकर्ता यह महसूस किए बिना हानिकारक सर्वरों पर पुनर्निर्देशित हो सकते हैं।"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

एक बार जब nameserver ने हमलावर के IP के साथ जवाब दिया, बाकी सब अपने आप हुआ। `curve.fi` टाइप करने वाला हर उपयोगकर्ता चुपचाप क्लोन पर पहुंचाया गया। फोनबुक में बदलाव हो चुका था, और लगभग कोई भी फोनबुक की जांच नहीं करता।

## प्रतिक्रिया और परिणाम

Curve की टीम तेज़ी से आगे बढ़ी, और प्रतिक्रिया ठीक इसलिए शिक्षाप्रद है क्योंकि वे क्या कर सकते थे और क्या नहीं।

जो वे *तुरंत* कर सकते थे वह था चेतावनी देना। टीम ने उपयोगकर्ताओं को स्पष्ट रूप से बताया: ["कृपया कोई approvals या swaps न करें। हम समस्या का पता लगाने की कोशिश कर रहे हैं, लेकिन अभी के लिए, आपकी सुरक्षा के लिए, curve.fi या curve.exchange का उपयोग न करें।"](https://www.tronweekly.com/curve-finance-dns-hijacking/) उन्होंने उपयोगकर्ताओं को अभी भी साफ fallback की ओर इशारा किया — ["अभी के लिए https://curve.exchange का उपयोग करें जब तक https://curve.fi के लिए propagation सामान्य नहीं हो जाता"](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/) — क्योंकि `curve.exchange` अलग इन्फ्रास्ट्रक्चर पर चलता था और poisoned नहीं था।

जो वे *तुरंत* नहीं कर सकते थे वह था बेल को un-ring करना। उन्होंने nameserver बदला, लेकिन DNS हर जगह एक साथ अपडेट नहीं होता। जैसा कि rekt.news ने नोट किया, ["हैकर की मिरर साइट को जल्दी से हटा दिया गया, हालांकि कुछ nameservers को अभी भी अपडेट किया जाना है।"](https://rekt.news/curve-finance-rekt) समय की एक खिड़की में, fix लागू होने के बाद भी, दुनिया भर के caches पुराना, दुर्भावनापूर्ण उत्तर देते रहे। यह propagation delay DNS की एक अंतर्निहित संपत्ति है — और हमलावर के लिए एक अंतर्निहित लाभ।

उन उपयोगकर्ताओं के लिए जो पहले ही दुर्भावनापूर्ण कॉन्ट्रैक्ट को approve कर चुके थे, एकमात्र बचाव revocation था। संदेश हर जगह दोहराया गया: ["यदि आपने पिछले कुछ घंटों में Curve पर कोई कॉन्ट्रैक्ट approve किया है, तो कृपया तुरंत revoke करें।"](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) rekt.news ने वह विशिष्ट drainer पता प्रकाशित किया जिसे उपयोगकर्ताओं को revoke करना था — `0x9eb5f8e83359bb5013f3d8eee60bdce5654e8881` — ताकि पीड़ित अधिक निकाले जाने से पहले allowance काट सकें।

चोरी किए गए फंड सामान्य laundering रेल के माध्यम से बिखर गए। CertiK ने प्रवाह का पता लगाया — ["FixedFloat: 292 ETH, Tornado Cash: 27.7 ETH, Binance: 20 ETH"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) — और समय का एक मोड़ नोट किया: OFAC द्वारा Tornado Cash को कुछ दिन पहले ही प्रतिबंधित किए जाने के साथ, ["OFAC द्वारा Tornado Cash के हालिया प्रतिबंध ने हैकर को संभवतः पर्याप्त रूप से चिंतित किया कि अधिकांश चोरी किए गए फंड FixedFloat को भेजे,"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) एक केंद्रीकृत एक्सचेंज। उस विकल्प ने मदद की: rekt.news ने बताया कि FixedFloat को भेजे गए फंडों में से, [112 ETH जमा कर दिए गए](https://rekt.news/curve-finance-rekt)। घंटों के भीतर, Curve ने पुष्टि की ["समस्या मिल गई है और वापस कर दी गई है।"](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)

## यह DeFi फ्रंट-एंड के लिए DNS के बारे में क्या सिखाता है

Curve की घटना इस बारे में एक संक्षिप्त सबक है कि DeFi की असली अटैक सर्फेस कहाँ रहती है। कुछ निष्कर्ष Curve से परे सामान्यीकृत होते हैं:

1. **आपका डोमेन आपके सुरक्षा परिमाप का हिस्सा है।** डोमेन को मार्केटिंग इन्फ्रास्ट्रक्चर के रूप में देखने का लालच होता है — एक लेबल, सिस्टम नहीं। लेकिन डोमेन पहला निर्देश है जो उपयोगकर्ता का ब्राउज़र follow करता है। अगर यह गलत है, तो downstream सब कुछ गलत है। कॉन्ट्रैक्ट सीमा पर रुकने वाले ऑडिट सबसे विश्वसनीय कड़ी को बिना कवर के छोड़ देते हैं।

2. **रजिस्ट्रार और nameserver सुरक्षा आपसे ऊपर है।** Curve के अपने अकाउंट की hygiene ठीक हो सकती थी; समझौता nameserver परत पर माना गया था। आप अपनी DNS श्रृंखला में हर provider की सुरक्षा स्थिति विरासत में लेते हैं। ऐसे रजिस्ट्रार और DNS hosts चुनें जो registrar locks, मज़बूत अकाउंट सुरक्षा, और आदर्श रूप से DNSSEC का समर्थन करते हों — और समझें कि तब भी, आप एक ऐसी परत पर भरोसा कर रहे हैं जिसे आप पूरी तरह नियंत्रित नहीं करते।

3. **उपयोगकर्ता DNS नहीं देख सकते।** क्लोन एकसमान दिखा क्योंकि *नाम* एकसमान था। पैडलॉक हरा था; URL सही था। एक सावधान उपयोगकर्ता जो सामान्यतः जांचता है उसमें से कुछ भी इसे flag नहीं करता। यही DNS hijacking को परिष्कृत दर्शकों के खिलाफ भी इतना प्रभावी बनाता है — धोखा उस परत के नीचे होता है जिसे मनुष्य जांचते हैं।

4. **एक साफ fallback रखें।** Curve की बचाने वाली बात थी अलग इन्फ्रास्ट्रक्चर पर `curve.exchange`। एक दूसरा फ्रंट-एंड पाथ — एक अलग डोमेन, एक अलग DNS provider, IPFS या ENS-आधारित mirror — आपको कहीं ऐसी जगह देता है जहां उपयोगकर्ताओं को भेज सकें जब आपका प्राथमिक नाम poisoned हो।

5. **टोकन approvals payload हैं।** इस परिवार का हर फ्रंट-एंड हमला उसी तरह समाप्त होता है: एक hostile कॉन्ट्रैक्ट के लिए एक routine-दिखने वाला approval। Wallets, interfaces, और उपयोगकर्ता सभी को ताज़ा-लोड पेज पर approval prompts को उच्च-जोखिम action के रूप में मानने की ज़रूरत है जो वे हैं।

## Namefi का दृष्टिकोण

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-curve-finance-dns-hijack-03-namefi-angle.jpg)

Curve का हाईजैक, इसके मूल में, **नाम कौन नियंत्रित करता है** का सवाल है — और उस नियंत्रण को कितनी साफ तरह से सत्यापित, बनाए रखा और पुनः प्राप्त किया जा सकता है।

पारंपरिक मॉडल में, एक डोमेन का नियंत्रण एक नाज़ुक बंडल है: एक रजिस्ट्रार अकाउंट, nameserver रिकॉर्ड का एक सेट, और providers की एक श्रृंखला जिन पर आपको चुपचाप भरोसा करना पड़ता है। जब उस श्रृंखला की कोई भी कड़ी समझौता हो जाती है — जैसा कि iwantmyname nameserver के साथ माना गया था — वैध मालिक कोई गलती किए बिना, और *क्या बदला और कब* का कोई स्पष्ट, tamper-evident रिकॉर्ड के बिना, अपने नाम का प्रभावी नियंत्रण खो सकता है।

[Namefi](https://namefi.io) इस विचार के इर्द-गिर्द बना है कि डोमेन को इंटरनेट-native assets की तरह व्यवहार करना चाहिए — कि ownership और नियंत्रण को DNS के साथ संगत रहते हुए सत्यापन योग्य, ऑडिट योग्य, और tamper-resistant बनाया जा सकता है। Curve का गहरा सबक यह नहीं है कि "DeFi असुरक्षित है।" यह है कि **डोमेन परत load-bearing security infrastructure है**, और वर्षों से इसे सजावट की तरह treat किया गया है। चाहे आप DeFi protocol चलाते हों, स्टोरफ्रंट हो, या ब्लॉग हो, वह नाम जो आपके उपयोगकर्ता टाइप करते हैं एक वादा है — और उस वादे की अखंडता केवल उतनी मज़बूत है जितना उसके पीछे का control surface।

Curve के कॉन्ट्रैक्ट्स ने पांच दशमलव सात बिलियन डॉलर बिना एक खरोंच के संभाले। डोमेन ने एक दोपहर में आधा मिलियन गंवा दिया। यह अंतर ही पूरी कहानी है।

## स्रोत और आगे की पढ़ाई

- CertiK — [Curve Finance Hack Incident Analysis](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)
- rekt.news — [Curve Finance — REKT](https://rekt.news/curve-finance-rekt)
- Cointelegraph (via TradingView) — [What is DNS hijacking? How it took down Curve Finance's website](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)
- Cryptopotato — [Curve Finance Issues Warning About Compromised Front End Amid $570K Theft](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)
- Coingape — [Curve Finance DNS Hijacked, Attackers Stole $570K from User Wallets](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)
- Tronweekly — [Curve Finance's Hackers Loot $570K Via DNS Hijacking](https://www.tronweekly.com/curve-finance-dns-hijacking/)
- CryptoDaily — [Curve Finance Asks Users To Revoke Recent Contracts After DNS Hack](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)
