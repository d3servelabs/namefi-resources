---
title: 'اختطاف DNS الخاص بماليزيا إيرلاينز: "404 — الطائرة مش موجودة"'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'في يناير 2015، اختطفت مجموعة Lizard Squad نظام DNS الخاص بـ malaysiaairlines.com واستبدلت موقع شركة الطيران بصورة سحلية ترتدي سترة رسمية مع رسالة استهزاء "404 — الطائرة مش موجودة". ما حصلش أي اختراق للسيرفرات — المهاجمون ببساطة غيّروا المكان اللي بيشير إليه الدومين. تحليل معمّق في إطار "Domain Mayday" يكشف كيف أصبح الـ DNS أكثر نقطة ضعف في بنية الشركة.'
keywords: ['اختطاف dns ماليزيا إيرلاينز', 'lizard squad', 'cyber caliphate', '404 plane not found', 'dns hijacking', 'domain hijacking', 'registrar compromise', 'webnic', 'malaysiaairlines.com', 'أمان الدومين', 'إعادة توجيه dns', 'registry lock', 'mh370']
---

الطائرة ما اتلقتش. وفي يناير 2015، الموقع كمان ما اتلقيش.

في صباح 26 يناير 2015، أي حد كتب **malaysiaairlines.com** في متصفحه ما وصلش للشركة. وصل لهاكر. صفحة الحجز المعروفة اختفت وحلّت محلها صورة سحلية لابسة طربوش وعدسة مكبّرة، وتحتها عنوان واحد قاسي: **"404 — الطائرة مش موجودة."** وتحته: *"Hacked by Lizard Squad — Official Cyber Caliphate."* وفي شريط عنوان المتصفح ظهر ببساطة: *"ISIS will prevail."*

كانت دعابة قبر. قبل أقل من سنة، اختفت طائرة ماليزيا إيرلاينز الرحلة 370 من الرادار وعلى متنها 239 شخصًا. وبعد أربعة أشهر، أُسقطت الرحلة 17 فوق أوكرانيا. والآن، مجموعة من الشباب حوّلوا حزن الشركة نكتة مركّبوها على بابها الرئيسي — من غير ما يلمسوا سيرفراتها أصلًا.

وده بالظبط هو جوهر القصة. ماليزيا إيرلاينز اتعرضتش لـ"هاكينج" بالمعنى اللي بيتخيّله معظم الناس. أنظمة الحجز كانت شغّالة. بيانات الركاب ما اتمستش. اللي المهاجمون استولوا عليه كان حاجة أساسية أكتر، وأسهل في الأخد: **اسم الدومين نفسه** — العنوان اللي بيقول للإنترنت كله فين "ماليزيا إيرلاينز" موجودة.

ده تحليل Domain Mayday عن الجزء من البنية التحتية اللي في الغالب ما بتفكرش فيه — لحد ما بيبدأ يشير لمكان تاني.

## شركة الطيران = الدومين بتاعها

بالنسبة لشركة طيران عالمية، الموقع مش كتيّب دعايا. ده ماكينة تذاكر، وكاونتر تسجيل دخول، ومركز خدمة عملاء، كلهم معلّقين على سلسلة نص واحدة: `malaysiaairlines.com`.

كل حجز، وكل دخول لبرنامج الولاء، وكل رابط "إدارة رحلتي" في أي إيميل تأكيد، كله بيمرّ عبر الدومين ده. لمّا راكب في كوالالمبور أو لندن بيكتبه، فيه سلسلة غير مرئية بتشتغل: المتصفح بيسأل نظام أسماء النطاقات (DNS) "فين يعيش malaysiaairlines.com؟"، الـ DNS بيردّ بعنوان IP، والمتصفح بيتصل. العلامة التجارية للشركة، وإيراداتها، وثقة عملائها — كلها متعلّقة بإن هذا البحث الواحد يرجع بالإجابة الصح.

الـ DNS هو دفتر عناوين الإنترنت. وهو في نفس الوقت، بالنسبة لمعظم المنظمات، أقل باب مراقَب في المبنى. ممكن تنفق الملايين في تأمين سيرفراتك وتشفير قواعد بياناتك وتدريب موظفيك على الفيشينج — وكل ده مش هيفيدك في حاجة لو حد قدر يغيّر سطرًا واحدًا في دفتر العناوين اللي بيقول فين اسمك بيشير. غيّر العنوان، وأنت كده غيّرت الشركة كلها، من غير ما تكسر باب واحد.

وده بالظبط اللي حصل.

## الاختطاف: سحلية مكان شركة طيران

![فن مفاهيمي ملوّن وحيوي لعلامة إشارة DNS مضيئة على مدرج طائرات يتم تحريكها بيد خفية، تحوّل تيار من المسافرين بعيدًا عن بوابة المغادرة نحو جدار مسدود مختوم بـ 404 كبيرة، بألوان التيل النيوني والماجنتا](../../assets/the-malaysia-airlines-dns-hijack-01-hijack.jpg)

التشويه اتصمّم بأقصى قدر من القسوة. صورة السحلية بالبدلة الرسمية كانت البطاقة الشخصية لـ Lizard Squad؛ المجموعة دي أمضت ديسمبر السابق في تعطيل [Xbox Live و Sony PlayStation Network](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Hacker%20group%20Lizard%20Squad%2C%20which%20took%20down%20Xbox%20Live%20and%20the%20Sony%20PlayStation%20Network%20last%20month) طول أيام العيد. وبحلول يناير، كانت لفّت نفسها في صورة "Cyber Caliphate"، تتوقع كونها موالية لـ ISIS رغم أن الباحثين تعاملوا مع الادعاء ده بشك كبير.

الموقع، كما وجده الزوار، [عرض صورة سحلية في طربوش وعدسة مكبّرة، بالإضافة للنص "404-Plane Not Found"](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=The%20site%20currently%20displays%20a%20picture%20of%20a%20lizard%20in%20a%20top%20hat%20and%20monocle%2C%20as%20well%20as%20the%20text%20%27404%2DPlane%20Not%20Found%27). وتوثيق ويكيبيديا للمجموعة يسجّل نفس المشهد: المستخدمين [أُعيد توجيههم لصفحة أخرى تحمل صورة سحلية لابسة بدلة رسمية](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=Users%20were%20redirected%20to%20another%20page%20bearing%20an%20image%20of%20a%20tuxedo%2Dwearing%20lizard)، والصفحة [حملت عنوان "404 - Plane Not Found"، في إشارة واضحة لفقدان الشركة للرحلة MH370 في السنة السابقة](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=The%20page%20also%20carried%20the%20headline%20%22404%20%2D%20Plane%20Not%20Found%22%2C%20an%20apparent%20reference%20to%20the%20airline%27s%20loss%20of%20flight%20MH370%20the%20previous%20year).

القسوة كانت مقصودة. الرحلة MH370 [اختفت من الرادار في 8 مارس 2014](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370#:~:text=disappeared%20from%20radar%20on%208%20March%202014)، و239 شخص على متنها تم اعتبارهم متوفّين في النهاية ولم يتم تحديد موقع الحطام قطعيًا. والرحلة MH17 [أُسقطت بصاروخ أرض-جو Buk 9M38 على يد قوات مدعومة روسيًا في 17 يوليو 2014](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17#:~:text=shot%20down%20by%20Russian%2Dbacked%20forces%20with%20a%20Buk%209M38%20surface%2Dto%2Dair%20missile%20on%2017%20July%202014)، وقتلت جميع الـ 298 على متنها. وضع "Plane Not Found" على الصفحة الرئيسية للشركة كان استخدامًا لأسوأ سنة في تاريخها كسلاح — ونشره على كل عميل بيحاول يوصل للموقع.

وجه التهديد. المجموعة [نشرت على تويتر إنها هتقوم قريبًا بتسريب "بعض الغنائم اللي لقيناها على سيرفرات www.malaysiaairlines.com"](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=Going%20to%20dump%20some%20loot%20found%20on%20www.malaysiaairlines.com%20servers%20soon)، بل نشرت لقطة شاشة زعمت إنها تظهر خطط سفر ركاب. لشركة طيران غارقة أصلًا في سنة من الكوارث، مجرد فكرة إن بيانات العملاء ضاعت كانت كارثة من نوعها.

## كيف حصل ده: دفتر العناوين مش المبنى

![فن مفاهيمي ملوّن وحيوي لمشغّل لوحة تحكم مستقبلية يسحب كابل مضيء من المقبس الصحيح ويوصّله بمقبس مزيّف، وتيارات من حركة الضوء تنحرف عن المدرج نحو محطة مزيفة، بألوان الأزرق الكهربائي والبرتقالي الدافئ](../../assets/the-malaysia-airlines-dns-hijack-02-dns-redirect.jpg)

هنا قلب الموضوع التقني، والسبب اللي بيخلي القضية دي تنتمي لسلسلة أمن الدومينات مش للاختراقات العادية.

بيان ماليزيا إيرلاينز نفسه، اللي تكرّر في كل التغطيات، فرّق بين الأمرين بدقة: [ماليزيا إيرلاينز تؤكد إن نظام DNS الخاص بيها اتعرض للاختراق حيث يتم تحويل المستخدمين لموقع هاكر لمّا بيكتبوا عنوان www.malaysiaairlines.com](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20confirms%20that%20its%20Domain%20Name%20System%20%28DNS%29%20has%20been%20compromised%20where%20users%20are%20re%2Ddirected%20to%20a%20hacker%20website). الشركة أصرّت على إن [الموقع لم يتعرض للاختراق وهذه العطلة المؤقتة لا تؤثر على الحجوزات وبيانات المستخدمين لا تزال آمنة](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20assures%20customers%20and%20clients%20that%20its%20website%20was%20not%20hacked%20and%20this%20temporary%20glitch%20does%20not%20affect%20their%20bookings%20and%20that%20user%20data%20remains%20secured)، وأضافت إن [سيرفرات الويب سليمة](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=Malaysia%20Airlines%27%20Web%20servers%20are%20intact).

الاتنين كانوا صح في نفس الوقت: الموقع اتدمّر، *والسيرفرات بخير*. المهاجمون ما احتاجوش للسيرفرات أصلًا. زي ما وصفته The Register، [سجلات DNS للموقع اتعبث بيها عشان مستخدمين يتحوّلوا لموقع تحت سيطرة هاكر](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=DNS%20records%20for%20the%20site%20have%20been%20interfered%20with%20so%20that%20surfers%20are%20being%20redirected%20to%20a%20hacker%2Dcontrolled%20site). غيّروا سجل دفتر العناوين، مش المبنى اللي بيشير إليه. حتى الاستهزاء اتخبّى في البيانات الوصفية: بحث Whois وقتها كشف إن [ISIS will prevail](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html#:~:text=ISIS%20will%20prevail) مكتوبة كعنوان للموقع.

فين كان دفتر العناوين ده؟ عند الـ registrar. دومين شركة الطيران [يبدو إنه مسجّل عند Web Commerce Communications Limited — المعروفة بـ Webnic — واللي عندها مكاتب في سنغافورة وماليزيا والصين](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=registered%20with%20Web%20Commerce%20Communications%20Limited%20%2D%20a.k.a.%20Webnic%20%2D%20which%20has%20offices%20in%20Singapore%2C%20Malaysia%20and%20China). الاسم ده مهم، لأن Webnic كانت على وشك تصبح مشهورة بالأسباب الغلط.

بعد شهر واحد بس، نفس الـ registrar ده كان في مركز حادثة أضخم بكتير. زي ما Brian Krebs أفاد، المهاجمون [سيطروا على Webnic.cc، الـ registrar الماليزي اللي بيخدم الدومينين دول وأكتر من 600,000 دومين تاني](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=seized%20control%20over%20Webnic.cc%2C%20the%20Malaysian%20registrar%20that%20serves%20both%20domains%20and%20600%2C000%20others)، ثم [استغلّوا وصولهم لـ Webnic.cc لتغيير سجلات DNS](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=leverage%20their%20access%20at%20Webnic.cc%20to%20alter%20the%20domain%20name%20system%20%28DNS%29%20records) لـ **Lenovo** و**Google Vietnam**. الآلية، زي ما Krebs أفاد، كانت [ثغرة command injection في Webnic.cc لتحميل rootkit](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) — وصول دائم لنفس النظام اللي بيتحكم في مكان مئات الآلاف من الدومينات.

مش محتاج تخترق Google عشان تحوّل google.com.vn. ومش محتاج تخترق شركة طيران عشان تحوّل صفحتها الرئيسية. كل اللي عليك تعمله هو اختراق الطبقة اللي *بتمتلك الإجابة* على "فين الدومين ده بيعيش؟" — حساب الـ registrar وسجلات الـ DNS وراءه. الطبقة دي موجودة خارج المحيط اللي معظم الشركات فعلًا بتحميه.

## التأثير والاستجابة

بالنسبة للشركة، الضرر كان في السمعة والعمليات أكتر من سرقة البيانات. العملاء اللي حاولوا يحجزوا أو يسجّلوا دخولهم صِدموا بالتشويه. عناوين الأخبار حول العالم ربطت "ماليزيا إيرلاينز" بـ"اختُرقت" — علامة تجارية في أزمة أصلًا، بقت مرتبطة بسحلية بتسخر من طائرتها الضايعة.

الشركة اتحرّكت للسيطرة على الموقف بالطريقة الوحيدة الممكنة لاحتواء اختطاف DNS: بالتعامل مع الطبقة اللي اتعرضت للاختراق. قالت إنها [حلّت المشكلة مع مزوّد الخدمة](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=resolved%20the%20issue%20with%20its%20service%20provider) وإن [النظام متوقع يرجع بالكامل خلال 22 ساعة](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=The%20system%20is%20expected%20to%20be%20fully%20recovered%20within%2022%20hours). الجدول الزمني ده في حد ذاته دليل على طبيعة الـ DNS: حتى بعد تصحيح السجلات، الإجابة الغلط ممكن تفضل متخزّنة في كاشات حول العالم لحد ما تنتهي مدتها. الاختطاف سريع في التنفيذ وبطيء في الإزالة الكاملة.

على موضوع تهديد تسريب البيانات، الشركة تمسّكت بموقفها — الحجوزات ما اتأثرتش، بيانات المستخدمين محمية — والتسريب الكارثي اللي المجموعة اتبجّحت بيه ما حصلش كما وُصف. لكن "إحنا اتعرضناش لاختراق حقيقي، المهاجمون فقط تحكّموا في هويتنا العامة كلها ليوم تقريبًا" ده رسالة صعبة توصّلها للمسافرين. للعميل اللي بيبص على "404 — الطائرة مش موجودة"، الفرق بين اختراق السيرفر واختطاف DNS مش واضح. الموقع كان هو الشركة. وليوم كامل، الموقع كان بيخص حد تاني.

## اللي القضية دي بتعلّمه عن الـ DNS كبابك الرئيسي

اختطاف ماليزيا إيرلاينز درس نموذجي بالظبط لأن *ما حدثش أي اختراق* بالمعنى التقليدي. الدروس المستخلصة تنطبق على تقريبًا كل مؤسسة على الإنترنت:

1. **الدومين بتاعك نقطة فشل واحدة مش بتتحكم فيها لوحدك.** الـ registrar بيمتلك السجل الرئيسي لفين اسمك بيشير. لو أمان حسابه — أو برنامجه — فشل، سيرفراتك المحصّنة بشكل كامل مش مهمة. Webnic أثبتت ده مرتين في شهر واحد: مع شركة طيران ومع Google وLenovo.

2. **اختطاف الـ DNS مش محتاج تتعرض للاختراق أنت.** المهاجمون حوّلوا دفتر العناوين مش المبنى. الدفاعات اللي بتراقب سيرفراتك وكودك وشبكتك ممكن تفوّتها هجوم بيحصل بالكامل على مستوى التسمية.

3. **اقفل السجلات اللي ممكن تحرّك اسمك.** Registry Lock وأقفال مستوى الـ registrar موجودة تحديدًا لمنع التغييرات غير المصرح بيها على سجلات DNS والـ nameserver — بيضيفوا خطوة يدوية خارج النطاق قبل ما أي حد يقدر يعيد توجيه الدومين بتاعك. لدومين عالي القيمة، دي مش اختيارية.

4. **اعتمد DNSSEC و2FA عند الـ registrar.** تأمين قوي لحساب الـ registrar وتوقيع DNSSEC على المنطقة بيرفعوا تكلفة عملية تغيير السجلات الصامتة بالظبط زي اللي شوّهت ماليزيا إيرلاينز.

5. **الاسترداد أبطأ من الهجوم.** الـ TTLs والكاشات العالمية بتعني إن الاختطاف بيستمر بعد الإصلاح. خطّط لفترة التنظيف مش بس للتصحيح.

الملخص المزعج: معظم الشركات بتحرس المبنى وتسيب ورقة لاصقة على الباب بتقول للناس أي مبنى يدخلوا. غيّر الورقة، وأنت كده نقلت الشركة.

## زاوية Namefi

![رسم توضيحي ملوّن لملكية دومين قابلة للتحقق ومقاومة للتلاعب — بطاقة دومين محمية بدرع أخضر ورمز Namefi أخضر واستمرارية DNS](../../assets/the-malaysia-airlines-dns-hijack-03-namefi-angle.jpg)

اختطاف ماليزيا إيرلاينز، في جوهره، سؤال عن *مين مسموحله يغيّر مكان ما بيشير إليه الاسم* — وبسهولة قد أيه الصلاحية دي ممكن تتسرق بهدوء على مستوى الـ registrar. الهجوم ما هزمش التشفير ولا كسر قاعدة بيانات. هزم نظام التحكم الناعم المعتمد على الحسابات اللي بيحدد الحقيقة الأهم عن أي دومين: فين بيحلّ.

[Namefi](https://namefi.io) مبني على فكرة إن ملكية الدومين والتحكم فيه لازم يتصرّفوا كأصل قابل للتحقق وأصيل على الإنترنت بدل ما يكونوا مجرد بند في قاعدة بيانات registrar ممكن حساب مخترق واحد يعيد كتابته. الملكية المُرمَّزة بتحوّل سؤال "مين بيتحكم في الدومين ده، وهل التحكم ده انتقل للتو؟" لسؤال قابل للتدقيق وواضح التلاعب، مع الحفاظ على التوافق مع الـ DNS. الدفاع ضد الاختطاف مش بس كلمات مرور أقوى — ده بيخلي التغييرات غير المصرح بيها *مرئية وقابلة للإثبات* بدل ما تكون صامتة.

ماليزيا إيرلاينز ما خسرتش سيرفراتها. خسرت الإجابة على سؤال واحد — *فين بيشير الاسم ده؟* — لمدة يوم تقريبًا. الطائرة ما اتلقيتش. الموقع كان ما ينفعش يتضيّع كمان. الدرس من Domain Mayday إن دفتر العناوين جزء من المحيط الأمني، واليوم اللي بتنسى فيه ده هو اليوم اللي سحلية في طربوش تسكن على بابك الرئيسي.

## المصادر والقراءة الإضافية

- TechCrunch — [Malaysia Airlines Site Hacked By Lizard Squad](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/)
- The Register — [Lizard Squad threatens Malaysia Airlines with data dump](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/)
- BankInfoSecurity — [Malaysia Airlines Website Hacked](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833)
- Computerworld — [Malaysia Airlines claim DNS hijacked, site not hacked, but attackers threaten data dump](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html)
- Infosecurity Magazine — [Malaysia Airlines Site Back Up as Hackers Threaten Data Dump](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/)
- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- ABC News — [Malaysia Airlines Hit by Lizard Squad Hack Attack](https://abcnews.go.com/Technology/malaysia-airlines-hit-lizard-squad-hack-attack/story?id=28489244)
- NBC News — [Lizard Squad Claims It Hacked Malaysia Airlines Website](https://www.nbcnews.com/storyline/isis-terror/lizard-squad-claims-it-hacked-malaysia-airlines-website-n293461)
- IT Security Guru — [Lizard Squad hijacks Malaysia Airline DNS](https://www.itsecurityguru.org/2015/01/26/lizard-squad-hijacks-malaysia-airline-dns/)
- Wikipedia — [Lizard Squad](https://en.wikipedia.org/wiki/Lizard_Squad)
- Wikipedia — [Malaysia Airlines Flight 370](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370)
- Wikipedia — [Malaysia Airlines Flight 17](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17)
