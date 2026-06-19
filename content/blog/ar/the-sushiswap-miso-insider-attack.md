---
title: 'هجوم MISO من الداخل على SushiSwap: كيف أدى كوميت واحد خبيث إلى تحويل ~3 مليون دولار من مزاد توكن'
date: '2026-06-17'
language: ar
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'في سبتمبر 2021، تمكّن مقاول مجهول الهوية من إدراج عنوان محفظته الخاصة في واجهة MISO الأمامية على SushiSwap من خلال كوميت خبيث، وحوّل 864.8 ETH (~3 مليون دولار) من مزاد Jay Pegs Auto Mart. تحليل معمّق من Domain Mayday عن سلاسل توريد الكود وثقة الواجهة الأمامية وما يمكن تعلّمه حول الملكية القابلة للتحقق.'
keywords: ['اختراق sushiswap miso', 'هجوم سلسلة توريد miso', 'aristok3', 'jay pegs auto mart', 'هجوم واجهة defi الأمامية', '864.8 eth', 'سلسلة توريد البرمجيات', 'كوميت خبيث', 'تهديد داخلي', 'auctionwallet', 'joseph delong', 'أمان سلسلة توريد الويب', 'أمان النطاقات']
---

معظم الهجمات بتكسر الباب بالقوة. ده الهجوم كان داخل من الأول.

في سبتمبر 2021، الناس اللي كانوا بيشغّلوا منصة MISO على SushiSwap ما تعرضوش لتصيّد احتيالي، ومحدش سرق منهم مفتاح خاص، وما كانش في عقد ذكي معيب. اللي حصل كان أعادي أكتر من كده: وثقوا في مساهم. مقاول مجهول كان عنده صلاحية الكتابة على الكود حطّ عنوان محفظته الخاصة في واجهة المزاد الأمامية، دفع التغيير، وسيب الـ pipeline يعمل الباقي. لما مزاد NFT واحد اتسوّى، حوالي **864.8 ETH — يعني تقريباً 3 مليون دولار** — راحت مش للمشروع اللي كان بيشغّل البيع، لكن للمطوّر اللي بهدوء أعاد كتابة المسار اللي المفروض الفلوس ترّوح فيه.

مفيش استغلال. مفيش ثغرة. بس سطر كود محدش دقّق فيه، اتكتب من حد كان من المفروض في الفريق.

ده الحلقة 15 من Domain Mayday. القصة دي بتتكلم عن العقود الذكية بس على الهامش. في جوهرها دي قصة عن الجزء من الويب اللي معظم الناس مبتراجعوش: سلسلة توريد الكود، والواجهة الأمامية، والحقيقة المزعجة إن "مين مسموح له يغيّر ده؟" سؤال أمني بنفس خطورة "مين عنده المفاتيح؟"

## الثقة اللي بتحطها في كود المنصة

منصة DeFi زي MISO — اختصار لـ Minimal Initial SushiSwap Offering — موجودة عشان تعمل حاجة واحدة كويس: تاخد فلوس من مجموعة غرباء وتوصّلها لمشروع بيشغّل بيع توكن أو NFT. عشان تعمل ده، بتربط بين عقود ذكية متحقَّق منها على السلسلة وواجهة ويب أمامية خارج السلسلة. المستخدمون بيتعاملوا مع الواجهة الأمامية. الواجهة الأمامية بتقول لمحفظتهم إيه المعاملة اللي المفروض يوقّعوا عليها.

ده هو نقطة الضعف. الناس بتنهك نفسها على طبقة العقود الذكية لأن ده المكان اللي فيه عمليات التدقيق والمكافآت على الثغرات والعناوين الرئيسية. لكن الواجهة الأمامية — الـ JavaScript اللي بتقرر *أنهي عنوان* المزاد بيدفع فيه — مجرد كود في repository، بتنشره pipeline، وبيعدّله أي حد عنده صلاحية الكتابة. دقّق في الخزنة قد ما تقدر، لو إنسايدر عنده قدرة يغيّر اللافتة اللي بتقول "حطّ فلوسك هنا،" الخزنة ما لهاش دعوة بالموضوع.

كود MISO كان مفتوح وتعاوني، زي ما بتبقى البنية التحتية لـ crypto عادةً. الانفتاح ده ميزة: بيجيب مساهمين، وبيسرّع الشحن، وبيخلي فريق صغير يعمل أكتر بكتير مما في إمكانياته. لكنه كمان بالظبط السطح اللي محتاجه المهاجم في هجوم سلسلة التوريد. مش محتاج تكسر الباب لو تقدر تتلقى دعوة للمساهمة.

## سبتمبر 2021: الكوميت الخبيث

![رسم فني ملوّن وحيوي لطوبة واحدة معدّلة بتضيء باللون الأحمر، وإيد بقفازات مجهولة بتبدّلها بهدوء في جدار مصدر مفتوح نظيف](../../assets/the-sushiswap-miso-insider-attack-01-attack.jpg)

يوم الجمعة 17 سبتمبر 2021، جوزيف ديلونج CTO SushiSwap في الوقت ده نزل على تويتر يشرح إيه اللي حصل. رواية CoinDesk كانت صريحة: ديلونج قال إن [مقاول مجهول بيستخدم هاندل Github اسمه "AristoK3" حقن كود خبيث في الواجهة الأمامية لـ MISO في هجوم على سلسلة التوريد](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=an%20anonymous%20contractor%20using%20the%20Github%20handle).

الآلية كانت بسيطة بشكل يكاد يكون مهيناً. زي ما وصفها ديلونج، المهاجم [استبدل عنوان محفظة المزاد بعنوانه الخاص](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=replaced%20the%20auction%27s%20wallet%20address%20with%20their%20own). PYMNTS وصف الفعل بمصطلحات سلسلة التوريد بالظبط: المقاول [دفع كوميت كود خبيث انتشر على الواجهة الأمامية للمنصة](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=pushed%20a%20malicious%20code%20commit%20that%20was%20distributed%20on%20the%20platform%27s%20front%20end).

تقرير ما بعد الحادثة لخّص الجوهر في جملة واحدة: مطوّر كان متعاقد للعمل على المزاد [أدخل عنوان محفظته الخاصة في العقد بدل الـ auctionWallet](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=inserted%20his%20own%20wallet%20address%20into%20the%20contract%20instead%20of%20the) — من خلال تعديل القيمة اللي الواجهة الأمامية بتحطها وقت النشر، مش بكسر المنطق المُدقَّق فيه على السلسلة نفسه. متغيّر واحد. `auctionWallet` كان المفروض يشاور على المشروع اللي بيشغّل البيع. بدل كده اشاور على المقاول. كل دولار المزايد فكّر إنه بيبعته لصاحب المزاد راح في مكان تاني، والكود بدا عادي تماماً وهو بيعمل كده.

## اللي اتحوّل: ~864.8 ETH، ~3 مليون دولار

الهدف كان مزاد واحد، كان اسمه كوميك تقريباً. زي ما أفادت CryptoSlate، MISO تعرّض لهجوم على سلسلة التوريد [سرق 864.8 ETH من عقد مزاد توكن "Jay Pegs Auto Mart"](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=drained%20864.8%20ETH%20from%20the). Jay Pegs Auto Mart كان مشروع فن NFT بيصوّر نفسه على شكل معرض سيارات مستعملة — ديكور من ثقافة الكريبتو فوق بيع توكن حقيقي مالياً.

الأرقام وردت بنفس الطريقة في كل المصادر. PYMNTS أفادت إن [الهاكر حوّل 864.8 عملة Ethereum — حوالي 3 مليون دولار — لمحفظته](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=transferred%20864.8%20Ethereum%20coins). The Crypto Times أكّدت إن المهاجم [سرق 864.8 ETH](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=drained%20864.8%20ETH)، وإن [المشروع الوحيد اللي اتضرر من المزادات كان Jay Pegs Auto Mart](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=The%20only%20auction%20project%20that%20has%20been%20hacked%20and%20exploited).

التفصيلة دي مهمة. الكود المسموم انتشر عبر الواجهة الأمامية، يعني من حيث المبدأ كان ممكن يحوّل *أي* مزاد بيلمسه. في الواقع، بس Jay Pegs Auto Mart اتسوّت على عنوان المهاجم قبل ما الفريق يلاقي الموضوع. المزادات التانية المتأثرة اتصلحت قبل ما تتفرّغ — فرق ساعات قليلة بين عنوان واحد سيء وكارثة كاملة.

## كيف حصل: ثقة داخلية، مش قفل مكسور

![رسم فني ملوّن وحيوي لإنسايدر في الظل بيلوّي بهدوء أنبوب فلوس متوهّج عشان تدفقه يتسرّب لجردل خاص بدل الخزّان المقصود](../../assets/the-sushiswap-miso-insider-attack-02-malicious-commit.jpg)

لو شيلنا مصطلحات الكريبتو، ده هجوم كلاسيكي على سلسلة توريد البرمجيات — نفس تصنيف باكدج npm مسموم أو سيرفر بناء معدّل، بس المكسب محسوب بالـ ETH.

سلسلة الثقة كانت بالشكل ده. مساهم اتُعطي صلاحية كتابة على الكود اللي بيشغّل المزادات الحية. استخدم الصلاحية دي يعمل كوميت بدّل فيه عنوان الوجهة. الـ pipeline عمل اللي بتعمله pipelines — أخد أحدث كود ونشره على الواجهة الأمامية اللي المستخدمين الحقيقيين بيفتحوها في متصفحاتهم. المستخدمين دول وصّلوا محافظهم، ووقّعوا على اللي الواجهة الأمامية قالتهم يوقّعوا عليه، وموّلوا مزاد صاحبه اتعاد كتابته بهدوء. رواية Coinspeaker بتطابق التانيين: [مقاول مجهول بهاندل GH اسمه AristoK3 حقن كود خبيث في الواجهة الأمامية لـ MISO](https://www.coinspeaker.com/sushiswap-miso-attack-nft/#:~:text=an%20anonymous%20contractor%20with%20the%20GH%20handle%20AristoK3%20injected%20malicious%20code%20into%20the%20Miso%20front%20end).

لاحظ إيه اللي *مش* كان محتاجه. المهاجم مش محتاج يلاقي ثغرة في عقد ذكي. مش محتاج يسرق مفتاح أو يخترق سيرفر من برّا. كان محتاج حاجة واحدة بالظبط: إنه يكون موثوق بيه بما يكفي يغيّر الكود. صياغة تقرير الحادثة دقيقة — [الواجهة الأمامية لـ MISO وقعت ضحية لهجوم على سلسلة التوريد](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=The%20Miso%20front%20end%20has%20become%20the%20victim%20of%20a%20supply%20chain%20attack) — نفّذه مقاول مجهول بهاندل GitHub اسمه AristoK3، [حقن كود خبيث في الواجهة الأمامية لـ MISO](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=injected%20malicious%20code%20into%20the%20Miso%20front%20end).

ده اللي بيخلي هجمات سلسلة التوريد من الداخل خطيرة جداً. كل دفاع خارجي — جدران حماية، عمليات تدقيق، multisigs على الخزينة — بيفترض إن التهديد برّا وبيحاول يدخل. الإنسايدر اللي عنده حقوق الكوميت بالفعل عدى كل ده. التغيير الخبيث ركب عملية النشر الموثوقة والشرعية الخاصة بالمشروع مباشرة لـ production. الـ pipeline مانفترقش. *اتُستخدم*.

## الاستجابة والاسترداد: اتمسك، اتسمّى، وراجع الفلوس

استجابة SushiSwap كانت سريعة وعلنية ومواجهة. ديلونج ما حقّقش بهدوء؛ سمّى هاندل GitHub، وسمّى هوية حقيقية مشتبه بيها، وحدّد موعداً نهائياً. حسب CoinDesk، التحذير كان صريح: لو الفلوس ما ترجعتش، منصة DeFi هتشتكي [للـ FBI](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=file%20a%20complaint%20with%20the%20FBI).

نجح التهديد. المهاجم عكس مساره. CryptoSlate أفادت إنه بعد ساعتين بس من ما الفريق أعلن علناً، [الهاكر ردّ 865 ETH للعقد الأصلي لـ MISO](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=the%20hacker%20returned%20865%20ETH%20to%20the%20original%20MISO%20contract) — *أكتر* بشوية من 864.8 ETH اللي خرجت. The Crypto Times أكّدت الوجهة: [عنوان الـ multisig الخاص بـ Sushiswap استقبل 865 ETH](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=the%20multisign%20address%20of%20Sushiswap%20got%20865%20ETH%20back). تحديث ديلونج الخاص كان مختصر زي التهديد الأصلي. Decrypt سجّل تأكيده إنه في حدود يوم واحد، [كل الفلوس رجعت](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum#:~:text=All%20funds%20returned).

النهاية السعيدة دي محتاجة هامش توضيح. الفلوس رجعت مش لأن البنية المعمارية اكتشفت السرقة، لكن لأن المهاجم اختار يرجعها تحت ضغط الفضيحة العلنية وتهديد حقيقي بتدخل جهات القانون. الهوية الوهمية على سجل عام بيقطع بالاتجاهين: خلّت المقاول يتصرف بشكل مجهول، وكمان معناها إن المسار على السلسلة للفلوس المحوّلة كان مرئي للجميع، وده بالظبط هو الورقة الضاغطة اللي خلّت ردّ الفلوس هو مسار المقاومة الأقل. الاسترداد هنا كان مفاوضة، مش ضمان. الإنسايدر الجاي ممكن ميبصّش.

## إيه اللي بيعلّمنا عن سلاسل توريد الكود وثقة الواجهة الأمامية

حادثة MISO صغيرة بمعايير DeFi من حيث الدولارات، وكبيرة من حيث الدروس. في دروس تستاهل تاخدها معاك:

1. **الواجهة الأمامية جزء من محيط أمانك.** المستخدمون بيوقّعوا على اللي الواجهة بتقولهم يوقّعوا عليه. لو مهاجم بيتحكم في أنهي عنوان الواجهة بتعرضه، مش محتاج العقد الذكي خالص. مراجعة الكود على السلسلة بس معناها مراجعة نص النظام.
2. **صلاحية الكتابة هي السطح الحقيقي للهجوم.** أقوى تشفير في العالم مش هيفيد لو الشخص اللي ينفع يعدّل الكود قرر يعمل كده. "مين ينفع يغيّر ده، ومين بيراجعه قبل ما يتنشر؟" ده ضبط أماني، مش تفصيلة في العملية.
3. **المراجعة الإجبارية للكود مش بيروقراطية — دي دفاع.** عيون ثانية مطلوبة على الكوميت اللي بدّل `auctionWallet` كانت هتوقف الموضوع على الأرجح في الحال. هجمات سلسلة التوريد بتزدهر على التغييرات اللي محدش بيفحصها بشكل مستقل قبل النشر.
4. **المساهمون المجهولون بيرفعوا المخاطر.** المساهمة المفتوحة قوة، لكن منح صلاحية تأثّر النشر لهوية مجهولة معناه إنك واثق في كود ما تقدرش تنسبه بالكامل. الثقة المفروض تتناسب مع التحقق، مش مع الحماس.
5. **الاسترداد حظ، مش بنية معمارية.** الفلوس رجعت بسبب الضغط العلني وسجل قابل للتتبع. تصميم نظام بيعتمد على حسن نية المهاجم مش تصميم أماني أصلاً.

الخيط المشترك: سلامة *مين مسموح له يعمل تغيير*، و*التحقق إن التغيير ده هو اللي انتشر فعلاً*، بنفس أهمية أي مفتاح تشفير. الثقة في سلسلة التوريد مش قلق ثقافي ناعم. دي الحافة الصلبة للنظام.

## زاوية Namefi

![رسم توضيحي ملوّن للملكية القابلة للتحقق والمقاومة للتلاعب — مؤمّنة بدرع أخضر وتوكن Namefi الأخضر واستمرارية](../../assets/the-sushiswap-miso-insider-attack-03-namefi-angle.jpg)

MISO خسرت فلوس لأن *وجهة القيمة* كان ينفع حد موثوق بيه يعيد كتابتها بهدوء، ومحدش تحقق من التغيير قبل ما يطلع حي. نموذج الفشل ده مش حصري على منصات DeFi. له نفس شكل نطاق ملكيته أو سجلات DNS بتاعته ممكن حد يغيّرها بهدوء — حساب registrar، أو لوحة تحكم داخلية، أو مقاول عنده صلاحيات.

النطاق هو من أهم إعدادات "الوجهة" على الإنترنت. سجلات DNS بتاعته بتحدد فين مرورك وإيميلك ومستخدميك بيروحوا فعلاً. لو إنسايدر أو حساب مخترق يقدر يغيّرها من غير سجل واضح ومستقل وقابل للتحقق بمن غيّر إيه، عندك مشكلة MISO بس في هدوم مختلفة: القفل كويس، لكن اللافتة على الباب تنفع تتبدّل.

[Namefi](https://namefi.io) بيتعامل مع الموضوع ده بمعاملة ملكية النطاق كأصل قابل للتحقق ومقاوم للتلاعب، مش مجرد إدخال في حساب خاص لحد. الملكية المُرمَّزة بتخلي التحكم قابل للتدقيق والنقل على السلسلة مع الحفاظ على التوافق مع DNS — فـ "مين صاحب ده ومين مسموح له يغيّره" بتبقى حقيقة تقدر تتحقق منها، مش ثقة لازم تمدّها بشكل أعمى. مقاول MISO قدر يعيد كتابة عنوان الدفع بالظبط لأن النظام ما كانش عنده إجابة معتمدة وقابلة للتحقق المستقل على "هل التغيير ده مُصرَّح بيه؟" الدرس اللي Namefi بياخده من هجمات سلسلة التوريد هو إن الملكية والتحكم المفروض يكونوا قابلين للإثبات بالتصميم، عشان الفجوة الخطيرة بين *موثوق بيه* و*متحقَّق منه* ما تفتحش أصلاً.

## المصادر وقراءة إضافية

- CoinDesk — [$3M in Ether Stolen From SushiSwap's MISO Launchpad](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad)
- Decrypt — [SushiSwap's Token Launchpad Hacked for Over $3M in Ethereum](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum)
- CryptoSlate — [Hacker returns 865 ETH stolen from Sushi's token launch platform MISO](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/)
- PYMNTS — [SushiSwap Crypto Platform Victimized by $3M Hack](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/)
- The Crypto Times — [Sushiswap's Miso Launchpad Loses $3 Million In An Attack](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/)
- Coinspeaker — [SushiSwap Launchpad Miso Suffers Attack with 864.8 ETH NFT Project Fund Carted Away](https://www.coinspeaker.com/sushiswap-miso-attack-nft/)
- CryptoBriefing — [Sushi's Initial Offering Launchpad Suffers $3M Exploit](https://cryptobriefing.com/sushiswaps-miso-token-launchpad-suffers-3m-exploit/)
- CryptoPotato — [Another DeFi Hack: $3M in ETH Stolen From SushiSwap's Token Platform](https://cryptopotato.com/another-defi-hack-3m-in-eth-stolen-from-sushiswaps-token-platform/)
- Quadriga Initiative — [SushiSwap MISO Jaypegs Automart case study](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php)
