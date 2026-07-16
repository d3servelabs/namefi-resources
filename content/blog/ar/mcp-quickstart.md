---
title: "البدء السريع مع Namefi MCP: Claude Code وCursor وWindsurf"
date: '2026-07-10'
language: ar
tags: ['ai-agents', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
draft: false
format: guide
ogImage: ../../assets/mcp-quickstart-og.jpg
description: "إعداد MCP خاص بكل محرر لـ Claude Code وCursor وWindsurf، ثم بدء سريع من خمس خطوات ينقلك من تطبيق جديد إلى دومين مخصص شغّال، من غير ما تسيب المحرر."
keywords: ['دومين Claude Code MCP', 'دومين Cursor MCP', 'دومين Windsurf MCP', 'تسجيل دومين من داخل المحرر', 'تسجيل دومين عبر وكيل برمجة', 'تسجيل دومين من المحرر', 'بدء سريع MCP', 'إعداد Namefi MCP', 'دومين Vercel مخصص مع Namefi', 'دومين Cloudflare Pages مخصص مع Namefi', 'نشر دومين مخصص عبر وكيل ذكاء اصطناعي', 'بدء سريع لتسجيل دومين', 'إعداد x-api-key لـ MCP', 'توجيه الدومين إلى النشر']
relatedArticles:
  - /ar/blog/ai-agent-register/
  - /ar/blog/claude-mcp-domains/
  - /ar/blog/namefi-mcp/
  - /ar/blog/wallet-checkout/
  - /ar/blog/vibe-coding-domain/
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
  - /ar/glossary/nameserver/
  - /ar/glossary/domain-renewal/
---

إنت بالفعل جوه المحرر. التطبيق اتعمل له scaffolding، وأول نشر طلع لتوّه على subdomain خاص بالمنصة، ومابقاش ناقص قبل ما تقدر توجه الناس له غير دومين حقيقي. ده دليل البدء السريع عشان تكمّل خطوة التسجيل دي من غير ما تفتح تبويب متصفح، أو تملى نموذج إتمام شراء، أو تسيب نفس جلسة [وكيل الذكاء الاصطناعي](/ar/glossary/ai-agent/) اللي بنى التطبيق: إعداد اتصال دقيق لـ [MCP](https://modelcontextprotocol.io) في Claude Code وCursor وWindsurf، وتدفق مختصر من خمس خطوات، والأهم — الجزء اللي أغلب أدلة الدومينات بتفوّته — إزاي تاخد الدومين اللي لسه سجلته وتوجهه فعلًا للنشر اللي لسه طلّعته.

الدليل ده بيغطي ثلاثة محررات عن قصد. لو بتستخدم OpenAI Codex أو Gemini CLI أو Claude Desktop بدلهم، فـ [إزاي تسجّل دومين باستخدام وكيل الذكاء الاصطناعي على Namefi](/ar/blog/ai-agent-register/) هو الدليل الأساسي اللي فيه إعداد متحقق منه للعملاء الستة كلهم، وكمان مسار REST الخام لأي حاجة مش أصلية في MCP. كل حاجة هنا بتتصل بنفس سيرفر [Namefi](https://namefi.io) MCP اللي الدليل ده بيوثّقه، فمفيش حاجة تحت بتتناقض معاه — الصفحة دي بس نسخة مختصرة تركّز على أدوات المطورين، ومعاها خطوة نشر مش موجودة في الدليل الأساسي.

## ليه تسجّل الدومين من جوه المحرر؟

«روح سجّل دومين» تبديل سياق تكلفته عالية بشكل غريب لمهمة مدتها خمس دقايق: تسيب المحرر، تفتح موقع مُسجِّل، تدور على اسم، تعدي على مسار بيع إضافي لحماية الخصوصية واستضافة البريد اللي ما طلبتهمش، تدفع، وبعدها ترجع تحاول تفهم أي سجلات DNS تضيفها.

البديل إنك تسيب نفس الوكيل اللي جهّز المشروع ووصّله بالنشر يكمّل آخر خطوة كمان: يفحص الاسم، ويسجّله، ويضبط DNS، وكل ده كاستدعاءات أدوات في نفس المحادثة اللي إنت فيها. [Cloudflare بتسوّق نسخة من الفكرة نفسها لـ Registrar API بتاعتها](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=An%20agent%20using%20the%20API%20can%20suggest%20domain%20names%2C%20check%20registrability%2C%20and%20complete%20the%20purchase%20without%20the%20user%20leaving%20their%20current%20context) — وده دليل إن الموضوع مش تفضيل لفئة ضيقة، بل سير عمل بيبنيه أكتر من مُسجِّل. قسم المقارنة قرب النهاية بيغطي جانب Cloudflare بالتحديد؛ نسخة Namefi بتضيف خيار [الدومين المُرمَّز](/ar/glossary/tokenized-domain/) ومسار دفع بتوقيع المحفظة من غير حساب نهائيًا، وده مشروح في [ادفع للدومينات بمحفظة عملات مشفّرة](/ar/blog/wallet-checkout/).

## جهّز الاتصال: ثلاثة محررات، وثلاثة ملفات إعداد

المحررات الثلاثة اللي تحت بتتصل بنفس endpoint، وهو `https://api.namefi.io/mcp`، عبر Streamable HTTP، ومفتاح [Namefi API](https://namefi.io/api-key) بتاعك بيتبعت في header باسم `x-api-key`. اللي بيختلف من محرر للتاني هو صيغة الملف والأمر اللي بيكتبه بس.

### Claude Code

توثيق Claude Code نفسه بيدي أمر CLI مباشر لإضافة سيرفر HTTP بعيد مع header مخصص:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

شغّله مرة واحدة من terminal في مشروعك، بعد ما تستبدل المفتاح بمفتاحك الحقيقي. افتراضيًا، بيكتب السيرفر ضمن نطاق **local** — متاح ليك في المشروع ده بس. أضف `--scope user` عشان يبقى متاح في كل مشروع على جهازك، وبعدها اتأكد إنه اتصل باستخدام `claude mcp list`.

### Cursor

Cursor بيقرأ سيرفرات MCP من `mcp.json` — نسخة للمشروع في `.cursor/mcp.json`، أو نسخة عامة في `~/.cursor/mcp.json`. صيغة السيرفر البعيد الموثقة بتدعّم المصادقة بالـ header مع interpolation لمتغيرات البيئة، فالمفتاح نفسه مش لازم يكون موجود في الملف:

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

`${env:NAMEFI_API_KEY}` بيتحلّ للقيمة اللي المتغير ده محتفظ بيها في الـ shell اللي شغّل Cursor — اعمل له export قبل ما تفتح المحرر.

### Windsurf (Cascade)

تكامل MCP في Windsurf — واسمه Cascade — بيقرأ `~/.codeium/windsurf/mcp_config.json`. السيرفرات البعيدة هناك بتستخدم حقل `serverUrl` بدل `url`، وبنفس نمط `headers` و`${env:VAR}` اللي في Cursor:

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

في نقطة تستحق التنبيه: وقت نشر الدليل ده، `docs.windsurf.com/windsurf/cascade/mcp` بيحوّل إلى `docs.devin.ai/desktop/cascade/mcp` — توثيق Windsurf بقى موجود تحت نطاق توثيق منتج Devin التابع لـ Cognition، وصيغة الإعداد اللي فوق هي اللي الصفحة الحالية بتوثّقها. لو عندك إصدار أقدم، راجع أسماء الحقول في رابط التوثيق اللي بتشير له المساعدة داخل التطبيق في إصدارك.

## البدء السريع من خمس خطوات: من تطبيق جديد إلى DNS شغّال

أول ما واحد من الاتصالات اللي فوق يشتغل، باقي التدفق واحد مهما كان المحرر اللي بتستخدمه.

1. **هات مفتاح API** من [namefi.io/api-key](https://namefi.io/api-key)، ويتولد من المحفظة اللي المفروض تمتلك الدومين الجديد.
2. **اتصل** باستخدام إعداد المحرر بتاعك اللي فوق، وبعدها اختبره بسرعة: اسأل «اتأكد إذا كان `<yourapp>.com` متاحًا على Namefi، وقلّي استدعيت أي أداة». ده استدعاء `checkAvailability` للقراءة فقط، فبيشتغل قبل ما تموّل أي حاجة.
3. **سجّل.** أكّد الاسم والمدة بلغة عادية — «سجّله لسنة واحدة». الوكيل بيقدّم `registerDomain` وبيستعلم دوريًا عن الطلب لحد ما يوصل إلى `SUCCEEDED` (أو حالة فشل نهائية)؛ التسجيل المعتاد بيكتمل خلال عدد قليل من دورات الاستعلام.
4. **وجّهه للنشر بتاعك.** دي الخطوة اللي القسم الجاي بيغطيها بالتفصيل — أضف سجلات DNS اللي منصة الاستضافة بتطلبها، من خلال نفس المحادثة.
5. **اتأكد إنه بيتحلّ.** [انتشار DNS](/ar/glossary/dns-propagation/) مش فوري، فاديله كام دقيقة، وبعدها اتأكد من خلال DNS lookup عام أو بمجرد ما تحمّل الدومين في المتصفح.

## وجّه الدومين الجديد للنشر اللي لسه طلّعته

ده الجزء اللي دليل عام بعنوان «إزاي تسجّل دومين» ما بيوصلوش، لأنه بيحصل بعد التسجيل ومن ناحية منصة الاستضافة — لكنه أصلًا سبب إنك تعمل ده من جوه المحرر: وكيلك عارف بالفعل نشر على أنهي منصة، ويقدر يضبط DNS في نفس اللحظة اللي بيسجّل فيها الدومين.

### Vercel

توثيق Vercel الخاص بالدومينات بيمشي معاك في التدفق من **Settings → Domains** في لوحة مشروعك: أضف الدومين، وVercel هيقول لك أي سجل تنشئه حسب ما إذا كان apex domain أو subdomain. بالنسبة لـ **apex domain** (`yourapp.com`)، Vercel بيطلب **سجل A** يشير إلى IP الخدمة؛ وبالنسبة لـ **subdomain** (`www.yourapp.com`)، بيطلب **CNAME**. وفي تفصيلة مهمة قبل ما تنسخ مثالًا من دليل قديم: [توثيق Vercel صريح إن هدف CNAME ده فريد لكل مشروع](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record)، وبيظهر لك في لوحة التحكم بدل ما يكون hostname ثابت واحد تشترك فيه كل المشاريع.

بعد ما يبقى معاك العنوان ده، جانب DNS محتاج طلب واحد كمان للوكيل:

> "أضف سجل A لـ `@` يشير إلى `76.76.21.21`، وCNAME لـ `www` يشير إلى هدف CNAME اللي Vercel ادتهولي."

ده بيستدعي `createDnsRecord` مرتين — مرة لكل سجل — وهي نفس أداة [أنواع سجلات DNS (A، AAAA، CNAME، MX، TXT)](/ar/glossary/dns-record-types/) المستخدمة لأي كتابة DNS على Namefi. قاعدة النقطة في النهاية بتنطبق هنا زي أي مكان: قيمة `rdata` لهدف CNAME لازم تنتهي بنقطة، لكن `zoneName` (الدومين بتاعك) مش لازم.

### Cloudflare Pages

لو هدف النشر بتاعك Cloudflare Pages بدلًا من كده، وDNS الدومين مش متدار أصلًا على Cloudflare، فـ [توثيق Cloudflare الخاص بالدومينات المخصصة](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain) بيطلب سجل **CNAME** واحد يشير إلى subdomain مشروعك على `.pages.dev` — مش محتاج سجل A، لأن Pages بتقدّم كل حاجة من خلال هدف CNAME ده. خطوة لوحة تحكم Cloudflare (Workers & Pages → مشروعك → Custom domains → Set up a domain) لازم تحصل الأول؛ بعدها بس هدف CNAME بيحلّ بشكل صحيح.

> "أضف CNAME لـ `app` يشير إلى `my-project.pages.dev.`"

نفس استدعاء الأداة، ونفس قاعدة النقطة في نهاية الهدف، لكن منصة مختلفة.

<!-- TODO: verify — Vercel and Cloudflare Pages exact steps for issuing/renewing the TLS certificate on a newly attached custom domain, to state confidently whether it's automatic on both or needs a manual trigger -->

## مقارنة ده بتسجيل Cloudflare من داخل المحرر

Cloudflare هي المُسجِّل التاني اللي بيسوّق بنشاط لفكرة العمل من داخل المحرر، ويستاهل ذكر مباشر. Registrar API بتاعتها، [واللي كان مُبلّغ عنه في مرحلة beta في أبريل 2026](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/)، بيتكامل برضه مع محررات بتدعم MCP، منها Cursor وClaude Code، وبيسمح لوكيل يبحث عن دومين ويسعّره ويسجّله بشكل متزامن من غير ما يسيب السياق الحالي — نفس الفكرة الأساسية اللي الدليل ده بيشرحها لـ Namefi. التقرير نفسه بيقول إنه في مرحلة beta، API بتاع Cloudflare لسه ما بيغطيش إدارة ما بعد التسجيل، زي النقل والتجديد، والمخطط له وقت لاحق في 2026.

سيرفر MCP بتاع Namefi بيغطي دورة الحياة الكاملة دلوقتي — التسجيل وDNS و[التجديد التلقائي](/ar/glossary/domain-renewal/) — بالإضافة لحاجتين مش موجودتين في مسار Cloudflare: الدومين بيتسجل افتراضيًا كـ NFT [دومين مُرمَّز](/ar/glossary/tokenized-domain/) (ويمكن توجيهه إلى أي محفظة)، وبيَدعم إتمام شراء بتوقيع محفظة من غير حساب Namefi نهائيًا، والتفاصيل في [ادفع للدومينات بمحفظة عملات مشفّرة](/ar/blog/wallet-checkout/). الاتنين بيبنوا نفس سير العمل «ما تسيبش المحرر»؛ الاختيار الأنسب بيتوقف على ما إذا كنت عايز تسجيل عادي أو تسجيل يبقى كمان أصلًا على السلسلة.

## الأسئلة الشائعة

### هل ده بيغطي Codex أو Gemini CLI كمان؟
لأ — الدليل ده محدد عن قصد لـ Claude Code وCursor وWindsurf. [إزاي تسجّل دومين باستخدام وكيل الذكاء الاصطناعي على Namefi](/ar/blog/ai-agent-register/) فيه نفس الإعداد الدقيق والمتحقق منه لـ Codex CLI وGemini CLI وClaude Desktop.

### هل محتاج حساب Namefi قبل ما أجرّب ده؟
لأ. فحص التوفر للقراءة فقط ما بيحتاجش مصادقة، فممكن توصل أي محرر من اللي فوق وتشغّل prompt الاختبار في الخطوة 2 قبل ما تولّد مفتاح API أو تموّل أي حاجة.

### ماذا لو كانت منصة النشر بتاعتي مش Vercel أو Cloudflare Pages؟
النمط ثابت في كل مكان: لوحة تحكم المنصة بتقول لك أنهي نوع من سجلات DNS محتاجاه — في الغالب سجل A لـ apex domain، وCNAME لـ subdomain — وإنت بتدي القيمة دي لوكيلك عشان يكتبها عبر `createDnsRecord`.

### هل الدومين بيتحوّل إلى دومين مُرمَّز تلقائيًا لما أسجّله بالطريقة دي؟
أيوه، افتراضيًا — الدومين بيتسجل NFT على Base للمحفظة المرتبطة بمفتاح API بتاعك، إلا لو حددت `nftReceivingWallet` مختلفة في الطلب. شوف [ما هي الدومينات المُرمَّزة؟](/ar/blog/what-are-tokenized-domains/) لو ده مفهوم جديد عليك.

### هل أقدر أتخطى مفتاح API بالكامل؟
أيوه، لكن مع ملاحظة: مسار إتمام الشراء [x402](/ar/glossary/x402/) بتوقيع المحفظة في Namefi بيسمح لمحفظة مموّلة تدفع مقابل تسجيل من غير حساب أو مفتاح API أصلًا. ليه شرح خاص، موجود في [ادفع للدومينات بمحفظة عملات مشفّرة](/ar/blog/wallet-checkout/).

## طلّع الاسم مع التطبيق

الدومين جزء من البنية التحتية، زي هدف النشر وقاعدة البيانات — مفيش سبب حقيقي يخليه القطعة الوحيدة من عملية إطلاق التطبيق اللي لسه بتطلب منك تسيب أدواتك وتملى نموذج ويب. وصّل واحد من الإعدادات الثلاثة اللي فوق، وشغّل التدفق من خمس خطوات، والدومين هيبقى شغّال وموجّه لنفس النشر اللي وكيلك بناه للتو، من غير تبويب متصفح واحد.

**[ولّد مفتاح Namefi API](https://namefi.io/api-key)** وجرّب prompt فحص التوفر في أي محرر مفتوح عندك بالفعل، أو اقرأ [الشرح الكامل لـ Claude Code مع نسخة مشروحة من المحادثة](/ar/blog/claude-mcp-domains/) لو عايز تشوف كل خطوة بالتفصيل.

## المصادر وقراءة إضافية

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (رابط سيرفر MCP، والنقل، والمصادقة، ومرجع endpoint للتسجيل/DNS — المصدر الأساسي لكل ادعاء خاص بـ Namefi في الدليل ده)
- Namefi — [docs.namefi.io: تسجيل دومين](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (حقول طلب التسجيل، وتدفق الاستعلام الدوري، وقيم حالات الطلب)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (وصف اكتشاف MCP)
- Anthropic / Claude Code — [وصّل Claude Code بالأدوات عبر MCP](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (صيغة `claude mcp add --transport http`، و`--header`، و`--scope`)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (صيغة السيرفر البعيد في `mcp.json`، و`headers`، وinterpolation لـ `${env:VAR}`، ومواقع إعدادات المشروع والعامة)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (بيحوّل إلى [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp) وقت نشر الدليل؛ صيغة `mcp_config.json`، و`serverUrl`، و`headers`)
- Vercel — [إضافة وضبط دومين مخصص](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record) (سجل A لـ apex domain، وهدف CNAME الخاص بكل مشروع للـ subdomains، وطريقة nameserver)
- Vercel — [نظرة عامة على الدومينات](https://vercel.com/docs/domains#:~:text=76.76.21.21) (عنوان IP للخدمة `76.76.21.21` المستخدم لسجلات A الخاصة بـ apex)
- Cloudflare — [الدومينات المخصصة لـ Pages](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain) (تدفق CNAME إلى `.pages.dev` للدومينات غير المُدارة على Cloudflare)
- webhosting.today — [وكلاء الذكاء الاصطناعي يقدروا دلوقتي يسجّلوا دومينات، من غير تدخل بشري](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/) (تقرير beta لـ Cloudflare Registrar API: تكاملات المحررات، وقيود beta)
- Model Context Protocol — [modelcontextprotocol.io](https://modelcontextprotocol.io) (نظرة عامة على البروتوكول)
