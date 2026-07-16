---
title: "Namefi पर अपने AI एजेंट से डोमेन कैसे रजिस्टर करें"
date: '2026-07-10'
language: 'hi'
tags: ['ai-agents', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['nirmit-buddhiraja']
draft: false
format: guide
ogImage: ../../assets/ai-agent-register-og.jpg
description: "MCP, REST या वॉलेट चेकआउट के जरिए किसी भी AI एजेंट—Claude, Codex, Cursor और अन्य—से Namefi पर डोमेन रजिस्टर करने की प्रामाणिक गाइड।"
keywords: ["AI एजेंट से डोमेन रजिस्टर करें", "Namefi ट्यूटोरियल", "Claude डोमेन रजिस्ट्रेशन", "Codex डोमेन रजिस्ट्रेशन", "Cursor MCP डोमेन", "Windsurf MCP डोमेन", "Gemini CLI MCP डोमेन", "एजेंट से डोमेन रजिस्टर करने का तरीका", "x-api-key", "MCP सर्वर", "वॉलेट चेकआउट", "Namefi MCP डोमेन रजिस्ट्रेशन", "AI एजेंट से Namefi डोमेन खरीदें", "डोमेन रजिस्ट्रेशन MCP ट्यूटोरियल"]
relatedArticles:
  - /hi/blog/claude-mcp-domains/
  - /hi/blog/cf-namecom-namefi/
  - /hi/blog/ai-domain-platforms/
  - /hi/blog/agent-native/
  - /hi/blog/airo-vs-namefi/
relatedTopics:
  - /hi/topics/domain-tokenization/
  - /hi/topics/domain-basics/
relatedSeries:
  - /hi/series/tokenize-your-com/
  - /hi/series/blockchain-concepts/
relatedGlossary:
  - /hi/glossary/ai-agent/
  - /hi/glossary/registrar/
  - /hi/glossary/wallet/
  - /hi/glossary/x402/
  - /hi/glossary/tokenized-domain/
---

अगर आप चाहते हैं कि कोई [AI एजेंट](/hi/glossary/ai-agent/)—किसी एक खास विक्रेता का ही नहीं, बल्कि कोई भी AI एजेंट—आपके लिए [Namefi](https://namefi.io) पर वास्तविक डोमेन रजिस्टर करे, तो यह वह पेज है जिसे आपको बुकमार्क करना चाहिए। Namefi एक [ICANN](/hi/glossary/icann/)-मान्यताप्राप्त [रजिस्ट्रार](/hi/glossary/registrar/) है। यह गाइड उन बुनियादी प्रक्रियाओं को समझाती है जो आपके इस्तेमाल किए जाने वाले क्लाइंट से स्वतंत्र हैं, और फिर आज लोगों द्वारा वास्तव में इस्तेमाल किए जाने वाले छह एजेंट—Claude Desktop, Claude Code, OpenAI Codex, Cursor, Windsurf और Gemini CLI—के लिए सटीक व अलग-अलग सत्यापित सेटअप चरण देती है। अगर आपका एजेंट इस सूची में नहीं है, तो गाइड के अंत में एक सीधा REST तरीका दिया गया है। वह HTTP अनुरोध कर सकने वाले किसी भी सिस्टम के साथ काम करता है, क्योंकि इसी उद्देश्य से Namefi का पूरा API भी सादे टेक्स्ट में प्रकाशित किया गया है।

इस गाइड को Namefi टीम ने लिखा है और वही इसका रखरखाव करती है, इसलिए हर चरण का Namefi वाला हिस्सा प्रथम-पक्ष जानकारी पर आधारित है। यह उसी API को इंसानों के पढ़ने लायक रूप में समझाती है जिसे हम एजेंटों के लिए [namefi.io/llms.txt](https://namefi.io/llms.txt) और [docs.namefi.io](https://docs.namefi.io) पर प्रकाशित करते हैं। हर एजेंट विक्रेता के सेटअप को इस गाइड के प्रकाशन की तारीख पर उस विक्रेता के अपने नवीनतम दस्तावेज़ों के आधार पर सत्यापित किया गया था। जहां विक्रेता के दस्तावेज़ स्पष्ट जवाब नहीं देते, वहां अनुमान लगाने के बजाय इसे साफ तौर पर बताया गया है।

अगर आप पहले से जानते हैं कि आप Claude का इस्तेमाल कर रहे हैं और वास्तविक ट्रांसक्रिप्ट के साथ पूरी, टिप्पणियों वाली प्रक्रिया चाहते हैं, तो [Claude से डोमेन खरीदें: Namefi MCP चरण-दर-चरण गाइड](/hi/blog/claude-mcp-domains/) यहां दिए गए संक्षिप्त Claude अनुभागों से अधिक विस्तार में जाती है। यह पेज मुख्य केंद्र है; वह गाइड और इसमें जगह-जगह दिए गए दूसरे लिंक इससे जुड़े विस्तृत संदर्भ हैं।

## “AI एजेंट से डोमेन रजिस्टर करने” का असल मतलब क्या है

किसी एजेंट के लिए आपकी ओर से डोमेन रजिस्टर करने के लिए—और वह भी आपके हाथ से कोई फ़ॉर्म भरवाए बिना—दो बातें जरूरी हैं। पहली, एजेंट के पास Namefi के API को *खोजने और कॉल करने* का तरीका होना चाहिए। यह तरीका [Model Context Protocol](https://modelcontextprotocol.io) (MCP) हो सकता है—एक खुला मानक, जो AI क्लाइंट को बाहरी टूल सर्वर से जुड़कर कॉल किए जा सकने वाले ऑपरेशनों की तय सूची देखने देता है—या फिर सादा HTTP अनुरोध, अगर एजेंट बातचीत-आधारित होने के बजाय स्क्रिप्ट से चलता है। दूसरी, एजेंट को *खर्च करने की अनुमति* चाहिए—यानी फंड वाले बैलेंस से जुड़ी API key, या ऐसा क्रिप्टो [वॉलेट](/hi/glossary/wallet/) जो उसी समय भुगतान पर हस्ताक्षर कर सके। इस गाइड की हर चीज इन्हीं दो हिस्सों में से किसी एक से जुड़ी है।

Namefi अपने पूरे API के लिए Streamable HTTP ट्रांसपोर्ट पर एक ही MCP सर्वर चलाता है: `https://api.namefi.io/mcp`। कोई एजेंट—या उसे कॉन्फ़िगर करने वाला व्यक्ति—इस पेज को पढ़े बिना भी इसे खोज सकता है। हम [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) पर मशीन-पठनीय विवरण प्रकाशित करते हैं, जिसमें सर्वर का नाम `namefi-api` और उसका ट्रांसपोर्ट `streamable-http` बताया गया है। नीचे दिया हर क्लाइंट इसी URL से जुड़ता है; फर्क सिर्फ इस बात में है कि हर क्लाइंट की कॉन्फ़िगरेशन फ़ाइल या कमांड लाइन में उस URL को कैसे बताया जाता है।

## सभी एजेंटों के लिए समान पांच चरण

नीचे दिए गए हर एजेंट-विशिष्ट अनुभाग के पीछे यही क्रम काम करता है। इसे समझ लेने के बाद हर एजेंट के निर्देशों में मूल सवाल बस इतना रह जाता है: “इस खास टूल में चरण 2 कैसे पूरा करूं?”

1. **क्रेडेंशियल लें।** एक [API key](https://namefi.io/api-key) बनाएं—`nfk_` से शुरू होने वाली स्ट्रिंग, जो रजिस्ट्रेशन, DNS रिकॉर्ड बनाने, अपडेट करने और हटाने सहित हर ऑपरेशन के लिए काम करती है। यह key उसे बनाने वाले वॉलेट की अनुमतियां अपनाती है, इसलिए इसे उसी वॉलेट से बनाएं जिसके पास डोमेन का स्वामित्व होना चाहिए। अगर आप Namefi API key रखना ही नहीं चाहते, तो नीचे दिए वॉलेट-भुगतान वाले तरीके पर जाएं—उसके लिए किसी खाते की जरूरत नहीं है।
2. **अपने एजेंट को MCP सर्वर से जोड़ें।** अपने क्लाइंट को `https://api.namefi.io/mcp` पर भेजें और `x-api-key` हेडर में अपनी key दें। सटीक सिंटैक्स हर क्लाइंट के लिए अलग है—नीचे अपने एजेंट का अनुभाग देखें।
3. **डोमेन खोजें और कीमत जानें।** सामान्य भाषा में पूछें कि कोई नाम उपलब्ध है या नहीं। इससे `checkAvailability` ऑपरेशन (`GET /v-next/search/availability?domain=…`) कॉल होता है, जिसके लिए कोई ऑथेंटिकेशन जरूरी नहीं है। कई संभावित नामों को एक साथ जांचने के लिए इसका बल्क रूप भी उपलब्ध है।
4. **रजिस्टर करें, फिर स्थिति जांचते रहें।** पुष्टि करने पर एजेंट `registerDomain` (`POST /v-next/orders/register-domain`) भेजता है। अगर आप उसी कॉल में DNS भी सेट करना चाहते हैं, तो संयुक्त `register-domain/records` रूप इस्तेमाल किया जाता है। रजिस्ट्रेशन एसिंक्रोनस है—अनुरोध बॉडी में `normalizedDomainName` और `durationInYears` दिए जाते हैं। `register-domain/records` एंडपॉइंट इसके अलावा `records` ऐरे भी स्वीकार करता है (हर रिकॉर्ड के लिए `name`, `type`, `rdata`, `ttl`), ताकि ऑर्डर पूरा होते ही DNS लिख दिया जाए। एजेंट (या आप) `getOrder` (`GET /v-next/orders/{orderId}`) से स्थिति तब तक जांचते हैं, जब तक वह अंतिम स्थिति में न पहुंच जाए: `SUCCEEDED`, `FAILED`, `CANCELLED` या `PARTIALLY_COMPLETED`।
5. **DNS कॉन्फ़िगर करें और सत्यापित करें।** `createDnsRecord` (`POST /v-next/dns/records`) से [DNS रिकॉर्ड](/hi/glossary/dns-record-types/) जोड़ें या बदलें, जरूरत पड़ने पर [नेमसर्वर](/hi/glossary/nameserver/) स्तर की डेलिगेशन सेट करें, और डोमेन के रिज़ॉल्व होने की पुष्टि करने से पहले [DNS प्रोपेगेशन](/hi/glossary/dns-propagation/) के लिए कुछ मिनट दें।

रजिस्ट्रेशन अनुरोध हर डोमेन के लिए अलग सेटिंग देने वाला `domainSetupOptions` ऑब्जेक्ट भी स्वीकार करता है—`autoPark`, `autoEns`, `autoRenew`, `dnssec` और `keepExistingNameservers`। आखिरी विकल्प Namefi को डोमेन की मौजूदा नेमसर्वर डेलिगेशन को बदलने के बजाय जस का तस छोड़ने को कहता है; यह तब उपयोगी है जब आप ऐसा डोमेन रजिस्टर कर रहे हों जिसे तुरंत कहीं और से रिज़ॉल्व होते रहना है। वैकल्पिक `nftReceivingWallet` फ़ील्ड तय करता है कि डोमेन के स्वामित्व का टोकन किस वॉलेट में पहुंचेगा। इसे छोड़ दें, तो डोमेन Base पर NFT के रूप में आपकी API key से जुड़े वॉलेट में रजिस्टर होता है।

## हर एजेंट के लिए सेटअप तालिका

| एजेंट | कनेक्शन का तरीका | कॉन्फ़िगरेशन कहां रहती है | कस्टम ऑथ हेडर समर्थित | किससे सत्यापित किया गया |
| --- | --- | --- | --- | --- |
| Claude Code | MCP, Streamable HTTP | `claude mcp add` CLI कमांड (`~/.claude.json` या `.mcp.json` में लिखती है) | हां—`--header` फ़्लैग | [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp), 2026-07-10 को सत्यापित |
| Claude Desktop / claude.ai | Custom Connector के जरिए MCP, Streamable HTTP | Settings → Connectors → Add custom connector | सर्वर द्वारा संचालित ऑथ प्रॉम्प्ट (सर्वर की मांग के अनुसार OAuth, API key या क्रेडेंशियल) | [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers), 2026-07-10 को सत्यापित |
| OpenAI Codex CLI | MCP, Streamable HTTP | `~/.codex/config.toml`, `[mcp_servers.<name>]` तालिका | हां—`http_headers` (स्थिर) या `env_http_headers` (एनवायरनमेंट वेरिएबल से) | [learn.chatgpt.com/docs/extend/mcp](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (`developers.openai.com/codex/mcp` का मौजूदा रीडायरेक्ट गंतव्य), 2026-07-10 को सत्यापित |
| Cursor | MCP, Streamable HTTP | `.cursor/mcp.json` (प्रोजेक्ट) या `~/.cursor/mcp.json` (ग्लोबल) | हां—`${env:VAR}` इंटरपोलेशन वाला `headers` ऑब्जेक्ट | [cursor.com/docs/mcp](https://cursor.com/docs/mcp), 2026-07-10 को सत्यापित |
| Windsurf (Cascade) | MCP, Streamable HTTP | `~/.codeium/windsurf/mcp_config.json` | हां—`${env:VAR}` इंटरपोलेशन के साथ `serverUrl` एंट्री पर `headers` ऑब्जेक्ट | [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (इस गाइड के प्रकाशन की तारीख पर यह URL `docs.devin.ai/desktop/cascade/mcp` पर रीडायरेक्ट होता है—नीचे Windsurf अनुभाग देखें), 2026-07-10 को सत्यापित |
| Gemini CLI | MCP, Streamable HTTP | `~/.gemini/settings.json` (यूज़र) या `.gemini/settings.json` (प्रोजेक्ट) | हां—`httpUrl` एंट्री पर `headers` ऑब्जेक्ट | [geminicli.com/docs/tools/mcp-server](https://geminicli.com/docs/tools/mcp-server/), 2026-07-10 को सत्यापित |
| कोई अन्य MCP क्लाइंट | MCP, Streamable HTTP | उस क्लाइंट के दस्तावेज़ों में बताया गया कॉन्फ़िगरेशन फ़ॉर्मैट | क्लाइंट पर निर्भर—Namefi का सर्वर पक्ष नहीं बदलता | [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) |
| कोई भी स्क्रिप्ट या गैर-MCP एजेंट | सीधा REST | लागू नहीं—सीधे HTTPS कॉल | हां—बदलाव करने वाले हर कॉल पर `x-api-key` हेडर | [namefi.io/llms.txt](https://namefi.io/llms.txt), [docs.namefi.io](https://docs.namefi.io) |

ऊपर की हर पंक्ति एक ही सर्वर और ऑपरेशनों के एक ही समूह से जुड़ती है। हर एजेंट में सिर्फ वह सिंटैक्स बदलता है जिससे उस खास क्लाइंट को बताया जाता है: “यह रहा रिमोट MCP सर्वर और यह रहा इसके साथ भेजा जाने वाला हेडर।”

**हर बार वही टेस्ट प्रॉम्प्ट।** नीचे हर एजेंट को जोड़ने के बाद यही प्रॉम्प्ट चलाएं, ताकि आप अलग-अलग क्लाइंट के नतीजों की तुलना कर सकें:

> “जांचें कि `example.com` Namefi पर रजिस्टर करने के लिए उपलब्ध है या नहीं, और बताएं कि यह पता लगाने के लिए आपने कौन-सा टूल या ऑपरेशन कॉल किया। अभी कुछ भी रजिस्टर न करें।”

यह केवल पढ़ने वाला कॉल है—`checkAvailability` के लिए ऑथेंटिकेशन जरूरी नहीं है—इसलिए कोई फंड जोड़ने से पहले भी नए जुड़े एजेंट पर इसे सुरक्षित रूप से चलाया जा सकता है। साथ ही, इससे तुरंत पता चल जाता है कि कनेक्शन और टूल सूची काम कर रहे हैं या नहीं।

## Claude Desktop और claude.ai

Claude Desktop और claude.ai **Custom Connectors** के जरिए रिमोट MCP सर्वर से जुड़ते हैं। Settings खोलें, Connectors पर जाएं, “Add custom connector” चुनें और सर्वर URL के रूप में `https://api.namefi.io/mcp` दर्ज करें। Add पर क्लिक करने के बाद Claude आपसे ऑथेंटिकेशन पूरा करने को कहता है। Anthropic के दस्तावेज़ बताते हैं कि इस चरण में आम तौर पर “OAuth, API keys या username/password combinations” इस्तेमाल हो सकते हैं; सटीक प्रॉम्प्ट इस पर निर्भर करता है कि जुड़ा हुआ सर्वर क्या मांगता है।

<!-- TODO: verify — the exact field Claude Desktop's Custom Connector screen presents for an x-api-key-style header --> अगर आपके Desktop सेटअप में key चिपकाने की कोई स्पष्ट जगह नहीं दिखती, तो आज बदलाव करने वाले ऑपरेशनों के लिए Claude Code (अगला अनुभाग) सत्यापित तरीका है। उपलब्धता खोज जैसे केवल-पढ़ने वाले टूल connector पर बिना key के भी काम करते हैं। जुड़ने के बाद connector का प्रवाह कैसा दिखता है, इसके साथ पूरी प्रक्रिया [Claude से डोमेन खरीदें: Namefi MCP चरण-दर-चरण गाइड](/hi/blog/claude-mcp-domains/) में दी गई है।

## Claude Code

Claude Code के अपने दस्तावेज़ कस्टम हेडर वाले रिमोट HTTP MCP सर्वर को जोड़ने का सटीक, सामान्य सिंटैक्स देते हैं:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

टर्मिनल में अपनी असली key डालकर यह कमांड एक बार चलाएं। डिफ़ॉल्ट रूप से यह सर्वर को **local** scope में लिखता है—यानी मौजूदा प्रोजेक्ट में सिर्फ आपके लिए उपलब्ध (Claude Code के पुराने संस्करण इस scope को “project” कहते थे)। कनेक्शन को अपनी मशीन के हर प्रोजेक्ट में उपलब्ध कराना हो, तो `--scope user` जोड़ें। प्रोजेक्ट के सभी लोगों के साथ committed `.mcp.json` फ़ाइल के जरिए इसे साझा करना हो, तो `--scope project` जोड़ें। `claude mcp list` से कनेक्शन की पुष्टि करें और सेशन के अंदर `/mcp` से उपलब्ध टूल की मौजूदा संख्या जांचें।

## OpenAI Codex CLI

Codex CLI MCP कॉन्फ़िगरेशन को TOML फ़ाइल में रखता है—डिफ़ॉल्ट रूप से `~/.codex/config.toml` में, या भरोसेमंद प्रोजेक्ट के लिए उसी प्रोजेक्ट की `.codex/config.toml` में। हर सर्वर की अपनी तालिका होती है और ट्रांसपोर्ट का अनुमान मौजूद keys से लगाया जाता है: `command` key का अर्थ स्थानीय stdio सर्वर है, जबकि `url` key का अर्थ Streamable HTTP है। Codex के दस्तावेज़ साफ बताते हैं कि तालिका का नाम अंडरस्कोर के साथ `mcp_servers` होना चाहिए—`mcp-servers` या मिलते-जुलते रूप बिना कोई संदेश दिए अनदेखे कर दिए जाते हैं।

```toml
# ~/.codex/config.toml
[mcp_servers.namefi]
url = "https://api.namefi.io/mcp"
env_http_headers = { "x-api-key" = "NAMEFI_API_KEY" }
```

यह रूप key को फ़ाइल में लिखने के बजाय `NAMEFI_API_KEY` नाम के एनवायरनमेंट वेरिएबल से लेता है—Codex चलाने से पहले इसे अपने शेल में सेट करें। अगर आप key को सीधे लिखना चाहें (ऐसी फ़ाइल के लिए अनुशंसित नहीं जिसे आप गलती से commit कर सकते हैं), तो इसका स्थिर रूप `http_headers = { "x-api-key" = "YOUR_KEY" }` है। Codex `Authorization: Bearer …` जैसे ऑथ के लिए खास तौर पर `bearer_token_env_var` फ़ील्ड भी देता है, लेकिन Namefi के `x-api-key` हेडर के लिए bearer वाला फ़ील्ड नहीं, बल्कि सामान्य `http_headers` / `env_http_headers` फ़ील्ड चाहिए।

## Cursor

Cursor MCP सर्वर की परिभाषाएं `mcp.json` से पढ़ता है—आपकी रिपॉज़िटरी के मूल फ़ोल्डर में प्रोजेक्ट-स्तरीय `.cursor/mcp.json` या हर जगह लागू होने वाली ग्लोबल `~/.cursor/mcp.json`। Cursor के दस्तावेज़ सीधे रिमोट सर्वर का फ़ॉर्मैट देते हैं। इसमें हेडर-आधारित ऑथ और एनवायरनमेंट-वेरिएबल इंटरपोलेशन शामिल हैं, ताकि key को फ़ाइल में न रखना पड़े:

```json
{
  "mcpServers": {
    "namefi": {
      "url": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

कनेक्शन के समय `${env:NAMEFI_API_KEY}` उस एनवायरनमेंट वेरिएबल में मौजूद मान में बदल जाता है। इसी सेटअप का संक्षिप्त रूप [Namefi MCP क्विकस्टार्ट: Claude Code, Cursor और Windsurf](/hi/blog/mcp-quickstart/) में देखें।

## Windsurf (Cascade)

Windsurf का MCP इंटीग्रेशन—जिसे प्रोडक्ट में **Cascade** कहा जाता है—अपनी सर्वर सूची `~/.codeium/windsurf/mcp_config.json` से पढ़ता है। रिमोट HTTP सर्वर `command` के बजाय `serverUrl` फ़ील्ड इस्तेमाल करते हैं। इसके साथ Cursor जैसा `headers` ऑब्जेक्ट और `${env:VAR}` इंटरपोलेशन होता है:

```json
{
  "mcpServers": {
    "namefi": {
      "serverUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

एक बात साफ तौर पर बताना जरूरी है: इस गाइड के प्रकाशन की तारीख पर `docs.windsurf.com/windsurf/cascade/mcp`, `docs.devin.ai/desktop/cascade/mcp` पर रीडायरेक्ट होता है। Windsurf के दस्तावेज़ अब Cognition के Devin प्रोडक्ट-दस्तावेज़ डोमेन पर हैं, और वह पेज “Devin Desktop” के साथ “Windsurf” और “Cascade” दोनों का उल्लेख करता है। ऊपर दिया कॉन्फ़िगरेशन फ़ॉर्मैट उसी मौजूदा पेज में दर्ज है। अगर आप Windsurf का पुराना बिल्ड इस्तेमाल कर रहे हैं, तो फ़ील्ड के नाम समान होने चाहिए, लेकिन अपने संस्करण की इन-ऐप सहायता में दिए दस्तावेज़ों के URL से इसकी पुष्टि करें।

## Gemini CLI

Gemini CLI MCP सर्वर को `settings.json` से पढ़ता है—यूज़र-स्तरीय फ़ाइल `~/.gemini/settings.json` या प्रोजेक्ट-स्तरीय फ़ाइल `.gemini/settings.json`, जो सिर्फ उस प्रोजेक्ट में लागू होती है। रिमोट-सर्वर फ़ॉर्मैट `url` के बजाय `httpUrl` इस्तेमाल करता है:

```json
{
  "mcpServers": {
    "namefi": {
      "httpUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "YOUR_KEY"
      }
    }
  }
}
```

Gemini CLI के दस्तावेज़ `timeout` फ़ील्ड भी बताते हैं (मिलीसेकंड में, डिफ़ॉल्ट 600,000), अगर किसी खास टूल कॉल को सामान्य से ज्यादा समय चाहिए। रजिस्ट्रेशन की स्थिति बार-बार जांचने में इसकी जरूरत नहीं पड़नी चाहिए, क्योंकि क्लाइंट हर अलग कॉल का ही इंतजार करता है, पूरी जांच प्रक्रिया का नहीं।

## कोई अन्य MCP-सक्षम एजेंट

अगर आपका एजेंट MCP को सपोर्ट करता है, लेकिन ऊपर दिए छह में से नहीं है, तो क्लाइंट चाहे जो हो, सर्वर वाला हिस्सा बिल्कुल समान रहता है। उसे Streamable HTTP पर `https://api.namefi.io/mcp` की ओर भेजें और कस्टम हेडर के रूप में `x-api-key: YOUR_KEY` दें। अपने क्लाइंट की खास कॉन्फ़िगरेशन फ़ाइल या कमांड सिंटैक्स के लिए उसके अपने दस्तावेज़ देखें। [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) पर मौजूद खोज विवरण इसी लिए है कि कोई एजेंट (या उसे कॉन्फ़िगर करने वाला व्यक्ति) इंसान से विवरण कॉपी-पेस्ट कराए बिना सर्वर URL, ट्रांसपोर्ट और ऑथ की जरूरतें खोज सके।

अगर आपका क्लाइंट सिर्फ **local (stdio) MCP server** सपोर्ट करता है और सीधे रिमोट HTTP या SSE नहीं, तो एक उपयोगी तरीका जान लें: समुदाय का `mcp-remote` पैकेज रिमोट Streamable HTTP सर्वर को ऐसी स्थानीय प्रक्रिया से जोड़ता है जिसे आपका क्लाइंट सामान्य रूप से चला सके, और आपके कॉन्फ़िगर किए गए हेडर आगे भेजता है। यह तृतीय-पक्ष सेतु है, Namefi का प्रकाशित तरीका नहीं, इसलिए यह गाइड Namefi के अपने दस्तावेज़ों के आधार पर इसे सत्यापित नहीं कर सकती। इसे सिर्फ तब वैकल्पिक उपाय मानें जब आपका खास क्लाइंट वास्तव में मूल रूप से रिमोट HTTP सपोर्ट न करता हो—डिफ़ॉल्ट विकल्प के रूप में नहीं। <!-- TODO: verify — an exact mcp-remote invocation for Namefi's server if a client without native Streamable HTTP support needs it -->

## MCP बिल्कुल नहीं है: सीधा REST तरीका

ऊपर बताया हर ऑपरेशन एक सामान्य HTTPS एंडपॉइंट भी है। हर एंडपॉइंट के दस्तावेज़ [namefi.io/llms.txt](https://namefi.io/llms.txt) पर और पूरे विस्तार में [docs.namefi.io](https://docs.namefi.io) पर मिलते हैं। HTTP कॉल कर सकने वाला लेकिन MCP न समझने वाला कोई भी एजेंट फ़्रेमवर्क—कस्टम स्क्रिप्ट, अलग एजेंट रनटाइम या CI जॉब—इसी प्रक्रिया को सीधे चला सकता है:

```bash
# 1. Check availability (no auth required)
curl "https://api.namefi.io/v-next/search/availability?domain=example.com"

# 2. Register (requires x-api-key)
curl -X POST "https://api.namefi.io/v-next/orders/register-domain" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"normalizedDomainName": "example.com", "durationInYears": 1}'

# 3. Poll the order until it reaches a terminal status
curl "https://api.namefi.io/v-next/orders/{orderId}" \
  -H "x-api-key: YOUR_KEY"
```

llms.txt एक सादे टेक्स्ट का मानक है—ऐसी मशीन-पठनीय अनुक्रमणिका जिसे कोई साइट अपने मूल पते पर खास तौर पर इसलिए प्रकाशित करती है, ताकि AI एजेंट दिखाई देने वाले दस्तावेज़ी पेजों को खंगाले बिना समझ सके कि API क्या करता है। Namefi की फ़ाइल इतनी छोटी है कि अगर आप ऊपर के संक्षिप्त सारांश के बजाय पूरा संस्करण देखना चाहें, तो इसे सीधे [namefi.io/llms.txt](https://namefi.io/llms.txt) पर पढ़ सकते हैं। इस मानक के बारे में और जानने के लिए [डोमेन के लिए llms.txt: ऐसा API जिसे कोई भी AI एजेंट पढ़ सके](/hi/blog/llms-txt/) देखें।

## भुगतान: API key या वॉलेट चेकआउट

ऊपर के सभी अनुभाग मानते हैं कि API key से किए गए खर्च का भुगतान राशि वाले NFSC (Namefi Service Credit) बैलेंस से किया जाएगा। इसे किसी भी समय `GET /v-next/balance` (`x-api-key` जरूरी) पर जांचें। डेवलपमेंट एनवायरनमेंट में faucet एंडपॉइंट से या प्रोडक्शन में Namefi डैशबोर्ड से बैलेंस बढ़ाएं। <!-- TODO: confirm with team — the exact production NFSC top-up flow: accepted payment methods, and whether it's purchasable through chat/API or only the dashboard UI -->

Namefi क्रिप्टो वॉलेट से और **बिना किसी Namefi खाते के** डोमेन रजिस्टर करने का तरीका भी देता है। यह [x402](/hi/glossary/x402/) प्रोटोकॉल इस्तेमाल करता है: एजेंट का वॉलेट EIP-3009 ऑथराइज़ेशन पर हस्ताक्षर करता है; अगर अभी भुगतान जुड़ा नहीं है तो API HTTP 402 जवाब में कीमत बताता है; और वैध हस्ताक्षरित भुगतान मिलने पर रजिस्ट्रेशन पूरा हो जाता है—आमतौर पर USDC जैसे [स्टेबलकॉइन](/hi/glossary/stablecoin/) में। इसके साथ MPP (Machine Payable Protocol) का चुनौती-जवाब रूप और उन वॉलेटों के लिए हाथ से EIP-712 हस्ताक्षर करने का तरीका भी है जो इन दोनों छोटे रास्तों में से कोई इस्तेमाल नहीं करते। यह वॉलेट-केंद्रित तरीका ठीक उन्हीं एजेंटों के लिए महत्वपूर्ण है जिनकी चर्चा इस गाइड में है: यह खाता बनाने का चरण पूरी तरह हटा देता है, इसलिए स्वायत्त प्रक्रिया को कभी API key रखने—या उजागर करने—की जरूरत नहीं पड़ती। इस प्रक्रिया की अलग गाइड के लिए [क्रिप्टो वॉलेट से डोमेन का भुगतान करें: खाते की जरूरत नहीं](/hi/blog/wallet-checkout/) देखें।

## एजेंट को खरीदने की शक्ति देने से पहले सुरक्षा सीमाएं

डोमेन रजिस्टर कर सकने वाला एजेंट पैसे भी खर्च कर सकता है और किसी चालू साइट का DNS दोबारा लिख सकता है। इसलिए कुछ फैसले डिफ़ॉल्ट पर छोड़ने के बजाय सोच-समझकर लेने चाहिए:

- **API key को न्यूनतम जरूरी वॉलेट तक सीमित रखें।** Key उसे बनाने वाले वॉलेट की अनुमतियां अपनाती है। इसे उस वॉलेट से बनाएं जिसके पास नए रजिस्ट्रेशन का स्वामित्व होना चाहिए, न कि ऐसे वॉलेट से जिसमें वे संपत्तियां हैं जिनके लिए आप एजेंट की key उजागर नहीं करना चाहते।
- **एजेंट के खर्च की सीमा तय करें।** NFSC बैलेंस अपने आप में खर्च की सीमा है। बड़ा स्थायी बैलेंस रखने के बजाय इसमें सिर्फ उतनी राशि डालें जितनी एजेंट को बिना निगरानी खर्च करने देने में आप सहज हों।
- **तय करें कि इंसान किस चरण में शामिल रहेगा।** उपलब्धता खोज जैसे केवल-पढ़ने वाले ऑपरेशनों को ऑथेंटिकेशन की जरूरत नहीं होती और उनमें कोई जोखिम नहीं होता। जैसे ही कोई कॉल `registerDomain` भेजता है, auto-renew बदलता है या पहले से ट्रैफ़िक संभाल रहे डोमेन पर DNS रिकॉर्ड लिखता है, एजेंट को अपने आप आगे बढ़ने देने के बजाय स्पष्ट पुष्टि जरूरी कर दें।
- **पुष्टि करने से पहले DNS बदलावों की समीक्षा करें,** जैसे आप किसी भी बुनियादी ढांचे के बदलाव की करेंगे। Namefi का सत्यापन खराब फ़ॉर्मैट वाले रिकॉर्ड को चुपचाप स्वीकार करने के बजाय अस्वीकार करता है (नीचे समस्या-निवारण तालिका देखें), लेकिन सत्यापन फ़ॉर्मैटिंग की गलतियां पकड़ता है—सही सिंटैक्स वाले गलत मान को नहीं।

[एजेंट-नेटिव डोमेन रजिस्ट्रार क्या है?](/hi/blog/agent-native/) किसी भी रजिस्ट्रार के एजेंट-केंद्रित इंटरफ़ेस—Namefi सहित—का मूल्यांकन करने के लिए अधिक विस्तृत सूची देती है: खोजे जा सकने की क्षमता, मशीन-पठनीय त्रुटियां और ऐसे भुगतान मार्ग जिनमें यह मानकर न चला जाए कि इंसान क्रेडिट कार्ड पकड़े बैठा है।

## समस्या निवारण

| लक्षण | संभावित कारण | समाधान |
| --- | --- | --- |
| किसी भी बदलाव करने वाले कॉल पर `401 UNAUTHORIZED` | API key अमान्य है, समाप्त हो चुकी है या ऐसे वॉलेट से बनी है जिसके पास संबंधित डोमेन का स्वामित्व नहीं है | डोमेन के मालिक (या भविष्य के मालिक) वॉलेट से [namefi.io/api-key](https://namefi.io/api-key) पर नई key बनाएं |
| `403 FORBIDDEN` | Key वैध है, लेकिन उसके वॉलेट के पास इस खास डोमेन का स्वामित्व नहीं है | फिर से कोशिश करने से पहले स्वामित्व जांचें |
| Codex आपकी `[mcp_servers.namefi]` एंट्री को अनदेखा करता है | तालिका के नाम में टाइपो है—Codex को `mcp-servers` नहीं, अंडरस्कोर वाला `mcp_servers` चाहिए | `config.toml` में तालिका का शीर्षक ठीक करें |
| Cursor या Windsurf सर्वर को disconnected दिखाता है | `headers` ऑब्जेक्ट का फ़ॉर्मैट गलत है या `${env:VAR}` किसी ऐसे वेरिएबल को संदर्भित कर रहा है जो सेट नहीं है | जांचें कि JSON वैध है और संदर्भित एनवायरनमेंट वेरिएबल उस शेल में सचमुच एक्सपोर्ट हुआ है जिससे एडिटर शुरू किया गया था |
| Gemini CLI को कॉन्फ़िगरेशन नहीं मिलती | गलत `settings.json` बदली गई है—यूज़र-स्तरीय और प्रोजेक्ट-स्तरीय फ़ाइलें अलग हैं | पुष्टि करें कि आपका आशय `~/.gemini/settings.json` से था या मौजूदा प्रोजेक्ट की `.gemini/settings.json` से |
| रजिस्ट्रेशन ऑर्डर किसी गैर-अंतिम स्थिति में अटका है | यह सामान्य है—रजिस्ट्रेशन एसिंक्रोनस है | `getOrder` से स्थिति जांचते रहें; इसे तभी अटका मानें जब यह कभी `SUCCEEDED`, `FAILED`, `CANCELLED` या `PARTIALLY_COMPLETED` तक न पहुंचे |
| DNS रिकॉर्ड बनाना/बदलना सत्यापन त्रुटि के साथ अस्वीकार होता है | `zoneName` के अंत में dot है, या CNAME/MX/NS की `rdata` value में जरूरी trailing dot नहीं है | `zoneName` = अंत में dot नहीं; FQDN प्रकार की `rdata` value = अंत में dot जरूरी |
| रजिस्ट्रेशन पूरी तरह विफल होता है | भुगतान करने वाले वॉलेट में NFSC बैलेंस पर्याप्त नहीं है | `GET /v-next/balance` जांचें; faucet (dev) या डैशबोर्ड (प्रोडक्शन) से बैलेंस बढ़ाएं |
| एजेंट कहता है कि कोई डोमेन टूल उपलब्ध नहीं है | MCP सर्वर जुड़ा नहीं है या बदलाव वाले ऑपरेशनों के लिए जरूरी हेडर के बिना जुड़ा है | अपने क्लाइंट की कॉन्फ़िगरेशन फ़ाइल दोबारा जांचें या हेडर के साथ उसकी “add server” कमांड फिर चलाएं |

## अक्सर पूछे जाने वाले सवाल

### क्या मुझे एक ही एजेंट चुनकर उसी पर टिके रहना होगा?
नहीं। जुड़ने वाला क्लाइंट चाहे जो हो, MCP सर्वर और हर REST एंडपॉइंट समान रहते हैं। आप आज Claude Code और कल Cursor के लिए उसी API key तथा उसी NFSC बैलेंस से सेटअप चला सकते हैं—किसी माइग्रेशन की जरूरत नहीं है।

### इनमें से डोमेन रजिस्टर करने के लिए “सबसे अच्छा” एजेंट कौन-सा है?
इस काम के लिए क्षमताओं में कोई सार्थक अंतर नहीं है, क्योंकि हर क्लाइंट सर्वर के वही ऑपरेशन कॉल कर रहा है। फर्क सिर्फ हर क्लाइंट के अपने MCP कॉन्फ़िगरेशन सिंटैक्स में है। इसी कारण इस गाइड में हर क्लाइंट का अलग अनुभाग और वही समान टेस्ट प्रॉम्प्ट दिया गया है—इसे हर क्लाइंट पर एक बार चलाएं और ट्रांसक्रिप्ट की तुलना खुद करें।

### अगर मेरा एजेंट MCP को बिल्कुल सपोर्ट नहीं करता तो क्या होगा?
ऊपर दिया सीधा REST तरीका इस्तेमाल करें। MCP टूल कॉल जिस भी ऑपरेशन तक पहुंचता है, वह दस्तावेज़ित HTTPS एंडपॉइंट के रूप में भी उपलब्ध है। `namefi.io/llms.txt` खास तौर पर सादे-टेक्स्ट के प्रवेश बिंदु के रूप में बनाया गया है, जिसे एजेंट (या उसे कॉन्फ़िगर करने वाला व्यक्ति) ब्राउज़र के बिना पढ़ सकता है।

### क्या इस तरह रजिस्टर करने पर मेरा डोमेन अपने आप टोकनाइज़ हो जाता है?
हां, डिफ़ॉल्ट रूप से। अगर रजिस्ट्रेशन अनुरोध में `nftReceivingWallet` नहीं दिया गया है, तो डोमेन Base पर आपकी API key से जुड़े वॉलेट में NFT के रूप में रजिस्टर होता है। रजिस्ट्रेशन के समय इसे दूसरे वॉलेट में भेजा जा सकता है।

### क्या कोई एजेंट मेरे पास API key हुए बिना डोमेन रजिस्टर कर सकता है?
हां—वॉलेट से हस्ताक्षरित x402 checkout path को किसी Namefi खाते या API key की जरूरत नहीं, सिर्फ राशि वाला वॉलेट चाहिए। ऊपर भुगतान वाले अनुभाग में इस प्रक्रिया की जरूरी बातें दी गई हैं; पूरी प्रक्रिया के लिए [क्रिप्टो वॉलेट से डोमेन का भुगतान करें: खाते की जरूरत नहीं](/hi/blog/wallet-checkout/) देखें।

### क्या एजेंट से रजिस्टर करना Namefi की वेबसाइट से रजिस्टर करने की तुलना में महंगा है?
यह गाइड किसी दिशा में कीमत की तुलना का दावा नहीं करती। <!-- TODO: confirm with team — whether Namefi's MCP/API pricing matches its standard registration pricing, or differs --> किसी भी स्थिति में अनुरोध ब्राउज़र, स्क्रिप्ट या एजेंट के टूल कॉल से आए, हर तरीका उसी NFSC बैलेंस से भुगतान लेता है।

## उस एजेंट से शुरू करें जो आपके सामने पहले से खुला है

इस गाइड का इस्तेमाल करने के लिए छह क्लाइंट इंस्टॉल करने की जरूरत नहीं है—सिर्फ एक क्लाइंट और Namefi API key या राशि वाला वॉलेट चाहिए। ऊपर उस अनुभाग को चुनें जो उस एजेंट से मेल खाता है जिससे आप अभी बात कर रहे हैं, सेटअप चलाएं और टेस्ट प्रॉम्प्ट आजमाएं। उसके बाद इस पेज की बाकी प्रक्रिया—खोज, रजिस्ट्रेशन और DNS कॉन्फ़िगरेशन—उसी बातचीत में पूरी होती है।

**[Namefi API key बनाएं](https://namefi.io/api-key)** या [पूरे ट्रांसक्रिप्ट वाली Claude चरण-दर-चरण गाइड](/hi/blog/claude-mcp-domains/) और [एजेंट-नेटिव रजिस्ट्रारों की आमने-सामने तुलना](/hi/blog/cf-namecom-namefi/) में अधिक विस्तार से जाएं। इस गाइड के आधारभूत हिस्सों के लिए [Namefi MCP सर्वर: AI एजेंटों के लिए डोमेन टूल](/hi/blog/namefi-mcp/), [Namefi MCP क्विकस्टार्ट: Claude Code, Cursor और Windsurf](/hi/blog/mcp-quickstart/), [क्रिप्टो वॉलेट से डोमेन का भुगतान करें: खाते की जरूरत नहीं](/hi/blog/wallet-checkout/) और [डोमेन के लिए llms.txt: ऐसा API जिसे कोई भी AI एजेंट पढ़ सके](/hi/blog/llms-txt/) देखें।

## स्रोत और आगे पढ़ने के लिए

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP सर्वर URL, ट्रांसपोर्ट, ऑथेंटिकेशन, रजिस्ट्रेशन/DNS एंडपॉइंट संदर्भ और `domainSetupOptions` फ़ील्ड—इस गाइड के हर Namefi-विशिष्ट दावे का प्राथमिक स्रोत)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (x402, MPP और EIP-712 वॉलेट-भुगतान प्रक्रियाएं)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP खोज विवरण: सर्वर का नाम, URL, ट्रांसपोर्ट और ऑथ का प्रकार)
- Namefi — [docs.namefi.io: ऑथेंटिकेशन](https://docs.namefi.io/docs/02-authentication.mdx) (API key, EIP-712 और SIWE ऑथ मोड; हर ऑपरेशन की ऑथ संबंधी जरूरतें)
- Namefi — [docs.namefi.io: डोमेन रजिस्टर करना](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (रजिस्ट्रेशन अनुरोध के फ़ील्ड, स्थिति जांचने की प्रक्रिया और ऑर्डर की स्थितियां)
- Namefi — [docs.namefi.io: अपना बैलेंस मैनेज करना](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (NFSC बैलेंस और faucet एंडपॉइंट)
- Anthropic / Claude Code — [MCP से Claude Code को टूल से जोड़ें](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (`claude mcp add --transport http` सिंटैक्स, `--header`, `--scope` फ़्लैग)
- Model Context Protocol — [रिमोट MCP सर्वर से जुड़ें](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication) (Claude Desktop / claude.ai Custom Connectors की प्रक्रिया)
- OpenAI — [learn.chatgpt.com: Model Context Protocol (Codex CLI)](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (`config.toml` की `[mcp_servers.<name>]` तालिका, `url`, `http_headers`, `env_http_headers`, `bearer_token_env_var` फ़ील्ड)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (`mcp.json` का रिमोट-सर्वर फ़ॉर्मैट, `headers`, `${env:VAR}` इंटरपोलेशन, प्रोजेक्ट और ग्लोबल कॉन्फ़िगरेशन के स्थान)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (इस गाइड के प्रकाशन की तारीख पर [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp) पर रीडायरेक्ट; `mcp_config.json` फ़ॉर्मैट, `serverUrl`, `headers`)
- Google — [geminicli.com: Gemini CLI के साथ MCP सर्वर](https://geminicli.com/docs/tools/mcp-server/) (`settings.json` फ़ॉर्मैट, `httpUrl`, `headers`, `timeout`)
- llmstxt.org — [/llms.txt फ़ाइल](https://llmstxt.org) (उस खोज मानक का विनिर्देश और उद्देश्य जिसका पालन `namefi.io/llms.txt` करता है)
