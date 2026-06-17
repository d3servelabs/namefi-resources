---
title: 'اختطاف نظام أسماء النطاقات (DNS) للخطوط الجوية الماليزية: "404 — لم يتم العثور على الطائرة"'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'في يناير 2015، اختطفت مجموعة "Lizard Squad" نظام أسماء النطاقات (DNS) لموقع malaysiaairlines.com واستبدلت موقع شركة الطيران بسحلية ترتدي بدلة رسمية وعبارة ساخرة "404 — لم يتم العثور على الطائرة". لم يتم اختراق أي خادم — لقد قام المهاجمون ببساطة بتغيير وجهة توجيه النطاق. نظرة متعمقة من "Domain Mayday" حول كيف أصبح نظام أسماء النطاقات الباب الأمامي الأكثر انكشافاً لشركة الطيران.'
keywords: ['اختطاف dns للخطوط الجوية الماليزية', 'lizard squad', 'الخلافة الإلكترونية', '404 لم يتم العثور على الطائرة', 'اختطاف dns', 'اختطاف النطاق', 'اختراق مسجل النطاقات', 'webnic', 'malaysiaairlines.com', 'أمن النطاقات', 'إعادة توجيه dns', 'قفل السجل', 'mh370']
---

لم يتم العثور على الطائرة أبدًا. وفي يناير 2015، حدث الشيء نفسه مع الموقع الإلكتروني.

في صباح يوم 26 يناير 2015، كل من كتب **malaysiaairlines.com** في المتصفح لم يصل إلى موقع شركة الطيران. بل وصل إلى مخترق (هاكر). اختفت صفحة الحجز المألوفة، واستُبدلت بصورة لسحلية ترتدي قبعة عالية ونظارة أحادية وعنوان واحد قاسٍ: **"404 — لم يتم العثور على الطائرة"**. وتحته كُتب: *"تم الاختراق بواسطة Lizard Squad — الخلافة الإلكترونية الرسمية"*. وكان شريط عنوان المتصفح يقرأ ببساطة: *"داعش ستنتصر"*.

كانت مزحة حول مقبرة. فقبل أقل من عام، اختفت رحلة الخطوط الجوية الماليزية رقم 370 من على شاشات الرادار وعلى متنها 239 شخصًا. وبعد ذلك بأربعة أشهر، أُسقطت الرحلة رقم 17 من السماء فوق أوكرانيا. والآن، قامت مجموعة من المراهقين بتحويل مأساة شركة الطيران إلى نكتة تُعرض على بابها الأمامي — دون أن يلمسوا خوادمها على الإطلاق.

هذا الجزء الأخير هو القصة بأكملها. لم تُخترق الخطوط الجوية الماليزية بالطريقة التي يتخيلها معظم الناس. كانت أنظمة الحجز الخاصة بها سليمة. وظلت بيانات ركابها آمنة ولم تُمس. ما استولى عليه المهاجمون كان شيئًا أكثر جوهرية، واتضح أنه أسهل بكثير في الاستيلاء عليه: **اسم النطاق نفسه** — العنوان الذي يخبر الإنترنت بالكامل أين تعيش "الخطوط الجوية الماليزية".

هذه دراسة حالة من سلسلة "Domain Mayday" حول الجزء من بنيتك التحتية الذي ربما لا تفكر فيه أبدًا إلى أن يوجه المستخدمين إلى مكان آخر.

## شركة الطيران هي نطاقها

بالنسبة لشركة طيران عالمية، الموقع الإلكتروني ليس مجرد كتيب تعريفي. إنه ماكينة تسجيل المدفوعات، ومكتب تسجيل الدخول، ومركز الاتصال، وكل ذلك مرتبط بسلسلة نصية واحدة: `malaysiaairlines.com`.

كل حجز، وكل تسجيل دخول لبرامج الولاء، وكل رابط "إدارة رحلتي" في كل بريد إلكتروني للتأكيد يمر عبر ذلك النطاق. عندما يكتبه مسافر في كوالالمبور أو لندن، تنطلق سلسلة غير مرئية من الإجراءات: يسأل المتصفح نظام أسماء النطاقات (DNS) "أين يوجد موقع malaysiaairlines.com؟"، ويجيب نظام الـ DNS بعنوان IP، فيتصل المتصفح. تعتمد العلامة التجارية لشركة الطيران، وإيراداتها، وثقة عملائها على عودة عملية البحث هذه بالإجابة *الصحيحة*.

نظام أسماء النطاقات (DNS) هو دليل عناوين الإنترنت. وهو أيضًا، بالنسبة لمعظم المؤسسات، الباب الأقل مراقبة في المبنى. يمكنك إنفاق الملايين في تحصين خوادمك، وتشفير قواعد بياناتك، وتدريب موظفيك ضد التصيد الاحتيالي — وكل هذا لا يهم إذا كان بإمكان شخص ما تغيير السطر الموجود في دليل العناوين بهدوء والذي يحدد إلى أين يشير اسمك. إذا قمت بإعادة توجيه العنوان، فقد قمت بإعادة توجيه الشركة، دون الحاجة إلى اقتحام المبنى مطلقًا.

وهذا بالضبط ما حدث.

## الاختطاف: سحلية في المكان الذي كانت فيه شركة الطيران

![Vivid colorful concept art of a glowing DNS signpost on a runway switched by an unseen hand, rerouting a stream of travelers away from a departure gate toward a dead-end wall stamped with a giant 404, neon teal and magenta](../../assets/the-malaysia-airlines-dns-hijack-01-hijack.jpg)

صُمم هذا التشويه لتحقيق أقصى قدر من القسوة. كانت صورة السحلية التي ترتدي ملابس رسمية هي بطاقة تعريف مجموعة "Lizard Squad"؛ حيث أمضت المجموعة شهر ديسمبر السابق في تعطيل شبكات [Xbox Live and Sony PlayStation Network](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Hacker%20group%20Lizard%20Squad%2C%20which%20took%20down%20Xbox%20Live%20and%20the%20Sony%20PlayStation%20Network%20last%20month) عبر الإنترنت خلال فترة الأعياد. وبحلول شهر يناير، كانت قد غلفت نفسها بصور "الخلافة الإلكترونية"، متظاهرة بالتحالف مع تنظيم داعش على الرغم من أن الباحثين تعاملوا مع هذا الادعاء بشك عميق.

عرض الموقع، كما وجده الزوار، [صورة لسحلية ترتدي قبعة عالية ونظارة أحادية، بالإضافة إلى نص "404-لم يتم العثور على الطائرة"](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=The%20site%20currently%20displays%20a%20picture%20of%20a%20lizard%20in%20a%20top%20hat%20and%20monocle%2C%20as%20well%20as%20the%20text%20%27404%2DPlane%20Not%20Found%27). يسجل حساب ويكيبيديا عن المجموعة نفس المشهد: [تمت إعادة توجيه المستخدمين إلى صفحة أخرى تحمل صورة سحلية ترتدي بدلة رسمية](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=Users%20were%20redirected%20to%20another%20page%20bearing%20an%20image%20of%20a%20tuxedo%2Dwearing%20lizard)، وكانت الصفحة [تحمل العنوان "404 - لم يتم العثور على الطائرة"، في إشارة واضحة إلى فقدان شركة الطيران للرحلة MH370 في العام السابق](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=The%20page%20also%20carried%20the%20headline%20%22404%20%2D%20Plane%20Not%20Found%22%2C%20an%20apparent%20reference%20to%20the%20airline%27s%20loss%20of%20flight%20MH370%20the%20previous%20year).

كانت القسوة هي الهدف. فقد [اختفت الرحلة MH370 من الرادار في 8 مارس 2014](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370#:~:text=disappeared%20from%20radar%20on%208%20March%202014)، واُفترض في النهاية وفاة جميع الأشخاص الذين كانوا على متنها والبالغ عددهم 239 شخصًا، ولم يتم تحديد موقع الحطام بشكل قاطع أبدًا. كما تم [إسقاط الرحلة MH17 بواسطة القوات المدعومة من روسيا بصاروخ أرض-جو من طراز Buk 9M38 في 17 يوليو 2014](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17#:~:text=shot%20down%20by%20Russian%2Dbacked%20forces%20with%20a%20Buk%209M38%20surface%2Dto%2Dair%20missile%20on%2017%20July%202014)، مما أسفر عن مقتل جميع من كانوا على متنها وعددهم 298 شخصًا. إن طباعة عبارة "لم يتم العثور على الطائرة" عبر الصفحة الرئيسية لشركة الطيران كان بمثابة تسليح لأسوأ عام في تاريخ الشركة — وبث ذلك لكل عميل يحاول الوصول إلى الموقع.

ثم جاء التهديد. قامت المجموعة بنشر [تغريدة تفيد بأنها ستقوم "بتسريب بعض الغنائم الموجودة على خوادم www.malaysiaairlines.com قريبًا،"](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=Going%20to%20dump%20some%20loot%20found%20on%20www.malaysiaairlines.com%20servers%20soon) ونشرت حتى لقطة شاشة ادعت أنها تُظهر مسارات رحلات الركاب. بالنسبة لشركة طيران غارقة بالفعل في عام مليء بالكوارث، كانت فكرة تسريب بيانات العملاء بمثابة كارثة بحد ذاتها.

## كيف حدث ذلك: دليل العناوين، وليس المبنى

![Vivid colorful concept art of a futuristic switchboard operator pulling a glowing cable from the correct socket and plugging it into a fake one, streams of light-traffic diverting off a runway toward an impostor terminal, electric blues and warm orange](../../assets/the-malaysia-airlines-dns-hijack-02-dns-redirect.jpg)

هنا يكمن الجوهر الفني للأمر، والسبب الذي يجعل هذه الحالة تنتمي إلى سلسلة أمن النطاقات (domain-security) بدلاً من اختراق الخوادم.

رسم بيان الخطوط الجوية الماليزية نفسه، والذي تكرر في جميع التغطيات الإعلامية، هذا التمييز بدقة: [تؤكد الخطوط الجوية الماليزية أن نظام أسماء النطاقات (DNS) الخاص بها قد تم اختراقه حيث يتم إعادة توجيه المستخدمين إلى موقع قراصنة عند إدخال عنوان URL www.malaysiaairlines.com](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20confirms%20that%20its%20Domain%20Name%20System%20%28DNS%29%20has%20been%20compromised%20where%20users%20are%20re%2Ddirected%20to%20a%20hacker%20website). أصرت شركة الطيران على أن [موقعها الإلكتروني لم يتم اختراقه وأن هذا الخلل المؤقت لا يؤثر على حجوزاتها وأن بيانات المستخدمين لا تزال آمنة](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20assures%20customers%20and%20clients%20that%20its%20website%20was%20not%20hacked%20and%20this%20temporary%20glitch%20does%20not%20affect%20their%20bookings%20and%20that%20user%20data%20remains%20secured)، مضيفة أن [خوادم الويب الخاصة بها سليمة تمامًا](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=Malaysia%20Airlines%27%20Web%20servers%20are%20intact).

كلا الأمرين كانا صحيحين في نفس الوقت: دُمر الموقع، *و*كانت الخوادم بخير. لم يحتج المهاجمون إلى الخوادم أبدًا. وكما وصفتها صحيفة The Register، [تم التدخل في سجلات DNS الخاصة بالموقع بحيث يتم إعادة توجيه المتصفحين إلى موقع يسيطر عليه قراصنة](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=DNS%20records%20for%20the%20site%20have%20been%20interfered%20with%20so%20that%20surfers%20are%20being%20redirected%20to%20a%20hacker%2Dcontrolled%20site). لقد غيروا الإدخال في دليل العناوين، وليس المبنى الذي يشير إليه. حتى الخبث تم تسجيله في البيانات الوصفية (metadata): أظهر فحص معلومات Whois في ذلك الوقت أن عبارة [داعش ستنتصر (ISIS will prevail)](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html#:~:text=ISIS%20will%20prevail) مُدرجة كعنوان للموقع.

أين تم الاحتفاظ بدليل العناوين هذا؟ عند مسجل النطاقات. يبدو أن نطاق شركة الطيران [مسجل لدى شركة Web Commerce Communications Limited — المعروفة بـ Webnic — والتي لديها مكاتب في سنغافورة وماليزيا والصين](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=registered%20with%20Web%20Commerce%20Communications%20Limited%20%2D%20a.k.a.%20Webnic%20%2D%20which%20has%20offices%20in%20Singapore%2C%20Malaysia%20and%20China). هذا الاسم مهم، لأن شركة Webnic كانت على وشك أن تصبح سيئة السمعة.

بعد شهر، كان المسجل نفسه في مركز حادثة أكبر بكثير. كما ذكر بريان كريبس، المهاجمون [استولوا على Webnic.cc، المسجل الماليزي الذي يخدم هذا النطاق و 600 ألف نطاق آخر](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=seized%20control%20over%20Webnic.cc%2C%20the%20Malaysian%20registrar%20that%20serves%20both%20domains%20and%20600%2C000%20others)، ثم [استفادوا من وصولهم في Webnic.cc لتغيير سجلات نظام أسماء النطاقات (DNS)](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=leverage%20their%20access%20at%20Webnic.cc%20to%20alter%20the%20domain%20name%20system%20%28DNS%29%20records) لشركتي **لينوفو (Lenovo)** و **جوجل فيتنام (Google Vietnam)**. الآلية، كما ذكر كريبس، كانت [ثغرة حقن الأوامر في Webnic.cc لرفع برمجية خبيثة (rootkit)](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) — وهو وصول دائم إلى النظام نفسه الذي يتحكم في توجيه مئات الآلاف من النطاقات.

لا تحتاج إلى اختراق شركة جوجل لإعادة توجيه google.com.vn. ولا تحتاج إلى اختراق شركة طيران لإعادة توجيه صفحتها الرئيسية. ما عليك سوى اختراق الطبقة التي *تمتلك الإجابة* على سؤال "أين يعيش هذا النطاق؟" — حساب المسجل وسجلات الـ DNS التي تقف خلفه. تقع هذه الطبقة خارج النطاق الذي تدافع عنه معظم الشركات فعليًا.

## التأثير والاستجابة

بالنسبة لشركة الطيران، كان الضرر متعلقًا بالسمعة والتشغيل أكثر من كونه سرقة بيانات. فقد اصطدم العملاء الذين يحاولون الحجز أو إتمام إجراءات السفر بصفحة مشوهة. وربطت عناوين الأخبار في جميع أنحاء العالم بين كلمتي "الخطوط الجوية الماليزية" و"الاختراق" — علامة تجارية تعاني بالفعل من أزمة ترتبط الآن بسحلية تسخر منها بشأن طائرتها المفقودة.

تحركت شركة الطيران لاحتواء الموقف بالطريقة الوحيدة التي يمكن من خلالها احتواء اختطاف الـ DNS: من خلال العمل عبر الطبقة التي تم اختراقها. صرحت بأنها [قد حلت المشكلة مع مزود الخدمة الخاص بها](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=resolved%20the%20issue%20with%20its%20service%20provider) وأنه [من المتوقع استعادة النظام بالكامل في غضون 22 ساعة](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=The%20system%20is%20expected%20to%20be%20fully%20recovered%20within%2022%20hours). هذا الإطار الزمني في حد ذاته مؤشر على اختطاف الـ DNS: فحتى بعد إصلاح السجلات، يمكن أن تبقى الإجابة الخاطئة في ذاكرة التخزين المؤقت (caches) حول العالم حتى تنتهي صلاحيتها. إن الاختطاف سريع الحدوث ولكنه بطيء في الإصلاح التام.

وفيما يتعلق بتهديد تسريب البيانات، تمسكت شركة الطيران بموقفها — الحجوزات لم تتأثر، وبيانات المستخدمين آمنة — والتسريب الكارثي الذي تفاخرت به المجموعة لم يتحقق كما وُصف أبدًا. لكن رسالة "لم يتم اختراقنا حقًا، بل سيطر المهاجمون فقط على هويتنا العامة بالكامل لمعظم اليوم" هي رسالة يصعب إقناع جمهور المسافرين بها. بالنسبة للعميل الذي يحدق في شاشة مكتوب عليها "404 — لم يتم العثور على الطائرة"، فإن الفرق بين اختراق الخادم واختطاف الـ DNS غير مرئي. فالموقع كان هو شركة الطيران. ولمدة يوم واحد، كان الموقع ملكًا لشخص آخر.

## ماذا يعلمنا هذا عن نظام الـ DNS باعتباره بابك الأمامي

يُعد اختطاف نطاق الخطوط الجوية الماليزية درسًا نموذجيًا تحديدًا لأنه *لم يتم اختراق أي شيء* بالمعنى التقليدي. ويمكن تعميم هذه الدروس المستفادة على كل مؤسسة تقريبًا على الإنترنت:

1. **نطاقك هو نقطة فشل فردية لا تتحكم فيها وحدك.** يحتفظ مسجل النطاقات بالسجل الرئيسي لمكان توجيه اسمك. إذا فشل أمان حسابه — أو برامجه — فإن خوادمك المحصنة تمامًا لا قيمة لها. أثبتت شركة Webnic ذلك مرتين في شهر واحد، مع شركة طيران ثم مع جوجل ولينوفو.

2. **اختطاف الـ DNS لا يحتاج إلى اختراق أنظمتك.** أعاد المهاجمون توجيه دليل العناوين، وليس المبنى. الدفاعات التي تراقب خوادمك وشفراتك وشبكتك يمكن أن تفوتها هجمة تحدث بالكامل في طبقة التسمية.

3. **أقفل السجلات التي يمكنها نقل اسمك.** توجد ميزة قفل السجل (Registry Lock) وأقفال مستوى مسجل النطاقات (registrar-level locks) خصيصًا لوقف التغييرات غير المصرح بها على سجلات الـ DNS وخوادم الأسماء (nameservers) الخاصة بك — فهي تضيف خطوة يدوية خارج النطاق قبل أن يتمكن أي شخص من إعادة توجيه نطاقك. بالنسبة لنطاق عالي القيمة، هذه الميزات ليست اختيارية.

4. **اعتمد على تقنية (DNSSEC) والمصادقة الثنائية (2FA) عند مسجل النطاقات.** إن المصادقة القوية على حساب المسجل وتوقيع منطقة الـ DNSSEC ترفع من تكلفة ومجهود تنفيذ التبديل الصامت للسجلات الذي شوه موقع الخطوط الجوية الماليزية.

5. **التعافي أبطأ من الهجوم.** تعني مدة بقاء البيانات (TTLs) وذاكرة التخزين المؤقت العالمية (global caches) أن الاختطاف يستمر حتى بعد إصلاحه. خطط لفترة التنظيف (التعافي)، وليس فقط لفترة تصحيح الخطأ (patch).

الملخص المزعج: تقوم معظم الشركات بحراسة المبنى وتترك ملاحظة لاصقة على الباب الأمامي تخبر الجميع بأي مبنى يجب الدخول إليه. غيّر الملاحظة، وستكون قد نقلت الشركة بأكملها.

## وجهة نظر Namefi

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-malaysia-airlines-dns-hijack-03-namefi-angle.jpg)

في جوهره، فإن اختطاف نطاق الخطوط الجوية الماليزية هو سؤال حول *من المسموح له بتغيير المكان الذي يشير إليه الاسم* — ومدى سهولة سرقة تلك الصلاحية بهدوء في طبقة مسجل النطاقات. لم يتغلب الهجوم على التشفير أو يخترق قاعدة بيانات. لقد تغلب على مستوى التحكم الضعيف القائم على الحسابات والذي يقرر الحقيقة الأكثر أهمية حول أي نطاق: أين يتم توجيهه وحله.

تم بناء [Namefi](https://namefi.io) على فكرة أن ملكية النطاق والتحكم فيه يجب أن تتصرف كأصل يمكن التحقق منه وأصيل على الإنترنت، وليس كعنصر في قاعدة بيانات المسجل يمكن لحساب واحد مخترق أن يعيد كتابته. تجعل الملكية المرمزة (Tokenized ownership) السؤال "من يتحكم في هذا النطاق، وهل انتقلت هذه السيطرة للتو؟" قابلاً للتدقيق وواضحًا في حال التلاعب به، مع الحفاظ على التوافق مع نظام أسماء النطاقات (DNS). الدفاع ضد الاختطاف ليس مجرد استخدام كلمات مرور أقوى — بل جعل التغييرات غير المصرح بها *مرئية وقابلة للإثبات* بدلاً من كونها صامتة.

لم تفقد الخطوط الجوية الماليزية خوادمها أبدًا. لقد فقدت الإجابة على سؤال واحد — *إلى أين يشير هذا الاسم؟* — لمدة يوم واحد تقريبًا. لم يتم العثور على الطائرة أبدًا. ولم يكن ينبغي فقدان الموقع الإلكتروني أيضًا. الدرس المستفاد من "Domain Mayday" هو أن دليل العناوين هو جزء من محيطك الأمني، واليوم الذي تنسى فيه ذلك هو اليوم الذي تنتقل فيه سحلية ترتدي قبعة عالية إلى بابك الأمامي.

## المصادر وقراءات إضافية

- TechCrunch — [اختراق موقع الخطوط الجوية الماليزية بواسطة Lizard Squad](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/)
- The Register — [Lizard Squad تهدد الخطوط الجوية الماليزية بتسريب البيانات](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/)
- BankInfoSecurity — [اختراق الموقع الإلكتروني للخطوط الجوية الماليزية](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833)
- Computerworld — [الخطوط الجوية الماليزية تدعي اختطاف DNS، وعدم اختراق الموقع، لكن المهاجمين يهددون بتسريب البيانات](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html)
- Infosecurity Magazine — [عودة موقع الخطوط الجوية الماليزية للعمل مع تهديد القراصنة بتسريب البيانات](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/)
- Krebs on Security — [اتهام مسجل Webnic في اختطاف نطاقات لينوفو وجوجل](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- Help Net Security — [اختطاف موقع Lenovo.com أصبح ممكناً بسبب اختراق مسجل Webnic](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- ABC News — [الخطوط الجوية الماليزية تتعرض لهجوم اختراق من Lizard Squad](https://abcnews.go.com/Technology/malaysia-airlines-hit-lizard-squad-hack-attack/story?id=28489244)
- NBC News — [Lizard Squad تدعي اختراق موقع الخطوط الجوية الماليزية](https://www.nbcnews.com/storyline/isis-terror/lizard-squad-claims-it-hacked-malaysia-airlines-website-n293461)
- IT Security Guru — [Lizard Squad تختطف DNS للخطوط الجوية الماليزية](https://www.itsecurityguru.org/2015/01/26/lizard-squad-hijacks-malaysia-airline-dns/)
- Wikipedia — [Lizard Squad](https://en.wikipedia.org/wiki/Lizard_Squad)
- Wikipedia — [الرحلة 370 للخطوط الجوية الماليزية](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370)
- Wikipedia — [الرحلة 17 للخطوط الجوية الماليزية](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17)