---
title: "إيه هي مدفوعات الوكلاء، وليه كل الشركات مستعجلة توفّرها؟"
date: '2026-08-13'
language: 'ar'
tags: ['ai-agents', 'payments', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
draft: false
format: explainer
ogImage: ../../assets/what-is-agent-payment-og.jpg
description: "مدفوعات الوكلاء بتخلي وكلاء الذكاء الاصطناعي يصرفوا بصلاحية محددة النطاق وقابلة للإلغاء. جوّه محفظة Link من Stripe للوكلاء، وبطاقات الوكلاء من Mercury، وسباق 2025-26."
keywords: ["إيه هي مدفوعات الوكلاء", "شرح مدفوعات الوكلاء", "التجارة عبر الوكلاء", "محفظة Link من Stripe للوكلاء", "Stripe Issuing للوكلاء", "بطاقات الوكلاء من Mercury", "إدارة إنفاق Mercury", "Agentic Commerce Protocol", "بروتوكول Google AP2", "Mastercard Agent Pay", "Visa Intelligent Commerce", "بطاقة أحادية الاستخدام لوكيل ذكاء اصطناعي", "رمز دفع مشترك", "حدود إنفاق وكيل الذكاء الاصطناعي", "مدفوعات وكلاء x402"]
relatedArticles:
  - /ar/blog/wallet-checkout/
  - /ar/blog/agents-buy-domains/
  - /ar/blog/state-of-agentic/
  - /ar/blog/agent-native/
  - /ar/blog/ai-agent-register/
relatedTopics:
  - /ar/topics/web3-foundations/
  - /ar/topics/domain-tokenization/
relatedSeries:
  - /ar/series/blockchain-concepts/
  - /ar/series/domain-apocalypse/
relatedGlossary:
  - /ar/glossary/ai-agent/
  - /ar/glossary/x402/
  - /ar/glossary/stablecoin/
  - /ar/glossary/wallet/
  - /ar/glossary/tokenized-domain/
---

في خلال 16 شهر، أكبر شبكتين بطاقات، وGoogle، وOpenAI، وStripe كلهم أعلنوا أو أطلقوا بنية تحتية لنفس الحاجة بالظبط: إن [وكيل الذكاء الاصطناعي](/ar/glossary/ai-agent/) يقدر يصرف فلوس. Mastercard [أعلنت عن Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens) في 29 أبريل 2025. Visa كشفت عن [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=browse%2C%20select%2C%20purchase%20and%20manage%20on%20their%20behalf) في اليوم التالي. Google نشرت [بروتوكول مدفوعات الوكلاء (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption) بمشاركة أكتر من 60 منظمة شريكة في سبتمبر 2025. في نفس الشهر، فعّلت OpenAI [إتمام الدفع الفوري جوّه ChatGPT](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe). وفي أبريل 2026، أطلقت Stripe [محفظة Link للوكلاء](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)، وهي محفظة مستهلكين يقدر الوكيل يستعيرها لعملية شراء واحدة في كل مرة. حتى Mercury، منصة الخدمات المصرفية للشركات، بقت تتصدّر [عرضها لإدارة الإنفاق](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents) بشعار «بطاقات للفرق **والوكلاء**».

هذا المقال بيشرح إيه هي «مدفوعات الوكلاء» فعليًا، وبيمر على تطبيقين موضّحين — محفظة Stripe لجانب المستهلك، وبطاقات وكلاء Mercury لجانب الشركات — وبعدين بيبص ليه كل الشركات دي قررت، في نفس الوقت تقريبًا، إنهم مش قادرين يتفرجوا على الموضوع ده من بعيد.

## إيه معنى "مدفوعات الوكلاء" فعليًا

مدفوعات الوكلاء هي بنية تحتية بتخلي وكيل برمجي يصرف فلوس نيابة عن شخص أو شركة — بصلاحية **محددة النطاق** (بالمبلغ ده، عند التاجر ده، للغرض ده)، و**قابلة للإثبات** (التاجر يقدر يتأكد إن الوكيل كان فعلًا مفوّض)، و**قابلة للإلغاء** (المالك يقدر يقفلها) — بدل الأداة الخشنة اللي هي إعطاء الوكيل رقم بطاقة خام.

الجزء الأخير ده هو صلب الموضوع. مفيش حاجة منعتك يومًا من لصق رقم بطاقة Visa بتاعتك في ملف إعدادات بوت. اللي بيمنع أغلب الناس إن رقم البطاقة صلاحية غير محددة النطاق: أي حد ماسكها يقدر يخصم أي حاجة، في أي مكان، لحد ما تلاحظ وتلغي البطاقة. إعلان AP2 من Google بيوضّح المشكلة الأساسية بصراحة: أنظمة الدفع النهارده بشكل عام [«بتفترض إن إنسانًا هو اللي بيضغط 'شراء' مباشرة على واجهة موثوقة»](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=assume%20a%20human%20is%20directly%20clicking)، ووكيل مستقل يبدأ عملية دفع [«بيكسر الافتراض الأساسي ده»](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption). AP2 بتؤطر الفجوة في ثلاثة أسئلة لازم كل معاملة وكيل تجاوب عليها: **التفويض** (هل المستخدم مَنح الوكيل صلاحية لعملية الشراء *دي* بالذات؟)، و**الأصالة** (هل طلب الوكيل بيعكس نية المستخدم الحقيقية؟)، و**المساءلة** (مين اللي يتحمّل الخسارة لو حصل خطأ؟).

كل منتج في المجال ده — برامج الرموز الخاصة بشبكات البطاقات، والبروتوكولات المفتوحة، والمحافظ، وبطاقات الوكلاء — هو محاولة للإجابة عن الأسئلة التلاتة دي بشكل كافٍ لدرجة إن السماح لوكيل بصرف الفلوس يبقى حاجة عادية وممِلة.

## Stripe: محفظة وكيلك يقدر يستعيرها لعملية شراء واحدة كل مرة

دخول Stripe للمجال، [المُعلن عنه في 29 أبريل 2026](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching)، هو **محفظة Link للوكلاء**، المبنية فوق طبقة جديدة اسمها **Issuing للوكلاء**. Link هي محفظة المستهلكين بتاعة Stripe — منتج «احفظ بياناتي عشان إتمام دفع أسرع» — وقاعدة عملائها بتقدّرها Stripe بـ[أكتر من 200 مليون مستهلك](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers). تدفق الوكيل بيشتغل كده:

1. المستهلك بيمنح وكيل الوصول لمحفظة Link بتاعته عن طريق تدفق OAuth قياسي — نفس نمط الموافقة المستخدم لربط أي تطبيق طرف تالت.
2. لما الوكيل يعايز يشتري حاجة، بيُنشئ **طلب إنفاق (spend request)** بيحمل سياق: اسم التاجر، والرابط، والمبلغ، ووصف مفهوم بلغة بشرية لإيه اللي بيشتريه وليه.
3. المستهلك بيراجع الطلب ويوافق عليه على الويب أو في تطبيقات Link للموبايل. النهارده، [كل طلب محتاج مراجعة الشخص](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=each%20request%20requires%20the%20person%E2%80%99s%20review) قبل ما تتشارك أي بيانات اعتماد؛ Stripe بتقول إن حدود الإنفاق والاستقلالية المُعتمدة مسبقًا مخطط لها بعد كده.
4. عند الموافقة، الوكيل بيستلم إما **بطاقة أحادية الاستخدام** أو **رمز دفع مشترك (Shared Payment Token / SPT)** — بيانات اعتماد [ممكن تُحدَّد نطاقها بضوابط زي المبلغ والعملة والتاجر](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=scoped%20with%20controls%20like%20amount%2C%20currency%2C%20and%20merchant). زي ما Stripe بتقول: [«الوكيل ما بياخدش أبدًا وصول لبيانات دفعك الخام.»](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)

التصميم ده يستاهل قراءة متمعّنة لأنه بيقلب نموذج البطاقة المحفوظة رأسًا على عقب. البطاقة المحفوظة صلاحية دائمة يقدر التاجر (أو الوكيل) يسحب منها مرة بعد مرة، محكومة باتفاقيات بتتفعّل بعد وقوع الحدث مش عن طريق بيانات الاعتماد نفسها؛ أما طلب الإنفاق فهو منح صلاحية واحد، بيتولد لحظة الشراء، محدود بالشراء ده بالذات، وبيموت بعد كده. Stripe كمان بتكشف الطبقة اللي تحت — Issuing للوكلاء — عشان الشركات تقدر تبني محافظها الوكيلية الخاصة: بطاقات افتراضية أحادية الاستخدام، وتخزين أموال، وصلاحيات على مستوى البطاقة، ومراقبة معاملات، وضوابط احتيال وقت التفويض.

## Mercury: بطاقة الشركة تقابل الوكيل

محفظة Stripe بتجاوب على سؤال المستهلك — *إزاي أخلّي وكيل تسوّق يشتري حاجات بفلوسي؟* [إدارة الإنفاق](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents) بتاعة Mercury بتجاوب على النسخة الخاصة بالشركات، وإجابتها كاشفة: عامل الوكلاء زي الموظفين.

Mercury بتوصف المنتج بأنه [«إدارة مصاريف ذاتية التنفيذ بميزانيات ذكية، ومبالغ مستردة للموظفين، وبطاقات للفرق والوكلاء»](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents). الآليات هي نفس مجموعة أدوات إدارة الإنفاق المألوفة — [ميزانيات وضوابط حماية محددة لأغراض معينة](https://mercury.com/spend-management#:~:text=Set%20up%20budgets%20and%20guardrails%20to%20unblock%20your%20team%20and%20agents)، وحدود لكل فئة، وتتبّع لحظي، وسياسات تفرض نفسها بنفسها — بس ممتدة لتشمل منفقين مش بشريين: الشركات تقدر [تصدر بطاقات وكلاء مخصصة للمعاملات المعتمدة](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions)، وكل بطاقة بحدودها الخاصة.

الصفحة كمان بتعمل عرض توضيحي: وكيل بيملأ نموذج إتمام دفع بـ«بطاقة وكيل جين»، وبيعمل طلب إعلانات بـ$100، وبيرجع يبلّغ إن البطاقة عندها حد إنفاق $1,000 في الشهر وإن بيانات البطاقة استُخدمت بس لعملية الدفع دي — من غير ما تتخزن. Mercury Spend [متاحة لكل عملاء Mercury للخدمات المصرفية التجارية](https://mercury.com/spend-management#:~:text=included%20for%20all%20Mercury%20business%20banking%20customers)، مع نسخة مستقلة مخطط لها للفرق اللي بتتعامل مع بنوك تانية.

التأطير ده أهم من قايمة المزايا. بالنسبة لشركة، الوكيل اللي بيصرف فلوس مش مشكلة دفع غريبة جديدة — ده عدد موظفين. بياخد بطاقة، وميزانية، وغرض، وحد شهري، ومسار تدقيق، بالظبط زي موظف جديد في نظام المالية. لو Stripe بنت حلقة موافقة للمستهلكين، Mercury بنت خانة في الهيكل التنظيمي للبرمجيات.

## 16 شهر من الإعلانات

لو حطّيت الخط الزمني في مكان واحد، صعب تتجاهل سباق الاستحواذ:

| التاريخ | الشركة | إيه اللي اتعلن |
|---|---|---|
| 29 أبريل 2025 | Mastercard | [Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens): Agentic Tokens؛ الوكلاء لازم يكونوا [مسجّلين ومتحقق منهم](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=trusted%20AI%20agents%20to%20be%20registered%20and%20verified) عشان يقدروا يعملوا معاملات |
| 30 أبريل 2025 | Visa | [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users): فتح شبكة Visa لوكلاء الذكاء الاصطناعي عن طريق بيانات اعتماد مُرمَّزة |
| 16 سبتمبر 2025 | Google | [بروتوكول مدفوعات الوكلاء (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption): بروتوكول مفتوح بأكتر من 60 شريك، من Amex لـCoinbase لـPayPal |
| 29 سبتمبر 2025 | OpenAI + Stripe | [إتمام الدفع الفوري في ChatGPT](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe)، بتشغيل من بروتوكول Agentic Commerce Protocol (ACP) مفتوح المصدر |
| 15 يناير 2026 | Google | [Universal Commerce Protocol (UCP)](/ar/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/): معيار مفتوح للتوافق التجاري مصمم عشان يشتغل جنب AP2 |
| 29 أبريل 2026 | Stripe | [محفظة Link للوكلاء + Issuing للوكلاء](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching): وصول محفظة المستهلك وعناصر إصدار أساسية لإنفاق الوكلاء |
| 2026 | Mercury | [إدارة إنفاق ببطاقات وكلاء](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions): ميزانيات، وضوابط حماية، وبطاقات مخصصة للوكلاء |

ليه الاندفاع ده؟ ثلاث قوى، والجزء ده تفسير مش حاجة الإعلانات نفسها بتقولها صراحة:

**المشتري بيتحرك، والمحفظة عايزة تتحرك معاه.** OpenAI بتقول إن [أكتر من 700 مليون شخص بيلجأوا لـChatGPT كل أسبوع](https://openai.com/index/buy-it-in-chatgpt/#:~:text=More%20than%20700%20million%20people%20turn%20to%20ChatGPT%20each%20week)، ودلوقتي بتتعامل مع عمليات الشراء جوّه المحادثة. لو الاكتشاف وإتمام الدفع الاتنين بيحصلوا جوّه محادثة وكيل، أي حد بيوفّر محفظة الوكيل بيبقى قاعد بين كل تاجر وكل عميل. عرض Stripe للمطورين واضح في الجايزة: ابنِ على Link و[اوصل لقاعدتها اللي فيها 200 مليون مستهلك](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers). شركات المدفوعات اتفرجت على البحث والسوشيال ميديا وهم بيتوسطوا التجارة لمدة عقدين؛ ولا واحدة فيهم ناوية تتفرج على الوكلاء وهما بيعملوا كده من على الهامش.

**بيانات الاعتماد غير محددة النطاق ما بتعيشش أمام الأتمتة.** من غير مسارات مصممة خصيصًا، الناس بتدّي الوكلاء بطاقات محفوظة وبيانات دخول مشتركة — صلاحية دائمة من غير أي نطاق، بالظبط النمط اللي أنظمة كشف الاحتيال موجودة عشان تمسكه. رئيس المنتج في Visa أطّر المتطلب بأنه ثقة بتمتد لأبعد من المستخدمين: الوكلاء [«هيحتاجوا يبقوا موثوق بيهم في المدفوعات، مش بس من المستخدمين، لكن كمان من البنوك والبائعين»](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users). الشبكات اللي تقدر تفرّق بين وكيل مفوّض وبوت بيختبر بطاقات هتقدر توافق على معاملات أكتر سليمة وتمنع أكتر السيئة؛ والشبكات اللي مش هتقدر هتعمل الاتنين غلط.

**البروتوكولات عبارة عن استحواذ على أرض.** ACP، وAP2، وAgentic Tokens بتاعة Mastercard، وبيانات الاعتماد المُرمَّزة بتاعة Visa، كلهم عايزين يبقوا القواعد الافتراضية لعمليات الشراء الآلية. المعايير المفتوحة بتميل تكسب السباقات دي عن طريق إنها قابلة للتبني — وده بالظبط سبب إن OpenAI [فتحت مصدر ACP](https://openai.com/index/buy-it-in-chatgpt/#:~:text=Agentic%20Commerce%20Protocol%2C%20so%20that%20more%20merchants%20and%20developers%20can%20begin%20building) وGoogle جنّدت 60 شريك إطلاق لـAP2، بعدين تابعت في يناير 2026 بـ[Universal Commerce Protocol](/ar/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/) عشان توحّد سير عمل التسوق حوالين الدفع. محدش عايز يكامل المعيار الخسران مرتين.

## نمط تصميم واحد، شعارات كتير

لو شلت العلامة التجارية، أي منتج جاد لمدفوعات الوكلاء بيتلاقى عند نفس الخصائص الأربعة:

1. **متكشفش أبدًا بيانات الاعتماد الخام.** بطاقات أحادية الاستخدام (Stripe)، ورموز الدفع المشتركة (Stripe/ACP)، وAgentic Tokens (Mastercard)، وبيانات اعتماد مُرمَّزة (Visa). الوكيل بيحمل أداة مصممة لغرض محدد، مش رقم بطاقتك (PAN).
2. **حدّد نطاق الصلاحية.** المبلغ، والعملة، والتاجر، وحدود زمنية على بيانات الاعتماد نفسها — نسخة OpenAI: [رموز دفع مشفّرة «مفوّضة بس لمبالغ محددة وتجار محددين»](https://openai.com/index/buy-it-in-chatgpt/#:~:text=encrypted%20payment%20tokens%20are%20only%20authorized%20for%20specific%20amounts%20and%20specific%20merchants).
3. **سيب إنسان في حلقة الموافقة — على الأقل دلوقتي.** Stripe بتطلب مراجعة لكل طلب النهارده؛ ميزانيات Mercury بتفوّض الإنفاق مسبقًا في حدود إنسان حددها. مؤشر الاستقلالية بيتحرك، بس بيبدأ قريب من الصفر.
4. **خلّي إنفاق الوكيل واضح ومفهوم.** وكلاء مسجّلين (Mastercard)، وسلاسل سياق طلبات الإنفاق (Stripe)، وتتبّع لحظي وتطبيق قاعدة إيصال-أو-قفل-البطاقة (Mercury). كل معاملة لازم تجاوب على «مين الوكيل، بتفويض مين، ولإيه؟»

لو الخصائص دي حسّيتها مألوفة لو إنت قاري متعمّق في الكريبتو، فده صح. تحويل [عملة مستقرة](/ar/glossary/stablecoin/) مفوّض بتوقيع تحت مخطط الدفع الدقيق بتاع [x402](/ar/glossary/x402/) — مبلغ محدد، لمستلم محدد، صالح بس في نافذة زمنية، وموقّع من [محفظة](/ar/glossary/wallet/) الدافع نفسه لحظة الشراء — هو نفس التصميم اللي اتوصلّه من الاتجاه التاني، بس النطاق فيه محكوم بالتشفير بدل محرك سياسة جهة مُصدرة. Stripe نفسها بتدرج العملات المستقرة كوسيلة دفع جاية لمحافظ الوكلاء. عالم البطاقات وعالم الكريبتو بيتلاقوا على نفس الإجابة: *صلاحية لكل معاملة، مش صلاحية مسجّلة مسبقًا.*

## فين تدخل الدومينات في الصورة

الدومينات بقت واحدة من أول الحاجات اللي الوكلاء بيشتروها لوحدهم — هي كائنات API خالصة، من غير عنوان شحن مطلوب، وأي منتج وكيل منشور محتاج في الآخر اسم يتحكم فيه. إحنا كتبنا عن [إزاي الوكلاء بيشتروا دومينات من غير تدخل بشري](/ar/blog/agents-buy-domains/)، و[شكل مُسجِّل الدومينات المصمم للوكلاء](/ar/blog/agent-native/)، و[إزاي الوكيل بيسجّل دومين على Namefi](/ar/blog/ai-agent-register/) خطوة خطوة.

إجابة Namefi الخاصة بيها على سؤال الدفع هي إتمام الدفع بتوقيع المحفظة، المشروح بالتفصيل في [ادفع مقابل الدومينات بمحفظة كريبتو: من غير ما تحتاج حساب](/ar/blog/wallet-checkout/): محفظة وكيل بترد على تحدي x402 عن طريق توقيع تفويض تحويل USDC لتسجيل واحد محدد بالظبط، بسعر واحد محدد بالظبط، من غير حساب ومن غير بيانات اعتماد محفوظة في أي مكان — وبتستلم الدومين كـ[أصل مُرمَّز](/ar/glossary/tokenized-domain/) لنفس المحفظة دي. ده مدفوعات الوكلاء بالظبط بالمعنى اللي المقال ده بيوصفه، شغّال دلوقتي على منتج حقيقي، للحاجة اللي الوكلاء أكتر شيء متوقع إنهم يشتروها.

الاندفاع لتوفير مدفوعات الوكلاء، في النهاية، هو اندفاع عشان تبقى موثوق بيك. أكتر من 200 مليون مستهلك على Link، وأكتر من 700 مليون مستخدم أسبوعي على ChatGPT، وكل برنامج بطاقة شركات، كلهم بيتلاقوا عند نفس الرهان: مليار المشترين الجايين مش هيكونوا كلهم بشر، والبنية التحتية اللي بتدّي لبرمجياتهم صلاحية إنفاق آمنة ومحددة النطاق وخاضعة للمساءلة هتبقى أساسية زي ما كانت شبكة البطاقات أساسية للعصر السابق من التجارة.

## المصادر وقراءة إضافية

- Stripe — [إعطاء الوكلاء القدرة على الدفع](https://stripe.com/blog/giving-agents-the-ability-to-pay) (محفظة Link للوكلاء + Issuing للوكلاء، 29 أبريل 2026)
- Mercury — [إدارة الإنفاق](https://mercury.com/spend-management) (ميزانيات، وضوابط حماية، وبطاقات وكلاء مخصصة)
- Google Cloud — [الإعلان عن بروتوكول مدفوعات الوكلاء (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol) (16 سبتمبر 2025)
- OpenAI — [اشترِ في ChatGPT: إتمام الدفع الفوري وبروتوكول Agentic Commerce Protocol](https://openai.com/index/buy-it-in-chatgpt/) (29 سبتمبر 2025)
- Mastercard — [Mastercard تكشف عن Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html) (29 أبريل 2025)
- Visa — [ابحث واشترِ بالذكاء الاصطناعي: Visa تكشف عصرًا جديدًا للتجارة](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html) (Visa Intelligent Commerce، 30 أبريل 2025)
- Namefi — [ادفع مقابل الدومينات بمحفظة كريبتو: من غير ما تحتاج حساب](/ar/blog/wallet-checkout/) (إتمام دفع بتوقيع محفظة x402)
