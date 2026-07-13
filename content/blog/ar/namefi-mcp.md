---
title: "سيرفر Namefi MCP: أدوات الدومينات لوكلاء الذكاء الاصطناعي"
date: '2026-07-10'
language: ar
tags: ['ai-agents', 'domains', 'web3']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/namefi-mcp-og.jpg
description: "كل الأدوات اللي بيعرضها سيرفر Namefi MCP لوكلاء الذكاء الاصطناعي: البحث، والتسجيل، وDNS، والتجديد، والترميز، ونموذج المصادقة، وأمثلة لسير العمل."
keywords: ["سيرفر Namefi MCP", "قائمة أدوات MCP", "إمكانات Namefi MCP", "سيرفر MCP لإدارة الدومينات", "سيرفر MCP لمُسجِّل الدومينات", "نطاقات مفتاح Namefi API", "أدوات DNS MCP", "تسجيل دومين عبر MCP", "ترميز دومين عبر MCP", "دفع دومين x402", "مصادقة SIWE للدومينات", "توقيع EIP-712 للدومينات", "اكتشاف عملاء محتملين للدومينات", "Namefi OpenAPI", "أدوات دومينات لوكلاء الذكاء الاصطناعي"]
relatedArticles:
  - /ar/blog/claude-mcp-domains/
  - /ar/blog/ai-agent-register/
  - /ar/blog/wallet-checkout/
  - /ar/blog/llms-txt/
  - /ar/blog/mcp-quickstart/
relatedTopics:
  - /ar/topics/domain-tokenization/
  - /ar/topics/web3-foundations/
relatedSeries:
  - /ar/series/blockchain-concepts/
  - /ar/series/tokenize-your-com/
relatedGlossary:
  - /ar/glossary/ai-agent/
  - /ar/glossary/registrar/
  - /ar/glossary/tokenized-domain/
  - /ar/glossary/dnssec/
  - /ar/glossary/ens/
---

كل [وكيل ذكاء اصطناعي](/ar/glossary/ai-agent/) بيتصل بسيرفر Namefi MCP بيشوف نفس قائمة الأدوات القابلة للاستدعاء: أداة لكل عملية بتحددها واجهة API، وبتغطي البحث والتسجيل وDNS وإعدادات مستوى الدومين واكتشاف عملاء محتملين للتواصل الخارجي والدفع. الصفحة دي هي الكتالوج: كل أداة، بتعمل إيه، والمصادقة اللي بتحتاجها، وثلاثة أمثلة عملية بتجمع أدوات متعددة في سير عمل حقيقي.

لو لسه ما وصلتش وكيلًا بـ Namefi، ابدأ بـ [إزاي تسجّل دومين باستخدام وكيل الذكاء الاصطناعي على Namefi](/ar/blog/ai-agent-register/) لإعداد كل عميل، أو [اشترِ دومين باستخدام Claude: دليل Namefi MCP خطوة بخطوة](/ar/blog/claude-mcp-domains/) لنسخة كاملة من محادثة. الصفحة دي بتفترض إن الاتصال موجود بالفعل.

## ما هو سيرفر Namefi MCP؟

Namefi بتشغّل سيرفر MCP واحد لكل واجهة API بتاعتها، على `https://api.namefi.io/mcp`، من خلال نقل Streamable HTTP. بدل ما الوكيل يكتب استدعاءات REST يدويًا اعتمادًا على توثيق متلصق في محادثة، بيتصل مرة واحدة وبيستلم أداة مكتوبة الأنواع لكل عملية بتحددها واجهة API، ومتولدة مباشرة من مواصفات OpenAPI 3 الخاصة بـ Namefi على [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json)، وبالتالي كتالوج MCP وREST API ما يقدروش يخرجوا عن بعض.

واصف اكتشاف قابل للقراءة آليًا على [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) بيسمح للوكيل يلاقي السيرفر من غير ما إنسان ينسخ رابطًا يدويًا في ملف إعداد: بيسمي السيرفر `namefi-api`، وبيبلغ عن نقل `streamable-http`، وبيعلن `apiKey`/`x-api-key` كمصادقة للاتصال. Namefi، وهي [مُسجِّل](/ar/glossary/registrar/) معتمد من [ICANN](/ar/glossary/icann/)، بتنشر كمان العمليات نفسها كنقاط نهاية HTTPS عادية على [namefi.io/llms.txt](https://namefi.io/llms.txt)، للوكلاء والسكريبتات اللي ما بتتكلمش MCP.

## كتالوج الإمكانات الكامل

اللي تحت هو كل عملية بتحددها واجهة API وقت كتابة المقال، ومجمّعة بالطريقة اللي مرجع Namefi نفسه بيجمعها بها. عمود **العملية** هو `operationId` من مواصفات OpenAPI، وهو الاسم اللي بتتبني منه قائمة أدوات عميل MCP. عمود **المصادقة** بيعرض أبسط طريق (مفتاح API بيغطي تقريبًا كل شيء)؛ نموذج المصادقة الكامل، بما فيه بدائل مفتاح API، موجود في القسم التالي.

### البحث والاكتشاف

| العملية | نقطة النهاية | ما الذي تفعله | المصادقة |
| --- | --- | --- | --- |
| `checkAvailability` | `GET /v-next/search/availability` | يفحص هل اسم دومين واحد متاح للتسجيل | بدون |
| `checkBulkAvailability` | `GET /v-next/search/bulk-availability` | يفحص مجموعة أسماء مرشحة في استدعاء واحد | بدون |
| `getSuggestions` | `GET /v-next/search/suggestions` | يجلب اقتراحات أسماء خوارزمية مرتبطة باستعلام | بدون |

### التسجيل والطلبات

| العملية | نقطة النهاية | ما الذي تفعله | المصادقة |
| --- | --- | --- | --- |
| `registerDomain` | `POST /v-next/orders/register-domain` | يسجّل دومينًا لمدة 0–10 سنوات. يقبل كائن `domainSetupOptions` (`autoPark`, `autoEns`, `autoRenew`, `dnssec`, `keepExistingNameservers`) وخيار `nftReceivingWallet` | مفتاح API |
| `registerWithRecords` | `POST /v-next/orders/register-domain/records` | يسجّل ويطبّق مجموعة أولية من سجلات DNS في الاستدعاء نفسه | مفتاح API |
| `getOrder` | `GET /v-next/orders/{orderId}` | يستعلم عن طلب حتى يصل لحالة نهائية: `SUCCEEDED` أو `FAILED` أو `CANCELLED` أو `PARTIALLY_COMPLETED` | مفتاح API |

التسجيل غير متزامن: `registerDomain` بيرجع `id` للطلب فورًا، والوكيل بيستعلم عن `getOrder` لحد ما يستقر. كل من [شرح Claude](/ar/blog/claude-mcp-domains/) و[دليل إعداد الوكلاء المتعددين](/ar/blog/ai-agent-register/) بيعرضوا النمط ده بنسخ كاملة من المحادثات.

### إدارة سجلات DNS

CRUD كامل، سجل واحد في كل مرة أو على دفعات، مع عملية قراءة لا تحتاج أي مصادقة إطلاقًا:

| العملية | نقطة النهاية | ما الذي تفعله | المصادقة |
| --- | --- | --- | --- |
| `getDnsRecords` | `GET /v-next/dns/records` | يسرد كل سجل في منطقة | بدون |
| `createDnsRecord` | `POST /v-next/dns/records` | ينشئ سجلًا واحدًا | مفتاح API |
| `updateDnsRecord` | `PUT /v-next/dns/record` | يحدّث سجلًا حسب المعرّف | مفتاح API |
| `deleteDnsRecord` | `DELETE /v-next/dns/record` | يحذف سجلًا حسب المعرّف | مفتاح API |
| `batchCreateDnsRecords` | `POST /v-next/dns/records/batch` | ينشئ سجلات كثيرة في استدعاء واحد | مفتاح API |
| `batchUpdateDnsRecords` | `PUT /v-next/dns/records/batch` | يحدّث سجلات كثيرة في استدعاء واحد | مفتاح API |
| `batchDeleteDnsRecords` | `DELETE /v-next/dns/records/batch` | يحذف سجلات كثيرة في استدعاء واحد | مفتاح API |

[أنواع السجلات](/ar/glossary/dns-record-types/) المدعومة هي: A وAAAA وCNAME وMX وTXT وNS وSOA وPTR وSRV وCAA وDS وTLSA وSSHFP وHTTPS وSVCB وNAPTR وSPF. فيه قاعدتان للتنسيق بتعطّل أغلب المحاولات الأولى: `zoneName` لازم ما يكونش فيه نقطة في النهاية، بينما قيم `rdata` لسجلات CNAME وMX وNS لازم تكون فيها.

### مفاتيح التبديل على مستوى الدومين

العمليات دي بتشغّل أو توقف ميزة كاملة، ومختلفة عن سجل DNS واحد:

| العملية | نقطة النهاية | ما الذي تفعله | المصادقة |
| --- | --- | --- | --- |
| `toggleDomainParking` / `parkDomain` | `PUT` / `POST /v-next/dns/park` | يشغّل أو يوقف [توقيف النطاق](/ar/glossary/domain-parking/) | مفتاح API |
| `isDomainParked` | `GET /v-next/dns/parked` | يفحص هل الدومين متوقف حاليًا | بدون |
| `toggleForwarding` | `PUT /v-next/dns/forwarding` | يشغّل أو يوقف [إعادة توجيه النطاق](/ar/glossary/domain-forwarding/) | مفتاح API |
| `toggleAutoEns` | `PUT /v-next/dns/auto-ens` | يشغّل أو يوقف نشر سجلات [ENS (خدمة أسماء إيثريوم)](/ar/glossary/ens/) تلقائيًا | مفتاح API |
| `toggleVercelAnyCastRecords` | `PUT /v-next/dns/vercel-anycast` | يشغّل أو يوقف سجلات Vercel Anycast DNS | مفتاح API |

لاحظ أن [DNSSEC (امتدادات أمان نظام أسماء النطاقات)](/ar/glossary/dnssec/) مش واحد من مفاتيح التبديل دي: بيتحدد وقت التسجيل، كأحد حقول `domainSetupOptions` في `registerDomain` اللي فوق، مش كنقطة نهاية منفصلة يستدعيها الوكيل لاحقًا.

### إعداد الدومين

| العملية | نقطة النهاية | ما الذي تفعله | المصادقة |
| --- | --- | --- | --- |
| `getAutoRenew` | `GET /v-next/domain-config/auto-renew` | يفحص هل التجديد التلقائي شغّال | مفتاح API |
| `toggleAutoRenew` | `PUT /v-next/domain-config/auto-renew` | يشغّل أو يوقف التجديد التلقائي | مفتاح API |

لما يكون [تجديد النطاق (التجديد التلقائي)](/ar/glossary/domain-renewal/) شغّال، الدومين بيتجدد تلقائيًا قبل انتهاء الصلاحية باستخدام وسائل الدفع الموجودة في محفظة المالك، وده تفويض مستمر لازم يتقرر بعناية لكل دومين بدل ما يفضل مفعّل افتراضيًا لمحفظة كاملة.

### اكتشاف عملاء محتملين للتواصل الخارجي

أحدث مساحة في الواجهة، بتحوّل الدومينات المملوكة إلى خط مبيعات بدل قائمة أصول ثابتة:

| العملية | نقطة النهاية | ما الذي تفعله | المصادقة |
| --- | --- | --- | --- |
| `getUserDomains` | `GET /v-next/user/domains` | يسرد الدومينات التي تملكها المحفظة المصادَق عليها | مفتاح API |
| `startOutboundRun` | `POST /v-next/outbound/runs` | يبدأ تشغيلًا لوكيل ذكاء اصطناعي للعثور على عملاء محتملين لدومين مملوك، بقيمة `reasoningEffort` هي `low` أو `medium` أو `high` | مفتاح API |
| `listOutboundRuns` | `GET /v-next/outbound/runs` | يسرد عمليات التشغيل السابقة والنشطة | مفتاح API |
| `getOutboundRun` | `GET /v-next/outbound/runs/{runId}` | يستعلم عن حالة تشغيل: `QUEUED` أو `RUNNING` أو `SUCCEEDED` أو `FAILED` أو `CANCELED` | مفتاح API |
| `listOutboundLeads` | `GET /v-next/outbound/runs/{runId}/leads` | يسرد جهات شراء محتملة مرتبة، وكل واحدة معها مبرر وجهات اتصال مكتشفة وأي مسودة تواصل موجودة | مفتاح API |
| `prepareOutboundOutreach` | `POST /v-next/outbound/runs/{runId}/leads/{leadId}/outreach` | ينشئ مسودة تواصل لعميل محتمل واحد، أو يعيد الموجودة من غير تكلفة إنشاء إضافية | مفتاح API |

الاستجابة بتستبعد آليات الترتيب الداخلية، مثل الدرجة وتفاصيل النموذج وحالة العميل المحتمل المستبعَد، لذلك الوكيل اللي بيلخّص النتائج لإنسان ما بيشوفش غير المبرر العام وجهة الاتصال اللي اتوجدت وهل توجد مسودة.

### المدفوعات والحساب

| العملية | نقطة النهاية | ما الذي تفعله | المصادقة |
| --- | --- | --- | --- |
| `getBalance` | `GET /v-next/balance` | يفحص رصيد NFSC (Namefi Service Credit) اللي بيموّل التسجيلات | مفتاح API |
| `requestNfscFaucet` | `POST /v-next/user/faucet` | يطلب أرصدة NFSC تجريبية مجانية (بيئات التطوير فقط) | مفتاح API |
| `registerDomainX402` | `GET /x402/domain/{domainName}` | يسجّل ويدفع في تدفق HTTP 402 واحد موقَّع بعملة مستقرة، ومن غير حساب Namefi | توقيع محفظة |
| — | `GET /x402/purchase/{purchaseId}` | يستعلم عن حالة عملية شراء x402 | بدون |
| `registerDomainMPP` | `GET /mpp/domain/{domainName}` | يسجّل ويدفع عبر تدفق تحدٍ واستجابة MPP (Machine Payable Protocol) | توقيع محفظة |

ده بيغطي كل العمليات اللي في النطاق للبحث والتسجيل وDNS وإعداد الدومينات والتواصل الخارجي والدفع: كل واحدة متاحة كأداة MCP من خلال اتصال السيرفر الواحد، أو كاستدعاء HTTPS عادي للوكلاء اللي ما بيتكلموش MCP. (واجهة Namefi API بتعرض كمان شوية عمليات لإدارة الحساب ومساعدة EIP-712/SIWE خارج القائمة دي؛ المجموعة الكاملة دايمًا محدّثة في مواصفات OpenAPI المرتبطة في المصادر أدناه.)

## نموذج المصادقة: ثلاث طرق للدخول، ومحفظة واحدة وراءهم كلهم

كل عملية كتابة فوق بتفحص نفس الشيء: هل المتصل بيتحكم في المحفظة اللي تملك الدومين، أو هتملكه، من خلال واحدة من ثلاث طرق. الطريقة المطبقة بتعتمد على العملية، مش إعداد وحيد على مستوى الحساب.

**مفتاح API (`x-api-key`).** أبسط اختيار، وهو اللي بيستخدمه كل مثال عملي في المجموعة دي. أنشئ مفتاحًا من [namefi.io/api-key](https://namefi.io/api-key)؛ بيشتغل مع كل العمليات فوق، بما فيها كتابات DNS والتوقيف والتسجيل، لأن المفتاح بيرث صلاحيات المحفظة اللي أنشأته. ابعته كـ HTTP header عادي؛ مش محتاج SDK.

**توقيع بيانات مُنمَّطة وفق EIP-712.** للاستخدام البرمجي من غير مفتاح محفوظ، وقّع كل طلب باستخدام [محفظة](/ar/glossary/wallet/) إيثريوم: الـ headers `x-namefi-signer` و`x-namefi-signature` و`x-namefi-eip712-type` بتغلّف الحمولة في غلاف فيه timestamp وnonce يُستخدم مرة واحدة وتنتهي صلاحيته بعد 300 ثانية. ده النمط اللي بتتطلبه عمليات مثل `toggleDomainParking` و`createDnsRecord` و`registerDomain` لما ما يكونش فيه مفتاح API. تعريفات الدومين والنوع جاية من نقاط نهاية حية (`GET /v-next/eip712/domain` و`/eip712/types`) بدل ثابت مكتوب في الكود، لأن توثيق Namefi بيذكر إنها ممكن تتغير. محافظ العقود الذكية ما تقدرش توقّع مباشرةً، لذلك حساب خارجي مملوك معتمد بيوقّع بالنيابة عن العقد، مع `x-namefi-erc1271-account` أو `x-namefi-eip7702-account` لتسمية العقد اللي بيفوّض الطلب.

**SIWE (Sign-In with Ethereum).** رمز جلسة (`x-namefi-siwe-token`) لعمليات القراءة المحمية اللي مش محتاجة توقيعًا جديدًا لكل استدعاء، زي سرد الدومينات أو الطلبات المملوكة: اجلب nonce، وخد الرسالة المطلوب توقيعها، ووقّعها بـ `personal_sign`، وتحقق منها، ثم أعد استخدام الرمز.

عدد قليل من العمليات لا يحتاج مصادقة، وهي `checkAvailability` و`getSuggestions` و`getDnsRecords` و`isDomainParked` ونقاط نهاية بيانات EIP-712، لأنها للقراءة فقط ولا تكشف شيئًا أكثر مما ممكن يعرضه DNS العام للدومين في متصفح.

فوق ده فيه الدفع. `registerDomainX402` بيسوّي عملية شراء عن طريق [بروتوكول x402](https://x402.org): محفظة المشتري بتوقّع `transferWithAuthorization` وفق EIP-3009 لــ [عملة مستقرة](/ar/glossary/stablecoin/) زي USDC، من غير حساب Namefi. `registerDomainMPP` بيحقق النتيجة نفسها عبر تحدٍ واستجابة موقَّعين بدلًا من كده. الاتنين بيسمحوا للوكيل يتخطى إنشاء حساب ويدفع لكل معاملة. [ادفع للدومينات بمحفظة عملات مشفّرة: من غير حساب](/ar/blog/wallet-checkout/) بيغطي المسار ده من أوله لآخره.

## الترميز يمر عبر الكتالوج، لا بجواره

`registerDomain` بيصكّ الدومين كـ [NFT (رمز غير قابل للاستبدال)](/ar/glossary/nft/)، وهو رمز [ERC-721 (معيار NFT)](/ar/glossary/erc-721/) و[واجهة قياسية](https://eips.ethereum.org/EIPS/eip-721) تقرأها بالفعل معظم الأسواق والمحافظ، على Base افتراضيًا، للمحفظة المرتبطة بمفتاح API الخاص بالمتصل. `nftReceivingWallet` بيوجّه ده إلى محفظة أو سلسلة مختلفة وقت التسجيل، وكل ما بعده، من كتابات DNS والتوقيف والتجديد التلقائي واكتشاف العملاء المحتملين، بيتحقق من سجل الملكية ده على السلسلة بدل قاعدة بيانات حساب منفصلة. [دومين مُرمَّز](/ar/glossary/tokenized-domain/) يُتداوَل في سوق مثل [OpenSea](https://opensea.io) بيحمل التحكم في DNS وملكية ERC-721 ككائن واحد، مش نظامين لازم تفضّل تزامنهم يدويًا.

## ثلاثة وكلاء، وثلاث طرق لاستخدام نفس مجموعة الأدوات

**مطور يسجّل دومينًا ويضبط DNS في محادثة واحدة.** `checkAvailability` بيؤكد إن الاسم متاح، و`registerDomain` بيقدمه مع `domainSetupOptions` المضبوطة لـ `autoRenew` و`dnssec`، وبعد ما الطلب يوصل إلى `SUCCEEDED`، `batchCreateDnsRecords` بيكتب سجلات CNAME وTXT اللي خطوة التحقق في منصة النشر مستنياها. [البدء السريع لـ Namefi MCP لوكلاء البرمجة](/ar/blog/mcp-quickstart/) بيعرض التسلسل ده داخل محرر.

**تاجر دومينات يدير محفظة.** `getUserDomains` بيسحب المقتنيات الحالية، و`checkBulkAvailability` بيفحص المرشحين الجدد في استدعاء واحد، و`registerDomain` يلتقط الأسماء اللي تستحق الشراء. للأسماء المعاد بيعها، `toggleDomainParking` بيحط صفحة هبوط و`isDomainParked` بيتأكد إنها شغالة؛ وعبر المحفظة، `getAutoRenew` و`toggleAutoRenew` بيقرروا الأسماء اللي تستحق تفويض تجديد مستمر والأسماء المضاربة اللي الأفضل تسيبها تنتهي.

**شركة تجري اكتشاف عملاء محتملين للتواصل الخارجي على أسماء تملكها بالفعل.** `getUserDomains` بيحدد دومينًا غير مستخدم، و`startOutboundRun` بيبدأ البحث، و`getOutboundRun` بيستعلم لحد ما يصل إلى `SUCCEEDED`. `listOutboundLeads` بيعيد شركات مرتبة يوحي ملفها إنها قد ترغب في الاسم، و`prepareOutboundOutreach` بيكتب مسودة بريد إلكتروني لكل عميل محتمل، تتولد مرة واحدة ثم تُعاد مجانًا في الطلبات المتكررة.

## قبل أن يشغّل وكيل أيًا من ده من غير متابعة

توثيق Namefi نفسه بيصنّف أربع عمليات كـ **مؤثرة**: `registerDomain` و`registerWithRecords` و`startOutboundRun` و`prepareOutboundOutreach`، لأن كل واحدة بتصرف من الرصيد أو بتنفّذ إجراءً ظاهرًا للخارج. أدوات القراءة فقط مثل `checkAvailability` مفيش خطر من تشغيلها ذاتيًا؛ أي شيء بيكتب طلبًا أو سجل DNS على دومين عليه زيارات حية أو مسودة تواصل يستحق خطوة تأكيد. [ما هو مُسجِّل دومين أصلي للوكلاء؟](/ar/blog/agent-native/) فيه قائمة تحقق أكمل لتقييم أي واجهة لمُسجِّل موجَّهة للوكلاء بالطريقة دي.

## الحفاظ على تحديث الكتالوج

الجدول ده بيعكس مواصفات OpenAPI الحية لـ Namefi حتى تاريخ النشر المذكور فوق، مش خارطة طريق ثابتة. العمليات الجديدة بتنزل في [namefi.io/llms.txt](https://namefi.io/llms.txt) و[namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) قبل ما تنزل في جدول أي تدوينة.

## الأسئلة الشائعة

### هل أحتاج مفتاح API لمجرد فحص ما إذا كان اسم متاحًا؟
لا. `checkAvailability` و`checkBulkAvailability` و`getSuggestions` لا تحتاج مصادقة، لذلك بتشتغل مع وكيل متصل حديثًا قبل تمويل أي شيء.

### هل يقدر الوكيل يستخدم الكتالوج كله من غير ما أمتلك مفتاح Namefi API إطلاقًا؟
نعم. `registerDomainX402` و`registerDomainMPP` الاتنين بيسوّوا التسجيل عبر توقيع محفظة من غير حساب Namefi، وتوقيع EIP-712 بيغطي باقي عمليات الكتابة مباشرةً من محفظة.

### هل الدومين بيترمّز تلقائيًا لما أسجّله من أي من المسارات دي؟
نعم، افتراضيًا، عبر كل مسار تسجيل. لو `nftReceivingWallet` مش محدد، الدومين بيتسجل كـ NFT من ERC-721 على Base للمحفظة المرتبطة بمفتاح API الخاص بالمتصل.

### أي العمليات لازم إنسان يؤكدها قبل ما وكيل ذاتي يشغلها؟
على الأقل، العمليات الأربع اللي توثيق Namefi بيعلّم عليها كمؤثرة: `registerDomain` و`registerWithRecords` و`startOutboundRun` و`prepareOutboundOutreach`، بالإضافة إلى أي كتابة DNS على دومين بيخدم زيارات حية بالفعل.

## وصّل وكيلك بالكتالوج الكامل

كل الأدوات اللي فوق حية خلف اتصال واحد: `https://api.namefi.io/mcp`. لو لسه ما ضبطتش ده، [إزاي تسجّل دومين باستخدام وكيل الذكاء الاصطناعي على Namefi](/ar/blog/ai-agent-register/) بيغطي الإعداد الدقيق لستة عملاء مختلفين، و[llms.txt للدومينات](/ar/blog/llms-txt/) بيشرح طبقة الاكتشاف اللي تحتها.

**[أنشئ مفتاح Namefi API](https://namefi.io/api-key)** ووجّه وكيلك إلى السيرفر: الأدوات اللي فوق هي اللي هيلقيها في انتظاره.

## المصادر وقراءة إضافية

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (رابط سيرفر MCP، والنقل، والمصادقة، ومرجع العمليات الأساسية، وهو المصدر الأولي للكتالوج)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (مرجع في ملف واحد يضمّن مدفوعات Web3 واكتشاف العملاء المحتملين للتواصل الخارجي)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (تدفقات x402 وMPP وEIP-712 وSIWE بالتفصيل)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (واصف اكتشاف MCP: اسم السيرفر والرابط والنقل ونوع المصادقة)
- Namefi — [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json) (مواصفات OpenAPI 3 قابلة للقراءة آليًا، ومصدر كل `operationId` ونقطة نهاية في كتالوج الإمكانات)
- Namefi — [docs.namefi.io: Authentication](https://docs.namefi.io/docs/02-authentication.mdx#:~:text=The%20Namefi%20API%20supports%20three%20authentication%20methods) (أنماط مصادقة مفتاح API وEIP-712 وSIWE، ومتطلبات المصادقة لكل عملية، وتفويض ERC-1271/EIP-7702)
- Namefi — [docs.namefi.io: Register a domain](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (حقول طلب التسجيل وتدفق الاستعلام وحالات الطلب)
- Namefi — [docs.namefi.io: Managing your balance](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (نقاط نهاية رصيد NFSC وfaucet)
- Model Context Protocol — [ما هو Model Context Protocol؟](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (نظرة عامة على البروتوكول)
- llmstxt.org — [ملف /llms.txt](https://llmstxt.org) (مواصفات وأسباب اتفاقية الاكتشاف التي يتبعها ملف Namefi)
- x402.org — [بروتوكول x402](https://x402.org) (معيار الدفع بالعملات المستقرة القائم على HTTP 402، الذي يستند إليه `registerDomainX402`)
- Ethereum Improvement Proposals — [ERC-721: معيار الرمز غير القابل للاستبدال](https://eips.ethereum.org/EIPS/eip-721) (معيار الرمز الذي تطبقه NFTs الخاصة بدومينات Namefi)
