---
title: "أهم أساليب توسيع البلوكتشين: رول أب، السلاسل الجانبية، القنوات والتجزئة"
date: '2026-07-02'
language: ar
tags: ['guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['zakia-al-sinai']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 40
format: roundup
description: "دليل للمبتدئين حول توسيع البلوكتشين: رول أب التفاؤلي، وZK رول أب، والسلاسل الجانبية، وقنوات الدفع، والتجزئة، وطبقات إتاحة البيانات، مع مقارنة بينها."
ogImage: ../../assets/blockchain-scaling-approaches-og.jpg
keywords: ['توسيع البلوكتشين', 'حلول توسيع البلوكتشين', 'توسيع Layer 2', 'رول أب', 'رول أب تفاؤلي', 'ZK رول أب', 'سلاسل جانبية', 'قنوات دفع', 'قنوات الحالة', 'التجزئة', 'إتاحة البيانات', 'مثلث قابلية التوسع', 'Arbitrum', 'Optimism', 'zkSync', 'Starknet', 'Celestia', 'EigenDA', 'Polygon PoS', 'Lightning Network']
relatedArticles:
  - /ar/blog/blockchain-virtual-machines/
  - /ar/blog/blockchain-consensus-mechanisms/
  - /ar/blog/blockchain-privacy-technologies/
  - /ar/blog/blockchain-cryptographic-primitives/
  - /ar/blog/premium-web3-tlds/
relatedGlossary:
  - /ar/glossary/rollup/
  - /ar/glossary/optimistic-rollup/
  - /ar/glossary/zk-rollup/
  - /ar/glossary/data-availability/
  - /ar/glossary/layer-2/
relatedTopics:
  - /ar/topics/web3-foundations/
  - /ar/topics/domain-tokenization/
relatedSeries:
  - /ar/series/tokenize-your-com/
  - /ar/series/domain-flipping-skills/
---

شبكة Ethereum الرئيسية بتعالج تقريباً 15 معاملة في الثانية. شبكة مدفوعات زي Visa بتتعامل مع عشرات الآلاف. الفجوة دي هي السبب في احتياج البلوكتشين للتوسيع: طريقة تنجز شغل أكتر من غير ما تطلب من كل مشارك يتحقق من كل معاملة على السلسلة الأساسية. خلال السنوات اللي فاتت، المجال استقر على شوية أساليب متميزة، منها [رول أب](/ar/glossary/rollup/) والسلاسل الجانبية وقنوات الدفع والتجزئة، وكل واحد منها بيوازن بشكل مختلف بين الأمان واللامركزية والتكلفة.

الدليل ده بيستعرض أساليب التوسيع الرئيسية، ويشرح الآلية وراء كل واحد، ويقارنها جنباً إلى جنب عشان يبان الفرق بوضوح لما تقابلها في مستندات أي مشروع.

---

## مثلث قابلية التوسع

صياغة فيتاليك بوتيرين لـ **مثلث قابلية التوسع** هي النموذج الذهني اللي مبني عليه أغلب المجال ده. البلوكتشين عايز ثلاث خصائص مع بعض: «قابلية التوسع: أن تعالج السلسلة معاملات أكثر مما تستطيع عقدة عادية واحدة... التحقق منه»، و«اللامركزية: أن تعمل السلسلة من دون تبعية للثقة في مجموعة صغيرة من الجهات المركزية الكبيرة»، و«الأمان: أن تقاوم السلسلة نسبة كبيرة من العقد المشاركة التي تحاول مهاجمتها»؛ لكن التصاميم التقليدية لا تحقق إلا اثنتين من الثلاث ([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Scalability%3A%20the%20chain%20can%20process%20more%20transactions%20than%20a%20single%20regular%20node)). اختارت Bitcoin وEthereum في بداياتها اللامركزية والأمان على حساب معدل المعالجة؛ أما السلاسل ذات TPS المرتفع التي تعتمد على مجموعة صغيرة من المدقّقين الأقوياء، فتحصل على قابلية التوسع والأمان لكنها تضحي باللامركزية؛ والتصاميم الساذجة متعددة السلاسل يمكنها التوسع مع البقاء لامركزية، لكنها تصبح غير آمنة إذا احتاج المهاجم لاختراق سلسلة واحدة فقط.

كل أسلوب تحت هو في النهاية إجابة عن نفس السؤال: إزاي نزوّد معدل المعالجة من غير ما نفرّط في الركنين التانيين من المثلث؟

## رول أب: تنفيذ خارج السلسلة وتسوية عليها

![رسم متجهي مسطّح لتذاكر معاملات صغيرة كثيرة تتجه إلى ضاغط مكتوب عليه "Rollup Compressor" ليحوّلها إلى كتلة دفعة مضغوطة، ثم تُنشر على سلسلة طبقة أساسية من كتل مترابطة](../../assets/blockchain-scaling-approaches-01-rollup-batching.jpg)

تنفذ **[رول أب](/ar/glossary/rollup/)** المعاملات خارج الطبقة 1 (L1)، ثم تنشر ملخصاً مضغوطاً، مع بيانات المعاملات الأساسية، على السلسلة الأساسية. يعرّف L2BEAT، وهو المتتبع الرائد لهذه الأنظمة، الرول أب بأنها «شبكات L2 تنشر بشكل دوري التزامات بالحالة على Ethereum»، وتتحقق تلك الالتزامات إما عبر إثباتات الصلاحية أو «تُقبل بافتراض الصحة ويمكن الطعن فيها بآلية إثبات احتيال ضمن نافذة محددة لإثبات الاحتيال» ([l2beat.com](https://l2beat.com/scaling/summary)). لأن البيانات والالتزام كليهما يصلان إلى L1، يقدر أي شخص يعيد بناء حالة الرول أب من Ethereum وحدها؛ وده اللي بيسمح للرول أب بوراثة أمان L1 بدلاً من مطالبة المستخدمين بالثقة في مجموعة مدقّقين جديدة. دي التقنية اللي تقف خلف شبكات [Layer 2](/ar/glossary/layer-2/) التي يتعامل معها معظم الناس اليوم: Base وArbitrum وOptimism وzkSync وStarknet كلها رول أب.

تنقسم الرول أب إلى عائلتين بحسب طريقة إثبات صحة التنفيذ خارج السلسلة.

### رول أب التفاؤلي

![رسم متجهي مسطّح لبابين متجاورين: باب برتقالي مكتوب عليه "Optimistic" مع ساعة لسبعة أيام وعَلَم فترة طعن يمثل نافذة إثبات الاحتيال، وباب أخضر مكتوب عليه "ZK" مع علامة تحقق خضراء فورية لإثبات الصلاحية](../../assets/blockchain-scaling-approaches-02-optimistic-vs-zk.jpg)

تفترض [رول أب التفاؤلي](/ar/glossary/optimistic-rollup/) أن «المعاملات خارج السلسلة صحيحة ولا تنشر إثباتات صحة لدفعات المعاملات» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=Optimistic%20rollups%20assume%20offchain%20transactions%20are%20valid%20and%20don%27t%20publish%20proofs%20of%20validity)). يجمع المشغّلون المعاملات في دفعات، وينفذونها خارج السلسلة، وينشرون البيانات المضغوطة على Ethereum. بعدها تفتح نافذة طعن يستطيع خلالها أي شخص يشغّل عقدة كاملة الاعتراض على الدفعة بإثبات احتيال؛ فسحب الأموال من L2 إلى L1 لازم ينتظر «انتهاء فترة الطعن، التي تدوم حوالي سبعة أيام» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=the%20challenge%20period%E2%80%94lasting%20roughly%20seven%20days%E2%80%94elapses)). نافذة الأسبوع دي هي سبب أن السحب العادي من رول أب تفاؤلي بياخد حوالي أسبوع، إلا لو استخدمت مزود سيولة من طرف ثالث لخروج أسرع مقابل رسوم.

رول أب التفاؤلي يحتاج فقط إلى نظام لإثبات الاحتيال بدلاً من خط أنابيب كامل لإنتاج الإثباتات التشفيرية، وده خلّاه تاريخياً أسهل في دعم العقود الذكية للأغراض العامة فوقه. **Arbitrum** و**Optimism** و**Base**، وهي رول أب Coinbase التي يصفها ethereum.org بأنها «رول أب تفاؤلي مبنية باستخدام OP Stack» ([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Base%20is%20an%20Optimistic%20Rollup%20built%20with%20the%20OP%20Stack))، هي أكبر الرول أب التفاؤلية من حيث الاستخدام اليوم.

### ZK رول أب

تأخذ [ZK رول أب](/ar/glossary/zk-rollup/) النهج المعاكس: بدلاً من افتراض الصحة والسماح بفترة طعن، تقدم إثبات صلاحية، أي إثباتاً تشفيرياً أن انتقال حالة الدفعة صحيح، مع كل دفعة. بما أن Ethereum يتحقق من هذا الإثبات على السلسلة، «لا توجد تأخيرات عند نقل الأموال من ZK-rollup إلى Ethereum... لأن معاملات الخروج تُنفَّذ بمجرد أن يتحقق عقد ZK-rollup من إثبات الصلاحية» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=There%20are%20no%20delays%20when%20moving%20funds%20from%20a%20ZK%2Drollup%20to%20Ethereum)). تستطيع ZK-rollups «معالجة آلاف المعاملات في دفعة واحدة، ثم لا تنشر على الشبكة الرئيسية إلا قدراً محدوداً من بيانات الملخص» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20can%20process%20thousands%20of%20transactions%20in%20a%20batch))، باستخدام أنظمة إثبات مثل zk-SNARKs (إثباتات صغيرة وتحقق سريع) أو zk-STARKs (شفافة ولا تتطلب إعداداً موثوقاً). **zkSync Era** و**Starknet**، التي يصفها ethereum.org بأنها «ZK Rollup للأغراض العامة مبنية على STARKs وCairo VM» ([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Starknet%20is%20a%20general%20purpose%20ZK%20Rollup%20based%20on%20STARKs%20and%20the%20Cairo%20VM))، و**Linea** من أبرز ZK rollups؛ كما يطبق Polygon zkEVM وScroll بيئة zkEVM لتشغيل عقود Ethereum الذكية الموجودة داخل بيئة يمكن إثباتها بـ ZK.

المقابل: إنتاج إثباتات الصلاحية مكلف حسابياً، وبالنسبة إلى التكافؤ الكامل مع EVM، أصعب تقنياً في البناء من نظام إثبات الاحتيال؛ وده جزء من سبب وصول الرول أب التفاؤلية إلى التبني الواسع أولاً رغم أن ZK rollups تقدّم نهائية أسرع.

## السلاسل الجانبية

**السلسلة الجانبية** «بلوكتشين منفصلة تعمل باستقلال عن Ethereum، ومرتبطة بشبكة Ethereum الرئيسية عبر جسر ثنائي الاتجاه»، وعلى عكس الرول أب، «تستخدم السلسلة الجانبية آلية توافق منفصلة ولا تستفيد من ضمانات أمان Ethereum» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/#:~:text=A%20sidechain%20uses%20a%20separate%20consensus%20mechanism%20and%20doesn%27t%20benefit%20from%20Ethereum%27s%20security%20guarantees)). ده هو الفرق الجوهري عن Layer 2: السلسلة الجانبية تستبدل الأمان الموروث بحرية تصميم مستقلة، وعادةً برسوم أقل وكتل أسرع، لأنها تخضع لمجموعة مدقّقيها الخاصة بدلاً من Ethereum.

**Polygon PoS** هو المثال الأشهر. تصف صفحة المنتج الخاصة بـ Polygon الشبكة بأنها «أكثر سلسلة جانبية استخداماً في Ethereum، ومجربة عملياً مع مليارات من القيمة المؤمَّنة، ومعاملات شبه فورية ورسوم أقل من سنت» ([polygon.technology](https://polygon.technology/polygon-pos))، وهي مؤمَّنة بمجموعة المدقّقين الخاصة بها لإثبات الحصة وليس بمدقّقي Ethereum. **Gnosis Chain**، التي كانت تُعرف سابقاً باسم xDai، سلسلة جانبية مستخدمة على نطاق واسع أيضاً، إلى جانب Skale وMetis Andromeda. وبما أنك تثق في مجموعة مدقّقين مختلفة وأصغر عادةً، فأمان السلسلة الجانبية لا يزيد على قوة تلك المجموعة؛ وهو ضمان مختلف جوهرياً عن الرول أب، التي يمكن من حيث المبدأ فيها اكتشاف الحالات غير الصحيحة والتراجع عنها باستخدام البيانات المثبتة على L1.

## قنوات الحالة والدفع

**قناة الحالة** تسمح لطرفين أو أكثر بإجراء معاملات خارج السلسلة عبر حجز الأموال في عقد مشترك وتبادل تحديثات موقعة مباشرةً، بحيث «يستطيع أقران القناة إجراء عدد اعتباطي من المعاملات خارج السلسلة، بينما لا يقدمون سوى معاملتين على السلسلة لفتح القناة وإغلاقها» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=Channel%20peers%20can%20conduct%20an%20arbitrary%20number%20of%20offchain%20transactions%20while%20only%20submitting%20two%20onchain%20transactions)). قناة الدفع تخصص الفكرة لتحويلات الرصيد البسيطة، و«أفضل وصف لها هو دفتر حسابات ثنائي الاتجاه يحتفظ به مستخدمان بشكل جماعي» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=A%20payment%20channel%20is%20best%20described%20as%20a%20%E2%80%9Ctwo%2Dway%20ledger%E2%80%9D%20collectively%20maintained%20by%20two%20users)). يقدر المشاركون يتعاملوا مع بعضهم أي عدد من المرات، خارج السلسلة وفوراً، ولا يلمسون السلسلة الأساسية إلا لفتح القناة، أي حجز الضمان، وإغلاقها، أي تسوية الرصيد النهائي.

أشهر تطبيق هو **Lightning Network** الخاصة بـ Bitcoin، التي تصف نفسها بأنها «شبكة لامركزية تستخدم وظيفة العقود الذكية في البلوكتشين لتمكين المدفوعات الفورية عبر شبكة من المشاركين»، مبنية من «قنوات دفع ثنائية الاتجاه» توجه المدفوعات كما توجه حزم البيانات عبر الإنترنت ([lightning.network](https://lightning.network/)). لكن هناك قيد: القنوات لا توسع المعاملات *إلا بين الأطراف التي لها مسار من القنوات المفتوحة بينها*، ولازم تُخصص الأموال مسبقاً لفتح القناة، كما تحتاج شبكات القنوات إلى توجيه سيولة كي تعمل جيداً على نطاق واسع؛ ولا ينطبق أي من ذلك على رول أب للأغراض العامة تستطيع تشغيل عقود ذكية اعتباطية لأي شخص.

## التجزئة وطبقات إتاحة البيانات

![رسم متجهي مسطّح لمعاملات مقسمة على أربع مسارات متوازية للتجزئة، من Shard 1 إلى Shard 4، يعالج كل منها سلسلة الكتل الخاصة به باستقلال، ثم تتجه كلها إلى شريط طبقة إتاحة بيانات في الأسفل](../../assets/blockchain-scaling-approaches-03-sharding.jpg)

**التجزئة** تقسم عمل التحقق في البلوكتشين بين مجموعات فرعية متوازية متعددة، أو «شظايا»، من العقد كي لا تضطر عقدة واحدة لمعالجة كامل حمل معاملات الشبكة. يرى فيتاليك بوتيرين أن «التجزئة تقنية تمنحك الأركان الثلاثة كلها» من المثلث ([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Sharding%20is%20a%20technique%20that%20gets%20you%20all%20three))، إذ تستخدم لجان مدقّقين مختارة عشوائياً للتحقق من شظايا مختلفة بالتوازي. التقنية التي تجعل التجزئة آمنة من غير إجبار كل عقدة على تنزيل بيانات كل شظية كاملة هي أخذ عينات [إتاحة البيانات](/ar/glossary/data-availability/) (DAS)، وهي «طريقة للشبكة للتحقق من أن البيانات متاحة من دون وضع عبء كبير على أي عقدة منفردة» ([ethereum.org](https://ethereum.org/en/developers/docs/data-availability/#:~:text=Data%20availability%20sampling%20is%20a%20way%20for%20the%20network%20to%20check%20that%20data%20is%20available%20without%20putting%20too%20much%20strain%20on%20any%20individual%20node)): تنزّل العقدة الخفيفة أجزاء صغيرة مختارة عشوائياً من بيانات الكتلة، وبفضل الترميز الماحي تظل قادرة على الوثوق بأن البيانات الكاملة قد نُشرت.

مشكلة إتاحة البيانات نفسها تنطبق مباشرةً على الرول أب، وده سبب ظهور طبقات إتاحة البيانات المخصصة كفئة بنية تحتية مستقلة. **Celestia** بلوكتشين معيارية مبنية تحديداً كي «تستخدم الرول أب وL2s شبكة Celestia لنشر بيانات المعاملات وإتاحتها كي ينزّلها أي شخص» ([celestia.org](https://celestia.org/what-is-celestia/#:~:text=Rollups%20and%20L2s%20use%20Celestia%20as%20a%20network%20for%20publishing%20and%20making%20transaction%20data%20available%20for%20anyone%20to%20download))، ما يسمح للرول أب بأن تنشر بياناتها على طبقة DA أرخص ومصممة لهذا الغرض بدلاً من شبكة Ethereum الرئيسية. **EigenDA**، المبنية على بنية إعادة التخزين الخاصة بـ EigenLayer، تقدم خدمة مشابهة مؤمَّنة عبر أصحاب حصة Ethereum الذين يختارون أيضاً تأمين طبقة DA. الرول أب التي تنشر البيانات على طبقة DA خارجية بدلاً من Ethereum L1 تُسمى أحياناً *validiums* أو *optimiums* بدلاً من رول أب «خالصة»، لأن L2BEAT يتتبعها كفئة متميزة إلى جانب الرول أب وحلول L2 الأخرى ([l2beat.com](https://l2beat.com/scaling/summary))؛ فهي تستبدل جزءاً من ضمان الأمان المرتكز على L1 بتكلفة أقل لنشر البيانات.

## مقارنة الأساليب

| الأسلوب | مكان تنفيذ الحوسبة | هل يرث أمان L1؟ | إتاحة البيانات | المفاضلة الرئيسية | أمثلة |
|---|---|---|---|---|---|
| رول أب تفاؤلي | خارج السلسلة (L2) | نعم — البيانات + إثبات الاحتيال على L1 | البيانات الكاملة منشورة على L1 | نافذة طعن على السحب تقارب 7 أيام | Arbitrum وOptimism وBase |
| ZK رول أب | خارج السلسلة (L2) | نعم — البيانات + إثبات الصلاحية على L1 | البيانات الكاملة منشورة على L1 | إنتاج إثباتات مكلف؛ والتكافؤ الكامل مع EVM أصعب | zkSync وStarknet وLinea |
| سلسلة جانبية | سلسلة مستقلة | لا — توافقها ومدقّقوها الخاصون | سلسلتها الخاصة، لا تُنشر على L1 | الأمان بقوة مجموعة المدقّقين الخاصة بها فقط | Polygon PoS وGnosis Chain |
| قناة حالة/دفع | خارج السلسلة، بين المشاركين | بشكل غير مباشر — الأموال محجوزة على L1 | لا تُنشر؛ الحالة النهائية فقط على السلسلة | توسع فقط معاملات الأطراف المتصلة بالقنوات؛ يجب حجز الأموال مسبقاً | Lightning Network |
| التجزئة / طبقة DA | شظايا متوازية، أو شبكة DA منفصلة | يختلف — تجزئة L1 ترثه؛ طبقات DA الخارجية تضيف افتراض ثقة جديداً | تتحقق عبر أخذ عينات إتاحة البيانات | DA الخارجية تخفض التكلفة لكنها تضيف اعتماداً خارج L1 | خارطة طريق تجزئة Ethereum وCelestia وEigenDA |

لا يوجد أسلوب واحد يتفوق في كل محور، وده سبب أن أنظمة الإنتاج بتجمع بينها بشكل متزايد؛ فمثلاً، ZK رول أب تنشر بياناتها على Celestia بدلاً من Ethereum تستعير أمان إثبات الصلاحية من طبقة، وإتاحة بيانات أرخص من طبقة أخرى.

---

## كيف يرتبط هذا بالنطاقات المُرمَّزة؟

اختيارات التوسيع مهمة لـ [الدومين المُرمَّز](/ar/glossary/tokenized-domain/) لأن كل عملية سَكّ أو نقل أو تحديث DNS أو إجراء ضمان هي معاملة على السلسلة، وتكلفتها ووقت نهائيتها يعتمدان على مكان تسويتها. نقل دومين `.com` مُرمَّز ومؤكَّد على رول أب تفاؤلي ممكن يبان رخيص وسريع على L2، لكن معاملة الرول أب [ما بتبقاش نهائية غير بعد ما بلوك الرول أب يتقبل على Ethereum](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=transactions%20conducted%20on%20the%20rollup%20are%20only%20final%20after%20the%20rollup%20block%20is%20accepted%20on%20Ethereum). جسر الخروج السريع ما بيخلّيش حالة الرول أب توصل للنهائية على L1 أبدر؛ في عملية السحب، مزود السيولة بدل كده [بيستلم ملكية طلب السحب المعلّق من L2 وبيدفع للمستخدم على L1](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=A%20liquidity%20provider%20assumes%20ownership%20of%20a%20pending%20L2%20withdrawal%20and%20pays%20the%20user%20on%20L1)، غالباً مقابل رسوم، بينما مسار السحب الرسمي بيفضل مستني فترة الطعن. النقل نفسه على ZK رول أب يوصل للنهائية مقابل L1 أول ما إثبات الصلاحية يوصل. السلاسل الجانبية ممكن تبقى أرخص كمان، لكن NFT لدومين موجودة بس على سلسلة جانبية بتورث أمان مجموعة المدقّقين الأصغر الخاصة بالسلسلة دي، مش أمان Ethereum. فهم المفاضلات دي جزء من فهم إنت فعلاً بتملك إيه لما الدومين يتمثّل على السلسلة، وهي نفس عادة العناية الواجبة المهمة في [أساسيات Web3](/ar/topics/web3-foundations/) عموماً.

---

## المصادر وقراءة إضافية

- [حدود قابلية توسيع البلوكتشين — فيتاليك بوتيرين](https://vitalik.eth.limo/general/2021/04/07/sharding.html)
- [Layer 2 — ethereum.org](https://ethereum.org/en/layer-2/)
- [رول أب التفاؤلي — ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/)
- [ZK-Rollups — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [السلاسل الجانبية — ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/)
- [قنوات الحالة — ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/)
- [إتاحة البيانات — ethereum.org](https://ethereum.org/en/developers/docs/data-availability/)
- [ملخص التوسيع من L2BEAT](https://l2beat.com/scaling/summary)
- [ما هي Celestia؟ — celestia.org](https://celestia.org/what-is-celestia/)
- [Lightning Network](https://lightning.network/)
- [Polygon PoS — polygon.technology](https://polygon.technology/polygon-pos)
