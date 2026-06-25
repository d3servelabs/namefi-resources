---
title: 'نداء الطوارئ EP05: اختطاف نطاقات DeFi الجماعي على Squarespace 2024'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'في يوليو 2024، حوّلت عملية نقل نطاقات من Google Domains إلى Squarespace إعدادات المصادقة الضعيفة إلى ثغرة جماعية واسعة النطاق. استغل المهاجمون الثغرة واختطفوا نطاقات مشاريع كريبتو و DeFi كبرى — Compound Finance وCeler Network وPendle وUnstoppable Domains — وأعادوا توجيهها نحو مواقع تصيد لاستنزاف المحافظ. إليك كيف خلّفت عملية نقل "سلسة" مئات الأبواب الأمامية مفتوحة دون قفل، وما يمكننا تعلمه في مجال أمان مسجلي النطاقات والمصادقة الثنائية.'
keywords: ['اختطاف نطاق Squarespace', 'هجرة Google Domains', 'اختطاف DNS في DeFi', 'اختطاف Compound Finance', 'اختطاف Celer Network', 'استنزاف المحفظة', 'Inferno drainer', 'أمان النطاقات', 'نقل مسجل النطاق', 'المصادقة الثنائية MFA', 'اختراق حساب OAuth', 'اختطاف DNS', 'تصيد العملات المشفرة']
---

في يوليو 2024، لم يكن أخطر شيء على موقع مشروع كريبتو ثغرة في العقد الذكي أو مفتاحاً خاصاً مسرّباً. كان الخطر الحقيقي هو مسجّل النطاق الذي يمتلك الدومين.

لأيام متوالية في ذلك الشهر، كان المستخدمون يكتبون عنواناً مألوفاً في متصفحاتهم — الموقع الرسمي لبروتوكول إقراض موثوق، أو جسر استخدموه مئات المرات — فيصلون لما يبدو الصفحة الصحيحة تماماً، ثم يجدون محافظهم تُستنزف أمام أعينهم. لم يكن هناك اختراق بالمعنى المعتاد. لم يكسر أحد كلمة مرور أو يصطاد عبارة استرداد. المهاجمون ببساطة دخلوا من الباب الأمامي للـ*دومين* نفسه، لأن ذلك الباب كان مفتوحاً دون قفل أثناء انتقال مؤسسي لم ينتبه إليه معظم هذه المشاريع.

كان ذلك الانتقال هو نقل Google Domains إلى Squarespace. والباب المفتوح كان الإعدادات الافتراضية لمصادقة Squarespace. والنتيجة كانت موجة منسّقة من اختطافات [DNS](/ar/glossary/dns/) استهدفت مشاريع كريبتو و [DeFi](/ar/glossary/defi/) تتحكم، بحسب أحد الباحثين، في مليارات الدولارات من الأصول.

## كيف خلّقت عملية نقل مسجل النطاق ثغرة جماعية واسعة

لا يُنظر عادةً إلى النطاقات باعتبارها أسطولاً واحداً. كل نطاق يبدو وكأنه شيء مستقل وخاص — عنوانك، لوحة تحكمك، سجلات DNS الخاصة بك. لكن مسجلي النطاقات يحتفظون بها جملةً، وحين تنتقل قاعدة عملاء مسجّل بأكملها إلى مسجّل آخر، ينتقل كل حساب وفق *نفس منطق النقل*، بنفس *الإعدادات الافتراضية*، وفي *نفس الوقت*. أي ضعف في هذا المنطق لا يكون خطأً فردياً معزولاً — بل سمة تطال الأسطول كله.

هذا تحديداً ما جعل حادثة 2024 *حدثاً جماعياً* لا مجرد سلسلة من الاختراقات الفردية المؤسفة.

في يونيو 2023، [استحوذت Squarespace على نحو 10 ملايين نطاق من Google Domains](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20purchased%20roughly%2010%20million%20domain%20names%20from%20Google%20Domains%20in%20June%202023)، بعد أن أعلنت Google إغلاق خدمة مسجّل النطاقات الخاص بها. على مدار العام التالي، [كانت Squarespace تنقل مستخدمي نحو 10 ملايين نطاق اشترتهم في الصفقة](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=Squarespace%20has%20been%20migrating%20users%20for%20roughly%2010%20million%20domain%20names%20purchased%20in%20the%20transaction). ولجعل الانتقال يبدو سلساً، أنشأت Squarespace حسابات مسبقاً للأشخاص المرتبطين بكل نطاق منقول، مستندةً إلى عناوين البريد الإلكتروني المسجّلة لدى Google.

"السلاسة" كانت المشكلة بعينها. عملية نقل لا تطلب شيئاً من المستخدم هي عملية لم يُثبت فيها المستخدم أي شيء — لا كلمة مروره، ولا هويته، ولا سيطرته على البريد الإلكتروني. الحسابات كانت موجودة، والنطاقات مرتبطة بها، ولم يكن يفصل النطاق عمّن يصل أولاً إلا شاشة تسجيل دخول لا تطلب من أصحاب الحسابات المنقولة تقريباً أي شيء.

## اختطافات يوليو 2024

![رسم توضيحي بألوان زاهية يُظهر حشداً من مفاتيح المنازل-النطاقات تنسكب من شاحنة نقل أثناء عملية انتقال، وبعضها يتساقط في أيدٍ خفية، وصف من المنازل الصغيرة كل منها مُعنوَن بعنوان ويب متوهج](../../assets/the-2024-squarespace-defi-domain-hijacks-01-mass-hijack.jpg)

[بدأت الهجمات في التاسع من يوليو](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=The%20attacks%20started%20on%20July%209) واستمرت على مدار الأيام التالية. لم تكن هجمات خفية. كما أفادت BleepingComputer، [موجة منسّقة من هجمات اختطاف DNS تستهدف نطاقات العملات المشفرة لمنصات DeFi المسجّلة لدى Squarespace، وتعيد توجيه الزوار إلى مواقع تصيد تستضيف أدوات استنزاف المحافظ](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=A%20wave%20of%20coordinated%20DNS%20hijacking%20attacks%20targets%20decentralized%20finance%20%28DeFi%29%20cryptocurrency%20domains%20using%20the%20Squarespace%20registrar%2C%20redirecting%20visitors%20to%20phishing%20sites%20hosting%20wallet%20drainers).

أول من أحدث ضجة كان أحد أضخم الأسماء في إقراض DeFi. وشركة الأمن Blockaid، التي حقّقت في الحادثة، وجدت أن [زوار هذه المواقع كانوا يُعادون توجيههم إلى صفحات خبيثة مصمّمة لاستنزاف الأموال من المحافظ المتصلة](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=Visitors%20to%20these%20sites%20were%20being%20redirected%20to%20malicious%20pages%20designed%20to%20drain%20funds%20from%20connected%20wallets). المواقع المزيفة لم تكن نسخاً رديئة. وفقاً لـ Blockaid، [كانت هذه التطبيقات اللامركزية المزيفة تشغّل أحدث إصدار من أداة الاستنزاف Inferno، المصمّمة لخداع المستخدمين لتوقيع معاملات تُفرّغ محافظهم](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=These%20fake%20dApps%20were%20running%20the%20latest%20iteration%20of%20the%20Inferno%20draining%20kit%2C%20designed%20to%20trick%20users%20into%20signing%20transactions%20that%20would%20empty%20their%20wallets).

قائمة الضحايا المؤكدة بدت كسجل حضور لكبار منصات المنظومة. الجهات التي اختُطفت نطاقاتها شملت [Celer Network وCompound Finance وPendle Finance وUnstoppable Domains](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Celer%20Network%2C%20Compound%20Finance%2C%20Pendle%20Finance%2C%20and%20Unstoppable%20Domains). بالنسبة لـ Compound، [استُولي على نطاقها الرئيسي لعرض صفحة تصيد](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=its%20main%20domain%20had%20been%20taken%20over%20to%20display%20a%20phishing%20page). أما Celer فاكتشفت المحاولة و[استعادت سجلات DNS بسرعة](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=swiftly%20recovered%20its%20DNS%20records)؛ وPendle [واجهت مشكلات مماثلة](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=experienced%20similar%20issues) وحذّرت مستخدميها من إلغاء صلاحيات المحفظة.

## ما الذي كان على المحك — وما الذي خسره المستخدمون

قسوة اختطاف النطاق أنه يُبطل كل عادة علّمناها المستخدمين ليتكلوا عليها. تحقق من الرابط. تأكد أنه الموقع الحقيقي. ابحث عن أيقونة القفل. كل هذه النصائح تفترض أن النطاق لا يزال يشير إلى حيث يفترض أن يشير. حين يتحكم المهاجم في DNS النطاق، يكون الرابط *حقيقياً* — إنه عنوان المشروع الأصلي فعلاً — لكنه يقود إلى خادم المهاجم. القفل أخضر. شريط العنوان صادق. والصفحة فخ.

لهذا تتوافق أدوات استنزاف المحافظ مثل Inferno مع [اختطاف DNS](/ar/glossary/dns-hijacking/) توافقاً طبيعياً. أداة الاستنزاف لا تحتاج إلى سرقة كلمة مرور؛ تحتاج الضحية أن *تربط محفظتها وتوقّع*. والمستخدم الذي وصل عبر النطاق الحقيقي لبروتوكول الإقراض ليس لديه سبب للتردد قبل الموافقة على معاملة. الموقع المزيف يرث كل الثقة التي كسبها النطاق الشرعي على مدار سنوات.

كم كانت الأمور ستكون أسوأ؟ الرقم الذي كشف حجم الكارثة لم يكن عدد السرقات المؤكدة، بل عدد المشاريع *المكشوفة*. تحليل Blockaid، الذي أوردته Decrypt، كان صريحاً: [نحو 228 واجهة أمامية لبروتوكولات DeFi لا تزال في خطر](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack#:~:text=roughly%20228%20DeFi%20protocol%20front%20ends%20are%20still%20at%20risk)، لأن كلاً منها كان يقبع خلف نفس ثغرة الحسابات المنقولة. الاختطافات التي حدثت كانت مجرد عيّنة. سطح الهجوم كان يشمل كامل فئة الكريبتو التي ركبت موجة الانتقال من Google إلى Squarespace.

## كيف حدث ذلك: ثغرة المصادقة في عملية النقل

![رسم توضيحي بألوان زاهية يُظهر صفاً طويلاً من صناديق البريد أمام مبنى جديد، كل باب مفتوح وغير مقفل، وشخصية بلا ملامح تضع رسائل بهدوء في أحدها قبل أن يصل صاحبه الحقيقي، تباين بين الضوء الدافئ والبارد](../../assets/the-2024-squarespace-defi-domain-hijacks-02-migration-flaw.jpg)

الآلية، حين أعاد الباحثون تركيبها، كانت محرجة في بساطتها — وهذا بالضبط ما جعلها خطيرة على نطاق واسع.

ابدأ باختيارين في التصميم. أولاً، لم تتحقق Squarespace من أن الشخص الذي يسجل الدخول يتحكم فعلاً في البريد الإلكتروني المرتبط بالحساب. كما قال الباحثون، [Squarespace لا تشترط التحقق من البريد الإلكتروني للحسابات الجديدة المنشأة بكلمة مرور](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts#:~:text=Squarespace%20doesn%27t%20require%20email%20verification%20for%20new%20accounts%20created%20with%20a%20password). ثانياً، الحسابات المنقولة كانت مُنشأة مسبقاً لكنها لم تُطالَب بعد — لم تكن لها كلمة مرور. لذا حين يصل شخص ما ببريد إلكتروني صحيح، [وبما أنه لا توجد كلمة مرور على الحساب، يُوجَّه مباشرة إلى مسار 'أنشئ كلمة مرور لحسابك الجديد'](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=since%20there%27s%20no%20password%20on%20the%20account%2C%20it%20just%20shoots%20them%20to%20the).

اجمع الاثنين معاً وسيكتب الهجوم نفسه بنفسه. عناوين البريد الإلكتروني المرتبطة بالنطاقات المنقولة لم تكن سرية — جهات اتصال المسؤول والمسجّل كثيراً ما تكون علنية أو قابلة للتخمين. المهاجم الذي سجّل الحساب أولاً، مستخدماً بريداً إلكترونياً منقولاً معروفاً، قبل أن يسجل الدخول المالك الحقيقي، خرج بالسيطرة الكاملة على النطاق. وصف مدير المنتج الرئيسي في MetaMask، Taylor Monahan، أحد الباحثين الذين حللوا الحادثة، النقطة العمياء بدقة: [Squarespace لم تأخذ في الحسبان احتمال أن يسجّل جهة تهديد حساباً باستخدام بريد إلكتروني مرتبط بنطاق منقول حديثاً قبل أن يُنشئ صاحب البريد الحقيقي حسابه بنفسه](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20never%20accounted%20for%20the%20possibility%20that%20a%20threat%20actor%20might%20sign%20up%20for%20an%20account%20using%20an%20email%20associated%20with%20a%20recently%2Dmigrated%20domain%20before%20the%20legitimate%20email%20holder%20created%20the%20account%20themselves).

لماذا كان الربط المسبق موجوداً أصلاً؟ للراحة. خلص الباحثون إلى أن [Squarespace افترضت أن جميع المستخدمين القادمين من Google Domains سيختارون خيارات تسجيل الدخول الاجتماعي](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20assumed%20all%20users%20migrating%20from%20Google%20Domains%20would%20select%20the%20social%20login%20options) — Google OAuth — بدلاً من البريد الإلكتروني وكلمة المرور. النظام [يربط جميع رسائل البريد الإلكتروني بالنطاقات مسبقاً بصرف النظر عن وجود الحساب من عدمه، على الأرجح لأنهم أرادوا أن يتمكن المستخدمون من تسجيل الدخول عبر OAuth مع Google وأن يتاح لهم الوصول الفوري إلى جميع نطاقاتهم](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/#:~:text=pre%2Dlinking%20all%20emails%20to%20domains%2C%20regardless%20of%20whether%20the%20account%20already%20exists%2C%20likely%20because%20they%20wanted%20users%20to%20be%20able%20to%20OAuth%20with%20Google%20and%20immediately%20have%20access%20to%20all%20their%20domains)، كما أوضح الباحثون لـ The Register. لكن مسار البريد الإلكتروني وكلمة المرور لم يُغلق قط، وعلى هذا المسار لم يثبت شيء أن الشخص يتحكم في صندوق الوارد.

كان هناك عامل تصعيد إضافي. خلال عملية النقل، أُغلقت الحماية التي كان يُفترض أن تكشف هذه الثغرة: [ضمن إجراءات الانتقال إلى Squarespace، أُوقفت المصادقة متعددة العوامل على الحسابات](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=as%20part%20of%20the%20transition%20to%20Squarespace%2C%20multi%2Dfactor%20authentication%20was%20turned%20off%20on%20accounts). حتى صاحب نطاق فعّل بعناية MFA على Google Domains وجد نفسه في Squarespace بدون تلك الحماية. لا كلمة مرور للاختراق، ولا عامل ثانٍ للتجاوز، ولا بريد إلكتروني للاعتراض — بالنسبة لحساب منقول وغير مطالَب بعد، كان امتلاك عنوان بريد إلكتروني قابل للتخمين هو قصة المصادقة بأكملها.

## الاستجابة والتخفيف

تحرّك مجتمع أمن الكريبتو أسرع من مسجّل النطاق. الباحثون — من بينهم [Samczsun وTaylor Monahan وAndrew Mohawk](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=Samczsun%2C%20Taylor%20Monahan%2C%20and%20Andrew%20Mohawk) — نشروا تفاصيل الآلية، وتداولت Blockaid قوائم الواجهات الأمامية لا تزال معرضة للخطر حتى تتمكن المشاريع من التحقق من وضعها. المشاريع المتضررة سارعت إلى استعادة حساباتها وإعادة ضبط سجلات DNS وتحذير المستخدمين من إلغاء صلاحيات الرموز الممنوحة للمواقع الخبيثة.

نصيحة المعالجة الفورية كانت واحدة للجميع ممن لا يزالون على حسابات منقولة: سجّل الدخول واستلم حسابك قبل أن يفعل مهاجم ذلك، واضبط كلمة مرور قوية وفريدة، و— فوق كل شيء — أعد تفعيل المصادقة متعددة العوامل التي أزالتها عملية النقل بصمت. وعملت Squarespace من جهتها على تأمين الحسابات المنقولة ومسار إنشاء الحسابات. لكن الدرس الهيكلي بقي بعد التصحيح: أي ضابط أمني تُوقفه الشركة المورّدة خلال عملية نقل يصبح، طوال مدة ذلك النقل، ضابطاً غير موجود.

## ما تعلمناه عن أمان مسجلي النطاقات والمصادقة الثنائية

اختطافات Squarespace ليست قصة خطأ إعداد في شركة واحدة. إنها قصة عن مكان وجود السيطرة الحقيقية على النطاق، وهشاشة الطبقة التي تعلو ال[بلوكتشين](/ar/glossary/blockchain/).

ثمة دروس تتخطى يوليو 2024 بكثير:

1. **حساب مسجّل النطاق هو جذر الثقة الحقيقي — لا العقد الذكي.** لم يكن لدى أي من البروتوكولات المتضررة ثغرة في عقودها. كودها [على السلسلة](/ar/glossary/on-chain/) كان سليماً. استولى المهاجمون على *النطاق*، والنطاق هو ما يكتبه المستخدمون ويثقون به ويربطون محافظهم إليه. مشروع يمكن أن يكون مثالياً على السلسلة ومع ذلك يسلّم مستخدميه لمهاجم إذا كانت مستوى التحكم في DNS لديه ضعيفاً.

2. **المصادقة متعددة العوامل حماية فقط إذا نجت من عمليات النقل.** التفصيل المؤلم هنا أن MFA لم تفشل تحت الهجوم — بل *أُزيلت* قبل الهجوم، كإجراء تسهيلي في عملية النقل. تعامل مع حالة MFA كشيء تتحقق منه بعد كل نقل أو تحويل أو تغيير مورّد، لا شيء تضبطه مرة ثم تنساه.

3. **"السلاسة" مقايضة أمنية.** كل خطوة تتجاوزها عملية النقل لراحة المستخدم هي خطوة لم تثبت فيها الهوية. الحسابات المنشأة مسبقاً، والبريد الإلكتروني المربوط تلقائياً، وتسجيل الدخول دون تحقق — كلها احتكاك لم يشعر به المستخدم، والاحتكاك في أغلب الأحيان هو ما كان يبقي المهاجمين خارجاً.

4. **المعرّفات القابلة للتخمين بيانات اعتماد مُقنّعة.** "السر" الذي فتح هذه النطاقات كان عنوان بريد إلكتروني لم يكن سراً أبداً. أي نظام يمنح السيطرة لمن يعرف معرّفاً عاماً هو نظام على بُعد انتحال هوية واحد من الاختراق.

5. **نطاق الضرر لمسجّل النطاق يساوي قاعدة عملائه بأكملها.** أمان النطاق الفردي لا يهم إذا كان السلوك الافتراضي لمسجّل النطاق ضعيفاً، لأن الإعداد الافتراضي يطال الجميع في آنٍ واحد. أين يسكن نطاقك، وكيف يتعامل ذلك الحارس مع المصادقة، قرار أمني بنفس أهمية أي قرار تتخذه على السلسلة.

## زاوية Namefi

![رسم توضيحي ملون لملكية نطاق قابلة للتحقق ومقاومة للتلاعب — بطاقة نطاق مؤمّنة بدرع أخضر ورمز Namefi الأخضر واستمرارية DNS](../../assets/the-2024-squarespace-defi-domain-hijacks-03-namefi-angle.jpg)

اختطافات 2024 حدثت في الفجوة بين "من يمتلك هذا النطاق فعلاً" و"من يستطيع تسجيل الدخول إلى الحساب الذي يتحكم فيه". في النموذج التقليدي، هذان الأمران مرتبطان ارتباطاً فضفاضاً فحسب: الملكية هي سجل في قاعدة بيانات مسجّل النطاق، والوصول إليها محكوم بما تُطبّقه شركة تلك المصادقة هذا الأسبوع — بما في ذلك في خضم نقل 10 ملايين نطاق حين كان الباب مفتوحاً على مصراعيه.

[Namefi](https://namefi.io) مبنية لسدّ هذه الفجوة. بتمثيل [ملكية النطاق](/ar/glossary/domain-ownership/) كأصل مُرمَّز على السلسلة يبقى متوافقاً مع DNS، تصبح السيطرة شيئاً يمكن *التحقق منه تشفيرياً* بدلاً من الاعتماد على بريد إلكتروني قابل للتخمين وإعدادات افتراضية لتسجيل الدخول عند مورّد. الملكية تسكن في محفظة تتحكم فيها، وعمليات النقل قابلة للمراجعة، وسؤال "من المسموح له بتغيير سجلات هذا النطاق" له إجابة مقاومة للتلاعب لا إجابة خدمة العملاء.

ذلك لم يكن ليجعل عملية نقل Squarespace مثالية. لكنه يغيّر طريقة الفشل. المهاجم الذي يسجّل حساباً ببريد إلكتروني معروف لا يمتلك بذلك نطاقاً مُرمَّزاً — الملكية ليست صفاً في قاعدة بيانات يمكن لحساب نصف مُهيَّأ أن يستولي عليه بصمت. مستوى التحكم في الاسم يجب أن يكون بنفس صعوبة تزوير الأصول التي يحرسها. في يوليو 2024، لمئات من مشاريع الكريبتو، لم يكن كذلك. تلك الفجوة بالضبط تستحق أن تُحسم هندسياً.

## المصادر وقراءات إضافية

- Krebs on Security — [Researchers: Weak Security Defaults Enabled Squarespace Domains Hijacks](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/)
- BleepingComputer — [DNS hijacks target crypto platforms registered with Squarespace](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/)
- Blockaid — [Squarespace Domain Hijacking Incident: Attack Report](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident)
- SecurityWeek — [Hackers Exploit Flaw in Squarespace Migration to Hijack Domains](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/)
- Decrypt — [More Than 220 DeFi Protocols Still 'at Risk' From Squarespace DNS Hijack](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack)
- The Register — [Infoseccers claim Squarespace migration linked to DNS hijackings at Web3 firms](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/)
- Socket — [Squarespace Domain Hijacks Enabled by Email Address Exploit on Migrated Accounts](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts)
- SiliconANGLE — [Multiple crypto domains hijacked from Squarespace due to Google Domains migration flaw](https://siliconangle.com/2024/07/15/multiple-crypto-domains-hijacked-squarespace-due-google-domains-migration-flaw/)
- Cybernews — [Squarespace crypto domains under DNS attack, lack of MFA to blame](https://cybernews.com/security/squarespace-dns-hijack-attack-crypto-domains-mfa/)
- Hackread — [DeFi Hack Alert: Squarespace Domains Vulnerable to DNS Hijacking](https://hackread.com/defi-hack-alert-squarespace-domains-dns-hijacking/)
- CircleID — [Security Lapses Lead to Squarespace Domain Hijacks](https://circleid.com/posts/20240716-security-lapses-lead-to-squarespace-domain-hijacks)
