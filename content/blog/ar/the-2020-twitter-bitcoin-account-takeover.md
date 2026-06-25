---
title: 'Domain Mayday EP03: اختراق حسابات تويتر بالبيتكوين عام 2020'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'في 15 يوليو 2020، تمكّن مهاجمون من اختراق تويتر عن طريق مكالمة تليفونية، واستولوا على حسابات موثّقة لأوباما وبايدن وماسك وجيتس وآبل وأوبر، ونفّذوا عملية احتيال بالبيتكوين جمعوا فيها نحو 118 ألف دولار. تحليل معمّق لكيفية سرقة هوية رقمية، وما يمكن تعلّمه عن امتلاك اسم على الإنترنت.'
keywords: ['اختراق تويتر 2020', 'احتيال بيتكوين تويتر', 'جراهام إيفان كلارك', 'vishing', 'التصيد الصوتي', 'الهندسة الاجتماعية', 'الاستيلاء على الحسابات', 'أمن الهوية الرقمية', 'اختطاف الحسابات الموثّقة', 'أداة إدارة تويتر', 'agent tool', 'مخاطر داخلية', 'أمن النطاقات', 'تقرير ny dfs تويتر']
---

لساعات قليلة في ظهيرة أحد أيام الأربعاء، بدأت أكثر الأصوات موثوقية على الإنترنت كلها تقول الشيء ذاته: أرسل لي بيتكوين وهأبعتهولك ضعف.

باراك أوباما قالها. جو بايدن قالها. إيلون ماسك قالها. بيل جيتس وجيف بيزوس وكانيي ويست وآبل وأوبر — الحسابات الموثّقة بالعلامة الزرقاء، اللي مئات الملايين من الناس اتعودوا يصدّقوها — كلها نشرت نفس عملية الاحتيال البدائية بالعملات الرقمية، بنفس الكلام تقريبًا. ما حدّ من دول كتب حرف واحد. *الحسابات* هي اللي كتبت، لأن حد تاني كان شايل المفاتيح.

دي **Domain Mayday EP03**. الحلقتين الأوليين كانتا عن الأسماء — مين يمتلكها ومين ممكن ياخدها. الحلقة دي عن نفس السؤال بس بشكل مختلف. اسم تويتر، والشارة الموثّقة، واسم النطاق — كل واحد فيهم ادّعاء بهوية معيّنة بيصدّقه الناس. وفي 15 يوليو 2020، أثبت المهاجمون إن الأمر ما بيحتاجش كتير عشان تسطو على الادّعاء ده — مش بمالوير أو ثغرات zero-day، بل بمكالمة تليفونية.

## الثقة اللي بتسكن في اسم المستخدم

الحساب الموثّق هو اختصار للثقة. لما `@BarackObama` بيتويت، مش بتتحقق إنه هو بالفعل؛ الاسم مع الشارة *هو* التحقق. الاختصار ده له قيمة هائلة — وهشاشة هائلة كمان، لأن كل الثقة بتتراكم على الحساب، بينما التحكم في الحساب ممكن يكون في مكان تاني خالص.

الموضوع نفس هيكل اسم النطاق. `whitehouse.gov` موثوق فيه مش لأن كل زائر بيفحص سلسلة الشهادات، لكن لأن الاسم نفسه بيحمل السلطة. تتحكم في الاسم ده — عند شركة التسجيل، في إعدادات DNS، في لوحة الإدارة — وهتورث كل الثقة اللي الناس ضختها فيه على طول، سواء كان إبتداءً بتاعتك أو لأ.

اختراق تويتر 2020 هو أوضح مثال عندنا على الفجوة دي بين *الثقة* و*التحكم*. الجهاز المالي التنظيمي في نيويورك، اللي حقّق في القضية لأن شركات عملات مشفّرة خاضعة للرقابة كانت من الضحايا، صرّح بصراحة: الهجوم كان "[قصة تحذيرية عن الأضرار الجسيمة اللي ممكن يسببها حتى مجرمو الإنترنت غير المتطورين](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20is%20a%20cautionary%20tale%20about%20the%20extraordinary%20damage%20that%20can%20be%20caused%20even%20by%20unsophisticated%20cybercriminals)."

## 15 يوليو 2020: الاستيلاء

![فن مفاهيمي ملوّن ومشرق لمفتاح رئيسي واحد مضيء يفتح جدارًا ضخمًا من الشارات الزرقاء الموثّقة المتماثلة، كل شارة بتنفتح بالتسلسل](../../assets/the-2020-twitter-bitcoin-account-takeover-01-takeover.jpg)

الأمر حصل بسرعة وفي وضح النهار. وفق ما وثّقته ويكيبيديا، "[في 15 يوليو 2020، بين الساعة 20:00 و22:00 بتوقيت UTC، اُخترق 130 حسابًا رفيع المستوى على تويتر](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=On%20July%2015%2C%202020%2C%20between%2020%3A00%20and%2022%3A00%20UTC%2C%20130%20high%2Dprofile%20Twitter%20accounts%20were%20compromised)."

تقرير قسم الخدمات المالية في نيويورك (DFS) يوضّح التسلسل. المهاجمون بدأوا بالعملات المشفّرة أوّلًا: "[المخترقون تلاعبوا في البداية بحسابات تويتر المرتبطة بشركات وأفراد معروفين في عالم العملات المشفّرة](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20first%20manipulated%20Twitter%20accounts%20connected%20to%20well%2Dknown%20cryptocurrency%20companies%20and%20individuals)"، بزرع رسائل مباشرة وتغريدات تشير ل[محفظة](/ar/glossary/wallet/) بيتكوين. ثم صعّدوا: "[المخترقون رفعوا الرهانات بشكل كبير واستهدفوا حسابات موثّقة بملايين المتابعين](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20then%20raised%20the%20stakes%20significantly%20and%20targeted%20verified%20Twitter%20accounts%20with%20millions%20of%20followers)."

قائمة الحسابات المتضررة تبدو كقائمة مدعوين لأكثر الحسابات ثقةً على المنصة. ويكيبيديا تذكر إن "[الحسابات المخترقة تضمّنت حسابات شخصيات بارزة كباراك أوباما وجو بايدن وبيل جيتس وجيف بيزوس... وشركات كآبل وأوبر وCash App](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=well%2Dknown%20individuals%20such%20as%20Barack%20Obama%2C%20Joe%20Biden%2C%20Bill%20Gates%2C%20Jeff%20Bezos)."

الرسالة كانت متطابقة وسخيفة البساطة. من حساب آبل، كما وثّقته ويكيبيديا: "[نحن نعطي المجتمع حقّه. نحن ندعم البيتكوين ونؤمن إنك لازم تدعمه كمان! كل بيتكوين يُرسَل لعناويننا هيترسَّل لك ضعفين!](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=We%20are%20giving%20back%20to%20our%20community.%20We%20support%20Bitcoin%20and%20believe%20you%20should%20too!%20All%20Bitcoin%20sent%20to%20our%20addresses%20will%20be%20sent%20back%20to%20you%2C%20doubled!)" نفس العرض، متكرّر على عشرات من أكثر الأفواه مصداقية في العالم في وقت واحد.

مش كل الحسابات اتُستخدمت. من بين الـ130 حسابًا اللي اتلمست، وجد المنظّم إن "[إجمالًا 130 حساب تويتر اتُخترق خلال الاختراق. من بينها، 45 حسابًا استُخدمت لإرسال تغريدات](https://www.dfs.ny.gov/Twitter_Report#:~:text=Overall%2C%20130%20Twitter%20user%20accounts%20were%20compromised%20during%20the%20Twitter%20Hack.%20Of%20those%2C%2045%20accounts%20were%20used%20to%20send%20tweets)." خمسة وأربعون مكبّر صوت كانوا أكثر من كافيين.

## اللي اتخسر فعلًا

بالأرقام المجرّدة، الغنيمة كانت صغيرة. تقرير DFS يذكر إن "[المخترقون سرقوا ما قيمته 118 ألف دولار تقريبًا من البيتكوين خلال اختراق تويتر](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20stole%20approximately%20%24118%2C000%20worth%20of%20bitcoin%20through%20the%20Twitter%20Hack)." ويكيبيديا تشير إلى أن محفظة احتيال واحدة "[استقبلت أكثر من 320 إيداعًا بقيمة تتجاوز 110 آلاف دولار أمريكي قبل إزالة رسائل الاحتيال](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=received%20over%20320%20deposits%20with%20a%20value%20of%20over%20US%24110%2C000%20before%20the%20scam%20messages%20were%20removed)." بالنسبة لاختراق بهذا الحجم، 118 ألف دولار مبلغ محرج في تواضعه.

لكن الرقم ده بيقلّل جدًا من الخسارة الحقيقية. اللي وقع فعلًا بعد الظهر ده هو *مصداقية الشارة الموثّقة كإشارة ثقة*. لساعتين، العلامة الزرقاء لم تثبت شيئًا. طبقة الهوية الكاملة للمنصة — الشيء اللي كان يخليك تصدّق إن التغريدة جت من الشخص اللي اسمه عليها — كانت بوضوح وفي وقت واحد قابلة للسيطرة من مراهق. ردّ فعل تويتر كان واضحًا: جمّدوا مؤقتًا قدرة كتير من الحسابات الموثّقة على التغريد خالص. الطريقة الوحيدة لوقف الحسابات الموثوقة عن الكذب كانت إسكاتها.

دي التكلفة الحقيقية لسرقة الهوية. الفلوس ملاحظة هامشية. الضرر هو إن "الحساب ده = الشخص ده" بيبطل يكون صح، وكل واحد يعتمد على المعادلة دي بيبقى مكشوفًا.

## إزاي حصل: مكالمة تليفونية ثم لوحة إدارة

![فن مفاهيمي ملوّن ومشرق لسماعة تليفون ملقاة كسنّارة صيد، خطّافها بيمسك بلوحة تحكم داخلية مضيئة مليانة مفاتيح](../../assets/the-2020-twitter-bitcoin-account-takeover-02-vishing.jpg)

ما كانش في أي ثغرة برمجية. تقرير DFS صريح: "[اختراق تويتر لم يتضمّن أيًا من الأساليب التقنية المتطوّرة المستخدمة في هجمات الإنترنت عادةً — لا مالوير، ولا ثغرات، ولا أبواب خلفية](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20did%20not%20involve%20any%20of%20the%20high%2Dtech%20or%20sophisticated%20techniques%20often%20used%20in%20cyberattacks%20%E2%80%93%20no%20malware%2C%20no%20exploits%2C%20and%20no%20backdoors)." بدلًا من كده، "[استخدم المخترقون أساليب أبسط أشبه بأساليب النصّاب التقليدي: مكالمات هاتفية ادّعوا فيها أنهم من قسم تكنولوجيا المعلومات في تويتر](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20used%20basic%20techniques%20more%20akin%20to%20those%20of%20a%20traditional%20scam%20artist%3A%20phone%20calls%20where%20they%20pretended%20to%20be%20from%20Twitter%E2%80%99s%20Information%20Technology%20department)."

ده هو **vishing** — التصيد الصوتي. المهاجمون "[اتصلوا بعدد من موظفي تويتر وادّعوا إنهم بيتصلوا من مكتب المساعدة في قسم IT بتويتر](https://www.dfs.ny.gov/Twitter_Report#:~:text=called%20several%20Twitter%20employees%20and%20claimed%20to%20be%20calling%20from%20the%20Help%20Desk%20in%20Twitter%E2%80%99s%20IT%20department)"، و"[ادّعوا إنهم بيردّوا على مشكلة تقنية الموظف بيواجهها مع الشبكة الافتراضية الخاصة بتويتر](https://www.dfs.ny.gov/Twitter_Report#:~:text=claimed%20they%20were%20responding%20to%20a%20reported%20problem%20the%20employee%20was%20having%20with%20Twitter%E2%80%99s%20Virtual%20Private%20Network)." تويتر نفسها وصفته لاحقًا بأنه "[هجوم تصيد صوتي موجَّه](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=phone%20spear%20phishing%20attack)" قام على "[محاولة جادة ومنسّقة لتضليل موظفين بعينهم واستغلال الثغرات البشرية](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=a%20significant%20and%20concerted%20attempt%20to%20mislead%20certain%20employees%20and%20exploit%20human%20vulnerabilities)."

عامل الإقناع كان البحث، مش المهارة التقنية. كما وثّق الصحفي الأمني Brian Krebs، المهاجمون اعتمدوا على بيانات الملفات الشخصية — أسماء وأدوار وتفاصيل شخصية مسحوبة من LinkedIn وتسريبات بيانات سابقة — عشان يبدوا زي زملاء حقيقيين. لمّا الموظف آمن بالمتصل، سلّم له بياناته، والبيانات فتحت الباب للجائزة: أدوات إدارة الحسابات الداخلية عند تويتر.

الأداة دي هي محور الحكاية كلها. Krebs أفاد إن "[في أدوات الإدارة عند تويتر، يبدو ممكن إنك تحدّث البريد الإلكتروني لأي مستخدم تويتر](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=within%20Twitter%E2%80%99s%20admin%20tools%2C%20apparently%20you%20can%20update%20the%20email%20address%20of%20any%20Twitter%20user)" — تغيّر البريد، تطلب إعادة تعيين كلمة السر، والحساب بقى بتاعك، الشارة وكل حاجة. تقرير DFS بيشير للإخفاق الهيكلي اللي خلّى موظفًا واحدًا متأثرًا بمصيبة كبيرة: "[تويتر فعلًا قيّدت الوصول للأدوات الداخلية، لكن أكثر من 1000 موظف في تويتر كانوا لا يزالون يملكون الوصول إليها](https://www.dfs.ny.gov/Twitter_Report#:~:text=Twitter%20did%20limit%20access%20to%20the%20internal%20tools%2C%20but%20over%201%2C000%20Twitter%20employees%20still%20had%20access%20to%20them)." أكثر من ألف شخص بيمسكوا مفتاحًا رئيسيًا لكل هوية على المنصة، والشركة ما كانتش عندها مسؤول أمن معلومات رئيسي يشرف عليه — تويتر "[ما كانتش عندها مسؤول أمن معلومات رئيسي (CISO) منذ ديسمبر 2019، سبعة أشهر قبل اختراق تويتر](https://www.dfs.ny.gov/Twitter_Report#:~:text=had%20not%20had%20a%20chief%20information%20security%20officer%20(%E2%80%9CCISO%E2%80%9D)%20since%20December%202019%2C%20seven%20months%20before%20the%20Twitter%20Hack)."

كان في سوق تحت كل ده كمان. قبل ما عملية الاحتيال بالمشاهير تنطلق، الفريق كان مشغول ببيع أسماء مستخدمين قصيرة "OG" مسروقة. Krebs لاحظ إنه قبل هجمة أوباما/بايدن/ماسك/جيتس، "[عدد من أسماء حسابات تويتر القصيرة المرغوبة غيّرت أصحابها](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=several%20highly%20desirable%20short%2Dcharacter%20Twitter%20account%20names%20changed%20hands)"، لأن في هذه المجتمعات "[أسماء الملفات الشخصية القصيرة تمنح قدرًا من المكانة والثروة](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=short%2Dcharacter%20profile%20names%20confer%20a%20measure%20of%20status%20and%20wealth)" و"[كثيرًا ما تُباع بآلاف الدولارات](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=can%20often%20fetch%20thousands%20of%20dollars%20when%20resold)." أسماء ذات قيمة بسبب ندرتها، تُسرق وتُعاد بيعتها في منتدى — نمط يعرفه أي مستثمر في النطاقات على طول.

## التداعيات والاعتقالات

الانهيار كان سريعًا تقريبًا بنفس سرعة الاختراق. في غضون أسبوعين، تحرّك المدّعون العامون. Krebs أفاد بالتهم: "[Mason 'Chaewon' Sheppard، شاب يبلغ 19 عامًا من Bognor Regis في المملكة المتحدة، وُجّهت إليه تهم في كاليفورنيا بالتآمر لارتكاب الاحتيال الإلكتروني وغسيل الأموال والوصول غير المصرّح به لحاسوب](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Mason%20%E2%80%9CChaewon%E2%80%9D%20Sheppard%2C%20a%2019%2Dyear%2Dold%20from%20Bognor%20Regis%2C%20U.K.%2C%20also%20was%20charged%20in%20California%20with%20conspiracy%20to%20commit%20wire%20fraud%2C%20money%20laundering%20and%20unauthorized%20access%20to%20a%20computer)"، و"[Nima 'Rolex' Fazeli، شاب يبلغ 22 عامًا من أورلاندو بولاية فلوريدا، وُجّهت إليه تهمة المساعدة والتحريض على الوصول المتعمّد لحاسوب محمي في شكوى جنائية في شمال كاليفورنيا](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Nima%20%E2%80%9CRolex%E2%80%9D%20Fazeli%2C%20a%2022%2Dyear%2Dold%20from%20Orlando%2C%20Fla.%2C%20was%20charged%20in%20a%20criminal%20complaint%20in%20Northern%20California%20with%20aiding%20and%20abetting%20intentional%20access%20to%20a%20protected%20computer)."

لكن الزعيم المزعوم كان أصغر منهم. "[Graham Clark البالغ من العمر 17 عامًا من تامبا بولاية فلوريدا كان من بين المتهمين في اختراق تويتر بتاريخ 15 يوليو](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=17%2Dyear%2Dold%20Graham%20Clark%20of%20Tampa%2C%20Fla.%20was%20among%20those%20charged%20in%20the%20July%2015%20Twitter%20hack)"، وبما إنه قاصر اتهامه كان من النيابة العامة لولاية فلوريدا وليس من المحكمة الفيدرالية. "[وُجّهت إليه 30 تهمة جنائية، من بينها الاحتيال المنظّم والاحتيال في الاتصالات](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=was%20hit%20with%2030%20felony%20charges%2C%20including%20organized%20fraud%2C%20communications%20fraud)."

في مارس التالي، قبل Clark التسوية. CyberScoop أفاد إنه "[اعترف بتدبيره مخطط سرق فيه أكثر من 117 ألف دولار باستيلائه على حسابات تويتر لعدد من الشخصيات العامة](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/#:~:text=admitted%20to%20being%20behind%20a%20scheme%20that%20saw%20him%20steal%20more%20than%20%24117%2C000%20by%20taking%20over%20the%20Twitter%20accounts%20of%20numerous%20public%20figures)." محطة الراديو العامة WUSF أفادت بالحكم: "[ثلاث سنوات في مؤسسة إصلاحية للأحداث يعقبها ثلاث سنوات مراقبة](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=three%20years%20in%20a%20juvenile%20facility%20to%20be%20followed%20by%20three%20years%20of%20probation)"، وأشارت إلى إنه "[الحد الأقصى المسموح به بموجب قانون مرتكبي الجرائم من الشباب في الولاية](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=the%20maximum%20allowed%20under%20the%20state%E2%80%99s%20youthful%20offender%20law)."

شخصية رابعة ظهرت بعدين. ويكيبيديا توثّق إن "[في أبريل 2023، اتُّرحل Joseph James O'Connor، البالغ من العمر 23 عامًا والمواطن البريطاني المعروف بـPlugwalkJoe، من إسبانيا إلى نيويورك لمواجهة التهم](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=In%20April%202023%2C%2023%2Dyear%2Dold%20Joseph%20James%20O%E2%80%99Connor%2C%20a%20British%20citizen%20with%20the%20online%20handle%20PlugwalkJoe%2C%20was%20extradited%20from%20Spain)"، وصدر بحقه لاحقًا حكم بالسجن خمس سنوات فيدراليًا.

## اللي بيعلّمنا إياه عن التحكم في الهوية الرقمية

لو شلنا أسماء المشاهير والعملات المشفّرة، اختراق تويتر 2020 هو درس نقي في الفرق بين *امتلاك* هوية و*التحكم* فيها. عدد من المبادئ بتخرج منه:

1. **الثقة بتتراكم على الاسم؛ التحكم بيسكن في الكواليس.** مئات الملايين كانوا يثقون في `@BarackObama`. ما حدّش من الثقة دي حمت الحساب، لأن سطح التحكم في الحساب كان لوحة إدارة داخلية أكثر من ألف موظف يقدروا يوصلوها. مين يتحكم في الكواليس، يتحكم في الهوية، مهما كان اسم من على الواجهة.

2. **الحلقة الأضعف مش التشفير تقريبًا أبدًا.** لا ثغرة، لا مالوير، لا باب خلفي — بس مكالمة تليفونية مقنعة. أنظمة الهوية بتفشل على مستوى الإنسان والعملية أكثر بكتير من مستوى الرياضيات. قفل مثالي على باب أي موظف متعاون هيفتحه عند أول طلب مش قفل حقيقي.

3. **نقطة التحكم الواحدة الكاملة هي نقطة الفشل الكاملة.** أداة داخلية واحدة قابلة لإعادة الاستخدام تقدر تغيّر البريد الإلكتروني على *أي* حساب معناها موظف واحد متأثر يساوي استيلاء على المنصة كلها. التحكم المركّز والقابل للعكس والغامض هو الثغرة.

4. **الأسماء النادرة هدف.** نفس الفريق اللي اختطف الرؤساء باع بهدوء أسماء مستخدمين قصيرة "OG" بآلاف الدولارات. الأسماء القيّمة بتجذب السرقة، وقيمة الاسم بالظبط هي اللي بتخلّي التحكم فيه يستاهل السرقة.

5. **الاسترداد ما ينفعش يعتمد على كرم المنصة.** لمّا الحسابات الموثوقة بدأت تكذب، الحل الوحيد عند تويتر كان تجميدها. أصحاب الهوية ما كانوش عندهم طريقة مستقلة يثبتوا بيها "ده أنا الحقيقي" أو يستردّوا التحكم — كانوا يعتمدون بالكامل على الأدوات الداخلية وحسن نية مشغّل مركزي.

## الزاوية من منظور Namefi

![رسم توضيحي ملوّن للملكية القابلة للتحقق والمقاومة للتلاعب لهوية رقمية — مؤمَّنة بدرع أخضر ورمز Namefi الأخضر والاستمرارية](../../assets/the-2020-twitter-bitcoin-account-takeover-03-namefi-angle.jpg)

اسم النطاق هو هوية رقمية بنفس الفجوة تمامًا بين الثقة والتحكم اللي كانت عند أسماء تويتر الموثّقة — وغالبًا بنفس نوع الكواليس الغامضة. بالنسبة لمعظم النطاقات، "الملكية" ساكنة في حساب عند شركة التسجيل، محميّ بكلمة سر وفريق دعم. مكالمة هاتفية مقنعة، أو موظف دعم تعرّض للهندسة الاجتماعية، أو تغيير بريد إلكتروني تمّ عبر لوحة داخلية — سيناريو اختراق تويتر 2020 ينطبق تقريبًا حرفيًا على الاستيلاء على حساب شركة تسجيل النطاقات. الثقة اللي العالم ضخّها في نطاقك مش بتحميه لو التحكم في النطاق ده واقف ورا مكتب مساعدة يمكن تقنعه بأي حاجة.

[Namefi](https://namefi.io) موجودة عشان تسدّ الفجوة دي. الفكرة الأساسية إن التحكم في النطاق يكون *قابلًا للتحقق ومحتفظًا به من قبل المالك*، مش إعداد في أداة إدارة حد تاني. بتمثيل [ملكية النطاق](/ar/glossary/domain-ownership/) كأصل رمزي على ال[بلوكتشين](/ar/glossary/blockchain/) متوافق مع DNS، Namefi بتخلّي سؤال "مين يتحكم في الاسم ده؟" قابلًا للإجابة كريبتوغرافيًا بدلًا من أن يعتمد على حكم موظف دعم تحت ضغط. ما فيش لوحة داخلية واحدة ألف موظف يقدروا يوصلوها عشان يعيدوا تسجيل اسمك بصمت؛ إثبات التحكم بيسكن مع المالك، والتحويلات قابلة للمراجعة وليست مرتجلة.

اختراق تويتر 2020 نجح لأن الهوية والتحكم اتفصلوا بهدوء — الاسم كان بيقول حاجة بينما أداة إدارة مخفية كانت تقرّر حاجة تانية. الدرس لأي حد بيعتمد على اسم هو إن التحكم يكون واضحًا وراسخًا في يد المالك بنفس مستوى الثقة اللي الاسم بيحملها. اسم المستخدم، والشارة، والنطاق — كل واحد فيهم آمن بقدر أمان الكواليس اللي وراه. رهان Namefi إن الكواليس يكون دفترًا موثوقًا قابلًا للتحقق تتحكم فيه أنت، مش خط هاتف ممكن حد تاني يتخدع عشان يردّ عليه.

## المصادر والقراءة الإضافية

- قسم الخدمات المالية في نيويورك — [تقرير تحقيق تويتر](https://www.dfs.ny.gov/Twitter_Report)
- ويكيبيديا — [اختراق حسابات تويتر 2020](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking)
- Krebs on Security — [من وراء الاختراق الملحمي لتويتر يوم الأربعاء؟](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/)
- Krebs on Security — [اختراق تويتر للربح والمتعة](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/)
- Krebs on Security — [توجيه تهم لثلاثة أشخاص في اختراق تويتر بتاريخ 15 يوليو](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/)
- CyberScoop — [مخترق تويتر يُقرّ بالذنب ويُحكم عليه بثلاث سنوات](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/)
- WUSF — [مخترق تويتر من تامبا يُحكم عليه بثلاث سنوات سجنًا وثلاث سنوات مراقبة](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation)
- وزارة العدل الأمريكية — [توجيه تهم لثلاثة أفراد بسبب أدوار مزعومة في اختراق تويتر](https://www.justice.gov/usao-ndca/pr/three-individuals-charged-alleged-roles-twitter-hack)
- ABC News — [رجل من فلوريدا أقرّ بالذنب في اختراق تويتر وهو في السابعة عشرة يُحكم عليه بثلاث سنوات](https://abcnews.go.com/Politics/florida-man-pleaded-guilty-hacking-twitter-17-year/story?id=76513232)
