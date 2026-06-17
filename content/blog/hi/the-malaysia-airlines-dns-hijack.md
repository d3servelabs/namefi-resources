---
title: 'मलेशिया एयरलाइंस DNS हाईजैक: "404 — Plane Not Found"'
date: '2026-06-17'
language: hi
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'जनवरी 2015 में, Lizard Squad ने malaysiaairlines.com के DNS को हाईजैक कर लिया और एयरलाइन की साइट को टक्सीडो पहने एक छिपकली और "404 — Plane Not Found" के ताने से बदल दिया। किसी भी सर्वर में सेंध नहीं लगाई गई थी — हमलावरों ने बस यह बदल दिया कि डोमेन कहाँ पॉइंट करता है। Domain Mayday का यह डीप-डाइव बताता है कि कैसे DNS एयरलाइन का सबसे अधिक असुरक्षित फ्रंट डोर बन गया।'
keywords: ['मलेशिया एयरलाइंस डीएनएस हाईजैक', 'lizard squad', 'cyber caliphate', '404 प्लेन नॉट फाउंड', 'डीएनएस हाईजैकिंग', 'डोमेन हाईजैकिंग', 'रजिस्ट्रार कॉम्प्रोमाइज़', 'webnic', 'malaysiaairlines.com', 'डोमेन सुरक्षा', 'डीएनएस रीडायरेक्शन', 'रजिस्ट्री लॉक', 'mh370']
---

विमान कभी नहीं मिला। और जनवरी 2015 में, वेबसाइट भी नहीं मिली।

26 जनवरी 2015 की सुबह, जिसने भी अपने ब्राउज़र में **malaysiaairlines.com** टाइप किया, वह एयरलाइन तक नहीं पहुँचा। वे एक हैकर तक पहुँचे। परिचित बुकिंग पेज गायब हो चुका था, उसकी जगह टॉप हैट और मोनोकल (एक आँख का चश्मा) पहने एक छिपकली की तस्वीर और एक अकेली, क्रूर हेडलाइन ने ले ली थी: **"404 — Plane Not Found."** इसके नीचे लिखा था: *"Hacked by Lizard Squad — Official Cyber Caliphate."* एक ब्राउज़र के टाइटल बार में बस इतना लिखा था, *"ISIS will prevail."*

यह एक कब्रिस्तान के बारे में किया गया एक भद्दा मज़ाक था। एक साल से भी कम समय पहले, मलेशिया एयरलाइंस की फ्लाइट 370 रडार से गायब हो गई थी, जिसमें 239 लोग सवार थे। उसके चार महीने बाद, यूक्रेन के ऊपर फ्लाइट 17 को आसमान में मार गिराया गया था। अब किशोरों के एक समूह ने एयरलाइन के इसी दुख को एक भद्दे मज़ाक (पंचलाइन) में बदल दिया था, जिसे एयरलाइन के ही मुख्य दरवाज़े पर परोसा गया था — और वह भी उसके सर्वर को छुए बिना।

यह आखिरी हिस्सा ही पूरी कहानी है। मलेशिया एयरलाइंस उस तरह से "हैक" नहीं हुई थी जैसा कि ज़्यादातर लोग सोचते हैं। उसके बुकिंग सिस्टम बिल्कुल सुरक्षित थे। यात्रियों का डेटा अछूता था। हमलावरों ने जिस चीज़ पर कब्ज़ा किया था वह कुछ अधिक बुनियादी और, जैसा कि बाद में पता चला, हासिल करने में कहीं अधिक आसान था: **स्वयं डोमेन नाम** — वह पता जो पूरे इंटरनेट को बताता है कि "मलेशिया एयरलाइंस" कहाँ मौजूद है।

यह एक Domain Mayday (डोमेन मेडे) केस है, जो आपके इन्फ्रास्ट्रक्चर के उस हिस्से के बारे में है जिसके बारे में आप शायद तब तक कभी नहीं सोचते, जब तक कि वह कहीं और पॉइंट न करने लगे।

## एक एयरलाइन का डोमेन ही उसकी पहचान है

एक ग्लोबल कैरियर (विमान सेवा) के लिए, वेबसाइट कोई ब्रोशर नहीं होती। यह उनका कैश रजिस्टर, चेक-इन डेस्क और कॉल सेंटर होती है, जो सभी टेक्स्ट की इस एक स्ट्रिंग से जुड़े होते हैं: `malaysiaairlines.com`।

हर बुकिंग, हर लॉयल्टी लॉगिन, हर कन्फर्मेशन ईमेल में मौजूद हर "manage my flight" लिंक उसी डोमेन के ज़रिए रिज़ॉल्व होता है। जब कुआलालंपुर या लंदन में कोई यात्री इसे टाइप करता है, तो एक अदृश्य चेन सक्रिय हो जाती है: ब्राउज़र डोमेन नेम सिस्टम (DNS) से पूछता है कि "malaysiaairlines.com कहाँ है?", DNS एक IP पते के साथ उत्तर देता है, और ब्राउज़र कनेक्ट हो जाता है। एयरलाइन का ब्रांड, उसका राजस्व और उसके ग्राहकों का भरोसा — यह सब इस एक लुकअप के *सही* उत्तर देने पर निर्भर करता है।

DNS इंटरनेट की एड्रेस बुक (पता पुस्तिका) है। और ज़्यादातर संगठनों के लिए, यह उनके भवन का सबसे कम निगरानी वाला दरवाज़ा भी है। आप अपने सर्वर को मज़बूत करने, अपने डेटाबेस को एन्क्रिप्ट करने और अपने कर्मचारियों को फ़िशिंग के खिलाफ प्रशिक्षित करने में लाखों खर्च कर सकते हैं — और इस सबका कोई मतलब नहीं रह जाता अगर कोई चुपचाप एड्रेस बुक की उस लाइन को बदल दे जो यह बताती है कि आपका नाम कहाँ पॉइंट करता है। पते को रीडायरेक्ट कर दें, और आपने बिना भवन में सेंध लगाए, पूरी कंपनी को ही रीडायरेक्ट कर दिया।

ठीक यही हुआ था।

## हाईजैक: जहाँ कभी एयरलाइन थी, वहाँ एक छिपकली

![Vivid colorful concept art of a glowing DNS signpost on a runway switched by an unseen hand, rerouting a stream of travelers away from a departure gate toward a dead-end wall stamped with a giant 404, neon teal and magenta](../../assets/the-malaysia-airlines-dns-hijack-01-hijack.jpg)

इस विरूपण (defacement) को अधिकतम क्रूरता दर्शाने के लिए तैयार किया गया था। फॉर्मल कपड़ों में एक छिपकली की तस्वीर Lizard Squad का कॉलिंग कार्ड थी; इस समूह ने पिछले दिसंबर में छुट्टियों के दौरान [Xbox Live and Sony PlayStation Network](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Hacker%20group%20Lizard%20Squad%2C%20which%20took%20down%20Xbox%20Live%20and%20the%20Sony%20PlayStation%20Network%20last%20month) को ऑफ़लाइन करने में समय बिताया था। जनवरी तक इसने खुद को "Cyber Caliphate" की छवि में ढाल लिया था, और खुद को ISIS से जुड़ा हुआ दिखाने का दिखावा कर रहा था, भले ही शोधकर्ताओं ने उनके इस दावे को गहरे संदेह की दृष्टि से देखा था।

साइट पर आने वाले लोगों ने पाया कि यह [एक टॉप हैट और मोनोकल पहने छिपकली की तस्वीर प्रदर्शित कर रही थी, साथ ही इसमें "404-Plane Not Found" टेक्स्ट लिखा था](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=The%20site%20currently%20displays%20a%20picture%20of%20a%20lizard%20in%20a%20top%20hat%20and%20monocle%2C%20as%20well%20as%20the%20text%20%27404%2DPlane%20Not%20Found%27)। समूह के बारे में विकिपीडिया का विवरण भी इसी दृश्य को दर्ज करता है: यूज़र्स को [टक्सीडो पहने एक छिपकली की तस्वीर वाले दूसरे पेज पर रीडायरेक्ट कर दिया गया था](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=Users%20were%20redirected%20to%20another%20page%20bearing%20an%20image%20of%20a%20tuxedo%2Dwearing%20lizard), और उस पेज पर [हेडलाइन थी "404 - Plane Not Found", जो स्पष्ट रूप से पिछले वर्ष एयरलाइन के विमान MH370 के खोने का संदर्भ था](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=The%20page%20also%20carried%20the%20headline%20%22404%20%2D%20Plane%20Not%20Found%22%2C%20an%20apparent%20reference%20to%20the%20airline%27s%20loss%20of%20flight%20MH370%20the%20previous%20year)।

क्रूरता ही इसका मुख्य उद्देश्य था। MH370 [8 मार्च 2014 को रडार से गायब हो गया था](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370#:~:text=disappeared%20from%20radar%20on%208%20March%202014), और अंततः उसमें सवार सभी 239 लोगों को मृत मान लिया गया, तथा उसका मलबा कभी भी निर्णायक रूप से नहीं मिला। MH17 को [17 जुलाई 2014 को रूसी समर्थित बलों द्वारा Buk 9M38 सतह से हवा में मार करने वाली मिसाइल से मार गिराया गया था](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17#:~:text=shot%20down%20by%20Russian%2Dbacked%20forces%20with%20a%20Buk%209M38%20surface%2Dto%2Dair%20missile%20on%2017%20July%202014), जिसमें सवार सभी 298 लोग मारे गए थे। एयरलाइन के होमपेज पर "Plane Not Found" की मुहर लगाना, कंपनी के इतिहास के सबसे बुरे साल को एक हथियार की तरह इस्तेमाल करने जैसा था — और इसे उस हर ग्राहक तक प्रसारित करना था जो साइट तक पहुँचने की कोशिश कर रहा था।

इसके बाद धमकी दी गई। समूह ने [ट्वीट किया कि वह "जल्द ही www.malaysiaairlines.com के सर्वर पर मिली कुछ लूट (डेटा) को डंप करेगा,"](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=Going%20to%20dump%20some%20loot%20found%20on%20www.malaysiaairlines.com%20servers%20soon) और यहाँ तक कि एक स्क्रीनशॉट भी पोस्ट किया जिसमें दावा किया गया कि यह यात्रियों के यात्रा कार्यक्रम (itineraries) को दिखाता है। तबाही के साल में पहले से ही डूब रही एक एयरलाइन के लिए, यह विचार कि उनके ग्राहकों का डेटा लीक हो गया है, अपने आप में एक अलग तरह की आपदा थी।

## यह कैसे हुआ: इमारत नहीं, बल्कि एड्रेस बुक

![Vivid colorful concept art of a futuristic switchboard operator pulling a glowing cable from the correct socket and plugging it into a fake one, streams of light-traffic diverting off a runway toward an impostor terminal, electric blues and warm orange](../../assets/the-malaysia-airlines-dns-hijack-02-dns-redirect.jpg)

यहाँ इसका तकनीकी मूल है, और यही कारण है कि यह मामला सर्वर-ब्रीच (सर्वर में सेंधमारी) की बजाय डोमेन-सुरक्षा श्रृंखला का हिस्सा है।

मलेशिया एयरलाइंस का अपना बयान, जिसे मीडिया कवरेज में बार-बार दोहराया गया, ने इस अंतर को स्पष्ट रूप से बताया: [मलेशिया एयरलाइंस पुष्टि करती है कि इसके डोमेन नेम सिस्टम (DNS) से समझौता (compromise) किया गया है, जहाँ www.malaysiaairlines.com URL दर्ज करने पर यूज़र्स को एक हैकर वेबसाइट पर रीडायरेक्ट कर दिया जाता है](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20confirms%20that%20its%20Domain%20Name%20System%20%28DNS%29%20has%20been%20compromised%20where%20users%20are%20re%2Ddirected%20to%20a%20hacker%20website)। एयरलाइन ने इस बात पर ज़ोर दिया कि उसकी [वेबसाइट हैक नहीं हुई थी और यह अस्थायी तकनीकी खराबी उनकी बुकिंग को प्रभावित नहीं करती है तथा यूज़र का डेटा सुरक्षित रहता है](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20assures%20customers%20and%20clients%20that%20its%20website%20was%20not%20hacked%20and%20this%20temporary%20glitch%20does%20not%20affect%20their%20bookings%20and%20that%20user%20data%20remains%20secured), और यह भी जोड़ा कि उसके [वेब सर्वर सुरक्षित (intact) हैं](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=Malaysia%20Airlines%27%20Web%20servers%20are%20intact)।

एक ही समय पर दोनों बातें सच थीं: साइट बर्बाद हो गई थी, *और* सर्वर बिल्कुल ठीक थे। हमलावरों को कभी सर्वर की आवश्यकता ही नहीं पड़ी। जैसा कि द रजिस्टर (The Register) ने कहा, [साइट के DNS रिकॉर्ड के साथ छेड़छाड़ की गई है ताकि इंटरनेट सर्फ करने वालों को हैकर द्वारा नियंत्रित साइट पर रीडायरेक्ट किया जा सके](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=DNS%20records%20for%20the%20site%20have%20been%20interfered%20with%20so%20that%20surfers%20are%20being%20redirected%20to%20a%20hacker%2Dcontrolled%20site)। उन्होंने एड्रेस बुक की एंट्री बदल दी थी, न कि उस इमारत को जहाँ वह पॉइंट करती थी। यहाँ तक कि उनकी दुर्भावना को मेटाडेटा में भी दर्ज किया गया था: उस समय के एक Whois चेक से पता चला कि [ISIS will prevail](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html#:~:text=ISIS%20will%20prevail) को साइट के शीर्षक के रूप में सूचीबद्ध किया गया था।

वह एड्रेस बुक कहाँ रखी गई थी? रजिस्ट्रार के पास। एयरलाइन का डोमेन [Web Commerce Communications Limited — जिसे Webnic के नाम से भी जाना जाता है — के पास पंजीकृत प्रतीत होता है, जिसके कार्यालय सिंगापुर, मलेशिया और चीन में हैं](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=registered%20with%20Web%20Commerce%20Communications%20Limited%20%2D%20a.k.a.%20Webnic%20%2D%20which%20has%20offices%20in%20Singapore%2C%20Malaysia%20and%20China)। यह नाम मायने रखता है, क्योंकि Webnic जल्द ही बदनाम होने वाला था।

एक महीने बाद, वही रजिस्ट्रार एक बहुत बड़ी घटना के केंद्र में था। जैसा कि ब्रायन क्रेब्स (Brian Krebs) ने रिपोर्ट किया, हमलावरों ने [मलेशियाई रजिस्ट्रार Webnic.cc पर कब्ज़ा कर लिया, जो इन दोनों डोमेन और 600,000 अन्य डोमेन को सेवा प्रदान करता है](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=seized%20control%20over%20Webnic.cc%2C%20the%20Malaysian%20registrar%20that%20serves%20both%20domains%20and%20600%2C000%20others), फिर **Lenovo** और **Google Vietnam** के [डोमेन नेम सिस्टम (DNS) रिकॉर्ड को बदलने के लिए Webnic.cc पर अपने एक्सेस का लाभ उठाया](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=leverage%20their%20access%20at%20Webnic.cc%20to%20alter%20the%20domain%20name%20system%20%28DNS%29%20records)। तंत्र (मैकेनिज्म), जैसा कि क्रेब्स ने रिपोर्ट किया, [एक रूटकिट अपलोड करने के लिए Webnic.cc में एक कमांड इंजेक्शन भेद्यता (vulnerability) था](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) — उस सिस्टम तक स्थायी पहुँच जो यह नियंत्रित करता है कि सैकड़ों हज़ारों डोमेन कहाँ पॉइंट करते हैं।

google.com.vn को रीडायरेक्ट करने के लिए आपको Google में सेंध लगाने की ज़रूरत नहीं है। किसी एयरलाइन के होमपेज को रीडायरेक्ट करने के लिए आपको उसमें सेंध लगाने की आवश्यकता नहीं है। आपको केवल उस लेयर (परत) को कॉम्प्रोमाइज़ करना होगा जिसके पास इस सवाल का *जवाब होता है* कि "यह डोमेन कहाँ रहता है?" — रजिस्ट्रार अकाउंट और उसके पीछे के DNS रिकॉर्ड। यह लेयर उस सुरक्षा घेरे के बाहर स्थित होती है जिसकी ज़्यादातर कंपनियाँ वास्तव में रक्षा करती हैं।

## प्रभाव और प्रतिक्रिया

एयरलाइन के लिए, नुकसान डेटा चोरी के बजाय प्रतिष्ठा और संचालन से जुड़ा था। बुक करने या चेक इन करने की कोशिश कर रहे ग्राहकों को एक विरूपित (defaced) पेज मिला। दुनिया भर की सुर्खियों ने "मलेशिया एयरलाइंस" शब्द को "हैक" के साथ जोड़ दिया — एक ब्रांड जो पहले से ही संकट में था, अब एक छिपकली के साथ जुड़ गया था जो उसके लापता विमान के बारे में ताने मार रही थी।

एयरलाइन ने इसे नियंत्रित करने के लिए वही एकमात्र तरीका अपनाया जिससे DNS हाईजैक को नियंत्रित किया जा सकता है: उस लेयर के माध्यम से काम करके जिसे कमज़ोर किया गया था। इसने कहा कि उसने [अपने सेवा प्रदाता (सर्विस प्रोवाइडर) के साथ इस मुद्दे को सुलझा लिया है](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=resolved%20the%20issue%20with%20its%20service%20provider) और [सिस्टम के 22 घंटों के भीतर पूरी तरह से रिकवर होने की उम्मीद है](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=The%20system%20is%20expected%20to%20be%20fully%20recovered%20within%2022%20hours)। यह समय-सीमा अपने आप में DNS की कार्यप्रणाली को दर्शाती है: रिकॉर्ड को ठीक करने के बाद भी, गलत उत्तर दुनिया भर के कैश (caches) में तब तक रह सकता है जब तक कि वह एक्सपायर न हो जाए। एक हाईजैक करना जितना तेज़ होता है, उसे पूरी तरह से उलटना (unwind) उतना ही धीमा होता है।

डेटा-डंप की धमकी पर, एयरलाइन अपनी बात पर कायम रही — बुकिंग अप्रभावित रही, यूज़र डेटा सुरक्षित रहा — और जिस विनाशकारी डेटा लीक के बारे में समूह ने डींगें हांकी थीं, वह कभी भी बताए गए तरीके से सामने नहीं आया। लेकिन "हमारे सिस्टम में वास्तव में कोई सेंध नहीं लगी थी, हमलावरों ने केवल दिन के एक बड़े हिस्से के लिए हमारी पूरी सार्वजनिक पहचान को नियंत्रित किया था" यात्रा करने वाली जनता के सामने रखना एक मुश्किल संदेश है। "404 — Plane Not Found" को घूरने वाले ग्राहक के लिए, सर्वर ब्रीच और DNS हाईजैक के बीच का अंतर अदृश्य होता है। साइट ही एयरलाइन थी। और एक दिन के लिए, साइट किसी और की थी।

## यह आपको अपने फ्रंट डोर (मुख्य द्वार) के रूप में DNS के बारे में क्या सिखाता है

मलेशिया एयरलाइंस का हाईजैक एक आदर्श (टेक्स्टबुक) सबक है, ठीक इसलिए क्योंकि पारंपरिक अर्थों में *किसी चीज़ में सेंध नहीं लगाई गई थी*। इसके मुख्य सबक ऑनलाइन काम करने वाले लगभग हर संगठन पर लागू होते हैं:

1. **आपका डोमेन विफलता (failure) का एक ऐसा सिंगल पॉइंट है जिसे आप अकेले नियंत्रित नहीं करते हैं।** रजिस्ट्रार के पास इस बात का मास्टर रिकॉर्ड होता है कि आपका नाम कहाँ पॉइंट करता है। यदि उनके अकाउंट की सुरक्षा — या उनका सॉफ़्टवेयर — विफल हो जाता है, तो आपके पूरी तरह से मज़बूत सर्वर अप्रासंगिक हो जाते हैं। Webnic ने एक महीने में दो बार इसे साबित किया, पहले एक एयरलाइन के साथ और फिर Google और Lenovo के साथ।

2. **एक DNS हाईजैक के लिए आपके सिस्टम में सेंध लगाने की आवश्यकता नहीं होती।** हमलावरों ने एड्रेस बुक को रीडायरेक्ट किया था, बिल्डिंग को नहीं। आपके सर्वर, आपके कोड और आपके नेटवर्क की निगरानी करने वाले सुरक्षा कवच (defenses) एक ऐसे हमले से चूक सकते हैं जो पूरी तरह से नेमिंग लेयर (naming layer) पर होता है।

3. **उन रिकॉर्ड्स को लॉक करें जो आपके नाम को स्थानांतरित कर सकते हैं।** रजिस्ट्री लॉक और रजिस्ट्रार-लेवल लॉक विशेष रूप से आपके DNS और नेमसर्वर रिकॉर्ड्स में अनधिकृत बदलावों को रोकने के लिए मौजूद हैं — वे किसी के द्वारा आपके डोमेन को रिपॉइंट करने से पहले एक मैनुअल, आउट-ऑफ़-बैंड स्टेप (अतिरिक्त सत्यापन चरण) जोड़ते हैं। उच्च-मूल्य वाले (high-value) डोमेन के लिए, ये कोई विकल्प नहीं बल्कि अनिवार्य हैं।

4. **रजिस्ट्रार पर DNSSEC और 2FA का उपयोग करें।** रजिस्ट्रार अकाउंट पर मज़बूत प्रमाणीकरण (स्ट्रॉन्ग ऑथेंटिकेशन) और ज़ोन पर DNSSEC साइनिंग ठीक उसी प्रकार के साइलेंट रिकॉर्ड-स्वैप (चुपचाप रिकॉर्ड बदलने) की लागत और कठिनाई को बढ़ा देते हैं, जिसने मलेशिया एयरलाइंस की वेबसाइट को विरूपित किया था।

5. **रिकवरी हमले से धीमी होती है।** TTLs और ग्लोबल कैश (caches) का मतलब है कि एक हाईजैक अपने फिक्स (समाधान) के लागू होने के बाद भी कुछ समय तक जीवित रहता है। केवल पैच के लिए ही नहीं, बल्कि क्लीनअप विंडो के लिए भी योजना बनाएँ।

इसका असहज कर देने वाला सारांश: ज़्यादातर कंपनियाँ इमारत की सुरक्षा करती हैं और सामने वाले दरवाज़े पर एक स्टिकी नोट छोड़ देती हैं जो हर किसी को यह बताता है कि किस इमारत में जाना है। उस नोट को बदल दें, और समझो आपने पूरी कंपनी को ही दूसरी जगह स्थानांतरित कर दिया।

## Namefi का दृष्टिकोण (The Namefi Angle)

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-malaysia-airlines-dns-hijack-03-namefi-angle.jpg)

मलेशिया एयरलाइंस का हाईजैक, मूल रूप से, इस सवाल पर आधारित है कि *एक नाम जहाँ पॉइंट करता है, उसे बदलने की अनुमति किसे है* — और रजिस्ट्रार लेयर पर उस अधिकार को कितनी आसानी से और चुपचाप चुराया जा सकता है। इस हमले ने किसी क्रिप्टोग्राफी को नहीं हराया या किसी डेटाबेस को क्रैक नहीं किया। इसने उस कमज़ोर, अकाउंट-आधारित कंट्रोल प्लेन को हरा दिया जो किसी डोमेन के बारे में सबसे महत्वपूर्ण तथ्य तय करता है: कि यह कहाँ रिज़ॉल्व होता है।

[Namefi](https://namefi.io) इस विचार पर बनाया गया है कि डोमेन का स्वामित्व और नियंत्रण एक सत्यापन योग्य (verifiable), इंटरनेट-नेटिव एसेट (संपत्ति) की तरह व्यवहार करना चाहिए, न कि किसी रजिस्ट्रार के डेटाबेस में एक लाइन आइटम की तरह जिसे एक कॉम्प्रोमाइज़ हुआ अकाउंट फिर से लिख सकता है। टोकनाइज़्ड ओनरशिप (Tokenized ownership) इस सवाल को कि "इस डोमेन को कौन नियंत्रित करता है, और क्या यह नियंत्रण अभी-अभी बदला है?" ऑडिट-योग्य (auditable) और छेड़छाड़-प्रतिरोधी (tamper-evident) बनाता है, जबकि यह DNS के अनुकूल भी रहता है। किसी हाईजैक से बचाव केवल मज़बूत पासवर्ड रखना नहीं है — यह अनधिकृत परिवर्तनों को छिपाकर (silent) रखने के बजाय *दृश्यमान (visible) और प्रामाणिक (provable)* बनाना है।

मलेशिया एयरलाइंस ने कभी अपने सर्वर नहीं खोए। उसने लगभग एक दिन के लिए केवल एक ही सवाल का जवाब खोया था — *यह नाम कहाँ पॉइंट करता है?* वह विमान कभी नहीं मिला। यह वेबसाइट भी कभी नहीं खोनी चाहिए थी। Domain Mayday का सबक यह है कि एड्रेस बुक आपके सुरक्षा घेरे (perimeter) का ही एक हिस्सा है, और जिस दिन आप यह भूल जाते हैं, उसी दिन एक टॉप हैट पहने छिपकली आपके मुख्य दरवाज़े पर कब्ज़ा कर लेती है।

## स्रोत और आगे पढ़ने के लिए

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