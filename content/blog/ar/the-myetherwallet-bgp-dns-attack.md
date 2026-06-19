---
title: 'هجوم BGP + DNS على MyEtherWallet: كيف سرق اختراق التوجيه على الإنترنت ما يقارب 150 ألف دولار بالإيثر'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'في 24 أبريل 2018، اخترق المهاجمون التوجيه على الإنترنت الخاص بـ Amazon Route 53، ودسّوا إجابات DNS مسمومة لـ myetherwallet.com، وأداروا موقعًا مزيفًا بشهادة موقّعة ذاتيًا — فسرقوا ما يقارب 150 ألف دولار من الإيثر. غوص عميق في أسباب اعتماد DNS على طبقة توجيه تثق بكل شيء افتراضيًا.'
keywords: ['myetherwallet', 'bgp hijack', 'dns hijacking', 'amazon route 53', 'route 53 hijack', 'dns security', 'bgp routing security', 'ethereum phishing', 'self-signed certificate', 'enet as10297', 'rpki roa', 'crypto wallet phishing', 'domain security']
---

لما بتكتب اسم موقع في المتصفح، بتكون بتثق في منظومتين غير مرئيتين إنهم يكونوا صادقين معاك.

الأولى هي **DNS** — دليل الهاتف على الإنترنت — اللي بيحوّل اسم زي `myetherwallet.com` لعنوان IP رقمي. والثانية هي **BGP**، بروتوكول Border Gateway، اللي بيحدد إيه المسار الفعلي اللي الباكيتات بتسلكه للوصول لذلك العنوان. ما حدش تقريبًا بيفكر في أيٍّ منهم. بيشتغلوا وخلاص، مليارات المرات كل يوم، في صمت تام.

في صباح **24 أبريل 2018**، كدابوا الاتنين في نفس الوقت. لمدة ساعتين تقريبًا، أي حد كتب `myetherwallet.com` وضغط "تجاهل" على تحذير المتصفح، اتبعت لموقع مزيف على سيرفر بعيد كل البعد عن مقصده الحقيقي. لما ضبط التوجيه نفسه، كان المهاجمون قد سحبوا ما يقارب **150 ألف دولار بالإيثر** من محافظ المستخدمين الحقيقية.

اللي بيخلي هذه الحادثة ثابتة في مناهج الأمن مش المبلغ — سرقات الكريبتو تجاوزته بكتير من بعدها. الأهم هو *الآلية*. المهاجمون ما اخترقوش سيرفرات MyEtherWallet. ما خمّنوش أي كلمة مرور. هاجموا **الطريق**، مش المبنى — باختراق طبقة التوجيه على الإنترنت لتسميم DNS نفسه.

## DNS قاعد فوق طبقة توجيه بتثق بالكل افتراضيًا

عشان تفهم اللي حصل، لازم تفهم الأساس غير المريح اللي تحت كل اسم دومين على وجه الأرض.

DNS بيجاوب سؤال "إيه عنوان IP الخاص بـ `myetherwallet.com`؟" لكن عشان استعلام DNS بتاعك يوصل للسيرفر الصح أصلًا، راوترات الإنترنت لازم تعرف *إيه الشبكة* اللي بتمتلك عناوين IP لسيرفر DNS ده — وعشان يعرفوا كده، بيعتمدوا على BGP.

وهنا المشكلة. BGP بطبيعته نظام قايم على الثقة. زي ما بيقول الملخص على ويكيبيديا، [بروتوكول BGP افتراضيًا مُصمَّم يثق في كل إعلانات الطرق اللي بتيجيه من الأنداد](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). والباحث الأمني Bob Cromwell بيوصف القصد الأصلي بشكل أصرح: [BGP اتصمم عشان يكون سلسلة ثقة بين مزودي خدمة إنترنت وجامعات حسنة النية بتصدّق بشكل أعمى على المعلومات اللي بتستقبلها](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html#:~:text=BGP%20was%20designed%20to%20be%20a%20chain%20of%20trust).

بمعنى تاني: لما مشغّل شبكة يقوم ويعلن للعالم "الترافيك الخاص بـ *العناوين دي* ييجيلي عن طريقي"، بقية الإنترنت تاريخيًا بتصدّق كده. في BGP في قاعدة كسر التعادل بالمسار الأكثر تحديدًا — لو شبكتين ادّعتا نفس العناوين، اللي بتعلن عن الكتلة *الأضيق* والأكثر تحديدًا بتكسب. وده تحديدًا الرافعة اللي المهاجم بيستخدمها.

فبالتالي سطح الهجوم لأي دومين أكبر من المسجّل بتاعه، وأكبر من مزود DNS بتاعه، وأكبر من مستضيف الموقع. بيشمل نسيج التوجيه العالمي كله اللي بيوصّل استعلام DNS بتاعك للمكان الصح. MyEtherWallet عرفت ده بالطريقة الصعبة.

## اللي خسره المستخدمون في 24 أبريل 2018

![فن مفاهيمي ملوّن يصوّر ترافيك الإنترنت وهو بيتدفق على طريق بيانات متوهج، ثم ينحرف فجأة بلافتة تحويل مزيفة نحو طريق وهمي يؤدي لمبنى منتحل، وجزيئات الضوء تتفرق في فخ](../../assets/the-myetherwallet-bgp-dns-attack-01-attack.jpg)

الخسائر تركّزت في نافذة ساعتين تقريبًا. وفقًا لـ The Register، استمر التوجيه الخبيث [من 11 صباحًا لـ 1 ظهرًا UTC](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Between%2011am%20and%201pm%20UTC) في ذلك اليوم. خلال تلك الفترة، جزء من كل من حاول الوصول لـ `myetherwallet.com` اتوجّه بهدوء لموقع منتحل.

الموقع المنتحل كان مقنعًا. شاف زي MyEtherWallet لأنه كان نسخة طبق الأصل تقريبًا. *الوحيد* اللي كشفه كان تحذير الشهادة — والمشكلة إن المستخدمين كانوا يقدروا يضغطوا "تجاهل" وييجوا. اللي عملوا كده وسجّلوا دخولهم، سلّموا مفاتيح أموالهم على طبق. زي ما أفاد BleepingComputer، [اللي سجّلوا دخولهم اتسرقت منهم المفاتيح الخاصة لمحافظهم، واستخدمها المهاجم لتفريغ الحسابات](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=Those%20who%20logged%20in%20had%20their%20wallet%20private%20keys%20stolen).

الحصيلة مختلفة شوية بين المصادر، لكن الرقم الأساسي متسق. BleepingComputer بيقول [215 إيثر، ما يعادل 160 ألف دولار، وقت التحويل](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=215%20Ether%2C%20the%20equivalent%20of%20%24160%2C000). CyberScoop أفادت إن اللصوص [نجحوا في سرقة 215 إيثر، ما يعادل تقريبًا 152 ألف دولار وقتها](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/#:~:text=215%20Ether%2C%20amounting%20to%20about%20%24152%2C000). Help Net Security لخّصت إن المهاجمين [نجحوا في سرقة حوالي 150 ألف دولار من الإيثر](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=approximately%20%24150%2C000%20in%20Ethereum). نفس الـ 215 إيثر؛ الرقم بالدولار بس بيتغير مع سعر الصرف وقت السرقة.

دي الاقتصاديات القاسية لهجوم التوجيه + DNS على محفظة كريبتو. مفيش قسم رد المبالغ، مفيش استرداد، مفيش بنك تتصل بيه. لما المفاتيح الخاصة تُدخَل في موقع مزيف للمهاجم وتتحوّل الأموال على البلوك تشين، راحت.

## كيف حصل: اختطف المسار، سمّم الإجابة، شغّل الموقع المزيف

![فن مفاهيمي ملوّن لخريطة عالمية متوهجة ومختطفة، حيث يد منتحلة تعيد رسم مسار GPS، وبتوجّه المسافرين نحو معلم وهمي بينما الوجهة الحقيقية تتوهج مُتجاهَلة في الخلفية](../../assets/the-myetherwallet-bgp-dns-attack-02-bgp-hijack.jpg)

الهجوم ربط فشلين ببعض. أي منهم وحده ما كانش هيجيب نتيجة. مع بعض كانوا مدمرين.

**الخطوة الأولى: اختطف المسار لسيرفرات DNS الخاصة بـ Amazon.** MyEtherWallet كانت بتستخدم خدمة DNS المُدارة من Amazon. زي ما أشار Help Net Security ببساطة، [MyEtherWallet.com بتستخدم خدمة Amazon's Route 53 DNS](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=MyEtherWallet.com%20uses%20Amazon%27s%20Route%2053%20DNS%20service). المهاجمون ما اخترقوش Route 53. بدلًا من كده، وفق The Register، [حد قدر يبعت رسائل BGP – Border Gateway Protocol – لراوترات الأساسية على الإنترنت عشان يقنعها إنها تبعت الترافيك المتوجه لبعض سيرفرات AWS لجهاز خارج السيطرة](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=someone%20was%20able%20to%20send%20BGP).

الإعلان اللي عمل ده جه من مكان غير متوقع. أفادت The Register إن [كتلة الشبكة AS10297، التابعة لشركة استضافة مواقع ويب في أوهايو اسمها eNet، أعلنت إنها قادرة تستولي على الترافيك المتجه لبعض عناوين IP الخاصة بـ AWS](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=the%20network%20block%20AS10297%2C%20belonging%20to%20Ohio-based%20website%20hosting%20biz%20eNet). ولأن BGP بيفضّل المسارات الأكثر تحديدًا وبيثق في أنداده، الإعلان الوهمي انتشر. ويكيبيديا بتسجّل الحجم: [تم اختطاف حوالي 1300 عنوان IP داخل فضاء Amazon Web Services، مخصصة لـ Amazon Route 53، من قِبَل eNet (أو أحد عملائها)، مزود خدمة إنترنت في Columbus, Ohio. عدة شركاء peering، زي Hurricane Electric، نشروا الإعلانات بشكل أعمى](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=Roughly%201300%20IP%20addresses%20within%20Amazon%20Web%20Services%20space). "نشروا بشكل أعمى" دي الحكاية كلها لنموذج الثقة في BGP في كلمتين.

**الخطوة الثانية: أصبح سيرفر DNS وكذب.** لما اتاختطف المسار، الاستعلامات اللي المفروض كانت هتوصل لسيرفرات DNS الحقيقية عند Amazon وصلت بدلًا من كده لجهاز المهاجم. الجهاز ده انتحل شخصية Route 53. The Register وصف النتيجة: [الجهاز المارق ده عمل دور خدمة DNS لـ AWS، وأعطى عناوين IP غلط لـ MyEtherWallet.com، ووجّه بعض الزوار المنكودين للـ dot-com لموقع تصيّد](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=That%20rogue%20machine%20then%20acted%20as%20AWS%27s%20DNS%20service). تحليل Kentik بيصوغ نفس الحقيقة من جانب DNS: [سيرفر DNS السلطوي المنتحل أرجع ردود وهمية لـ myetherwallet.com، ووجّه المستخدمين لنسخة مزيفة من موقع MyEtherWallet](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=The%20imposter%20authoritative%20DNS%20server%20returned%20bogus%20responses%20for%20myetherwallet.com).

**الخطوة الثالثة: شغّل الموقع المزيف — من روسيا.** ردود DNS المسمومة وجّهت المستخدمين لسيرفر في روسيا بيستضيف المحفظة المزيفة. Help Net Security أفادت إن المهاجمين استخدموا الاختطاف لـ [تحويل الترافيك المتجه لـ MyEtherWallet.com لموقع التصيّد المشابه، المستضاف على سيرفر في روسيا](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=they%20redirect%20traffic%20meant%20for%20MyEtherWallet.com%20to%20the%20lookalike%20phishing%20site%2C%20hosted%20on%20a%20server%20in%20Russia).

**الضمانة الوحيدة اللي كادت تنجح: الشهادة.** هنا الجزء اللي كل قارئ لازم يتوقف عنده. المهاجمون تحكموا في *التحليل* بتاع الدومين والسيرفر، لكن ما قدروش يعملوا شهادة TLS صالحة لـ `myetherwallet.com` صادرة من جهة موثوقة. فالمتصفح عمل بالظبط اللي المفروض يعمله — رمى تحذير. Help Net Security وصفه بدقة: [الوحيد اللي كشف إن موقع التصيّد مش اللي بيتظاهر بيه كان التحذير اللي ظهر للزوار بإن شهادة TLS المستخدمة في الموقع موقّعة من جهة مجهولة (يعني موقّعة ذاتيًا)](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=the%20only%20thing%20that%20gave%20some%20indication). BleepingComputer اتفق إن العلامة كانت واضحة لأي حد مُنتبه: [الموقع المزيف كان سهل الاكتشاف لأن المهاجمين استخدموا شهادة TLS موقّعة ذاتيًا أطلقت خطأ في كل المتصفحات الحديثة](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=The%20fake%20website%20was%20easy%20to%20spot).

لكن "سهل الاكتشاف" بيفترض إن المستخدم بيوقف. ESET's WeLiveSecurity التقط مدى هشاشة الحماية فعليًا: [القرينة الوحيدة الواضحة اللي المستخدم العادي كان ممكن يلاحظها كانت رسالة خطأ بتقول إن الموقع بيستخدم شهادة SSL غير موثوقة](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/#:~:text=The%20only%20obvious%20clue%20that%20a%20typical%20user%20might%20have%20spotted). المتصفح رفع إيده وقال *في حاجة غلط*. المستخدمون اللي خسروا فلوس هم اللي ضغطوا "تجاهل" على طول — والضحايا [كان عليهم تجاوز رسالة خطأ HTTPS، لأن myetherwallet.com المزيفة كانت بتستخدم شهادة TLS/SSL غير موثوقة](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Victims%20had%20to%20click%20through%20a%20HTTPS%20error%20message).

## الاستجابة والتداعيات

الاختطاف ما كانش خفيًا على اللي بيراقبوا التوجيه بشكل احترافي. مراقبو الشبكات شافوا البريفيكسات الوهمية الأكثر تحديدًا تظهر وتختفي في نفس نافذة الساعتين، وبمجرد سحب الإعلان المارق، عاد التوجيه الطبيعي لـ Route 53.

MyEtherWallet نفسها أكدت بشدة إن بنيتها التحتية ما اتاختُرقتش. زي ما شددت الشركة في أعقاب الحادثة مباشرة، المشكلة كانت في سباكة الإنترنت، مش في التطبيق — كان ده [اختطاف DNS](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=DNS%20hijacking) لمسار التحليل، متحقّق عبر BGP، مش اختراق لسيرفرات أو كود MEW.

الإصلاح الأعمق جاء على مستوى التوجيه. الحادثة أصبحت من أكثر الحجج استشهادًا لدعم **RPKI** (Resource Public Key Infrastructure) و**ROAs** (Route Origin Authorizations) — سجلات تشفيرية بتخلّي الشبكات تُعلن بطريقة قابلة للتحقق إيه الأنظمة المستقلة *المسموح لها* تُعلن عن إيه بريفيكسات IP. بوجود ROAs صالحة، إعلان "أنا هاخد عناوين Amazon" من مزود خدمة إنترنت في أوهايو يتصنّف كـ **RPKI-invalid** ويُسقَط بدل ما [ينتشر بشكل أعمى](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=blindly%20propagated%20the%20announcements). Kentik بيلاحظ النتيجة بشكل مباشر: لو نُفّذ نفس الإعلان اليوم ضد بريفيكس موقّعة بشكل صحيح، [كان هيتقيّم كـ RPKI-invalid](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=it%20would%20have%20been%20evaluated%20as%20RPKI-invalid). في السنوات اللي بعد هجمات زي دي، الشبكات الكبيرة سرّعت نشر ROAs لهذا النوع بالذات من مسارات التوجيه.

لكن تبنّي RPKI جهد عالمي متعدد السنوات وطوعي الاشتراك. الدرس للبقية كان أبسط وأفوري: أمان الدومين بتاعك بيعتمد على طبقات انت ما بتملكهاش وما بتشوفهاش.

## اللي بيعلّمنا BGP وDNS كونهم قايمين على الثقة الافتراضية

الحادثة دي تستاهل الحفظ لأنها بتعكس النموذج الذهني المعتاد لـ"أمان الدومين".

معظم الناس بيفتكروا إن أمان الدومين معناه كلمة مرور قوية للمسجّل، وتحقق بخطوتين، وقفل الدومين. كل ده حقيقي وضروري — و**ما كانش أي منه هيوقف 24 أبريل 2018.** المهاجمون ما لمسوش المسجّل، ما لمسوش سجلات DNS الخاصة بـ MyEtherWallet، ما لمسوش سيرفراتها. السجلات كانت بتقول الصح طول الوقت. الإنترنت بس بطّل يوصّل الاستعلامات للمكان اللي بيحتفظ بيها.

بعض الدروس الثابتة:

1. **الدومين بتاعك راكب على ثقة مستعارة.** التحليل بيعتمد على BGP، وBGP [افتراضيًا مُصمَّم يثق في كل إعلانات الطرق من الأنداد](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). ممكن تكون عندك إعداد DNS مثالي وبرضو تتاختطف في طبقة تحتها.

2. **تسميم DNS ممكن يتحقق من غير ما حد يلمس DNS خالص.** اختطف المسار لسيرفر DNS وانت بقيت بتتحكم في الإجابات، حتى لو السجلات السلطوية ما اتلمستش.

3. **TLS ضمان حقيقي — وهش في نفس الوقت.** تحذير الشهادة كان الشيء الوحيد اللي وقف بين المستخدمين والخسارة الكاملة. نجح تقنيًا وفشل سلوكيًا. إجراء أمني المستخدم يقدر يتجاوزه بضغطة زرار بيبقى قوي بقدر صبر المستخدم بس.

4. **نهائية البلوك تشين بترفع شبكة الأمان.** لو كان هجوم تسجيل دخول لبنك، الجلسة المسمومة كانت هتبقى وحشة. بالنسبة لمحفظة كريبتو، مرجعتش. نفس الهجوم ضد نوع تاني من المواقع كان ممكن يبقى مخيف بس؛ هنا كانت خسارة دائمة.

5. **الدفاع المتعمق لازم يشمل طبقة التوجيه.** RPKI/ROA على مستوى الشبكة، مع مراقبة إعلانات الأصل غير المتوقعة لبريفيكساتك، بقت الحد الأدنى المطلوب لأي شيء بقيمة عالية.

## الزاوية الخاصة بـ Namefi

![رسم توضيحي ملوّن لملكية دومين قابلة للتحقق ومقاومة للتلاعب — بطاقة دومين مؤمّنة بدرع أخضر وتوكن Namefi أخضر واستمرارية DNS](../../assets/the-myetherwallet-bgp-dns-attack-03-namefi-angle.jpg)

هجوم MyEtherWallet تذكير حاد إن الدومين مش حاجة واحدة بتـ"تملكها" — هو كومة من علاقات الثقة، أي طبقة فيها ممكن تتهشّم: الريجيستري، والمسجّل، ومزود DNS، ونسيج التوجيه العالمي اللي بيوصّل الاستعلامات لذلك المزود.

[Namefi](https://namefi.io) بتنبي عليها إنها تخلي طبقة *الملكية* في تلك الكومة قابلة للتحقق ومقاومة للتلاعب. ملكية الدومين المُرمَّزة كتوكن معناها إن التحكم في الدومين يقدر يتثبّت تشفيريًا وينتقل بطريقة قابلة للمراجعة، بدل ما يعتمد بالكامل على كلمة مرور حساب عند مزود واحد — مع الحفاظ على توافقها مع DNS. ده بمفرده ما بيصلّحش BGP؛ ما في طبقة الملكية ما بيعيد كتابة طريقة توجيه الباكيتات على الإنترنت. لكنه بيهاجم نفس المرض الأساسي اللي كشفته هذه الحادثة: **كتير جدًا من ثقة الإنترنت الحيوية ضمنية وغير قابلة للتحقق وقابلة للعكس من أي حد يقدر يزوّر الرسالة الصح.**

مستقبل أمان الدومين شبهه أقل بكلمة مرور قوية واحدة وأكتر بإثبات تشفيري على كل طبقة — ملكية قابلة للتحقق، توجيه قابل للتحقق (RPKI)، هوية قابلة للتحقق (TLS). مستخدمو MyEtherWallet خسروا فلوسهم في الفجوة بين تلك الطبقات. إغلاق الفجوة دي، طبقة قابلة للتحقق في كل مرة، هو المشروع كله.

سجلات الدومين ما كانتش غلط في 24 أبريل 2018. الإنترنت بس صدّق كدبة في طريقة الوصول ليها. إثبات "مين يمتلك إيه، وكيف توصله" بدل ما يبقى افتراض هو الطريقة اللي بتضمن إن الإعلان المزوّر الجاي هيتسقَط بدل ما يُطاع.

## المصادر وقراءات إضافية

- The Register — [Cryptocurrency thieves snatch ~$150k after BGP hijack reroutes MyEtherWallet DNS](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
- BleepingComputer — [Hacker Hijacks DNS Server of MyEtherWallet to Steal $160,000](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/)
- Help Net Security — [MyEtherWallet users robbed after successful DNS hijacking attack](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/)
- CyberScoop — [Amazon DNS service server hijacked for $152,000 Ether theft](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/)
- ESET WeLiveSecurity — [Ethereum cryptocurrency wallets raided after Amazon's internet domain service hijacked](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/)
- Kentik — [What can be learned from recent BGP hijacks targeting cryptocurrency services?](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/)
- Wikipedia — [BGP hijacking](https://en.wikipedia.org/wiki/BGP_hijacking)
- Bob Cromwell — [BGP Hijacking](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html)
- Neptune Mutual — [How Was MEW (MyEtherWallet) DNS Spoofed?](https://medium.com/neptune-mutual/how-was-mew-myetherwallet-dns-spoofed-cb813fab15f0)
- WCCFTech — [Hackers Hijacked DNS Servers to Steal from MyEtherWallet Users](https://wccftech.com/hackers-domain-service-to-empty-ethereum-wallets/)
