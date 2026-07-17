---
title: 'Lenovo.com DNS हाईजैक: जब Lizard Squad ने एक हार्डवेयर दिग्गज का मुख्य दरवाज़ा छीन लिया'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['nirmit-buddhiraja']
draft: false
description: '25 फरवरी 2015 को, Lizard Squad ने रजिस्ट्रार Webnic से समझौता करके Lenovo.com को हाईजैक कर लिया — दुनिया के सबसे बड़े PC निर्माता के डोमेन को एक वेबकैम स्लाइडशो पर रिडायरेक्ट किया और उसका ईमेल इंटरसेप्ट किया — यह Superfish घोटाले के कुछ ही दिनों बाद हुआ। Domain Mayday की यह गहन पड़ताल बताती है कि आपका रजिस्ट्रार ही आपकी असली सुरक्षा परिधि है।'
keywords: ['lenovo.com dns हाईजैक', 'lizard squad', 'webnic रजिस्ट्रार', 'web commerce communications', 'dns हाईजैकिंग', 'superfish', 'डोमेन रजिस्ट्रार सुरक्षा', 'रजिस्ट्रार समझौता', 'epp auth code', 'ईमेल इंटरसेप्शन', 'google vietnam हाईजैक', 'डोमेन सुरक्षा', 'रजिस्ट्रार लॉक']
relatedArticles:
  - /hi/blog/the-malaysia-airlines-dns-hijack/
  - /hi/blog/the-godaddy-multi-year-breach/
  - /hi/blog/the-fox-it-dns-hijack/
  - /hi/blog/the-panix-com-domain-hijack/
  - /hi/blog/the-curve-finance-dns-hijack/
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
  - /hi/glossary/registry/
  - /hi/glossary/tld/
---

25 फरवरी 2015 की सुबह, दुनिया के सबसे बड़े PC निर्माता के लिए इंटरनेट पर सबसे ज़्यादा क्लिक होने वाला लिंक बोरे हुए किशोरों के वेबकैम में घूरने वाले स्लाइडशो पर पॉइंट कर रहा था — जिसमें *High School Musical* का एक गाना बज रहा था। किसी ने Lenovo का एक भी सर्वर हैक नहीं किया था। किसी ने Lenovo का कोई पासवर्ड नहीं चुराया था। हमलावरों ने इमारत, नेटवर्क या वेबसाइट को ज़रा भी नहीं छुआ था।

उन्होंने कंपनी के डोमेन [रजिस्ट्रार](/hi/glossary/registrar/) में बस एक रिकॉर्ड बदला — और इतना काफी था Lenovo का मुख्य दरवाज़ा छीनने, उसका मेल रिरूट करने, और पूरे ब्रांड को एक दोपहर के लिए मज़ाक का पात्र बनाने के लिए।

यह है **Domain Mayday EP17**: Lenovo.com DNS हाईजैक। संख्याओं के हिसाब से यह एक छोटी सी कहानी है — कुछ घंटों का डाउनटाइम, कोई प्रोडक्शन सिस्टम भंग नहीं, कोई ग्राहक डेटाबेस लीक नहीं। लेकिन यह उस सबक का अब तक के सबसे साफ प्रदर्शनों में से एक है जिसे अधिकांश कंपनियाँ अभी भी गलत समझती हैं: आपका डोमेन उतना ही सुरक्षित है जितना उसे रखने वाला रजिस्ट्रार — और वह रजिस्ट्रार लगभग कभी भी आपके सुरक्षा प्रोग्राम के भीतर नहीं होता।

## एक हार्डवेयर दिग्गज जिसका चेहरा उसका डोमेन है

2015 तक, Lenovo [दुनिया का सबसे बड़ा PC निर्माता](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=the%20world%27s%20largest%20PC%20manufacturer) था, जो पृथ्वी पर सबसे ज़्यादा लैपटॉप और डेस्कटॉप शिप करता था। उस आकार की कंपनी के लिए, lenovo.com कोई मार्केटिंग संपत्ति नहीं है। यह पूरे ऑपरेशन का लोड-बेयरिंग केंद्र है: जहाँ ग्राहक खरीदते हैं, जहाँ सपोर्ट टिकट आते हैं, जहाँ वारंटी रजिस्ट्रेशन होते हैं, और — सबसे महत्वपूर्ण — कंपनी के हर `@lenovo.com` ईमेल पते के पीछे का डोमेन।

जब कोई ब्रांड उस पैमाने पर पहुँचता है, तो डोमेन एक वेबसाइट पते से बढ़कर इन्फ्रास्ट्रक्चर बन जाता है। हर प्रेस रिलीज़, हर रिटेल बॉक्स, हर कर्मचारी के सिग्नेचर, हर ऑर्डर कन्फर्मेशन उससे होकर गुज़रती है। इसका मतलब है कि जो भी डोमेन के DNS को नियंत्रित करता है, वह केवल वेबसाइट को ही नहीं, बल्कि ब्राउज़रों और मेल सर्वरों दोनों के लिए lenovo.com के पॉइंट करने की *सच्चाई* को नियंत्रित करता है।

यही वह पुरस्कार था जिसे Lizard Squad ने निशाना बनाया। वेबसाइट नहीं। उसका पॉइंटर।

## 25 फरवरी 2015: अजीब रिडायरेक्ट

![Vivid colorful concept art of a corporate glass storefront whose illuminated sign has been swapped overnight for a garish prank billboard, neon pinks and electric blues, a crowd staring up in confusion, no brand logos](../../assets/the-lenovo-com-dns-hijack-01-hijack.jpg)

उस दोपहर से शुरू होकर, जो लोग lenovo.com टाइप करते थे वे Lenovo तक नहीं पहुँचते थे। साइट को [कंप्यूटर के सामने बैठे बच्चों के वेबकैम पिक्चर के स्लाइडशो](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) से बदल दिया गया था, जो खाली और हल्के शर्मिंदा दिख रहे थे, सब कुछ *High School Musical* के ["Breaking Free"](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) की धुन पर। The Register ने इसी दृश्य को कंपनी के सामान्य उत्पादों की जगह एक [उबाऊ दिखने वाले युवक की वेबकैम फोटो का स्लाइडशो](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=slideshow%20of%20webcam%20photos%20of%20a%20bored%2Dlooking%20youth) बताया।

यह जानबूझकर बेतुका था, और बेतुकापन ही मक़सद था। यह कोई शांत डेटा चोरी नहीं थी जो छिपी रहे। यह एक सार्वजनिक अपमान था, कंपनी के सबसे दृश्यमान URL पर मंचित।

श्रेय सरेआम छिपा हुआ था। रिप्लेसमेंट पेज के HTML में अपने "नए और बेहतर रीब्रांडेड" निर्माण का श्रेय [Ryan King और Rory Andrew Godfrey](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) को दिया गया था — दो नाम जिन्हें इंटरनेट जासूसों ने जल्दी ही Lizard Squad से जोड़ा, वही क्रू जिसने पिछली छुट्टियों के मौसम में PlayStation Network और Xbox Live को ऑफलाइन कर दिया था। ग्रुप ने Twitter पर क्रेडिट लिया, और अच्छे माप के लिए Lenovo पर *High School Musical* के बोल उद्धृत किए।

और फिर यह शर्मिंदगी से भी बुरा हो गया। क्योंकि हमलावरों ने lenovo.com के DNS को नियंत्रित किया, उन्होंने केवल वेबसाइट ही नहीं — बल्कि मेल भी अपने नियंत्रण में ले लिया। जैसा कि एक आउटलेट ने कहा, हाईजैक का [मतलब था कि वह Lenovo के ईमेल को भी इंटरसेप्ट करने में सक्षम था](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), जब तक रिडायरेक्ट बंद नहीं किया गया। Lizard Squad ने बाद में नियंत्रण की अवधि के दौरान [Lenovo के कर्मचारियों को भेजे गए](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=published%20two%20e%2Dmails) दो संदेश प्रकाशित किए। उनमें से एक में, निराशाजनक हास्यप्रद समय के साथ, एक Lenovo Yoga लैपटॉप का उल्लेख था जो ["ब्रिक्ड" हो गया था](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=bricked) जब एक ग्राहक ने Superfish नामक सॉफ्टवेयर को हटाने के लिए Lenovo के अपने टूल को चलाने की कोशिश की।

यह विवरण एक वाक्य में पूरा उद्देश्य है।

## Superfish की पृष्ठभूमि

यह समझने के लिए कि विशेष रूप से Lenovo को क्यों, आपको पाँच दिन पीछे जाना होगा।

Superfish एडवेयर था जिसे Lenovo [सितंबर 2014 से अपने कुछ कंप्यूटरों के साथ बंडल कर रहा था](https://en.wikipedia.org/wiki/Superfish#:~:text=Lenovo%20began%20to%20bundle%20the%20software%20with%20some%20of%20its%20computers%20in%20September%202014)। ऊपर से यह बस एक ad-injector था — सॉफ्टवेयर जो आपके ब्राउज़र में अतिरिक्त शॉपिंग विज्ञापन फिसलाता था। लेकिन यह जिस तरह काम करता था वह विनाशकारी था। एन्क्रिप्टेड पेजों में विज्ञापन इंजेक्ट करने के लिए, Superfish ने अपना root certificate इंस्टॉल किया ताकि वह [एन्क्रिप्टेड पेजों पर भी विज्ञापन डाल सके](https://en.wikipedia.org/wiki/Superfish#:~:text=allows%20a%20man%2Din%2Dthe%2Dmiddle%20attack%20to%20introduce%20ads%20even%20on%20encrypted%20pages) — दूसरे शब्दों में, इसने HTTPS की सुरक्षा करने वाला ताला तोड़ दिया।

इससे भी बुरा, certificate हर मशीन पर एक ही private key का उपयोग करता था, और वह key क्रैक करने योग्य थी। कोई भी हमलावर जो इसे निकाल लेता, Superfish चला रहे किसी भी Lenovo लैपटॉप के लिए *किसी भी* HTTPS वेबसाइट का रूप धारण कर सकता था। यह कोई सैद्धांतिक खामी नहीं थी। [20 फरवरी 2015 को, अमेरिकी होमलैंड सिक्योरिटी विभाग ने इसे अनइंस्टॉल करने की सलाह दी](https://en.wikipedia.org/wiki/Superfish#:~:text=the%20United%20States%20Department%20of%20Homeland%20Security%20advised%20uninstalling%20it) और इसके root certificate को।

तो एक सप्ताह के दायरे में, एक कंपनी जो उद्यमों को सुरक्षा और विश्वास बेचती थी, उसने लाखों लैपटॉप एक built-in man-in-the-middle भेद्यता के साथ शिप किए, फिर देखा कि उसके अपने हटाने के टूल ने कम से कम एक ग्राहक की मशीन को ब्रिक कर दिया। Lizard Squad का हाईजैक एक विरोध के रूप में आया — Superfish विवाद के बाद [अपनी ही दवा का स्वाद](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=sparked%20online%20uproar%20following%20the%20discovery%20of%20adware%20called%20Superfish)। वेबकैम स्लाइडशो थिएटर था। संदेश था: *आपने अपने ग्राहकों के लिए एन्क्रिप्शन तोड़ा, इसलिए हम आपके मुख्य दरवाज़े को आपके लिए तोड़ेंगे।*

## यह कैसे हुआ: रजिस्ट्रार कमज़ोर कड़ी था

![Vivid colorful concept art of a hijacked control panel with glowing routing dials and switches, a shadowy hand rerouting a brand's front door and mail pipes down a new neon-lit path, electric teal and magenta, no brand logos](../../assets/the-lenovo-com-dns-hijack-02-registrar-compromise.jpg)

यहाँ वह हिस्सा है जो CISOs को रात भर जगाए रखना चाहिए: Lenovo का अपना इन्फ्रास्ट्रक्चर कभी भंग नहीं हुआ।

हमलावरों ने इसके बजाय रजिस्ट्रार को निशाना बनाया। सुरक्षा विश्लेषकों ने हाईजैक को **Web Commerce Communications** — जिसे **Webnic.cc** के नाम से जाना जाता है, एक मलेशिया-आधारित रजिस्ट्रार — के समझौते तक खोजा। जैसा कि Help Net Security ने कहा, हैकरों ने Lenovo के सर्वरों से समझौता नहीं किया; इसके बजाय उन्होंने [Web Commerce Communications (Webnic.cc)](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/) के सर्वरों से समझौता किया, वह रजिस्ट्रार जिसके साथ Lenovo डोमेन पंजीकृत था।

यह Webnic का पहला बुरा सप्ताह नहीं था। ठीक दो दिन पहले, Google के वियतनामी डोमेन को उसी तरह रिडायरेक्ट किया गया था। SecurityWeek ने कनेक्शन को स्पष्ट रूप से संक्षेपित किया: Lizard Squad ने [WebNIC के सिस्टम को भेदकर Google Vietnam और Lenovo के DNS रिकॉर्ड हाईजैक किए](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/), एक मलेशिया-आधारित रजिस्ट्रार। Brian Krebs, जिन्होंने इसकी जाँच करने वाले शोधकर्ताओं का हवाला दिया, ने बताया कि [दोनों हाईजैक संभव थे क्योंकि हमलावरों ने Webnic.cc पर नियंत्रण कर लिया था](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=both%20hijacks%20were%20possible%20because%20the%20attackers%20seized%20control%20over%20Webnic.cc) — एक रजिस्ट्रार जो उसी रिपोर्टिंग के अनुसार, उन दो डोमेन और 6,00,000 अन्य डोमेन की सेवा करता था।

Krebs की रिपोर्टिंग से यांत्रिकी, एक रजिस्ट्रार को एक रसीला लक्ष्य क्यों बनाती है, इसकी पाठ्यपुस्तक की तरह पढ़ी जाती है:

- **प्रवेश का तरीका।** Lizard Squad ने एक [Webnic.cc में command injection भेद्यता का उपयोग करके rootkit अपलोड किया](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) — जिससे उन्हें रजिस्ट्रार के सिस्टम तक स्थायी, छिपी हुई पहुँच मिली।
- **मास्टर चाबियाँ।** उन्होंने [Webnic के "auth codes" के भंडार तक भी पहुँच प्राप्त की](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=also%20gained%20access%20to%20Webnic%27s%20store%20of) — EPP ट्रांसफर सीक्रेट जो *किसी भी* डोमेन को दूसरे रजिस्ट्रार में ले जा सकते हैं।
- **रिडायरेक्ट।** रजिस्ट्रार-स्तर नियंत्रण के साथ, उन्होंने lenovo.com के nameserver रिकॉर्ड बदल दिए। The Register ने नोट किया कि डोमेन की [nameserver सेटिंग्स संदिग्ध रूप से आज web hosting कंपनी CloudFlare से संबंधित DNS सर्वरों पर पॉइंट करने के लिए अपडेट की गई थीं](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=nameserver%20settings%20were%20suspiciously%20updated%20today%20to%20point%20at%20DNS%20servers%20belonging%20to%20web%20hosting%20biz%20CloudFlare) — असली गंतव्य सर्वर को छिपाने के लिए Cloudflare का उपयोग करते हुए।
- **मेल की चोरी।** महत्वपूर्ण बात, वे वेबसाइट पर नहीं रुके। उन्होंने [Lenovo पतों पर भेजे गए संदेशों को इंटरसेप्ट करने की अनुमति देते हुए mail server रिकॉर्ड बदल दिए](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)। DNS केवल `A` रिकॉर्ड से अधिक नियंत्रित करता है; यह `MX` रिकॉर्ड भी नियंत्रित करता है। डोमेन का मालिक होना मेल का मालिक होना था।

वह अंतिम बिंदु वह है जिसे लोग भूल जाते हैं। Defacement तेज़ और स्पष्ट होता है। शांत ईमेल इंटरसेप्शन DNS हाईजैक का खतरनाक आधा हिस्सा है — और यह रजिस्ट्रार पर एक रिकॉर्ड बदलने के उसी एकल कार्य से निकलता है।

## प्रतिक्रिया और परिणाम

Lenovo ने तेज़ी से काम किया, क्योंकि उसके पास करने के लिए कुछ और था ही नहीं — फिक्स उसके अपने सर्वरों पर नहीं, रजिस्ट्रार पर थी। कंपनी ने पुष्टि की कि वह एक [साइबर हमले का शिकार](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/) हुई थी जिसका प्रभाव Lenovo वेबसाइट से ट्रैफिक को रिडायरेक्ट करना था, और [25 फरवरी की शाम तक अपनी सार्वजनिक वेबसाइट तक पूर्ण पहुँच बहाल कर ली गई थी](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=restored%20complete%20access%20to%20its%20public%20website%20by%20the%20evening%20of%20Feb.%2025)। Cloudflare, जिसका नाम रिडायरेक्ट चेन में उपयोग किया गया था, ने दुर्भावनापूर्ण nameservers को काट दिया, जिससे ईमेल इंटरसेप्शन भी समाप्त हो गया।

बड़ी सफाई Webnic के पास थी। एक रजिस्ट्रार की command-injection बग ने 48 घंटे के भीतर इंटरनेट के दो सबसे मूल्यवान डोमेन — Lenovo का और एक Google प्रॉपर्टी — को एक स्टंट-संचालित हैकिंग क्रू के हाथों में डाल दिया। यह घटना रजिस्ट्रार जोखिम में एक स्थायी केस स्टडी बन गई, और एक अनुस्मारक कि "6,00,000 अन्य डोमेन" उसी समझौता किए गए सिस्टम के पीछे बैठे थे।

Lenovo के लिए, स्थायी नुकसान प्रतिष्ठात्मक था। Superfish के बाद आने से, हाईजैक ने एक गंभीर सुरक्षा विफलता को दो-अंक की कहानी में बदल दिया: पहले कंपनी ने अपने ग्राहकों के लिए विश्वास तोड़ा, फिर दृश्यमान रूप से अपने नाम पर नियंत्रण खो दिया। वेबकैम स्लाइडशो वह था जिसे लोग याद करते हैं, लेकिन रजिस्ट्रार समझौता वह था जो वास्तव में मायने रखता था।

## यह क्या सिखाता है: आपका रजिस्ट्रार आपकी असली सुरक्षा परिधि है

EP17 का असहज सबक यह है कि Lenovo ने अधिकांश चीजें उन हिस्सों पर सही कीं जिन्हें वह नियंत्रित करता था, और फिर भी उस हिस्से के माध्यम से हाईजैक हो गया जिसे वह नहीं नियंत्रित करता था।

कुछ टेकअवे जो 2015 से बहुत आगे सामान्यीकृत होते हैं:

1. **रजिस्ट्रार आपकी ट्रस्ट बाउंड्री में है चाहे आप इसे उस तरह से ट्रीट करें या नहीं।** आप अपने स्वामित्व वाले हर सर्वर को कठोर बना सकते हैं और फिर भी किसी तीसरे पक्ष पर डोमेन खो सकते हैं जिसका आपने शायद कभी सुरक्षा-समीक्षा नहीं किया। हमलावर प्रतिरोध की कम से कम राह लेता है — और रजिस्ट्रार अक्सर आपसे नरम होता है।
2. **DNS नियंत्रण मेल नियंत्रण है।** एक हाईजैक केवल एक विकृत होमपेज नहीं है। वही रिकॉर्ड परिवर्तन चुपचाप ईमेल को रिरूट करता है, इंटरसेप्शन को सक्षम करता है, आपके डोमेन के विरुद्ध पासवर्ड रीसेट करता है, और प्रतिरूपण करता है। `MX` रिकॉर्ड को प्लंबिंग नहीं, एक सुरक्षा-महत्वपूर्ण संपत्ति के रूप में ट्रीट करें।
3. **जो लॉक किया जा सकता है उसे लॉक करें।** रजिस्ट्रार लॉक (registrar-lock / `clientTransferProhibited`), EPP/auth codes तक प्रतिबंधित पहुँच, और उच्च-मूल्य डोमेन के लिए registry-स्तर लॉक अनधिकृत nameserver और ट्रांसफर परिवर्तनों को रोकने के लिए ही मौजूद हैं। वे सस्ते हैं। उन्हें छोड़ने का नकारात्मक पहलू एक वेबकैम स्लाइडशो पर आपका ब्रांड है।
4. **[DNSSEC](/hi/glossary/dnssec/) लागत बढ़ाता है।** यह अकेले रजिस्ट्रार-खाता अधिग्रहण को नहीं रोकता, लेकिन हस्ताक्षरित ज़ोन और निगरानी DNS शांत छेड़छाड़ को बिना पकड़े खींचना कठिन बनाते हैं।
5. **ड्रिफ्ट के लिए अपने खुद के DNS की निगरानी करें।** Lenovo के nameservers का एक अप्रत्याशित प्रदाता में बदलना ही संकेत था। NS और MX रिकॉर्ड की निरंतर निगरानी "हमें पता चला जब ग्राहकों ने स्लाइडशो देखा" को "हमें तब सूचित किया गया जब रिकॉर्ड बदला" में बदल देती है।

साझा विषय: डोमेन नियंत्रण अपना एक सुरक्षा डोमेन है, और अधिकांश कंपनियों ने इसे एक विक्रेता को आउटसोर्स कर दिया है जो कभी उनके खतरा मॉडल में दिखाई नहीं देता।

## Namefi का दृष्टिकोण

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-lenovo-com-dns-hijack-03-namefi-angle.jpg)

Lenovo हाईजैक मूलतः एक नियंत्रण-और-उत्पत्ति समस्या है। हमलावर को Lenovo होने की ज़रूरत नहीं थी; उन्हें केवल उस सिस्टम को समझाने की ज़रूरत थी जो lenovo.com को नियंत्रित करता है कि कहीं नए की ओर इशारा करे। कोई मज़बूत, स्वतंत्र, सत्यापन योग्य रिकॉर्ड नहीं था कि कौन वैधानिक रूप से डोमेन को नियंत्रित करता है — बस एक रजिस्ट्रार खाता जिसे एक भेद्यता के माध्यम से चुपचाप पछाड़ा जा सकता था जिसे Lenovo में किसी ने देखा नहीं।

[Namefi](https://namefi.io) इस विचार के आधार पर बनाया गया है कि डोमेन को सत्यापन योग्य, छेड़छाड़-प्रतिरोधी स्वामित्व के साथ इंटरनेट-मूल संपत्तियों की तरह व्यवहार करना चाहिए। जब किसी डोमेन का नियंत्रण क्रिप्टोग्राफिक स्वामित्व से लंगर डाला जाता है जो ऑडिट करने योग्य और चुपचाप ओवरराइड करने में कठिन हो — न कि एक पुनर्प्राप्ति योग्य auth code के साथ एकल रजिस्ट्रार खाते के बजाय — एक अनधिकृत nameserver स्वैप एक शांत बैकएंड संपादन होना बंद हो जाता है और हिरासत की श्रृंखला में एक दृश्यमान, सिद्ध ब्रेक बन जाता है। टोकनाइज़्ड स्वामित्व डोमेन को DNS के साथ संगत रखता है जबकि "इस नाम को कौन नियंत्रित करता है, और क्या यह अभी-अभी बदला?" को एक सत्यापन योग्य उत्तर के साथ एक प्रश्न बनाता है।

Lizard Squad ने एक दोपहर में स्वामित्व श्रृंखला की सबसे कमज़ोर कड़ी का फायदा उठाकर एक हार्डवेयर दिग्गज के मुख्य दरवाज़े को मज़ाक में बदल दिया। बचाव एक ज़ोरदार वेबसाइट नहीं है। यह नाम के *स्वामित्व* को ऐसा बनाना है जिसे कोई हमलावर चुपचाप जाली न बना सके।

## स्रोत और आगे पढ़ने के लिए

- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- The Register — [Oh No, Lenovo! Lizard Squad on the attack, flashes swiped emails](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/)
- Engadget — [Lenovo's website hijacked, apparently by Lizard Squad](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)
- SecurityWeek — [Lizard Squad Hijacks Lenovo Website, Emails](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- BankInfoSecurity — [Lenovo Website Hijacked](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953)
- IT Security Guru — [Lizard Squad domain hijack gives control of Google Vietnam and Lenovo website](https://www.itsecurityguru.org/2015/02/26/lizard-squad-domain-hijack-gives-control-of-google-vietnam-and-lenovo-website/)
- CNBC — [Lenovo website breached, hacker group Lizard Squad claims responsibility](https://www.cnbc.com/2015/02/25/lenovo-website-breached-hacker-group-lizard-squad-claims-responsibility.html)
- We Live Security (ESET) — [Lenovo website hacked, Lizard Squad claims responsibility](https://www.welivesecurity.com/2015/02/26/lenovo-website-hacked-lizard-squad-claims-responsibility/)
- Computing — [Lenovo website hijacked by Lizard Squad after Superfish debacle](https://www.computing.co.uk/news/2397084/lenovo-website-hijacked-by-lizard-squad-after-superfish-debacle)
- Wikipedia — [Superfish](https://en.wikipedia.org/wiki/Superfish)
- CISA — [Lenovo Superfish Adware Vulnerable to HTTPS Spoofing](https://www.cisa.gov/news-events/alerts/2015/02/20/lenovo-superfish-adware-vulnerable-to-https-spoofing)
