---
title: 'Bitcoin.org DNS हाईजैक: Bitcoin का अपना होमपेज कैसे "अपने सिक्के दोगुना करें" घोटाले में बदल गया'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'सितंबर 2021 में, Bitcoin.org — छद्म नाम से चलाए जाने वाले Cobra के नेतृत्व में Bitcoin का दीर्घकालिक सूचनात्मक घर — DNS स्तर पर हाईजैक किया गया और एक नकली "अपना Bitcoin दोगुना करें" गिवअवे में बदल दिया गया, जिससे साइट ऑफलाइन होने से पहले धोखेबाजों ने लगभग $17,000 कमाए। एक Domain Mayday गहन विश्लेषण: क्या हुआ, कैसे हुआ, और यह DNS पर निर्भर क्रिप्टो-नेटिव साइटों के बारे में क्या सिखाता है।'
keywords: ['bitcoin.org', 'bitcoin.org hack', 'dns hijack', 'domain hijacking', 'double your bitcoin scam', 'crypto giveaway scam', 'cobra bitcoin.org', 'cloudflare dns', 'namecheap', 'dns security', 'domain security', 'nameserver hijack', 'whois change attack']
---

एक दशक से भी अधिक समय से, यदि आप "Bitcoin क्या है और इसे सुरक्षित तरीके से कैसे उपयोग करें" का स्पष्ट, तटस्थ उत्तर चाहते थे, तो इंटरनेट आपको एक पते पर भेजता था: **Bitcoin.org**।

यह कभी एक्सचेंज नहीं था। इसने कभी कुछ नहीं बेचा। यह दुनिया की सबसे प्रतिकूल, भरोसारहित मुद्रा के लिए सबसे करीबी चीज़ थी — एक *आधिकारिक* स्वागत द्वार — एक साइट जो [18 अगस्त 2008 को पंजीकृत हुई](https://en.wikipedia.org/wiki/Bitcoin#:~:text=The%20domain%20name%20bitcoin.org%20was%20registered), genesis block से भी पुरानी, जहाँ Bitcoin का श्वेतपत्र रहता था और जहाँ नए उपयोगकर्ताओं को क्रिप्टो का पहला नियम सिखाया जाता था: *अपना बैंक स्वयं बनें, और किसी को भी अपनी keys न सौंपें।*

इसलिए **गुरुवार, 23 सितंबर 2021** को जो हुआ उसमें एक क्रूर विडंबना है। क्रिप्टो में सबसे अधिक दोहराया जाने वाला सुरक्षा पाठ — *यदि कोई आपके सिक्के दोगुना करने का वादा करे, तो यह घोटाला है* — Bitcoin के अपने दरवाजे से, उल्टे तरीके से, प्रसारित किया गया। कुछ घंटों के लिए, वह वेबसाइट जो लोगों को "अपना Bitcoin दोगुना करें" घोटाले में न फँसने का पाठ पढ़ाती थी, *वही* "अपना Bitcoin दोगुना करें" घोटाला बन गई। और यह इसलिए नहीं हुआ क्योंकि किसी ने सर्वर में सेंध लगाई, बल्कि इसलिए हुआ क्योंकि किसी ने **domain** पर नियंत्रण कर लिया।

## Bitcoin का एक प्रतीकात्मक, विश्वसनीय घर

यह समझने के लिए कि यह हाईजैक इतना दर्दनाक क्यों था, आपको यह समझना होगा कि Bitcoin.org का क्या अर्थ था।

Bitcoin का कोई CEO नहीं है, कोई मुख्यालय नहीं है, और कोई आधिकारिक प्रवक्ता नहीं है। वर्षों से इसके पास समुदाय द्वारा चलाई जाने वाली संदर्भ साइटों का एक छोटा समूह था, और Bitcoin.org उनमें सबसे प्रमुख था। CryptoPotato ने इसे [BTC से संबंधित सबसे पुरानी वेबसाइट, 13 से अधिक वर्ष पहले पंजीकृत](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/#:~:text=the%20oldest%20website%20in%20relation%20to) बताया। इसने wallet अनुशंसाएं, शुरुआत करने के गाइड, और Satoshi Nakamoto के श्वेतपत्र की प्रति होस्ट की।

यह भी, Bitcoin के लिए उचित रूप से, एक भूत द्वारा चलाया जाता था। साइट को एक छद्म नाम के ऑपरेटर **Cobra** द्वारा बनाए रखा जाता है — सिद्धांत के आधार पर गुमनाम। इस सिद्धांत की हाल ही में अदालत में परीक्षा हुई थी: कुछ महीने पहले ही, स्वयं-घोषित "Satoshi" Craig Wright ने एक UK कॉपीराइट मामला जीता था जिसने Bitcoin.org को श्वेतपत्र हटाने के लिए मजबूर किया, एक जज ने [Cobra को UK में Wright के कॉपीराइट का उल्लंघन करने से रोकने वाला आदेश](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=injunction%20prohibiting%20Cobra%20from%20infringing) जारी किया। Cobra की अपनी गुमनामी की रक्षा लगभग काव्यात्मक थी: [अदालत के नियमों ने मुझे छद्म नाम से मुकदमा करने की अनुमति दी, लेकिन मैं छद्म नाम से अपना बचाव नहीं कर सका](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=the%20court%20rules%20allowed%20for%20me%20to%20be%20sued%20pseudonymously)।

बात यह है कि Bitcoin.org में *विश्वास* था — उस संस्थागत प्रकार का जो एक नेताहीन आंदोलन के पास नहीं होना चाहिए, तेरह वर्षों में चुपचाप जमा हुआ। यही विश्वास इसे एक लक्ष्य बनाता था। एक घोटाला तब बेहतर काम करता है जब उसका मेजबान अधिक विश्वसनीय हो। और क्रिप्टो में Bitcoin के अपने नाम से अधिक विश्वसनीय बहुत कम मेजबान हैं।

यहाँ एक दूसरी, तीखी विडंबना छिपी है। Bitcoin.org की पूरी भावना *self-custody* थी: अपनी खुद की keys रखें, किसी custodian पर भरोसा न करें, हर चीज़ की जाँच करें। एक विज़िटर जिसने उस पाठ को पूरी तरह से आत्मसात कर लिया होता, वह किसी अजनबी के wallet को वादे पर कभी कोई सिक्का नहीं देता। लेकिन गिवअवे घोटाले ने उनसे किसी अजनबी पर भरोसा करने के लिए नहीं कहा — इसने उनसे *Bitcoin.org पर ही* भरोसा करने के लिए कहा, वह एकमात्र पता जिसके बारे में उन्हें वर्षों से बताया गया था कि शुरुआत करने के लिए सुरक्षित स्थान है। हमले ने पाठ को नहीं हराया; इसने संदेशवाहक को हाईजैक किया।

## सितंबर 2021: हाईजैक और नकली गिवअवे

![Vivid colorful concept art of a trusted coastal lighthouse domain that has been hijacked, its beam now flashing a glowing fake sign reading double your coins out over the water toward small boats](../../assets/the-bitcoin-org-dns-hijack-01-hijack.jpg)

23 सितंबर 2021 की सुबह, Bitcoin.org के आगंतुकों को wallet गाइड नहीं दिखे। उन्हें एक pop-up modal दिखा — Bitcoin के सबसे विश्वसनीय संदर्भ साइट के homepage पर लगाया गया एक साफ, आधिकारिक दिखने वाला ओवरले।

संदेश क्रिप्टो में सबसे पुरानी चाल थी, उधार ली हुई सत्ता में लिपटी। इसमें दावा किया गया कि **Bitcoin Foundation** [समुदाय को वापस दे रहा है](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=giving%20back%20to%20the%20community), कहा कि ऑफर [पहले 10,000 उपयोगकर्ताओं](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=first%2010%2C000) तक सीमित है, और एक सरल वादा किया: [इस पते पर Bitcoin भेजें, और हम बदले में दोगुनी राशि भेजेंगे!](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=Send%20Bitcoin%20to%20this%20address%2C%20and%20we%20will%20send%20double) एक QR code ने इसे आसान बना दिया। यांत्रिकी, जैसा CoinDesk ने इस शैली का सूखे तरीके से वर्णन किया, हमेशा एक जैसी होती है: [ये योजनाएं QR code के माध्यम से एक wallet पते पर प्रारंभिक राशि भेजने के बाद किसी के funds को दोगुना करने के झूठे वादे देती हैं](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=these%20schemes%20give%20false%20promises%20of%20doubling)। और परिणाम भी हमेशा एक जैसा होता है: [पीड़ितों को, वास्तव में, बदले में कुछ नहीं मिलता और वे जो क्रिप्टो भेजते हैं वह खो देते हैं](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=Victims%2C%20in%20fact%2C%20receive%20nothing)।

Cobra ने सार्वजनिक रूप से और स्पष्ट रूप से उल्लंघन की पुष्टि की, पोस्ट करते हुए कहा कि साइट [से समझौता किया गया है। वर्तमान में यह जांच की जा रही है कि hackers ने साइट पर scam modal कैसे लगाया](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=has%20been%20compromised.%20Currently%20looking%20into%20how%20the%20hackers)।

## आगंतुकों ने क्या खोया

एक "अपना पैसा दोगुना करें" घोटाला तभी काम करता है जब कुछ लोग उस पर विश्वास करें। किसी यादृच्छिक वेबसाइट पर, लगभग कोई नहीं करता। *Bitcoin.org* पर, कुछ ने किया।

घोटाले का wallet खाली नहीं रहा। BleepingComputer ने रिपोर्ट किया कि पते का [wallet का अंतिम अपडेट किया गया बैलेंस 0.40571238 BTC या लगभग US$17,000 था](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=0.40571238%20BTC%20or%20approximately%20US%2417%2C000)। CoinDesk ने इसे लाइव कैप्चर करते हुए नोट किया कि [giveaway scam के पते पर लिखने के समय तक छोटे लेनदेन में $17,700 से अधिक प्राप्त हुए](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=received%20over%20%2417%2C700%20in%20small%20transactions)।

सत्रह हजार डॉलर, एक रात में, उस धोखाधड़ी में जिसके बारे में होस्ट साइट ने आपको चेतावनी दी होती। और Bitcoin के डिजाइन का सबसे क्रूर हिस्सा याद करें: वे लेनदेन अंतिम हैं। कोई chargeback नहीं है, कोई fraud विभाग नहीं है, कोई "बैंक को कॉल करें" नहीं है। वही अपरिवर्तनीयता जो Bitcoin को शक्तिशाली बनाती है, वह है जिसने प्रत्येक पीड़ित के नुकसान को उस क्षण स्थायी बना दिया जब उन्होंने code स्कैन किया।

डॉलर की आंकड़े लगभग बेमानी है। असली नुकसान उस चीज़ को हुआ जो Bitcoin.org ने तेरह वर्षों में बनाई थी — यह धारणा कि *यह* पता, सभी पतों में से, भरोसा करने के लिए सुरक्षित था।

## यह कैसे हुआ: एक DNS समझौता, सर्वर उल्लंघन नहीं

![Vivid colorful concept art of a redirected road signpost at a glowing fork, one arrow secretly repainted to point traffic toward a golden funnel trap shaped like a coin, the original safe path left dark](../../assets/the-bitcoin-org-dns-hijack-02-fake-giveaway.jpg)

यहाँ वह विवरण है जो इसे एक *Domain Mayday* कहानी बनाता है न कि केवल एक और phishing कहानी: **हमलावरों को Bitcoin.org के सर्वर में सेंध लगाने की जरूरत ही नहीं थी।**

Cobra इस बिंदु पर दृढ़ थे। मूल सर्वर, उन्होंने कहा, अछूता था — [hack के दौरान मेरे वास्तविक सर्वर पर कोई ट्रैफिक नहीं आया](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=my%20actual%20server%20didn%27t%20get%20any%20traffic%20during%20the%20hack)। इसके बजाय, हमला एक परत ऊपर हुआ, इंटरनेट के उस हिस्से में जो यह तय करता है *कि एक domain नाम कहाँ इंगित करता है*। घटना को देखने वाले पर्यवेक्षकों ने नोट किया कि [hack के समय WHOIS जानकारी अपडेट की गई, nameservers + DNS बदले गए](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack)। एक बार जब आप nameservers को नियंत्रित करते हैं, तो आप इस सवाल का जवाब नियंत्रित करते हैं "bitcoin.org *कौन सा* सर्वर है?" — और आप चुपचाप एक विश्वसनीय नाम को अपने स्वामित्व वाले सर्वर की ओर इंगित कर सकते हैं।

Cobra का अपना निदान [DNS](/hi/glossary/dns/) परत पर और एक हालिया infrastructure बदलाव पर दोष डालता था। जैसा उन्होंने कहा: [Bitcoin.org को कभी hack नहीं किया गया। और फिर हम Cloudflare पर चले गए, और दो महीने बाद हमें hack कर लिया गया।](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=Bitcoin.org%20hasn%27t%20been%20hacked%2C%20ever.%20And%20then%20we%20move%20to%20Cloudflare) उनका कार्यशील सिद्धांत संकीर्ण और निंदनीय था: [हमलावरों ने बस DNS में कुछ खामी का फायदा उठाया](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20attackers%20just%20seem%20to%20have%20exploited%20some%20flaw%20in%20the%20DNS)। Decrypt ने प्रचलित पाठ का सारांश उसी तरह किया: हमलावरों ने [वेबसाइट के दो महीने पहले Cloudflare में स्थानांतरित होने के बाद DNS कॉन्फ़िगरेशन में एक खामी का फायदा उठाया](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/#:~:text=exploited%20a%20flaw%20in%20the%20DNS%20configuration%20after%20the%20website%20moved%20to%20Cloudflare)।

चाहे मूल कारण एक गलत कॉन्फ़िगरेशन था, एक registrar-स्तरीय समझौता था, या DNS प्रदाता पर कुछ था — यह सार्वजनिक रूप से कभी पूरी तरह से स्थापित नहीं किया गया — CoinDesk ने नोट किया कि [वेबसाइट hijack का मूल कारण अपुष्ट रहा, हालांकि कुछ लोगों ने इसे DNS hijack होने का संदेह किया](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=root%20cause%20of%20the%20website%20hijack%20remains%20unconfirmed)। लेकिन इसका *आकार* अस्पष्ट नहीं है। एप्लिकेशन ठीक था। कोड ठीक था। Keys ठीक थीं। **नाम** हाईजैक किया गया था, और वेब पर, नाम को नियंत्रित करना अधिकांश लड़ाई है।

## प्रतिक्रिया और परिणाम

सुधार, उल्लेखनीय रूप से, domain परत पर भी हुआ।

साइट केवल अपनी समस्या को "पैच" नहीं कर सकती थी, क्योंकि Bitcoin.org का लाइव दुर्भावनापूर्ण संस्करण Bitcoin.org के वास्तविक बुनियादी ढाँचे से नहीं परोसा जा रहा था। खून बहना रोकने का सबसे तेज़ तरीका domain को ही सेवा से बाहर कर देना था। Registrar, **Namecheap**, ने ठीक यही किया — BleepingComputer के अनुसार, [हमने अस्थायी रूप से domain को अक्षम कर दिया है](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=We%20have%20temporarily%20disabled%20the%20domain)। कुछ समय के लिए, आगंतुकों को न घोटाला मिला न homepage; CoinDesk ने रिपोर्ट किया कि उनका स्वागत ["This site can't be reached."](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=This%20site%20can%27t%20be%20reached) से हुआ। Bitcoin का सबसे विश्वसनीय संदर्भ पृष्ठ अंधेरे में चला गया।

कुछ घंटों की जांच के बाद, domain को सही तरीके से पुनः इंगित किया गया और साइट को उसकी pre-hack स्थिति में बहाल किया गया। विंडो छोटी थी — एक दिन या उससे कम — और कच्चे डॉलर में चोरी क्रिप्टो-अपराध के मानकों से मामूली थी। लेकिन घटना का प्रभाव ठीक इसलिए गहरा था क्योंकि यह *कौन सी* साइट थी। एक आंदोलन जो खुद को "भरोसा न करें, जाँचें" पर गर्व करता है, उसने अभी देखा कि उसका अपना विहित "हम पर भरोसा करें" पेज उसके उपयोगकर्ताओं के खिलाफ सत्यापित रूप से हथियार बना दिया गया।

## यह DNS पर निर्भर क्रिप्टो-नेटिव साइटों के बारे में क्या सिखाता है

![Vivid colorful concept art of a glowing gold coin scam funnel, bright coins pouring into a wide trustworthy-looking mouth at the top and vanishing into darkness at the narrow bottom, set against an energetic abstract background](../../assets/the-bitcoin-org-dns-hijack-03-namefi-angle.jpg)

Bitcoin.org hijack का सबसे असुविधाजनक पाठ यह है कि **क्रिप्टो-नेटिव होना आपको इसमें से लगभग कुछ भी नहीं बचाता।**

Bitcoin विकेंद्रीकृत है। इसका ledger प्रसिद्ध रूप से छेड़छाड़ करना कठिन है। इसकी keys, जब ठीक से रखी जाएं, केवल आपकी हैं। यहाँ इनमें से कुछ भी मायने नहीं रखा — क्योंकि इन सबका *सामने का दरवाजा* एक बिल्कुल सामान्य domain नाम था, किसी e-commerce दुकान या स्थानीय बेकरी की तरह उसी DNS, registrar, और nameserver plumbing पर चल रहा था। blockchain अछूता था। वेबसाइट उस तरह से अछूती थी जो मायने रखती थी, लेकिन **उसे इंगित करने वाला नाम नहीं था।**

इससे कुछ टिकाऊ सबक निकलते हैं:

1. **आपका domain आपकी attack surface का हिस्सा है — अक्सर *सबसे बड़ा* हिस्सा।** आप त्रुटिरहित कोड लिख सकते हैं, अपनी keys को cold storage में रख सकते हैं, और हर सर्वर को मजबूत बना सकते हैं, और एक हमलावर जो आपके nameservers या registrar खाते को नियंत्रित करता है, वह फिर भी पूरी तरह से आपका प्रतिरूपण कर सकता है। नाम सामने का दरवाजा है, और एक हाईजैक किया गया नाम किसी अजनबी को इसका जवाब देने देता है।

2. **DNS/registrar परिवर्तन मौन और उच्च-प्रभाव वाले हैं।** जब [nameservers + DNS बदले गए](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=nameservers%20%2B%20DNS%20changed), तो कुछ भी उस तरह से "टूटा" नहीं जिसे अधिकांश monitoring तुरंत पकड़ लेती — साइट अभी भी लोड हुई, बस गलत जगह से। Registrar lock, registry lock, [DNSSEC](/hi/glossary/dnssec/), और registrar/DNS-provider खातों पर कड़ा access नियंत्रण वैकल्पिक स्वच्छता नहीं हैं; ये उस दरवाजे के ताले हैं जिसे हर कोई भूल जाता है।

3. **प्रतिष्ठा वह चीज़ है जो वास्तव में चुराई जाती है।** हमलावर वास्तव में Bitcoin.org का $17,000 का सर्वर नहीं चाहते थे; वे इसकी *विश्वसनीयता* चाहते थे, एक प्राचीन घोटाले को विश्वसनीय बनाने के लिए कुछ घंटों के लिए उधार ली। आपका domain जितना अधिक विश्वसनीय है, उसे हाईजैक करना उतना ही अधिक मूल्यवान है — और आपको उतना ही अधिक सावधान रहना होगा कि यह कहाँ इंगित करता है, कौन बदल सकता है।

4. **"Trustless" बुनियादी ढाँचा अभी भी विश्वसनीय नामों पर निर्भर करता है।** यहाँ तक कि Bitcoin, बिचौलियों को हटाने का विहित उदाहरण, अपने उपयोगकर्ताओं तक DNS के माध्यम से पहुँचता है — एक पदानुक्रमिक, मध्यस्थता वाली, परिवर्तनशील प्रणाली। पैसे को विकेंद्रीकृत करना सामने के दरवाजे को विकेंद्रीकृत नहीं करता।

5. **पहचान की गति रक्षा की सुंदरता से बेहतर है।** Bitcoin.org एक मामूली नुकसान के साथ इससे बचा, मुख्यतः इसलिए क्योंकि समुदाय ने घोटाले को तेज़ी से देखा और registrar कुछ घंटों के भीतर domain को हटा सकता था। एक हाईजैक किया गया नाम जितनी देर हमलावर के लिए resolve होता रहता है, नुकसान — और प्रतिष्ठा को नुकसान — उतना ही बढ़ता जाता है। यह *तुरंत* जानना कि आपके नाम का नियंत्रण या routing कब बदला, किसी भी एकल स्थैतिक ताले से अधिक मूल्यवान है।

## Namefi का दृष्टिकोण

Bitcoin.org hijack, अपने मूल में, एक *नियंत्रण और सत्यापनीयता* समस्या है। एप्लिकेशन सही था। blockchain सही था। जो विफल हुआ वह वह परत थी जो एक भ्रामक रूप से सरल प्रश्न का उत्तर देती है: **यह नाम किस पर वैध रूप से नियंत्रित है, और इसे कहाँ इंगित करने की अनुमति है?** जब उस प्रश्न का उत्तर चुपचाप फिर से लिखा जा सकता है — nameservers बदले जाते हैं, [hack के समय WHOIS जानकारी अपडेट की जाती है](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack) — तो भरोसा वाष्पित हो जाता है चाहे बाकी स्टैक कितना भी मजबूत हो।

[Namefi](https://namefi.io) इस विचार से शुरू होता है कि domain स्वामित्व और नियंत्रण को एक प्रथम-श्रेणी, सत्यापन योग्य, internet-native संपत्ति की तरह व्यवहार करना चाहिए न कि एक परिवर्तनीय डेटाबेस में एंट्री की तरह जिसे कोई हमलावर चुपचाप संपादित कर सकता है। Tokenized, auditable स्वामित्व "यह domain कौन नियंत्रित करता है, और क्या वह नियंत्रण अभी बदल गया?" प्रश्न का उत्तर on-chain देता है — एक मौन nameserver swap को एक दृश्यमान, जवाबदेह घटना में बदलता है, जबकि बाकी वेब जिस DNS पर निर्भर है उसके साथ संगत रहता है। यह DNS को ही गायब नहीं करता, लेकिन यह *एक नाम पर नियंत्रण* को अदृश्य रूप से हाईजैक करना कठिन और लगातार सत्यापित करना आसान बनाता है।

Bitcoin.org ने तेरह वर्ष दुनिया को यह सिखाने में बिताए कि खतरनाक क्षण वह है जब आप जाँचना बंद कर देते हैं और भरोसा करना शुरू करते हैं। सितंबर 2021 में कुछ घंटों के लिए, उसके अपने domain ने पाठ को कठिन तरीके से सिद्ध किया। सभी के लिए निष्कर्ष उससे सरल है जितना लगता है: आपका domain इंटरनेट पर आपकी पहचान है — नाम की उतनी ही सावधानी से रक्षा करें जितनी उसके पीछे की keys की।

## स्रोत और आगे पढ़ने के लिए

- BleepingComputer — [Bitcoin.org hackers steal $17,000 in 'double your cash' scam](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/)
- CoinDesk — [Bitcoin.org Website Inaccessible After Being Hacked by Apparent Giveaway Scam](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/)
- Bitcoin.com News — [Hackers Compromise Web Portal Bitcoin.org — DNS Hijack Replaces Site With BTC Doubler Scam](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/)
- Decrypt — [Bitcoin.org Compromised, Fraudulent Crypto Giveaway Advertised](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/)
- Cointelegraph — [Bitcoin.org goes offline after suffering scam attack](https://cointelegraph.com/news/bitcoin-org-goes-offline-after-suffering-scam-attack)
- CryptoPotato — [BitcoinOrg Hacked: Giveaway Scam Promising Users to Double Their BTC](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/)
- NewsBTC — [Bitcoin.org Hacked By Scammers For A Few Minutes. Someone Sent Them 0.4 BTC](https://www.newsbtc.com/news/bitcoin-org-hacked-by-scammers/)
- CoinDesk — [UK Court Orders Bitcoin.org to Remove White Paper Following Craig Wright Lawsuit](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit)
- Wikipedia — [Bitcoin (history of the bitcoin.org domain)](https://en.wikipedia.org/wiki/Bitcoin)
