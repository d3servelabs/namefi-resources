---
title: "एजेंट भुगतान क्या है, और हर कंपनी इसे उपलब्ध कराने की होड़ में क्यों है?"
date: '2026-08-13'
language: 'hi'
tags: ['ai-agents', 'payments', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['nirmit-buddhiraja']
draft: false
format: explainer
ogImage: ../../assets/what-is-agent-payment-og.jpg
description: "एजेंट भुगतान AI एजेंट को सीमित दायरे वाली, वापस ली जा सकने वाली अनुमति के साथ खर्च करने देता है—Stripe के एजेंट्स के लिए Link वॉलेट, Mercury के एजेंट कार्ड, और 2025–26 की होड़ के भीतर की पूरी जानकारी।"
keywords: ["एजेंट भुगतान क्या है", "एजेंट भुगतान की व्याख्या", "एजेंटिक कॉमर्स", "एजेंट्स के लिए Stripe Link वॉलेट", "एजेंट्स के लिए Stripe Issuing", "Mercury एजेंट कार्ड", "Mercury स्पेंड मैनेजमेंट", "Agentic Commerce Protocol", "Google का AP2 प्रोटोकॉल", "Mastercard Agent Pay", "Visa Intelligent Commerce", "AI एजेंट के लिए एक बार इस्तेमाल होने वाला कार्ड", "Shared Payment Token", "AI एजेंट खर्च सीमाएं", "x402 एजेंट भुगतान"]
relatedArticles:
  - /hi/blog/wallet-checkout/
  - /hi/blog/agents-buy-domains/
  - /hi/blog/state-of-agentic/
  - /hi/blog/agent-native/
  - /hi/blog/ai-agent-register/
relatedTopics:
  - /hi/topics/web3-foundations/
  - /hi/topics/domain-tokenization/
relatedSeries:
  - /hi/series/blockchain-concepts/
  - /hi/series/domain-apocalypse/
relatedGlossary:
  - /hi/glossary/ai-agent/
  - /hi/glossary/x402/
  - /hi/glossary/stablecoin/
  - /hi/glossary/wallet/
  - /hi/glossary/tokenized-domain/
---

सोलह महीनों के भीतर, दोनों प्रमुख कार्ड नेटवर्क, Google, OpenAI और Stripe—इन सभी ने एक ही चीज़ के लिए इंफ्रास्ट्रक्चर घोषित किया है या तैयार करके भेजा है: किसी [AI एजेंट](/hi/glossary/ai-agent/) को पैसा खर्च करने देना। Mastercard ने 29 अप्रैल, 2025 को [Agent Pay की घोषणा की](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens)। Visa ने अगले दिन [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=browse%2C%20select%2C%20purchase%20and%20manage%20on%20their%20behalf) पेश किया। Google ने सितंबर 2025 में 60 से अधिक पार्टनर संगठनों के साथ अपना [Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption) प्रकाशित किया। उसी महीने, OpenAI ने [ChatGPT के भीतर Instant Checkout](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe) चालू किया। और अप्रैल 2026 में, Stripe ने [Link का एजेंट्स के लिए वॉलेट](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials) लॉन्च किया—एक कंज्यूमर वॉलेट जिसे कोई एजेंट एक बार में एक खरीद के लिए उधार ले सकता है। यहाँ तक कि Mercury, एक बिज़नेस बैंकिंग प्लेटफ़ॉर्म, अब अपनी [स्पेंड-मैनेजमेंट पिच](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents) को "टीमों **और एजेंट्स** के लिए कार्ड" के साथ आगे बढ़ाता है।

यह लेख बताता है कि "एजेंट भुगतान" असल में क्या है, दो सिखाने लायक कार्यान्वयनों—Stripe के कंज्यूमर-साइड वॉलेट और Mercury के बिज़नेस-साइड एजेंट कार्ड—से होकर गुज़रता है, और फिर यह देखता है कि इतनी सारी कंपनियों ने लगभग एक साथ यह क्यों तय किया कि वे इस मामले में किनारे बैठकर तमाशा नहीं देख सकतीं।

## "एजेंट भुगतान" का असली मतलब

एजेंट भुगतान वह इंफ्रास्ट्रक्चर है जो किसी सॉफ़्टवेयर एजेंट को किसी व्यक्ति या कंपनी की ओर से पैसा खर्च करने देता है—ऐसी अनुमति के साथ जो **सीमित दायरे वाली** (इतनी राशि, इस व्यापारी के पास, इस उद्देश्य के लिए), **साबित करने योग्य** (व्यापारी बता सकता है कि एजेंट वास्तव में अधिकृत था), और **वापस ली जा सकने वाली** (मालिक इसे बंद कर सकता है) हो, न कि एजेंट को कच्चा कार्ड नंबर सौंप देने जैसा भोंडा तरीका।

असली बात यही आख़िरी हिस्सा है। आपको अपना Visa नंबर किसी bot की config file में पेस्ट करने से कभी किसी ने नहीं रोका। ज़्यादातर लोगों को जो चीज़ रोकती है वह यह है कि कार्ड नंबर असीमित अनुमति है: जिसके पास भी यह हो, वह तब तक कहीं भी, कुछ भी चार्ज कर सकता है जब तक आप ध्यान न दें और कार्ड रद्द न करें। Google की AP2 घोषणा अंतर्निहित समस्या को साफ़-साफ़ बताती है: आज की भुगतान प्रणालियां आमतौर पर ["मान लेती हैं कि कोई मनुष्य किसी भरोसेमंद सतह पर सीधे 'buy' पर क्लिक कर रहा है"](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=assume%20a%20human%20is%20directly%20clicking), और भुगतान शुरू करने वाला कोई स्वायत्त एजेंट ["इस बुनियादी धारणा को तोड़ देता है"](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption)। AP2 इस अंतर को तीन सवालों के रूप में बताता है जिनका जवाब हर एजेंट लेनदेन को देना चाहिए: **प्राधिकरण** (क्या उपयोगकर्ता ने एजेंट को *इस* खरीद के लिए अनुमति दी?), **प्रामाणिकता** (क्या एजेंट का अनुरोध उपयोगकर्ता के असली इरादे को दर्शाता है?), और **जवाबदेही** (कुछ गलत होने पर नुकसान कौन उठाएगा?)।

इस क्षेत्र का हर प्रोडक्ट—कार्ड-नेटवर्क टोकन प्रोग्राम, ओपन प्रोटोकॉल, वॉलेट, एजेंट कार्ड—इन तीनों सवालों का इतना अच्छा जवाब देने की कोशिश है कि किसी एजेंट को पैसा खर्च करने देना एक सामान्य, उबाऊ काम बन जाए।

## Stripe: एक वॉलेट जिसे आपका एजेंट एक बार में एक खरीद के लिए उधार ले सकता है

Stripe की एंट्री, जिसकी [29 अप्रैल, 2026 को घोषणा हुई](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching), है **Link का एजेंट्स के लिए वॉलेट**, जो एक नई **एजेंट्स के लिए Issuing** लेयर के ऊपर बना है। Link, Stripe का कंज्यूमर वॉलेट है—वह "तेज़ चेकआउट के लिए मेरी जानकारी सेव करें" वाला प्रोडक्ट—जिसका ग्राहक आधार Stripe [20 करोड़ से अधिक कंज्यूमर](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers) बताता है। एजेंट फ्लो इस तरह काम करता है:

1. कंज्यूमर एक मानक OAuth फ्लो के जरिए एजेंट को अपने Link वॉलेट तक पहुंच देता है—वही सहमति पैटर्न जो किसी भी थर्ड-पार्टी ऐप को कनेक्ट करने में इस्तेमाल होता है।
2. जब एजेंट कुछ खरीदना चाहता है, तो वह संदर्भ ले जाने वाला एक **खर्च अनुरोध** बनाता है: व्यापारी का नाम, URL, राशि, और यह क्या और क्यों खरीद रहा है इसका मनुष्य-पठनीय विवरण।
3. कंज्यूमर वेब पर या Link के मोबाइल ऐप में अनुरोध की समीक्षा करता है और उसे मंज़ूर करता है। आज, कोई भी क्रेडेंशियल शेयर होने से पहले [हर अनुरोध की व्यक्ति द्वारा समीक्षा जरूरी है](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=each%20request%20requires%20the%20person%E2%80%99s%20review); Stripe कहता है कि खर्च सीमाएं और पहले से मंज़ूर स्वायत्तता आगे योजनाबद्ध हैं।
4. मंज़ूरी मिलने पर, एजेंट को या तो **एक बार इस्तेमाल होने वाला कार्ड** मिलता है या **Shared Payment Token (SPT)**—एक क्रेडेंशियल जिसे [राशि, मुद्रा और व्यापारी जैसे नियंत्रणों से सीमित दायरे में रखा जा सकता है](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=scoped%20with%20controls%20like%20amount%2C%20currency%2C%20and%20merchant)। जैसा Stripe कहता है: ["एजेंट को कभी आपकी असली भुगतान क्रेडेंशियल तक पहुंच नहीं मिलती।"](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)

यह डिज़ाइन ध्यान से पढ़ने लायक है क्योंकि यह फ़ाइल-में-रखे-कार्ड मॉडल को उल्टा कर देता है। संग्रहित कार्ड एक स्थायी अनुमति है जिसे व्यापारी (या एजेंट) बार-बार इस्तेमाल कर सकता है, और इसकी सीमा क्रेडेंशियल में ही नहीं बल्कि बाद में लागू होने वाले समझौतों में तय होती है; खर्च अनुरोध अनुमति का एक अकेला अनुदान है, जो खरीद के ठीक क्षण में बनता है, उसी खरीद तक सीमित रहता है, और उसके बाद खत्म हो जाता है। Stripe नीचे की लेयर—एजेंट्स के लिए Issuing—भी उजागर करता है, ताकि बिज़नेस अपने खुद के एजेंटिक वॉलेट बना सकें: एक बार इस्तेमाल होने वाले वर्चुअल कार्ड, फंड स्टोरेज, कार्ड-स्तर की अनुमतियां, ट्रांजेक्शन मॉनिटरिंग, और प्राधिकरण के समय फ्रॉड नियंत्रण।

## Mercury: कॉर्पोरेट कार्ड और एजेंट का मिलन

Stripe का वॉलेट कंज्यूमर वाले सवाल का जवाब देता है—*मैं किसी शॉपिंग एजेंट को अपने पैसे से चीज़ें खरीदने कैसे दूं?* Mercury का [स्पेंड मैनेजमेंट](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents) इसका बिज़नेस वर्शन का जवाब देता है, और उसका जवाब खुलासा करने वाला है: एजेंट को कर्मचारियों जैसा समझो।

Mercury इस प्रोडक्ट को ["इंटेलिजेंट बजट, एम्प्लॉई रीइम्बर्समेंट, और टीमों तथा एजेंट्स के लिए कार्ड के साथ खुद-ब-खुद लागू होने वाला एक्सपेंस मैनेजमेंट"](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents) बताता है। इसकी मशीनरी वही जानी-पहचानी स्पेंड-मैनेजमेंट टूलकिट है—[विशेष उद्देश्यों तक सीमित बजट और गार्डरेल्स](https://mercury.com/spend-management#:~:text=Set%20up%20budgets%20and%20guardrails%20to%20unblock%20your%20team%20and%20agents), प्रति-श्रेणी सीमाएं, रीयल-टाइम ट्रैकिंग, ऐसी नीतियां जो खुद लागू होती हैं—जिसे गैर-मानव खर्च करने वालों तक बढ़ाया गया है: बिज़नेस [मंज़ूर लेनदेन के लिए समर्पित एजेंट कार्ड जारी](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions) कर सकते हैं, हर एक की अपनी सीमा के साथ।

पेज इसका डेमो भी दिखाता है: एक एजेंट "Jane के एजेंट कार्ड" से चेकआउट फ़ॉर्म भरता है, $100 का एक विज्ञापन ऑर्डर देता है, और वापस रिपोर्ट करता है कि कार्ड की $1,000-प्रति-माह की खर्च सीमा है और कार्ड की जानकारी सिर्फ़ उस चेकआउट के लिए इस्तेमाल हुई—कभी संग्रहित नहीं हुई। Mercury Spend सभी Mercury बिज़नेस बैंकिंग ग्राहकों के लिए [शामिल है](https://mercury.com/spend-management#:~:text=included%20for%20all%20Mercury%20business%20banking%20customers), और जो टीमें कहीं और बैंकिंग करती हैं उनके लिए एक स्टैंडअलोन वर्शन की योजना है।

फीचर लिस्ट से ज़्यादा मायने यह फ्रेमिंग रखती है। किसी बिज़नेस के लिए, पैसा खर्च करने वाला एजेंट कोई अनोखी नई भुगतान समस्या नहीं है—वह हेडकाउंट है। उसे एक कार्ड, एक बजट, एक उद्देश्य, एक मासिक सीमा और एक ऑडिट ट्रेल मिलता है—बिल्कुल वैसे ही जैसे फाइनेंस सिस्टम में किसी नए कर्मचारी को मिलता है। जहां Stripe ने कंज्यूमर के लिए सहमति लूप बनाया, वहीं Mercury ने सॉफ़्टवेयर के लिए ऑर्ग-चार्ट में एक जगह बनाई।

## सोलह महीनों की घोषणाएं

इस टाइमलाइन को एक जगह रखें तो यह होड़ नज़रअंदाज़ करना मुश्किल है:

| तारीख़ | कंपनी | क्या घोषित किया गया |
|---|---|---|
| 29 अप्रैल, 2025 | Mastercard | [Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens): Agentic Tokens; लेनदेन के लिए एजेंट्स का [रजिस्टर्ड और वेरिफाइड](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=trusted%20AI%20agents%20to%20be%20registered%20and%20verified) होना ज़रूरी |
| 30 अप्रैल, 2025 | Visa | [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users): टोकनाइज़्ड क्रेडेंशियल के जरिए Visa के नेटवर्क को AI एजेंट्स के लिए खोलना |
| 16 सितंबर, 2025 | Google | [Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption): Amex से Coinbase से PayPal तक 60+ पार्टनर वाला एक ओपन प्रोटोकॉल |
| 29 सितंबर, 2025 | OpenAI + Stripe | [ChatGPT में Instant Checkout](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe), जो ओपन-सोर्स किए गए Agentic Commerce Protocol (ACP) से संचालित है |
| 15 जनवरी, 2026 | Google | [Universal Commerce Protocol (UCP)](/hi/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/): एक ओपन कॉमर्स-इंटरऑपरेबिलिटी स्टैंडर्ड जो AP2 के साथ मिलकर काम करने के लिए डिज़ाइन किया गया है |
| 29 अप्रैल, 2026 | Stripe | [Link का एजेंट्स के लिए वॉलेट + एजेंट्स के लिए Issuing](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching): एजेंट खर्च के लिए कंज्यूमर वॉलेट एक्सेस और इशूइंग प्रिमिटिव |
| 2026 | Mercury | [एजेंट कार्ड के साथ स्पेंड मैनेजमेंट](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions): एजेंट्स के लिए बजट, गार्डरेल्स और समर्पित कार्ड |

यह भगदड़ क्यों? तीन ताकतें, और यह हिस्सा घोषणाओं में सीधे कही गई किसी बात के बजाय व्याख्या है:

**खरीदार आगे बढ़ रहा है, और वॉलेट उसके साथ आगे बढ़ना चाहता है।** OpenAI बताता है कि [70 करोड़ से अधिक लोग हर हफ़्ते ChatGPT का रुख करते हैं](https://openai.com/index/buy-it-in-chatgpt/#:~:text=More%20than%20700%20million%20people%20turn%20to%20ChatGPT%20each%20week), और अब यह चैट के भीतर ही खरीद संभालता है। अगर खोज और चेकआउट दोनों किसी एजेंट बातचीत के भीतर होते हैं, तो जो भी एजेंट का वॉलेट देता है वह हर व्यापारी और हर ग्राहक के बीच बैठ जाता है। डेवलपर्स के लिए Stripe की पिच इस इनाम के बारे में साफ़ है—Link पर बनाएं और इसके [20 करोड़ कंज्यूमर के आधार तक पहुंचें](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers)। भुगतान कंपनियों ने दो दशक तक सर्च और सोशल को कॉमर्स के बीचोंबीच आते देखा है; इनमें से कोई भी किनारे बैठकर एजेंट्स को यह करते देखना नहीं चाहती।

**असीमित क्रेडेंशियल ऑटोमेशन के संपर्क में टिक नहीं पाते।** खास तौर पर बनाई गई रेल्स के बिना, लोग एजेंट्स को संग्रहित कार्ड और शेयर्ड लॉगिन थमा देते हैं—बिना किसी सीमा वाली स्थायी अनुमति, ठीक वही पैटर्न जिसे पकड़ने के लिए फ्रॉड सिस्टम बने हैं। Visa के प्रोडक्ट चीफ़ ने इस ज़रूरत को उपयोगकर्ताओं से आगे बढ़े हुए भरोसे के रूप में बताया: एजेंट्स को ["न सिर्फ़ उपयोगकर्ताओं द्वारा, बल्कि बैंकों और विक्रेताओं द्वारा भी भुगतान में भरोसेमंद माना जाना होगा"](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users)। जो नेटवर्क किसी अधिकृत एजेंट को कार्ड-टेस्टिंग बॉट से अलग बता सकते हैं, वे ज़्यादा अच्छे लेनदेन मंज़ूर कर सकते हैं और ज़्यादा ख़राब लेनदेन रोक सकते हैं; जो नहीं बता सकते, वे दोनों काम बुरी तरह करेंगे।

**प्रोटोकॉल एक ज़मीन हथियाने की दौड़ हैं।** ACP, AP2, Mastercard के Agentic Tokens, और Visa के टोकनाइज़्ड क्रेडेंशियल—ये सभी मशीन खरीद की डिफ़ॉल्ट व्याकरण बनना चाहते हैं। ओपन स्टैंडर्ड आमतौर पर अपनाए जाने लायक होकर ये दौड़ जीतते हैं—यही वजह है कि OpenAI ने [ACP को ओपन-सोर्स किया](https://openai.com/index/buy-it-in-chatgpt/#:~:text=Agentic%20Commerce%20Protocol%2C%20so%20that%20more%20merchants%20and%20developers%20can%20begin%20building) और Google ने AP2 के लिए 60 लॉन्च पार्टनर जुटाए, फिर जनवरी 2026 में भुगतान के इर्द-गिर्द शॉपिंग वर्कफ़्लो को मानकीकृत करने के लिए [Universal Commerce Protocol](/hi/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/) के साथ आगे बढ़े। कोई भी हारने वाले स्टैंडर्ड को दो बार इंटीग्रेट नहीं करना चाहता।

## एक डिज़ाइन पैटर्न, कई लोगो

ब्रांडिंग हटा दें तो हर गंभीर एजेंट-भुगतान प्रोडक्ट एक जैसी चार खासियतों पर आकर मिलता है:

1. **असली क्रेडेंशियल कभी उजागर न करें।** एक बार इस्तेमाल होने वाले कार्ड (Stripe), Shared Payment Tokens (Stripe/ACP), Agentic Tokens (Mastercard), टोकनाइज़्ड क्रेडेंशियल (Visa)। एजेंट आपका PAN नहीं, बल्कि खास तौर पर बनाया गया इंस्ट्रूमेंट साथ रखता है।
2. **अनुमति को सीमित दायरे में रखें।** क्रेडेंशियल पर ही राशि, मुद्रा, व्यापारी और समय की सीमाएं—OpenAI का वर्शन: [एन्क्रिप्टेड भुगतान टोकन "केवल विशेष राशियों और विशेष व्यापारियों के लिए अधिकृत"](https://openai.com/index/buy-it-in-chatgpt/#:~:text=encrypted%20payment%20tokens%20are%20only%20authorized%20for%20specific%20amounts%20and%20specific%20merchants) होते हैं।
3. **अभी के लिए मंज़ूरी के लूप में इंसान को बनाए रखें।** Stripe आज हर अनुरोध की समीक्षा ज़रूरी बनाता है; Mercury के बजट किसी इंसान द्वारा तय सीमाओं के भीतर खर्च को पहले से अधिकृत करते हैं। स्वायत्तता का डायल हिलता है, लेकिन शुरू लगभग शून्य से होता है।
4. **एजेंट के खर्च को पढ़ने लायक बनाएं।** रजिस्टर्ड एजेंट्स (Mastercard), खर्च-अनुरोध संदर्भ स्ट्रिंग्स (Stripe), रीयल-टाइम ट्रैकिंग और रसीद-नहीं-तो-कार्ड-लॉक एनफ़ोर्समेंट (Mercury)। हर लेनदेन को इस सवाल का जवाब देना चाहिए: "कौन-सा एजेंट, किसकी अनुमति से, किसलिए?"

अगर ये खासियतें क्रिप्टो-नेटिव पाठकों को जानी-पहचानी लगें, तो ठीक ही लगेंगी। [x402](/hi/glossary/x402/) की एग्ज़ैक्ट-पेमेंट स्कीम के तहत हस्ताक्षर से अधिकृत [स्टेबलकॉइन](/hi/glossary/stablecoin/) ट्रांसफर—एक सटीक राशि, एक सटीक प्राप्तकर्ता को, केवल एक समय-सीमा में वैध, खरीद के ठीक क्षण में भुगतानकर्ता के अपने [वॉलेट](/hi/glossary/wallet/) से हस्ताक्षरित—वही डिज़ाइन है जिस पर दूसरी दिशा से पहुंचा गया है, जहां सीमित दायरा किसी इशूअर के पॉलिसी इंजन के बजाय क्रिप्टोग्राफी से लागू होता है। Stripe खुद स्टेबलकॉइन को एजेंट वॉलेट के लिए आने वाले भुगतान तरीके के रूप में सूचीबद्ध करता है। कार्ड की दुनिया और क्रिप्टो की दुनिया एक ही जवाब पर मिल रही हैं: *प्रति-लेनदेन अनुमति, फ़ाइल में रखी अनुमति नहीं।*

## डोमेन इसमें कहाँ फिट होते हैं

डोमेन उन शुरुआती चीज़ों में से एक साबित हो रहे हैं जिन्हें एजेंट खुद खरीदते हैं—ये शुद्ध API ऑब्जेक्ट हैं, किसी शिपिंग एड्रेस की ज़रूरत नहीं, और हर डिप्लॉय किए गए एजेंट प्रोडक्ट को आख़िरकार एक ऐसे नाम की ज़रूरत होती है जिस पर उसका नियंत्रण हो। हमने [एजेंट बिना किसी इंसान के डोमेन कैसे खरीदते हैं](/hi/blog/agents-buy-domains/), [एजेंट-नेटिव रजिस्ट्रार कैसा दिखता है](/hi/blog/agent-native/), और [Namefi पर कोई एजेंट डोमेन कैसे रजिस्टर करता है](/hi/blog/ai-agent-register/) चरण-दर-चरण, इस बारे में लिखा है।

भुगतान वाले सवाल का Namefi का अपना जवाब वह वॉलेट-हस्ताक्षरित चेकआउट है जिसे [क्रिप्टो वॉलेट से डोमेन के लिए भुगतान करें: खाते की जरूरत नहीं](/hi/blog/wallet-checkout/) में गहराई से बताया गया है: किसी एजेंट का वॉलेट एक सटीक पंजीकरण के लिए, एक सटीक कीमत पर USDC ट्रांसफर प्राधिकरण पर हस्ताक्षर करके x402 चैलेंज का जवाब देता है—बिना कहीं किसी खाते या संग्रहित क्रेडेंशियल के—और डोमेन को उसी वॉलेट में एक [टोकनाइज़्ड डोमेन](/hi/glossary/tokenized-domain/) के रूप में प्राप्त करता है। यह ठीक उसी अर्थ में एजेंट भुगतान है जो यह लेख अब तक बताता आया है, जो आज एक असली प्रोडक्ट पर लाइव है, उस चीज़ के लिए जिसे एजेंट सबसे अनुमानित रूप से खरीदने वाले हैं।

आख़िरकार, एजेंट भुगतान उपलब्ध कराने की यह होड़ भरोसेमंद बनने की होड़ है। 20 करोड़ से अधिक Link कंज्यूमर, 70 करोड़ से अधिक साप्ताहिक ChatGPT उपयोगकर्ता, और हर कॉर्पोरेट कार्ड प्रोग्राम—सभी एक ही दांव पर आकर मिल रहे हैं: अगला एक अरब खरीदार सभी इंसान नहीं होंगे, और जो इंफ्रास्ट्रक्चर उनके सॉफ़्टवेयर को सुरक्षित, सीमित दायरे वाली, जवाबदेह खर्च करने की अनुमति देगा, वह कॉमर्स के पिछले युग के लिए कार्ड नेटवर्क जितना ही बुनियादी होगा।

## स्रोत और आगे पढ़ने के लिए

- Stripe — [एजेंट्स को भुगतान करने की क्षमता देना](https://stripe.com/blog/giving-agents-the-ability-to-pay) (Link का एजेंट्स के लिए वॉलेट + एजेंट्स के लिए Issuing, 29 अप्रैल, 2026)
- Mercury — [स्पेंड मैनेजमेंट](https://mercury.com/spend-management) (बजट, गार्डरेल्स, और समर्पित एजेंट कार्ड)
- Google Cloud — [Agent Payments Protocol (AP2) की घोषणा](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol) (16 सितंबर, 2025)
- OpenAI — [Buy it in ChatGPT: Instant Checkout और Agentic Commerce Protocol](https://openai.com/index/buy-it-in-chatgpt/) (29 सितंबर, 2025)
- Mastercard — [Mastercard ने Agent Pay पेश किया](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html) (29 अप्रैल, 2025)
- Visa — [AI से खोजें और खरीदें: Visa ने कॉमर्स के नए युग का ऐलान किया](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html) (Visa Intelligent Commerce, 30 अप्रैल, 2025)
- Namefi — [क्रिप्टो वॉलेट से डोमेन के लिए भुगतान करें: खाते की जरूरत नहीं](/hi/blog/wallet-checkout/) (x402 वॉलेट-हस्ताक्षरित चेकआउट)
