---
title: 'DNSpionage: الحملة اللي حوّلت DNS لسلاح ضد الحكومات'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'في أواخر 2018، كشفت Cisco Talos عن حملة DNSpionage — حملة مرتبطة بمصالح إيرانية أعادت كتابة سجلات DNS الحكومية، وحوّلت مسار الإيميل وحركة VPN لسيرفرات المهاجمين، وولّدت شهادات TLS حقيقية عشان تفضل مخفية. وكانت السبب في أول توجيه طارئ من نوعه تُصدره الحكومة الأمريكية.'
keywords: ['dnspionage', 'اختطاف dns', 'إعادة توجيه dns', 'cisco talos', 'توجيه cisa الطارئ 19-01', 'sea turtle dns', 'اختطاف dns إيراني', 'fireeye اختطاف dns', 'إساءة استخدام شهادة lets encrypt', 'أمن dns', 'أمن النطاقات', 'تجسس سيبراني على مستوى الدول', 'التخفيف من التلاعب بالبنية التحتية لـ dns']
---

معظم كوارث النطاقات بتتكلم عن مين *يملك* الاسم. الحادثة دي كانت عن مين *يتحكم* فيه — ولمدة شهور في أواخر 2018، الإجابة بالنسبة لعشرات النطاقات الحكومية في الشرق الأوسط كانت: مش الحكومات.

مفيش اختراق لسيرفر ويب. ولا برامج خبيثة في الصفحة الرئيسية. ولا تشويه أو رسالة فدية، ولا أي أثر واضح في لوجات التطبيقات. المهاجمون ما احتاجوش يخترقوا المباني أصلاً. دخلوا من الباب اللي ما حدش بيحرسه تقريباً: **سجل DNS** اللي بيحدد فين الإيميل والمواقع الإلكترونية الخاصة بالنطاق. عدّلوه — بهدوء، بعتمادات حقيقية، وراء شهادة TLS حقيقية — والحركة الإلكترونية في العالم اتبعت التعليمات الجديدة من غير ما تعترض.

Cisco Talos سمّتها **DNSpionage**. وهي واحدة من أنظف الأمثلة المسجّلة اللي بتثبت إن [نظام أسماء النطاقات](/ar/glossary/dns/) مش مجرد سباكة. ده بنية تحتية للأمن القومي.

## DNS كسلاح سياسي

عشان تفهم ليه DNSpionage زعزعت الحكومات، لازم تتذكر إيه اللي بيعمله DNS أصلاً.

في كل مرة بتبعت فيها إيميل لوزارة، أو بتسجّل دخول على VPN شركة، أو بتفتح صفحة ويب-ميل، جهازك بيسأل DNS سؤال: *إيه [عنوان IP](/ar/glossary/ip-address/) الخاص بالاسم ده؟* مهما يكن رد DNS، أنت بتثق فيه. برنامج الإيميل بتاعك بيتوصل تمّه. الـ VPN بتاعك بيتحقق هناك. المتصفح بيسلّم الجلسة هناك. DNS هو دليل عناوين الإنترنت كله، وما فيش تقريباً أي حاجة بتتحقق لو الدليل اتعدّل.

وده بالظبط اللي استغلّته DNSpionage. لو قدرت تغيّر [السجل](/ar/glossary/registry/) — مش تكسر التشفير، ومش تخترق ملف الباسورد، بس تغيّر *المؤشر* — تقدر تقف خفي بين الهدف والخدمات اللي بيثق فيها. الإيميل بيعدي عليك. تسجيلات دخول VPN بتعدي عليك. ولأن اسم النطاق الخاص بالضحية بيظهر في شريط المتصفح، ما فيش حاجة بتبدو غلط.

ده تجسس عند الطبقة اللي تحت التطبيق. وهي أيضاً، بشكل مقلق، الطبقة اللي معظم برامج الأمن بتعاملها كمشكلة محلولة.

## حملة DNSpionage (2018–2019)

![رسم مفاهيمي ملوّن حيوي لغرفة اعتراض سرية تحت لوحة اتصالات وطنية، فيها مشغّل غامض بيحوّل إيميلات دولة بهدوء عبر أختام رسمية مزيّفة، وكابلات بيانات مضيئة بتتشعب نحو نقطة استماع سرية](../../assets/the-dnspionage-campaign-01-campaign.jpg)

في **27 نوفمبر 2018**، نشرت Cisco Talos تقريرها الأول. السطر الأول كان محدد: "[اكتشفت Cisco Talos مؤخراً حملة جديدة تستهدف لبنان والإمارات العربية المتحدة وتؤثر على نطاقات .gov، وكذلك شركة طيران لبنانية خاصة](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Cisco%20Talos%20recently%20discovered%20a%20new%20campaign%20targeting%20Lebanon%20and%20the%20United%20Arab%20Emirates)."

الحملة كان ليها وجهين. الأول كان عملية برمجيات خبيثة عادية نسبياً: "[هذه الحملة تعتمد على موقعَين مزيّفَين وضارَّين يحتويان على إعلانات وظائف تُستخدم لاستهداف الضحايا عبر مستندات Microsoft Office خبيثة تحتوي على ماكرو](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=This%20particular%20campaign%20utilizes%20two%20fake%2C%20malicious%20websites%20containing%20job%20postings)." المواقع الطُعم انتحلت صفة شركات توظيف حقيقية — "[hr-wipro[.]com (مع إعادة توجيه إلى wipro.com) وhr-suncor[.]com (مع إعادة توجيه إلى suncor.com)](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=hr%2Dwipro)" — ونزّلت أداة وصول عن بُعد مخصصة قادرة، بشكل مميّز، على التواصل مع سيرفر الأوامر عبر DNS نفسه.

لكن الوجه التاني هو اللي صنع التاريخ. على حد قول Talos: "[في حملة منفصلة، استخدم المهاجمون نفس عنوان IP لإعادة توجيه DNS لنطاقات .gov الشرعية ونطاقات شركات خاصة](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=the%20attackers%20used%20the%20same%20IP%20to%20redirect%20the%20DNS%20of%20legitimate)." سيرفرات الأسماء الحكومية الحقيقية اتوجّهت لأجهزة يمتلكها المهاجمون: "[ويبدو أن خوادم أسماء متعددة تعود للقطاع العام في لبنان والإمارات، وكذلك بعض الشركات في لبنان، قد تعرضت للاختراق، وأُشير إلى أسماء المضيفين الخاضعة لسيطرتها نحو عناوين IP يتحكم فيها المهاجمون](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Multiple%20nameservers%20belonging%20to%20the%20public%20sector)."

مواقع الوظائف المزيّفة كانت الجزء اللي بيشبه الجرائم الإلكترونية العادية. إعادة توجيه DNS كانت الجزء اللي بيشبه السياسة الدولية.

لما الباحثون المستقلون خلّصوا شدّ الخيط، اتضح إن الحجم أكبر بكتير من دولتين. Brian Krebs، وهو بيتتبع عناوين IP للمهاجمين بالعكس، لاقى إن "[في الأشهر الأخيرة من 2018، نجح المخترقون وراء DNSpionage في اختراق مكوّنات رئيسية من بنية DNS التحتية لأكتر من 50 شركة وجهة حكومية في الشرق الأوسط](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=in%20the%20last%20few%20months%20of%202018%20the%20hackers%20behind%20DNSpionage%20succeeded)."

## مين اتاستهد، وما الرهانات

قائمة الضحايا بتشبه خريطة الجهاز العصبي لمنطقة كاملة: وزارات الخارجية، والطيران المدني، وشركات الاتصالات، والبنية التحتية للإنترنت، وموقع الويب-ميل الخاص بوزارة مالية وطنية. دول مش أهداف عشوائية. دول الأماكن اللي بتعدي منها أسرار الدول عبر الأسلاك.

بعد شهرين من تقرير Talos الأول، نشرت FireEye (المعروفة دلوقتي باسم Mandiant) تحليلها الخاص ووضّحت نسبة الحادثة بحذر. على حد قول FireEye، "[تشير الأبحاث الأولية إلى أن المسؤول أو المسؤولين عن ذلك لديهم صلة بإيران](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/#:~:text=initial%20research%20suggests%20the%20actor%20or%20actors%20responsible%20have%20a%20nexus%20to%20Iran)." وأشارت SecurityWeek في تغطيتها لنتائج FireEye إن الشركة قدّرت بـ"[ثقة معتدلة](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=moderate%20confidence)" إن إيران وراء الهجمات، استناداً إلى أدلة تقنية وكون الحملة متسقة مع مصالح الحكومة الإيرانية.

الرهانات نابعة مباشرة من طبيعة الأهداف. لما تقدر تقرأ إيميل وزارة خارجية في صورة نص عادي، أنت مش بتسرق بيانات — أنت بتقرأ عقل حكومة في الوقت الفعلي تقريباً. عشان كده حملة حصاد بيانات الاعتماد على مستوى طبقة DNS تُفهم بشكل صحيح مش كاحتيال، لكن كجمع استخباراتي ضد الدولة.

## إزاي حصل ده: سجلات DNS + شهادات حقيقية + مواقع وظائف مزيّفة

![رسم مفاهيمي ملوّن حيوي للوحة اتصالات بريد وطنية وهي بتتعاد توصيلها بصمت — بطاقات عناوين مضيئة بتتبدّل على جدار توجيه ضخم، وكل خط معاد توجيهه بيعدي عبر ختم قفل أخضر مزيّف قبل ما يوصل لكابينة استماع سرية](../../assets/the-dnspionage-campaign-02-dns-redirection.jpg)

الجزء ده يستحق إننا نتمهّل فيه، لأن الأسلوب كان أنيق بأسوأ طريقة ممكنة. فيه تلات خطوات.

**الخطوة الأولى: احصل على مفاتيح دليل العناوين.** المهاجمون ما كسروش تشفير DNS. بس سجّلوا دخول. FireEye وصفت طريقتين: "[طريقة تتضمن تسجيل الدخول إلى واجهة إدارة مزوّد DNS باستخدام بيانات اعتماد مسرّبة وتغيير سجلات DNS A بهدف اعتراض حركة البريد الإلكتروني. وطريقة أخرى تتضمن تغيير سجلات DNS NS بعد اختراق حساب مسجّل النطاق الخاص بالضحية](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=One%20method%20involves%20logging%20into%20a%20DNS%20provider)." بيانات الاعتماد المسروقة للمسجّلين ومزوّدي DNS كانت المفتاح الرئيسي. مين ما يملك تسجيل دخول المسجّل، يتحكم في النطاق — والنطاق بيتحكم في كل حاجة بتشير إليه.

**الخطوة التانية: أعد توجيه الحركة بحيث تفضل شغّالة.** توجيه سيرفر الإيميل الحكومي لعنوان IP بتاعك كان هيعطّل الخدمة وينبّه الأنظمة. فالمهاجمون استخدموا الـ proxy. الحركة اتنقلت للوجهة الأصلية بعد ما اتقطت، فالمستخدمون شافوا صندوق وارد شغّال وـ VPN شغّالة. زي ما FireEye وصفت في طريقة تالتة: "[أُعيد توجيه المستخدمين إلى بنية تحتية يتحكم فيها المهاجمون](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=users%20were%20redirected%20to%20attacker%2Dcontrolled%20infrastructure)." الاعتراض كان man-in-the-middle بيعيد التوجيه بهدوء — مخفي بالظبط لأن ما فيش حاجة بدت إنها بتعطّل.

**الخطوة التالتة: تخطّى القفل الأخضر.** الخدمات الحديثة بتستخدم TLS، اللي المفروض تطلع تحذير شهادة في اللحظة اللي الحركة بتوصل لسيرفر غلط. المهاجمون سدّوا الثغرة دي بتوليد شهاداتهم الحقيقية. Talos لاقت إن "[في كل اختراق DNS، المهاجم كان بيولّد بعناية شهادات Let's Encrypt للنطاقات المعاد توجيهها](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=During%20each%20DNS%20compromise%2C%20the%20actor%20carefully%20generated)." لأنهم كانوا بيتحكموا في DNS الخاص بالنطاق، قدروا *يثبتوا* للسلطة الشهادية إنهم يتحكموا فيه — والتحقق التلقائي من النطاق سلّمهم شهادة حقيقية. FireEye أكّدت نفس النمط عبر الطرق: "[في كلتا الحالتين، استخدم المهاجمون شهادات Let's Encrypt لتجنب إثارة الشك](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=in%20both%20cases%20the%20attackers%20used%20Let%E2%80%99s%20Encrypt%20certificates)."

النتيجة، في ملخص Krebs، كانت شاملة: "[هجمات DNS دي مهّدت الطريق للمهاجمين عشان يحصلوا على شهادات تشفير SSL للنطاقات المستهدفة (مثلاً webmail.finance.gov.lb)، اللي سمحت لهم بفك تشفير الإيميل وبيانات اعتماد VPN المعترضة وعرضها كنص عادي](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=these%20DNS%20hijacks%20also%20paved%20the%20way%20for%20the%20attackers%20to%20obtain%20SSL%20encryption%20certificates)." إيميلات وتسجيلات دخول VPN، كلها محفوظة وقابلة للقراءة، مع قفل حقيقي طول الوقت.

لاحظ إيه اللي *ما كانش* مطلوباً. لا ثغرة zero-day. ولا برامج خبيثة على سيرفرات الضحية نفسها. ولا جدار حماية اتخُرق. الهجوم عاش كله في الفجوة بين "أنا بملك النطاق ده" و"أقدر أثبت مين بيتحكم في سجلاته دلوقتي." الفجوة دي هي اللي عاشت فيها DNSpionage — وهي أوسع من اللي معظم المؤسسات بتتخيله.

## الاستجابة: توجيه CISA الطارئ 19-01

الكشوفات المشتركة لـ Talos وـ FireEye وقعت بثقل في واشنطن. في **22 يناير 2019**، أصدرت وكالة الأمن السيبراني وأمن البنية التحتية الأمريكية **التوجيه الطارئ 19-01، "التخفيف من التلاعب بالبنية التحتية لـ DNS"** — أول توجيه طارئ تُصدره CISA في تاريخها، وتعليمات نادرة ملزمة للحكومة المدنية الفيدرالية كلها.

تشخيص التوجيه تطابق مع الأبحاث تماماً. كما ورد في التقارير المعاصرة، حذّرت CISA من إن "[المهاجمين أعادوا توجيه واعترضوا حركة الويب والبريد الإلكتروني، ومن الممكن أن يفعلوا نفس الشيء مع خدمات الشبكة الأخرى](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=redirected%20and%20intercepted%20web%20and%20mail%20traffic)"، وإن المهاجمين "[اخترقوا حسابات المسؤولين المشرفين على نطاقات DNS الحكومية](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=compromised%20the%20accounts%20of%20administrators)."

وطلب التوجيه أربع إجراءات، في مهلة 10 أيام — وهي تبدو كرد مباشر على كل واحدة من الخطوات التلات للمهاجمين:

1. **راجع سجلات DNS بتاعتك** — تحقق إنه ما اتعبث فيها على السيرفرات الموثوقة والثانوية.
2. **غيّر باسوردات حسابات DNS** — دوّر كل بيانات اعتماد تقدر تعدّل DNS.
3. **أضف المصادقة متعددة العوامل** لكل حسابات إدارة DNS — عشان الباسورد المسروق وحده ما يبقاش المفتاح الرئيسي.
4. **راقب لوجات Certificate Transparency** — ترقّب الشهادات الصادرة لنطاقاتك اللي ما طلبتهاش.

البند الرابع ده هو الكاشف. CISA ما كانتش بس بتقول للجهات تقفل الباب؛ كانت بتقولها تراقب سجلات الشهادات العامة دليلاً على إن حد استخدم نسخة من المفتاح. DNSpionage حوّلت Certificate Transparency من ميزة متخصصة في PKI لأداة اكتشاف في الخط الأمامي ل[اختطاف DNS](/ar/glossary/dns-hijacking/) على مستوى الدول.

Krebs وصف غرابة اللحظة بصراحة: "[وزارة الأمن الداخلي الأمريكية أصدرت توجيهاً طارئاً نادراً يأمر جميع الوكالات الفيدرالية المدنية الأمريكية بتأمين بيانات الاعتماد الخاصة بسجلات نطاقات الإنترنت بتاعتها](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=issued%20a%20rare%20emergency%20directive%20ordering%20all%20U.S.%20federal%20civilian%20agencies)."

DNSpionage ما كانتش الوحيدة اللي أدّت لده. عملية موازية وأكتر عدوانية سمّتها Talos **Sea Turtle** — اللي Talos وصفتها بأنها "[أول حالة معروفة تتعرض فيها منظمة تسجيل نطاقات للاختراق في عمليات تجسس سيبراني](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=first%20known%20case%20of%20a%20domain%20name%20registry%20organization%20that%20was%20compromised)"، واستهدفت "[ما يقارب 40 منظمة مختلفة في 13 دولة مختلفة](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=approximately%2040%20different%20organizations%20across%2013%20different%20countries)" — رفعت الرهانات أكتر. Talos كانت حريصة على التمييز بين الاتنين؛ في متابعتها في أبريل 2019 لاحظت إن سلوك DNSpionage "[سيستمر على الأرجح في تمييز هذا الفاعل عن الحملات الأكثر إثارة للقلق مثل Sea Turtle](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/#:~:text=will%20likely%20continue%20to%20distinguish%20this%20actor%20from%20more%20concerning%20campaigns%20like%20Sea%20Turtle)." الحملتين مع بعض أثبتتا نفس النقطة من زوايا مختلفة: سلسلة إمداد DNS أصبحت مسرحاً للصراع بين الدول.

## إيه اللي DNS كأداة للأمن القومي بيعلّمنا إياه

DNSpionage فيها قليل من دراما البرمجيات الخبيثة وفيها كتير من الدروس غير المريحة. دي بعضها يستحق الحفظ:

- **حساب المسجّل هو التاج.** كل حاجة تحت النطاق — الإيميل، الويب، VPN، تسجيل الدخول الموحد، إصدار الشهادات — بترث ثقة أي حد يقدر يعدّل DNS بتاعته. باسورد بدون عامل تحقق تاني على الحساب ده مش ثغرة صغيرة؛ ده القلعة كلها والبوابة مفتوحة. أول تعليمات CISA كانت عن *بيانات الاعتماد*، مش الجدران النارية، وده سببه بالظبط.
- **الشهادة الحقيقية مش دليل على الشرعية.** القفل الأخضر بيثبت إن الحركة متشفّرة لـ*مين ما يتحكم في النطاق دلوقتي*. لو مهاجم يتحكم في DNS، التحقق التلقائي من النطاق هيُصدر له شهادة حقيقية بكل سرور. الثقة في TLS مستعارة من الثقة في DNS — وDNS أهشّ مما معظم الناس بيتصوروا.
- **هجمات DNS مخفية بالتصميم.** لأن الـ proxy بيمرّر الحركة الحقيقية، خدمات الضحية بتفضل شغّالة. ما فيش انقطاع يستدعي التحقيق. ربما الإشارة الخارجية الوحيدة تكون شهادة ظهرت في لوج CT عام — وعشان كده مراقبة اللوجات دي انتقلت من اختياري لإلزامي بين ليلة وضحاها.
- **السيطرة على النطاق هي سيطرة للأمن القومي.** لما الجهة اللي بتعدّل DNS وزارة خارجية دولة أجنبية هي دولة معادية، الحد الفاصل بين "عمليات IT" و"مكافحة التجسس" بيختفي. دليل عناوين الإنترنت هو أرض استراتيجية.

الخيط المشترك بين كل ده هو سؤال واحد ما يجيبش عليه أي أداة تشغيلية في الوقت الفعلي: **مين المتحكم الفعلي في النطاق ده دلوقتي، وأقدر أثبت إنه ما اتغيّرش بهدوء؟** DNSpionage نجحت لأن السؤال ده كان صعب الإجابة لدرجة إن حكومات منطقة بأكملها ما قدرتش عليه.

## زاوية Namefi

![رسم ملوّن لملكية نطاق قابلة للتحقق ومقاومة للتلاعب — بطاقة نطاق مؤمّنة بدرع أخضر ورمز Namefi أخضر واستمرارية DNS](../../assets/the-dnspionage-campaign-03-namefi-angle.jpg)

DNSpionage في جوهرها هي مشكلة **إثبات الأصل والمصدر**. المهاجمون ما امتلكوش النطاقات المستهدفة أبداً. استعاروا السيطرة عليها بسرقة بيانات الاعتماد اللي بتسمح للوحات تحكم المسجّلين ومزوّدي DNS بعمل تعديلات صامتة وغير قابلة للتحقق — وما فيش حاجة في النظام نبّهت إن *الجهة المتحكمة* اتغيّرت.

[Namefi](https://namefi.io) مبنية على أساس إن [ملكية النطاق](/ar/glossary/domain-ownership/) والسيطرة عليه المفروض تكون **قابلة للتحقق، ومحمولة، ومقاومة للتلاعب** بدل ما تتقفل داخل تسجيل دخول مسجّل غامض. الملكية المُرمّزة بتجعل "مين يتحكم في الاسم ده" حقيقة تقدر تتحقق منها وتراجعها، مش إعداد مدفون وراء باسورد ربما بقى في يد شخص تاني. ده مش بديل عن نظافة حسابات المسجّل أو المصادقة متعددة العوامل — نصيحة CISA لسه صح تماماً — لكنه بيهاجم الفجوة الأعمق اللي استغلّتها DNSpionage: صعوبة *إثبات*، بشكل مستقل ومستمر، إن الجهة المتحكمة في النطاق هي الجهة المفروض تكون.

الدرس من DNSpionage مش إن DNS هش بطريقة غريبة. الدرس هو إن أهم حقيقة عن النطاق — مين يتحكم فيه — كانت لفترة طويلة جداً حاجة واحدة بس تفصلها عنها: باسورد مسروق. تجعل الحقيقة دي قابلة للتحقق هو كل الموضوع.

## المصادر وقراءات إضافية

- Cisco Talos — [حملة DNSpionage تستهدف الشرق الأوسط](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/) (27 نوفمبر 2018)
- Cisco Talos — [DNSpionage brings out the Karkoff](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/) (23 أبريل 2019)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/) (18 فبراير 2019)
- The Register — [Baddies linked to Iran fingered for DNS hijacking to read Middle Eastern regimes' emails](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/) (10 يناير 2019)
- SecurityWeek — [Iran-Linked DNS Hijacking Attacks Target Organizations Worldwide](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/) (10 يناير 2019)
- BleepingComputer — [DHS Issues Emergency Directive to Prevent DNS Hijacking Attacks](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/) (يناير 2019)
- Network World — [Cisco Talos details exceptionally dangerous DNS hijacking attack](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html) (17 أبريل 2019)
- Network World — [Cisco: DNSpionage attack adds new tools, morphs tactics](https://www.networkworld.com/article/967303/cisco-dnspionage-attack-adds-new-tools-morphs-tactics.html)
- CERT-IST — [DNSpionage and DNS data hijacking](https://www.cert-ist.com/public/en/SO_detail?format=html&code=dnspionage)
- CISA — [التوجيه الطارئ 19-01: التخفيف من التلاعب بالبنية التحتية لـ DNS](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed) (22 يناير 2019)
