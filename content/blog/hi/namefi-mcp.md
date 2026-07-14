---
title: "Namefi MCP सर्वर: AI एजेंटों के लिए डोमेन टूल"
date: '2026-07-10'
language: 'hi'
tags: ['ai-agents', 'domains', 'web3']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/namefi-mcp-og.jpg
description: "Namefi MCP सर्वर द्वारा AI एजेंटों को दिए जाने वाले सभी टूल: खोज, रजिस्ट्रेशन, DNS, रिन्यूअल और टोकनाइज़ेशन, साथ में प्रमाणीकरण मॉडल और उदाहरण वर्कफ़्लो।"
keywords: ["Namefi MCP सर्वर", "MCP टूल सूची", "Namefi MCP क्षमताएँ", "डोमेन प्रबंधन MCP सर्वर", "डोमेन रजिस्ट्रार MCP सर्वर", "Namefi API कुंजी स्कोप", "DNS MCP टूल", "MCP से डोमेन रजिस्टर करें", "MCP से डोमेन टोकनाइज़ करें", "x402 डोमेन भुगतान", "SIWE डोमेन प्रमाणीकरण", "EIP-712 डोमेन साइनिंग", "डोमेन के लिए आउटबाउंड लीड खोज", "Namefi OpenAPI", "AI एजेंट डोमेन टूल"]
relatedArticles:
  - /hi/blog/claude-mcp-domains/
  - /hi/blog/ai-agent-register/
  - /hi/blog/wallet-checkout/
  - /hi/blog/llms-txt/
  - /hi/blog/mcp-quickstart/
relatedTopics:
  - /hi/topics/domain-tokenization/
  - /hi/topics/web3-foundations/
relatedSeries:
  - /hi/series/blockchain-concepts/
  - /hi/series/tokenize-your-com/
relatedGlossary:
  - /hi/glossary/ai-agent/
  - /hi/glossary/registrar/
  - /hi/glossary/tokenized-domain/
  - /hi/glossary/dnssec/
  - /hi/glossary/ens/
---

Namefi MCP सर्वर से जुड़ने वाले हर [AI एजेंट](/hi/glossary/ai-agent/) को कॉल किए जा सकने वाले टूल की वही सूची दिखती है—API द्वारा परिभाषित हर ऑपरेशन के लिए एक टूल, जिसमें खोज, रजिस्ट्रेशन, DNS, डोमेन-स्तरीय कॉन्फ़िगरेशन, आउटबाउंड लीड खोज और भुगतान शामिल हैं। यह पृष्ठ पूरी सूची है: हर टूल, उसका काम, उसके लिए आवश्यक प्रमाणीकरण और कई टूल को वास्तविक वर्कफ़्लो में मिलाने वाले तीन विस्तृत उदाहरण।

यदि आपने अभी तक किसी एजेंट को Namefi से नहीं जोड़ा है, तो अलग-अलग क्लाइंट के सेटअप के लिए [Namefi पर अपने AI एजेंट से डोमेन कैसे रजिस्टर करें](/hi/blog/ai-agent-register/) से शुरू करें या पूरे ट्रांसक्रिप्ट के लिए [Claude से डोमेन खरीदें: Namefi MCP चरण-दर-चरण गाइड](/hi/blog/claude-mcp-domains/) पढ़ें। यह पृष्ठ मानकर चलता है कि कनेक्शन पहले से मौजूद है।

## Namefi MCP सर्वर क्या है

Namefi अपने पूरे API के लिए Streamable HTTP ट्रांसपोर्ट पर `https://api.namefi.io/mcp` में एक MCP सर्वर चलाता है। चैट में चिपकाए गए दस्तावेज़ों से एजेंट के स्वयं REST कॉल बनाने के बजाय वह एक बार जुड़ता है और API द्वारा परिभाषित हर ऑपरेशन के लिए टाइप किया हुआ टूल पाता है। ये टूल सीधे Namefi के अपने OpenAPI 3 स्पेसिफ़िकेशन, [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json), से बनाए जाते हैं, इसलिए MCP सूची और REST API एक-दूसरे से अलग नहीं हो सकते।

[namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) पर मशीन-पठनीय खोज डिस्क्रिप्टर किसी एजेंट को कॉन्फ़िगरेशन फ़ाइल में मानव द्वारा URL चिपकाए बिना सर्वर खोजने देता है: यह सर्वर का नाम `namefi-api` बताता है, `streamable-http` ट्रांसपोर्ट दर्ज करता है और कनेक्शन प्रमाणीकरण के रूप में `apiKey`/`x-api-key` घोषित करता है। [ICANN](/hi/glossary/icann/) से मान्यता प्राप्त [रजिस्ट्रार](/hi/glossary/registrar/) Namefi उन्हीं ऑपरेशनों को [namefi.io/llms.txt](https://namefi.io/llms.txt) पर साधारण HTTPS एंडपॉइंट के रूप में भी प्रकाशित करता है, उन एजेंटों और स्क्रिप्ट के लिए जो MCP नहीं समझते।

## क्षमताओं की पूरी सूची

नीचे इस लेख के लिखे जाने तक API द्वारा परिभाषित हर ऑपरेशन है, जिसे Namefi के अपने संदर्भ के समान समूहों में रखा गया है। **ऑपरेशन** कॉलम OpenAPI स्पेसिफ़िकेशन का `operationId` है—यही वह नाम है जिससे MCP क्लाइंट की टूल सूची बनती है। **प्रमाणीकरण** कॉलम सबसे आसान रास्ता दिखाता है (API कुंजी लगभग हर चीज़ को शामिल करती है); API कुंजी के विकल्पों सहित पूरा प्रमाणीकरण मॉडल अगले सेक्शन में है।

### खोज और डिस्कवरी

| ऑपरेशन | एंडपॉइंट | यह क्या करता है | प्रमाणीकरण |
| --- | --- | --- | --- |
| `checkAvailability` | `GET /v-next/search/availability` | जाँचता है कि एक डोमेन नाम रजिस्ट्रेशन के लिए उपलब्ध है या नहीं | कोई नहीं |
| `checkBulkAvailability` | `GET /v-next/search/bulk-availability` | उम्मीदवार नामों के बैच को एक कॉल में जाँचता है | कोई नहीं |
| `getSuggestions` | `GET /v-next/search/suggestions` | किसी क्वेरी से जुड़े एल्गोरिथम-आधारित नाम सुझाव देता है | कोई नहीं |

### रजिस्ट्रेशन और ऑर्डर

| ऑपरेशन | एंडपॉइंट | यह क्या करता है | प्रमाणीकरण |
| --- | --- | --- | --- |
| `registerDomain` | `POST /v-next/orders/register-domain` | डोमेन को 0–10 वर्षों के लिए रजिस्टर करता है। एक `domainSetupOptions` ऑब्जेक्ट (`autoPark`, `autoEns`, `autoRenew`, `dnssec`, `keepExistingNameservers`) और वैकल्पिक `nftReceivingWallet` स्वीकार करता है | API कुंजी |
| `registerWithRecords` | `POST /v-next/orders/register-domain/records` | एक ही कॉल में डोमेन रजिस्टर करके DNS रिकॉर्ड का शुरुआती सेट लागू करता है | API कुंजी |
| `getOrder` | `GET /v-next/orders/{orderId}` | ऑर्डर को तब तक पोल करता है जब तक वह किसी अंतिम स्थिति में न पहुँचे: `SUCCEEDED`, `FAILED`, `CANCELLED` या `PARTIALLY_COMPLETED` | API कुंजी |

रजिस्ट्रेशन असिंक्रोनस है—`registerDomain` तुरंत ऑर्डर `id` लौटाता है और एजेंट उसके पूरा होने तक `getOrder` को पोल करता है। [Claude चरण-दर-चरण गाइड](/hi/blog/claude-mcp-domains/) और [बहु-एजेंट सेटअप गाइड](/hi/blog/ai-agent-register/) दोनों पूरे ट्रांसक्रिप्ट में यह पैटर्न दिखाते हैं।

### DNS रिकॉर्ड प्रबंधन

पूरा CRUD, एक बार में एक रिकॉर्ड या बैच में, साथ में ऐसा रीड ऑपरेशन जिसके लिए कोई प्रमाणीकरण नहीं चाहिए:

| ऑपरेशन | एंडपॉइंट | यह क्या करता है | प्रमाणीकरण |
| --- | --- | --- | --- |
| `getDnsRecords` | `GET /v-next/dns/records` | किसी ज़ोन के सभी रिकॉर्ड सूचीबद्ध करता है | कोई नहीं |
| `createDnsRecord` | `POST /v-next/dns/records` | एक रिकॉर्ड बनाता है | API कुंजी |
| `updateDnsRecord` | `PUT /v-next/dns/record` | ID के अनुसार रिकॉर्ड अपडेट करता है | API कुंजी |
| `deleteDnsRecord` | `DELETE /v-next/dns/record` | ID के अनुसार रिकॉर्ड मिटाता है | API कुंजी |
| `batchCreateDnsRecords` | `POST /v-next/dns/records/batch` | एक कॉल में कई रिकॉर्ड बनाता है | API कुंजी |
| `batchUpdateDnsRecords` | `PUT /v-next/dns/records/batch` | एक कॉल में कई रिकॉर्ड अपडेट करता है | API कुंजी |
| `batchDeleteDnsRecords` | `DELETE /v-next/dns/records/batch` | एक कॉल में कई रिकॉर्ड मिटाता है | API कुंजी |

समर्थित [रिकॉर्ड प्रकार](/hi/glossary/dns-record-types/): A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA, DS, TLSA, SSHFP, HTTPS, SVCB, NAPTR, SPF। फ़ॉर्मेट के दो नियम अधिकांश पहले प्रयासों को विफल करते हैं: `zoneName` के अंत में डॉट नहीं होना चाहिए, जबकि CNAME, MX और NS रिकॉर्ड के `rdata` मानों के अंत में डॉट होना चाहिए।

### डोमेन-स्तरीय टॉगल

ये किसी एक DNS रिकॉर्ड से अलग, पूरी सुविधा को चालू या बंद करते हैं:

| ऑपरेशन | एंडपॉइंट | यह क्या करता है | प्रमाणीकरण |
| --- | --- | --- | --- |
| `toggleDomainParking` / `parkDomain` | `PUT` / `POST /v-next/dns/park` | [डोमेन पार्किंग](/hi/glossary/domain-parking/) चालू या बंद करता है | API कुंजी |
| `isDomainParked` | `GET /v-next/dns/parked` | जाँचता है कि डोमेन अभी पार्क किया हुआ है या नहीं | कोई नहीं |
| `toggleForwarding` | `PUT /v-next/dns/forwarding` | [डोमेन फॉरवर्डिंग](/hi/glossary/domain-forwarding/) चालू या बंद करता है | API कुंजी |
| `toggleAutoEns` | `PUT /v-next/dns/auto-ens` | स्वचालित [ENS](/hi/glossary/ens/) रिकॉर्ड प्रकाशन चालू या बंद करता है | API कुंजी |
| `toggleVercelAnyCastRecords` | `PUT /v-next/dns/vercel-anycast` | Vercel Anycast DNS रिकॉर्ड चालू या बंद करता है | API कुंजी |

ध्यान दें कि [DNSSEC](/hi/glossary/dnssec/) इन टॉगल में से नहीं है—इसे रजिस्ट्रेशन के समय `domainSetupOptions` फ़ील्ड में, ऊपर दिए `registerDomain` पर सेट किया जाता है; यह कोई अलग एंडपॉइंट नहीं है जिसे एजेंट बाद में कॉल करे।

### डोमेन कॉन्फ़िगरेशन

| ऑपरेशन | एंडपॉइंट | यह क्या करता है | प्रमाणीकरण |
| --- | --- | --- | --- |
| `getAutoRenew` | `GET /v-next/domain-config/auto-renew` | जाँचता है कि ऑटो-रिन्यूअल चालू है या नहीं | API कुंजी |
| `toggleAutoRenew` | `PUT /v-next/domain-config/auto-renew` | ऑटो-रिन्यूअल चालू या बंद करता है | API कुंजी |

[ऑटो-रिन्यूअल](/hi/glossary/domain-renewal/) चालू होने पर डोमेन मालिक के वॉलेट की भुगतान विधियों से समाप्ति से पहले अपने आप रिन्यू होता है—यह स्थायी अनुमति हर डोमेन के लिए सोच-समझकर तय करनी चाहिए, पूरे पोर्टफ़ोलियो में डिफ़ॉल्ट रूप से चालू नहीं छोड़नी चाहिए।

### आउटबाउंड लीड खोज

यह सबसे नई सुविधा है, जो स्वामित्व वाले डोमेन को स्थिर एसेट सूची के बजाय बिक्री पाइपलाइन में बदलती है:

| ऑपरेशन | एंडपॉइंट | यह क्या करता है | प्रमाणीकरण |
| --- | --- | --- | --- |
| `getUserDomains` | `GET /v-next/user/domains` | प्रमाणित वॉलेट के स्वामित्व वाले डोमेन सूचीबद्ध करता है | API कुंजी |
| `startOutboundRun` | `POST /v-next/outbound/runs` | स्वामित्व वाले एक डोमेन के लिए AI लीड-खोज रन शुरू करता है, जिसमें `reasoningEffort` का मान `low`, `medium` या `high` होता है | API कुंजी |
| `listOutboundRuns` | `GET /v-next/outbound/runs` | पुराने और सक्रिय रन सूचीबद्ध करता है | API कुंजी |
| `getOutboundRun` | `GET /v-next/outbound/runs/{runId}` | रन की स्थिति पोल करता है: `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED` या `CANCELED` | API कुंजी |
| `listOutboundLeads` | `GET /v-next/outbound/runs/{runId}/leads` | रैंक की गई खरीदार लीड सूचीबद्ध करता है, हर लीड के साथ कारण, मिले हुए संपर्क और मौजूद कोई आउटरीच ड्राफ़्ट देता है | API कुंजी |
| `prepareOutboundOutreach` | `POST /v-next/outbound/runs/{runId}/leads/{leadId}/outreach` | एक लीड के लिए आउटरीच ड्राफ़्ट बनाता है या बिना अतिरिक्त जनरेशन लागत के पहले से मौजूद ड्राफ़्ट लौटाता है | API कुंजी |

प्रतिक्रिया आंतरिक रैंकिंग प्रक्रिया—स्कोर, मॉडल विवरण और दबाई गई लीड की स्थिति—शामिल नहीं करती, इसलिए मानव के लिए परिणामों का सारांश बना रहे एजेंट को केवल सार्वजनिक कारण, मिला हुआ संपर्क और ड्राफ़्ट मौजूद है या नहीं, इतना ही दिखता है।

### भुगतान और अकाउंट

| ऑपरेशन | एंडपॉइंट | यह क्या करता है | प्रमाणीकरण |
| --- | --- | --- | --- |
| `getBalance` | `GET /v-next/balance` | रजिस्ट्रेशन के लिए धन उपलब्ध कराने वाला NFSC (Namefi Service Credit) बैलेंस जाँचता है | API कुंजी |
| `requestNfscFaucet` | `POST /v-next/user/faucet` | मुफ़्त परीक्षण NFSC क्रेडिट माँगता है (केवल डेवलपमेंट वातावरण) | API कुंजी |
| `registerDomainX402` | `GET /x402/domain/{domainName}` | बिना Namefi अकाउंट के, स्टेबलकॉइन भुगतान के लिए हस्ताक्षरित HTTP 402 प्रवाह में रजिस्ट्रेशन और भुगतान करता है | वॉलेट हस्ताक्षर |
| — | `GET /x402/purchase/{purchaseId}` | x402 खरीद की स्थिति पोल करता है | कोई नहीं |
| `registerDomainMPP` | `GET /mpp/domain/{domainName}` | MPP (Machine Payable Protocol) चुनौती-प्रतिक्रिया प्रवाह से रजिस्ट्रेशन और भुगतान करता है | वॉलेट हस्ताक्षर |

इसमें खोज, रजिस्ट्रेशन, DNS, डोमेन कॉन्फ़िगरेशन, आउटबाउंड और भुगतान के दायरे में आने वाला हर ऑपरेशन शामिल है—हर एक एकल सर्वर कनेक्शन के ज़रिए MCP टूल के रूप में या MCP न समझने वाले एजेंट के लिए साधारण HTTPS कॉल के रूप में उपलब्ध है। (Namefi का API इस सूची से बाहर अकाउंट प्रबंधन और EIP-712/SIWE के कुछ सहायक ऑपरेशन भी देता है; पूरी सूची हमेशा नीचे स्रोतों में लिंक किए OpenAPI स्पेसिफ़िकेशन में ताज़ा रहती है।)

## प्रमाणीकरण मॉडल: प्रवेश के तीन रास्ते, सबके पीछे एक वॉलेट

ऊपर हर लिखने वाला ऑपरेशन एक ही चीज़ जाँचता है—क्या कॉलर उस वॉलेट को नियंत्रित करता है जो डोमेन का मालिक है या होगा—और यह जाँच तीन में से किसी एक रास्ते से होती है। कौन-सा रास्ता लागू होगा, यह ऑपरेशन पर निर्भर करता है, किसी एक अकाउंट-स्तरीय सेटिंग पर नहीं।

**API कुंजी (`x-api-key`)।** यह सबसे आसान विकल्प है और इस समूह के हर विस्तृत उदाहरण में यही इस्तेमाल हुआ है। [namefi.io/api-key](https://namefi.io/api-key) पर एक कुंजी बनाएँ; यह DNS लेखन, पार्किंग और रजिस्ट्रेशन सहित ऊपर दिए हर ऑपरेशन के लिए काम करती है, क्योंकि कुंजी उसे बनाने वाले वॉलेट की अनुमतियाँ पाती है—इसे साधारण HTTP हेडर के रूप में भेजें, SDK की ज़रूरत नहीं।

**EIP-712 टाइप्ड-डेटा हस्ताक्षर।** संग्रहित कुंजी के बिना प्रोग्राम से उपयोग करने के लिए हर अनुरोध पर Ethereum [वॉलेट](/hi/glossary/wallet/) से हस्ताक्षर करें: `x-namefi-signer`, `x-namefi-signature` और `x-namefi-eip712-type` हेडर पेलोड को ऐसे एनवलप में बाँधते हैं जिसमें टाइमस्टैम्प और एक बार इस्तेमाल होने वाला nonce होता है; यह nonce 300 सेकंड बाद समाप्त हो जाता है—API कुंजी के बिना `toggleDomainParking`, `createDnsRecord` और `registerDomain` जैसे ऑपरेशनों के लिए यही तरीका आवश्यक है। डोमेन और प्रकार की परिभाषाएँ किसी हार्डकोडेड स्थिर मान के बजाय लाइव एंडपॉइंट (`GET /v-next/eip712/domain`, `/eip712/types`) से आती हैं, क्योंकि Namefi के दस्तावेज़ बताते हैं कि वे बदल सकती हैं। स्मार्ट-कॉन्ट्रैक्ट वॉलेट सीधे हस्ताक्षर नहीं कर सकते, इसलिए स्वीकृत बाहरी स्वामित्व वाला अकाउंट कॉन्ट्रैक्ट की ओर से हस्ताक्षर करता है और `x-namefi-erc1271-account` या `x-namefi-eip7702-account` बताता है कि कौन-सा कॉन्ट्रैक्ट अनुरोध अधिकृत कर रहा है।

**SIWE (Sign-In with Ethereum)।** सुरक्षित रीड ऑपरेशन के लिए सेशन टोकन (`x-namefi-siwe-token`), जिन्हें हर कॉल पर नया हस्ताक्षर नहीं चाहिए, जैसे स्वामित्व वाले डोमेन या ऑर्डर सूचीबद्ध करना—nonce लें, हस्ताक्षर करने वाला संदेश पाएँ, `personal_sign` से उस पर हस्ताक्षर करें, उसे सत्यापित करें और फिर टोकन दोबारा इस्तेमाल करें।

कुछ ऑपरेशनों के लिए कोई प्रमाणीकरण नहीं चाहिए—`checkAvailability`, `getSuggestions`, `getDnsRecords`, `isDomainParked` और EIP-712 मेटाडेटा एंडपॉइंट—क्योंकि वे केवल-पढ़ने वाले हैं और ऐसा कुछ उजागर नहीं करते जो डोमेन का सार्वजनिक DNS पहले से किसी ब्राउज़र को न दिखाता हो।

इसके ऊपर भुगतान की परत है। `registerDomainX402` [x402 प्रोटोकॉल](https://x402.org) के ज़रिए खरीद का निपटान करता है: खरीदार का वॉलेट USDC जैसे [स्टेबलकॉइन](/hi/glossary/stablecoin/) के लिए EIP-3009 `transferWithAuthorization` पर हस्ताक्षर करता है और इसमें Namefi अकाउंट शामिल नहीं होता। `registerDomainMPP` हस्ताक्षरित चुनौती-प्रतिक्रिया के ज़रिए वही परिणाम देता है। दोनों एजेंट को अकाउंट बनाने से बचाकर हर लेन-देन पर भुगतान करने देते हैं—इस रास्ते की शुरुआत से अंत तक जानकारी [क्रिप्टो वॉलेट से डोमेन के लिए भुगतान करें: अकाउंट की ज़रूरत नहीं](/hi/blog/wallet-checkout/) में है।

## टोकनाइज़ेशन सूची के साथ चलता है, उससे अलग नहीं

`registerDomain` डोमेन को [NFT](/hi/glossary/nft/)—[ERC-721](/hi/glossary/erc-721/) टोकन, [वह मानक इंटरफ़ेस](https://eips.ethereum.org/EIPS/eip-721) जिसे अधिकांश मार्केटप्लेस और वॉलेट पहले से पढ़ते हैं—के रूप में मिंट करता है। डिफ़ॉल्ट रूप से यह Base पर कॉलर की API कुंजी से जुड़े वॉलेट में जाता है। `nftReceivingWallet` इसे रजिस्ट्रेशन के समय किसी दूसरे वॉलेट या चेन की ओर भेजता है और उसके बाद हर चीज़—DNS लेखन, पार्किंग, ऑटो-रिन्यूअल, आउटबाउंड लीड खोज—अलग अकाउंट डेटाबेस के बजाय उसी ऑन-चेन स्वामित्व रिकॉर्ड की जाँच करती है। [OpenSea](https://opensea.io) जैसे मार्केटप्लेस पर कारोबार किया गया [टोकनाइज़्ड डोमेन](/hi/glossary/tokenized-domain/) अपने DNS नियंत्रण और ERC-721 स्वामित्व को एक ही ऑब्जेक्ट में रखता है, दो ऐसे सिस्टम में नहीं जिन्हें हाथ से सिंक करना पड़े।

## तीन एजेंट, समान टूलसेट इस्तेमाल करने के तीन तरीके

**बिल्डर एक ही बातचीत में डोमेन रजिस्टर करके DNS लाइव करता है।** `checkAvailability` पुष्टि करता है कि नाम उपलब्ध है, `registerDomain` उसे `domainSetupOptions` के साथ भेजता है, जिसमें `autoRenew` और `dnssec` सेट हैं; ऑर्डर के `SUCCEEDED` होने पर `batchCreateDnsRecords` वे CNAME और TXT रिकॉर्ड लिखता है जिनका डिप्लॉयमेंट प्लेटफ़ॉर्म का सत्यापन चरण इंतज़ार कर रहा है। [कोडिंग एजेंटों के लिए Namefi MCP क्विकस्टार्ट](/hi/blog/mcp-quickstart/) एडिटर के भीतर यह क्रम दिखाता है।

**डोमेन ट्रेडर एक पोर्टफ़ोलियो सँभालता है।** `getUserDomains` मौजूदा होल्डिंग लाता है, `checkBulkAvailability` एक कॉल में नए उम्मीदवारों की जाँच करता है और `registerDomain` खरीदने लायक नाम हासिल करता है। दोबारा बेचे जाने वाले नामों के लिए `toggleDomainParking` लैंडिंग पृष्ठ लगाता है और `isDomainParked` पुष्टि करता है कि वह लाइव है; पूरे पोर्टफ़ोलियो में `getAutoRenew` और `toggleAutoRenew` तय करते हैं कि कौन-से नाम स्थायी रिन्यूअल अनुमति के लायक हैं और कौन-से इतने सट्टात्मक हैं कि उन्हें समाप्त होने दिया जा सकता है।

**व्यवसाय अपने स्वामित्व वाले नामों पर आउटबाउंड लीड खोज चलाता है।** `getUserDomains` अप्रयुक्त डोमेन पहचानता है, `startOutboundRun` शोध शुरू करता है और `getOutboundRun`, `SUCCEEDED` स्थिति मिलने तक पोल करता है। `listOutboundLeads` ऐसे रैंक किए व्यवसाय लौटाता है जिनकी प्रोफ़ाइल बताती है कि उन्हें वह नाम चाहिए होगा और `prepareOutboundOutreach` हर लीड के लिए ईमेल ड्राफ़्ट बनाता है—एक बार जनरेट होकर दोहराई गई कॉल पर मुफ़्त लौटाया जाता है।

## किसी एजेंट को यह सब बिना निगरानी चलाने देने से पहले

Namefi के अपने आउटबाउंड दस्तावेज़ चार ऑपरेशनों—`registerDomain`, `registerWithRecords`, `startOutboundRun`, `prepareOutboundOutreach`—को **महत्वपूर्ण प्रभाव वाले** बताते हैं, क्योंकि हर ऑपरेशन बैलेंस खर्च करता है या बाहरी रूप से दिखाई देने वाली कार्रवाई करता है। `checkAvailability` जैसे केवल-पढ़ने वाले टूल स्वचालित रूप से चलाने में जोखिम नहीं रखते; ऑर्डर लिखने, लाइव डोमेन पर DNS रिकॉर्ड बदलने या आउटरीच ड्राफ़्ट बनाने वाले किसी भी काम के लिए पुष्टि चरण रखना उचित है। [एजेंट-नेटिव डोमेन रजिस्ट्रार क्या है?](/hi/blog/agent-native/) में किसी भी रजिस्ट्रार के एजेंट-सामना करने वाले इंटरफ़ेस को इस तरह परखने की अधिक पूरी जाँच-सूची है।

## इस सूची को ताज़ा रखना

यह तालिका ऊपर दी प्रकाशन तिथि के समय Namefi के लाइव OpenAPI स्पेसिफ़िकेशन को दर्शाती है, कोई स्थायी रोडमैप नहीं—नए ऑपरेशन किसी ब्लॉग पोस्ट की तालिका से पहले [namefi.io/llms.txt](https://namefi.io/llms.txt) और [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) में आते हैं।

## अक्सर पूछे जाने वाले प्रश्न

### क्या किसी नाम की उपलब्धता जाँचने के लिए भी API कुंजी चाहिए?

नहीं। `checkAvailability`, `checkBulkAvailability` और `getSuggestions` के लिए कोई प्रमाणीकरण नहीं चाहिए, इसलिए वे किसी धनराशि की व्यवस्था करने से पहले भी नए जुड़े एजेंट के साथ काम करते हैं।

### क्या एजेंट मेरे पास कभी Namefi API कुंजी रहे बिना इस पूरी सूची का उपयोग कर सकता है?

हाँ। `registerDomainX402` और `registerDomainMPP` दोनों बिना Namefi अकाउंट के वॉलेट हस्ताक्षर से रजिस्ट्रेशन का निपटान करते हैं और बाकी लिखने वाले ऑपरेशन सीधे वॉलेट से EIP-712 हस्ताक्षर द्वारा पूरे किए जा सकते हैं।

### क्या इनमें से किसी भी रास्ते से रजिस्टर करने पर डोमेन अपने आप टोकनाइज़ हो जाता है?

हाँ, डिफ़ॉल्ट रूप से हर रजिस्ट्रेशन रास्ते पर। यदि `nftReceivingWallet` नहीं दिया गया, तो डोमेन Base पर कॉलर की API कुंजी से जुड़े वॉलेट में ERC-721 NFT के रूप में रजिस्टर होता है।

### स्वायत्त एजेंट को कौन-से ऑपरेशन चलाने से पहले मानव की पुष्टि लेनी चाहिए?

कम से कम वे चार जिन्हें Namefi के दस्तावेज़ महत्वपूर्ण प्रभाव वाले बताते हैं—`registerDomain`, `registerWithRecords`, `startOutboundRun`, `prepareOutboundOutreach`—साथ ही पहले से लाइव ट्रैफ़िक दे रहे डोमेन पर कोई भी DNS लेखन।

## अपने एजेंट को पूरी सूची से जोड़ें

ऊपर का हर टूल एक कनेक्शन के पीछे लाइव है: `https://api.namefi.io/mcp`। यदि आपने अभी तक इसे सेट नहीं किया है, तो [Namefi पर अपने AI एजेंट से डोमेन कैसे रजिस्टर करें](/hi/blog/ai-agent-register/) छह अलग क्लाइंट के सटीक कॉन्फ़िगरेशन बताता है और [डोमेन के लिए llms.txt](/hi/blog/llms-txt/) इसके नीचे की खोज परत समझाता है।

**[Namefi API कुंजी बनाएँ](https://namefi.io/api-key)** और अपने एजेंट को सर्वर की ओर पॉइंट करें—ऊपर दिए टूल उसे वहाँ तैयार मिलेंगे।

## स्रोत और आगे पढ़ने के लिए

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP सर्वर URL, ट्रांसपोर्ट, प्रमाणीकरण और मुख्य ऑपरेशन संदर्भ—इस सूची का प्राथमिक स्रोत)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (Web3 भुगतान और आउटबाउंड लीड खोज को इनलाइन करने वाला एकल-फ़ाइल संदर्भ)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (x402, MPP, EIP-712 और SIWE प्रवाहों का विस्तृत वर्णन)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP खोज डिस्क्रिप्टर: सर्वर नाम, URL, ट्रांसपोर्ट और प्रमाणीकरण प्रकार)
- Namefi — [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json) (मशीन-पठनीय OpenAPI 3 स्पेसिफ़िकेशन—ऊपर क्षमता सूची के हर `operationId` और एंडपॉइंट का स्रोत)
- Namefi — [docs.namefi.io: प्रमाणीकरण](https://docs.namefi.io/docs/02-authentication.mdx#:~:text=The%20Namefi%20API%20supports%20three%20authentication%20methods) (API कुंजी, EIP-712 और SIWE प्रमाणीकरण तरीके; हर ऑपरेशन की प्रमाणीकरण आवश्यकता; ERC-1271/EIP-7702 प्रत्यायोजन)
- Namefi — [docs.namefi.io: डोमेन रजिस्टर करें](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (रजिस्ट्रेशन अनुरोध फ़ील्ड, पोलिंग प्रवाह और ऑर्डर स्थिति मान)
- Namefi — [docs.namefi.io: अपना बैलेंस प्रबंधित करें](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (NFSC बैलेंस और फ़ॉसेट एंडपॉइंट)
- Model Context Protocol — [Model Context Protocol क्या है?](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (प्रोटोकॉल अवलोकन)
- llmstxt.org — [/llms.txt फ़ाइल](https://llmstxt.org) (Namefi की फ़ाइल द्वारा अपनाई गई खोज प्रथा का स्पेसिफ़िकेशन और तर्क)
- x402.org — [x402 प्रोटोकॉल](https://x402.org) (`registerDomainX402` के आधार में मौजूद HTTP 402-आधारित स्टेबलकॉइन भुगतान मानक)
- Ethereum Improvement Proposals — [ERC-721: नॉन-फंजीबल टोकन मानक](https://eips.ethereum.org/EIPS/eip-721) (Namefi के डोमेन NFT द्वारा लागू टोकन मानक)
