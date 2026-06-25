---
title: 'لما ICANN نفسها اتفشت: اختراق التصيد الاحتيالي الموجَّه عام 2014 في قلب الإنترنت'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'في أواخر 2014، اعترفت ICANN — الهيئة المسؤولة عن تنسيق نظام أسماء النطاقات على الإنترنت — بأن رسالة إيميل تصيد احتيالي موجَّه، منتحِلةً هوية نطاقها الرسمي، تمكنت من سرقة بيانات موظفيها ومنح المخترقين صلاحيات إدارية على نظام بيانات المنطقة المركزية (CZDS). تحقيق من Domain Mayday في كيف اتفشت سلطة DNS نفسها، وما الذي انكشف، ولماذا القصة لا تزال مهمة حتى اليوم.'
keywords: ['اختراق icann', 'تصيد احتيالي موجه icann', 'czds', 'نظام بيانات المنطقة المركزية', 'أمن dns', 'أمن أسماء النطاقات', 'هجوم التصيد الموجه', 'سرقة بيانات اعتماد', 'ملفات المنطقة', 'iana', 'هاشات كلمات المرور المملَّحة', 'اختراق نظام أسماء النطاقات', 'اختراق icann 2014']
---

ثمة نوع خاص من العناوين الإخبارية يجعل قطاع الأمن كله يتوقف لحظة. مش "متجر تاني اتخترق"، ولا "شركة ناشئة سرَّبت قاعدة بيانات" — ده اليوم اللي تعترف فيه المؤسسة اللي الكل بيثق فيها إنها اتاخدت بأبسط طريقة ممكنة.

في ديسمبر 2014، كانت تلك المؤسسة هي [ICANN](/ar/glossary/icann/). المؤسسة الدولية لأسماء وأرقام الإنترنت — المنظمة غير الربحية المسؤولة عن تنسيق [نظام أسماء النطاقات](/ar/glossary/dns/) بالكامل، والحارسة للقواعد التي تسمح لـ `namefi.io` و`google.com` وكل عنوان آخر على وجه الأرض بالإشارة إلى سيرفر — أعلنت أن بعض موظفيها ضغطوا على رابط في إيميل مزيف، وكتبوا كلمات مرورهم في صفحة تسجيل دخول مزيفة، وسلَّموا المخترقين مفاتيح أنظمة داخلية — من بينها نظام بيانات المنطقة المركزية (CZDS)، وهو المنصة التي تُطلب من خلالها ملفات منطقة نطاقات المستوى الأعلى في العالم ويُتيح الوصول إليها.

المؤسسة التي تضع قواعد الثقة على الإنترنت — اتفشت. بإيميل منتحَل هوية. بيتظاهر إنه من ICANN نفسها.

ده هو **الحلقة 11 من Domain Mayday** — وهو الحلقة اللي المشكلة فيها جاية من جوا البيت.

## مين هي ICANN، وليه اختراقها له دلالة رمزية

عشان تفهم ليه الخبر ده وقع بالتقيل ده، لازم تعرف ICANN بتعمل إيه بالظبط.

ICANN مش شركة بتشتري منها نطاقًا. هي موجودة في طبقة أعلى من ده. تنسّق نظام المعرّفات الفريدة على مستوى العالم اللي بيخلي الإنترنت قابل للتصفح: نطاقات المستوى الأعلى (`.com` و`.org` و`.io` والمئات من النطاقات الأحدث)، والقواعد التي تتبعها المسجلات وشركات التسجيل، وكمان — من خلال وظيفة [IANA](/ar/glossary/iana/) — قمة هرم نظام أسماء النطاقات، وهي ال[منطقة الجذر](/ar/glossary/root-zone/)ية التي تعتمد عليها كل عملية بحث في النهاية.

لو النطاقات هي عناوين الإنترنت، فـ ICANN بتشغّل الدليل الرئيسي لمكتب البريد. الاختراق عند مزود تسجيل نطاقات — ده وحش. الاختراق عند ICANN — ده رمزي، لأن ICANN المفروض تكون هي *السلطة* — المؤسسة الوحيدة اللي مهمتها إبقاء نظام التسمية منظمًا وجديرًا بالثقة. لما السلطة المسؤولة عن أسماء الإنترنت تتعرض للاختراق، السؤال المحرج واضح: لو *هم* اتفشوا، مين مش ممكن يتفش؟

## أواخر 2014: الاختراق

![فن مفاهيمي ملوّن وحيوي يصوّر رسالة رسمية مزورة تتسلل بجانب حارس شاهق يحمل حلقة مضيئة من مفاتيح الإنترنت الرئيسية، الرسالة تتوهج باللون الأحمر بينما المفاتيح تضيء باللون الأزرق](../../assets/the-icann-spear-phishing-breach-01-breach.jpg)

وضعت ICANN الجدول الزمني في [إعلانها العام الرسمي](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=We%20believe%20a%20%22spear%20phishing%22%20attack%20was%20initiated%20in%20late%20November%202014.) الصادر في 16 ديسمبر 2014، بصراحة يُشكَر عليها: "نعتقد أن هجوم 'تصيد احتيالي موجَّه' بدأ في أواخر نوفمبر 2014."

الآلية كانت بسيطة بشكل يكاد يكون مهينًا. كما وصفته ICANN، كان الهجوم "[يتضمن رسائل إيميل صُنِعت لتبدو كأنها قادمة من نطاقنا الخاص وأُرسلت إلى أعضاء من موظفينا](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=It%20involved%20email%20messages%20that%20were%20crafted%20to%20appear%20to%20come%20from%20our%20own%20domain%20being%20sent%20to%20members%20of%20our%20staff.)." استلم الموظفون إيميلات تبدو كأنها جاية من `icann.org` — من داخل ICANN نفسها. ضغط بعضهم على الرابط. كما أعاد The Register تجميع الأحداث، قام الموظفون "[بالضغط على رابط في الرسائل أخذهم إلى صفحة تسجيل دخول مزيفة — كتب فيها الموظفون أسماء المستخدمين وكلمات المرور الخاصة بهم](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=clicked%20on%20a%20link%20in%20the%20messages%20that%20took%20them%20to%20a%20bogus%20login%20page)"، مسلِّمين بده بيانات اعتماد الإيميل الخاصة بهم للمخترقين. تعليق The Register الجاف على الدفاع الغائب: "[لا أثر للمصادقة الثنائية، إذن.](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)"

النتيجة، بكلام ICANN نفسها: "[أسفر الهجوم عن اختراق بيانات اعتماد الإيميل لعدد من موظفي ICANN.](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attack%20resulted%20in%20the%20compromise%20of%20the%20email%20credentials%20of%20several%20ICANN%20staff%20members.)" Help Net Security عبّرت عنها بشكل أوضح: "[عدد من الموظفين انخدعوا وسلّموا بيانات اعتماد الإيميل الخاصة بهم](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=Several%20staff%20members%20were%20fooled%20into%20handing%20over%20their%20email%20credentials)" للمخترقين.

لا ثغرة يوم-صفر. لا برمجيات خبيثة غريبة. إيميل مقنع وصفحة تسجيل دخول مزيفة — أقدم حيلة على الإنترنت، تم تنفيذها ضد الناس اللي بيساعدوا في إدارة الإنترنت.

## ما تم الوصول إليه: نظام بيانات المنطقة في القلب

بيانات اعتماد الإيميل المسروقة وحدها وحشة بحالها. اللي خلى هذا الاختراق حلقة من *Domain Mayday* هو ما وصله المخترقون *بها*.

في أوائل ديسمبر 2014، اكتشفت ICANN أن بيانات الاعتماد المخترقة أُعيد استخدامها للدخول إلى أنظمة أخرى. الأخطر كان **نظام بيانات المنطقة المركزية** — CZDS، المنصة التي يطلب من خلالها الأطراف المصرَّح لهم تنزيل ملفات المنطقة لنطاقات المستوى الأعلى العامة في العالم. إفصاح ICANN صريح: "[حصل المهاجم على صلاحية إدارية لجميع الملفات في CZDS.](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attacker%20obtained%20administrative%20access%20to%20all%20files%20in%20the%20CZDS.)"

*إدارية* لـ*كل* الملفات. أوضح The Register سبب أهمية ذلك: CZDS "[يمنح الأطراف المصرَّح لهم الوصول إلى جميع ملفات المنطقة الخاصة بنطاقات المستوى الأعلى العامة في العالم](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=gives%20authorized%20parties%20access%20to%20all%20the%20zone%20files%20of%20the%20world%27s%20generic%20top%2Dlevel%20domains)." *مستخدمو* النظام مش ناس عاديين — هم، كما لاحظ The Register، "[كثير من مديري مسجلات وشركات تسجيل النطاقات في العالم](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=many%20of%20the%20administrators%20of%20the%20world%27s%20registries%20and%20registrars)." المخترقون ما دخلوش على قاعدة بيانات بس؛ دخلوا على قاعدة البيانات اللي حرّاس نظام التسمية نفسه بيسجّلوا فيها دخولهم.

بعيدًا عن ملفات المنطقة، كشف الاختراق البيانات الشخصية التي سجّل بها مستخدمو CZDS. وفقًا لـ ICANN، الحصيلة "[تضمنت نسخًا من ملفات المنطقة في النظام، بالإضافة إلى المعلومات التي أدخلها المستخدمون كالاسم والعنوان البريدي وعنوان الإيميل وأرقام الفاكس والهاتف واسم المستخدم وكلمة المرور](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=This%20included%20copies%20of%20the%20zone%20files%20in%20the%20system%2C%20as%20well%20as%20information%20entered%20by%20users)." أسماء مستخدمين وكلمات مرور لناس بتدير نطاقات المستوى الأعلى — موجودة في نظام مشى فيه المهاجم وهو لابس شارة مسروقة.

امتدت أضرار بيانات الاعتماد أبعد من كده كمان. أكدت ICANN أن المخترقين مسّوا أيضًا **GAC Wiki** (فضاء اللجنة الاستشارية الحكومية)، **مدونة ICANN**، **وبوابة معلومات [WHOIS](/ar/glossary/whois/)**، وإن أفادت بـ[عدم وجود أي تأثير على النظامين الأخيرين](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=The%20latter%20two%20were%20not%20affected%20in%20any%20way.) ومشاهدة محدودة فقط على الويكي.

## كيف حصل ده: الشارة اللي عليها "ICANN"

![فن مفاهيمي ملوّن وحيوي لبرج تحكم في نظام أسماء النطاقات ليلًا، شارة مزورة واحدة مضيئة ومعليها علامة صح بتفتح أبوابه بينما حرّاس حقيقيون واقفين جنبها غير منتبهين، أشعة ضوء حمراء بتتسرب للخارج](../../assets/the-icann-spear-phishing-breach-02-spear-phishing.jpg)

لو شيلنا الطبقات التقنية جنب، الهجوم في جوهره خدعة ثقة.

التصيد الاحتيالي الموجَّه بيختلف عن التصيد العادي في دقته. مش مليون إيميل سبام بيأمل إن واحد يعضّها؛ ده عدد صغير من رسائل مصاغة بعناية موجَّهة لأناس بعينهم، مصمَّمة لتبدو كحركة داخلية اعتيادية. هنا كان التمويه في أقوى صورة ممكنة: الإيميل بدا كأنه جاي من `icann.org`. كما لخّص The Register: "[المهاجمون أرسلوا رسائل إيميل مزيفة لموظفين، تبدو وكأنها جاية من icann.org.](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Attackers%20sent%20staff%20spoofed%20emails%20appearing%20to%20coming%20from%20icann.org.)"

فكّر في السيكولوجيا. إيميل جاي من نطاق مؤسستك نفسها مش بيصحّي الإنذار. صفحة تسجيل دخول بتشبه اللي بتستخدمها كل يوم كمان مش بتصحّيه. الهجوم كله استغل حقيقة إن *الداخلي* و*المألوف* بيحسّوا زي *الآمن* — وهما مش نفس الحاجة. شريط العنوان قال حاجة؛ والصفحة وراؤه كانت بتحصد كل اللي بيتكتب فيها.

التخفيف الحقيقي الوحيد عند ICANN كان على جانب التخزين: كلمات المرور المسروقة مكانتش موجودة بنص صريح. كما أشار الإفصاح، "[كلمات المرور كانت مخزَّنة كهاشات تشفيرية مملَّحة](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=Although%20the%20passwords%20were%20stored%20as%20salted%20cryptographic%20hashes)" — أفضل من البديل، لكن كما أشار The Register، الحماية دي بتنفع بس إذا المستخدمين ما أعادوش استخدام نفس بيانات الاعتماد في أماكن تانية، لأن الهاشات لا تزال قابلة للكسر offline. الاختراق ما خلصش بالتنزيل؛ بدأ سباقًا بطيئًا بين المدافعين اللي بيغيّروا كلمات المرور والمهاجمين اللي بيحاولوا عكسها.

## الاستجابة والتداعيات

بالحق، ICANN تعاملت مع الإفصاح أحسن من تعاملها مع الاختراق نفسه.

أعلنت للعلن خلال أسابيع، أوقفت كلمات مرور CZDS، أبلغت المستخدمين المتأثرين، و— بشكل لافت — إطارت الشفافية كواجب لا كمسؤولية. قالت المنظمة إنها "[تتيح المعلومات عن هذه الحادثة للعلن، ليس فقط بسبب التزامنا بالانفتاح والشفافية، ولكن أيضًا لأن تبادل معلومات الأمن السيبراني يساعد جميع المعنيين على تقييم التهديدات لأنظمتهم](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=providing%20information%20about%20this%20incident%20publicly%2C%20not%20just%20because%20of%20our%20commitment%20to%20openness%20and%20transparency)." أفادت أيضًا بأن برنامج تعزيز الأمن الذي بدأ في وقت سابق من ذلك العام "[ساعد في تقليص الوصول غير المصرَّح به الذي تحقق في الهجوم](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=these%20enhancements%20helped%20limit%20the%20unauthorized%20access%20obtained%20in%20the%20attack)."

الجملة الأهم للإنترنت الأوسع كانت عن ما *لم* يسقط. أكدت ICANN: "[هذا الهجوم لا يؤثر على أي أنظمة مرتبطة بـ IANA](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=this%20attack%20does%20not%20impact%20any%20IANA%2Drelated%20systems)." IANA — كما وصفتها Help Net Security، الوظيفة التي "[تدير المنطقة الجذرية في نظام أسماء النطاقات (DNS)](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=manages%20the%20root%20zone%20in%20the%20Domain%20Name%20System)" — هي القمة الفعلية لهرم التسمية على الإنترنت. لو المهاجمون وصلوها، ما كانش ده اختراق بيانات محرج؛ كان هيبقى حالة طوارئ هيكلية.

التوقيت جعل الإحراج أشد وطأة. وصف The Register الوضع بصراحة: "[توقيت هجوم التصيد الاحتيالي ما كانش ممكن يبقى أسوأ لمشرف أسماء النطاقات](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Spear%2Dphishing%20attack%20timing%20couldn%27t%20be%20worse%20for%20domain%20name%20overseer)." ليه؟ لأن ICANN "[تأمل في تسلُّم السيطرة على عقد IANA الحيوي في السنة القادمة](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=it%20will%20prove%20extremely%20embarrassing%20to%20ICANN%2C%20which%20hopes%20to%20be%20handed%20control%20of%20the%20critical%20IANA%20contract%20next%20year)" — مفاوضات انتقال الإشراف اللي كانت جارية في ذلك الوقت. التعرض للتصيد الاحتيالي مش أحسن أداء تقديم لـ"ثقوا فينا بقلب نظام DNS." (للسياق، دي مش كانت مشكلة CZDS الوحيدة لـ ICANN في 2014: أشار The Register إلى حادثة أبريل سابقة "[أُعطي فيها عدد من المستخدمين صلاحية مدير للنظام بشكل خاطئ](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=a%20number%20of%20users%20were%20wrongly%20given%20admin%20access%20to%20the%20system).")

والبيانات عاشت حياة طويلة بعده. في تحديث بتاريخ 21 فبراير 2017 مُلحَق بإعلانها الأصلي، أقرّت ICANN بأن معلومات من الاختراق بدأت تطفو من جديد: "[بعض المعلومات المأخوذة في حادثة التصيد الاحتيالي التي أعلنا عنها في 2014 يُعرض للبيع على المنتديات السرية](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=some%20information%20obtained%20in%20the%20spear%20phishing%20incident%20we%20announced%20in%202014%20is%20being%20offered%20for%20sale%20on%20underground%20forums)." أفاد CyberScoop عن السعر الرائج بعد سنوات: "[البيانات لا تزال تتداول وتُباع في الأسواق السوداء بـ$300](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/#:~:text=the%20data%20is%20still%20being%20passed%20around%20and%20sold%20on%20black%20markets%20for%20%24300)"، مع ادعاءات بأنها لم تتسرب من قبل. ضغطة واحدة في أواخر 2014 لا تزال تولّد مبيعات في 2017.

## ما يعلّمنا ده: الكل ممكن يتفش، حتى سلطة DNS

درس الحلقة 11 مش "ICANN كانت مهملة." الدرس أكثر تواضعًا من كده.

**الكل ممكن يتفش.** مش المهملون بس. مش غير المدرَّبين بس. *الكل.* المؤسسة التي تحكم أسماء الإنترنت حرفيًا — والمؤلفة من ناس بيفكروا في DNS والأمن والبنية التحتية لمعاشهم — لا يزال عدة موظفين منها كتبوا بياناتهم في صفحة مزيفة لأن الإيميل بدا داخليًا. التصيد الاحتيالي مش بيغلب معرفتك؛ بيغلب انتباهك، في الثانيتين اللي بيستغرقهما الضغط على رابط.

مجموعة من الدروس الدائمة تترتب على ده:

1. **بيانات الاعتماد هي المحيط الدفاعي.** المهاجمون ما كسروش تشفير ICANN ولا استغلوا ثغرة في سيرفر. استعاروا كلمة مرور. لما الهوية تبقى هي البوابة، سرقة الهوية تبقى هي الاختراق — وده بالظبط سبب إبقاء التصيد الاحتيالي الهجوم الأكثر موثوقية في العالم.
2. **المصادقة متعددة العوامل مش اختيارية للأنظمة المميزة.** تعليق The Register عن "[لا أثر للمصادقة الثنائية](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)" هو لب الموضوع. عامل ثاني على الأرجح كان هيحوّل سرقة بيانات الاعتماد دي لحدث بلا أثر.
3. **الحركة الجانبية هي المضاعِف.** الضرر جه من *إعادة الاستخدام* — بيانات تسجيل الدخول لاميل أُعيد استخدامها للوصول لـ CZDS والويكي والبوابة. تقسيم الصلاحيات وعدم السماح لبيانات اعتماد واحدة مسروقة بفتح أبواب كثيرة — ده ما بيحصر الاختراق.
4. **البيانات المخترقة للأبد.** إعادة البيع في 2017 بتثبت إن "غيّرنا كلمات المرور" بيغلق الحادثة لكن مش التعرض للخطر. الأسماء والعناوين وأرقام التليفون ما بتُعاد إلى حالة "ما اتسربتش".
5. **السلطة مش نفسها المناعة.** كونك المؤسسة التي تحدد الثقة ما بيعملكش محصّنًا من أبسط هجوم عليها. بل العكس، ده بيخليك هدفًا أفضل.

## زاوية Namefi

![رسم توضيحي ملوّن لملكية نطاق قابلة للتحقق ومقاومة للتلاعب — بطاقة نطاق مؤمَّنة بدرع أخضر ورمز Namefi الأخضر واستمرارية DNS](../../assets/the-icann-spear-phishing-breach-03-namefi-angle.jpg)

اختراق ICANN في جوهره قصة عن *مين بيتحكم في [السجل](/ar/glossary/registry/)ات* — وكيف تم اختطاف هذه السيطرة من خلال بيانات اعتماد واحدة مسروقة على نظام مركزي.

دي هي نقطة الضعف الهيكلية الجديرة بالتأمل. لما إثبات من مصرَّح له بالوصول إلى بيانات النطاق الحساسة أو إدارتها بيكون وراء اسم مستخدم وكلمة مرور على منصة واحدة، نموذج الثقة بأكمله ينهار في اللحظة التي تتعرض فيها بيانات الاعتماد دي للتصيد الاحتيالي. ما فيش فحص ثانٍ. إيميل مقنع وكلمة مرور مُعاد استخدامها كانوا كافيين لمنح صلاحية إدارية على نظام بيانات المنطقة في مركز عالم التسمية.

[Namefi](https://namefi.io) مبني على مقدمة مختلفة: إن [ملكية النطاق](/ar/glossary/domain-ownership/) والتحكم فيه لازم تكون **قابلة للتحقق، مقاومة للتلاعب، وغير معتمدة على سر واحد في صندوق بريد واحد.** من خلال تمثيل ملكية النطاق كتوكنات على البلوك تشين متوافقة مع DNS، يصبح التحكم شيئًا يمكنك إثباته والتحقق منه تشفيريًا — مش مجرد حاجة محمية بكلمة مرور يمكن لإيميل تصيد احتيالي سرقتها. ده مش بيعمل حد محصّنًا من التصيد الاحتيالي؛ ما فيش حاجة بتعمل كده. لكنه بيضيّق نطاق الأضرار، عشان بيانات اعتماد واحدة مستعارة ما تبقاش خطوة واحدة من مفاتيح المملكة.

الصورة الدائمة للحلقة 11 هي الرسالة المزيفة اللي مشت جنب حارس مفاتيح الإنترنت الرئيسية لأنها كانت لابسة الزي الصح. الحل مش حارس أذكى. الحل هو نظام تثبت فيه المفاتيح نفسها إنها حقيقية.

## المصادر وقراءة إضافية

- ICANN — [ICANN Targeted in Spear Phishing Attack | Enhanced Security Measures Implemented](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en) (المصدر الأساسي، شامل تحديث 2017)
- The Register — [ICANN HACKED: Intruders poke around global DNS innards](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044)
- Help Net Security — [ICANN systems breached via spear-phishing emails](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/)
- Computerworld — [ICANN data compromised in spearphishing attack](https://www.computerworld.com/article/1487605/icann-data-compromised-in-spearphishing-attack.html)
- WeLiveSecurity (ESET) — [ICANN computers compromised by hackers](https://www.welivesecurity.com/2014/12/18/icann-computers-compromised-hackers/)
- Associations Now — [ICANN Systems Infiltrated in "Spear Phishing" Attack](https://associationsnow.com/2014/12/icann-systems-infiltrated-spear-phishing-attack/)
- Slate — [ICANN Got Hacked](https://slate.com/technology/2014/12/icann-hacked-in-spear-phishing-campaign.html)
- Domain Incite — [Hacked ICANN data for sale on black market](http://domainincite.com/21562-hacked-icann-data-for-sale-on-black-market)
- Slashdot — [Hackers Compromise ICANN, Access Zone File Data System](https://tech.slashdot.org/story/14/12/18/1540233/hackers-compromise-icann-access-zone-file-data-system)
- CyberScoop — [Hacked ICANN data still sells for hundreds of dollars years after breach](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/)
- DomainGang — [ICANN alerts users of CZDS & ICANN Wiki about security breach](https://domaingang.com/domain-news/icann-alerts-users-czds-icann-wiki-security-breach/)
