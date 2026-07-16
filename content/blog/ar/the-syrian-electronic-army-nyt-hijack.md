---
title: 'Domain Mayday EP10: إزاي الجيش الإلكتروني السوري أوقع NYTimes.com من خلال موزع استضافة متصيَّد'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
draft: false
description: 'في 27 أغسطس 2013، نجح الجيش الإلكتروني السوري في تصيُّد موزع تابع لـ Melbourne IT، وعدَّل سجلات DNS لـ nytimes.com ونطاقات تويتر، وأوقع جريدة New York Times عن الإنترنت لساعات. رحلة عميقة في كيف أصبح الحلقة الأضعف في سلسلة المسجِّلين هو باب الفشل الأمامي لصحيفة كبرى — وماذا كان سيتغير لو كانت أقفال السجل مفعَّلة.'
keywords: ['اختراق nytimes.com', 'الجيش الإلكتروني السوري', 'melbourne it', 'اختطاف dns', 'اختطاف النطاق', 'أمان المسجِّل', 'تصيُّد الموزع', 'قفل السجل', 'سجلات dns', 'هجوم خادم أسماء النطاقات', 'dns تويتر 2013', 'أمان النطاق', 'serverupdateprohibited']
relatedArticles:
  - /ar/blog/the-fox-it-dns-hijack/
  - /ar/blog/the-lenovo-com-dns-hijack/
  - /ar/blog/the-godaddy-multi-year-breach/
  - /ar/blog/the-panix-com-domain-hijack/
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

اسم النطاق بالنسبة لأي صحيفة هو بابها الأمامي. لما بتكتب `nytimes.com`، بتثق في سلسلة غير مرئية — سجل نطاقات، ومسجِّل، وأحياناً موزع تابع لهذا المسجِّل — علشان توصلك لغرفة التحرير الحقيقية ومش حتة تانية. في الأيام العادية، ما بتفكرش في الموضوع ده خالص. بس في 27 أغسطس 2013، الحلقة اتكسرت، وملايين القراء اتجهوا لباب *New York Times* الأمامي لقوا حاجة تانية خالص.

"الحاجة التانية" دي كانت **الجيش الإلكتروني السوري** (SEA)، مجموعة هاكرز مؤيدة للأسد قضت عام 2013 في استهداف المنابر الإعلامية الغربية. المرة دي، ماعملوش تشويه لمقال أو اخترقوا نظام إدارة المحتوى. نزلوا مستوى أعمق — في **سجلات DNS** اللي بتحدد فين بيوجَّه النطاق — ولساعات قليلة امتلكوا عنوان واحدة من أكتر المواقع الإخبارية قراءة على الكوكب.

## النطاق هو الباب الأمامي، والباب الأمامي عنده قفل مش بتتحكم فيه

لما شركة زي *New York Times* بتسجِّل نطاقاً، [السجل](/ar/glossary/registry/) الرسمي بتاع "مين صاحبه وفين بيوجَّه" بيكون موجود عند سجل النطاقات (لـ `.com`، ده Verisign) وبيُدار من خلال **مسجِّل**. المسجِّلون الكبار بيبيعوا كمان من خلال **موزعين** — شركات أصغر بتعيد بيع خدمات النطاقات ومعاها تسجيل دخولها الخاص لأنظمة المسجِّل.

التقسيم ده مريح، بس في نفس الوقت سلسلة ثقة أضعف حلقاتها بتحدد مستوى أمان الكل. لو مهاجم قدر يثبت هويته بصفة *أي واحد* في الحلقة دي — صاحب النطاق، أو موظف المسجِّل، أو الموزع — أنظمة المسجِّل هتتعامل معاه على إنه المالك الشرعي. الرئيس التنفيذي لـ Melbourne IT بنفسه لخَّص مشكلة الفشل في جملة واحدة مدمِّرة: ["دخلوا من الباب الأمامي"](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door)، قالها لوكالة AP. لو عندك اسم مستخدم وكلمة مرور صحيحة، النظام بيفترض إنك المالك المعتمد. دي المشكلة بالكامل في جوزة.

## 27 أغسطس 2013: اليوم اللي بدأ فيه nytimes.com يشير لحتة تانية

![لوحة فنية ملونة حية لافتة الباب الأمامي لجريدة عملاقة يتم فكها وإعادة تعليقها على باب مختلف، مع أسهم توجيه حمراء متوهجة تجذب حشد من القراء بعيداً إلى زقاق مظلم](../../assets/the-syrian-electronic-army-nyt-hijack-01-hijack.jpg)

في وقت متأخر من ظهر الثلاثاء، القراء فجأة ما قدروش يوصلوا للـ *Times*. [موقع New York Times "اختفى عن بعض المستخدمين"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=gone%20dark%20for%20some%20users)، زي ما أفادت ABC News، والجريدة نفسها أكدت إن [موقعها "أصبح غير متاح للقراء مساء الثلاثاء"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=unavailable%20to%20readers%20on%20Tuesday%20afternoon) في أعقاب هجوم على مسجِّل النطاق الخاص بها. مكانتش انقطاعة عابرة. [الزوار "شافوا شاشات متصفح فاضية لساعات الثلاثاء"](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=greeted%20with%20blank%20browser%20screens%20for%20several%20hours)، كما أفادت Christian Science Monitor — وللأسف [كانت دي "المرة التانية في الشهر ده"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=second%20time%20this%20month) اللي بيتوقف فيها الموقع.

اللي حصل فعلياً كان **اختطاف DNS** على مستوى المسجِّل. المهاجمون وصلوا للسجلات اللي بتترجم `nytimes.com` ل[عنوان IP](/ar/glossary/ip-address/) وأعادوا كتابتها. طبقاً لما ذكرته ويكيبيديا في سرد الحادثة، [`NYTimes.com` "جُوِّلت سجلات DNS الخاصة بها إلى صفحة تعرض رسالة 'Hacked by SEA'"](https://en.wikipedia.org/wiki/Syrian_Electronic_Army#:~:text=had%20its%20DNS%20redirected%20to%20a%20page%20that%20displayed%20the%20message). الباب الأمامي اتعلَّق على بوابة مختلفة.

الـ *Times* ما كانتش الهدف الوحيد في الحساب ده. TechCrunch اللي كانت تغطي الخبر في الوقت الحقيقي اكتشفت إن [كلاً من "خوادم أسماء New York Times وتويتر يبدو إنها مسجَّلة من خلال المسجِّل Melbourne IT"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=name%20servers%20appear%20to%20have%20been%20registered%20through%20the%20registrar%20Melbourne%20IT)، وإن [نطاق `twimg.com`، "اللي بيخدم صور وأفتارات تويتر، كمان بيظهر تغييرات تشير لخوادم يبدو إنها مملوكة لـ SEA"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=which%20serves%20up%20Twitter%20images%20and%20avatars). الموقع الأساسي لتويتر نجا إلى حد بعيد، لكن نطاق الصور والأفتارات تزعزع — لدرجة إن بعض المستخدمين شافوا صور مكسورة لفترة وجيزة.

## التأثير: ساعات في الظلام، وإعادة توجيه ما تقدرش تثق فيها

بالنسبة لمؤسسة إخبارية، تكلفة الاختطاف مش بس في صفحات مشاهدة ضايعة. دي تكلفة ثقة. طول فترة الانقطاع، أي حد وصل لـ `nytimes.com` كان يُوجَّه من المهاجم. كبير مسؤولي المعلومات في الـ *Times*، Mark Frons، أخبر الموظفين بأن الاضطراب كان ["نتيجة هجوم خارجي خبيث من الجيش الإلكتروني السوري أو حد بيحاول بجد يتظاهر إنه هم"](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=was%20the%20result%20of%20a%20malicious%20external%20attack) — وحذَّر الموظفين من الحذر في التعامل مع الإيميل طول فترة خروج النطاق من أيدي الجريدة.

فكِّر في الأمور اللي بيتيحها سجل DNS مختطَف. المهاجم بيتحكم في مكان توجيه الاسم، يعني ممكن يعرض صفحة تشويه (وده اللي عملوه فعلاً)، لكن بنفس السهولة ممكن يعرض صفحة تسجيل دخول مزيفة مُقنِعة، أو يحصد بيانات اعتماد، أو يعترض الحركة. التشويه صاخب وواضح. الاختطاف *الهادئ* لـ DNS أخطر بكتير — ونفس الضعف بيتيح الاتنين. نطاق Huffington Post UK اتورط في نفس الحادثة، مما يؤكد إن ده كان اختراق لحساب المسجِّل، مش مزحة فردية على غرفة تحرير واحدة.

## إزاي حصل: صيِّد الموزع مش الصحيفة

![لوحة فنية ملونة حية لمفتاح ذهبي متصيَّد يندس في باب غرفة تحكم متوهجة عليها لوحات توجيه، وبيد في الظلام بتعيد كتابة دفتر عناوين مضيء بينما مظروف إيميل مزيف يذوب في القفل](../../assets/the-syrian-electronic-army-nyt-hijack-02-reseller-phish.jpg)

ده الجزء اللي محتاج تتوقف عنده: SEA ما احتاجوش أصلاً يخترقوا *New York Times*. ما لمسوش سيرفراتها ولا نظام إدارة المحتوى الخاص بها. هاجموا الحلقة اللي *تحت* المسجِّل.

نقطة الدخول كانت **إيميل تصيُّد موجَّه** أُرسل لموزع أمريكي تابع لـ Melbourne IT. زي ما أفادت The Next Web، [Melbourne IT "أكدت إن SEA استخدمت أساليب التصيُّد للحصول على بيانات تسجيل الدخول"](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter#:~:text=used%20phishing%20tactics%20to%20get%20hold%20of%20the%20log) — موظفو الموزع اتخدعوا وسلَّموا بيانات اعتماد إيميلهم، والمهاجمون بعدين فتَّشوا في صناديق البريد دي لجيبوا بيانات تسجيل الدخول للمسجِّل. من هناك بقى الأمر سهل: [بيانات الاعتماد "لموزع Melbourne IT (اسم المستخدم وكلمة المرور) استُخدمت للدخول على حساب موزع في أنظمة Melbourne IT"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=credentials%20of%20a%20Melbourne%20IT%20reseller)، وبعد ما دخلوا، [المهاجمون "غيَّروا سجلات DNS لعدة أسماء نطاقات ... منها سجلات الـ *Times*."](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=changed%20the%20DNS%20records%20of%20several%20domain%20names)

رواية TechCrunch مباشرة بنفس القدر: ["سجلات DNS لعدة أسماء نطاقات في حساب الموزع ده اتغيَّرت — منها `nytimes.com`."](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=DNS%20records%20of%20several%20domain%20names%20on%20that%20reseller%20account%20were%20changed)

دي هي اللاتماثلية اللي بتخلي هجمات سلسلة المسجِّل جذابة جداً. الـ *Times* كان ممكن تقوّي بنيتها التحتية قد ما تريد وما كانش هيفرق، لأن الحساب الضعيف كان بتاع موزع طرف تالت بعيد عن غرفة التحرير بخطوات كتير. إيميل تصيُّد موجَّه لعدد قليل من موظفي شركة صغيرة واحدة كان كفيل بإعادة توجيه جريدة بيقرأها ملايين.

## الاستجابة والتداعيات

لما Melbourne IT فهمت اللي حصل، التصحيح كان مباشراً — وده بيوضِّح إن الهجمات دي قابلة للعكس *لو كنت بتتحكم في المسجِّل*. الشركة رجَّعت الإعدادات الصحيحة: [أعادت سجلات DNS اللي اتغيَّرت و"قفَّلتها" لمنع أي تغيير تاني](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=reverted%20the%20altered%20DNS%20records). غيَّرت كلمة المرور على حساب الموزع اللي اتاخد منه، وشدَّت السجلات لتتبُّع الاختراق. الـ *Times* أعادت الخدمة بدري الأربعاء.

لكن أكتر تفصيلة تعليمية في القصة كلها هي *ليه التضرر وقف هناك*. بعض النطاقات في نفس حساب الموزع ما اتأثرتش خالص — لأن أصحابها كانوا شغَّلوا حماية أقوى. بكلام Melbourne IT بنفسها، [للأسماء "الحيوية للمهمة بنوصي بأن أصحاب النطاقات يستفيدوا من ميزات قفل السجل الإضافية المتاحة من سجلات النطاقات بما فيها .com — بعض أسماء النطاقات المستهدفة في حساب الموزع كانت عندها ميزات القفل دي مفعَّلة وبالتالي ما تأثرتش."](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=For%20mission%20critical%20names%20we%20recommend%20that%20domain%20name%20owners%20take%20advantage%20of%20additional%20registry%20lock)

[قفل السجل](/ar/glossary/registry-lock/) بيضع النطاق في حالة (شوفها في [WHOIS](/ar/glossary/whois/) كـ `serverUpdateProhibited`) بتخلي السجل يرفض أي تغييرات ما لم يُتَّبع إجراء أكتر صرامة خارج النطاق. زي ما لاحظ المتابعون لصناعة النطاقات في الوقت ده، سجلات تويتر كانت تحمل بالظبط نوع [حالة قفل Verisign](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/#:~:text=serverUpdateProhibited). كلمة المرور الموزع المتصيَّدة مش كفيلة بهزيمة قفل السجل — واختيار الإعداد الواحد ده هو الخط الفاصل بين "تعطَّل لساعات" و"ما تأثَّرش أبداً."

## إيه اللي بتعلِّمنا إياه سلاسل المسجِّل والموزع، وأقفال السجل

اختطاف 27 أغسطس حالة تعليمية شبه مثالية لأن كل حلقة في سلسلة الفشل واضحة للعيان.

1. **نطاقك بس بقدر أمان أضعف حساب يقدر يغيِّره.** ده بيشمل موظفي مسجِّلك وأي موزع تحتيهم — ما عندكش سيطرة مباشرة على أي منهم. الـ *Times* ما عملتش حاجة غلط في سيرفراتها الخاصة؛ الاختراق كان بعيداً بخطوات عدة.
2. **التصيُّد بيكسر الجدران النارية.** ما اتستخدمش أي استغلال غريب. إيميل مزيف لعدد من موظفي موزع أنتج بيانات اعتماد أنظمة المسجِّل تعاملت معاها على إنها مخوَّلة تماماً. ["دخلوا من الباب الأمامي."](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door)
3. **قفل السجل هو الضابط اللي فرَّق فعلاً.** النطاقات اللي عندها [ميزات قفل السجل الإضافية](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=additional%20registry%20lock%20features) "ما تأثرتش." لأي نطاق حيوي للمهمة، قفل السجل (مع قفل المسجِّل والمصادقة الثنائية على حساب المسجِّل) مش تقوية اختيارية — دي الخط الأساسي.
4. **تغييرات DNS قوية وسريعة.** إعادة كتابة واحدة لسجلات الخادم الاسمي أو سجلات A بيحوِّل علامة تجارية كاملة في ثوانٍ. نطاق التدمير من حساب واحد متخترَق هو كل نطاق يقدر يلمسه.
5. **راقب سجلاتك الخاصة.** مراقبة WHOIS وDNS كانت هتكشف التغيير غير المصرَّح به في دقائق. كل ما بكرت تلاحظ تغيير خادم اسمي غير متوقع، قل التوقف.

## زاوية Namefi

![رسم توضيحي ملوَّن لملكية نطاق قابلة للتحقق ومضادة للتلاعب — بطاقة نطاق مؤمَّنة بدرع أخضر ورمز Namefi أخضر واستمرارية DNS](../../assets/the-syrian-electronic-army-nyt-hijack-03-namefi-angle.jpg)

اختطاف SEA كان في جوهره مشكلة **سلطة**. نظام المسجِّل ما قدرش يميِّز بين المالك الحقيقي وشخص شايل كلمة مرور متصيَّدة، فعمل اللي اتبُني عليه وقبل التغيير. كل دفاع نجح — أقفال السجل، والتأكيد خارج النطاق، والمراقبة الدقيقة — هو في الأساس طريقة لرفع سقف *إثبات* إن طلب التغيير جاي فعلاً من المالك.

[Namefi](https://namefi.io) بتنطلق من هذه الفكرة بالظبط: [ملكية النطاق](/ar/glossary/domain-ownership/) والتحكم فيه لازم يكونوا **قابلَين للتحقق ومضادَّين للتلاعب**، مش كلمة مرور واحدة معاد استخدامها بتطوف في صندوق بريد موزع. من خلال تمثيل ملكية النطاق كأصل قابل للتحقق بشكل مشفَّر على البلوكشين ومتوافق مع DNS، Namefi بتحوِّل سؤال "مين مسموح له بتغيير النطاق ده" لسؤال عنده جواب قوي وقابل للتدقيق بدلاً من ثقة ضمنية في أي حد دخل السستم. تغييرات التحكم بتبقى إجراءات صريحة موقَّعة مربوطة بالمالك — أقرب لقفل سجل معاك مفتاحه منه لباب أمامي أي حد عنده كلمة المرور الصح يقدر يفتحه.

نطاق الجريدة هو بابها الأمامي. درس 27 أغسطس 2013 هو إن أقوى قفل ممكن ما ينفعش لو حد بعيد عنك بكذا مبنى اتخدع وسلَّم نسخة من المفتاح. الحل هو تثبيت الملكية نفسها كدليل لا جدال فيه — علشان "دخلوا من الباب الأمامي" تبقى جملة ما ينفعش لأي غريب يقولها.

## المصادر وقراءة إضافية

- The Register — [New York Times, Twitter domain hijackers 'came in through front door'](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/)
- TechCrunch — [Syrian Electronic Army Apparently Hacks DNS Records Of Twitter, NYT Through Registrar Melbourne IT](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/)
- ABC News — [New York Times Website Hacked, Syrian Electronic Army Appears to Take Credit](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043)
- Christian Science Monitor — [New York Times hacked, Syrian Electronic Army takes credit](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit)
- iTnews — [Melbourne IT compromise redirects NY Times, HuffPo readers](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935)
- The Next Web — [Here's How the New York Times and Twitter Got Hacked](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter)
- Domain Name Wire — [Melbourne IT the weak link as Twitter and NY Times domain names compromised](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/)
- Wikipedia — [Syrian Electronic Army](https://en.wikipedia.org/wiki/Syrian_Electronic_Army)
- NBC News — [Syrian group hacks Twitter, New York Times](https://www.nbcnews.com/id/wbna52864470)
- Al Jazeera — [Syria hackers target New York Times website](https://www.aljazeera.com/news/2013/8/28/syria-hackers-target-new-york-times-website)
