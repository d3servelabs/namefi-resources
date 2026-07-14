---
title: "أهم الأساسيات التشفيرية وراء كل بلوكتشين"
date: '2026-07-02'
language: ar
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 10
format: roundup
description: "دليل إلى اللبنات التشفيرية الأساسية التي تُشغّل البلوكتشين: دوال التجزئة، والتوقيعات الرقمية، وأشجار Merkle، وتشفير المنحنيات الإهليلجية، ومخططات الالتزام."
ogImage: ../../assets/blockchain-cryptographic-primitives-og.jpg
keywords: ['تشفير البلوكتشين', 'الأساسيات التشفيرية', 'دالة التجزئة', 'SHA-256', 'Keccak-256', 'التوقيع الرقمي', 'ECDSA', 'EdDSA', 'توقيع BLS', 'شجرة Merkle', 'تشفير المنحنيات الإهليلجية', 'secp256k1', 'مخطط الالتزام', 'تشفير ما بعد الكم', 'تشفير المفتاح العام', 'أمن البلوكتشين']
relatedArticles:
  - /ar/blog/blockchain-privacy-technologies/
  - /ar/blog/blockchain-consensus-mechanisms/
  - /ar/blog/blockchain-virtual-machines/
  - /ar/blog/blockchain-scaling-approaches/
  - /ar/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /ar/glossary/cryptographic-security/
  - /ar/glossary/public-key/
  - /ar/glossary/private-key/
  - /ar/glossary/blockchain/
  - /ar/glossary/smart-contract/
relatedTopics:
  - /ar/topics/web3-foundations/
  - /ar/topics/domain-tokenization/
relatedSeries:
  - /ar/series/tokenize-your-com/
  - /ar/series/domain-flipping-skills/
---

أي ادعاء في البلوكتشين — مثل «هذه المعاملة نهائية»، أو «هذا العنوان يملك هذا الأصل»، أو «هذا السجل التاريخي لم يُعدَّل» — يرجع في النهاية إلى عدد محدود من الأساسيات التشفيرية، لكلٍ منها مهمة ضيقة ومحددة. ولا واحدة منها اختراعٌ للبلوكتشين؛ فدوال التجزئة والتوقيعات الرقمية وأشجار Merkle سبقت Bitcoin بعقود. ما فعلته البلوكتشينات هو جمعها في نظام لا يحتاج فيه أي ادعاء من هذه الادعاءات إلى الثقة في طرف واحد كي يظل صحيحًا.

يشرح هذا الدليل الأساسيات التي تتحمل العبء فعلًا: [دوال التجزئة](/ar/glossary/hash-function/) التي تمنح البيانات بصمة، و[التوقيعات الرقمية](/ar/glossary/digital-signature/) التي تُجيز المعاملات، و[أشجار Merkle](/ar/glossary/merkle-tree/) التي تجعل مجموعات البيانات الضخمة قابلة للتحقق منها على أجزاء، ورياضيات المنحنيات الإهليلجية التي تعمل عليها تلك التوقيعات، ومخططات الالتزام — اللبنة التي تقود إلى [إثباتات المعرفة الصفرية](/ar/glossary/zero-knowledge-proof/). وفهم كل واحدة منها هو أسرع طريق لفهم ما الذي يفعله البلوكتشين فعلًا تحت الغطاء.

---

## دوال التجزئة التشفيرية (SHA-256 وKeccak)

![مستند يدخل آلة دالة تجزئة فينتج بصمة ثابتة الطول، ويؤدي تغيير حرف واحد في المدخل إلى بصمة مختلفة تمامًا، بما يوضح تأثير الانهيار الجليدي](../../assets/blockchain-cryptographic-primitives-01-hash-function.jpg)

تأخذ [دالة التجزئة](/ar/glossary/hash-function/) مُدخلًا بأي حجم وتنتج بصورة حتمية مخرجًا ثابت الحجم — «ملخصًا» — بحيث إن قلب بت واحد في المُدخل يبعثر المخرج بالكامل، ويصبح العثور على مُدخلين مختلفين لهما المخرج نفسه غير ممكن عمليًا من الناحية الحسابية. وهذه الخاصية، أي مقاومة التصادم، هي ما يجعل التجزئة بصمة مدمجة تكشف العبث لبيانات كبيرة بأي حجم.

يستخدم Bitcoin ‏SHA-256 في كل أجزائه: تُربط رؤوس الكتل بإدراج تجزئة SHA256(SHA256()) لرأس الكتلة السابقة في كل رأس جديد، وبالتالي فإن تعديل أي كتلة قديمة يغيّر تجزئتها ويكسر كل الرؤوس اللاحقة لها ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Each%20block%20also%20stores%20the%20hash%20of%20the%20previous%20block%27s%20header%2C%20chaining%20the%20blocks%20together)). ويُستخدم البناء نفسه، أي double-SHA-256، لتجزئة المعاملات داخل [شجرة Merkle](/ar/glossary/merkle-tree/) الخاصة بالكتلة ([مرجع Bitcoin.org](https://developer.bitcoin.org/reference/block_chain.html#:~:text=A%20SHA256%28SHA256%28%29%29%20hash%20in%20internal%20byte%20order)).

أما Ethereum فيعتمد Keccak-256 (نسخة Keccak الأصلية، وهي مختلفة عن معيار NIST SHA-3 اللاحق) كدالة التجزئة العامة. ويُشتق كل عنوان حساب من آخر 20 بايت من تجزئة Keccak-256 الخاصة بـ[المفتاح العام](/ar/glossary/public-key/) للحساب ([ethereum.org](https://ethereum.org/en/developers/docs/accounts/#:~:text=You%20get%20a%20public%20address%20for%20your%20account%20by%20taking%20the%20last%2020%20bytes%20of%20the%20Keccak-256%20hash%20of%20the%20public%20key))، كما تدعم الدالة نفسها عنونة المحتوى بأسلوب المفتاح/القيمة في [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=key%20%3D%3D%20keccak256%28rlp%28value%29%29) التي تخزن حالة Ethereum.

والتجزئة هي كذلك ما يحوّل رؤوس الكتل إلى سلسلة حقيقية بدل أن تكون مجموعة سجلات رخوة؛ إذ تعتمد تجزئة كل رأس على تجزئة الرأس السابق، ولذلك تتطلب إعادة كتابة التاريخ إعادة إنجاز كل كتلة بعد النقطة التي تريد تغييرها، فضلًا عن التفوق على العمل المستمر للشبكة الصادقة. وخاصية «التسلسل» هذه هي حرفيًا سبب تسمية بنية البيانات **blockchain**.

---

## تشفير المفتاح العام والتوقيعات الرقمية (ECDSA وEdDSA وBLS)

![مفتاح خاص يوقّع معاملة لإنتاج توقيع رقمي، ويتحقق مفتاح عام مطابق من صحته بعلامة اختيار خضراء، بينما يرفض مفتاح عام غير مطابق التوقيع بعلامة X حمراء](../../assets/blockchain-cryptographic-primitives-02-signatures.jpg)

لا تملك البلوكتشين شاشة تسجيل دخول، لذا تحتاج إلى طريقة أخرى لإثبات أن «هذه المعاملة صدرت بالفعل من مالك هذا الحساب». ويحل [تشفير المفتاح العام](/ar/glossary/public-key/) ذلك عبر زوج مفاتيح: [مفتاح خاص](/ar/glossary/private-key/) يبقى سريًا، ومفتاح عام يمكن مشاركته بحرية. ينتج عن توقيع معاملة بالمفتاح الخاص [توقيع رقمي](/ar/glossary/digital-signature/) يستطيع أي شخص التحقق منه باستخدام المفتاح العام؛ وبذلك يثبت التفويض من دون كشف المفتاح الخاص نفسه.

تشتق حسابات Ethereum مفتاحها العام من المفتاح الخاص باستخدام خوارزمية التوقيع الرقمي بالمنحنى الإهليلجي، ECDSA، فوق المنحنى secp256k1 — وهو المنحنى نفسه الذي يستخدمه Bitcoin ([وثائق حسابات ethereum.org](https://ethereum.org/en/developers/docs/accounts/#:~:text=The%20public%20key%20is%20generated%20from%20the%20private%20key%20using%20the%20Elliptic%20Curve%20Digital%20Signature%20Algorithm); [EIP-2 وإصلاح قابلية تطويع توقيع secp256k1](https://eips.ethereum.org/EIPS/eip-2#:~:text=secp256k1n%2F2)). التحقق من ECDSA سريع وقد خضع لعقود من التدقيق، لكنه يحمل نقطة ضعف تشغيلية مهمة للتصاميم الأحدث: توقيعات ECDSA الفردية لا تتجمع بكفاءة، لذا فإن التحقق من آلاف منها يعني إجراء آلاف عمليات الفحص المنفصلة.

وهذه هي الفجوة التي تملؤها توقيعات EdDSA وBLS. تستخدم EdDSA (في سلاسل مثل Solana وStellar) بناءً مختلفًا للمنحنيات، وهو حتمي ومقاوم لبعض مشكلات التنفيذ التي سببت تاريخيًا أخطاء إعادة استخدام nonce في ECDSA. أما توقيعات BLS فتذهب أبعد: بفضل خاصية الاقتران الرياضية في المنحنيات التي تستخدمها، يمكن جمع كثير من توقيعات BLS في توقيع مُجمَّع واحد يتحقق منها كلها دفعة واحدة. وتعتمد طبقة توافق إثبات الحصة في Ethereum على ذلك تحديدًا؛ إذ يوقّع المُصدِّقون attestations بمفاتيح BLS حتى تتمكن beacon chain من جمع أصوات مئات الآلاف من المُصدِّقين في توقيعات مدمجة يمكن التحقق منها بسرعة، وهو ما يجعل إثبات الحصة واسع النطاق عمليًا أصلًا ([ethereum.org، *The Beacon Chain*](https://eth2book.info/capella/part2/building_blocks/signatures/#:~:text=BLS%20signatures%20can%20be%20aggregated%20together%2C%20making%20them%20efficient%20to%20verify%20at%20large%20scale)). كما تتيح Ethereum عمليات المنحنى BLS12-381 كتعليمات EVM مسبقة التجهيز، دعمًا للتحقق من توقيعات BLS في العقود الذكية ([EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#:~:text=Add%20functionality%20to%20efficiently%20perform%20operations%20over%20the%20BLS12-381%20curve%2C%20including%20those%20for%20BLS%20signature%20verification)).

---

## أشجار Merkle

![هرم من عُقد التجزئة في شجرة Merkle تتحد زوجيًا حتى جذر واحد، مع مسار إثبات من ورقة إلى الجذر مميز بالبرتقالي يوضح إثبات Merkle لعميل خفيف](../../assets/blockchain-cryptographic-primitives-03-merkle-tree.jpg)

تسمح [شجرة Merkle](/ar/glossary/merkle-tree/) للبلوكتشين بتلخيص آلاف المعاملات في تجزئة واحدة من 32 بايت، من دون إجبار كل مشارك على تخزين كل معاملة. الأوراق هي تجزئات عناصر البيانات الفردية (المعاملات وحالات الحسابات)، ويجري وصل كل زوج من التجزئات ثم تجزئته مرة أخرى، وتتكرر العملية حتى تبقى تجزئة واحدة — الجذر ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Copies%20of%20each%20transaction%20are%20hashed%2C%20and%20the%20hashes%20are%20then%20paired%2C%20hashed%2C%20paired%20again%2C%20and%20hashed%20again%20until%20a%20single%20hash%20remains%2C%20the%20merkle%20root%20of%20a%20merkle%20tree)). ويُخزَّن هذا الجذر مباشرة في رأس الكتلة، وهو ما يتيح للعقدة الكاملة الالتزام بمحتوى كتلة كامل بمساحة إضافية شبه معدومة.

والفائدة هي حجم الإثبات. فلكي تثبت أن معاملة واحدة موجودة في كتلة، لا تحتاج إلى الكتلة كلها؛ يكفي المعاملة مع «فرع Merkle»، أي تجزئات الأشقاء على المسار من تلك الورقة إلى الجذر، ويكون عددها عادة في حدود log₂(n) من التجزئات إذا كان عدد المعاملات n. وهذا هو أساس التحقق المبسط من المدفوعات (SPV): إذ يستطيع عميل خفيف لا يملك سوى رؤوس الكتل أن يتحقق من حدوث معاملة بعينها بمراجعة فرع Merkle مقابل جذر الرأس، من دون تنزيل البلوكتشين كاملًا ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/operating_modes.html#:~:text=the%20merkle%20root%20in%20the%20block%20header%20along%20with%20a%20merkle%20branch%20can%20prove%20to%20the%20SPV%20client%20that%20the%20transaction%20in%20question%20is%20embedded%20in%20a%20block%20in%20the%20block%20chain)).

توسع Ethereum الفكرة عبر Merkle Patricia Trie، وهو مزيج من شجرة Merkle وtrie بادئات (radix) يُستخدم لتخزين حالة الحسابات كاملة، لا مجرد قائمة معاملات. ويحمل كل رأس كتلة ثلاثة جذور trie منفصلة — `stateRoot` و`transactionsRoot` و`receiptsRoot` — ويمكن إثبات كل منها على نحو مستقل ([ethereum.org](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=From%20a%20block%20header%20there%20are%203%20roots%20from%203%20of%20these%20tries)). وهذا ما يتيح لعقد ذكي أو عميل خفيف أن يتحقق من رصيد حساب واحد أو خانة تخزين واحدة من دون إعادة تشغيل السلسلة كلها.

---

## تشفير المنحنيات الإهليلجية

تشفير المنحنيات الإهليلجية (ECC) هو الأساس الرياضي الذي تقوم عليه جميعًا ECDSA وEdDSA وBLS. فبدل الاعتماد على صعوبة تحليل الأعداد الكبيرة إلى عوامل (كما يفعل RSA التقليدي)، يعتمد ECC على صعوبة مسألة اللوغاريتم المنفصل للمنحنيات الإهليلجية: إذا أُعطيت نقطة على المنحنى وصلنا إليها بإضافة نقطة أساس إلى نفسها مرات كثيرة، فمن غير الممكن حسابيًا معرفة عدد مرات الإضافة، رغم أن حساب النقطة نفسها إلى الأمام سهل. وهذا التفاوت — سهل في اتجاه وصعب عكسه — هو بالضبط ما يجعل استعمال المفتاح الخاص للتوقيع آمنًا، بينما يبقى نشر المفتاح العام المشتق منه آمنًا.

ويهم المنحنى المحدد. يستخدم كل من Bitcoin وEthereum المنحنى secp256k1، وهو منحنى Koblitz وحَّدته Standards for Efficient Cryptography Group بمعلمات 256-بت مدروسة جيدًا ([SEC 2: Recommended Elliptic Curve Domain Parameters](https://www.secg.org/sec2-v2.pdf)). وتستخدم منظومات أخرى منحنيات مختلفة لمقايضات مختلفة؛ إذ يعطي Ed25519 (المنحنى الذي تقف عليه EdDSA في Solana وStellar) الأولوية لأمان التنفيذ والسرعة، بينما اختير BLS12-381 تحديدًا لأنه يدعم عمليات الاقتران التي يحتاجها التجميع. تمنح هذه المنحنيات كلها تقريبًا مستوى الأمان العملي نفسه لكل بت في المفتاح، مع مفاتيح وتوقيعات أقصر كثيرًا من RSA المكافئ، ولهذا أصبح ECC، لا RSA، هو الافتراضي لحسابات البلوكتشين.

---

## مخططات الالتزام (جسر إلى المعرفة الصفرية)

يتيح لك مخطط الالتزام أن «تُثبِّت» قيمة — أي تنشر شيئًا يربطك بقطعة بيانات محددة — من دون كشف البيانات نفسها، ثم «تفتح» الالتزام لاحقًا لتثبت ماهيتها. وتشبيهه اليومي ظرف مختوم: يمكنك أن تعطي شخصًا ظرفًا مختومًا اليوم لإثبات أنك حسمت إجابة بالفعل، من دون أن يراها حتى تختار فتح الظرف لاحقًا، وبعد ختمه لا يمكنك تبديل الإجابة بداخله.

قد يبدو هذا أساسًا بسيطًا، لكنه الجزء الحامل لمعظم أنظمة إثبات المعرفة الصفرية. فتصميم Ethereum لإتاحة البيانات المعتمد على blobs، مثلًا، يستخدم التزامات KZG — وهي مخطط التزام متعدد الحدود — لاختزال blob كبير من بيانات rollup إلى التزام تشفيري صغير واحد يستطيع المُثبتون والمُتحققون فحصه من دون معالجة الـ blob كاملًا ([ethereum.org، Danksharding](https://ethereum.org/en/roadmap/danksharding/#:~:text=KZG%20stands%20for%20Kate-Zaverucha-Goldberg)). وجذر Merkle نفسه، في الحقيقة، مخطط التزام بسيط: فهو يلتزم بمجموعة بيانات كاملة عبر تجزئة جذره، وفرع Merkle هو «الفتح» الذي يكشف جزءًا منها. وتبني ZK-rollups على مخططات التزام أكثر تقدمًا (التزامات كثيرة الحدود والمتجهات) لضغط تنفيذ دفعة كاملة من المعاملات في إثبات رخيص التحقق على السلسلة، وهو الموضوع الذي يغطيه بالتفصيل [المعرفة الصفرية المثالية مقابل الحسابية](/ar/blog/perfect-vs-computational-zero-knowledge/).

---

## مقارنة: الأساسيات التشفيرية للبلوكتشين

| الأساس | الخاصية التي يوفرها | موضع استخدامه على السلسلة | المخاطر التقليدية مقابل ما بعد الكم |
|---|---|---|---|
| دوال التجزئة (SHA-256 وKeccak-256) | بصمة مقاومة للتصادم؛ تربط الكتل معًا | تجزئة الكتل، واشتقاق العناوين، وجذور Merkle | قوية تقليديًا بأحجام المخرجات الحالية؛ وتُعد المخططات القائمة على التجزئة عمومًا أكثر صمودًا أمام هجوم كمّي من توقيعات المنحنيات الإهليلجية الحالية |
| التوقيعات الرقمية — ECDSA | تفويض المعاملات عبر زوج مفتاح خاص/عام | توقيعات حسابات Bitcoin وEthereum | آمنة تقليديًا؛ ومن المتوقع أن يتمكن حاسوب كمّي واسع النطاق وقادر بما يكفي من كسر المخططات القائمة على المنحنيات الإهليلجية، ولهذا وحّدت NIST بدائل ما بعد الكم ([NIST، 2024](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards#:~:text=A%20sufficiently%20capable%20quantum%20computer%2C%20though%2C%20would%20be%20able%20to%20sift%20through%20a%20vast%20number%20of%20potential%20solutions%20to%20these%20problems%20very%20quickly%2C%20thereby%20defeating%20current%20encryption)) |
| التوقيعات الرقمية — EdDSA / BLS | توقيع حتمي (EdDSA)؛ وتجميع كفء للتوقيعات (BLS) | توقيع Solana/Stellar ‏(EdDSA)؛ وشهادات المُصدِّقين في Ethereum ‏(BLS) | افتراض المنحنيات الإهليلجية الأساسي نفسه في ECDSA، وبالتالي التعرض الكمّي نفسه على المدى الطويل |
| أشجار Merkle | التزام مدمج بمجموعة بيانات كبيرة؛ وإثباتات إدراج صغيرة | رؤوس الكتل، والتحقق للعملاء الخفاف (SPV)، وأشجار trie لحالة/معاملات/إيصالات Ethereum | لا تعتمد إلا على مقاومة التصادم في دالة التجزئة الأساسية، لذا ترث وضعها أمام الكم بدل إضافة تعرض جديد |
| تشفير المنحنيات الإهليلجية | الأساس الرياضي للمفاتيح والتوقيعات المدمجة | secp256k1 ‏(Bitcoin وEthereum)، وEd25519، وBLS12-381 | قابل للتأثر بالطريقة نفسها التي تتأثر بها ECDSA/EdDSA/BLS أمام حاسوب كمّي واسع النطاق في المستقبل؛ وهذا هو الدافع الأساسي لأبحاث الانتقال إلى ما بعد الكم |
| مخططات الالتزام | تثبيت قيمة الآن، ثم كشفها أو إثباتها لاحقًا من دون كشفها مقدمًا | التزامات KZG في إتاحة بيانات Ethereum؛ وجذور Merkle كالتزامات بسيطة؛ ولبنة لـ ZK-rollups | يعتمد الأمان على افتراض دالة التجزئة أو المنحنى الإهليلجي المستخدم لبناء المخطط |

---

## كيف يرتبط هذا بالنطاقات المُرمَّزة

تظهر كل واحدة من هذه الأساسيات مباشرة عند [ترميز](/ar/glossary/tokenize/) نطاق. فـ[NFT](/ar/glossary/nft/) الذي يمثل الملكية تحميه توقيعات ECDSA نفسها التي تحمي أي أصل آخر على البلوكتشين؛ ومن يتحكم في المفتاح الخاص يتحكم في رمز النطاق، بكل بساطة. ولهذا تهم [محافظ الأجهزة](/ar/glossary/hardware-wallet/) والحفظ الدقيق لـ[العبارة الأولية (عبارة الاسترداد)](/ar/glossary/seed-phrase/) في نطاق `.com` مُرمَّز بقدر أهميتها في أي أصل آخر على السلسلة. ويعيش سجل ملكية النطاق في حالة مرتبطة بالتزامات Merkle نفسها التي تحمي كل رصيد حساب وكل [عقد ذكي](/ar/glossary/smart-contract/) على السلسلة، وهذا بالتحديد ما يمنح النطاق المُرمَّز قابلية كشف العبث نفسها التي يملكها أي أصل آخر على السلسلة: قابل للنقل، وقابل للتحقق، وملكيته قابلة للإثبات من دون أن تكون قاعدة بيانات المُسجِّل هي المصدر الوحيد للحقيقة.

كما يوضح فهم هذه الأساسيات ما الذي يغيره الترميز وما الذي لا يغيره: فسجل DNS الخاص بالنطاق وحالته في السجل ما زالا يتبعان قواعد ICANN، لكن إثبات ملكيته يعمل الآن بالتشفير الموضح أعلاه بدل حساب [المُسجِّل](/ar/glossary/registrar/) المحمي بتسجيل دخول. استكشف الصورة الأوسع في [آليات توافق البلوكتشين](/ar/blog/blockchain-consensus-mechanisms/) و[أساليب توسيع نطاق البلوكتشين](/ar/blog/blockchain-scaling-approaches/)، أو ابدأ الترميز على [namefi.io](https://namefi.io).

---

## المصادر ومزيد من القراءة

- Bitcoin Developer Guide — [Block Chain](https://developer.bitcoin.org/devguide/block_chain.html)، التسلسل عبر SHA256(SHA256()) لرأس الكتلة السابق
- Bitcoin Developer Reference — [Block Chain](https://developer.bitcoin.org/reference/block_chain.html)، بناء جذر Merkle
- Bitcoin Developer Guide — [Operating Modes](https://developer.bitcoin.org/devguide/operating_modes.html)، SPV وفروع Merkle
- ethereum.org — [Ethereum Accounts](https://ethereum.org/en/developers/docs/accounts/)، ECDSA واشتقاق العناوين بـ Keccak-256
- ethereum.org — [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/)، جذور الحالة/المعاملات/الإيصالات
- ethereum.org — [Danksharding](https://ethereum.org/en/roadmap/danksharding/)، التزامات كثيرات الحدود KZG
- EIP-2 — [Homestead Hard-fork Changes](https://eips.ethereum.org/EIPS/eip-2)، قيود توقيع secp256k1
- EIP-2537 — [Precompile for BLS12-381 curve operations](https://eips.ethereum.org/EIPS/eip-2537)
- SEC 2: Recommended Elliptic Curve Domain Parameters — [secg.org](https://www.secg.org/sec2-v2.pdf)
- *The Eth2 Book* — [Signatures and BLS aggregation](https://eth2book.info/capella/part2/building_blocks/signatures/)
- NIST — [NIST Releases First 3 Finalized Post-Quantum Encryption Standards](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards)
