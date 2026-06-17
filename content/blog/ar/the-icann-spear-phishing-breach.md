---
title: 'عندما تعرضت ICANN نفسها للتصيّد: اختراق التصيد الرمحي لعام 2014 في قلب الإنترنت'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'في أواخر عام 2014، اعترفت ICANN — الهيئة التي تنسق نظام أسماء النطاقات على الإنترنت — بأن بريداً إلكترونياً للتصيد الرمحي ينتحل صفة نطاقها الخاص قد حصد بيانات اعتماد الموظفين ومنح المهاجمين وصولاً إدارياً إلى نظام بيانات المنطقة المركزي. نظرة متعمقة من Domain Mayday حول كيف تعرضت سلطة DNS نفسها للتصيد الاحتيالي، وما الذي تم كشفه، ولماذا لا يزال هذا الأمر مهماً.'
keywords: ['اختراق icann', 'التصيد الرمحي icann', 'czds', 'نظام بيانات المنطقة المركزي', 'أمان dns', 'أمان النطاق', 'هجوم التصيد الرمحي', 'تصيد بيانات الاعتماد', 'ملفات المنطقة', 'iana', 'تجزئة كلمات المرور المملحة', 'اختراق نظام أسماء النطاقات', 'اختراق icann عام 2014']
---

هناك نوع خاص من العناوين الإخبارية التي تجعل صناعة الأمن بأكملها تتوقف للحظة. ليس "اختراق بائع تجزئة آخر"، ولا "شركة ناشئة أخرى تسرب قاعدة بيانات" — بل هو اليوم الذي تعترف فيه المؤسسة التي يثق بها *الجميع* بتعرضها للاختراق بأكثر الطرق اعتيادية على الإطلاق.

في ديسمبر 2014، كانت تلك المؤسسة هي آيكان (ICANN). مؤسسة الإنترنت للأسماء والأرقام المُخصصة — وهي المؤسسة غير الربحية التي تنسق نظام أسماء النطاقات بأكمله، وحارسة القواعد التي تسمح لـ `namefi.io` و `google.com` وكل عنوان آخر على وجه الأرض بالاتصال بالخادم — كشفت عن أن بعض موظفيها قد نقروا على رابط في بريد إلكتروني مزيف، وأدخلوا كلمات المرور الخاصة بهم في صفحة تسجيل دخول مزيفة، وسلّموا للمهاجمين مفاتيح الأنظمة الداخلية — بما في ذلك نظام بيانات المنطقة المركزي (CZDS)، وهو المستودع الذي يتم من خلاله طلب ملفات منطقة النطاقات ذات المستوى الأعلى في العالم والوصول إليها.

المنظمة التي تحدد كيفية عمل الثقة على الإنترنت تعرضت للتصيّد. ببريد إلكتروني مزيف. يدّعي أنه من ICANN.

هذه هي **الحلقة 11 من Domain Mayday** — وهي الحلقة التي يتبين فيها أن التهديد جاء من الداخل.

## مَن هي ICANN، ولماذا يُعد الاختراق هناك أمراً رمزياً

لفهم سبب الوقع الكبير لهذه القصة، يجب أن تفهم ما تفعله ICANN حقاً.

إن ICANN ليست شركة تشتري منها نطاقاً. بل تقع في طبقة أعلى من ذلك. إنها تنسق النظام العالمي للمعرّفات الفريدة الذي يجعل الإنترنت قابلاً للتصفح: النطاقات ذات المستوى الأعلى (`.com`، `.org`، `.io`، والمئات من النطاقات الأحدث)، والقواعد التي تتبعها السجلات والمسجلون، و—من خلال وظيفة IANA الخاصة بها— قمة هرم نظام أسماء النطاقات (DNS)، منطقة الجذر التي يعتمد عليها في النهاية كل بحث آخر.

إذا كانت النطاقات هي عناوين الإنترنت، فإن ICANN تدير الدليل الرئيسي لمكتب البريد. يُعد حدوث اختراق لدى مسجل النطاقات أمراً سيئاً. لكن حدوث اختراق في ICANN هو أمر رمزي، لأنه من المفترض أن تكون ICANN هي *السلطة* — المؤسسة الوحيدة التي تتمثل مهمتها في الحفاظ على نظام التسمية منظماً وموثوقاً. عندما يتم اختراق السلطة المسؤولة عن أسماء الإنترنت، يصبح السؤال المزعج واضحاً: إذا كان من الممكن تصيّد *هؤلاء*، فمن الذي لا يمكن تصيّده؟

## أواخر عام 2014: حدوث الاختراق

![رسم فني ملون وحيوي لرسالة رسمية مزورة تتسلل متجاوزة حارساً شاهقاً يمسك بحلقة متوهجة من المفاتيح الرئيسية للإنترنت، حيث تتوهج الرسالة باللون الأحمر بينما تتوهج المفاتيح باللون الأزرق](../../assets/the-icann-spear-phishing-breach-01-breach.jpg)

وضعت ICANN الجدول الزمني في [إعلانها العام الخاص](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=We%20believe%20a%20%22spear%20phishing%22%20attack%20was%20initiated%20in%20late%20November%202014.)، والذي نُشر في 16 ديسمبر 2014، بصراحة تُحسَد عليها: "نعتقد أن هجوم 'تصيد رمحي' (Spear Phishing) قد بدأ في أواخر نوفمبر 2014".

كانت الآليات بسيطة بشكل مهين تقريباً. كما وصفتها ICANN، فإن الهجوم "[تضمن رسائل بريد إلكتروني صُممت لتبدو وكأنها واردة من نطاقنا الخاص وتم إرسالها إلى أعضاء من طاقم موظفينا](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=It%20involved%20email%20messages%20that%20were%20crafted%20to%20appear%20to%20come%20from%20our%20own%20domain%20being%20sent%20to%20members%20of%20our%20staff.)". تلقى الموظفون رسائل بريد إلكتروني بدت وكأنها قادمة من `icann.org` — من داخل ICANN نفسها. نقر البعض عليها. وكما أعادت صحيفة The Register بناء القصة، فإن الموظفين "[نقروا على رابط في الرسائل أخذهم إلى صفحة تسجيل دخول مزيفة – حيث كتب الموظفون أسماء المستخدمين وكلمات المرور الخاصة بهم](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=clicked%20on%20a%20link%20in%20the%20messages%20that%20took%20them%20to%20a%20bogus%20login%20page)"، مُسلمين بذلك بيانات اعتماد البريد الإلكتروني الخاص بعملهم للمهاجمين. وكان الحكم الجاف من The Register على الدفاع المفقود: "[لا يوجد أي أثر للمصادقة الثنائية، إذن.](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)"

النتيجة، بكلمات ICANN نفسها: "[أسفر الهجوم عن اختراق بيانات اعتماد البريد الإلكتروني لعدة موظفين في ICANN.](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attack%20resulted%20in%20the%20compromise%20of%20the%20email%20credentials%20of%20several%20ICANN%20staff%20members.)" وعبّر موقع Help Net Security عن الأمر بوضوح أكبر: "[تم خداع العديد من الموظفين لتسليم بيانات اعتماد بريدهم الإلكتروني](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=Several%20staff%20members%20were%20fooled%20into%20handing%20over%20their%20email%20credentials)" للمهاجمين.

لا توجد ثغرات يوم الصفر (Zero-day). لا توجد برمجيات خبيثة غريبة. بريد إلكتروني مُقنع ومربع تسجيل دخول مزيف — وهي أقدم حيلة على الإنترنت، تم تنفيذها ضد الأشخاص الذين يساعدون في تشغيل الإنترنت.

## ما الذي تم الوصول إليه: نظام بيانات المنطقة في القلب

إن سرقة بيانات اعتماد البريد الإلكتروني أمر سيء بحد ذاته. لكن ما جعل هذا الاختراق حلقة من *Domain Mayday* هو ما وصل إليه المهاجمون *باستخدام* تلك البيانات.

في أوائل ديسمبر 2014، اكتشفت ICANN أنه تم إعادة استخدام بيانات تسجيل الدخول المخترقة للوصول إلى أنظمة أخرى. كان أخطرها هو **نظام بيانات المنطقة المركزي** (CZDS)، وهي المنصة التي تقوم الأطراف المصرح لها من خلالها بطلب وتنزيل ملفات المنطقة للنطاقات ذات المستوى الأعلى العامة في العالم. كان إفصاح ICANN صارخاً: "[حصل المهاجم على وصول إداري إلى جميع الملفات في نظام CZDS.](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attacker%20obtained%20administrative%20access%20to%20all%20files%20in%20the%20CZDS.)"

وصول *إداري*. إلى *جميع* الملفات. شرحت The Register سبب أهمية ذلك: يمنح نظام CZDS "[الأطراف المصرح لها حق الوصول إلى جميع ملفات المنطقة الخاصة بالنطاقات ذات المستوى الأعلى العامة في العالم](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=gives%20authorized%20parties%20access%20to%20all%20the%20zone%20files%20of%20the%20world%27s%20generic%20top%2Dlevel%20domains)". إن *مستخدمي* النظام ليسوا أشخاصاً عاديين — بل هم، كما أشارت The Register، "[العديد من مسؤولي السجلات والمسجلين في العالم](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=many%20of%20the%20administrators%20of%20the%20world%27s%20registries%20and%20registrars)". لم يدخل المهاجمون إلى قاعدة بيانات وحسب؛ بل دخلوا إلى قاعدة البيانات التي يسجل حراس نظام التسمية أنفسهم الدخول إليها.

بالإضافة إلى ملفات المنطقة، كشف الاختراق عن البيانات الشخصية التي سجل بها مستخدمو CZDS. ووفقاً لـ ICANN، تضمنت الحصيلة "[نُسخاً من ملفات المنطقة في النظام، بالإضافة إلى المعلومات التي أدخلها المستخدمون مثل الاسم والعنوان البريدي وعنوان البريد الإلكتروني وأرقام الفاكس والهاتف واسم المستخدم وكلمة المرور](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=This%20included%20copies%20of%20the%20zone%20files%20in%20the%20system%2C%20as%20well%20as%20information%20entered%20by%20users)". أسماء مستخدمين وكلمات مرور للأشخاص الذين يديرون نطاقات المستوى الأعلى (TLDs) — تستقر في نظام دخله المهاجم مرتدياً شارة مسروقة.

وقد امتدت صلاحيات بيانات الاعتماد إلى أبعد من ذلك أيضاً. أكدت ICANN أن المهاجمين وصلوا أيضاً إلى **ويكي GAC** (مساحة اللجنة الاستشارية الحكومية)، و**مدونة ICANN**، و**بوابة معلومات WHOIS**، على الرغم من أنها أبلغت عن [عدم وجود تأثير على النظامين الأخيرين](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=The%20latter%20two%20were%20not%20affected%20in%20any%20way.) واقتصر الأمر على مشاهدة محدودة على الويكي.

## كيف حدث ذلك: الشارة التي حملت اسم "ICANN"

![رسم فني ملون وحيوي لبرج مراقبة لنظام أسماء النطاقات ليلاً، تُظهر شارة مزورة واحدة متوهجة ومختومة بعلامة اختيار تفتح أبوابه بينما يقف الحراس الحقيقيون غافلين، مع تسرب أشعة من الضوء الأحمر](../../assets/the-icann-spear-phishing-breach-02-spear-phishing.jpg)

إذا جردنا الهجوم من طبقاته التقنية، سنجد أنه مجرد حيلة ثقة (خداع).

يختلف التصيد الرمحي (Spear Phishing) عن التصيد العادي في دقته. فهو ليس مليون رسالة بريد عشوائي تأمل في أن يبتلع أحدهم الطُعم؛ بل هو عدد صغير من الرسائل المصممة بعناية والموجهة لأشخاص محددين، والمصممة لتبدو وكأنها حركة مرور داخلية روتينية. هنا كان التمويه في أقوى صوره: بدا البريد الإلكتروني وكأنه وارد من `icann.org`. وكما لخصت The Register، "[أرسل المهاجمون للموظفين رسائل بريد إلكتروني مزيفة تبدو وكأنها واردة من icann.org.](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Attackers%20sent%20staff%20spoofed%20emails%20appearing%20to%20coming%20from%20icann.org.)"

فكّر في الجانب النفسي. إن رسالة البريد الإلكتروني الواردة من نطاق مؤسستك الخاصة لا تطلق أجراس الإنذار. وصفحة تسجيل الدخول التي تبدو مثل تلك التي تستخدمها كل يوم لا تفعل ذلك أيضاً. لقد استغل الهجوم بأكمله حقيقة أن ما هو *داخلي* و*مألوف* يبدو *آمناً* — وهما ليسا نفس الشيء على الإطلاق. قال شريط العنوان شيئاً؛ بينما قامت الصفحة التي تقف خلفه بحصد كل ما كُتب فيها.

كانت وسيلة التخفيف الحقيقية الوحيدة لدى ICANN تكمن في جانب التخزين: لم تكن كلمات المرور المسروقة مخزنة في نص عادي. وكما يشير الإفصاح، "[تم تخزين كلمات المرور كتجزئات تشفيرية مملحة (Salted Cryptographic Hashes)](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=Although%20the%20passwords%20were%20stored%20as%20salted%20cryptographic%20hashes)" — وهو أفضل من البديل، ولكن، كما أوضحت The Register، فإن هذه الحماية لا تصمد إلا إذا لم يعِد المستخدمون استخدام نفس بيانات تسجيل الدخول في مكان آخر، لأنه لا يزال من الممكن كسر التجزئات في وضع عدم الاتصال (Offline). لم ينتهِ الاختراق عند التنزيل؛ بل بدأ سباقاً بطيئاً بين المدافعين الذين يقومون بتدوير كلمات المرور والمهاجمين الذين يحاولون كسرها.

## الاستجابة والتداعيات

يُحسب لـ ICANN أنها تعاملت مع الكشف عن الاختراق بشكل أفضل من تعاملها مع الاختراق نفسه.

لقد أعلنت عن الأمر للجمهور في غضون أسابيع، وألغت تنشيط كلمات مرور CZDS، وأبلغت المستخدمين المتأثرين، والأهم من ذلك — أنها اعتبرت الشفافية واجباً وليست عبئاً. صرحت المنظمة بأنها كانت "[توفر معلومات حول هذا الحادث علناً، ليس فقط بسبب التزامنا بالانفتاح والشفافية، ولكن أيضاً لأن مشاركة معلومات الأمن السيبراني تساعد جميع المعنيين في تقييم التهديدات التي تواجه أنظمتهم](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=providing%20information%20about%20this%20incident%20publicly%2C%20not%20just%20because%20of%20our%20commitment%20to%20openness%20and%20transparency)". وأفادت أيضاً بأن برنامج تعزيز الأمان الذي بدأ في وقت سابق من ذلك العام قد "[ساعد في الحد من الوصول غير المصرح به الذي تم الحصول عليه في الهجوم](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=these%20enhancements%20helped%20limit%20the%20unauthorized%20access%20obtained%20in%20the%20attack)".

كانت الجملة الوحيدة الأكثر أهمية لشبكة الإنترنت الأوسع هي تلك المتعلقة بما *لم* يسقط. أكدت ICANN: "[لا يؤثر هذا الهجوم على أي أنظمة متعلقة بـ IANA](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=this%20attack%20does%20not%20impact%20any%20IANA%2Drelated%20systems)". إن IANA — كما وصفتها Help Net Security، هي الوظيفة التي "[تدير منطقة الجذر في نظام أسماء النطاقات (DNS)](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=manages%20the%20root%20zone%20in%20the%20Domain%20Name%20System)" — وهي القمة الفعلية لهرم التسمية في الإنترنت. لو وصل المهاجمون إليها، لما كان هذا مجرد اختراق بيانات مُحرج؛ بل كان سيصبح حالة طوارئ هيكلية في البنية التحتية.

جعل التوقيت الإحراج أسوأ. فقد وصفت العناوين الرئيسية لـ The Register الأمر بصراحة: "[توقيت هجوم التصيد الرمحي لم يكن ليصبح أسوأ من ذلك بالنسبة للمُشرف على أسماء النطاقات](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Spear%2Dphishing%20attack%20timing%20couldn%27t%20be%20worse%20for%20domain%20name%20overseer)". لماذا؟ لأن ICANN "[تأمل في أن تُسلم السيطرة على عقد IANA الحاسم في العام المقبل](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=it%20will%20prove%20extremely%20embarrassing%20to%20ICANN%2C%20which%20hopes%20to%20be%20handed%20control%20of%20the%20critical%20IANA%20contract%20next%20year)" — وهو نفس انتقال الإشراف الذي كان قيد التفاوض حينها. يُعد التعرض للتصيّد تجربة أداء سيئة لإثبات مقولة "ثقوا بنا في قلب الـ DNS". (للتوضيح، لم يكن هذا هو الذعر الأول لـ ICANN بشأن CZDS في عام 2014: أشارت The Register إلى حادثة سابقة في أبريل حيث "[مُنح عدد من المستخدمين عن طريق الخطأ حق الوصول الإداري إلى النظام](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=a%20number%20of%20users%20were%20wrongly%20given%20admin%20access%20to%20the%20system)").

وكان للبيانات حياة طويلة بعد الاختراق. ففي تحديث بتاريخ 21 فبراير 2017 أُلحق بإعلانها الخاص، أقرت ICANN بأن المعلومات من الاختراق بدأت تظهر مرة أخرى: "[بعض المعلومات التي تم الحصول عليها في حادث التصيد الرمحي الذي أعلنا عنه في عام 2014 معروضة للبيع في المنتديات السرية (Underground forums)](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=some%20information%20obtained%20in%20the%20spear%20phishing%20incident%20we%20announced%20in%202014%20is%20being%20offered%20for%20sale%20on%20underground%20forums)". وأفادت CyberScoop عن السعر المتداول بعد سنوات: "[لا تزال البيانات متداولة وتُباع في الأسواق السوداء مقابل 300 دولار](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/#:~:text=the%20data%20is%20still%20being%20passed%20around%20and%20sold%20on%20black%20markets%20for%20%24300)"، مع ادعاءات بأنها لم تتسرب من قبل. نقرة واحدة في أواخر عام 2014 كانت لا تزال تولد مبيعات في عام 2017.

## ما يعلمنا إياه هذا: الجميع عُرضة للتصيّد، حتى سلطة الـ DNS

الدرس المستفاد من الحلقة 11 (EP11) ليس أن "ICANN كانت مهملة". بل هو شيء أكثر مدعاة للتواضع.

**الجميع عُرضة للتصيّد.** ليسوا فقط المهملين. أو غير المدربين. *الجميع*. إن المنظمة التي تحكم فعلياً أسماء الإنترنت — والتي يعمل بها أشخاص يفكرون في الـ DNS والأمان والبنية التحتية من أجل لقمة العيش — لا يزال لديها العديد من الموظفين الذين كتبوا بيانات الاعتماد الخاصة بهم في صفحة مزيفة لأن البريد الإلكتروني بدا داخلياً. التصيد لا يتغلب على معرفتك؛ بل يتغلب على انتباهك، في الثانيتين اللتين تستغرقهما للنقر.

تتجلى بعض الاستنتاجات الثابتة من هذا الحادث:

1. **بيانات الاعتماد هي خط الدفاع الأول (المحيط الأمني).** لم يكسر المهاجمون أبداً تشفير ICANN أو يستغلوا عيباً في الخادم. بل استعاروا كلمة مرور. بمجرد أن تصبح الهوية هي البوابة، فإن الهوية المسروقة هي الاختراق — وهذا هو بالضبط سبب بقاء التصيد الاحتيالي هو الهجوم الأكثر موثوقية في العالم.
2. **المصادقة متعددة العوامل ليست اختيارية للأنظمة ذات الامتيازات.** انتقاد The Register حول "[لا يوجد أي أثر للمصادقة الثنائية](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)" هو بيت القصيد. فالعامل الثاني كان من المحتمل أن يحول سرقة بيانات الاعتماد إلى حدث غير ذي أهمية.
3. **الحركة الجانبية هي المُضاعف (للهجوم).** جاء الضرر من *إعادة الاستخدام* — إعادة استخدام بيانات تسجيل الدخول للبريد الإلكتروني للوصول إلى CZDS والويكي والبوابة. إن تقسيم الوصول وعدم السماح لبيانات اعتماد مسروقة واحدة بفتح العديد من الأبواب هو ما يحد من الاختراق.
4. **البيانات المُخترقة تبقى للأبد.** تُثبت إعادة البيع في عام 2017 أن "لقد أعدنا تعيين كلمات المرور" تنهي الحادثة ولكن لا تنهي الانكشاف. الأسماء والعناوين وأرقام الهواتف لا يمكن التراجع عن تسريبها.
5. **السلطة لا تعني الحصانة.** كونك المؤسسة التي تحدد معايير الثقة لا يجعلك محصناً ضد الهجوم الأساسي عليها. بل ربما يجعلك هدفاً أفضل.

## وجهة نظر Namefi

![رسم توضيحي ملون لملكية نطاق يمكن التحقق منها ومقاومة للتلاعب — بطاقة نطاق مؤمّنة بدرع أخضر، ورمز Namefi المميز الأخضر، واستمرارية DNS](../../assets/the-icann-spear-phishing-breach-03-namefi-angle.jpg)

إن اختراق ICANN، في جوهره، هو قصة حول *من يتحكم في السجلات* — وكيف تم اختطاف هذه السيطرة من خلال تسجيل دخول واحد مسروق في نظام مركزي.

هذا هو الضعف الهيكلي الذي يستحق التوقف عنده. عندما يعيش الدليل على من يحق له الوصول إلى بيانات النطاق الحيوية أو إدارتها خلف اسم مستخدم وكلمة مرور على منصة واحدة، فإن نموذج الثقة بأكمله ينهار في اللحظة التي يتم فيها تصيد بيانات الاعتماد هذه. لا يوجد فحص ثانٍ. كان البريد الإلكتروني المُقنع وكلمة المرور المعاد استخدامها كافيين لمنح وصول إداري إلى نظام بيانات المنطقة في قلب عالم التسمية.

تُبنى [Namefi](https://namefi.io) على فرضية مختلفة: وهي أن ملكية النطاق والتحكم فيه يجب أن يكونا **قابلين للتحقق، ومقاومين للتلاعب، وغير معتمدين على سر واحد في صندوق وارد واحد.** من خلال تمثيل ملكية النطاق كرموز على السلسلة (On-chain tokens) تظل متوافقة مع الـ DNS، يصبح التحكم شيئاً يمكنك إثباته تشفيرياً وتدقيقه — وليس مجرد شيء محمي بكلمة مرور يمكن أن يسرقها بريد إلكتروني للتصيد الرمحي. لا يجعل هذا أي شخص محصناً ضد التصيد الاحتيالي؛ فلا يوجد شيء يضمن ذلك. لكنه يقلل من نطاق التأثير المدمر، بحيث لا تعود بيانات الاعتماد المستعارة واحدة كافية للوصول إلى مفاتيح المملكة.

الصورة الخالدة من الحلقة 11 (EP11) هي الرسالة المزيفة التي تجاوزت حارس المفاتيح الرئيسية للإنترنت لأنها كانت ترتدي الزي المناسب. الحل ليس في إيجاد حارس أذكى. بل في نظام يمكن فيه للمفاتيح نفسها أن تثبت أنها حقيقية.

## المصادر وقراءات إضافية

- ICANN — [استهداف ICANN في هجوم تصيد رمحي | تنفيذ تدابير أمنية مُحسنة](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en) (المصدر الأساسي، بما في ذلك تحديث 2017)
- The Register — [اختراق ICANN: متسللون يتجولون في أحشاء نظام أسماء النطاقات العالمي](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044)
- Help Net Security — [اختراق أنظمة ICANN عبر رسائل بريد إلكتروني للتصيد الرمحي](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/)
- Computerworld — [اختراق بيانات ICANN في هجوم تصيد رمحي](https://www.computerworld.com/article/1487605/icann-data-compromised-in-spearphishing-attack.html)
- WeLiveSecurity (ESET) — [اختراق أجهزة حواسيب ICANN من قبل قراصنة](https://www.welivesecurity.com/2014/12/18/icann-computers-compromised-hackers/)
- Associations Now — [تسلل لأنظمة ICANN في هجوم "تصيد رمحي"](https://associationsnow.com/2014/12/icann-systems-infiltrated-spear-phishing-attack/)
- Slate — [اختراق ICANN](https://slate.com/technology/2014/12/icann-hacked-in-spear-phishing-campaign.html)
- Domain Incite — [بيانات ICANN المخترقة معروضة للبيع في السوق السوداء](http://domainincite.com/21562-hacked-icann-data-for-sale-on-black-market)
- Slashdot — [قراصنة يخترقون ICANN ويصلون إلى نظام بيانات ملف المنطقة](https://tech.slashdot.org/story/14/12/18/1540233/hackers-compromise-icann-access-zone-file-data-system)
- CyberScoop — [بيانات ICANN المخترقة لا تزال تُباع بمئات الدولارات بعد سنوات من الاختراق](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/)
- DomainGang — [تنبيه ICANN لمستخدمي CZDS و ويكي ICANN بشأن خرق أمني](https://domaingang.com/domain-news/icann-alerts-users-czds-icann-wiki-security-breach/)