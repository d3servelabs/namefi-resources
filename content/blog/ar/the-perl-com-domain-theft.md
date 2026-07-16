---
title: 'سرقة دومين Perl.com: كيف اتسرق بيت مجتمع عمره 30 سنة في صمت'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
description: 'في آخر يناير 2021، اتسرق perl.com — بيت مجتمع Perl البرمجي اللي عمره عقود — عن طريق اختراق حساب في موقع التسجيل، واتنقل لبرا من الصين، واتوجه لـ IP مرتبط ببرامج خبيثة، واتعرض للبيع بـ 190,000 دولار. دي حكاية إزاي حصل ده، وإزاي اتاسترد، وإيه اللي بيعلمنا إياه عن أمان حسابات التسجيل.'
keywords: ['perl.com', 'سرقة دومين perl.com', 'اختطاف دومين', 'سرقة دومين', 'اختراق حساب تسجيل', 'هندسة اجتماعية', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'اختطاف DNS', 'أمان الدومين', 'استيلاء على حساب', 'BizCN']
relatedArticles:
  - /ar/blog/the-panix-com-domain-hijack/
  - /ar/blog/the-lenovo-com-dns-hijack/
  - /ar/blog/the-fox-it-dns-hijack/
  - /ar/blog/the-godaddy-multi-year-breach/
  - /ar/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-basics/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/name-change-game-change/
relatedGlossary:
  - /ar/glossary/registrar/
  - /ar/glossary/dns/
  - /ar/glossary/icann/
  - /ar/glossary/registry/
  - /ar/glossary/tld/
---

في الدنيا في دومينات هي في الحقيقة بنية تحتية بتعمل في صورة اسم. **perl.com** واحدة منهم. مش مجرد أصل تسويقي أو براند اتعمل السنة اللي فاتت — ده قطعة من أثاث الإنترنت اللي مجتمع Perl البرمجي عايش حواليها من بداية الويب، الباب الأمامي الأساسي للتوثيق والمقالات والواجهة العامة للغة.

فلما في صباح 27 يناير 2021 الباب الأمامي ده فجأة اتملك من حد تاني، مكانش ده ذكاء في اللعب أو بيع منظم. كانت سرقة. الدومين اتسلخ بهدوء من يد صاحبه الأصلي قبل كده بشهور، واتنقل بين شركات التسجيل، واتوجه لـ IP عنده تاريخ في توزيع برامج خبيثة. مشغلي شبكة المجتمع قالوها صريحة: ["دومين perl.com اتخطف النهارده الصبح، ودلوقتي بيوجه لموقع انتظار (parking)."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

دي حكاية الحلقة EP19 في سلسلة Domain Mayday بتاعتنا: إزاي اتسرق دومين مجتمعي عمره تلاتين سنة من غير ما حد يكسر سيرفر واحد، وإيه اللي اتطلب لاسترداده.

## دومين محفوظ من أوائل التسعينيات

عشان تفهم السرقة، لازم تفهم إزاي كان الوضع عادي جداً — وإزاي العادية دي كانت هي نقطة الضعف.

perl.com مكانش محفوظ جوه خزينة شركة محصنة. كان محفوظ بالطريقة اللي بيتحفظ بيها معظم الدومينات القديمة: عند شخص واحد موثوق، في شركة تسجيل معروفة، بيتجدد سنة بعد سنة من غير أي مشاكل. محرر الموقع، brian d foy، وصف الوضع بعد الحادثة في روايته الخاصة: ["الدومين ده اتسجل في أوائل التسعينيات، اتدي التحكم فيه لـ Tom Christiansen بعدها بشوية، وأساساً ظل بيدفع رسوم التسجيل."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

ده هو نفس الوضع لنسبة كبيرة من أهم الأسماء على الإنترنت. شخص، ولوج لشركة تسجيل، وتلاتين سنة بيدفع الفاتورة بهدوء. بيشتغل كويس جداً — لحد لما حساب شركة التسجيل نفسه بيبقى هو الهدف.

## 27 يناير 2021: الباب الأمامي بيتغيير قفله

![فن تصوري ملون حيوي لعلامة مجتمع خشبية عتيقة بتتفك بهدوء من عمودها في الليل وبتتاخد، على خلفية سماء من لوحات دوائر إلكترونية متلألئة](../../assets/the-perl-com-domain-theft-01-theft.jpg)

أول إنذار عام جه من الناس اللي بتشغل بنية مجتمع Perl التحتية. مدونة Perl NOC (مركز عمليات الشبكة) نشرت إن الدومين اتخطف "الصبح" ودلوقتي بيوجه لمكان مش المفروض يوجه له. وأسوأ من مجرد صفحة انتظار، المشغلون حذروا إن ["في إشارات إن ممكن يكون له علاقة بمواقع وزعت برامج خبيثة في الماضي."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)

brian d foy رفع الموضوع علناً في نفس اليوم. التقارير عن الحادثة أكدت التوقيت بوضوح: ["في 27 يناير، كاتب Perl وتحرير Perl.com brian d foy تغرد إن دومين perl.com اتسجل فجأة باسم شخص تاني."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

استجابة المجتمع كانت سريعة وعملية. وبينما بدأ العمل على الاسترداد، قام الـ NOC بتوجيه القراء لنسخة احتياطية: ["لو بتدور على المحتوى، تقدر تزور perldotcom.perl.org."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) الاسم الأساسي راح، لكن المحتوى ظل متاح.

## إيه اللي كان في خطر: IP مرتبط ببرامج خبيثة

الدومين المسروق خطير بقدر الثقة اللي بيحملها — وperl.com كان محمل بثقة كتير. ملايين المطورين والدروس وأدوات CPAN والروابط القديمة على الويب كلها بتوجه ليه. اللي اتحكم في الاسم اتحكم فيما بتتحول ليه كل الثقة دي.

والمالك الجديد مش وجهه لمكان آمن. زي ما BleepingComputer وثق، ["دومين perl.com اتسرق ودلوقتي بيوجه لعنوان IP مرتبط بحملات برامج خبيثة."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

البصمات التقنية كانت محددة. سجلات DNS اتعدلت عشان ["عناوين الـ IP المخصصة للدومين اتغيرت من 151.101.2.132 لعنوان Google Cloud IP 35.186.238[.]101."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) الوجهة دي عندها ماضي: ["في 2019، عنوان IP 35.186.238[.]101 اتربط بدومين بيوزع برنامج برامج خبيثة لفدية Locky اللي بطل يشتغل دلوقتي."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

اجمع الحقيقتين دول والخطر بيبقى واضح. اسم المطورين بيثقوا فيه تلقائياً، فجأة بيوجه لـ IP عنده تاريخ برامج خبيثة، ده إعداد شبه مثالي لخداع نوع الجمهور التقني الواعي بالأمن اللي عادةً صعب تخدعه.

## إزاي حصل: حساب شركة التسجيل، مش السيرفر

![فن تصوري ملون حيوي لورقة نقل ملكية مزورة بتتمرر على مكتب خدمة السجل، خاتم ختم رسمي بيضيء باللون الأحمر، أوراق بتدور في ضوء النيون — من غير أي شعارات تجارية](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

دي هي الجزء اللي بيخلي الحادثة دي حالة دراسية مش مجرد هامش: محدش اخترق سيرفر الويب بتاع perl.com، ومحدش خمن كلمة سر الـ DNS. الهجوم حصل على طبقة أعلى، عند شركة التسجيل — الشركة اللي بتحتفظ بالسجل الرسمي لمن يملك الاسم.

في تحليله للحادثة، brian d foy وصف النظرية الأساسية مباشرة: ["بنفتكر إن كان في هجوم هندسة اجتماعية على Network Solutions، بما فيه وثائق مزورة وما شابه ذلك."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) الصحافة صاغتها بنفس الطريقة: السرقة كانت ["هجوم هندسة اجتماعية أقنع شركة التسجيل Network Solutions بتغيير سجلات الدومين من غير تفويض صحيح."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)

التفصيلة الأكتر إزعاجاً هي الجدول الزمني. المجتمع *لاحظ* في يناير بس، لكن الاختراق الفعلي كان أقدم بكتير. العمل الجنائي اللي كشفه محامي الدومين John Berryhill رجع التاريخ الفعلي لشهور قبل كده؛ زي ما سجلات perl.com بتوثق، ["John Berryhill قدم تحليل جنائي على تويتر أثبت إن الاختراق حصل فعلاً في سبتمبر."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) SecurityWeek أكدت صبر المهاجم: ["الهجوم، بيشرح، حصل في سبتمبر 2020"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020) — حوالي أربع شهور قبل ما حد شاف التأثيرات.

ليه الانتظار الطويل؟ لأن قواعد نقل الدومين بتكافئ الصبر. ["ICANN بيحظر نقل الدومين لمدة 60 يوم بعد تحديث معلومات الاتصال."](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) مهاجم استولى بهدوء على حساب شركة التسجيل في سبتمبر مقدرش يحرك الدومين على طول — فقعد عليه، خلى العداد يعدي، وعمل خطوته لما القفل انتهى.

لما تحرك أخيراً، غسل الاسم عبر شركات تسجيل وحدود عشان يصعب الاسترداد. The Register وثق أول قفزة: ["الدومين اتنقل لشركة تسجيل BizCN في ديسمبر، لكن الـ nameservers ما اتغيرتش."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) BleepingComputer تتبع نفس المسار جغرافياً: الدومين ["اتسرق في سبتمبر 2020 وهو في Network Solutions، واتنقل لشركة تسجيل في الصين يوم الكريسماس"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day) قبل القفزة الأخيرة في يناير، لما ["الدومين اتنقل تاني في يناير لشركة تسجيل تانية، Key Systems, GmbH."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

وبعدين حاولوا يصرفوه. وبعد ما الاسم اتنقل لمكانه الجديد، ["المسجل غير المصرح له حاول يبيع الدومين بـ 190,000 دولار على سوق الدومينات Afternic."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) أصل مجتمعي عمره تلاتين سنة، اتسرق بالورق، معروض للبيع زي أثاث مستعمل.

## الاسترداد: أسابيع من الأوراق عشان تلغي الأوراق

نفس الآلية اللي خلت السرقة تحصل — شركات التسجيل و[السجل](/ar/glossary/registry/)ات وسجلات الملكية — كانت هي الطريق الوحيد للرجوع. مكانش في سيرفر يتأمن من جديد ولا patch يتطبق. كان لازم حد *يثبت*، عبر سلسلة شركة التسجيل والسجل، إن Tom Christiansen هو المالك الحقيقي والـ"مالك" الجديد محتال.

الشغل ده بدأ في خلال أيام. في 30 يناير، Perl NOC أفادت إن ["Network Solutions بتشتغل مع Tom Christiansen، المسجل الشرعي، على استرداد دومين Perl.com."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.) الضغط ["أدى في النهاية لاستعادة الدومين لمالكه السابق، Tom Christiansen، في أوائل فبراير."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

لكن "اتاسترد" ما معناهاش "اتصلح." صياغة brian d foy الخاصة بتجمع الارتياح والشغل غير المكتمل: ["دومين Perl.com رجع في إيدين Tom Christiansen وبنشتغل على التحديثات الأمنية المختلفة عشان ده ما يحصلش تاني."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) لأن الدومين كان بيوجه لـ IP مرتبط ببرامج خبيثة، المنتجات الأمنية كانت حطته على القائمة السوداء وبعض محللات الـ DNS كانت بتحوله. حتى بعد ما سجل السجل اتصح، اخد أسابيع إضافية عشان الاسم يتبع مرة تانية عبر أنظمة السمعة على الإنترنت — ذيل طويل مد المحنة بالكامل لحوالي شهرين.

العنوان الرئيسي، بكلمات foy، كان هادي تقريباً: ["لمدة أسبوع فقدنا التحكم في دومين Perl.com."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) أسبوع سرقة نشطة؛ شهور اختراق كامن قبلها؛ أسابيع تنظيف بعدها.

## إيه اللي بيعلمنا إياه عن أمان حسابات التسجيل والدومينات القديمة

سرقة perl.com مفيدة جداً بالضبط لأن مفيش حاجة غريبة حصلت. لو قلصناها لجوهرها، الدروس مزعجة في عموميتها:

1. **حساب شركة التسجيل بتاعك هو التاج الحقيقي.** الكل بيحصن سيرفراته ومزود الـ DNS بتاعه. لكن *سجل ملكية* الدومين عايش في شركة التسجيل، وده الحساب اللي غالباً بيتحمي بأكتر شوية من كلمة سر وفريق دعم ممكن يتقنع بتغييرات. perl.com اتسرق من هناك، مش من الحافة.

2. **الهندسة الاجتماعية بتتغلب على الضوابط التقنية.** مفيش استغلال، مفيش برامج خبيثة على جهة الضحية — بس ["وثائق مزورة وما شابه ذلك"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.) مقنعة كفاية عشان تحرك سجل حقيقي. التحقق الثنائي على لوجينك الشخصي مش بيساعد لو *البشر* في شركة التسجيل ممكن يتقنعوا يتجاوزوه.

3. **الدومينات القديمة أهداف سهلة.** اسم اتسجل في أوائل التسعينيات واتجدد تلقائياً لتلاتين سنة بيتراكم عنده معلومات اتصال قديمة، ونقطة فشل بشرية واحدة، وصاحبه مش بيراقب سجل [WHOIS](/ar/glossary/whois/) كل يوم. الاستقرار الهادئ بالضبط هو اللي خلى اختراق سبتمبر يعدي من غير ما حد يلاحظ لحد يناير.

4. **قواعد النقل مزدوجة الاتجاه.** [قفل النقل](/ar/glossary/transfer-lock/) الـ 60 يوم بعد التحديث اللي المفروض *يحمي* المالكين اتحول لغرفة انتظار المهاجم. الصبر زائد غسيل الاسم عبر شركات التسجيل والحدود حول التصحيح السريع لاسترداد متعدد الأطراف ومتعدد الأسابيع.

5. **الاسترداد أبطأ من السرقة.** سرقة الاسم احتاجت وثيقة مزورة. استرداده احتاج شركات تسجيل وسجل ودليل المالك الشرعي، وبعدين أسابيع لإعادة بناء السمعة مع قوائم الحظر والمحللات. السرقة معاملة واحدة؛ الإعادة معاملات كتير.

الملخص المحزن: بالنسبة لدومين زي perl.com، قوة كلمة السر بتاعتك أقل أهمية من إمكانية خداع شركة التسجيل عشان تتجاهلها.

## زاوية Namefi

![رسم توضيحي ملون لملكية دومين قابلة للتحقق ومقاومة للتلاعب — بطاقة دومين محمية بدرع أخضر وتوكن Namefi أخضر واستمرارية DNS](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

كل خطوة في سرقة perl.com دارت حول نقطة ضعف واحدة: الملكية كانت *سجل في حساب حد تاني*، قابل للتغيير من أي شخص يقدر يقنع الموظف المناسب. المهاجم ما احتاجش مفاتيح المالك. احتاج ثقة شركة التسجيل — وورقة مزورة كانت كافية عشان تنقل أصل عمره تلاتين سنة عبر الكوكب وتعرضه للبيع.

[Namefi](https://namefi.io) اتبنى على الفرضية المعاكسة: إن ملكية الدومين المفروض تكون قابلة للتحقق تشفيرياً وصعبة التعديل السري. بتمثيل التحكم في الدومين كأصل مرمز على السلسلة يظل متوافق مع DNS، الإجابة الموثوقة لـ"مين يملك الاسم ده؟" بتوقف كونها سطر قابل للتغيير في قاعدة بيانات شركة تسجيل ممكن مكالمة هاتفية مقنعة تقلبه. عمليات النقل بتبقى أحداث موقعة وقابلة للمراجعة بدلاً من أوراق مكتبية خلفية — و"تغيير الملكية" الاحتيالي مالوش باب هادي يدخل منه.

ما كانش هيخلي perl.com مستحيل السرقة من يوم لليوم؛ شركات التسجيل والسجلات لسة جزء من السلسلة. لكنه بيهاجم نفس طريقة الفشل اللي حددت الحادثة دي بالضبط — الفجوة بين *دفع ثمن اسم لتلاتين سنة* و*القدرة على إثبات، بطريقة مقاومة للتلاعب، إنه بتاعك* — وبيضيق الفترة اللي فيها ممكن يتغسل دومين مسروق قبل ما حد يعترض.

perl.com رجعتله بابه الأمامي. السؤال الأصعب اللي الحادثة دي تسيبه ورايها هو: ليه القفل كان في يوم من الأيام حاجة غريب عنده الورق المناسب يقدر يفتحه؟

## المصادر وقراءة إضافية

- The Perl NOC — [perl.com اتخطف](https://log.perl.org/2021/01/perlcom-hijacked.html)
- perl.com (brian d foy) — [اختطاف Perl.com](https://www.perl.com/article/the-hijacking-of-perl-com/)
- BleepingComputer — [دومين Perl.com اتسرق، دلوقتي بيستخدم عنوان IP مرتبط ببرامج خبيثة](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/)
- The Register — [سرقة Perl.com بتتحمل على هجوم هندسة اجتماعية](https://www.theregister.com/2021/03/02/perl_domain_theft/)
- SecurityWeek — [الهاكرز تحكموا في دومين Perl.com لشهور قبل الاختطاف](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/)
- Security Affairs — [المهاجمون استولوا على دومين Perl.com في سبتمبر 2020](https://securityaffairs.com/115208/cyber-crime/perl-com-hijack-september.html)
- The Daily Swig (PortSwigger) — [دومين موقع البرمجة الشهير Perl.com اتسرق في 'اختراق'](https://portswigger.net/daily-swig/domain-for-popular-programming-website-perl-com-stolen-in-hack)
- Slashdot — [دومين Perl.com اتسرق، دلوقتي بيستخدم عنوان IP من حملات برامج خبيثة سابقة](https://developers.slashdot.org/story/21/01/31/0220252/perlcom-domain-stolen-now-using-ip-address-of-past-malware-campaigns)
- INCIBE-CERT — [دومين perl.com اتخطف](https://www.incibe.es/en/incibe-cert/publications/cybersecurity-highlights/perlcom-domain-has-been-hijacked)
- GIGAZINE — [محرري Perl.com بيحكوا الحقيقة عن قضية اختطاف دومين Perl.com](https://gigazine.net/gsc_news/en/20210303-hijacking-of-perl-com/)
