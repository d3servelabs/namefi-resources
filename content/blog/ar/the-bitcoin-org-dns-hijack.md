---
title: 'اختراق DNS لـ Bitcoin.org: كيف اتحول الموقع الرسمي للبيتكوين لعملية نصب "ضاعف عملاتك"'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'في سبتمبر 2021، اتعرض Bitcoin.org — البيت الإلكتروني التاريخي للبيتكوين اللي بيديره المشغّل المجهول Cobra — لاختراق على مستوى الـ DNS وتحوّل لعملية نصب "ضاعف بيتكوينك" المزيفة، وجمع المحتالون حوالي 17,000 دولار قبل ما الموقع يتوقف. غطاء تفصيلي من Domain Mayday عن اللي حصل، وإزاي، وإيه اللي بيعلّمنا إياه حتى لو المواقع المتعلقة بالكريبتو نفسها بتعتمد على DNS.'
keywords: ['bitcoin.org', 'اختراق bitcoin.org', 'اختراق dns', 'اختراق النطاق', 'نصب ضاعف بيتكوين', 'نصب هدية كريبتو', 'cobra bitcoin.org', 'cloudflare dns', 'namecheap', 'أمان dns', 'أمان النطاقات', 'اختراق nameserver', 'هجوم تغيير whois']
---

لأكتر من عقد من الزمن، لو حد أراد الإجابة الصريحة والمحايدة على سؤال "إيه هو البيتكوين وإزاي أستخدمه بأمان"، الإنترنت كانت بتبعته لعنوان واحد: **Bitcoin.org**.

الموقع ما كانش بورصة. ما كانش بيبيع حاجة. كان أقرب حاجة لـ"بطاقة ترحيب رسمية" لأعتى عملة لا مركزية في العالم — موقع [متسجّل من 18 أغسطس 2008](https://en.wikipedia.org/wiki/Bitcoin#:~:text=The%20domain%20name%20bitcoin.org%20was%20registered)، قبل أول بلوك في السلسلة بالأساس، المكان اللي عاش فيه الورقة البيضاء للبيتكوين والمكان اللي بيتاعلم فيه المبتدئون أول قاعدة في عالم الكريبتو: *كن بنكك الخاص، وما تثقش في حد يحتفظ بمفاتيحك.*

فيه سخرية قاسية جداً في اللي حصل **يوم الخميس، 23 سبتمبر 2021**. أكتر درس أماني بيتتكرر في عالم الكريبتو — *لو حد بيعدك بمضاعفة عملاتك، فهو نصّاب* — اتبث معكوساً من البيت الأصلي للبيتكوين. لساعات قليلة، الموقع اللي كان بيعلّم الناس إنهم ميوقعوش في فخ "ضاعف بيتكوينك" *هو نفسه* بقى عملية النصب دي. ومحصلش ده لأن حد اخترق سيرفر، لكن لأن حد سيطر على **النطاق** نفسه.

## بيت موثوق ورمزي للبيتكوين

عشان تفهم ليه الاختراق ده وجع، لازم تفهم إيه اللي كان يعنيه Bitcoin.org.

البيتكوين ماعندوش رئيس تنفيذي، ولا مقر، ولا متحدث رسمي. اللي كان عنده — لسنين — مجموعة صغيرة من المواقع المرجعية التي يديرها المجتمع، وكان Bitcoin.org أبرزها. CryptoPotato وصفته بـ[أقدم موقع إلكتروني مرتبط بالبيتكوين، متسجّل من أكتر من 13 سنة](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/#:~:text=the%20oldest%20website%20in%20relation%20to). كان بيستضيف توصيات المحافظ الإلكترونية، وأدلة للمبتدئين، ونسخة من الورقة البيضاء لساتوشي ناكاموتو.

وكان الموقع، بشكل ملائم للبيتكوين، يديره شبح. المشغّل مجهول الهوية معروف فقط بـ**Cobra** — مجهول كمبدأ. وده المبدأ ده اتحداه في المحكمة مؤخراً: قبل أشهر قليلة، كسب المدّعي "ساتوشي" Craig Wright قضية حقوق نشر بريطانية أجبرت Bitcoin.org على إزالة الورقة البيضاء، وأصدر قاضٍ [أمراً بعدم انتهاك Cobra لحقوق النشر الخاصة بـ Wright في المملكة المتحدة](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=injunction%20prohibiting%20Cobra%20from%20infringing). دفاع Cobra عن هويته المجهولة كان شبه شعري: [قواعد المحكمة سمحت لي إن يُقاضَى عليّ بشكل مجهول، لكنني ما قدرتش أدافع عن نفسي بشكل مجهول](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=the%20court%20rules%20allowed%20for%20me%20to%20be%20sued%20pseudonymously).

المهم إن Bitcoin.org كان يحمل *ثقة* — النوع المؤسسي اللي المفروض حركة بلا قيادة متمركزة ماتملكوش، متراكمة بهدوء على مدار ثلاثة عشر سنة. وده بالظبط اللي خلاه هدفاً. عملية النصب بتشتغل بشكل أحسن كلما كانت المنصة المضيفة أكتر موثوقية. وما فيش كتير في عالم الكريبتو أوثق من اسم البيتكوين نفسه.

في السخرية فيه طبقة تانية أعمق. كل فلسفة Bitcoin.org كانت قايمة على *الاحتفاظ الذاتي*: احتفظ بمفاتيحك بنفسك، ما تثقش في أي وسيط، تحقق من كل حاجة. الزائر اللي استوعب الدرس ده كويس مش هيدّي عملاته ل[محفظة](/ar/glossary/wallet/) غريبة على وعد. لكن عملية النصب دي ما طلبتش منهم يثقوا في غريب — طلبت منهم يثقوا في *Bitcoin.org نفسه*، العنوان اللي قيلّهم لسنين إنه المكان الآمن للبداية. الهجوم ما هزمش الدرس؛ اختطف الرسول.

## سبتمبر 2021: الاختراق وعملية النصب المزيفة

![فن تخيلي ملون زاهي لمنارة ساحلية موثوقة اتاختطفت، وشعاعها بقى بيومض بعلامة مضيئة مزيفة كتوب عليها "ضاعف عملاتك" على الميه ناحية مراكب صغيرة](../../assets/the-bitcoin-org-dns-hijack-01-hijack.jpg)

صباح يوم 23 سبتمبر 2021، الزوار اللي فتحوا Bitcoin.org ما شافوش أدلة المحافظ. شافوا نافذة منبثقة — طبقة تغطية نظيفة وذات مظهر رسمي لُصقت على الصفحة الرئيسية لأكتر موقع مرجعي موثوق في البيتكوين.

الرسالة كانت أقدم حيلة في عالم الكريبتو، لكن بلبوس سلطة مستعارة. ادّعت إن **مؤسسة البيتكوين** بت[ترد الجميل للمجتمع](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=giving%20back%20to%20the%20community)، وإن العرض محدود بـ[أول 10,000 مستخدم](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=first%2010%2C000)، وبعتت وعداً واحداً بسيطاً: [أرسل بيتكوين لهذا العنوان، وهنبعتلك ضعف المبلغ!](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=Send%20Bitcoin%20to%20this%20address%2C%20and%20we%20will%20send%20double) كود QR عمل الموضوع سهل وسلس. الآلية، كما وصف CoinDesk بجفاف النوع ده من العمليات، دايماً واحدة: [هذه المخططات بتعمل وعوداً كاذبة بمضاعفة الأموال بعد إرسال مبلغ أولي لعنوان محفظة عبر كود QR](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=these%20schemes%20give%20false%20promises%20of%20doubling). والنتيجة دايماً واحدة كمان: [الضحايا، في الحقيقة، ما بيتلقوش حاجة في المقابل وبيخسروا الكريبتو اللي بعتوه](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=Victims%2C%20in%20fact%2C%20receive%20nothing).

Cobra أكّد الاختراق بشكل علني وصريح، ونشر إن الموقع [اتاختُرق. بنحقق دلوقتي في كيفية وضع المخترقين للنافذة المنبثقة الاحتيالية](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=has%20been%20compromised.%20Currently%20looking%20into%20how%20the%20hackers).

## إيه اللي خسره الزوار

عملية نصب "ضاعف فلوسك" بتشتغل بس لو ناس قليلة صدقتها. في موقع عشوائي، تقريباً محدش هيصدق. على *Bitcoin.org*، صدّق بعضهم.

محفظة عملية النصب ما فضلتش فاضية. BleepingComputer بلّغت إن [آخر رصيد محدَّث للمحفظة كان 0.40571238 BTC، أي ما يقارب 17,000 دولار أمريكي](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=0.40571238%20BTC%20or%20approximately%20US%2417%2C000). CoinDesk، اللي تابع الحادثة مباشرة، أشار إن [عنوان عملية النصب استقبل أكتر من 17,700 دولار في معاملات صغيرة حتى وقت الكتابة](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=received%20over%20%2417%2C700%20in%20small%20transactions).

سبعة عشر ألف دولار راحوا في نافذة ليلية واحدة، في عملية احتيال كان الموقع المضيف نفسه هيحذّرك منها. وفاكر أقسى جزء في تصميم البيتكوين: المعاملات دي نهائية. مافيش استرداد، مافيش قسم للاحتيال، مافيش "اتصل بالبنك". نفس عدم القابلية للعكس اللي بيخلي البيتكوين قوي هو اللي خلّى خسارة كل ضحية دائمة من لحظة مسح الكود.

الرقم بالدولار تقريباً ما هو القضية. الضرر الحقيقي كان على اللي بناه Bitcoin.org طول ثلاثة عشر سنة — الافتراض إن *هذا* العنوان، من بين كل العناوين، آمن للثقة فيه.

## إزاي حصل: اختراق DNS مش اختراق سيرفر

![فن تخيلي ملون زاهي لإشارة طريق محوّلة عند مفترق مضيء، سهم واحد اتطلي سراً عشان يوجّه حركة المرور ناحية مصيدة قمع ذهبية على شكل عملة، والطريق الآمن الأصلي مظلم](../../assets/the-bitcoin-org-dns-hijack-02-fake-giveaway.jpg)

ده هو التفصيل اللي بيخلي الموضوع ده قصة *Domain Mayday* ومش مجرد حادثة تصيّد اعتيادية: **المهاجمون محتاجوش أصلاً يخترقوا سيرفرات Bitcoin.org.**

Cobra كان قاطع في النقطة دي. السيرفر الأصلي، بحسب كلامه، ما اتلمسش — [السيرفر الأصلي الخاص بي ما استقبلش أي حركة مرور أثناء الاختراق](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=my%20actual%20server%20didn%27t%20get%20any%20traffic%20during%20the%20hack). بدل ده، الهجوم حصل طبقة فوق ده، في الجزء من الإنترنت اللي بيقرر *لفين بيشير اسم النطاق*. المراقبون اللي تابعوا الحادثة لاحظوا إن [معلومات WHOIS اتعدّلت وقت الاختراق، والـ nameservers والـ DNS اتغيروا](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack). لما تتحكم في الـ nameservers، بتتحكم في الإجابة على سؤال "إيه السيرفر اللي *هو* bitcoin.org؟" — وتقدر بهدوء توجّه اسم موثوق لسيرفر بتاعك إنت.

تشخيص Cobra نفسه حمّل المسؤولية لطبقة DNS، ولتغيير بنية تحتية حصل مؤخراً. كما قال: [Bitcoin.org ما اتاخترقش أبداً. وبعدين انتقلنا لـ Cloudflare، وبعد شهرين اتاختُرقنا.](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=Bitcoin.org%20hasn%27t%20been%20hacked%2C%20ever.%20And%20then%20we%20move%20to%20Cloudflare) نظريته الشغّالة كانت محددة ومثيرة للقلق: [المهاجمون يبدو إنهم استغلوا ثغرة في الـ DNS](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20attackers%20just%20seem%20to%20have%20exploited%20some%20flaw%20in%20the%20DNS). Decrypt لخّص التفسير السائد بنفس الطريقة: المهاجمون [استغلوا ثغرة في إعداد الـ DNS بعد انتقال الموقع لـ Cloudflare قبل شهرين](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/#:~:text=exploited%20a%20flaw%20in%20the%20DNS%20configuration%20after%20the%20website%20moved%20to%20Cloudflare).

السبب الجذري كان إعداد خاطئ، أو اختراق على مستوى المسجّل، أو حاجة على مستوى مزوّد الـ DNS — ده ما اتحدّدش بشكل كامل للعموم. CoinDesk أشار إن [السبب الجذري لاختراق الموقع لسه مش متأكد منه، وإن كان بعضهم رجّح إنه اختراق DNS](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=root%20cause%20of%20the%20website%20hijack%20remains%20unconfirmed). لكن *شكل* اللي حصل واضح. التطبيق كان تمام. الكود كان تمام. المفاتيح كانت تمام. **الاسم** هو اللي اتاختُرق، وعلى الإنترنت، التحكم في الاسم ده معظم المعركة.

## الاستجابة والتداعيات

الحل، وبشكل لافت، حصل كمان على مستوى النطاق.

الموقع ما قدرش يعمل "تصحيح" وخلاص، لأن النسخة الخبيثة الحية من Bitcoin.org ما كانتش بتُخدَم من البنية التحتية الحقيقية للموقع. أسرع طريقة لوقف النزيف كانت إخراج النطاق نفسه من الخدمة. المسجّل، **Namecheap**، عمل بالظبط كده — وبحسب BleepingComputer، [عطّلنا النطاق بشكل مؤقت](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=We%20have%20temporarily%20disabled%20the%20domain). لفترة، الزوار ما شافوش نصب ولا صفحة رئيسية؛ CoinDesk أفاد إنهم [قوبلوا بـ "لا يمكن الوصول لهذا الموقع."](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=This%20site%20can%27t%20be%20reached) أكتر صفحة مرجعية موثوقة في البيتكوين اتأطفأت.

بعد ساعات قليلة من التحقيق، النطاق اتأشّر صح وعاد الموقع لحالته قبل الاختراق. الفترة كانت قصيرة — يوم أو أقل — والخسارة بالدولار كانت متواضعة بمقاييس جرائم الكريبتو. لكن الحادثة أثّرت بشدة تحديداً بسبب *أي* موقع هو ده. حركة بتفتخر بـ "ما تثقش، تحقق" كانت شايفة صفحتها المرجعية الرسمية اتسلّحت وتوجّهت ضد مستخدميها.

## إيه اللي بيعلّمنا إياه حتى لو المواقع المتعلقة بالكريبتو بتعتمد على DNS

![فن تخيلي ملون زاهي لقمع نصب عملات ذهبي متوهّج، عملات ساطعة بتتصبّ في فوهة عريضة تبدو موثوقة في الأعلى وبتختفي في الظلام في الأسفل الضيق، على خلفية تجريدية نابضة بالحياة](../../assets/the-bitcoin-org-dns-hijack-03-namefi-angle.jpg)

أصعب درس في اختراق Bitcoin.org هو إن **كونك من عالم الكريبتو مش بيحميك تقريباً من أي حاجة منه.**

البيتكوين لامركزي. دفتر حساباته معروف إنه صعب التلاعب فيه. مفاتيحه، لما بتتمسك صح، بتاعتك وحدك. مش حاجة من دي عملت فرق هنا — لأن *الباب الأمامي* لكل ده كان اسم نطاق عادي تماماً، راكب على نفس الـ DNS والمسجّل وسباكة الـ nameserver زي أي متجر إلكتروني أو مخبزة محلية. الـ blockchain كان سليم. الموقع كان محصّن بالطريقة المهمة، لكن **الاسم اللي بيشير ليه ما كانش.**

في ثلاثة دروس راسخة بتطلع من ده:

1. **النطاق بتاعك جزء من سطح الهجوم — وغالباً *الجزء الأكبر*.** تقدر تكتب كود مثالي، وتخزّن مفاتيحك في تخزين بارد، وتحصّن كل سيرفر، ومهاجم بيتحكم في الـ nameservers أو حساب المسجّل بتاعك ممكن يتنكّر ليك بشكل كامل. الاسم هو الباب الأمامي، والاسم المختطَف بيخلّي الغريب يجاوب عليه.

2. **تغييرات الـ DNS والمسجّل صامتة وعالية التأثير.** لما [nameservers + DNS اتغيروا](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=nameservers%20%2B%20DNS%20changed)، ما "انكسرش" حاجة بطريقة تلتقطها معظم أنظمة المراقبة على الفور — الموقع لسه اتحمّل، بس من مكان غلط. قفل المسجّل، و[قفل السجل](/ar/glossary/registry-lock/)، و[DNSSEC](/ar/glossary/dnssec/)، والتحكم الصارم في الوصول لحسابات المسجّل ومزوّد الـ DNS مش نظافة اختيارية؛ دي الأقفال على الباب اللي الكل بيتناساه.

3. **السمعة هي الحاجة اللي اتسرقت فعلاً.** المهاجمون ما أرادوش سيرفر Bitcoin.org بـ 17,000 دولار؛ أرادوا *مصداقيته*، مستعارة لساعات قليلة عشان يخلوا عملية نصب قديمة قدم الزمن تبدو حقيقية. كلما كان نطاقك أكتر ثقة، كلما كانت قيمته للاختطاف أعلى — وكلما محتجت إنك تكون أكتر حرصاً في منع أي حد يغيّر لفين بيشير.

4. **البنية التحتية "اللاموثوقة" لسه بتعتمد على أسماء موثوقة.** حتى البيتكوين، المثال الكلاسيكي لإزالة الوسطاء، بيوصل لمستخدميه عبر DNS — نظام هرمي ووسيط وقابل للتغيير. لامركزة المال مش بتلامركز الباب الأمامي.

5. **سرعة الاكتشاف أهم من أناقة الدفاع.** Bitcoin.org نجا من ده بخسارة متواضعة إلى حد كبير لأن المجتمع اكتشف عملية النصب بسرعة والمسجّل قدر يسحب النطاق في غضون ساعات. كلما فضل الاسم المختطَف بيحلّ لمهاجم، كلما تكاثرت الخسارة — والضرر على السمعة. أن تعرف *في اللحظة* إن التحكم في اسمك أو التوجيه اتغيّر، ده أكتر قيمة من أي قفل ثابت منفرد.

## زاوية Namefi

اختراق Bitcoin.org في جوهره مشكلة *تحكم وقابلية تحقق*. التطبيق كان سليم. الـ blockchain كان سليم. اللي فشل كان الطبقة اللي بتجاوب على سؤال بسيط في مظهره: **من اللي عنده حق التحكم في هذا الاسم، ولفين مسموحله يشير؟** لما الإجابة على السؤال ده ممكن تتغيّر بصمت — nameservers اتبدلت، [معلومات WHOIS اتعدّلت وقت الاختراق](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack) — الثقة بتتبخّر مهما كانت بقية المنظومة قوية.

[Namefi](https://namefi.io) بتنطلق من فكرة إن [ملكية النطاق](/ar/glossary/domain-ownership/) والتحكم فيه المفروض يتصرّفوا كأصل موثوق قابل للتحقق ومتعلق بالإنترنت بشكل أصيل — مش مجرد إدخال في قاعدة بيانات قابلة للتعديل يقدر مهاجم يعدّلها بهدوء. الملكية المُرمَّزة والقابلة للتدقيق بتخلّي السؤال "من اللي بيتحكم في هذا النطاق، وهل التحكم ده اتغيّر للتو؟" قابلاً للإجابة [على السلسلة](/ar/glossary/on-chain/) — محوّلاً تبديل الـ nameserver الصامت لحدث مرئي وخاضع للمساءلة، مع البقاء متوافقاً مع الـ DNS اللي بقية الإنترنت بتعتمد عليه. ده مش بيخلي الـ DNS نفسه يختفي، لكن بيخلّي *التحكم في اسم* أصعب اختطافاً بشكل غير مرئي وأسهل تحققاً بشكل مستمر.

Bitcoin.org قضى ثلاثة عشر سنة بيعلّم العالم إن اللحظة الخطيرة هي اللحظة اللي بتوقف فيها عن التحقق وتبدأ في الثقة. لساعات قليلة في سبتمبر 2021، نطاقه الخاص أثبت الدرس بالطريقة الصعبة. الخلاصة للكل أبسط مما بتبدو: نطاقك هو هويتك على الإنترنت — احرس الاسم بنفس حرصك على المفاتيح اللي وراه.

## المصادر والقراءة الإضافية

- BleepingComputer — [Bitcoin.org hackers steal $17,000 in 'double your cash' scam](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/)
- CoinDesk — [Bitcoin.org Website Inaccessible After Being Hacked by Apparent Giveaway Scam](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/)
- Bitcoin.com News — [Hackers Compromise Web Portal Bitcoin.org — DNS Hijack Replaces Site With BTC Doubler Scam](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/)
- Decrypt — [Bitcoin.org Compromised, Fraudulent Crypto Giveaway Advertised](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/)
- Cointelegraph — [Bitcoin.org goes offline after suffering scam attack](https://cointelegraph.com/news/bitcoin-org-goes-offline-after-suffering-scam-attack)
- CryptoPotato — [BitcoinOrg Hacked: Giveaway Scam Promising Users to Double Their BTC](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/)
- NewsBTC — [Bitcoin.org Hacked By Scammers For A Few Minutes. Someone Sent Them 0.4 BTC](https://www.newsbtc.com/news/bitcoin-org-hacked-by-scammers/)
- CoinDesk — [UK Court Orders Bitcoin.org to Remove White Paper Following Craig Wright Lawsuit](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit)
- Wikipedia — [Bitcoin (history of the bitcoin.org domain)](https://en.wikipedia.org/wiki/Bitcoin)
