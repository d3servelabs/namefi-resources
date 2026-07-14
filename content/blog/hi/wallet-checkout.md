---
title: "क्रिप्टो वॉलेट से डोमेन के लिए भुगतान करें: खाते की जरूरत नहीं"
date: '2026-07-10'
language: 'hi'
tags: ['ai-agents', 'payments']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/wallet-checkout-og.jpg
description: "Namefi का वॉलेट-हस्ताक्षरित चेकआउट AI एजेंट को बिना खाते के क्रिप्टो से डोमेन खरीदने देता है—फ्लो, सुरक्षा मॉडल और खर्च नीतियों की पूरी जानकारी।"
keywords: ["क्रिप्टो डोमेन भुगतान", "वॉलेट चेकआउट डोमेन पंजीकरण", "बिना खाते क्रिप्टो वॉलेट से डोमेन खरीदें", "USDC से डोमेन के लिए भुगतान", "AI एजेंट क्रिप्टो से डोमेन भुगतान", "x402 डोमेन पंजीकरण", "EIP-3009 transferWithAuthorization", "क्रिप्टो स्वीकार करने वाला डोमेन रजिस्ट्रार", "वॉलेट-हस्ताक्षरित चेकआउट", "Namefi x402", "एजेंटिक भुगतान", "स्टेबलकॉइन से डोमेन खरीद", "बिना खाते डोमेन पंजीकरण", "EIP-712 वॉलेट हस्ताक्षर"]
relatedArticles:
  - /hi/blog/ai-agent-register/
  - /hi/blog/claude-mcp-domains/
  - /hi/blog/cf-namecom-namefi/
  - /hi/blog/namefi-mcp/
  - /hi/blog/agent-own-domain/
relatedTopics:
  - /hi/topics/domain-tokenization/
  - /hi/topics/web3-foundations/
relatedSeries:
  - /hi/series/blockchain-concepts/
  - /hi/series/tokenize-your-com/
relatedGlossary:
  - /hi/glossary/x402/
  - /hi/glossary/wallet/
  - /hi/glossary/stablecoin/
  - /hi/glossary/private-key/
  - /hi/glossary/tokenized-domain/
---

"AI एजेंट आपके लिए डोमेन खरीद सकता है" वाली हर दूसरी चर्चा आखिरकार एक ही बाधा पर पहुँचती है: एजेंट वास्तव में भुगतान कैसे करे? क्रेडिट कार्ड मानकर चलता है कि कोई मनुष्य फ़ॉर्म में अंक भरेगा, धोखाधड़ी जाँच पूरी करेगा और फ़ोन पर भेजे गए एक बार इस्तेमाल होने वाले कोड की पुष्टि करेगा। [AI एजेंट](/hi/glossary/ai-agent/) के पास इनमें से कुछ भी नहीं होता। Namefi का उत्तर ऐसा चेकआउट मार्ग है जिसमें कार्ड, संग्रहित भुगतान विधि या Namefi खाते की बिल्कुल जरूरत नहीं—सिर्फ एक क्रिप्टो [वॉलेट](/hi/glossary/wallet/) चाहिए जो उसी समय भुगतान पर हस्ताक्षर करे। यह लेख गहराई से बताता है कि यह फ्लो वास्तव में कैसे काम करता है, हस्ताक्षर योजना एजेंट को क्या करने देती है और क्या नहीं, तथा कब API-key बिलिंग बेहतर विकल्प होती है।

## एजेंटिक कॉमर्स में भुगतान सबसे कठिन हिस्सा क्यों है

एजेंट को चीजें खरीदने देने में खोज और कीमत जाँचना कभी कठिन हिस्सा नहीं थे। ये केवल पढ़ने वाली कॉल हैं—किसी प्राधिकरण की जरूरत नहीं और एजेंट के गलती करने पर कुछ दाँव पर नहीं लगता। भुगतान अलग है, क्योंकि यही वह कदम है जहाँ गलती का अर्थ वास्तविक धन का नुकसान है, और आज व्यापक रूप से इस्तेमाल होने वाली हर भुगतान प्रणाली मानकर चलती है कि शुल्क को कोई मनुष्य अधिकृत कर रहा है।

संग्रहित कार्ड इसका सबसे स्पष्ट उदाहरण है। फ़ाइल में रखे कार्ड से बिलिंग में भुगतान प्रोसेसर को ऐसा टोकन दिया जाता है जिस पर व्यापारी के कहने से बाद में फिर शुल्क लगाया जा सकता है, उस समय कार्डधारक को कुछ दोबारा साबित किए बिना। जिस सदस्यता पर आप मासिक बिल के लिए भरोसा करते हैं, उसके लिए यह ठीक है। स्वायत्त प्रक्रिया के लिए यह कम उपयुक्त है: संग्रहित कार्ड टोकन जिसके पास है, वह उस पर शुल्क लगा सकता है, और असली बचाव केवल सॉफ़्टवेयर पर दुरुपयोग न करने का भरोसा करना या बाद में स्टेटमेंट पर दुरुपयोग पकड़ना है। एजेंट को ऐसा संग्रहित कार्ड देने का कोई तरीका नहीं जो केवल $50 तक के डोमेन पंजीकरण के लिए भुगतान करे—कार्ड को नहीं पता कि उसका उपयोग किसलिए हो रहा है।

[एजेंट-नेटिव डोमेन रजिस्ट्रार क्या है?](/hi/blog/agent-native/) इस व्यापक तर्क को समझाता है कि एजेंट के लिए उपयोगी होने में भुगतान एक आधारभूत हिस्सा है, केवल API होना पर्याप्त नहीं। Namefi का क्रिप्टो-वॉलेट चेकआउट इसी जरूरत का ठोस उत्तर है: सेवा जब चाहे शुल्क लगा सके, ऐसी संग्रहित क्रेडेंशियल के बजाय हर भुगतान एक हस्ताक्षर है जिसे वॉलेट केवल उस एक लेनदेन के लिए, उसी एक कीमत पर और किसी अन्य चीज़ के लिए नहीं बनाता।

## Namefi का उत्तर: वॉलेट-हस्ताक्षरित चेकआउट, खाता बनाए बिना

Namefi पर डोमेन पंजीकरण सामान्यतः [API key](https://namefi.io/api-key) से होता है, जिसका बिल पहले से धनयुक्त NFSC (Namefi Service Credit) बैलेंस से लिया जाता है। यह प्रक्रिया [Namefi पर अपने AI एजेंट से डोमेन कैसे पंजीकृत करें](/hi/blog/ai-agent-register/) में बताई गई है। इस मार्ग के लिए खाता चाहिए: कोई व्यक्ति वॉलेट से key बनाता है, बैलेंस में धन जोड़ता है और हर पंजीकरण पर key उसी बैलेंस से राशि घटाती है।

वॉलेट-हस्ताक्षरित मार्ग यह सब छोड़ देता है। वॉलेट भुगतान के लिए Namefi के प्रकाशित, मशीन द्वारा पढ़े जा सकने वाले दस्तावेज़ के अनुसार, एजेंट का वॉलेट [USDC](/hi/glossary/stablecoin/) में सीधे भुगतान कर सकता है और कहीं भी Namefi खाता या API key रखने की जरूरत नहीं होती—खरीदार का वॉलेट भुगतान प्राधिकरण पर हस्ताक्षर करता है और हस्ताक्षर पहुँचते ही पंजीकरण का निपटान हो जाता है। पहले से बनाने के लिए कुछ नहीं है और बाद में दुरुपयोग की जा सकने वाली कोई स्थायी अनुमति नहीं रहती: वॉलेट केवल हस्ताक्षर करने के क्षण में काम करता है।

Namefi ने ऐसे हस्ताक्षर बनाने के तीन तरीके दर्ज किए हैं, जिन्हें नीचे चरण-दर-चरण बताया गया है: [x402](/hi/glossary/x402/) प्रोटोकॉल (मुख्य मार्ग और इस गाइड का केंद्र), Machine Payable Protocol (MPP) का challenge-response रूप, और उन वॉलेट के लिए manual EIP-712 signing मार्ग जो इन दोनों शॉर्टकट में से किसी का उपयोग नहीं करते।

## x402 फ्लो, चरण-दर-चरण

x402 एक खुला मानक है, जिसे Cloudflare, AWS और Stripe समेत कई कंपनियों का समर्थन प्राप्त है। यह लंबे समय से निष्क्रिय HTTP `402 Payment Required` status code को फिर उपयोग में लाता है, ताकि सामान्य अनुरोध के भीतर ही संरचित तरीके से on-chain भुगतान माँगा जा सके और अलग checkout page पर redirect न करना पड़े। Namefi ने इसे अपने domain-registration endpoint पर लागू किया है:

1. **भुगतान के बिना अनुरोध।** एजेंट सामान्य `GET` अनुरोध Namefi के `/x402/domain/{domainName}` endpoint पर भेजता है—भुगतान संलग्न नहीं होता, क्योंकि उसे अभी कीमत नहीं पता।
2. **कीमत के साथ HTTP 402।** Namefi `402 Payment Required` भेजता है और response body में भुगतान विकल्प शामिल करता है: network, स्वीकार की जाने वाली asset (USDC) और राशि। x402 को सामान्य error से अलग बनाने वाला हिस्सा यही है—402 status केवल "नहीं" कहने के बजाय valid payment बनाने के लिए client को चाहिए सारी जानकारी देता है।
3. **वॉलेट EIP-3009 `transferWithAuthorization` पर हस्ताक्षर करता है।** अलग blockchain transaction भेजकर उसके confirm होने की प्रतीक्षा करने के बजाय, वॉलेट [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) के तहत हस्ताक्षर बनाता है। यह Ethereum मानक खास तौर पर signature-authorized token transfer के लिए बनाया गया है। EIP-3009 का `transferWithAuthorization` function token holder को ऐसा message sign करने देता है जो किसी खास amount को किसी खास recipient को transfer करने की अनुमति देता है और केवल तय time window (`validAfter` / `validBefore`) में valid होता है; फिर कोई third party इसे on-chain submit कर सकती है। Namefi के दस्तावेज़ साफ कहते हैं कि इस चरण से पहले Namefi account या EIP-712 signing की जरूरत नहीं—वॉलेट एक standalone USDC transfer authorization sign करता है, बस।
4. **भुगतान header के साथ अनुरोध दोबारा भेजें।** एजेंट मूल अनुरोध फिर भेजता है, इस बार signed authorization वाले `X-PAYMENT` header के साथ।
5. **सत्यापित करें, निपटान करें, पंजीकृत करें।** Namefi हस्ताक्षर सत्यापित करता है, domain-registration workflow शुरू करता है और भुगतान का निपटान करता है—USDC खरीदार के वॉलेट से जाता है और पंजीकरण उसी तरह आगे बढ़ता है जैसे API-key मार्ग से होता, जिसमें domain को [NFT](https://eips.ethereum.org/EIPS/eip-721)—यानी [टोकनाइज़्ड डोमेन](/hi/glossary/tokenized-domain/)—के रूप में डिफ़ॉल्ट रूप से उसी भुगतान करने वाले वॉलेट में पंजीकृत करना शामिल है।

इस क्रम में एजेंट को Namefi खाता बनाने, Namefi द्वारा बिना पूछे दोबारा इस्तेमाल की जा सकने वाली credential संग्रहित करने या भुगतान के ठीक क्षण से पहले धन की custody छोड़ने की जरूरत नहीं। हस्ताक्षर केवल यह साबित करता है कि वॉलेट ने इस खास USDC transfer को, इस amount के लिए, सीमित time window के भीतर अधिकृत किया।

## MPP challenge-response रूप

x402 मुख्य मार्ग है, लेकिन Namefi ने अलग payment pattern समझने वाले वॉलेट या agent framework के लिए दूसरा मार्ग भी दर्ज किया है: Machine Payable Protocol (MPP)। संरचना में यह x402 की उलटी छवि है—सामान्य 402 के बजाय challenge-response:

1. protected endpoint पर पहला अनुरोध फिर `402 Payment Required` लौटाता है, लेकिन इस बार सामान्य price quote के बजाय **signed challenge** देता है।
2. client, आम तौर पर signing step संभालने के लिए खास तौर पर बने Namefi के `mppx` command-line tool के जरिए, भुगतान करने वाले वॉलेट से उस challenge पर हस्ताक्षर करता है।
3. client बने हुए हस्ताक्षर को `Authorization` header में लगाकर मूल अनुरोध दोबारा भेजता है।

अंतिम प्रभाव x402 जैसा ही है—संग्रहित credential के बिना हर अनुरोध पर wallet-signed payment—लेकिन इसे सामान्य price-in-402 response के बजाय signed-challenge handshake के रूप में पैक किया गया है। एजेंट कौन सा मार्ग इस्तेमाल करे, यह उसके मौजूदा payment tooling पर निर्भर है; Namefi का endpoint दोनों समझता है।

## manual EIP-712 मार्ग

जो वॉलेट या script किसी भी shortcut का उपयोग नहीं करते, उनके लिए Namefi ने [EIP-712](https://eips.ethereum.org/EIPS/eip-712) typed-data signing पर आधारित निचले स्तर का, पूरी तरह manual signing मार्ग उपलब्ध कराया है। इसी मानक पर EIP-3009 स्वयं बना है। इस तरह signed अनुरोध में तीन header होते हैं—`x-namefi-signer` (signing wallet का address), `x-namefi-signature` (hex-encoded signature) और `x-namefi-eip712-type` (वह typed-data schema जिसके आधार पर signature बना)—और उसका payload ऐसे envelope में होता है जिसमें `payloadType`, स्वयं `payload`, `timestamp` और `nonce` होते हैं।

इस manual मार्ग पर सुरक्षा के लिए दो बातें महत्वपूर्ण हैं: **हस्ताक्षर 300 सेकंड बाद expire होते हैं और nonce केवल एक बार इस्तेमाल होते हैं।** 300 सेकंड बीत जाने या nonce इस्तेमाल करने वाला अनुरोध स्वीकार हो जाने के बाद, capture किया गया हस्ताक्षर सफलतापूर्वक replay नहीं किया जा सकता। Namefi के दस्तावेज़ यह भी बताते हैं कि live EIP-712 type definition को integration में hardcode करने के बजाय request के समय उसके `/v-next/eip712/` endpoints से fetch किया जाना चाहिए, क्योंकि हस्ताक्षर जिस exact schema से match होना चाहिए वह बदल सकता है।

Namefi ने इस तरीके से smart-contract-wallet signing भी दर्ज की है: कोई approved externally-owned account (EOA), ERC-1271 या नए EIP-7702 के तहत contract wallet की ओर से sign कर सकता है, बशर्ते contract ऐसा `approvedSigners(address)` check लागू करे जिसे API verify कर सके।<!-- TODO: confirm — how commonly this smart-contract-wallet path is used in practice versus a standard EOA wallet -->

## सुरक्षा मॉडल: एजेंट क्या कर सकता है और क्या नहीं

तंत्र की वास्तविक क्षमता से अधिक मजबूत guarantee बताने के बजाय यह स्पष्ट होना जरूरी है कि यह signature scheme वास्तव में किस चीज़ को सीमित करती है।

**यह क्या सीमित करती है।** हर मार्ग में वॉलेट को Namefi को स्थायी credential देने के बजाय मौजूदा request के लिए sign करना पड़ता है। Replay control हर protocol में अलग हैं: manual EIP-712 मार्ग 300 सेकंड बाद expire होता है और single-use nonce consume करता है; x402 किसी खास amount और recipient से बँधा EIP-3009 authorization इस्तेमाल करता है, जो `validAfter`/`validBefore` से सीमित और nonce से सुरक्षित होता है; MPP client server द्वारा जारी challenge पर sign करता है, इसलिए उसके expiry और replay control वही होते हैं जो उस challenge में दिए गए हों। वॉलेट कभी Namefi को अपने आप भविष्य में charge शुरू करने की स्थायी authority नहीं देता। इसकी तुलना stored card से करें: merchant के पास card token आने के बाद token खुद यह सीमित नहीं करता कि वह अगले महीने कितनी राशि charge करे या compromised system उसे फिर इस्तेमाल करे। इन सभी flow में वॉलेट की private key कभी वॉलेट से बाहर नहीं जाती—एजेंट वॉलेट से केवल एक खास request के लिए signature बनाने को कहता है, और कार्रवाई का पूरा scope इतना ही है।

**यह अपने आप क्या सीमित नहीं करती।** Namefi के दस्तावेज़ protocol द्वारा स्वयं लागू built-in, per-transaction dollar spend cap का वर्णन नहीं करते—protocol-specific expiry और replay control यह सीमित करते हैं कि authorization कब और कैसे दोबारा इस्तेमाल हो सकता है, यह नहीं कि कोई एक signed request कितनी राशि अधिकृत कर सकता है।<!-- TODO: confirm with team — whether Namefi's x402/MPP endpoint enforces any server-side maximum payment amount independent of what the client requests to sign --> व्यवहार में एजेंट का वास्तविक खर्च अनुशासन इस तंत्र के बाहर से आता है: आप वॉलेट में कितना USDC रखते हैं और कैसी policy layer रखते हैं—जैसे दूसरी approval माँगने वाला [मल्टी-सिग](/hi/glossary/multi-sig/) वॉलेट या एजेंट को sign करने देने से पहले human confirmation step—जिसे आप एजेंट और वॉलेट की [प्राइवेट की](/hi/glossary/private-key/) के बीच रखते हैं। [एजेंट-नेटिव डोमेन रजिस्ट्रार क्या है?](/hi/blog/agent-native/) और [Namefi पर अपने AI एजेंट से डोमेन कैसे पंजीकृत करें](/hi/blog/ai-agent-register/) guardrail के दृष्टिकोण से यही बात समझाते हैं: वॉलेट में उतनी ही राशि रखें जितनी किसी unattended process द्वारा खर्च किए जाने पर आपको स्वीकार हो, और पहले तय करें कि कहाँ human approval चाहिए।

यह संयोजन—कोई स्थायी credential नहीं, bounded per-transaction authorization और funding को practical spend limit मानना—जोखिम को card-on-file से सचमुच अलग स्वरूप देता है, न कि उसी चीज़ का केवल crypto-flavored रूप। Leak हुआ card number या compromised billing token तब तक बार-बार charge किया जा सकता है जब तक कोई उसे देख और cancel न कर दे। Capture किया गया payment authorization तब reject होता है जब उसकी अपनी protocol-specific expiry या replay condition पूरी होती है: manual EIP-712 मार्ग 300 सेकंड बाद या nonce consume हो जाने पर उसे reject करता है; x402 का EIP-3009 authorization `validAfter`/`validBefore` के बाहर या nonce इस्तेमाल हो जाने पर reject होता है; और MPP credential अपने signed challenge में encoded expiry और replay condition का पालन करता है।

## API-key या NFSC बिलिंग कब इस्तेमाल करें

वॉलेट-हस्ताक्षरित मार्ग तब सही है जब खरीद से पहले कोई खाता न होना ही मुख्य उद्देश्य हो—पूरी तरह autonomous script, shared login credential के बिना किसी और की ओर से काम करने वाला एजेंट, या केवल crypto-native wallet को पहचान के रूप में इस्तेमाल करने की पसंद। यह हर स्थिति के लिए अपने आप सही विकल्प नहीं है।

[Namefi पर अपने AI एजेंट से डोमेन कैसे पंजीकृत करें](/hi/blog/ai-agent-register/) में बताए गए अनुसार, funded NFSC balance के विरुद्ध API-key billing तब अधिक उपयोगी है जब एजेंट बार-बार डोमेन पंजीकृत करता हो और हर बार नया payment sign करने के बजाय स्थायी, जाँचा जा सकने वाला balance बेहतर हो; जब operator on-chain transfer से खर्च जोड़ने के बजाय एक dashboard में पूरा spend देखना चाहे; या जब client header value को सुरक्षित रखने का साफ तरीका रखता हो लेकिन private key रखने और उससे sign करने का आसान तरीका न हो। भुगतान settle होने के बाद दोनों मार्ग एक जैसे registration और DNS operation तक पहुँचते हैं—चुनाव authorization के काम करने के तरीके का है, बाद में आप क्या register या manage कर सकते हैं इसका नहीं।

## अक्सर पूछे जाने वाले प्रश्न

### क्या क्रिप्टो वॉलेट से भुगतान करने के लिए Namefi खाता चाहिए?
नहीं। x402 और MPP दोनों flow पहले से Namefi account या API key बनाए बिना signed wallet payment से domain registration settle करते हैं। API key केवल NFSC-balance billing मार्ग के लिए चाहिए।

### वॉलेट चेकआउट के लिए Namefi कौन सी cryptocurrency स्वीकार करता है?
USDC। Namefi का x402 endpoint खास तौर पर USDC में price quote और payment settle करता है, जिससे ETH जैसी volatile asset में price quote और payment settlement के बीच आने वाला उतार-चढ़ाव नहीं होता।

### क्या वॉलेट भुगतान पर हस्ताक्षर करना एजेंट को मेरी private key देने जैसा है?
नहीं—हस्ताक्षर वॉलेट के भीतर बनता है और private key कभी बाहर नहीं आती। एजेंट या उसके द्वारा बुलाया गया tooling वॉलेट से एक खास, bounded authorization sign करने को कहता है; key पूरे समय वॉलेट में रहती है।

### क्या कोई मेरे पुराने भुगतान हस्ताक्षर को दोबारा इस्तेमाल कर सकता है?
Capture किया गया signature तब तक usable रह सकता है जब तक उसका अपना expiry या replay control उसे reject न कर दे; तीनों मार्गों पर कोई एक universal rule लागू नहीं होता। manual EIP-712 मार्ग में signature 300 सेकंड बाद expire होते हैं और हर nonce केवल एक बार इस्तेमाल किया जा सकता है। x402 flow का EIP-3009 authorization केवल अपने `validAfter`/`validBefore` window के भीतर valid होता है और उसका nonce दो बार इस्तेमाल नहीं हो सकता। MPP signed challenge इस्तेमाल करता है, इसलिए उसकी expiry और replay condition उसी challenge में जाँची जानी चाहिए, न कि यह मानना चाहिए कि वे बाकी दोनों में से किसी एक जैसी हैं।

### क्या इस तरह भुगतान करने पर डोमेन अपने आप tokenized हो जाता है?
डिफ़ॉल्ट रूप से, हाँ—registered domain को उसी भुगतान करने वाले wallet में NFT के रूप में mint किया जाता है। API-key मार्ग भी यही tokenization behavior इस्तेमाल करता है, जब तक कोई अलग receiving wallet न दिया गया हो। Wallet-native checkout या tokenized ownership बिल्कुल न देने वाले registrar से इसकी तुलना के लिए [Cloudflare vs Name.com vs Namefi: एजेंट-नेटिव रजिस्ट्रार](/hi/blog/cf-namecom-namefi/) देखें।

### क्या वॉलेट चेकआउट संग्रहित कार्ड से भुगतान करने से अधिक सुरक्षित है?
यह जोखिम पूरी तरह खत्म करने के बजाय अलग तरह के जोखिम सीमित करता है। ऐसा कोई स्थायी credential नहीं जिसे compromised system अनिश्चित काल तक दोबारा इस्तेमाल कर सके, और हर payment के लिए नया request-level signature चाहिए। Replay control अलग हैं: manual EIP-712 में 300-second expiry और single-use nonce है; x402 का EIP-3009 authorization `validAfter`/`validBefore` और nonce इस्तेमाल करता है; MPP अपने signed challenge की condition का पालन करता है। इनमें से कोई भी control यह सीमा नहीं लगाता कि एक signed request कितनी राशि अधिकृत कर सकता है, इसलिए एजेंट के खर्च की practical ceiling अब भी इस बात से तय होती है कि आप wallet में कितना fund रखते हैं और उसके आगे कैसी अतिरिक्त approval policy, जैसे multi-sig, लगाते हैं।

## Namefi पर वॉलेट से डोमेन खरीदें

अगर एजेंट इस्तेमाल करने का उद्देश्य यह है कि एजेंट और खरीद के बीच कोई human account न हो, तो Namefi का wallet-signed checkout ठीक इसी के लिए बना है: वास्तविक ICANN-मान्यताप्राप्त domain registration, एक signed USDC authorization से भुगतान और tokenized ownership उसी भुगतान करने वाले wallet में। पूरी प्रक्रिया [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) में देखें या व्यापक setup के लिए [Namefi पर अपने AI एजेंट से डोमेन कैसे पंजीकृत करें](/hi/blog/ai-agent-register/) पढ़ें।

**[Namefi पर डोमेन खोजें और पंजीकृत करें](https://namefi.io)।**

## स्रोत और आगे पढ़ने के लिए

- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (x402 flow, MPP challenge-response रूप, manual EIP-712 signing मार्ग, signature expiry/nonce rule और ERC-1271/EIP-7702 smart-contract-wallet signing का प्राथमिक स्रोत)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (NFSC/API-key billing मार्ग और ऊपर दिए wallet-payment संदर्भ का लिंक)
- x402.org — [x402: इंटरनेट-नेटिव भुगतान मानक](https://x402.org) (खुले HTTP-402-आधारित payment protocol, जिसे Namefi का flow लागू करता है)
- Ethereum — [EIP-3009: प्राधिकरण के साथ ट्रांसफर](https://eips.ethereum.org/EIPS/eip-3009) (`transferWithAuthorization` चरण के पीछे का signature standard; `validAfter`/`validBefore` time bounding और single-use random nonce)
- Ethereum — [EIP-721: नॉन-फंजिबल टोकन मानक](https://eips.ethereum.org/EIPS/eip-721) (वह NFT standard जिस पर tokenized domain ownership बना है)
- Namefi — [Namefi पर अपने AI एजेंट से डोमेन कैसे पंजीकृत करें](/hi/blog/ai-agent-register/) (API-key/NFSC billing मार्ग और व्यापक guardrail guidance)
- Namefi — [Cloudflare vs Name.com vs Namefi: एजेंट-नेटिव रजिस्ट्रार](/hi/blog/cf-namecom-namefi/) (तीनों agent-facing registrar में wallet-native checkout की तुलना)
