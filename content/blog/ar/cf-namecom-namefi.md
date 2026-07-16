---
title: "Cloudflare مقابل Name.com مقابل Namefi: مُسجِّلات مصمَّمة للوكلاء"
date: '2026-07-10'
language: 'ar'
tags: ['ai-agents', 'comparison']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
format: comparison
ogImage: ../../assets/cf-namecom-namefi-og.jpg
description: "مقارنة ميزة بميزة بين ثلاثة مُسجِّلات مصمَّمة للوكلاء: التسعير، ودعم MCP، والدفع بالعملات المشفرة، والملكية المرمَّزة، ومتى تختار كل واحد منها."
keywords: ["Cloudflare Registrar API", "واجهة Name.com للذكاء الاصطناعي", "Namefi MCP", "مُسجِّل مصمم للوكلاء", "مقارنة مُسجِّلات الذكاء الاصطناعي", "الدفع بدومين بالعملات المشفرة", "دومين مُرمَّز", "تسجيل دومين عبر MCP", "وكيل ذكاء اصطناعي يشتري دومين", "Cloudflare مقابل Namefi", "Name.com مقابل Namefi", "تسعير الدومين بسعر التكلفة", "الدفع بالمحفظة لدومين"]
relatedArticles:
  - /ar/blog/ai-domain-platforms/
  - /ar/blog/agent-native/
  - /ar/blog/airo-vs-namefi/
  - /ar/blog/claude-mcp-domains/
  - /ar/blog/ai-agent-register/
relatedTopics:
  - /ar/topics/domain-tokenization/
  - /ar/topics/choosing-a-tld/
relatedSeries:
  - /ar/series/tokenize-your-com/
  - /ar/series/best-tlds-by-industry/
relatedGlossary:
  - /ar/glossary/ai-agent/
  - /ar/glossary/registrar/
  - /ar/glossary/tokenized-domain/
  - /ar/glossary/dnssec/
  - /ar/glossary/wallet/
---

بقى فيه 3 [مُسجِّلين](/ar/glossary/registrar/) يخلّوا جهة غير إنسان تملأ نموذج الدفع. أطلقت Cloudflare واجهة API تجريبية في أبريل 2026 تسمح لـ [وكيل الذكاء الاصطناعي](/ar/glossary/ai-agent/) بتسجيل دومين من غير جلسة متصفح. وأعادت Name.com بناء واجهة API الخاصة بها حول الفكرة نفسها وتصف نفسها بأنها أول منصة دومينات مصممة للذكاء الاصطناعي. أما Namefi فأنشأت خادم Model Context Protocol ‏(MCP) ومسار دفع موقّع بالمحفظة يتجاوز تماماً خطوة إنشاء الحساب. الثلاثة يستهدفون التحول نفسه: انتقال تسجيل الدومينات من مهمة يؤديها شخص داخل المتصفح إلى عملية ينفذها وكيل عبر نداء API.

لكنها ليست المنتجات نفسها تحت شعارات مختلفة. كل واحدة راهنت بشكل مختلف على التسعير، وعلى ما الذي تتطلبه فعلاً صفة «مصمم للوكلاء»، وعلى طريقة إثبات المشتري لقدرته على الدفع. هذه مقارنة ميزة بميزة بين الثلاثة، تشمل المواضع التي يصعب فعلاً منافسة Cloudflare فيها سعرياً، والمواضع التي يسبق فيها تموضع Name.com ما أطلقته فعلياً.

## ما الذي تتطلبه صفة «مصمم للوكلاء» فعلاً؟

امتلاك API ليس هو نفسه أن تكون قابلاً لاستخدام وكيل. يقدم معظم المُسجِّلين التسجيل البرمجي منذ سنوات، لكن تلك الواجهات صُممت للموزعين والمطورين الذين يقرؤون التوثيق، لا لعملية مستقلة يجب أن تكتشف ما هو متاح، وتتحقق من هويتها من دون أن يكتب إنسان كلمة مرور، وتفهم رسالة خطأ من دون أن يقرأها إنسان. توجد قائمة أكثر اكتمالاً بما يميّز المُسجِّل «الذي لديه API» عن المُسجِّل المصمم للوكلاء في [ما هو مُسجِّل النطاقات المصمَّم للوكلاء؟](/ar/blog/agent-native/)؛ والخلاصة هي قابلية الاكتشاف (هل يستطيع الوكيل العثور على API بنفسه؟)، والاستجابات المقروءة آلياً، ومسار دفع لا يفترض أن إنساناً يحمل بطاقة ائتمان. كل المُسجِّلين الثلاثة أدناه يحققون هذا الحد بدرجات مختلفة.

## واجهة Cloudflare Registrar API: بسعر التكلفة، تجريبية، وموجودة بالفعل في محررك

دخلت Cloudflare Registrar API مرحلة البيتا في 15 أبريل 2026، ضمن إعلانات الشركة لأسبوع «Agents Week». بحسب تقرير متخصص عن الإطلاق، تتيح الواجهة [لوكيل ذكاء اصطناعي البحث عن إتاحة الدومين، والتحقق من السعر، وإتمام التسجيل برمجياً من دون أي تفاعل مع المتصفح أو موافقة يدوية](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=lets%20an%20AI%20agent%20search%20for%20domain%20availability%2C%20check%20pricing%2C%20and%20complete%20registration%20programmatically%20without%20any%20browser%20interaction%20or%20manual%20approval). يكتمل التسجيل بشكل متزامن خلال ثوانٍ للدومينات القياسية، وصُممت الواجهة لتعمل داخل [محررات كود تدعم MCP مثل Cursor وClaude Code](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code)، فيستطيع المطور تسجيل دومين للمشروع الذي يبنيه من دون مغادرة الأداة التي يبني فيه المشروع.

أقوى نقطة في عرض Cloudflare هي التسعير، وهنا تقتضي المصداقية الاعتراف بنقطة قوة حقيقية: فـ Cloudflare [تقدم تسجيل وتجديد دومينات .ai بسعر الجملة، من دون أي هوامش إضافية](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)، وكل دومين مسجل يأتي مع [DNSSEC وSSL مجاناً، ومصادقة ثنائية، وقفل دومين مفعّل افتراضياً](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=free%20DNSSEC%2C%20free%20SSL%2C%20two-factor%20authentication%2C%20and%20a%20domain%20lock%20enabled%20by%20default)، إضافة إلى [إخفاء WHOIS مجاناً](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=every%20.ai%20domain%20comes%20with%20free%20WHOIS%20redaction)، فلا توجد رسوم إضافية مقابل حماية [خصوصية WHOIS](/ar/glossary/whois-privacy/) التي يبيعها مُسجِّلون آخرون كإضافة. كما يؤكد تقرير مقارن منفصل للمُسجِّلين نموذج التسعير بصورة مستقلة: تسعير Cloudflare [بسعر التكلفة يحمّلك فقط ما تدفعه Cloudflare نفسها، من دون هامش عند التسجيل أو التجديد](https://www.hostinger.com/tutorials/best-domain-registrars/#:~:text=At-cost%20pricing%20charges%20you%20only%20what%20Cloudflare%20pays%2C%20with%20no%20markup%20at%20registration%20or%20renewal). إذا كان السعر هو العامل الحاسم ولا تحتاج إلى أكثر من «سجّله واقفله»، فمن الصعب منافسة Cloudflare.

المقابل هو النطاق الوظيفي. البيتا تغطي البحث، وفحص السعر، والتسجيل، بينما [صرّحت Cloudflare بأن إدارة دورة الحياة ما زالت قيد التطوير ومخططاً إطلاقها لاحقاً في 2026](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=Cloudflare%20has%20stated%20that%20lifecycle%20management%20is%20in%20development%20and%20is%20planned%20for%20release%20later%20in%202026)، أي إن النقل والتجديد وتحديثات بيانات الاتصال ليست بعد جزءاً من API الموجهة للوكيل. ولا يوجد خيار دفع بالعملات المشفرة أو ملكية مرمَّزة؛ فالدومين المسجل عبر Cloudflare أصل تقليدي في حساب المُسجِّل، وليس شيئاً يمكن للمحفظة الاحتفاظ به مباشرة.

## واجهة Name.com المصممة للذكاء الاصطناعي: من اللغة الطبيعية إلى كود يعمل

طرح Name.com مختلف عن Cloudflare. بدلاً من البدء بالسعر، أعادت Name.com بناء API المطورين حول [إطلاق واجهة name.com API الجديدة، منصتنا المصممة للذكاء الاصطناعي التي تحدّث الدومينات لعصر الذكاء الاصطناعي الوكيلي](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI)، والمبنية على [Model Context Protocol ‏(MCP) ومواصفة OpenAPI، اللذين يمكّنان وكلاء الذكاء الاصطناعي من التفاعل مباشرة مع عمليات الدومين](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=supported%20by%20modern%20standards%20like%20Model%20Context%20Protocol%20%28MCP%29%20and%20OpenAPI%20specification%2C%20which%20enable%20AI%20agents%20to%20interact%20directly%20with%20domain). وتسوق الشركة ذلك صراحةً كسير عمل داخل المحرر أيضاً؛ إذ تقول إن المطورين يستطيعون [استخدام أدوات ذكاء اصطناعي مثل Claude وCursor لإدارة عمليات الدومين عبر مطالبات بسيطة بفضل دعم MCP](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=Leverage%20AI%20tools%20like%20Claude%20and%20Cursor%20to%20handle%20domain%20operations%20through%20simple%20prompts%2C%20thanks%20to%20MCP%20support).

أوضح ما يميز إعلان Name.com هو تأطير اللغة الطبيعية إلى الكود: فبدلاً من أن يستدعي الوكيل مجموعة ثابتة من نقاط النهاية، الفكرة هي أن تقول للوكيل «أضف تسجيل دومين إلى تطبيقي»، فيكتب هو كود التكامل بنفسه باستخدام توثيق الـ API. وتدعم Name.com فكرة «أن العالم يتحرك بهذا الاتجاه» بأبحاث العملاء الخاصة بها، معلنة أن [91% من المشاركين يتصورون أن وكلاء الذكاء الاصطناعي سيتولون جزءاً على الأقل من إدارة دوميناتهم خلال السنتين المقبلتين](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years). ولأن هذا الرقم وارد مباشرة في إعلان Name.com لا من طرف ثالث، فيجب اعتباره توجه سوق تبلّغ عنه الشركة، لا استطلاعاً مستقلاً.

هناك نقطتان تستحقان التنبيه بوضوح. أولاً، تدوينة Name.com وثيقة تموضع ورؤية، ولا تنشر جدول قدرات مفصلاً من النوع الذي تقدمه وثائق Cloudflare وNamefi؛ لذلك تعكس عدة خلايا في المصفوفة أدناه ما يزعمه الإعلان لا مواصفة مختبرة. ثانياً، بشأن التسعير، تتحدث تدوينة Name.com نفسها عن مرونة للموزعين، أي [القدرة على تحديد هوامشك الخاصة](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20ability%20to%20set%20your%20own%20markups)، وهي ميزة لشريك موزع وليست وعداً بسعر التكلفة للمستخدمين النهائيين على غرار Cloudflare. ولا يذكر الإعلان أيضاً مسار دفع بالعملات المشفرة أو ملكية مرمَّزة.

## Namefi: خادم MCP، ودفع بالمحفظة، وملكية مرمَّزة

تنطلق Namefi من افتراض مختلف: قد لا يكون المشتري إنساناً لديه جلسة متصفح أو بطاقة ائتمان من الأساس، وقد لا يرغب في حساب Namefi قبل أن يتمكن من التصرف. وفقاً لتوثيق API القابل للقراءة آلياً من Namefi، وهو المصدر الوحيد المعتمد لمزاعم منتجاتها، تشغّل Namefi خادم MCP على `https://api.namefi.io/mcp` عبر نقل Streamable HTTP، ويعرض «كل عملية `/v-next` كأداة محددة النوع (بحث، تسجيل، DNS، إعداد الدومين، وصادر)»، ويمكن اكتشافه عبر `https://namefi.io/.well-known/mcp/servers.json`، مع أمر إعداد موثق من سطر واحد لـ Claude Code (`claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"`). يستخدم توثيق REST API ترويسة `x-api-key` مرتبطة بالمحفظة التي تملك الدومين، ولا تحتاج أدوات القراءة فقط إلى مفتاح إطلاقاً.

النقطة الفارقة هي الدفع. توثّق Namefi تدفق دفع [x402](https://x402.org) يتيح للوكيل شراء دومين بالعملة المستقرة USDC من دون إنشاء حساب Namefi أولاً؛ توقّع محفظة المشتري `transferWithAuthorization` وفق EIP-3009، وتعيد API استجابة `402 Payment Required` بالسعر عند غياب دفعة مرفقة، ثم تسوّي التسجيل فور وصول ترويسة دفع صالحة. ويقدم تدفق منفصل لـ Machine Payable Protocol ‏(MPP) نمط تحدٍّ وتوقيعاً مشابهاً. لا توثّق Cloudflare ولا Name.com شيئاً مماثلاً، وهذه أوضح نقطة اختلاف في هذه المقارنة. راجع [ادفع ثمن الدومينات بمحفظة عملات مشفرة: لا تحتاج إلى حساب](/ar/blog/wallet-checkout/) لمعرفة عمل تدفق الدفع هذا من البداية إلى النهاية.

تسجّل Namefi الدومينات أيضاً بوصفها [NFTs](/ar/glossary/nft/)، أي [دومينات مُرمَّزة](/ar/glossary/tokenized-domain/) يجري التحقق من ملكيتها على السلسلة بدلاً من قاعدة بيانات المُسجِّل الداخلية فقط. وتشمل إعدادات DNS لديها سجلات [ENS](/ar/glossary/ens/) تلقائية و[DNSSEC](/ar/glossary/dnssec/)، إلى جانب إدارة كاملة لعمليات CRUD لسجلات DNS، فرديةً ودفعات، والتجديد التلقائي، وركن الدومين، وإعادة التوجيه. ما لا ينشره llms.txt الخاص بـ Namefi هو سياسة تسعير معلنة؛ فلا يوجد ادعاء «بسعر التكلفة» مماثل لـ Cloudflare، ولا قائمة أسعار منشورة ظاهرة في التوثيق الذي راجعناه لهذه المقالة. لذلك تحقق من التسعير الحالي مباشرةً على namefi.io بدلاً من افتراض التكافؤ السعري مع Cloudflare. <!-- TODO: confirm with team — Namefi's published pricing/markup policy relative to registry cost -->

## مصفوفة الميزات

| القدرة | Cloudflare Registrar API | واجهة Name.com المصممة للذكاء الاصطناعي | Namefi |
|---|---|---|---|
| البحث عن الإتاحة | نعم | نعم | نعم (`search/availability`، ودفعات) |
| البحث عن السعر | نعم | نعم (موثق، لكن غير مفصل) | نعم (يُعاد في استجابة x402 402؛ وأيضاً عبر API) |
| الشراء / التسجيل | نعم، متزامن، خلال ثوانٍ | نعم (كود تكامل يولده الوكيل) | نعم، عبر مفتاح API أو USDC موقّع بالمحفظة عبر x402/MPP |
| إدارة DNS | ليست في البيتا الحالية | غير مفصلة في الإعلان | نعم، CRUD كامل، وعمليات دفعات، وA/CNAME/TXT/MX وغيرها |
| أتمتة التجديد | ليست في البيتا الحالية (مخطط لها لاحقاً في 2026) | غير مفصلة في الإعلان | نعم، خيار تجديد تلقائي لكل دومين |
| الدفع بالعملات المشفرة | لا | لا | نعم، USDC عبر x402، ولا يحتاج إلى حساب |
| الملكية المرمَّزة | لا | لا | نعم، يُسجَّل الدومين بوصفه NFT مع تحقق على السلسلة |
| هل الحساب مطلوب؟ | نعم (حساب Cloudflare) | نعم (وصول للمطور/API) | لا، في دفع x402 بالمحفظة؛ ومسار مفتاح API مرتبط بمحفظة |
| دعم MCP | نعم (داخل المحرر، وفق تقرير طرف ثالث) | نعم (موثق) | نعم، خادم MCP مخصص ووصف اكتشاف |
| التكامل مع المحرر | Cursor وClaude Code (وفق التقرير) | Claude وCursor (وفق الإعلان) | Claude Code (أمر إعداد موثق)؛ وبروتوكول MCP مفتوح |
| تسعير بسعر التكلفة / من دون هامش | نعم، مذكور صراحة | غير مذكور (توجد إشارة إلى هوامش الموزعين) | غير منشور، تحقق من السعر الحالي |

## متى يفوز كل واحد منها؟

اختر **Cloudflare** إذا كان السعر والبساطة هما العاملين الحاسمين ولا تحتاج إلى أكثر من تسجيل اسم وقفله. فسعرها بسعر التكلفة وإعدادات الأمان المدمجة افتراضياً (DNSSEC وإخفاء WHOIS والمصادقة الثنائية) أفضل فعلاً مما يفرضه معظم المنافسين لقاء الحماية نفسها، وإذا كنت تعمل بالفعل داخل Cursor أو Claude Code على حزمة Cloudflare، فسير العمل بلا احتكاك. المقابل الصريح هو ضيق النطاق: لا إدارة DNS ولا أتمتة تجديد ولا خيارات تشفير أو ملكية مرمَّزة حتى الآن، لأن البيتا للتسجيل فقط.

اختر **Name.com** إذا أردت وكيلاً يكتب لك كود التكامل بدلاً من وكيل يستدعي API ثابتة، أو إذا كنت بالفعل موزعاً لدى Name.com وتريد مرونة الهوامش فوق منصة محدثة ومتوافقة مع MCP. توثيقها أرق من Cloudflare أو Namefi في بيان ما أُطلق فعلاً في مقابل ما هو على خارطة الطريق؛ لذلك خصص وقتاً لاختبار سطح API الحقيقي في مقابل التسويق.

اختر **Namefi** إذا كان المشتري وكيلًا أولاً بالفعل: لا حساب بشري، ودفع مفوض بتوقيع محفظة بدلاً من بطاقة مخزنة، وملكية تريد تمثيلها برمز قابل للتحويل على السلسلة بدلاً من صف فقط في قاعدة بيانات المُسجِّل. هذا المزيج، خادم MCP وتحكم كامل في DNS وENS تلقائي ودفع أصلي بالمحفظة، ليس شيئاً تقدمه حالياً بيتا Cloudflare أو إعلان Name.com. المقابل هو أن Namefi لم تنشر التزاماً بالتسعير بسعر التكلفة مثل Cloudflare؛ لذلك إذا كان سعر الجملة أولويتك القصوى، فتحقق من تسعير Namefi الحالي مباشرة قبل افتراض أنها أقل سعراً من Cloudflare.

سينتهي كثير من الفرق إلى استخدام أكثر من واحد: Cloudflare أو Name.com للدومين الموجود أمام البنية التحتية التي يشغلونها هناك بالفعل، ومُسجِّل أصلي بالمحفظة مثل Namefi لأي شيء يحتاج إلى امتلاكه وتداوله على السلسلة، سواء كان اسماً معداً للتداول في سوق أو اسماً تملكه محفظة وكيل نفسه بدلاً من حساب شخص. ومعنى «الملكية» نفسه عندما يكون [المسجَّل](/ar/glossary/registrant/) وكيلاً لا شخصاً سؤال يستحق مقالة مستقلة؛ راجع [هل يمكن لوكيل ذكاء اصطناعي امتلاك نطاق؟ WHOIS والحفظ والرموز](/ar/blog/agent-own-domain/).

## الأسئلة الشائعة

### أي مُسجِّل هو الأرخص لاستخدام وكيل ذكاء اصطناعي؟

Cloudflare هي الوحيدة من الثلاثة التي تنشر التزاماً صريحاً بالتسعير بسعر التكلفة ومن دون هامش، وتؤكده مقارنة مستقلة للمُسجِّلين والسياسة نفسها. يناقش إعلان Name.com مرونة الهوامش للموزعين بدلاً من وعد بسعر التكلفة للمستخدمين النهائيين، ولم تنشر Namefi سياسة تسعير في توثيق API الخاص بها؛ لذلك لا يمكن إجراء مقارنة أسعار مباشرة حالياً من دون التحقق من التسعير الحي لكل منصة.

### هل يتيح أي منها للوكيل الدفع من دون بطاقة ائتمان يمسكها إنسان؟

Namefi هي الوحيدة من الثلاثة التي تملك تدفق دفع موثقاً أصلياً للعملات المشفرة: يمكن لمحفظة الوكيل الدفع بـ USDC عبر بروتوكول x402 من دون إنشاء حساب Namefi، أو عبر تدفق منفصل من Machine Payable Protocol قائم على التحدي والتوقيع. لا توثق بيتا Cloudflare ولا API الخاصة بـ Name.com مسار دفع مماثلاً من دون حساب.

### هل يمكنني إدارة سجلات DNS عبر واجهات API هذه، لا مجرد تسجيل الدومين؟

يغطي توثيق Namefi عمليات CRUD الكاملة لسجلات DNS، بما في ذلك الإنشاء والتحديث والحذف على دفعات وإعدادات الركن وإعادة التوجيه وENS التلقائي وسجلات Vercel anycast. أما بيتا Cloudflare Registrar API فهي للتسجيل فقط وقت كتابة هذه المقالة، مع تخطيط إدارة دورة الحياة وما بعد التسجيل، بما فيها DNS، لإصدار لاحق. ولا يسرد إعلان Name.com قدرات إدارة DNS بالتفصيل.

### هل أصبحت Cloudflare Registrar API متاحة عموماً بالفعل؟

لا. دخلت البيتا في 15 أبريل 2026 خلال «Agents Week» لدى Cloudflare، وقالت Cloudflare إن إدارة دورة حياة أوسع، كالنقل والتجديد وتحديثات بيانات الاتصال، لا تزال قيد التطوير ومخططة لوقت لاحق في 2026. تعامل مع ادعاءات قدرات مرحلة البيتا على أنها قابلة للتغير، وأعد التحقق قبل الاعتماد عليها في الإنتاج.

### ماذا يعني «مصمم للوكلاء»، وهل تتأهل الثلاثة كلها؟

يعني «مصمم للوكلاء» أن يستطيع الوكيل اكتشاف API، والتحقق من هويته، وإتمام عملية شراء من دون أن يملأ إنسان نموذجاً في المتصفح؛ راجع [ما هو مُسجِّل النطاقات المصمَّم للوكلاء؟](/ar/blog/agent-native/) للقائمة الكاملة. الثلاثة هنا تتجاوز الحد الأساسي، أي البحث البرمجي حتى الشراء وأدوات MCP أو القريبة من MCP، لكنها تختلف بشدة في مدى امتداد التصميم المصمم للوكلاء بعد التسجيل: DNS، والتجديدات، وطريقة الدفع، ونموذج الملكية.

## اشترِ دوميناتك ورمّزها في Namefi

إذا كان ما تحتاجه هو الدفع الأصلي بالمحفظة وملكية مرمَّزة، فإن [Namefi](https://namefi.io) تسجل دومينات ICANN حقيقية كما يفعل أي مُسجِّل معتمد، مع خيار الاحتفاظ بالدومين بوصفه NFT تتحكم فيه محفظتك. راجع [منصات الدومينات لوكلاء الذكاء الاصطناعي: دليل 2026](/ar/blog/ai-domain-platforms/) للمشهد الكامل خارج هذه الثلاثة، أو انتقل مباشرةً إلى الإعداد العملي في [إزاي تسجّل دومين باستخدام وكيل الذكاء الاصطناعي على Namefi](/ar/blog/ai-agent-register/). ولآلية إتمام الوكيل لذلك الشراء بنفسه، راجع [كيف يشتري وكلاء الذكاء الاصطناعي دومينات من غير تدخل بشري (2026)](/ar/blog/agents-buy-domains/).

**[ابحث عن دومين وسجّله على Namefi](https://namefi.io).**

## المصادر وقراءة إضافية

- webhosting.today — [يمكن لوكلاء الذكاء الاصطناعي الآن تسجيل دومينات، من دون إنسان (بيتا Cloudflare Registrar API، أبريل 2026)](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=lets%20an%20AI%20agent%20search%20for%20domain%20availability%2C%20check%20pricing%2C%20and%20complete%20registration%20programmatically%20without%20any%20browser%20interaction%20or%20manual%20approval)
- Cloudflare — [شراء دومينات .ai: التسعير بسعر التكلفة وميزات الأمان المشمولة](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)
- Name.com — [أول منصة دومينات مصممة للذكاء الاصطناعي](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI)
- Hostinger — [مقارنة أفضل مُسجِّلي الدومينات، بما في ذلك تسعير Cloudflare بسعر التكلفة](https://www.hostinger.com/tutorials/best-domain-registrars/#:~:text=At-cost%20pricing%20charges%20you%20only%20what%20Cloudflare%20pays%2C%20with%20no%20markup%20at%20registration%20or%20renewal)
- llmstxt.org — [مواصفة llms.txt](https://llmstxt.org/#:~:text=context%20windows%20are%20too%20small%20to%20handle%20most%20websites%20in%20their%20entirety)
- Model Context Protocol — [ما هو MCP؟](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Namefi — [namefi.io/llms.txt (مرجع خادم MCP وAPI والتحقق من الهوية)](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt (مرجع الدفع بالعملات المشفرة الموقّع بالمحفظة وx402)](https://namefi.io/web3/llms.txt)
