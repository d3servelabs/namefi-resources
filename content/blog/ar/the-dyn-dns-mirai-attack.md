---
title: 'هجوم Dyn DNS: لما بوت نت Mirai من كاميرات متهكرة عطّل نص الإنترنت'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'في 21 أكتوبر 2016، ضرب هجوم DDoS بقوة بوت نت Mirai للأجهزة الذكية مزود DNS شركة Dyn في ثلاث موجات، وخلّى Twitter وNetflix وReddit وSpotify وGitHub وAirbnb وPayPal بره الخدمة لساعات — دراسة حالة Domain Mayday عن مخاطر الاعتماد على مزود DNS واحد.'
keywords: ['هجوم dyn dns', 'بوت نت mirai', 'هجوم ddos 21 أكتوبر 2016', 'هجوم ddos على dns', 'بوت نت إنترنت الأشياء', 'انقطاع مزود dns', 'أمان النطاقات', 'نقطة فشل واحدة في dns', 'dyn ddos 2016', 'برنامج mirai الخبيث', 'انقطاع الإنترنت 2016', 'تكرار dns', 'كاميرات iot متهكرة']
relatedArticles:
  - /ar/blog/the-godaddy-multi-year-breach/
  - /ar/blog/the-curve-finance-dns-hijack/
  - /ar/blog/the-fox-it-dns-hijack/
  - /ar/blog/the-myetherwallet-bgp-dns-attack/
  - /ar/blog/the-lenovo-com-dns-hijack/
relatedTopics:
  - /ar/topics/domain-security/
  - /ar/topics/domain-basics/
relatedSeries:
  - /ar/series/domain-apocalypse/
  - /ar/series/name-change-game-change/
relatedGlossary:
  - /ar/glossary/dns/
  - /ar/glossary/registrar/
  - /ar/glossary/icann/
  - /ar/glossary/tld/
  - /ar/glossary/web3/
---

لساعات قليلة في يوم جمعة من أكتوبر 2016، الإنترنت نسي إزاي يلاقي نفسه.

Twitter فتح صفحة فاضية. Netflix دوّر وبعدين استسلم. Reddit وSpotify وGitHub وAirbnb وPayPal — كلهم موجودين، كلهم أونلاين، كلهم شغالين تمام على سيرفراتهم، وكلهم مش متاحين خالص. مفيش حاجة اتهكرت. مفيش داتا اتسرقت. المواقع كانت في نفس مكانها زي ما هي دايمًا. اللي انكسر هو الجزء من الإنترنت اللي *بيقولك فين الأشياء*.

الهجوم ماضربش Twitter أو Netflix. ضرب شركة معظم المستخدمين ماسمعوش عنها قبل كده: **Dyn**، شركة في New Hampshire بتشغّل DNS — دليل عناوين الإنترنت — لجزء كبير من الويب الحديث. والسلاح مكانش مزرعة سيرفرات أو ترسانة دولة. كان سرب من مراقبات الأطفال المتهكرة والكاميرات والراوترات المنزلية: أجهزة عادية في البيت، اتجنّدت بهدوء في جيش اسمه **Mirai**.

ده **Domain Mayday EP08** — اليوم اللي فيه الكاميرات الذكية غير الآمنة أوقعت دليل تليفونات الإنترنت.

## DNS: دليل تليفونات الإنترنت، ومكانة Dyn فيه

كل مرة بتكتب فيها اسم نطاق، الكمبيوتر بتاعك محتاج يترجمه ل[عنوان IP](/ar/glossary/ip-address/) رقمي قبل ما يتصل بأي حاجة. الترجمة دي هي شغل [DNS](/ar/glossary/dns/)، نظام أسماء النطاقات. هو طبقة البحث بين الاسم اللي بني آدم يفهمه والماكينة اللي الاسم بيشير إليها.

Dyn كانت واحدة من أكبر مزودي خدمة البحث المُدارة دي. لما موقع كان بيسوّب DNS بتاعه لـ Dyn، سيرفرات الأسماء بتاعة Dyn بقت المصدر الرسمي لـ "الدومين ده فين؟" The Register وضّح الاعتماد ده بصراحة أثناء الهجوم: بضرب Dyn أوفلاين، محللات DNS العامة اللي شغالة عند Google والمزودين [مقدرتش تتصل بـ Dyn عشان تعمل lookup للهوستنيم للمستخدمين، وحالت دون وصول الناس للمواقع اللي بتستخدم Dyn لـ DNS](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=unable%20to%20contact%20Dyn%20to%20lookup%20hostnames).

ده هو الهشاشة الهادية في قلب الحكاية دي. موقع ممكن يكون مثالي — سيرفرات متكررة، أبتايم كامل، مهندسين من الطراز الأول — ومع كده يختفي من الإنترنت لو المزود الواحد اللي بيجاوب على "فين هو؟" اتعطّل. زي ما CyLab في Carnegie Mellon لخّصت بعدين، النطاقات المتأثرة كانت [معتمدة اعتمادًا كليًا على Dyn، مزود DNS خارجي. بمعنى تاني، اعتمدت عليه بشكل حصري، فلما Dyn وقع، وقعوا معاه](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=critically%20dependent%20on%20Dyn).

## 21 أكتوبر 2016: الهجوم جه في موجات

![فن مفاهيمي ملون وحي لموجة مد من حركة مرور مضيئة تتحطم فوق لوحة توصيل تليفونات مضيئة عملاقة، مع انطفاء أضواء الدليل فوق خريطة مظلمة](../../assets/the-dyn-dns-mirai-attack-01-attack.jpg)

الهجوم بدأ صباح الجمعة 21 أكتوبر 2016، ومجاش ضربة واحدة. جه في موجات واضحة على مدار اليوم.

سجل Wikipedia للحادثة بيذكر [ثلاث هجمات حجب خدمة موزعة متتالية](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=three%20consecutive%20distributed%20denial%2Dof%2Dservice%20attacks) ضد Dyn، ابتدت حوالي الساعة 11:10 UTC. الآلية كانت حجب خدمة موزع كلاسيكي: [تم تنفيذ هجوم DDoS من خلال طلبات بحث DNS عديدة من عشرات الملايين من عناوين IP](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=numerous%20DNS%20lookup%20requests%20from%20tens%20of%20millions%20of%20IP%20addresses)، بتغرق سيرفرات Dyn في قدر كبير من حركة المرور غير المجدية لدرجة إن البحث الحقيقي ماكانش بيعدي.

الموجات هي اللي خلّته يحس بالعنف المستمر. The Register وهو بيغطيه لحظة بلحظة وصف اللحظة اللي بدا فيها إن Dyn عادت — وبعدين ماعدتش: [بعد ساعتين من الموجة الأولى من حركة المرور غير المجدية، Dyn أعلنت إنها تصدّت للهجوم والخدمة عم بترجع لطبيعتها. بس الراحة كانت قصيرة: بعد ساعة تقريبًا، الهجوم استأنف](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=After%20two%20hours%20into%20the%20initial%20tidal%20wave). اللي بدا نهاية كان مجرد فرجة بين الجولات.

من ناحية الحجم الخام، الهجوم كان ضخم لوقته — من أكبر أحداث DDoS اللي شوفت لحد النقطة دي، مع تعريف The Register للذروة بـ [أكتر من 1 تيرابت في الثانية](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/#:~:text=more%20than%201TBps). (Dyn نفسها حذّرت إن "عاصفة المحاولة" من حركة المرور الحقيقية ورّمت بعض التقديرات الأولية، نقطة هنرجع ليها.)

## الأماكن اللي اتعطّلت — وإزاي الحدوتة اتحسّت

لما سيرفرات Dyn مجبتش، الفشل تموّج للخارج لكل اللي بيعتمد عليها. مش كان ده ركن غامض من الويب. كان صفحة أولى للإنترنت الاستهلاكي.

تقرير The Register الحي سمّى بعض الضحايا بالاسم: هجوم مركّز استثنائي على Dyn استمر في [تعطيل خدمات الإنترنت لمئات الشركات، بما فيهم عمالقة الإنترنت Twitter وAmazon وAirBnB وSpotify وغيرهم](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=disrupt%20internet%20services%20for%20hundreds%20of%20companies). قايمة Wikipedia للخدمات المتأثرة بتتلقى زي قايمة من هم الأبطال في وقتها: [Airbnb وAmazon.com وCNN وGitHub وNetflix وPayPal وReddit وSpotify وTwitter](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=Airbnb)، وعشرات غيرهم.

Brian Krebs، اللي موقعه نفسه اتضرب بنفس البرنامج الخبيث أسابيع قبل كده، وصف تجربة المستخدم العادي بإن [الهجوم بدأ يخلق مشاكل لمستخدمي الإنترنت في الوصول لمجموعة مواقع، بما فيهم Twitter وAmazon وTumblr وReddit وSpotify وNetflix](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=an%20array%20of%20sites%2C%20including%20Twitter). للمستخدمين العاديين، ماكنش في رسالة خطأ مفهومة. المواقع ببساطة مكانتش بتتحمّل — أول ما بدأ على الساحل الشرقي الأمريكي، وبعدين اتوسّع مع الموجات الأحدث لتوصل لمستخدمين في الولايات المتحدة كلها وفي أوروبا.

## إزاي حصل: جيش من الأجهزة الذكية غير الآمنة

![فن مفاهيمي ملون وحي لآلاف الكاميرات الذكية المتهكرة المبتسمة والتوسترات ومراقبات الأطفال بتتسرب زي حشرات مضيئة نحو برج دليل واحد مثقل](../../assets/the-dyn-dns-mirai-attack-02-mirai-botnet.jpg)

ده هو الجزء اللي خلّى هجوم Dyn نقطة تحوّل: القوة النارية مجيتش من كمبيوترات. جت من *أشياء*.

Mirai برنامج خبيث بيصطاد أجهزة إنترنت الأشياء — كاميرات وراوترات وـDVR — وبيخطفها. بيشتغل عن طريق استغلال أضعف نقطة في العتاد الاستهلاكي: الباسورد اللي جاي منها الجهاز. زي ما The Register وصفه، Mirai [بينتشر عبر الويب ويكبّر صفوف الزومبيز الطائعين بتاعه عن طريق تسجيل الدخول للأجهزة باستخدام كلمات المرور الافتراضية اللي جاءت بيها من المصنع عبر Telnet وSSH](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/#:~:text=logging%20into%20devices%20using%20their%20default%2C%20factory%2Dset%20passwords). Krebs وصف الآلية بنفس الصراحة: Mirai [بيمسح الويب عن أجهزة IoT محمية بأكتر من أسماء مستخدمين وكلمات مرور افتراضية من المصنع، وبعدين بيجند الأجهزة دي في الهجمات](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=scours%20the%20Web%20for%20IoT%20devices).

الأجهزة اللي كانت في قلب هجوم Dyn كانت بشكل أساسي كاميرات ويب وDVR رخيصة. Krebs تتبّع البوت نت لـ [كاميرات DVR وIP متهكرة بشكل أساسي صنعتها شركة صينية للتكنولوجيا الراقية اسمها XiongMai Technologies](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=mainly%20compromised%20digital%20video%20recorders) — أجهزة بيانات الدخول الافتراضية فيها، في حالات كتير، [المستخدم ما يقدرش فعليًا يغيّرها](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=A%20user%20cannot%20feasibly%20change%20this%20password) لأن الباسورد كانت مدمجة في الفيرموير.

حاجتين حوّلوا Mirai من مشكلة صغيرة لكارثة. أول حاجة، مؤلف البرنامج الخبيث كان [في آخر سبتمبر 2016 نزّل الكود المصدري بتاعه، وبالعملي خلّى أي حد يقدر يبني جيش هجوم خاص بيه](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=released%20the%20source%20code%20for%20it). تاني حاجة، عدد الأجهزة القابلة للاستغلال كان ضخم. Dyn أكدت بصمة الهجوم: الشركة قدرت [تأكد إن حجمًا كبيرًا من حركة مرور الهجوم جت من بوت نت مبنية على Mirai](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=confirm%20that%20a%20significant%20volume%20of%20attack%20traffic%20originated%20from%20Mirai)، وWikipedia بتصف البوت نت بإنه سرب من [أجهزة متصلة بالإنترنت — زي طابعات وكاميرات IP وبوابات منزلية ومراقبات أطفال — اتأثرت ببرنامج Mirai الخبيث](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=printers%2C%20IP%20cameras%2C%20residential%20gateways%20and%20baby%20monitors).

## التداعيات: عدّ السرب — والمنفذين

لما الغبار اتفشّ، حتى السؤال الأساسي *كان كبير قد إيه* اتضح إنه صعب. تحليل Dyn بعد الحادثة، عن طريق نائب الرئيس التنفيذي Scott Hilton، قدّر البوت نت بـ [لحد 100,000 نقطة نهاية ضارة](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=up%20to%20100%2C000%20malicious%20endpoints) — كبيرة، بس أصغر من "عشرات الملايين من عناوين IP" اللي بعض الأرقام الأولية كانت بتوحي بيها. الفرق جا من حلقة ردود فعل: الهجمات الضارة جت من بوت نت واحدة على الأقل، [وعاصفة المحاولة قدّمت مؤشرًا زائفًا على مجموعة أكبر بكتير من نقاط النهاية مما اتضح بعدين](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=with%20the%20retry%20storm%20providing%20a%20false%20indicator). بمعنى تاني، سلوك "حاول تاني" الأوتوماتيكي للإنترنت كبّر الفوضى.

التداعيات القانونية أضافت لف. التلاتة شباب صغيرين وراء Mirai — Paras Jha وJosiah White وDalton Norman — في النهاية [اعترفوا بالذنب عن دورهم في إنشاء وتشغيل وبيع الوصول لـ "بوت نت Mirai"](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=pleaded%20guilty%20for%20their%20role%20in%20creating). بس بحلول وقت هجوم Dyn، Jha كان سبق ونزّل الكود المصدري للعموم — والمدعين العامين والصحفيين كانوا حريصين في الإشارة إن منفذي هجوم Dyn مش بالضرورة كانوا الثلاثي الأصلي. زي ما CyberScoop أفادت، [لسه مش واضح، مثلًا، مين كان وراء الهجوم الأعلى صدى المرتبط بـ Mirai ضد شركة إدارة أداء الإنترنت Dyn](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=not%20yet%20clear%2C%20for%20example%2C%20who%20was%20behind). لما السلاح بقى مفتوح المصدر، أي حد قدر يضغط على الزناد.

بالنسبة لـ Dyn، الضرر التجاري كان حقيقي: في الشهور اللي اتلت، آلاف النطاقات نقلت DNS بتاعها لمكان تاني، درس مكلف في ثقة العملاء بعد يوم واحد سيء.

## إيه اللي الحادثة دي بتعلّمنا عن تركيز مزود DNS

هجوم Dyn متذكّر كحكاية أمان إنترنت الأشياء، وهو كده فعلًا. بس درسه الأعمق هو عن *البنية*: خطر توجيه قدر كبير من الإنترنت عبر نقطة اختناق واحدة.

كل موقع اتعطّل في 21 أكتوبر كان اتخذ نفس القرار اللي بيبدو معقول — سوّب DNS لمزود واحد ممتاز. بشكل فردي، ذكي. بشكل جماعي، معناه إن إسقاط شركة واحدة يقدر يمحي جزء مهم من الويب دفعة واحدة. حكم CyLab كان إن دروس الهجوم [اتطبّقت بس من قِبل عدد قليل من المواقع اللي اتأثرت بشكل مباشر](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=have%20only%20been%20acted%20upon%20by%20a%20handful)، حتى بعد سنين.

الإجابة الدفاعية هي التكرار: توزيع DNS الموثوق على أكتر من مزود واحد عشان لا يكون أي انقطاع منفرد قاتل. بعد سنتين من Dyn، The Register لقت إن ده لسه نادر ولسه مؤلم — Cricket Liu من Infoblox لاحظ إنه [لسه ما بقاش أسهل استخدام أكتر من مزود DNS موثوق، مثلًا (زي Dyn بالإضافة لـ Verisign أو Neustar). القدرة على استخدام مزودين متعددين هتحدث فرقًا كبيرًا](https://www.theregister.com/2018/10/11/dns_insecurity_survey/#:~:text=hasn%27t%20gotten%20any%20easier%20to%20use%20multiple%20authoritative%20DNS%20providers). الدروس المستفادة لأي حد بيعتمد على نطاق:

1. **النطاق له نقاط فشل أكتر من المسجِّل بتاعه.** المزود اللي بيجاوب على "الاسم ده بيشير فين؟" بنفس قدر أهمية السيرفرات اللي وراه.
2. **DNS من مزود واحد هو نقطة فشل واحدة.** أبتايم ممتاز في الظروف الاعتيادية مش بيقول حاجة عن السلوك تحت فيضان من 1 تيرابت.
3. **التركيز مريح وهش.** نفس الكفاءة اللي بتخلّي مزود واحد جذاب بتخلّي انقطاعه محسوس على نطاق واسع.
4. **المرونة صفة خاصة بالملكية، مش بس الاستضافة.** لما حاجة تتكسر، محتاج تتحكم في تهيئة النطاق بتاعك بشكل كافٍ عشان تعيد التوجيه بسرعة.

## الزاوية بتاعة Namefi

![رسم توضيحي ملون لملكية نطاق قابلة للتحقق ومرنة — بطاقة نطاق مؤمنة بدرع خضراء وتوكن Namefi أخضر واستمرارية DNS](../../assets/the-dyn-dns-mirai-attack-03-namefi-angle.jpg)

هجوم Dyn ماسرقش نطاق واحد. ماعملش حوالة مزيفة وماخطفش حساب مسجِّل. ومع كده، لساعات قليلة، الناس اللي *امتلكوا* النطاقات دي فقدوا فعليًا السيطرة على فين أسماؤهم بتشير — مش لأن ملكيتهم كانت موضع شك، لكن لأن الطبقة التشغيلية تحت نطاقاتهم فشلت دفعة واحدة.

الفجوة دي — بين *امتلاك* اسم و*التحكم الموثوق* في فين بيتحلّ — هي بالضبط الفتق اللي الهجمات زي دي بتستغله. النطاقات من بين أقيم الأصول اللي بيمتلكها أي عمل، مع كده تحكمها غالبًا بيكون وراء بنية تحتية مبهمة ومركزية المالك مش قادر يتحقق منها ولا يعيد تهيئتها بسرعة تحت الضغط.

[Namefi](https://namefi.io) مبني على فكرة إن النطاقات المفروض تتصرف زي أصول أصيلة على الإنترنت: ملكية قابلة للتحقق الكريبتوجرافي وقابلة للنقل، مع بقاءها متوافقة تمامًا مع DNS. ملكية نطاق موثوقة ومتحكم فيها من المالك ما بتوقفش بوت نت — بس بتدفع العالم نحو إنترنت فيه التحكم في الاسم قابل للإثبات والمراجعة، وغير معتمد بشكل صامت على أسوأ يوم في حياة مزود واحد. هجوم Mirai-Dyn تذكير إن النطاق اللي "بتمتلكه" مرون بقدر الطبقة اللي بتجاوب عنه. المرونة بتبدأ بجعل الملكية والتحكم حاجة تقدر فعلًا تتحقق منها.

## المصادر وقراءة إضافية

- Krebs on Security — [كاميرات وDVR متهكرة دعمت انقطاع الإنترنت الضخم اليوم](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/)
- Wikipedia — [هجمات DDoS على Dyn](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn)
- The Register — [دمار DNS: مواقع كبيرة اتأثرت وDyn وقعت تاني](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/)
- The Register — [النهارده الويب اتكسر بسبب أجهزة متهكرة لا تعد: ملخص 60 ثانية](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/)
- The Register — [Mirai، Mirai، اهكرهم كلهم: مين أعظم بوت نت؟](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/)
- The Register — [في السنتين اللي فاتوا من بعد ما Dyn اتوقفت، إيه اللي اتعلمناه؟ مش كتير على ما يبدو](https://www.theregister.com/2018/10/11/dns_insecurity_survey/)
- BankInfoSecurity — [جيش بوت نت من "لحد 100,000" جهاز IoT عطّل Dyn](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486)
- Carnegie Mellon CyLab — [أربع سنين من بعد هجوم Mirai-Dyn… الإنترنت بقت أأمن؟](https://cylab.cmu.edu/news/2020/10/30-dynattack.html)
- CyberScoop — [ثلاثة رجالة اعترفوا بالذنب في أدوارهم في إمبراطورية بوت نت Mirai](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/)
