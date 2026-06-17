---
title: 'سرقة نطاق Perl.com: كيف تمت سرقة موطن مجتمع دام 30 عاماً بهدوء'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'في أواخر يناير 2021، تمت سرقة perl.com — الموطن الذي امتد لعقود لمجتمع برمجة Perl — عبر اختراق حساب على مستوى مسجل النطاقات، وتم نقله عبر الصين، وتوجيهه إلى عنوان IP مرتبط ببرمجيات خبيثة، وعرضه للبيع مقابل 190 ألف دولار. إليك كيف حدث ذلك، وكيف تم استرداده، وما يعلمنا إياه عن أمان حسابات مسجلي النطاقات.'
keywords: ['perl.com', 'سرقة نطاق perl.com', 'اختطاف النطاقات', 'سرقة النطاقات', 'اختراق حساب مسجل النطاقات', 'الهندسة الاجتماعية', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'اختطاف DNS', 'أمان النطاقات', 'الاستيلاء على الحسابات', 'BizCN']
---

بعض النطاقات عبارة عن بنية تحتية تصادف أنها تبدو كاسم. يُعد **perl.com** واحداً منها. إنه ليس أصلاً تسويقياً أو علامة تجارية بناها شخص ما في العام الماضي — بل هو قطعة من أثاث الإنترنت عاش حولها مجتمع برمجة Perl منذ الأيام الأولى للويب، وهو الباب الأمامي الرسمي للوثائق، والمقالات، والواجهة العامة للغة.

لذا عندما أصبح هذا الباب الأمامي ملكاً لشخص آخر فجأة في صباح يوم 27 يناير 2021، لم يكن ذلك تلاعباً ذكياً بالعلامة التجارية أو عملية بيع متفاوض عليها. لقد كانت سرقة. تم انتزاع النطاق بهدوء من سيطرة مالكه الشرعي قبل أشهر، وتنقل بين مسجلي النطاقات، وتم توجيهه إلى عنوان IP له تاريخ في توزيع البرمجيات الخبيثة. وقد عبّر مشغلو شبكة المجتمع عن ذلك بصراحة: ["تم اختطاف النطاق perl.com هذا الصباح، وهو يشير حالياً إلى موقع اصطفاف (parking site)."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

هذه هي قصة الحلقة 19 (EP19) من سلسلتنا Domain Mayday: كيف سُرق نطاق مجتمعي يبلغ من العمر ثلاثين عاماً دون أن يخترق أي شخص خادماً واحداً، وما تطلبه الأمر لاستعادته.

## نطاق محفوظ منذ أوائل التسعينيات

لفهم السرقة، يجب أن تفهم مدى اعتيادية الإعداد — وكيف كانت هذه الاعتيادية هي نقطة الضعف.

لم يكن perl.com محفوظاً داخل خزنة مؤسسية محصنة. بل كان محفوظاً بالطريقة التي تُحفظ بها معظم النطاقات طويلة الأمد: بواسطة شخص واحد موثوق به، لدى مسجل نطاقات رئيسي، ويتم تجديده عاماً بعد عام دون أي دراما. وصف محرر الموقع، brian d foy، لاحقاً هذا التسلسل في تقريره الخاص عن الحادثة: ["تم تسجيل هذا النطاق في أوائل التسعينيات، وأُعطي Tom Christiansen السيطرة عليه بعد فترة وجيزة، واستمر أساساً في دفع رسوم التسجيل."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

هذا هو الملف التعريفي الكامل لشريحة ضخمة من أهم الأسماء على الإنترنت. شخص، وتسجيل دخول إلى مسجل النطاقات، وثلاثة عقود من دفع الفاتورة بهدوء. إنه يعمل بشكل مثالي — حتى يصبح حساب مسجل النطاقات نفسه هو الهدف.

## 27 يناير 2021: الباب الأمامي يغير أقفاله

![فن تصوري ملون وزاهي للافتة خشبية مجتمعية عمرها عقود يتم فكها بهدوء من عمودها ليلاً وحملها بعيداً، مقابل سماء مضيئة تشبه لوحة الدوائر الإلكترونية](../../assets/the-perl-com-domain-theft-01-theft.jpg)

جاء التحذير العام الأول من الأشخاص الذين يديرون البنية التحتية لمجتمع Perl. نشرت مدونة مركز عمليات الشبكة (NOC) الخاصة بـ Perl أن النطاق قد تم اختطافه "هذا الصباح" وأنه يشير الآن إلى مكان لا ينبغي أن يشير إليه. وما هو أسوأ من مجرد صفحة اصطفاف بسيطة، حذر المشغلون من أنه ["توجد بعض الإشارات التي تدل على أنه قد يكون مرتبطاً بمواقع قامت بتوزيع برمجيات خبيثة في الماضي."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)

أثار brian d foy الأمر علناً في نفس اليوم. وأكدت التقارير حول الحادثة التوقيت بعبارات واضحة: ["في 27 يناير، غرّد مؤلف برمجة Perl ومحرر Perl.com، brian d foy، بأن نطاق perl.com تم تسجيله فجأة باسم شخص آخر."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

كانت استجابة المجتمع سريعة وعملية. فبينما بدأت أعمال الاسترداد، قام مركز عمليات الشبكة بإعادة توجيه القراء إلى نسخة احتياطية: ["إذا كنت تبحث عن المحتوى، يمكنك زيارة perldotcom.perl.org."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) لقد اختفى الاسم الرسمي، لكن المحتوى ظل قابلاً للوصول.

## ما كان على المحك: عنوان IP مرتبط ببرمجيات خبيثة

تتناسب خطورة النطاق المسروق مع حجم الثقة التي يحملها — وكان perl.com يحمل الكثير منها. ملايين المطورين، والدروس التعليمية، وأدوات CPAN، والروابط القديمة عبر الويب كلها تشير إليه. من يسيطر على الاسم يسيطر على الوجهة التي تؤول إليها كل هذه الثقة.

ولم يقم المالك الجديد بتوجيهه إلى مكان غير ضار. كما وثق موقع BleepingComputer: ["تمت سرقة اسم النطاق perl.com وهو يشير الآن إلى عنوان IP مرتبط بحملات برمجيات خبيثة."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

كانت البصمات الفنية محددة. تمت إعادة كتابة سجلات DNS بحيث ["تم تغيير عناوين IP المعينة للنطاق من 151.101.2.132 إلى عنوان IP الخاص بـ Google Cloud وهو 35.186.238[.]101."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) وكانت لتلك الوجهة ماضٍ: ["في عام 2019، كان عنوان IP 35.186.238[.]101 مرتبطاً بنطاق يوزع ملفاً تنفيذياً خبيثاً لبرمجية الفدية Locky البائدة الآن."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

اجمع هاتين الحقيقتين وسيصبح الخطر واضحاً. اسم يثق به المطورون بشكل عفوي، يتحول فجأة إلى عنوان IP له تاريخ مع البرمجيات الخبيثة، وهو إعداد شبه مثالي لخداع نفس الجمهور التقني والواعي أمنياً والذي يصعب خداعه عادةً.

## كيف حدث ذلك: حساب مسجل النطاقات، وليس الخادم

![فن تصوري ملون وزاهي لورقة مزورة لتغيير الملكية يتم تمريرها عبر مكتب خدمة التسجيل، مع ختم رسمي يضيء باللون الأحمر، وأوراق تتطاير في ضوء النيون — بدون شعارات علامات تجارية](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

إليك الجزء الذي يجعل من هذه الحادثة حالة دراسية مثالية بدلاً من مجرد حاشية سفلية: لم يقم أحد باختراق خادم الويب الخاص بـ perl.com، ولم يقم أحد بتخمين كلمة مرور DNS. حدث الهجوم في طبقة أعلى، عند مسجل النطاقات — الشركة التي تحتفظ بالسجل الرسمي لمن يملك الاسم.

في تحليله بعد الحادثة، وصف brian d foy النظرية المطروحة بشكل مباشر: ["نعتقد أنه كان هناك هجوم هندسة اجتماعية على Network Solutions، تضمن وثائق مزيفة وما إلى ذلك."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) وصاغت الصحافة الأمر بنفس الطريقة: كانت السرقة ["هجوم هندسة اجتماعية أقنع مسجل النطاقات Network Solutions بتعديل سجلات النطاق دون تفويض صحيح."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)

التفصيل الأكثر إثارة للقلق هو الجدول الزمني. لم يلاحظ المجتمع الأمر *إلا* في شهر يناير، لكن الاختراق الفعلي كان أقدم من ذلك بكثير. العمل الجنائي الذي كشفه محامي النطاقات John Berryhill أرجع التاريخ الحقيقي إلى أشهر مضت؛ وكما تسجل حسابات الحادثة على perl.com، ["قدم John Berryhill بعض الأعمال الجنائية الرقمية على تويتر والتي أظهرت أن الاختراق حدث بالفعل في سبتمبر."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) أكد موقع SecurityWeek صبر المهاجم: ["الهجوم، كما يوضح، حدث في سبتمبر 2020"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020) — أي قبل أربعة أشهر تقريباً من أن يرى أي شخص آثاره.

لماذا هذا الانتظار الطويل؟ لأن قواعد نقل النطاقات تكافئ الصبر. ["تمنع ICANN نقل النطاق لمدة 60 يوماً بعد تحديث معلومات الاتصال."](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) المهاجم الذي يستولي بهدوء على حساب مسجل نطاقات في سبتمبر لا يمكنه اختطاف النطاق فوراً — لذا جلس وانتظر مرور الوقت، وقام بخطوته بمجرد انتهاء فترة القفل.

عندما تحركوا أخيراً، قاموا بغسل الاسم عبر مسجلي نطاقات وحدود جغرافية لجعل عملية الاسترداد أصعب. وثّقت صحيفة The Register القفزة الأولى: ["تم نقل النطاق إلى مسجل النطاقات BizCN في ديسمبر، ولكن لم يتم تغيير خوادم الأسماء (nameservers)."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) تتبع موقع BleepingComputer المسار نفسه جغرافياً: النطاق ["سُرق في سبتمبر 2020 عندما كان لدى Network Solutions، وتم نقله إلى مسجل في الصين في يوم عيد الميلاد"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day) قبل القفزة النهائية في يناير، عندما ["تم نقل النطاق مرة أخرى في يناير إلى مسجل آخر، وهو Key Systems, GmbH."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

وبعد ذلك حاولوا صرف الأرباح. مع نقل الاسم حديثاً، ["حاول المسجل غير المصرح له بيع النطاق مقابل 190 ألف دولار في سوق النطاقات Afternic."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) أصل مجتمعي يبلغ من العمر ثلاثين عاماً، يُسرق عبر المعاملات الورقية، ويُعرض للبيع كأنه أثاث مستعمل.

## الاسترداد: أسابيع من المعاملات الورقية للتراجع عن معاملات ورقية

نفس الآلية التي سمحت بحدوث السرقة — مسجلو النطاقات، والسجلات (registries)، وسجلات الملكية — كانت أيضاً المسار الوحيد لاستعادته. لم يكن هناك خادم لإعادة تأمينه ولا تصحيح (patch) ليتم نشره. كان على شخص ما أن *يُثبت*، من خلال سلسلة مسجلي النطاقات والسجل، أن Tom Christiansen هو المالك الحقيقي وأن "المالك" الجديد كان محتالاً.

بدأ هذا العمل في غضون أيام. بحلول 30 يناير، أفاد مركز عمليات شبكة Perl أن ["Network Solutions تعمل مع Tom Christiansen، المسجل الشرعي، على استرداد نطاق Perl.com."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.) هذا الجهد ["أدى في النهاية إلى إعادة النطاق إلى مالكه السابق، Tom Christiansen، في أوائل فبراير."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

لكن "استرداد" لم تعنِ "إصلاح". يلتقط تأطير brian d foy الخاص كلاً من الارتياح والعمل غير المكتمل: ["عاد نطاق Perl.com إلى يدي Tom Christiansen ونحن نعمل على التحديثات الأمنية المختلفة حتى لا يحدث هذا مرة أخرى."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) ولأن النطاق كان يشير إلى عنوان IP مرتبط ببرمجيات خبيثة، فقد وضعته منتجات الأمان في القائمة السوداء وكانت بعض مُحللات DNS (DNS resolvers) تقوم بإغراقه (sinkholing). حتى بعد تصحيح سجل الملكية، استغرق الأمر أسابيع إضافية ليتم الوثوق بالاسم مرة أخرى عبر أنظمة السمعة على الإنترنت — وهو ذيل طويل امتد بالمحنة الكاملة لحوالي شهرين.

كان العنوان الرئيسي، بكلمات foy، مقتضباً تقريباً: ["لقد فقدنا السيطرة على نطاق Perl.com لمدة أسبوع."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) أسبوع من السرقة النشطة؛ أشهر من الاختراق الكامن قبلها؛ وأسابيع من التنظيف بعدها.

## ما يعلمنا إياه هذا عن أمان حساب مسجل النطاقات والنطاقات المحتفظ بها لفترة طويلة

تُعد سرقة perl.com مفيدة جداً تحديداً لأنه لم يحدث أي شيء غريب. جرّدها من التفاصيل وستجد أن الدروس عامة بشكل مزعج:

1. **حساب مسجل النطاقات الخاص بك هو جوهرة التاج الحقيقية.** الجميع يحصنون خوادمهم ومضيف DNS الخاص بهم. لكن *سجل ملكية* النطاق موجود لدى مسجل النطاقات، وغالباً ما يكون هذا الحساب محمياً بما لا يزيد عن كلمة مرور وفريق دعم يمكن إقناعه بإجراء تغييرات. تمت سرقة perl.com من هناك، وليس من الأطراف (edge).

2. **الهندسة الاجتماعية تتفوق على الضوابط الفنية.** لا يوجد استغلال لثغرة (exploit)، ولا توجد برمجيات خبيثة من جانب الضحية — فقط ["وثائق مزيفة وما إلى ذلك"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.) كانت مقنعة بما يكفي لنقل سجل حقيقي. لا تساعد المصادقة الثنائية على تسجيل الدخول الخاص بك إذا كان بالإمكان إقناع *البشر* في شركة تسجيل النطاقات بتجاوزها.

3. **النطاقات المحتفظ بها لفترة طويلة هي أهداف سهلة.** يميل الاسم الذي تم تسجيله في أوائل التسعينيات ويُجدد تلقائياً لمدة ثلاثين عاماً إلى تجميع معلومات اتصال قديمة، ونقطة فشل بشري واحدة، ومالك لا يراقب سجل WHOIS يومياً. الاستقرار الهادئ هو بالضبط ما سمح باختراق حدث في سبتمبر أن يمر دون أن يلاحظه أحد حتى يناير.

4. **قواعد النقل سلاح ذو حدين.** أصبح قفل النقل لمدة 60 يوماً بعد التحديث، والذي يُفترض أن *يحمي* الملاك، غرفة انتظار للمهاجم. الصبر بالإضافة إلى غسيل النطاق عبر مسجلي النطاقات والحدود الجغرافية حوّل الإصلاح السريع إلى عملية استرداد متعددة الأطراف استغرقت أسابيع.

5. **الاسترداد أبطأ من السرقة.** استغرقت سرقة الاسم وثيقة مزورة. بينما استغرق استرداده مسجلين، وسجل نطاقات رئيسي، وأدلة المالك الشرعي، ثم أسابيع من إعادة بناء السمعة مع قوائم الحظر ومُحللات DNS. السرقة هي معاملة واحدة؛ أما الاسترداد فمعاملات متعددة.

الخلاصة القاتمة: بالنسبة لنطاق مثل perl.com، فإن قوة كلمة المرور الخاصة بك أقل أهمية من إمكانية خداع مسجل النطاقات لتجاهلها.

## منظور Namefi

![رسم توضيحي ملون لملكية نطاق يمكن التحقق منها ومقاومة للتلاعب — بطاقة نطاق مؤمنة بدرع أخضر، ورمز Namefi المميز الأخضر، واستمرارية DNS](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

اعتمدت كل خطوة في سرقة perl.com على نقطة ضعف واحدة: الملكية كانت عبارة عن *سجل في حساب شخص آخر*، قابلة للتغيير من قبل أي شخص يمكنه إقناع وكيل الدعم المناسب. لم يحتج المهاجم أبداً إلى مفاتيح المالك. بل احتاج إلى ثقة مسجل النطاقات — وكانت قطعة ورق مزورة كافية لنقل أصل يبلغ من العمر ثلاثين عاماً عبر الكوكب وعرضه للبيع.

تم بناء [Namefi](https://namefi.io) على فرضية معاكسة: وهي أن ملكية النطاق يجب أن تكون قابلة للتحقق منها تشفيرياً ويصعب إعادة كتابتها بصمت. من خلال تمثيل التحكم في النطاق كأصل مميز على البلوكشين يظل متوافقاً مع DNS، فإن الإجابة الرسمية على سؤال "من يملك هذا الاسم؟" تتوقف عن كونها سطراً قابلاً للتعديل في قاعدة بيانات مسجل النطاقات يمكن لمكالمة هاتفية مقنعة أن تقلبه. تصبح عمليات النقل أحداثاً مُوقعة وقابلة للتدقيق بدلاً من معاملات ورقية في المكاتب الخلفية — ولن يكون هناك باب خلفي هادئ يمكن أن تمر عبره "تغييرات الملكية" الاحتيالية.

لم يكن هذا ليجعل perl.com غير قابل للسرقة بين عشية وضحاها؛ فمسجلو النطاقات والسجلات (registries) لا يزالون جزءاً من السلسلة. لكنه يهاجم نمط الفشل الدقيق الذي حدد هذه الحادثة — الفجوة بين *الدفع مقابل اسم لمدة ثلاثين عاماً* و*القدرة على إثبات أنه ملكك بطريقة مقاومة للتلاعب* — ويقلص النافذة التي يمكن خلالها غسل النطاق المسروق قبل أن يتمكن أي شخص من الاعتراض.

استعاد perl.com بابه الأمامي. السؤال الأصعب الذي تتركه هذه الحادثة وراءها هو لماذا كان القفل في يوم من الأيام شيئاً يمكن لغريب يحمل أوراقاً مناسبة أن يفتحه.

## المصادر وقراءات إضافية

- مركز عمليات شبكة Perl — [اختطاف perl.com](https://log.perl.org/2021/01/perlcom-hijacked.html)
- perl.com (بواسطة brian d foy) — [اختطاف Perl.com](https://www.perl.com/article/the-hijacking-of-perl-com/)
- BleepingComputer — [سرقة نطاق Perl.com، ويستخدم الآن عنوان IP مرتبط ببرمجيات خبيثة](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/)
- The Register — [إلقاء اللوم في سرقة Perl.com على هجوم هندسة اجتماعية](https://www.theregister.com/2021/03/02/perl_domain_theft/)
- SecurityWeek — [القراصنة سيطروا على نطاق Perl.com لأشهر قبل اختطافه](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/)
- Security Affairs — [المهاجمون استولوا على نطاق Perl.com في سبتمبر 2020](https://securityaffairs.com/115208/cyber-crime/perl-com-hijack-september.html)
- The Daily Swig (PortSwigger) — [سرقة النطاق الخاص بموقع البرمجة الشهير Perl.com في "عملية اختراق"](https://portswigger.net/daily-swig/domain-for-popular-programming-website-perl-com-stolen-in-hack)
- Slashdot — [سرقة نطاق Perl.com، ويستخدم الآن عنوان IP لحملات برمجيات خبيثة سابقة](https://developers.slashdot.org/story/21/01/31/0220252/perlcom-domain-stolen-now-using-ip-address-of-past-malware-campaigns)
- INCIBE-CERT — [تم اختطاف نطاق perl.com](https://www.incibe.es/en/incibe-cert/publications/cybersecurity-highlights/perlcom-domain-has-been-hijacked)
- GIGAZINE — [محررو Perl.com يكشفون الحقيقة حول قضية اختطاف نطاق Perl.com](https://gigazine.net/gsc_news/en/20210303-hijacking-of-perl-com/)