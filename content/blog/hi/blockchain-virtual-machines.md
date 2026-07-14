---
title: "प्रमुख ब्लॉकचेन वर्चुअल मशीनें: EVM, SVM, MoveVM, WebAssembly/RISC-V और CairoVM"
date: '2026-07-02'
language: hi
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 30
format: roundup
description: प्रमुख ब्लॉकचेन वर्चुअल मशीनों—EVM, SVM, MoveVM, WebAssembly और RISC-V VM, तथा CairoVM—की गाइड, जिसमें उनकी भाषाओं, निष्पादन मॉडलों और इकोसिस्टम की तुलना की गई है।
ogImage: ../../assets/blockchain-virtual-machines-og.jpg
keywords: ['ब्लॉकचेन वर्चुअल मशीन', 'ब्लॉकचेन वर्चुअल मशीनें', 'evm', 'एथेरियम वर्चुअल मशीन', 'svm', 'सोलाना वर्चुअल मशीन', 'sealevel', 'movevm', 'move भाषा', 'wasm ब्लॉकचेन', 'cosmwasm', 'polkavm', 'cairovm', 'cairo भाषा', 'starknet', 'स्मार्ट कॉन्ट्रैक्ट भाषा', 'समानांतर निष्पादन ब्लॉकचेन', 'evm संगत', 'ब्लॉकचेन निष्पादन परिवेश', 'ब्लॉकचेन स्टेट मशीन']
relatedArticles:
  - /hi/blog/blockchain-consensus-mechanisms/
  - /hi/blog/blockchain-scaling-approaches/
  - /hi/blog/blockchain-cryptographic-primitives/
  - /hi/blog/blockchain-privacy-technologies/
  - /hi/blog/what-are-tokenized-domains/
relatedTopics:
  - /hi/topics/web3-foundations/
  - /hi/topics/domain-tokenization/
relatedSeries:
  - /hi/series/tokenize-your-com/
  - /hi/series/domain-flipping-skills/
relatedGlossary:
  - /hi/glossary/ethereum-virtual-machine/
  - /hi/glossary/webassembly/
  - /hi/glossary/smart-contract/
  - /hi/glossary/ethereum/
  - /hi/glossary/gas/
---

हर [स्मार्ट कॉन्ट्रैक्ट](/hi/glossary/smart-contract/) को कहीं न कहीं चलना होता है। वह "कहीं" एक ब्लॉकचेन वर्चुअल मशीन (VM) है—एक सैंडबॉक्स्ड प्रोग्राम, जिसे नेटवर्क का हर नोड बिल्कुल एक जैसे तरीके से चलाता है, ताकि समान इनपुट से हमेशा समान आउटपुट मिले, चाहे उसे कोई भी चलाए। आप जिस VM पर निर्माण करते हैं, वह किसी चेन के लगभग हर पहलू को आकार देती है: आप किन भाषाओं में लिख सकते हैं, ट्रांज़ैक्शन एक साथ चल सकते हैं या एक के बाद एक, और पहले दिन से मौजूदा डेवलपर इकोसिस्टम का कितना हिस्सा इस्तेमाल कर सकते हैं।

यह गाइड उन पाँच VM परिवारों को समझाती है जो मिलकर आज [Web3](/hi/glossary/web3/) की स्मार्ट कॉन्ट्रैक्ट गतिविधि का काफ़ी बड़ा हिस्सा चलाते हैं: [Ethereum Virtual Machine](/hi/glossary/ethereum-virtual-machine/) (EVM), Solana की SVM, Aptos और Sui में इस्तेमाल होने वाली MoveVM, [WebAssembly](/hi/glossary/webassembly/) या RISC-V पर बनी पोर्टेबल-बाइटकोड VM—जैसे CosmWasm और PolkaVM—और Starknet की CairoVM।

---

## ब्लॉकचेन वर्चुअल मशीन क्या है, और यह क्यों मायने रखती है?

ब्लॉकचेन VM एक नियतात्मक, सैंडबॉक्स्ड निष्पादन परिवेश है: हर पूर्ण नोड समान ट्रांज़ैक्शन डाउनलोड करता है, उन्हें समान VM से चलाता है और परिणामस्वरूप समान [ऑन-चेन](/hi/glossary/on-chain/) स्टेट पर पहुँचता है। Ethereum के अपने दस्तावेज़ EVM को "एक विकेंद्रीकृत वर्चुअल परिवेश, जो सभी Ethereum नोड पर कोड को सुसंगत और सुरक्षित रूप से निष्पादित करता है" बताते हैं ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20is%20a%20decentralized,mechanics%20of%20how%20they%20work))—यह विवरण इस गाइड की हर VM पर लागू होता है।

दो गुण किसी VM के डिज़ाइन में होने वाले समझौतों को परिभाषित करते हैं:

- **भाषा और टूलचेन।** डेवलपर कॉन्ट्रैक्ट किन भाषाओं में लिख सकते हैं, और पहले से ऑडिट किए गए कोड, टूलिंग तथा उन कुशल लोगों का मौजूदा भंडार कितना बड़ा है जो इसका इस्तेमाल जानते हैं?
- **निष्पादन मॉडल।** क्या VM ट्रांज़ैक्शन को सख्ती से एक-एक करके (क्रमिक रूप से) संसाधित करती है, या स्वतंत्र ट्रांज़ैक्शन कई CPU कोर पर एक साथ चल सकते हैं (समानांतर निष्पादन)? क्रमिक निष्पादन को समझना आसान है; समानांतर निष्पादन सैद्धांतिक थ्रूपुट बढ़ाता है, लेकिन शेड्यूलिंग को अधिक जटिल बनाता है।

इन विकल्पों का असर गैस लागत, नेटवर्क भीड़ के व्यवहार और इस बात पर पड़ता है कि कौन-से मौजूदा कॉन्ट्रैक्ट और टूल दोबारा लिखे बिना पोर्ट किए जा सकते हैं। इसीलिए "कौन-सी VM" किसी नई चेन या उसके ऊपर बनी किसी [टोकनाइज़्ड](/hi/glossary/tokenize/) एसेट के सामने आने वाले शुरुआती सवालों में से एक है।

---

## EVM (Ethereum Virtual Machine)

![EVM को एक सिंगल-लेन स्टैक मशीन के रूप में दिखाने वाला फ्लैट-वेक्टर आरेख, जिसमें एक इंस्ट्रक्शन पॉइंटर वर्टिकल स्टैक पर वैल्यू पुश और पॉप कर रहा है तथा गैस मीटर डायल निष्पादन लागत पर नज़र रख रहा है](../../assets/blockchain-virtual-machines-01-evm-stack.jpg)

EVM को 2015 में [Ethereum](/hi/glossary/ethereum/) के साथ पेश किया गया था और आज यह सबसे व्यापक रूप से तैनात स्मार्ट कॉन्ट्रैक्ट VM में से एक है। यह एक **स्टैक-आधारित** मशीन है: Ethereum के दस्तावेज़ बताते हैं कि यह "1024 आइटम की गहराई वाली स्टैक मशीन" की तरह काम करती है, जहाँ हर आइटम 256-bit वर्ड होता है ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20executes%20as%20a,256%2Dbit%20word))। कॉन्ट्रैक्ट स्टेट हर खाते से जुड़े Merkle Patricia trie में रहता है, और वैश्विक चेन स्टेट भी एक संशोधित Merkle Patricia trie के रूप में व्यवस्थित होता है, जो सभी खातों को हैश द्वारा जोड़ता है ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Ethereum%20uses%20a%20modified%20Merkle,linked%20by%20hashes))।

**भाषा।** कॉन्ट्रैक्ट लगभग हमेशा **Solidity** में लिखे जाते हैं। Ethereum के अपने दस्तावेज़ इसे स्मार्ट कॉन्ट्रैक्ट लागू करने के लिए एक "ऑब्जेक्ट-ओरिएंटेड, हाई-लेवल भाषा" बताते हैं, जो C++ सिंटैक्स से बहुत प्रभावित है ([ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Solidity))। मुख्य विकल्प **Vyper** है, जो एक "Pythonic" भाषा है और कॉन्ट्रैक्ट का ऑडिट आसान बनाने के लिए जानबूझकर कुछ सुविधाएँ हटा देती है ([ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Vyper))।

**निष्पादन मॉडल।** EVM किसी ब्लॉक के भीतर ट्रांज़ैक्शन को **क्रमिक रूप से**—एक निश्चित क्रम में, एक के बाद एक—संसाधित करती है। इससे स्टेट-ट्रांज़िशन लॉजिक सरल और ऑडिट करना आसान रहता है, लेकिन बेस लेयर का थ्रूपुट सीमित होता है।

**गैस।** हर ऑपरेशन की [गैस](/hi/glossary/gas/) लागत होती है। यह "ऑपरेशन के लिए आवश्यक गणनात्मक प्रयास" की Ethereum इकाई है, जो निष्पादन का मूल्य तय करती है और नेटवर्क को स्पैम या अनंत लूप से बचाती है ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Since%20each%20transaction%20is%20broadcast,uses%20gas))।

**विशिष्ट ताकत और पहुँच।** EVM की असली बढ़त उसका इकोसिस्टम है: यह क्रिप्टो की सबसे अधिक लागू की गई VM है, और दर्जनों Layer 2 तथा स्वतंत्र चेन (Arbitrum, Optimism, Base, Polygon, BNB Chain, Avalanche C-Chain) **EVM-संगत** या **EVM-समतुल्य** परिवेश देती हैं, ताकि मौजूदा Solidity कॉन्ट्रैक्ट, वॉलेट और टूलिंग बहुत कम या बिना किसी बदलाव के तैनात किए जा सकें।

---

## SVM (Solana / Sealevel)

![समानांतर चल रही ट्रांज़ैक्शन कारों वाले मल्टी-लेन हाईवे और कतार में लगी कारों वाली सिंगल-लेन सड़क की तुलना करता फ्लैट-वेक्टर आरेख, जो क्रमिक निष्पादन के मुकाबले Solana के Sealevel समानांतर निष्पादन को दिखाता है](../../assets/blockchain-virtual-machines-02-parallel-execution.jpg)

Solana का रनटाइम **Sealevel** एक खास अनुमान पर बना है: अधिकतर ट्रांज़ैक्शन स्टेट के अलग-अलग हिस्सों को छूते हैं, इसलिए उन्हें एक-एक करके चलाने के बजाय एक साथ निष्पादित किया जा सकता है। Solana की अपनी घोषणा Sealevel को "Solana का समानांतर स्मार्ट कॉन्ट्रैक्ट रनटाइम" बताती है, जो "Validator के लिए उपलब्ध जितने भी कोर हों, उनका इस्तेमाल करके हजारों कॉन्ट्रैक्ट समानांतर संसाधित" कर सकता है ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sealevel%E2%80%94Parallel%20Smart%20Contracts%20Runtime))।

**समानांतर निष्पादन कैसे काम करता है।** Solana ट्रांज़ैक्शन को पहले ही हर उस खाते की घोषणा करनी होती है जिसे वे पढ़ेंगे या लिखेंगे। इसी घोषणा से शेड्यूलिंग संभव होती है: रनटाइम "लाखों लंबित ट्रांज़ैक्शन को छाँट" सकता है और "सभी गैर-अतिव्यापी ट्रांज़ैक्शन को समानांतर शेड्यूल" कर सकता है। इसमें ऐसे कई ट्रांज़ैक्शन को एक साथ चलाना भी शामिल है जो समान खाते को केवल *पढ़ते* हैं ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sort%20millions%20of%20pending%20transactions))। दो ट्रांज़ैक्शन एक-दूसरे के सापेक्ष क्रमिक रूप से चलते हैं जब वे समान खाते को एक्सेस करते हैं और उनमें से कम से कम एक उस पर लिखता है; केवल समान खाते को पढ़ने वाले ट्रांज़ैक्शन फिर भी एक साथ चल सकते हैं।

**भाषा और VM की आंतरिक संरचना।** Solana प्रोग्राम (स्मार्ट कॉन्ट्रैक्ट के लिए इसका शब्द) Berkeley Packet Filter बाइटकोड के एक प्रकार में कम्पाइल होते हैं—Solana Labs इसे ऑन-चेन VM के लिए "Berkeley Packet Filter (BPF) बाइटकोड के एक प्रकार" का चुनाव बताता है ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Berkeley%20Packet%20Filter))। प्रोग्राम सबसे अधिक **Rust** में लिखे जाते हैं; C और C++ भी समर्थित हैं।

**विशिष्ट ताकत।** खाता-स्तरीय समानांतरता रनटाइम की विशेषता है, जिसे हर कॉन्ट्रैक्ट लेखक को खुद लागू नहीं करना पड़ता। इस कारण Solana निष्पादन को ऑफ-चेन ले जाए बिना ऊँचा थ्रूपुट बनाए रख सकता है। इसकी कीमत एक अधिक सख्त खाता-घोषणा मॉडल है, जो EVM के स्वतंत्र स्टोरेज मॉडल की तुलना में कॉन्ट्रैक्ट लिखने का तरीका बदल देता है।

---

## MoveVM (Aptos और Sui)

![एक सिक्के को भौतिक संसाधन की तरह दो खाता बॉक्सों के बीच हाथों-हाथ दिया जाता दिखाता फ्लैट-वेक्टर आरेख, जिसमें Move के ability-नियंत्रित resource मॉडल को समझाने वाले "copy restricted" और "no implicit drop" सुरक्षा बैज हैं](../../assets/blockchain-virtual-machines-03-move-resource-v2.jpg)

**Move** एक स्मार्ट कॉन्ट्रैक्ट भाषा है, जिसे मूल रूप से Meta के Diem प्रोजेक्ट के लिए बनाया गया था। अब यह **Aptos** और **Sui** की आधारभूत भाषा है, और दोनों अपनी MoveVM का अलग प्रकार चलाते हैं। Aptos के दस्तावेज़ Move को "Web3 के लिए सुरक्षित प्रोग्रामिंग भाषा, जो अभाव और एक्सेस नियंत्रण पर जोर देती है" बताते हैं ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Move%20is%20a%20safe%20and,scarcity%20and%20access%20control))।

**रिसोर्स मॉडल।** Move का मुख्य विचार डिजिटल एसेट को **resources** मानना है—विशेष struct प्रकार, जिनके बारे में भाषा का टाइप सिस्टम सुनिश्चित करता है कि वे "गलती से डुप्लिकेट या ड्रॉप नहीं किए जा सकते" ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Resources%20cannot%20be%20copied%2C%20they,structs%20cannot%20be%20accidentally%20duplicated))। Move resource के रूप में बनाए गए टोकन या NFT की नकल तभी की जा सकती है जब उसके प्रकार में `copy` ability हो; इसी तरह `drop` ability के बिना उसे अप्रत्यक्ष रूप से छोड़ा नहीं जा सकता। अमान्य इस्तेमाल को कम्पाइलर अस्वीकार कर देता है। फिर भी, प्रकार को परिभाषित करने वाला module नई वैल्यू को pack कर सकता है, उन्हें unpack करके स्पष्ट रूप से consume कर सकता है और नियंत्रित mint या burn फंक्शन उपलब्ध करा सकता है ([Aptos Move abilities](https://aptos.dev/en/build/smart-contracts/book/abilities), [Move structs और module privileges](https://aptos-labs.github.io/move-book/structs-and-enums.html))। ये abilities गलती से होने वाली copy-and-drop त्रुटियाँ रोकती हैं, लेकिन किसी कॉन्ट्रैक्ट के व्यापक एसेट लॉजिक की शुद्धता सिद्ध नहीं करतीं और हर संभावित double-spend या burn बग को खत्म नहीं करतीं।

**समानांतर निष्पादन।** Aptos Move कॉन्ट्रैक्ट को **Block-STM** से चलाता है। दस्तावेज़ इसे "उपयोगकर्ता से कोई इनपुट लिए बिना ट्रांज़ैक्शन के समवर्ती निष्पादन" को संभव बनाने वाला बताते हैं—रनटाइम निष्पादन के समय यह अनुमान लगाता है कि कौन-से ट्रांज़ैक्शन स्वतंत्र हैं, न कि Solana की तरह घोषित खाता सूचियों की माँग करता है ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Parallelism%20via%20Block,input%20from%20the%20user))।

**Sui का ऑब्जेक्ट मॉडल।** Sui एक ऑब्जेक्ट-केंद्रित स्टोरेज लेयर के साथ Move के resource विचार को आगे बढ़ाता है: "ऑब्जेक्ट नेटवर्क पर स्टोरेज की मूल इकाई है। ऑन-चेन हर resource, asset या data का हिस्सा एक ऑब्जेक्ट है," जिसे किसी खाते के key-value store में रखने के बजाय एक विशिष्ट ID से संबोधित किया जाता है ([Sui object model](https://docs.sui.io/develop/sui-architecture/object-model))। Sui का मौजूदा ऑब्जेक्ट मॉडल स्वामित्व के पाँच रूप बताता है: **address-owned**, **immutable**, **consensus-address-owned** (party), **shared** और **wrapped**। कोई ट्रांज़ैक्शन consensus ordering के बिना Sui का सीधा fast path तभी ले सकता है, जब उसका हर mutable object input address-owned हो और हर अन्य object input immutable हो। Consensus-address-owned और shared object को consensus से क्रमबद्ध किया जाता है, भले ही कोई ट्रांज़ैक्शन उन्हें केवल पढ़ता हो; हालाँकि बिना टकराव वाले read-only access फिर भी एक साथ निष्पादित हो सकते हैं ([Sui address-owned objects](https://docs.sui.io/develop/objects/object-ownership/address-owned), [party objects](https://docs.sui.io/develop/objects/object-ownership/party), [Lutris paper](https://docs.sui.io/paper/sui-lutris.pdf))। इसलिए स्वतंत्र fast-path ट्रांज़ैक्शन को हर ऑब्जेक्ट को वैश्विक shared state माने बिना एक साथ संसाधित किया जा सकता है।

**विशिष्ट ताकत।** Move के resource प्रकार generic code को किसी वैल्यू में `copy` के बिना उसकी नकल करने या `drop` के बिना उसे scope से बाहर जाने देने से रोकते हैं। परिभाषित करने वाला module फिर भी वैल्यू mint कर सकता है और उन्हें unpack करके स्पष्ट रूप से नष्ट कर सकता है, इसलिए ये जाँच अपने आप एसेट संरक्षण को सिद्ध नहीं करतीं या हर एसेट-लॉजिक बग खत्म नहीं करतीं। Aptos और Sui दोनों इस सुरक्षा मॉडल को ऐसी समानांतर निष्पादन व्यवस्था के साथ जोड़ते हैं जिसे बाद में जोड़ने के बजाय शुरू से डिज़ाइन में शामिल किया गया है।

---

## पोर्टेबल-बाइटकोड VM (CosmWasm और PolkaVM)

ब्लॉकचेन-विशिष्ट बाइटकोड परिभाषित करने के बजाय, कुछ चेन पोर्टेबल, सामान्य-उद्देश्य इंस्ट्रक्शन प्रारूपों का इस्तेमाल करती हैं। **CosmWasm** WebAssembly चलाता है, जबकि **PolkaVM** RISC-V से व्युत्पन्न बाइटकोड चलाता है; इसलिए PolkaVM, WASM-आधारित VM नहीं है। WebAssembly मानक Wasm को "स्टैक-आधारित वर्चुअल मशीन के लिए एक बाइनरी इंस्ट्रक्शन प्रारूप" बताता है, जिसे "प्रोग्रामिंग भाषाओं के लिए पोर्टेबल कम्पाइलेशन टार्गेट" के रूप में डिज़ाइन किया गया है और जिसका "लक्ष्य नेटिव गति से निष्पादित होना" है ([webassembly.org](https://webassembly.org/#:~:text=WebAssembly%20(abbreviated%20Wasm)%20is%20a,wide%20range%20of%20platforms))। Wasm को कॉन्ट्रैक्ट VM बनाने का अर्थ है कि Wasm कम्पाइलर टार्गेट वाली कोई भी भाषा—Rust, C, C++, Go—सैद्धांतिक रूप से तैनात किया जा सकने वाला कॉन्ट्रैक्ट बना सकती है।

**CosmWasm।** Cosmos इकोसिस्टम में सबसे प्रमुख Wasm-आधारित स्मार्ट कॉन्ट्रैक्ट प्लेटफ़ॉर्म CosmWasm खुद को "मल्टी-चेन दुनिया के लिए सुरक्षित, तेज़ और इंटरऑपरेबल स्मार्ट कॉन्ट्रैक्ट प्लेटफ़ॉर्म" बताता है ([cosmwasm.com](https://www.cosmwasm.com/#:~:text=Secure%2C%20performant%2C%20interoperable%20smart%20contract,platform%20for%20the%20multi%2Dchain%20world))। कॉन्ट्रैक्ट **Rust** में लिखे जाते हैं और "अत्यधिक अनुकूलित Web Assembly रनटाइम" पर चलते हैं ([cosmwasm.com](https://www.cosmwasm.com/#:~:text=highly%20optimized%20Web%20Assembly%20runtime))। CosmWasm Osmosis, Neutron, Injective, Secret Network और Terra सहित दर्जनों Cosmos SDK चेन पर तैनात है, और Cosmos की नेटिव IBC क्रॉस-चेन मैसेजिंग का लाभ लेता है।

**PolkaVM।** Polkadot की नई स्मार्ट-कॉन्ट्रैक्ट VM ने अलग रास्ता चुना: raw Wasm चलाने के बजाय Parity ने PolkaVM बनाई, जिसे उसका अपना रिपॉज़िटरी विवरण "एक सामान्य-उद्देश्य वाली user-level RISC-V आधारित वर्चुअल मशीन" बताता है ([github.com/paritytech/polkavm](https://github.com/paritytech/polkavm#:~:text=PolkaVM%20is%20a%20general%20purpose,level%20RISC%2DV%20based%20virtual%20machine))। ink! के स्मार्ट-कॉन्ट्रैक्ट दस्तावेज़ के अनुसार इसकी वजह प्रदर्शन है: RISC-V निष्पादन "ट्रांज़ैक्शन थ्रूपुट और ट्रांज़ैक्शन लागत से संबंधित" होता है, जिससे ink! द्वारा पहले इस्तेमाल किए गए Wasm इंटरप्रेटर की तुलना में निष्पादन अधिक तेज़ और सस्ता होता है ([use.ink](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/#:~:text=performance%20correlates%20with%20transaction%20throughput))। खास बात यह है कि Polkadot का PolkaVM स्टैक (ब्रांड नाम "Revive") EVM इंटरप्रेटर लेयर भी देता है, जिससे Solidity कॉन्ट्रैक्ट समान RISC-V बैकएंड पर चल सकते हैं।

**विशिष्ट ताकत।** पोर्टेबल-बाइटकोड VM, ब्लॉकचेन-विशिष्ट बाइटकोड के बजाय स्थापित सामान्य-उद्देश्य कम्पाइलेशन टार्गेट चुनती हैं। खासकर Rust कॉन्ट्रैक्ट को मजबूत मेमोरी-सुरक्षा गारंटी देता है, और Wasm तथा RISC-V दोनों को ब्लॉकचेन से कहीं बड़े, गैर-ब्लॉकचेन उपयोग मामलों के लिए बनी टूलिंग का लाभ मिलता है। CosmWasm और PolkaVM अलग-अलग आर्किटेक्चर हैं: पहला Wasm चलाता है, जबकि दूसरा RISC-V से व्युत्पन्न बाइटकोड चलाता है।

---

## CairoVM (Starknet)

**Cairo** विशेष रूप से ज़ीरो-नॉलेज प्रूफ़ बनाने के लिए निर्मित स्मार्ट कॉन्ट्रैक्ट भाषा और VM है। यह Ethereum [Layer 2](/hi/glossary/layer-2/) **Starknet** की बुनियाद है। Starknet के अपने दस्तावेज़ डिज़ाइन का लक्ष्य स्पष्ट बताते हैं: "Cairo एक STARK-अनुकूल Von Neumann आर्किटेक्चर है, जो मनचाही गणना के लिए वैधता प्रूफ़ बना सकता है" ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Cairo%20is%20a%20STARK,for%20arbitrary%20computations))। "STARK-अनुकूल" होने का अर्थ है कि इंस्ट्रक्शन सेट "STARK प्रूफ़ सिस्टम के लिए अनुकूलित है और दूसरे प्रूफ़ सिस्टम बैकएंड के साथ भी संगत रहता है" ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Being%20STARK,other%20proof%20system%20backends))। यह EVM या SVM की प्राथमिकता के उलट है, जिन्हें पहले निष्पादन के लिए डिज़ाइन किया गया और स्केलिंग के लिए proving system बाद में जोड़े गए।

**निष्पादन मॉडल।** Cairo एक Turing-complete इंस्ट्रक्शन सेट ("Cairo machine") में कम्पाइल होता है, जिसे algebraic intermediate representations के समूह के रूप में परिभाषित किया गया है। इससे किसी भी Cairo प्रोग्राम के execution trace को एक संक्षिप्त STARK प्रूफ़ में बदला जा सकता है, जिसे Ethereum L1 पर सत्यापित किया जा सके ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=At%20its%20core%2C%20Cairo%20is,arbitrary%20code%29%20through%20the%20Cairo%20machine))। इसी वजह से Starknet हजारों ट्रांज़ैक्शन को ऑफ-चेन बैच कर सकता है और हर ट्रांज़ैक्शन को दोबारा चलाने के बजाय शुद्धता का एक छोटा प्रूफ़ Ethereum पर पोस्ट कर सकता है।

**विशिष्ट ताकत।** प्रूफ़-अनुकूलता Cairo की शुरुआती डिज़ाइन बाध्यता थी: इसका इंस्ट्रक्शन सेट और execution trace कुशल STARK proving के लिए डिज़ाइन किए गए हैं। वास्तविक proving लागत फिर भी प्रोग्राम, prover के कार्यान्वयन, proof-system parameters और तुलना के आधार पर निर्भर करती है, इसलिए यह हर zkEVM workload से हमेशा कम नहीं होती। इसके बदले भाषा का इकोसिस्टम नया और छोटा है तथा Ethereum से आने वाले डेवलपर के लिए सीखने की राह Solidity की तुलना में अधिक कठिन है।

---

## तुलना तालिका

| VM | कॉन्ट्रैक्ट भाषा | निष्पादन / स्टेट मॉडल | समानांतर निष्पादन | इकोसिस्टम का आकार | EVM-संगत |
|---|---|---|---|---|---|
| **EVM** | Solidity, Vyper | स्टैक मशीन; Merkle Patricia trie में खाता/स्टोरेज स्टेट | नहीं—ब्लॉक के भीतर क्रमिक | सबसे बड़ा; L2 और app-chain के लिए डिफ़ॉल्ट टार्गेट | नेटिव |
| **SVM (Solana)** | Rust, C, C++ | BPF-व्युत्पन्न बाइटकोड; घोषित read/write sets वाला खाता-आधारित स्टेट | हाँ—Sealevel गैर-अतिव्यापी ट्रांज़ैक्शन को साथ शेड्यूल करता है | बड़ा, तेज़ी से बढ़ता, अधिकतर Solana-नेटिव | नहीं (अलग इकोसिस्टम) |
| **MoveVM (Aptos/Sui)** | Move | resource-typed object; Aptos में Block-STM, Sui में सीधे और consensus-क्रमबद्ध पथों के साथ कई ownership forms | हाँ—रनटाइम पर अनुमानित (Aptos) या ऑब्जेक्ट ownership के जरिए (Sui) | छोटा, बढ़ता हुआ; दो स्वतंत्र Move इकोसिस्टम | नहीं |
| **पोर्टेबल बाइटकोड (CosmWasm, PolkaVM)** | Rust (CosmWasm); Rust/C/RISC-V टूलचेन (PolkaVM) | Wasm बाइटकोड (CosmWasm) या RISC-V बाइटकोड (PolkaVM) | चेन पर निर्भर; यह किसी भी इंस्ट्रक्शन प्रारूप का सार्वभौमिक गुण नहीं है | मध्यम; कई Cosmos चेन और Polkadot parachain समूह में फैला | PolkaVM/Revive में EVM इंटरप्रेटर लेयर है; CosmWasm EVM-संगत नहीं है |
| **CairoVM (Starknet)** | Cairo | STARK proving के लिए डिज़ाइन की गई Turing-complete AIR-आधारित मशीन | प्राथमिक डिज़ाइन लक्ष्य नहीं—समवर्ती निष्पादन के बजाय provability के लिए अनुकूलित | पाँचों में सबसे छोटा, लेकिन Starknet की L2 गतिविधि के साथ बढ़ रहा है | नहीं (zkEVM प्रोजेक्ट Solidity कॉन्ट्रैक्ट को अलग से जोड़ते हैं) |

---

## इसका टोकनाइज़्ड डोमेन से संबंध

कोई चेन किस VM पर चलती है, यह [टोकनाइज़्ड डोमेन](/hi/glossary/tokenized-domain/) इन्फ्रास्ट्रक्चर के लिए सीधे मायने रखता है। [NFT](/hi/glossary/nft/) के रूप में दिखाया गया डोमेन असल में एक स्मार्ट कॉन्ट्रैक्ट होता है, जो तय करता है कि टोकन का मालिक कौन है और वह उसके साथ क्या कर सकता है। इस लॉजिक को resource कॉपी करने और उन्हें अप्रत्यक्ष रूप से drop करने पर Move के compile-time प्रतिबंधों से लाभ मिलता है, जबकि EVM की परिपक्व टूलिंग इसका ऑडिट करना और मौजूदा वॉलेट तथा मार्केटप्लेस के साथ एकीकरण करना आसान बनाती है। Namefi का टोकनाइज़ेशन मॉडल जानबूझकर EVM इकोसिस्टम को लक्ष्य बनाता है: EVM-संगतता का अर्थ है कि किसी टोकनाइज़्ड `.com` या `.ai` डोमेन का ownership NFT हर नई VM के लिए अलग एकीकरण माँगे बिना मौजूदा EVM वॉलेट, मार्केटप्लेस और DeFi प्रोटोकॉल के पूरे इकोसिस्टम के साथ तुरंत काम करता है। [namefi.io](https://namefi.io) पर टोकनाइज़्ड डोमेन देखें।

---

## स्रोत और आगे पढ़ने की सामग्री

- [Ethereum Virtual Machine (EVM)—ethereum.org](https://ethereum.org/en/developers/docs/evm/)
- [स्मार्ट कॉन्ट्रैक्ट भाषाएँ—ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/)
- [Sealevel—हजारों स्मार्ट कॉन्ट्रैक्ट का समानांतर संसाधन—Solana](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts)
- [Move—Aptos दस्तावेज़](https://aptos.dev/en/network/blockchain/move)
- [Move Abilities—Aptos दस्तावेज़](https://aptos.dev/en/build/smart-contracts/book/abilities)
- [Structs and Enums—Move Book](https://aptos-labs.github.io/move-book/structs-and-enums.html)
- [Object Model—Sui दस्तावेज़](https://docs.sui.io/develop/sui-architecture/object-model)
- [Address-Owned Objects—Sui दस्तावेज़](https://docs.sui.io/develop/objects/object-ownership/address-owned)
- [Party Objects—Sui दस्तावेज़](https://docs.sui.io/develop/objects/object-ownership/party)
- [Sui Lutris](https://docs.sui.io/paper/sui-lutris.pdf)
- [CosmWasm](https://www.cosmwasm.com/)
- [PolkaVM—GitHub (paritytech)](https://github.com/paritytech/polkavm)
- [स्मार्ट कॉन्ट्रैक्ट के लिए RISC-V और PolkaVM क्यों—ink! दस्तावेज़](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/)
- [Cairo आर्किटेक्चर—The Cairo Programming Language / Starknet](https://www.starknet.io/cairo-book/ch201-architecture.html)
- [WebAssembly](https://webassembly.org/)
