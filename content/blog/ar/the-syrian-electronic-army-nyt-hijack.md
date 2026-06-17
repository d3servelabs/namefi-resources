---
title: 'نداء استغاثة النطاقات الحلقة 10: كيف أسقط الجيش السوري الإلكتروني موقع NYTimes.com عبر موزع تعرض للتصيد الاحتيالي'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'في 27 أغسطس 2013، قام الجيش السوري الإلكتروني باختراق موزع لشركة Melbourne IT عبر التصيد الاحتيالي، وأعاد كتابة سجلات DNS لنطاقات nytimes.com وTwitter، مما أدى إلى توقف موقع نيويورك تايمز عن العمل لساعات. نظرة متعمقة حول كيف أصبحت الحلقة الأضعف في سلسلة مسجلي النطاقات بمثابة انهيار للباب الأمامي للصحيفة — وما الذي كانت ستقوم أقفال السجل بتغييره.'
keywords: ['اختراق nytimes.com', 'الجيش السوري الإلكتروني', 'melbourne it', 'اختطاف dns', 'اختطاف النطاقات', 'أمان مسجل النطاقات', 'تصيد الموزعين', 'قفل السجل', 'سجلات dns', 'هجوم خادم أسماء النطاقات', 'twitter dns 2013', 'أمان النطاقات', 'serverupdateprohibited']
---

اسم النطاق لأي صحيفة هو بابها الأمامي. عندما تكتب `nytimes.com`، فإنك تثق في سلسلة غير مرئية — سجل النطاقات (registry)، ومسجل النطاقات (registrar)، وأحياناً موزع (reseller) يعمل تحت هذا المسجل — لتوجيهك إلى غرفة الأخبار الحقيقية وليس إلى أي مكان آخر. في الأيام العادية، لا تفكر أبداً في هذه السلسلة. ولكن في 27 أغسطس 2013، انكسرت هذه السلسلة، ووصل ملايين القراء إلى الباب الأمامي لصحيفة *The New York Times* (نيويورك تايمز) ليجدوا أنه قد تم استبداله بباب شخص آخر.

هذا "الشخص الآخر" كان **الجيش السوري الإلكتروني** (SEA)، وهو مجموعة قراصنة موالية للأسد قضت عام 2013 في استهداف وسائل الإعلام الغربية. في هذه المرة، لم يقوموا بتشويه مقال واحد أو اختراق نظام إدارة المحتوى. بل ذهبوا إلى مستوى أعمق — إلى **سجلات DNS** التي تحدد إلى أين يوجه النطاق — ولساعات قليلة، امتلكوا عنوان أحد أكثر المواقع الإخبارية قراءة على وجه الأرض.

## النطاق هو الباب الأمامي، وهذا الباب يحتوي على قفل لا تتحكم فيه

عندما تقوم شركة مثل *The New York Times* بتسجيل نطاق، فإن السجل المرجعي لـ "من يملك هذا وإلى أين يوجه" يكمن في سجل النطاقات (بالنسبة لـ `.com`، فهو Verisign) ويتم إدارته من خلال **مسجل النطاقات** (registrar). يبيع كبار المسجلين أيضاً من خلال **الموزعين** (resellers) — وهي شركات أصغر تعيد بيع خدمات النطاقات وتمتلك بيانات تسجيل دخول خاصة بها إلى أنظمة المسجل.

هذه الطبقات المتعددة مريحة، لكنها أيضاً سلسلة من الثقة حيث تحدد الحلقة الأضعف مستوى الأمان للسلسلة بأكملها. إذا تمكن المهاجم من المصادقة كـ *أي شخص* في تلك السلسلة — مسجل النطاق، أو موظفي المسجل، أو الموزع — فإن أنظمة المسجل ستعامله، بحكم تصميمها، على أنه المالك الشرعي. لخص الرئيس التنفيذي لشركة Melbourne IT حالة الفشل في جملة واحدة مدمرة قائلاً لوكالة أسوشيتد برس: ["لقد دخلوا من الباب الأمامي،"](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door) بعبارة أخرى، إذا كان لديك اسم مستخدم وكلمة مرور صالحين، يفترض النظام أنك المالك المعتمد. هذه هي المشكلة بأكملها باختصار.

## 27 أغسطس 2013: اليوم الذي وجه فيه موقع nytimes.com إلى مكان آخر

![Vivid colorful concept art of a giant newspaper front-door sign being unbolted and re-hung over a different doorway, glowing red routing arrows pulling a crowd of readers off course into a dark side alley](../../assets/the-syrian-electronic-army-nyt-hijack-01-hijack.jpg)

في وقت متأخر من بعد ظهر يوم الثلاثاء، توقف القراء عن القدرة على الوصول إلى صحيفة *التايمز*. أفادت شبكة ABC News أن [موقع نيويورك تايمز قد "أظلم بالنسبة لبعض المستخدمين،"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=gone%20dark%20for%20some%20users) وأكدت الصحيفة [أن موقعها كان "غير متاح للقراء بعد ظهر الثلاثاء"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=unavailable%20to%20readers%20on%20Tuesday%20afternoon) في أعقاب هجوم على مسجل نطاقاتها. لم يكن هذا مجرد عطل عابر. فقد ذكرت صحيفة كريستيان ساينس مونيتور أن [الزوار "استُقبلوا بشاشات متصفح فارغة لعدة ساعات يوم الثلاثاء،"](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=greeted%20with%20blank%20browser%20screens%20for%20several%20hours) وما زاد الطين بلة، [كانت هذه "المرة الثانية خلال هذا الشهر"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=second%20time%20this%20month) التي يتعطل فيها الموقع.

ما حدث فعلياً كان **اختطاف DNS** على مستوى مسجل النطاقات. تمكن المهاجمون من الوصول إلى السجلات التي تترجم `nytimes.com` إلى عنوان IP وقاموا بإعادة كتابتها. وفقاً لرواية ويكيبيديا للحادث، [تمت إعادة توجيه DNS الخاص بـ `NYTimes.com` إلى صفحة تعرض رسالة 'تم الاختراق بواسطة الجيش السوري الإلكتروني' (Hacked by SEA)"](https://en.wikipedia.org/wiki/Syrian_Electronic_Army#:~:text=had%20its%20DNS%20redirected%20to%20a%20page%20that%20displayed%20the%20message). لقد تم خلع الباب الأمامي وإعادة تعليقه فوق مدخل مختلف.

لم تكن صحيفة *التايمز* هي الهدف الوحيد في هذا الحساب. وجد موقع TechCrunch، في تغطيته للأحداث في الوقت الفعلي، أن [كل من "خوادم أسماء نيويورك تايمز وتويتر يبدو أنه تم تسجيلها من خلال مسجل النطاقات Melbourne IT،"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=name%20servers%20appear%20to%20have%20been%20registered%20through%20the%20registrar%20Melbourne%20IT) وأن [نطاق `twimg.com`، "الذي يقدم صور تويتر والصور الرمزية، يظهر أيضاً تغييرات توجه إلى خوادم يبدو أنها مملوكة لـ SEA."](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=which%20serves%20up%20Twitter%20images%20and%20avatars) نجا موقع تويتر الرئيسي إلى حد كبير، لكن نطاق الصور الخاص به اهتز — بدرجة كافية لكي يرى بعض المستخدمين صوراً معطلة لفترة وجيزة.

## التأثير: ساعات من الظلام، وإعادة توجيه لا يمكنك الوثوق بها

بالنسبة لمؤسسة إخبارية، لا يُقاس أثر الاختطاف بخسارة مشاهدات الصفحة فحسب، بل يُقاس بالثقة. طوال مدة الانقطاع، كان أي شخص يصل إلى `nytimes.com` يتم توجيهه بواسطة المهاجم. أخبر مارك فرونس، رئيس قسم المعلومات في *التايمز*، الموظفين أن الانقطاع ["كان نتيجة لهجوم خارجي خبيث من قبل الجيش السوري الإلكتروني أو شخص يحاول جاهداً أن يقلدهم"](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=was%20the%20result%20of%20a%20malicious%20external%20attack) — وحذر الموظفين من توخي الحذر مع البريد الإلكتروني بينما كان النطاق خارج سيطرة الصحيفة.

فكر فيما يمكن أن يتيحه سجل DNS المختطف فعلياً. يتحكم المهاجم في المكان الذي يوجه إليه الاسم، مما يعني أنه يمكنه عرض صفحة مشوهة (كما فعلوا)، ولكن يمكنه بنفس السهولة عرض صفحة تسجيل دخول وهمية مقنعة، أو حصد بيانات الاعتماد، أو اعتراض حركة المرور. التشويه يكون صاخباً وواضحاً. لكن اختطاف DNS *الهادئ* أخطر بكثير — ونفس نقطة الضعف تتيح كلا الأمرين. تورط نطاق Huffington Post UK في نفس الحادث، مما يؤكد أن هذا كان اختراقاً لحساب مسجل نطاقات، وليس مجرد مزحة عابرة ضد غرفة أخبار واحدة.

## كيف حدث ذلك: تصيد الموزع وليس الصحيفة

![Vivid colorful concept art of a phished golden key sliding into a glowing control-room door labeled with abstract routing dials, a shadowy hand rewriting a luminous ledger of address arrows while a fake email envelope dissolves into the lock](../../assets/the-syrian-electronic-army-nyt-hijack-02-reseller-phish.jpg)

إليك الجزء الذي يستحق التوقف عنده: لم يضطر الجيش السوري الإلكتروني (SEA) أبداً إلى اختراق أنظمة *The New York Times*. لم يلمسوا أبداً خوادم الصحيفة أو نظام إدارة المحتوى الخاص بها. بل هاجموا السلسلة الموجودة *أسفل* مسجل النطاقات.

كانت نقطة الدخول عبارة عن **رسالة بريد إلكتروني احتيالية موجهة (spear-phishing email)** أُرسلت إلى موزع لشركة Melbourne IT مقره الولايات المتحدة. وكما أفاد موقع The Next Web، فإن [شركة Melbourne IT "أكدت أن SEA استخدمت تكتيكات التصيد الاحتيالي للحصول على تفاصيل تسجيل الدخول"](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter#:~:text=used%20phishing%20tactics%20to%20get%20hold%20of%20the%20log) — حيث تم خداع موظفي الموزع لتسليم بيانات اعتماد البريد الإلكتروني الخاصة بهم، ثم قام المهاجمون بتفتيش صناديق البريد تلك بحثاً عن بيانات تسجيل الدخول إلى المسجل. ومن هناك، كان الأمر بسيطاً: [تم استخدام بيانات الاعتماد "الخاصة بموزع لـ Melbourne IT (اسم المستخدم وكلمة المرور) للوصول إلى حساب الموزع على أنظمة Melbourne IT،"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=credentials%20of%20a%20Melbourne%20IT%20reseller) وبمجرد الدخول، [قام المهاجمون "بتغيير سجلات DNS لعدة أسماء نطاقات ... بما في ذلك تلك الخاصة بصحيفة *التايمز*."](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=changed%20the%20DNS%20records%20of%20several%20domain%20names)

كان تقرير TechCrunch صريحاً بالقدر نفسه: ["تم تغيير سجلات DNS لعدة أسماء نطاقات على حساب الموزع ذلك – بما في ذلك `nytimes.com`."](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=DNS%20records%20of%20several%20domain%20names%20on%20that%20reseller%20account%20were%20changed)

هذا التفاوت هو ما يجعل هجمات سلسلة مسجلي النطاقات جذابة للغاية. كان بإمكان *التايمز* تعزيز بنيتها التحتية لأقصى درجة ولم يكن ذلك ليحدث فرقاً، لأن الحساب الضعيف كان ينتمي إلى موزع طرف ثالث يبعد عدة خطوات عن غرفة الأخبار. كانت رسالة تصيد موجهة ضد عدد قليل من الموظفين في شركة صغيرة واحدة كافية لإعادة توجيه صحيفة يقرأها الملايين.

## الاستجابة وما بعد الكارثة

بمجرد أن أدركت شركة Melbourne IT ما حدث، كان العلاج مباشراً — وهذا يوضح مدى قابلية هذه الهجمات للتراجع *إذا كنت تتحكم في مسجل النطاقات*. أعادت الشركة الإعدادات الصحيحة: حيث [تراجعت عن سجلات DNS المتغيرة وقامت بـ "قفلها" ضد أي تغييرات أخرى](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=reverted%20the%20altered%20DNS%20records). قامت بتغيير كلمة المرور الخاصة بحساب الموزع المخترق وسحبت السجلات لتتبع الاختراق. واستعادت صحيفة *التايمز* خدمتها بحلول صباح الأربعاء.

لكن التفصيلة الأكثر إفادة في القصة بأكملها هي *سبب توقف الضرر عند هذا الحد*. بعض النطاقات الموجودة على نفس حساب الموزع لم تتأثر إطلاقاً — لأن أصحابها قاموا بتشغيل حماية أقوى. بكلمات شركة Melbourne IT نفسها، [بالنسبة "للأسماء بالغة الأهمية للمهام، نوصي أصحاب أسماء النطاقات بالاستفادة من ميزات قفل السجل الإضافية المتاحة من سجلات أسماء النطاقات بما في ذلك .com – بعض أسماء النطاقات المستهدفة على حساب الموزع كانت لديها ميزات القفل هذه نشطة وبالتالي لم تتأثر."](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=For%20mission%20critical%20names%20we%20recommend%20that%20domain%20name%20owners%20take%20advantage%20of%20additional%20registry%20lock)

يضع "قفل السجل" (registry lock) النطاق في حالة (يمكنك رؤيتها في WHOIS كعلامات مثل `serverUpdateProhibited`) حيث سيرفض سجل النطاقات إجراء أي تغييرات ما لم يتم اتباع عملية أكثر صرامة وخارج النطاق المعتاد (out-of-band). وكما لاحظ مراقبو صناعة النطاقات في ذلك الوقت، كانت سجلات تويتر تحمل بالضبط هذا النوع من [حالة قفل Verisign](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/#:~:text=serverUpdateProhibited). لا تكفي كلمة مرور مخترقة لموزع لكسر قفل السجل — وهذا الخيار التكويني الواحد هو الفاصل بين "التوقف لساعات" و"عدم التأثر إطلاقاً".

## ما يعلمنا إياه هذا عن سلاسل مسجلي النطاقات والموزعين، وأقفال السجلات

اختطاف 27 أغسطس هو حالة تعليمية شبه مثالية لأن كل حلقة في سلسلة الفشل مرئية للعيان.

1. **نطاقك آمن فقط بقدر أمان أضعف حساب يمكنه تغييره.** يشمل ذلك موظفي مسجل النطاقات الخاص بك وأي موزع تحتهم — وكلها أطراف لا تتحكم فيها بشكل مباشر. لم ترتكب صحيفة *التايمز* أي خطأ في خوادمها الخاصة؛ كان الاختراق بعيداً بعدة خطوات.
2. **التصيد الاحتيالي يتغلب على جدران الحماية.** لم يتم استخدام أي ثغرة معقدة أو غريبة. أدى بريد إلكتروني مزيف إلى مجموعة من موظفي الموزع إلى الحصول على بيانات اعتماد تعاملت معها أنظمة المسجل على أنها مصرح بها بالكامل. ["لقد دخلوا من الباب الأمامي."](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door)
3. **قفل السجل هو عنصر التحكم الذي أحدث فارقاً حقيقياً.** النطاقات ذات [ميزات قفل السجل الإضافية](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=additional%20registry%20lock%20features) "لم تتأثر بالتالي". بالنسبة لأي نطاق بالغ الأهمية للمهام، فإن قفل السجل (بالإضافة إلى قفل المسجل والمصادقة الثنائية 2FA على حساب المسجل) ليس مجرد تحصين اختياري — بل هو الحد الأدنى للأساسيات.
4. **تغييرات DNS قوية وسريعة.** إعادة كتابة واحدة لخوادم الأسماء (name-server) أو سجلات A تعيد توجيه علامة تجارية بأكملها على الفور. نطاق التدمير لحساب مخترق واحد يشمل كل نطاق يمكنه الوصول إليه.
5. **راقب سجلاتك الخاصة.** كانت مراقبة WHOIS و DNS لتنبه إلى التغيير غير المصرح به في غضون دقائق. كلما لاحظت تغييراً غير متوقع في خادم الأسماء في وقت أبكر، قل الانقطاع.

## منظور Namefi

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-syrian-electronic-army-nyt-hijack-03-namefi-angle.jpg)

كانت عملية اختطاف SEA، في جوهرها، مشكلة تتعلق بـ **الصلاحية** (authority). لم يستطع نظام المسجل التفريق بين المالك الحقيقي وشخص يحمل كلمة مرور تم الحصول عليها عبر التصيد، لذلك فعل ما صُمم من أجله وقَبِل التغيير. كل وسيلة دفاع نجحت — أقفال السجل، التأكيد خارج النطاق (out-of-band)، المراقبة الدقيقة — هي في الواقع طريقة لرفع مستوى التحقق من *إثبات* أن طلب التغيير يأتي حقاً من المالك.

تنطلق [Namefi](https://namefi.io) من هذا المنطلق بالذات: يجب أن تكون ملكية النطاق والتحكم فيه **قابلة للتحقق ومقاومة للتلاعب**، وليس مجرد كلمة مرور واحدة قابلة لإعادة الاستخدام تسبح في صندوق الوارد الخاص بأحد الموزعين. من خلال تمثيل ملكية النطاق كأصل قابل للتحقق مشفر على البلوكشين (on-chain) ومتوافق في نفس الوقت مع DNS، تجعل Namefi سؤال "من يُسمح له بتغيير هذا النطاق" سؤالاً بإجابة قوية وقابلة للتدقيق، بدلاً من الثقة الضمنية في أي شخص قام بتسجيل الدخول. تُصبح تغييرات التحكم إجراءات صريحة وموقعة مرتبطة بالمالك — أقرب إلى قفل السجل الذي تمتلك أنت مفتاحه، من كونه باباً أمامياً يمكن لأي شخص يملك كلمة المرور الصحيحة فتحه.

نطاق الصحيفة هو بابها الأمامي. الدرس المستفاد من 27 أغسطس 2013 هو أن أقوى قفل محكم لا ينفع إذا أمكن خداع شخص غريب على بعد عدة مبانٍ لتسليم نسخة من المفتاح. الحل هو جعل الملكية نفسها قابلة للإثبات — بحيث تتوقف عبارة "دخلوا من الباب الأمامي" عن كونها شيئاً يمكن لشخص غريب أن يقوله.

## المصادر وقراءات إضافية

- The Register — [نيويورك تايمز، ومختطفو نطاق تويتر 'دخلوا من الباب الأمامي'](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/)
- TechCrunch — [الجيش السوري الإلكتروني يخترق على ما يبدو سجلات DNS الخاصة بتويتر ونيويورك تايمز من خلال المسجل Melbourne IT](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/)
- ABC News — [اختراق موقع نيويورك تايمز، والجيش السوري الإلكتروني يتبنى العملية على ما يبدو](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043)
- Christian Science Monitor — [اختراق نيويورك تايمز، والجيش السوري الإلكتروني يتبنى العملية](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit)
- iTnews — [اختراق Melbourne IT يعيد توجيه قراء نيويورك تايمز وهافينغتون بوست](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935)
- The Next Web — [إليك كيف تم اختراق نيويورك تايمز وتويتر](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter)
- Domain Name Wire — [شركة Melbourne IT هي الحلقة الأضعف مع اختراق أسماء نطاقات تويتر ونيويورك تايمز](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/)
- Wikipedia — [الجيش السوري الإلكتروني](https://en.wikipedia.org/wiki/Syrian_Electronic_Army)
- NBC News — [مجموعة سورية تخترق تويتر ونيويورك تايمز](https://www.nbcnews.com/id/wbna52864470)
- Al Jazeera — [قراصنة سوريون يستهدفون موقع نيويورك تايمز](https://www.aljazeera.com/news/2013/8/28/syria-hackers-target-new-york-times-website)