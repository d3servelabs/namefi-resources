---
title: 'मलेशिया एयरलाइंस DNS हाईजैक: "404 — Plane Not Found"'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'जनवरी 2015 में, Lizard Squad ने malaysiaairlines.com का DNS हाईजैक कर लिया और एयरलाइन की साइट को एक टक्सीडो पहने छिपकली और ताना "404 — Plane Not Found" से बदल दिया। किसी सर्वर में सेंध नहीं लगाई गई — हमलावरों ने बस यह बदल दिया कि डोमेन कहाँ इंगित करता है। यह एक Domain Mayday की गहन पड़ताल है कि DNS कैसे एयरलाइन का सबसे उजागर दरवाज़ा बना।'
keywords: ['malaysia airlines dns hijack', 'lizard squad', 'cyber caliphate', '404 plane not found', 'dns hijacking', 'domain hijacking', 'registrar compromise', 'webnic', 'malaysiaairlines.com', 'domain security', 'dns redirection', 'registry lock', 'mh370']
---

विमान कभी नहीं मिला। जनवरी 2015 में, वेबसाइट भी नहीं मिली।

26 जनवरी 2015 की सुबह, जिसने भी ब्राउज़र में **malaysiaairlines.com** टाइप किया, वह एयरलाइन तक नहीं पहुँचा। वह एक हैकर के पास पहुँचा। परिचित बुकिंग पेज गायब था, उसकी जगह एक शीर्ष टोपी और मोनोकल पहने छिपकली की छवि और एक क्रूर शीर्षक था: **"404 — Plane Not Found."** उसके नीचे लिखा था: *"Hacked by Lizard Squad — Official Cyber Caliphate."* एक ब्राउज़र टाइटल बार पर बस इतना लिखा था, *"ISIS will prevail."*

यह एक कब्रगाह पर मज़ाक था। एक साल से भी कम पहले, Malaysia Airlines की Flight 370, 239 लोगों को लेकर राडार से गायब हो गई थी। उसके चार महीने बाद, Flight 17 को यूक्रेन के ऊपर आसमान से मार गिराया गया था। अब किशोरों के एक समूह ने एयरलाइन के अपने दुःख को एक मज़ाक में बदल दिया था जो उसके अपने दरवाज़े पर परोसा गया था — बिना कभी उसके सर्वर को छुए।

यही आखिरी बात पूरी कहानी है। Malaysia Airlines को उस तरह "हैक" नहीं किया गया जैसा ज़्यादातर लोग सोचते हैं। उसके बुकिंग सिस्टम अक्षुण्ण थे। यात्री डेटा अछूता था। हमलावरों ने जो कब्ज़ा किया वह कुछ अधिक मौलिक था और, जैसा कि पता चला, लेने में कहीं अधिक आसान: **डोमेन नाम खुद** — वह पता जो पूरे इंटरनेट को बताता है कि "Malaysia Airlines" कहाँ रहती है।

यह एक Domain Mayday मामला है जो आपके उस बुनियादी ढाँचे के हिस्से के बारे में है जिसके बारे में आप शायद तब तक कभी नहीं सोचते जब तक वह कहीं और इशारा न करे।

## एक एयरलाइन का मतलब है उसका डोमेन

एक वैश्विक वाहक के लिए, वेबसाइट एक ब्रोशर नहीं है। यह कैश रजिस्टर है, चेक-इन काउंटर है, और कॉल सेंटर है — सब कुछ एक टेक्स्ट स्ट्रिंग से जुड़ा: `malaysiaairlines.com`।

हर बुकिंग, हर लॉयल्टी लॉगिन, हर कन्फर्मेशन ईमेल में हर "manage my flight" लिंक उसी डोमेन से गुज़रता है। जब कुआलालंपुर या लंदन में कोई यात्री उसे टाइप करता है, तो एक अदृश्य श्रृंखला सक्रिय होती है: ब्राउज़र Domain Name System (DNS) से पूछता है "malaysiaairlines.com कहाँ रहती है?", DNS एक IP पता बताता है, और ब्राउज़र कनेक्ट हो जाता है। एयरलाइन का ब्रांड, उसका राजस्व और उसके ग्राहकों का विश्वास — सब कुछ उस एक लुकअप पर टिका है जो *सही* उत्तर दे।

DNS इंटरनेट की एड्रेस बुक है। यह अधिकांश संगठनों के लिए, इमारत का सबसे कम निगरानी वाला दरवाज़ा भी है। आप अपने सर्वर को सुरक्षित करने, डेटाबेस एन्क्रिप्ट करने और [फ़िशिंग](/hi/glossary/phishing/) के विरुद्ध स्टाफ को प्रशिक्षित करने में लाखों खर्च कर सकते हैं — और इसमें से कुछ भी मायने नहीं रखता अगर कोई चुपचाप एड्रेस बुक की उस लाइन को बदल दे जो बताती है कि आपका नाम कहाँ इंगित करता है। पते को रीडायरेक्ट करें, और आपने कंपनी को रीडायरेक्ट कर दिया — बिना कभी इमारत में घुसे।

यही बिल्कुल हुआ।

## हाईजैक: जहाँ एयरलाइन हुआ करती थी, वहाँ एक छिपकली

![Vivid colorful concept art of a glowing DNS signpost on a runway switched by an unseen hand, rerouting a stream of travelers away from a departure gate toward a dead-end wall stamped with a giant 404, neon teal and magenta](../../assets/the-malaysia-airlines-dns-hijack-01-hijack.jpg)

इस विरूपण को अधिकतम क्रूरता के लिए तैयार किया गया था। औपचारिक पोशाक में एक छिपकली की छवि Lizard Squad का कॉलिंग कार्ड था; समूह ने पिछले दिसंबर में [Xbox Live और Sony PlayStation Network](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Hacker%20group%20Lizard%20Squad%2C%20which%20took%20down%20Xbox%20Live%20and%20the%20Sony%20PlayStation%20Network%20last%20month) को छुट्टियों के दौरान ठप कर दिया था। जनवरी तक उसने खुद को एक "Cyber Caliphate" की छवि में ढाल लिया था, ISIS-समर्थक होने का दिखावा करते हुए, जबकि शोधकर्ता इस दावे पर गहरा संदेह कर रहे थे।

साइट, जैसा कि आगंतुकों ने पाया, [एक शीर्ष टोपी और मोनोकल वाली छिपकली की तस्वीर और "404-Plane Not Found" टेक्स्ट दिखाती थी](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=The%20site%20currently%20displays%20a%20picture%20of%20a%20lizard%20in%20a%20top%20hat%20and%20monocle%2C%20as%20well%20as%20the%20text%20%27404%2DPlane%20Not%20Found%27)। विकिपीडिया का समूह के बारे में वर्णन उसी दृश्य को दर्ज करता है: उपयोगकर्ताओं को [टक्सीडो पहने एक छिपकली की छवि वाले दूसरे पृष्ठ पर भेज दिया गया](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=Users%20were%20redirected%20to%20another%20page%20bearing%20an%20image%20of%20a%20tuxedo%2Dwearing%20lizard), और पेज में ["404 - Plane Not Found" शीर्षक था, जो एयरलाइन के पिछले वर्ष MH370 खोने का स्पष्ट संदर्भ था](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=The%20page%20also%20carried%20the%20headline%20%22404%20%2D%20Plane%20Not%20Found%22%2C%20an%20apparent%20reference%20to%20the%20airline%27s%20loss%20of%20flight%20MH370%20the%20previous%20year)।

क्रूरता ही उद्देश्य था। MH370 [8 मार्च 2014 को राडार से गायब हो गई थी](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370#:~:text=disappeared%20from%20radar%20on%208%20March%202014), सभी 239 लोगों को अंततः मृत मान लिया गया, और मलबा कभी निर्णायक रूप से नहीं मिला। MH17 को [17 जुलाई 2014 को रूस-समर्थित सेनाओं द्वारा Buk 9M38 सतह-से-हवा मिसाइल से मार गिराया गया था](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17#:~:text=shot%20down%20by%20Russian%2Dbacked%20forces%20with%20a%20Buk%209M38%20surface%2Dto%2Dair%20missile%20on%2017%20July%202014), जिससे सभी 298 लोग मारे गए। एयरलाइन के होमपेज पर "Plane Not Found" लगाना कंपनी के इतिहास के सबसे बुरे साल को हथियार बनाना था — और इसे साइट तक पहुँचने की कोशिश करने वाले हर ग्राहक के सामने प्रसारित करना था।

फिर आई धमकी। समूह ने [ट्वीट किया कि वह "जल्द ही www.malaysiaairlines.com सर्वर पर मिला कुछ माल डंप करेगा,"](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=Going%20to%20dump%20some%20loot%20found%20on%20www.malaysiaairlines.com%20servers%20soon) और यहाँ तक कि एक स्क्रीनशॉट पोस्ट किया जिसमें उसने दावा किया कि यात्री यात्रा कार्यक्रम दिखाए गए हैं। एक एयरलाइन के लिए जो पहले से ही एक साल की तबाही में डूबी हुई थी, यह विचार कि ग्राहक डेटा लीक हो गया है, अपने आप में एक आपदा थी।

## यह कैसे हुआ: इमारत नहीं, एड्रेस बुक

![Vivid colorful concept art of a futuristic switchboard operator pulling a glowing cable from the correct socket and plugging it into a fake one, streams of light-traffic diverting off a runway toward an impostor terminal, electric blues and warm orange](../../assets/the-malaysia-airlines-dns-hijack-02-dns-redirect.jpg)

यहाँ तकनीकी मूल है, और वह कारण जिसकी वजह से यह मामला सर्वर-उल्लंघन श्रृंखला की बजाय डोमेन-सुरक्षा श्रृंखला में शामिल है।

Malaysia Airlines का अपना बयान, जो पूरी कवरेज में दोहराया गया, ने यह अंतर स्पष्ट रूप से बताया: [Malaysia Airlines पुष्टि करती है कि उसके Domain Name System (DNS) से समझौता किया गया है जहाँ उपयोगकर्ताओं को एक हैकर वेबसाइट पर पुनर्निर्देशित किया जाता है जब www.malaysiaairlines.com URL टाइप किया जाता है](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20confirms%20that%20its%20Domain%20Name%20System%20%28DNS%29%20has%20been%20compromised%20where%20users%20are%20re%2Ddirected%20to%20a%20hacker%20website)। एयरलाइन ने ज़ोर दिया कि उसकी [वेबसाइट हैक नहीं हुई और यह अस्थायी समस्या उनकी बुकिंग को प्रभावित नहीं करती और उपयोगकर्ता डेटा सुरक्षित है](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20assures%20customers%20and%20clients%20that%20its%20website%20was%20not%20hacked%20and%20this%20temporary%20glitch%20does%20not%20affect%20their%20bookings%20and%20that%20user%20data%20remains%20secured), और जोड़ा कि उसके [वेब सर्वर अक्षुण्ण हैं](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=Malaysia%20Airlines%27%20Web%20servers%20are%20intact)।

दोनों बातें एक साथ सच थीं: साइट तबाह हो गई थी, *और* सर्वर ठीक थे। हमलावरों को सर्वर की ज़रूरत ही नहीं थी। जैसा कि The Register ने कहा, [साइट के DNS रिकॉर्ड में हस्तक्षेप किया गया था ताकि ब्राउज़ करने वालों को एक हैकर-नियंत्रित साइट पर पुनर्निर्देशित किया जा सके](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=DNS%20records%20for%20the%20site%20have%20been%20interfered%20with%20so%20that%20surfers%20are%20being%20redirected%20to%20a%20hacker%2Dcontrolled%20site)। उन्होंने एड्रेस बुक की एंट्री बदली, न कि वह इमारत जिसकी ओर वह इशारा करती थी। द्वेष मेटाडेटा में भी दर्ज था: उस समय [Whois](/hi/glossary/whois/) चेक में साइट का टाइटल [ISIS will prevail](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html#:~:text=ISIS%20will%20prevail) दिखाई दिया।

वह एड्रेस बुक कहाँ रखी गई थी? [रजिस्ट्रार](/hi/glossary/registrar/) के पास। एयरलाइन का डोमेन [Web Commerce Communications Limited — उर्फ Webnic — के साथ पंजीकृत प्रतीत होता है, जिसके सिंगापुर, मलेशिया और चीन में कार्यालय हैं](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=registered%20with%20Web%20Commerce%20Communications%20Limited%20%2D%20a.k.a.%20Webnic%20%2D%20which%20has%20offices%20in%20Singapore%2C%20Malaysia%20and%20China)। यह नाम मायने रखता है, क्योंकि Webnic जल्द ही बदनाम होने वाला था।

एक महीने बाद, वही रजिस्ट्रार एक कहीं बड़ी घटना के केंद्र में था। जैसा कि Brian Krebs ने रिपोर्ट किया, हमलावरों ने [Webnic.cc पर नियंत्रण कर लिया, जो मलेशियाई रजिस्ट्रार दोनों डोमेन और 600,000 अन्य डोमेन की सेवा करता है](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=seized%20control%20over%20Webnic.cc%2C%20the%20Malaysian%20registrar%20that%20serves%20both%20domains%20and%20600%2C000%20others), फिर **Lenovo** और **Google Vietnam** के लिए [Webnic.cc पर अपनी पहुँच का उपयोग करके domain name system (DNS) रिकॉर्ड बदल दिए](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=leverage%20their%20access%20at%20Webnic.cc%20to%20alter%20the%20domain%20name%20system%20%28DNS%29%20records)। Krebs ने रिपोर्ट की, तंत्र था [Webnic.cc में एक command injection vulnerability जिसका उपयोग rootkit अपलोड करने के लिए किया गया](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) — उस सिस्टम तक स्थायी पहुँच जो नियंत्रित करता है कि लाखों डोमेन कहाँ इशारा करते हैं।

google.com.vn को रीडायरेक्ट करने के लिए आपको Google में नहीं घुसना पड़ता। एयरलाइन के होमपेज को रीडायरेक्ट करने के लिए आपको एयरलाइन में नहीं घुसना पड़ता। आपको बस उस परत से समझौता करना होता है जो *उत्तर की मालिक है* "यह डोमेन कहाँ रहता है?" — रजिस्ट्रार खाता और उसके पीछे के DNS रिकॉर्ड। वह परत उस परिधि के बाहर बैठती है जिसे अधिकांश कंपनियाँ वास्तव में बचाती हैं।

## प्रभाव और प्रतिक्रिया

एयरलाइन के लिए, नुकसान डेटा चोरी की बजाय प्रतिष्ठात्मक और परिचालन था। बुक करने या चेक इन करने की कोशिश करने वाले ग्राहकों को एक विरूपण का सामना करना पड़ा। दुनिया भर में सुर्खियों ने "Malaysia Airlines" शब्द को "हैक" के साथ जोड़ा — एक ब्रांड जो पहले से ही संकट में था, अब उसे एक छिपकली के साथ जोड़ा जा रहा था जो उसके लापता विमान के बारे में ताना दे रही थी।

एयरलाइन ने इसे उसी एकमात्र तरीके से रोकने की कोशिश की जिससे DNS हाईजैक को रोका जा सकता है: उस परत के माध्यम से काम करके जिसे तोड़ा गया था। उसने कहा कि उसने [अपने सेवा प्रदाता के साथ समस्या हल कर ली है](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=resolved%20the%20issue%20with%20its%20service%20provider) और [सिस्टम 22 घंटों के भीतर पूरी तरह ठीक होने की उम्मीद है](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=The%20system%20is%20expected%20to%20be%20fully%20recovered%20within%2022%20hours)। यह समयरेखा अपने आप में DNS का संकेत है: रिकॉर्ड ठीक करने के बाद भी, गलत उत्तर दुनिया भर के कैश में तब तक बना रह सकता है जब तक वह समाप्त नहीं हो जाता। हाईजैक करना तेज़ है, लेकिन पूरी तरह वापस लाना धीमा है।

डेटा-डंप की धमकी पर, एयरलाइन अपनी बात पर अड़ी रही — बुकिंग अप्रभावित, उपयोगकर्ता डेटा सुरक्षित — और समूह ने जिस विनाशकारी लीक का दावा किया था, वह कभी वर्णन के अनुसार सामने नहीं आया। लेकिन "हम वास्तव में उल्लंघित नहीं हुए, हमलावरों ने केवल एक दिन के बेहतर हिस्से के लिए हमारी पूरी सार्वजनिक पहचान को नियंत्रित किया" — यह यात्रा करने वाले लोगों तक पहुँचाने के लिए एक कठिन संदेश है। "404 — Plane Not Found" देख रहे एक ग्राहक को, सर्वर उल्लंघन और DNS हाईजैक के बीच का अंतर अदृश्य है। साइट एयरलाइन थी। और एक दिन के लिए, साइट किसी और की थी।

## यह DNS के बारे में क्या सिखाता है — आपके सामने का दरवाज़ा

Malaysia Airlines हाईजैक एक पाठ्यपुस्तक सबक है ठीक इसलिए क्योंकि पारंपरिक अर्थों में *कुछ भी उल्लंघित नहीं हुआ*। यहाँ से जो सबक मिलते हैं वे लगभग हर ऑनलाइन संगठन पर लागू होते हैं:

1. **आपका डोमेन एकल विफलता बिंदु है जिसे आप अकेले नियंत्रित नहीं करते।** रजिस्ट्रार मास्टर रिकॉर्ड रखता है जो बताता है कि आपका नाम कहाँ इंगित करता है। यदि उनकी खाता सुरक्षा — या उनका सॉफ़्टवेयर — विफल होती है, तो आपके पूरी तरह से सुरक्षित सर्वर अप्रासंगिक हैं। Webnic ने एक महीने में दो बार यह साबित किया — एक एयरलाइन के साथ और फिर Google और Lenovo के साथ।

2. **DNS हाईजैक के लिए आपमें कोई उल्लंघन ज़रूरी नहीं।** हमलावरों ने इमारत नहीं, एड्रेस बुक को रीडायरेक्ट किया। जो बचाव आपके सर्वर, आपके कोड और आपके नेटवर्क पर नज़र रखते हैं, वे एक ऐसे हमले को चूक सकते हैं जो पूरी तरह से नामकरण परत पर होता है।

3. **वे रिकॉर्ड लॉक करें जो आपका नाम हिला सकते हैं।** Registry Lock और रजिस्ट्रार-स्तर के लॉक विशेष रूप से आपके DNS और [नेमसर्वर](/hi/glossary/nameserver/) रिकॉर्ड में अनधिकृत परिवर्तनों को रोकने के लिए मौजूद हैं — वे आपके डोमेन को पुनर्निर्देशित करने से पहले एक मैनुअल, आउट-ऑफ-बैंड चरण जोड़ते हैं। उच्च-मूल्य वाले डोमेन के लिए, वे वैकल्पिक नहीं हैं।

4. **[DNSSEC](/hi/glossary/dnssec/) और रजिस्ट्रार पर 2FA का उपयोग करें।** रजिस्ट्रार खाते पर मज़बूत प्रमाणीकरण और ज़ोन पर DNSSEC हस्ताक्षर उस मूक रिकॉर्ड-स्वैप की लागत बढ़ाते हैं जिसने Malaysia Airlines को विरूपित किया।

5. **रिकवरी हमले से धीमी होती है।** TTL और वैश्विक कैश का मतलब है कि एक हाईजैक अपने सुधार के बाद भी जीवित रहता है। केवल पैच के लिए नहीं, सफाई की खिड़की के लिए भी योजना बनाएँ।

असुविधाजनक सारांश: अधिकांश कंपनियाँ इमारत की रक्षा करती हैं और सामने के दरवाज़े पर एक चिपकी हुई पर्ची छोड़ती हैं जो सभी को बताती है कि किस इमारत में जाना है। पर्ची बदलें, और आपने कंपनी को हिला दिया।

## Namefi का नज़रिया

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-malaysia-airlines-dns-hijack-03-namefi-angle.jpg)

Malaysia Airlines हाईजैक मूल रूप से एक प्रश्न है: *कौन किसी नाम की दिशा बदलने की अनुमति रखता है* — और वह अधिकार रजिस्ट्रार परत पर कितनी आसानी से चुपचाप चुराया जा सकता है। हमले ने क्रिप्टोग्राफी को नहीं हराया या डेटाबेस को नहीं तोड़ा। उसने उस नरम, खाता-आधारित नियंत्रण तल को हराया जो एक डोमेन के बारे में सबसे महत्वपूर्ण तथ्य तय करता है: यह कहाँ रिज़ॉल्व होता है।

[Namefi](https://namefi.io) इस विचार पर बना है कि [डोमेन स्वामित्व](/hi/glossary/domain-ownership/) और नियंत्रण एक सत्यापन योग्य, इंटरनेट-नेटिव संपत्ति की तरह व्यवहार करना चाहिए, न कि रजिस्ट्रार के डेटाबेस में एक लाइन आइटम की तरह जिसे एक समझौता किया गया खाता फिर से लिख सके। टोकनाइज़्ड स्वामित्व यह प्रश्न बनाता है — "यह डोमेन कौन नियंत्रित करता है, और क्या वह नियंत्रण अभी हाथ बदला है?" — ऑडिट योग्य और छेड़छाड़-स्पष्ट, जबकि DNS के साथ संगत रहते हुए। हाईजैक के विरुद्ध बचाव केवल मज़बूत पासवर्ड नहीं है — यह अनधिकृत परिवर्तनों को *दृश्यमान और साबित करने योग्य* बनाना है न कि मूक।

Malaysia Airlines ने अपने सर्वर कभी नहीं खोए। उसने एक एकल प्रश्न का उत्तर खो दिया — *यह नाम कहाँ इंगित करता है?* — लगभग एक दिन के लिए। विमान कभी नहीं मिला। वेबसाइट भी कभी नहीं खोनी चाहिए थी। Domain Mayday का सबक यह है कि एड्रेस बुक परिधि का हिस्सा है, और जिस दिन आप यह भूल जाते हैं, उसी दिन एक शीर्ष टोपी वाली छिपकली आपके सामने के दरवाज़े में आ जाती है।

## स्रोत और आगे पढ़ें

- TechCrunch — [Malaysia Airlines Site Hacked By Lizard Squad](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/)
- The Register — [Lizard Squad threatens Malaysia Airlines with data dump](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/)
- BankInfoSecurity — [Malaysia Airlines Website Hacked](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833)
- Computerworld — [Malaysia Airlines claim DNS hijacked, site not hacked, but attackers threaten data dump](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html)
- Infosecurity Magazine — [Malaysia Airlines Site Back Up as Hackers Threaten Data Dump](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/)
- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- ABC News — [Malaysia Airlines Hit by Lizard Squad Hack Attack](https://abcnews.go.com/Technology/malaysia-airlines-hit-lizard-squad-hack-attack/story?id=28489244)
- NBC News — [Lizard Squad Claims It Hacked Malaysia Airlines Website](https://www.nbcnews.com/storyline/isis-terror/lizard-squad-claims-it-hacked-malaysia-airlines-website-n293461)
- IT Security Guru — [Lizard Squad hijacks Malaysia Airline DNS](https://www.itsecurityguru.org/2015/01/26/lizard-squad-hijacks-malaysia-airline-dns/)
- Wikipedia — [Lizard Squad](https://en.wikipedia.org/wiki/Lizard_Squad)
- Wikipedia — [Malaysia Airlines Flight 370](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370)
- Wikipedia — [Malaysia Airlines Flight 17](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17)
