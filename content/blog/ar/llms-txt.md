---
title: "llms.txt للدومينات: واجهة API يقدر أي وكيل ذكاء اصطناعي يقراها"
date: '2026-07-10'
language: 'ar'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
format: explainer
ogImage: ../../assets/llms-txt-og.jpg
description: "شرح تفصيلي لـ namefi.io/llms.txt: إزاي ملف نص عادي بيمكّن أي وكيل ذكاء اصطناعي من اكتشاف واستخدام واجهة API كاملة لمُسجِّل دومينات، وإزاي بيتكامل مع MCP."
keywords: ["llms.txt", "مثال llms.txt", "ما هو llms.txt", "وثائق API المقروءة للذكاء الاصطناعي", "اكتشاف API", "robots.txt للذكاء الاصطناعي", "llms.txt مقابل MCP", "namefi.io/llms.txt", "مرجع API مقروء آلياً", "API مصممة للوكلاء", "وثائق منظّمة لـ LLMs", "اكتشاف API بالنص العادي", "واصف اكتشاف MCP", "تسجيل دومين بوكيل ذكاء اصطناعي"]
relatedArticles:
  - /ar/blog/ai-agent-register/
  - /ar/blog/claude-mcp-domains/
  - /ar/blog/namefi-mcp/
  - /ar/blog/mcp-quickstart/
  - /ar/blog/agent-native/
relatedTopics:
  - /ar/topics/web3-foundations/
  - /ar/topics/domain-basics/
relatedSeries:
  - /ar/series/blockchain-concepts/
  - /ar/series/tokenize-your-com/
relatedGlossary:
  - /ar/glossary/ai-agent/
  - /ar/glossary/registrar/
  - /ar/glossary/epp/
  - /ar/glossary/dns/
  - /ar/glossary/seo/
---

كل [مُسجِّل](/ar/glossary/registrar/) عنده [واجهة API](/ar/glossary/epp/) عنده وثائق في مكان ما: موقع docs، أو صفحة مرجعية، أو يمكن مواصفة OpenAPI ورا صفحة تسجيل دخول. ده كان كفاية لمدة عقدين، لأن القارئ كان مطوّر بشري يقدر يضغط هنا وهناك ويتخطّى زحمة التنقّل عشان يوصل للفقرة اللي تهمه. [وكيل ذكاء اصطناعي](/ar/glossary/ai-agent/) بيقرأ الموقع نفسه وقت الاستدلال ما عندوش الرفاهية دي: ميزانية سياق محدودة، ومش هيستحمل بوابة وثائق معمولة بـ JavaScript، ومحاولة واحدة عشان يفهم الـ API بتعمل إيه قبل ما يسيبها أو يهلوس بنقطة نهاية مش موجودة.

`llms.txt` هو الحل للمشكلة دي، وNamefi بتنشر واحداً على [namefi.io/llms.txt](https://namefi.io/llms.txt). المقال ده بيشرح الاصطلاح ده إيه، وليه موجود، وملفنا فيه إيه جزءاً جزءاً، وفين بيتوقف عن قصد، وإزاي بيشتغل جنب [بروتوكول سياق النموذج](https://modelcontextprotocol.io) (MCP) بدل ما ينافسه. وهو كمان، عن قصد، مثال على الحاجة اللي بيشرحها: مزوّد API عام بيشرح ملف اكتشافه المقروء آلياً بلغة بسيطة.

## ليه الوكلاء ما ينفعش يزحفوا على موقع الوثائق وخلاص

المنطق وراء `llms.txt` مش تخمين — هو مذكور بشكل مباشر في المقترح. [الشرح الأصلي لجيريمي هوارد](https://llmstxt.org) بيفتتح بالقيد اللي خلّى الفكرة ضرورية: "Large language models increasingly rely on website information, but face a critical limitation: context windows are too small to handle most websites in their entirety. Converting complex HTML pages with navigation, ads, and JavaScript into LLM-friendly plain text is both difficult and imprecise."

هنا مشكلتين فوق بعض. موقع وثائق حقيقي — قوائم تنقّل، وسجل تغييرات، ونص تسويقي، وبانر ملفات تعريف الارتباط — معظمه دوشة مقارنة بالكم فقرة اللي الوكيل محتاجها لمهمة واحدة. وكثير من الدوشة دي ورا JavaScript ما بيتنفذش في طلب headless عادي، فالحاجة اللي عميل HTTP بتاع الوكيل بيشوفها مش حتى الصفحة اللي الإنسان بيشوفها. `llms.txt` بيتجاوز المشكلتين: ملف Markdown واحد نصه عادي، معمول عشان يتقرا كله بدل ما يتزحف عليه ويتلخّص.

## تشبيه `robots.txt`، وفين التشبيه ما بيكملش

المقارنة مع [`robots.txt`](https://www.robotstxt.org) أسرع طريقة لفهم مكان `llms.txt` لو أنت عارف بنية الويب، وهي مقارنة عادلة لحد معين. `robots.txt` موجود عشان يدي تعليمات لزواحف الويب — على وصف الموقع نفسه: "Web site owners use the /robots.txt file to give instructions about their site to web robots; this is called *The Robots Exclusion Protocol*." الملفين موجودين في مسار جذر متوقع، والاتنين نص عادي، والاتنين بيخاطبوا قرّاء آليين مش بشر.

التشبيه بيقف عند النية. `robots.txt` تقريباً كله تعليمات **سلبية** — `Disallow: /some-path` بتقول للزاحف إيه اللي *ما يلمسوش*. `llms.txt` **إيجابي**: ده الموقع إيه، ودي الأجزاء اللي تستاهل القراءة. هو مش سياج بقدر ما هو فهرس محتويات لقارئ ما يقدرش يفتح الكتاب كله. الاتنين مكمّلين لبعض، وموقع Namefi بيشغّل الاتنين.

## المواصفة بتطلب إيه بالضبط

`llms.txt` مش مساحة كتابة حرّة؛ المقترح بيعرّف بنية Markdown محددة بالترتيب: علامة byte-order اختيارية، ثم H1 إلزامي باسم الموقع، وملخص على هيئة blockquote، وصفر أو أكثر من أقسام التفاصيل بلا عنوان، وصفر أو أكثر من أقسام «قائمة ملفات» مفصولة بـ H2، روابطها بالشكل `[name](url): notes`. عنوان H2 واحد له معنى خاص: قسم اسمه **Optional** بيقول إن «الروابط هنا ممكن تتخطاها لو محتاج سياق أقصر». ملف Namefi بيستخدم العنوان ده بالضبط وبيعمل اللي المواصفة بتوصفه.

## جولة داخل namefi.io/llms.txt

ده الملف الحي، مشروح جزءاً جزءاً — إيه الموجود فعلاً فيه، منقول بالنص، وليه كل جزء متصمم بالشكل ده لوكيل بيقرأه لأول مرة.

| القسم (كما يظهر في الملف) | بيقول إيه | ليه متصمم بالشكل ده |
| --- | --- | --- |
| H1 + blockquote | `# Namefi API` / `> Namefi lets you register traditional domains as NFTs and manage their DNS records via API.` | البداية المطلوبة في المواصفة — سطر واحد يقدر الوكيل يتصرف بناءً عليه حتى لو ما قراش حاجة تانية. |
| إشارة MCP ضمن الملخص | `MCP server (every operation below as MCP tools): https://api.namefi.io/mcp — discovery descriptor at https://namefi.io/.well-known/mcp/servers.json` | بتحط أسرع مسار — اتصال بروتوكول حي — قبل المسار النصي العادي، في أول ثلاثة سطور. |
| `## Base URLs` | `https://api.namefi.io/v-next/` | سطر واحد من غير كلام زيادة — الوكيل اللي بيبني طلبات HTTP مباشرة محتاج ده بالضبط. |
| `## MCP Server (for AI agents)` | "Prefer MCP if your client supports it… Add in Claude Code: `claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"`" | بيحدد تفضيلاً ويدعمه بأمر واحد قابل للنسخ واللصق بدل فقرة كاملة. |
| `## Authentication` | "Generate a key at https://namefi.io/api-key… Works for **all operations**… **Direct HTTP usage (recommended for AI agents):** Pass the header directly — no SDK required" | بيقول بوضوح إنه لا SDK ولا OAuth ولا جلسة متصفح مطلوبين عشان تصادق على طلب كتابة. |
| `## Domain Registration` | تسلسل `curl` من ثلاث خطوات: افحص الإتاحة، وابعت `POST /v-next/orders/register-domain`، واستطلع `GET /v-next/orders/{orderId}` لحد ما توصل لحالة نهائية | المعاملة الأساسية كأوامر قابلة للتشغيل، مش وصف نثري لشكل طلب أو استجابة. |
| `## DNS Record Management` | جدول فيه إحدى عشرة نقطة نهاية (`GET`/`POST`/`PUT`/`DELETE` على `/v-next/dns/records` و`/v-next/dns/park` و`/v-next/dns/forwarding` وغيرها) ومع كل واحدة الطريقة والمسار والمصادقة ووصف سطر واحد | بيانات مرجعية — نقاط نهاية كتير متشابهة — مكانها جدول بدل إحدى عشرة فقرة. |
| ملاحظة حل المشاكل | "**UNAUTHORIZED (401):** Your API key is invalid, expired, or not associated with the domain owner's wallet… **Record validation errors:** Check that `zoneName` has no trailing dot, `rdata` for CNAME/MX/NS types has a trailing dot…" | بتسبق حالات الفشل اللي الوكيل غالباً هيقابلها أولاً، بصيغة سبب وحل بدل جدول حالات عام. |
| `## Optional` | روابط لوثائق TypeScript SDK، وحزمة npm `@namefi/api-client`، ومواصفة OpenAPI 3 مقروءة آلياً، ودليل الوكيل الصادر، ومستودع GitHub لسكريبتات مساعدة محايدة بالنسبة للموقّع | ده بالضبط قسم المواصفة «تخطّاه لو محتاج سياق أقصر» — مصادر أعمق، مش متطلبات للمسار الأساسي فوق. |

الملف بيختتم بإشارة إلى `namefi.io/llms-full.txt`، وهو نفس المحتوى مضمن في وثيقة واحدة، بما في ذلك مسارات دفع Web3 ودليل الوكيل الصادر اللذين يشير إليهما ملف الجذر فقط. التقسيمة دي بتعكس نمط المستويين في المواصفة نفسها: خلّي نقطة الدخول قصيرة بما يكفي عشان تدخل براحة في السياق، وسيب الوكيل اللي محتاج أكثر يتبع رابط واحد.

## الملفات المصاحبة: Web3 واكتشاف MCP

ملف الجذر بيربط بملفات شقيقة لأجزاء من الـ API ما تنفعش تكون في نقطة دخول عامة. [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) بيوثق مسارات دفع يحتاجها وكيل ماسك محفظة بدل مفتاح API: مسار [x402](/ar/glossary/x402/) حيث `GET /x402/domain/{domainName}` بيرجع `402 Payment Required` مع السعر إلى أن يُرفق هيدر `X-PAYMENT` موقّع، ونسخة challenge-response من MPP (Machine Payable Protocol) موقعة عبر CLI اسمه `mppx`، ومسار توقيع EIP-712 يدوي يغطي محافظ العقود الذكية. الملف بيقول صراحة إن تسجيل x402 لا يحتاج "No Namefi account or EIP-712 signing required — the buyer's wallet signs an EIP-3009 `transferWithAuthorization`." الوكيل اللي محتاج مفتاح API فقط مش مضطر يحمّل أي حاجة من ده.

جانب MCP له ملف اكتشاف خاص به، منفصل تماماً عن `llms.txt`: [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)، وهو واصف JSON صغير بدل Markdown:

```json
{
  "servers": [
    {
      "name": "namefi-api",
      "transport": "streamable-http",
      "url": "https://api.namefi.io/mcp",
      "authentication": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key"
      },
      "documentation": "https://namefi.io/llms.txt"
    }
  ]
}
```

الواصف ده عايش تحت `.well-known/`، وهو نفس الاصطلاح اللي بيستخدمه `/.well-known/security.txt` لبيانات وصفية قابلة للاكتشاف آلياً — شقيق أضيق وبنوع JSON لطريقة Markdown النثرية في `llms.txt`. آخر حقل فيه بيرجع يشاور على `llms.txt`، فوكيل يلاقي خادم MCP الأول لسه عنده طريق للشرح النصي العادي لأدوات الخادم دي بتعمل إيه.

## إيه الموجود وإيه المتروك، وليه

في شوية اختيارات شكلها مقصود. تقريباً كل عملية مكتوبة كأمر `curl` قابل للتشغيل بدل فقرة بتوصف شكل الطلب — الملف مكتوب لحاجة بتنفّذ كود، مش لحاجة بتكتب ملخصاً عنه. ملف الجذر بيشير للخارج بدل ما يضمّن كل شيء، و`llms-full.txt` بيضمّن اللي بيكتفي بالإشارة إليه — تطبيق حرفي لنمط إدارة الحجم في المواصفة. قسم `## Optional` بيربط مواصفة OpenAPI 3 كاملة جنب Markdown، فالأداة اللي محتاجة schema مكتوباً بأنواع صارمة تلاقيه من غير ما تزحم القراءة الأولى. ودفع المحفظة — x402 وMPP وEIP-712 — في ملف لوحده، فمصادقة مفتاح API وتسجيل الدومين يبقوا أول حاجتين أي وكيل يقراهم.

<!-- TODO: تأكيد من الفريق — هل فيه ميزانية مستهدفة للتوكنات أو الأحرف مكتوب على أساسها ملف llms.txt الجذري، وإزاي تُراجع القسمة بين llms.txt وllms-full.txt وweb3/llms.txt وoutbound/llms.txt لما الـ API تكبر -->

## llms.txt وMCP: اكتشاف مقابل اتصال

المهم إننا نكون دقيقين في دور كل واحد. `llms.txt` وثيقة — الوكيل بيجلبها مرة واحدة وبيعرف الـ API بتعمل إيه وفين الموارد الأعمق؛ هي نص ساكن لحد ما حاجة تتصرف بناءً على اللي مكتوب فيه. [MCP](https://modelcontextprotocol.io)، حسب وصف البروتوكول نفسه، هو "an open-source standard for connecting AI applications to external systems" — جلسة حية العميل بيفتحها مع خادم، يسرد من خلالها أدوات قابلة للاستدعاء ويشغّلها.

ملف Namefi بيورّي العلاقة دي مباشرة: `llms.txt` بيقول للوكيل إن فيه خادم MCP على `api.namefi.io/mcp` وبيسيبه مع أمر `claude mcp add` عشان يتصل. اقرا الملف، اعرف إن فيه واجهة أدوات حية، اتصل، ونفّذ. وكيل يتخطى لـ MCP على طول يقدر برضه يلاقي الخادم عبر `.well-known/mcp/servers.json` — لكن حقل `documentation` في الواصف ده بيرجع لـ `llms.txt`، فالاتنين نادراً ما بيشتغلوا في عزلة تامة.

## إرشادات لبقية مزوّدي API

نشر `llms.txt` شغال لا يتطلب إعادة بناء الوثائق:

1. **حط H1 والملخص وأسرع طريقة اتصال في البداية** — وكيل بسياق صغير ممكن ما يقراش بعد أول كام سطر.
2. **ورّي طلبات قابلة للتشغيل، مش كلام عن schema.** أمر `curl` بأسماء حقول حقيقية أحسن من فقرة بتشرح JSON body.
3. **قسّم حسب الحجم، مش حسب هيكل الفريق.** ملف جذر قصير مع توسعة أطول، وملفات منفصلة لحاجات زي الدفعات، بيخلّي المسار الشائع قصيراً.
4. **وثّق حالات الفشل الفعلية**، مش أكواد الحالة فقط — معرفة ليه الطلب بيرجع 401 بدل 403 أهم من الأرقام نفسها.
5. **استخدم عنوان `## Optional` لأي حاجة قابلة للتخطي**، التزاماً باصطلاح المواصفة نفسها.
6. **انشر واصف اكتشاف MCP جنب llms.txt لو بتشغّل خادم MCP** — واحد بيجاوب «إيه ده؟»، والتاني «أتصل إزاي؟».

## الأسئلة الشائعة

### ما هو llms.txt؟

هو اصطلاح مقترح — مش معياراً رسمياً من IETF أو W3C — لنشر ملف Markdown نصي عادي عند جذر الموقع يشرح لوكيل ذكاء اصطناعي الموقع أو الـ API دي إيه وفين يلاقي تفاصيل أكثر. بيحدد ترتيباً معيناً: عنوان H1، وملخص blockquote، وفقرات تفصيل اختيارية، وقوائم روابط مفصولة بعناوين H2، مع احتفاظ عنوان "Optional" للروابط اللي ينفع تتخطى.

### إيه الفرق بين llms.txt وrobots.txt؟

`robots.txt` تعليمات سلبية لزواحف الويب — إيه اللي ما تفهرسوش — ضمن Robots Exclusion Protocol. `llms.txt` إيجابي — الموقع إيه وإيه اللي يستاهل القراءة. بيخدموا قرّاء آليين مختلفين وعادة موجودين مع بعض.

### هل llms.txt بيستبدل MCP؟

لا. `llms.txt` وثيقة الوكيل بيقراها مرة عشان يفهم الـ API بتعمل إيه؛ MCP اتصال بروتوكول حي بيفتحه العميل عشان يستدعي عمليات الـ API فعلاً. Namefi بتنشر الاتنين، و`llms.txt` هو اللي بيقول للوكيل من البداية إن خادم MCP موجود.

### إيه الموجود في ملف llms.txt بتاع Namefi؟

رابط الأساس، وإشارة لخادم MCP، وقسم مصادقة بمفتاح API، ومسار تسجيل دومين من ثلاث خطوات مع أمثلة `curl` قابلة للتشغيل، وجدول نقاط نهاية لإدارة سجلات DNS، ونقاط نهاية لضبط الدومين، وقسم لحل المشاكل، وقسم "Optional" فيه روابط إلى SDK ومواصفة OpenAPI وملفات مصاحبة لدفعات المحفظة ومسارات العمل الصادرة.

### ينفع أقرا llms.txt بنفسي من غير وكيل ذكاء اصطناعي؟

أيوه — هو Markdown نصي عادي، سهل القراءة للإنسان وللنموذج. [namefi.io/llms.txt](https://namefi.io/llms.txt) بيتقرا كمرجع API سريع ومكثف؛ والوضوح نفسه اللي بيسهّل على الإنسان يتصفحه بيسهّل على النموذج يحلله صح.

## المصادر والقراءة الإضافية

- llmstxt.org — [ملف /llms.txt: الخلفية والمقترح ومواصفة التنسيق](https://llmstxt.org/#:~:text=Large%20language%20models%20increasingly%20rely%20on%20website%20information%2C%20but%20face%20a%20critical%20limitation)
- robotstxt.org — [نبذة عن /robots.txt: "In a nutshell"](https://www.robotstxt.org/robotstxt.html#:~:text=Web%20site%20owners%20use%20the%20/robots.txt%20file%20to%20give%20instructions%20about%20their%20site%20to%20web%20robots%3B%20this%20is%20called%20The%20Robots%20Exclusion%20Protocol)
- modelcontextprotocol.io — [ما هو بروتوكول سياق النموذج (MCP)؟](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (المصدر الأساسي لكل مقطع مشروح في هذا المقال)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (مسارات دفع المحفظة x402 وMPP وEIP-712)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (واصف اكتشاف MCP)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (نسخة بملف واحد تدمج ملفي Web3 والوكيل الصادر)
- IETF — [RFC 8615، معرّفات الموارد الموحدة المعروفة مسبقاً (اصطلاح `.well-known/`)](https://datatracker.ietf.org/doc/html/rfc8615)

## اقرأ الملف بنفسك

أسرع طريقة تفهم بها `llms.txt` هي إنك تفتح واحداً. [namefi.io/llms.txt](https://namefi.io/llms.txt) متاح للعامة، من غير مصادقة، وقصير كفاية تقراه في الوقت اللي أخذته في قراءة المقال ده — وهو نفس الملف اللي أي وكيل ذكاء اصطناعي بيتصل بـ Namefi بيقراه الأول. لو عايز تعرف أدوات MCP وراه بتعمل إيه فعلاً، راجع [خادم Namefi MCP: أدوات دومينات لوكلاء الذكاء الاصطناعي](/ar/blog/namefi-mcp/)؛ ولو عايز تتصل من محرر، راجع [دليل MCP السريع](/ar/blog/mcp-quickstart/)؛ ولو عايز تشوف وكيلاً ينفّذ المسار كله، راجع [إزاي تسجّل دومين باستخدام وكيل الذكاء الاصطناعي على Namefi](/ar/blog/ai-agent-register/).
