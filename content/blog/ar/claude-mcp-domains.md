---
title: "اشترِ دومين باستخدام Claude: دليل Namefi MCP خطوة بخطوة"
date: '2026-07-10'
language: ar
tags: ['ai-agents', 'domains', 'guide']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/claude-mcp-domains-og.jpg
description: "وصّل Claude بسيرفر Namefi MCP وسجّل دومين حقيقي من خلال محادثة واحدة. إعداد دقيق، ونسخة مشروحة من المحادثة، وحلول للمشاكل."
keywords: ['Namefi MCP', 'دومين Claude MCP', 'إعداد سيرفر MCP', 'شراء دومين عبر Claude', 'x-api-key', 'دليل خطوة بخطوة', 'تسجيل دومين عبر Namefi MCP', 'تسجيل دومين من Claude Desktop', 'شراء دومين من Claude Code', 'تكامل Namefi مع Claude', 'مسجِّل دومينات MCP', 'شراء وكيل الذكاء الاصطناعي لدومين عبر Claude', 'Streamable HTTP MCP']
relatedArticles:
  - /ar/blog/ai-agent-register/
  - /ar/blog/cf-namecom-namefi/
  - /ar/blog/ai-domain-platforms/
  - /ar/blog/agent-native/
  - /ar/blog/airo-vs-namefi/
relatedTopics:
  - /ar/topics/domain-tokenization/
  - /ar/topics/domain-basics/
relatedSeries:
  - /ar/series/tokenize-your-com/
  - /ar/series/blockchain-concepts/
relatedGlossary:
  - /ar/glossary/ai-agent/
  - /ar/glossary/registrar/
  - /ar/glossary/dns-record-types/
  - /ar/glossary/tokenized-domain/
  - /ar/glossary/x402/
---

بنهاية الدليل ده، هيكون عندك دومين حقيقي مسجَّل لدى [ICANN](/ar/glossary/icann/)، وموجَّه DNS بتاعه للحاجة اللي بتبنيها، وكل التسجيل تم من خلال محادثة مع Claude — من غير إتمام شراء في المتصفح، ولا سلة، ولا CAPTCHA. ده دليل إعداد فريق Namefi لسيرفر [Namefi](https://namefi.io) MCP — شرح واضح للبشر لنفس الـ API اللي بننشره للوكلاء على [namefi.io/llms.txt](https://namefi.io/llms.txt) و[docs.namefi.io](https://docs.namefi.io). ولما تكون أي تفصيلة لسه ما اتثبتتش أو ما اتنشرتش، الدليل بيقول ده بوضوح بدل ما يخمّن.

فيه شروحات من جهات تانية لفكرة «سجّل دومين باستخدام [وكيل الذكاء الاصطناعي](/ar/glossary/ai-agent/) بتاعك» — [مثال مشهور](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26) بيعرض النمط ده باستخدام سيرفر MCP مختلف مبني كجهة إعادة بيع فوق Registrar API الخاص بـ Cloudflare. آلية MCP نفسها هي نفس الفكرة عند مقدمي الخدمة المختلفين؛ لكن الدليل ده مخصص لسيرفر MCP الخاص بـ Namefi، ونموذج المصادقة الخاص بيها، وخيار [الدومين المُرمَّز](/ar/glossary/tokenized-domain/) الخاص بيها، ومراجَع على توثيق Namefi بدل وصف طرف ثالث له.

## ما هو MCP باختصار؟

[Model Context Protocol](https://modelcontextprotocol.io)‏ (MCP) معيار مفتوح لربط تطبيق ذكاء اصطناعي — Claude في حالتنا — بأدوات ومصادر بيانات خارجية: توثيق البروتوكول نفسه بيشبّهه بـ [منفذ USB-C لتطبيقات الذكاء الاصطناعي](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) — موصّل موحَّد واحد بدل تكامل مخصص لكل أداة. لما يتوصل Claude بسيرفر MCP الخاص بـ Namefi، بيبقى عنده مجموعة محددة من العمليات القابلة للاستدعاء — فحص التوفر، وتسجيل دومين، وقراءة سجلات DNS وكتابتها — بدل ما يحاول يستنتج REST API من توثيق متلصق في المحادثة.

## المتطلبات المسبقة

- **عميل Claude بيدعم MCP.** الدليل ده بيغطي Claude Code (من سطر الأوامر) بأوامر محددة ومجرَّبة، وClaude Desktop / claude.ai (من خلال Custom Connectors) بالتدفق العام الموثَّق. عملاء MCP التانيين، زي Cursor أو Windsurf، بيتصلوا بنفس السيرفر؛ راجع أقسام كل وكيل في [إزاي تسجّل دومين باستخدام وكيل الذكاء الاصطناعي على Namefi](/ar/blog/ai-agent-register/) لو بتستخدمهم، أو [البدء السريع لـ Namefi MCP: Claude Code وCursor وWindsurf](/ar/blog/mcp-quickstart/) المختصر لو كل اللي محتاجه هو أوامر الاتصال.
- **مفتاح Namefi API**، بيتم إنشاؤه من [namefi.io/api-key](https://namefi.io/api-key)، *أو* [محفظة](/ar/glossary/wallet/) عملات مشفّرة لو تفضّل تدفع لكل معاملة من غير مفتاح API أصلًا (راجع قسم المحفظة قرب النهاية).
- **رصيد NFSC ممول** لو بتسجّل في بيئة الإنتاج الخاصة بـ Namefi. ‏NFSC (Namefi Service Credits) هو الرصيد اللي رسوم تسجيل الدومين بتتسحب منه؛ توثيق Namefi بيشرح شحنه من لوحة تحكم Namefi في الإنتاج، وطلب أرصدة اختبار مجانية من endpoint للـ faucet في بيئات التطوير.

## الخطوة 1: احصل على مفتاح Namefi API

[مفتاح API](https://namefi.io/api-key) هو أبسط طريق للمصادقة، وهو اللي الدليل ده بيستخدمه كله: header واحد بيغطي كل عملية — التسجيل، وإنشاء سجلات DNS، والتحديث، والحذف. في تفصيلة لازم تستوعبها قبل ما تنشئ مفتاح: **المفتاح بيرث صلاحيات المحفظة اللي أنشأته.** لو عايز تدير DNS لدومين أنت مالكه بالفعل، أنشئ المفتاح من المحفظة اللي بتملك NFT الدومين ده — المفتاح اللي طالع من محفظة مختلفة مش هيبقى له صلاحية كتابة على دومين [المسجَّل](/ar/glossary/registrant/) فيه شخص تاني.

بعد ما يتولّد، المفتاح بيكون string يبدأ بـ `nfk_`. هتبعتُه كـ header باسم `x-api-key` في كل عملية كتابة؛ عمليات القراءة فقط، زي فحص التوفر، مش بتحتاجه إطلاقًا.

## الخطوة 2: وصّل Claude بسيرفر Namefi MCP

Namefi، وهي [المُسجِّل](/ar/glossary/registrar/) المعتمد من ICANN، بتشغّل سيرفر MCP واحد لكل واجهة الـ API بتاعتها، على `https://api.namefi.io/mcp`، ويمكن الوصول له عبر نقل Streamable HTTP. السيرفر بيعرض كل عملية `/v-next` كأداة مكتوبة الأنواع — بحث، وتسجيل، وDNS، وإعداد دومين، وoutbound — ووجوده وتفاصيل اتصاله منشورين كمان كوصف اكتشاف على [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)، بصيغة قابلة للقراءة آليًا عشان الوكيل يقدر يلاقي السيرفر من غير ما إنسان ينسخ له الرابط الأول.

### Claude Code

إضافة السيرفر إلى Claude Code بتتم بأمر واحد:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

الأمر ده متوافق مع [صيغة Claude Code الموثقة](https://code.claude.com/docs/en/mcp) لإضافة سيرفر MCP بعيد عبر HTTP مع header مصادقة مخصص — النمط العام هو `claude mcp add --transport http <name> <url> --header "<Header-Name>: <value>"`. شغّله مرة واحدة من الطرفية عندك (واستبدل `YOUR_KEY` بالمفتاح من الخطوة 1)، وClaude Code هيكتب السيرفر في إعدادات MCP للمشروع أو للمستخدم. افتراضيًا، الأمر بيسجّل السيرفر لمشروعك الحالي فقط؛ أضف `--scope user` لو عايزه متاح في كل المشاريع، أو احذف المفتاح تمامًا وأضفه بعدين لو كل اللي محتاجه في البداية أدوات للقراءة فقط زي بحث التوفر.

أكد الاتصال باستخدام `claude mcp list`، والمفروض يظهر `namefi` على إنه متصل، وباستخدام `/mcp` داخل جلسة Claude Code عشان تشوف عدد الأدوات اللي بيعرضها سيرفر Namefi.

### Claude Desktop وclaude.ai

Claude Desktop وclaude.ai بيتصلوا بسيرفرات MCP البعيدة من خلال **Custom Connectors**، كما هو موثّق في [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers): افتح Settings، وروح لـ Connectors، واختار "Add custom connector"، واكتب رابط السيرفر — `https://api.namefi.io/mcp`. بعد ما تضغط Add، التدفق هيطلب منك تكمّل المصادقة؛ وطبقًا لتوثيق Anthropic، الخطوة دي «غالبًا بتتضمن OAuth، أو مفاتيح API، أو اسم مستخدم/كلمة مرور» حسب اللي السيرفر المعين بيطلبه، وClaude بيعرض أي prompt بيطلبه السيرفر.

<!-- TODO: confirm with team — the exact field Claude Desktop's Custom Connector auth screen presents for an x-api-key-style header; Anthropic's public docs describe the general authentication step without showing Namefi's server specifically --> لو إعداد الـ Desktop connector ما أظهرش مكان واضح تدخل فيه المفتاح، فـ Claude Code هو المسار المُتحقَّق منه حاليًا، وأدوات القراءة فقط (بحث التوفر) شغالة عبر الـ connector من غير مفتاح أصلًا.

## الخطوة 3: موّل رصيد NFSC بتاعك

تسجيل الدومين عملية مدفوعة: بيحتاج NFSC (Namefi Service Credits) في المحفظة الدافعة. في بيئة تطوير أو اختبار، faucet (`POST /v-next/user/faucet`، أو `client.user.requestNfscFaucet()` في SDK) بيوزّع أرصدة اختبار مجانية، مع حد للمعدل لكل محفظة. في الإنتاج، بيتم شحن NFSC من خلال لوحة تحكم Namefi. <!-- TODO: confirm with team — the exact production top-up flow: accepted payment methods and whether it's purchasable directly through chat or only through the dashboard UI --> تقدر تفحص رصيدك الحالي في أي وقت — إما تسأل Claude («إيه رصيدي على Namefi؟») بعد الاتصال، أو مباشرةً عبر `GET /v-next/balance`.

## الخطوة 4: محادثة الشراء

بعد ما سيرفر MCP يتوصل والرصيد يتم تمويله، بقية الخطوات بتحصل بلغة عادية. ده إصدار مشروح لشكل المحادثة دي، ومربوط بالعملية الأساسية اللي توثيق API الخاص بـ Namefi بيسمّيها في كل خطوة.

**1. اطلب من Claude يفحص اسمًا.**

> "هل `example.com` متاح للتسجيل؟"

Claude بيستدعي فحص التوفر (عملية `checkAvailability`، ويمكن الوصول لها مباشرةً على `GET /v-next/search/availability?domain=example.com`، ومن غير حاجة لمصادقة). بيرجع لك إذا كان الاسم متاحًا، ويقدر يفحص مجموعة مرشحين دفعة واحدة عن طريق صيغة فحص التوفر المجمعة لو أديته عدة أسماء تقارن بينهم.

**2. أكّد وسجّل.**

> "سجّله لسنة واحدة واضبط DNS بحيث يشير `@` إلى 203.0.113.10."

Claude بيقدّم طلب تسجيل (`registerDomain`، `POST /v-next/orders/register-domain`) — أو، لو طلبت سجلات DNS كمان، صيغة `register-domain/records` المجمعة، وبيطبّق [أنواع سجلات DNS (A، AAAA، CNAME، MX، TXT)](/ar/glossary/dns-record-types/) اللي طلبتها بمجرد ما الطلب يكتمل. جسم الطلب بياخد `normalizedDomainName` (حروف صغيرة، ومن غير نقطة في الآخر، وأي [TLD](/ar/glossary/tld/) ذكرت `search/availability` إنه قابل للتسجيل) و`durationInYears` (من 0–10، والافتراضي 1). اختيار `nftReceivingWallet` بيتحكم في الترميز — سيبه خارج الطلب، والدومين هيتسجل كـ NFT على Base للمحفظة المرتبطة بمفتاح API بتاعك. كائن `domainSetupOptions` بيوثّق تجاوزات إضافية لكل دومين، بما فيها `autoRenew` و`dnssec` و`keepExistingNameservers` — والأخير بيخلّي Claude يسجل الدومين من غير ما يغيّر تفويض [خادم الأسماء (سجل NS)](/ar/glossary/nameserver/) بعيدًا عن المكان المضبوط عليه حاليًا.

**3. Claude بيستعلم دوريًا لحد ما الطلب يكتمل.**

التسجيل غير متزامن. Claude (أو أنت وإنت بتتابع الحالة) بيستعلم دوريًا عن `getOrder` (`GET /v-next/orders/{orderId}`) لحد ما الطلب يوصل لحالة نهائية: `SUCCEEDED` أو `FAILED` أو `CANCELLED` أو `PARTIALLY_COMPLETED`. التسجيل المعتاد بيكتمل خلال عدد قليل من دورات الاستعلام؛ وClaude بيرجع يبلغك أول ما ده يحصل، بدل ما يسيبك تتابع مؤشر تحميل.

**4. اطلب سجلات DNS إضافية، لو ما ظبطتهاش كلها من البداية.**

> "أضف كمان CNAME لـ `www` يشير إلى `cname.vercel-dns.com.`، وسجل TXT تحت `_verify` بالتوكن ده."

Claude بيستدعي `createDnsRecord` (`POST /v-next/dns/records`) لكل سجل. في قاعدتين للتنسيق مهم تعرفهم قبل ما تطلب: `rdata` الخاص بـ CNAME ضمن [أنواع سجلات DNS (A، AAAA، CNAME، MX، TXT)](/ar/glossary/dns-record-types/) وأنواع السجلات المشابهة لازم ينتهي بنقطة (`cname.vercel-dns.com.`)، بينما `zoneName` — الدومين نفسه — ما ينتهيش بنقطة. عكس القاعدتين دول هو السبب الأكثر شيوعًا لخطأ تحقق في التدفق ده.

**5. اختياري: فعّل التجديد التلقائي.**

> "فعّل التجديد التلقائي للدومين ده."

Claude بيبدّل [تجديد النطاق (التجديد التلقائي)](/ar/glossary/domain-renewal/) عبر `PUT /v-next/domain-config/auto-renew`. لما يكون مفعّل، الدومين بيتجدد تلقائيًا قبل انتهاء صلاحيته باستخدام وسائل الدفع المتاحة في محفظة المالك — مهم تعرف ده قبل تفعيله لأنه تفويض مستمر، مش تأكيد لمرة واحدة.

## الخطوة 5: تأكد إنه بيحلّ بشكل صحيح

[انتشار DNS](/ar/glossary/dns-propagation/) مش فوري، فادي السجلات كام دقيقة قبل ما تفحصها. قراءات DNS مش بتحتاج مصادقة، فإنت (أو Claude) تقدر تتأكد من اللي شغال حاليًا عن طريق `GET /v-next/dns/records?zoneName=example.com` أو أداة بحث DNS عامة. لو وجّهت الدومين لمنصة نشر، فخطوة التحقق من الدومين الخاصة بها (فحص سجل TXT اللي طلبته) تأكيد منفصل يستحق إنك تعمله برضه.

## الدفع بمحفظة بدل مفتاح API

كل اللي فوق بيستخدم مسار مفتاح API. ‏Namefi بتدعم كمان تسجيل دومين بمحفظة عملات مشفّرة ومن غير حساب Namefi نهائيًا، من خلال بروتوكول [x402](/ar/glossary/x402/): محفظة المشتري بتوقّع تفويض EIP-3009، والـ API بيرد بـ `402 Payment Required` مع السعر لو مافيش دفع مرفق، وبيسوّي التسجيل لما يوصل دفع صالح. التدفق ده يستحق دليل لوحده مش مجرد ملاحظة جانبية — راجع [ادفع للدومينات بمحفظة عملات مشفّرة: من غير حساب](/ar/blog/wallet-checkout/)، أو قسم الدفع في [إزاي تسجّل دومين باستخدام وكيل الذكاء الاصطناعي على Namefi](/ar/blog/ai-agent-register/)، للتفاصيل الكاملة.

## حلّ المشكلات

| العَرَض | السبب المحتمل | الحل |
| --- | --- | --- |
| `401 UNAUTHORIZED` في أي طلب كتابة | مفتاح API غير صالح أو منتهي، أو اتولّد من محفظة لا تملك الدومين | أنشئ مفتاحًا جديدًا من [namefi.io/api-key](https://namefi.io/api-key) باستخدام المحفظة التي تملك (أو ستملك) الدومين |
| `403 FORBIDDEN` | المفتاح صالح، لكن المحفظة المرتبط بها لا تملك الدومين المحدد | تحقّق من الملكية من حساب Namefi بتاعك قبل ما تعيد المحاولة |
| طلب التسجيل عالق في حالة غير نهائية | طبيعي — التسجيل غير متزامن | استمر في الاستعلام عن `getOrder`؛ أمثلة Namefi نفسها بتستعلم كل 5 ثوانٍ. اعتبره عالقًا فقط لو ما وصلش أبدًا إلى `SUCCEEDED` أو `FAILED` أو `CANCELLED` أو `PARTIALLY_COMPLETED` |
| تم رفض إنشاء/تحديث سجل DNS بخطأ تحقق | `zoneName` فيه نقطة في الآخر، أو قيمة `rdata` الخاصة بـ CNAME/MX/NS ناقصها نقطة في الآخر | `zoneName` = من غير نقطة في الآخر؛ وقيم `rdata` من نوع FQDN = النقطة في الآخر مطلوبة |
| فشل التسجيل تمامًا | رصيد NFSC غير كافٍ في المحفظة الدافعة | افحص الرصيد (`GET /v-next/balance`)، واشحنه عبر الـ faucet (اختبار) أو لوحة تحكم Namefi (إنتاج) |
| Claude بيقول إن ما عندوش أدوات دومينات متاحة | سيرفر MCP غير متصل، أو متصل من غير الـ header المطلوب لعمليات الكتابة | أعد تشغيل `claude mcp add` باستخدام علامة `--header`، أو افحص `/mcp` / `claude mcp list` لمعرفة حالة الاتصال |

## أسئلة شائعة

### هل لازم أعرف REST API الخاص بـ Namefi عشان أستخدم ده، ولا أقدر أكلم Claude بلغة عادية؟

اللغة العادية كافية للتدفق كله اللي فوق — «هل الدومين ده متاح؟»، و«سجّله»، و«وجّهه إلى عنوان IP ده» كلها بتشتغل كطلبات مباشرة. الـ endpoints وحقول الطلب في الدليل ده موثقة عشان تقدر تتحقق Claude بيعمل إيه في الخلفية، أو تستدعيها بنفسك مباشرةً لو بتكتب script بدل ما تدردش.

### هل التسجيل من خلال Claude بيكلف أكتر من التسجيل من موقع Namefi؟

الدليل ده ما بيدّعيش مقارنة أسعار في أي اتجاه. <!-- TODO: confirm with team — whether Namefi's MCP/API pricing matches its standard registration pricing, or differs --> في كل الأحوال، التسجيل بيتسحب من نفس رصيد NFSC سواء الطلب جاي من متصفح أو script أو أداة MCP.

### هل الدومين بتاعي بيتحوّل تلقائيًا إلى NFT لما أسجّله بالطريقة دي؟

أيوه، افتراضيًا. لو ما حددتش `nftReceivingWallet` في طلب التسجيل، الدومين بيتسجل كـ NFT للمحفظة المرتبطة بمفتاح API بتاعك، على Base. تقدر توجّهه لمحفظة أو chain مختلف وقت التسجيل.

### ماذا يحدث لو كان في خطأ مطبعي في طلب Claude لسجل DNS — هل ممكن يبوّظ دوميني من غير ما أعرف؟

عمليات كتابة DNS بتمر عبر التحقق بتاع Namefi قبل ما تتطبّق، و`rdata` غير السليم (زي نقطة أخيرة ناقصة في هدف CNAME مثلًا) بيترفض بخطأ بدل ما يتقبل بصمت — راجع جدول حل المشكلات فوق. مع ذلك، تعامل مع تغييرات DNS في دومين شغال زي ما تتعامل مع أي تغيير في البنية التحتية: راجع اللي Claude على وشك يقدّمه قبل ما تأكد.

### هل أقدر أستخدم نفس سيرفر MCP مع Cursor أو Windsurf بدل Claude؟

أيوه — سيرفر Namefi بيتكلم بروتوكول MCP المفتوح نفسه بغض النظر عن العميل اللي بيتصل، فجهة السيرفر ما بتتغيرش. أوامر الاتصال من جهة العميل بتختلف حسب المحرر؛ راجع أقسام إعداد كل عميل في [إزاي تسجّل دومين باستخدام وكيل الذكاء الاصطناعي على Namefi](/ar/blog/ai-agent-register/)، أو [البدء السريع لـ Namefi MCP: Claude Code وCursor وWindsurf](/ar/blog/mcp-quickstart/) الأقصر.

## اشترِ دومينك التالي من خلال محادثة

ده الإعداد الدقيق اللي Namefi بتدعمه النهارده، مش سيناريو افتراضي. بمجرد اتصال سيرفر MCP، كل شيء من البحث عن اسم وتسجيله وضبط DNS وتحويله (اختياريًا) إلى توكن في محفظة بيحصل من غير ما تخرج من المحادثة. سيرفر MCP بيعرض أكتر من التسجيل — البحث الاستباقي عن العملاء المحتملين، وعمليات DNS المجمعة، وإعداد الدومين — وكلها قابلة للاكتشاف من نفس الاتصال بعد ما تجهزه — راجع [سيرفر Namefi MCP: أدوات دومينات لوكلاء الذكاء الاصطناعي](/ar/blog/namefi-mcp/) لكتالوج الأدوات الكامل.

**[أنشئ مفتاح Namefi API ووصّل Claude](https://namefi.io/api-key).**

## المصادر وقراءات إضافية

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (رابط سيرفر MCP، والنقل، والمصادقة، وendpoints التسجيل وDNS — المصدر الرئيسي للدليل ده)
- Namefi — [docs.namefi.io: المصادقة](https://docs.namefi.io/docs/02-authentication.mdx) (طرق مصادقة API key وEIP-712 وSIWE؛ ومتطلبات المصادقة لكل عملية)
- Namefi — [docs.namefi.io: تسجيل دومين](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (أمثلة تسجيل واستعلام دوري كاملة في SDK وfetch وcURL وPython)
- Namefi — [docs.namefi.io: إدارة رصيدك](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (endpoints الـ faucet وفحص الرصيد لـ NFSC)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (وصف اكتشاف MCP)
- Anthropic / Claude Code — [وصّل Claude Code بالأدوات عبر MCP](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (صيغة `claude mcp add --transport http`، ومصادقة الـ header، وعلامات النطاق)
- Model Context Protocol — [الاتصال بسيرفرات MCP البعيدة](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication) (تدفق Custom Connectors لـ Claude Desktop وclaude.ai)
- Model Context Protocol — [ما هو Model Context Protocol؟](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (نظرة عامة على البروتوكول)
- llmstxt.org — [ملف /llms.txt](https://llmstxt.org) (مواصفة ومنطق اسم ملف الاكتشاف اللي بيتبعه namefi.io/llms.txt)
- dev.to — [إزاي تسجّل اسم دومين باستخدام وكيل الذكاء الاصطناعي، من غير إنسان](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26) (دليل MCP من طرف ثالث مبني على جهة إعادة بيع مدعومة بـ Cloudflare مختلفة)
