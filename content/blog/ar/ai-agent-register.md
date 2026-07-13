---
title: "إزاي تسجّل دومين باستخدام وكيل الذكاء الاصطناعي على Namefi"
date: '2026-07-10'
language: 'ar'
tags: ['ai-agents', 'guide']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/ai-agent-register-og.jpg
description: "الدليل المرجعي لتسجيل دومين على Namefi باستخدام أي وكيل ذكاء اصطناعي — Claude وCodex وCursor وغيرهم — عبر MCP أو REST أو الدفع من المحفظة."
keywords: ["تسجيل دومين وكيل ذكاء اصطناعي", "شرح namefi", "تسجيل دومين claude", "تسجيل دومين codex", "دومين cursor mcp", "دومين windsurf mcp", "دومين gemini cli mcp", "طريقة تسجيل دومين بالوكيل", "x-api-key", "خادم mcp", "الدفع بالمحفظة", "تسجيل دومين namefi mcp", "شراء وكيل ذكاء اصطناعي دومين namefi", "شرح تسجيل دومين mcp"]
relatedArticles:
  - /ar/blog/claude-mcp-domains/
  - /ar/blog/cf-namecom-namefi/
  - /ar/blog/ai-domain-platforms/
  - /ar/blog/agent-native/
  - /ar/blog/airo-vs-namefi/
relatedTopics:
  - /ar/topics/domain-tokenization/
  - /ar/topics/domain-basics/
relatedSeries:
  - /ar/series/tokenize-your-com/
  - /ar/series/blockchain-concepts/
relatedGlossary:
  - /ar/glossary/ai-agent/
  - /ar/glossary/registrar/
  - /ar/glossary/wallet/
  - /ar/glossary/x402/
  - /ar/glossary/tokenized-domain/
---

دي الصفحة اللي تحفظها عندك لو عايز [وكيل ذكاء اصطناعي](/ar/glossary/ai-agent/) — أي وكيل ذكاء اصطناعي، مش وكيل تابع لمزوّد بعينه — يسجّلك دومين حقيقي على [Namefi](https://namefi.io)، وهي [مُسجِّل](/ar/glossary/registrar/) معتمد من [ICANN](/ar/glossary/icann/). الدليل بيشرح الآليات اللي ما بتتغيّرش مهما كان العميل اللي بتكتب فيه، وبعدها بيدي خطوات إعداد دقيقة ومُتحقَّق منها لكل واحد من الوكلاء الستة اللي الناس بتستخدمهم فعلاً دلوقتي: Claude Desktop وClaude Code وOpenAI Codex وCursor وWindsurf وGemini CLI. ولو وكيلك مش موجود في القائمة، فالدليل بيختم بمسار REST مباشر يشتغل مع أي حاجة تقدر تبعت طلب HTTP، لأن Namefi بتنشر واجهة API كاملة كنص عادي مخصوص للغرض ده.

الفريق بتاع Namefi هو اللي كاتب وبيحدّث الدليل ده، فجزء Namefi في كل خطوة مصدره رسمي: بيشرح بشكل مفهوم للبشر نفس الـ API اللي بننشرها للوكلاء في [namefi.io/llms.txt](https://namefi.io/llms.txt) و[docs.namefi.io](https://docs.namefi.io). إعداد كل مزوّد وكيل اتراجع مقابل وثائقه الحالية وقت نشر الدليل؛ ولما وثائق مزوّد ما بتديش إجابة واضحة، بنوضّح ده صراحةً بدل ما نملا الفراغ بتخمين.

لو عارف إنك هتستخدم Claude وعايز الشرح الكامل المعلَّق عليه مع سجل حقيقي، فمقال [اشتري دومين باستخدام Claude: دليل Namefi MCP خطوة بخطوة](/ar/blog/claude-mcp-domains/) أعمق من الأقسام المختصرة الخاصة بـ Claude هنا. الصفحة دي هي المحور؛ أما المقال ده، وباقي الروابط الموزعة فيها، فهي الفروع.

## المقصود فعلاً من «تسجيل دومين باستخدام وكيل ذكاء اصطناعي»

لازم حاجتين يتحققوا عشان الوكيل يسجّل دومين بالنيابة عنك من غير ما تملا نموذج بنفسك. أولاً، الوكيل محتاج طريقة *يكتشف ويستدعي* بيها API بتاعة Namefi — وده هو [بروتوكول سياق النموذج](https://modelcontextprotocol.io) (MCP)، معيار مفتوح بيوصل عميل ذكاء اصطناعي بخادم أدوات خارجي وبيخلّيه يشوف قائمة محددة بالعمليات اللي يقدر يستدعيها؛ أو طلب HTTP عادي لو الوكيل مكتوب كسكربت بدل ما يكون حواري. ثانياً، الوكيل محتاج *تفويض للصرف* — مفتاح API مربوط برصيد ممول، أو [محفظة](/ar/glossary/wallet/) تشفير تقدر توقّع دفعة في اللحظة نفسها. كل حاجة في الدليل ده واحدة من القطعتين دول.

Namefi بتشغّل خادم MCP واحد لكل الـ API عندها، على `https://api.namefi.io/mcp` وبنقل Streamable HTTP. وكيل — أو الشخص اللي بيضبطه — يقدر يكتشفه من غير ما يقرأ الصفحة دي: بننشر واصفاً مقروءاً آلياً في [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) بيسمّي الخادم `namefi-api` وبيسجّل نقله باسم `streamable-http`. كل العملاء اللي تحت بيتصلوا بنفس الرابط؛ الاختلاف الوحيد هو إزاي ملف إعدادات كل عميل أو سطر أوامره بيطلب منك تشير له.

## المسار العام من خمس خطوات

ده التسلسل الموجود تحت كل قسم خاص بوكيل فيما بعد. لما تفهمه هنا، تعليمات كل وكيل بتبقى مجرد «إزاي أنفّذ الخطوة 2 في الأداة دي تحديداً؟».

1. **هات بيانات الاعتماد.** أنشئ [مفتاح API](https://namefi.io/api-key) — سلسلة تبدأ بـ `nfk_` وتشتغل مع كل العمليات: التسجيل، وإنشاء سجلات DNS، والتحديثات، والحذف. المفتاح بيرث صلاحيات المحفظة اللي أنشأته، فأنشئه من المحفظة اللي المفروض تملك الدومين. ولو مش حابب تحتفظ بمفتاح API لـ Namefi أصلاً، انطّ لمسار الدفع بالمحفظة تحت — مش محتاج حساب.
2. **وصّل وكيلك بخادم MCP.** وجّه عميلك إلى `https://api.namefi.io/mcp` مع هيدر `x-api-key` اللي يحمل مفتاحك. الصياغة الدقيقة بتختلف حسب العميل — راجع قسم وكيلك تحت.
3. **ابحث وسعّر.** اسأل بلغة عادية إذا كان الاسم متاحاً. ده بيستدعي عملية `checkAvailability` (`GET /v-next/search/availability?domain=…`) اللي مش بتحتاج أي مصادقة، أو نسختها الجماعية عشان تفحص كذا اختيار في مرة واحدة.
4. **سجّل ثم استطلع الحالة.** بعد التأكيد، الوكيل بيبعت `registerDomain` (`POST /v-next/orders/register-domain`)، أو النسخة المجمعة `register-domain/records` لو عايز تضبط DNS في نفس الاستدعاء. التسجيل غير متزامن — جسم الطلب بياخد `normalizedDomainName` و`durationInYears`، ونقطة `register-domain/records` بتقبل كمان مصفوفة `records` (`name` و`type` و`rdata` و`ttl` لكل سجل) عشان DNS يتكتب لحظة ما الطلب يكتمل. الوكيل (أو أنت) بيستطلع `getOrder` (`GET /v-next/orders/{orderId}`) لحد ما يوصل لحالة نهائية: `SUCCEEDED` أو `FAILED` أو `CANCELLED` أو `PARTIALLY_COMPLETED`.
5. **اضبط DNS وتحقق.** أضف أو عدّل [أنواع سجلات DNS (A، AAAA، CNAME، MX، TXT)](/ar/glossary/dns-record-types/) عن طريق `createDnsRecord` (`POST /v-next/dns/records`)، واضبط التفويض على مستوى [خادم الأسماء (سجل NS)](/ar/glossary/nameserver/) لو لزم، وادّي [انتشار DNS](/ar/glossary/dns-propagation/) دقايق قليلة قبل ما تتأكد إن الدومين بيتحل بشكل صحيح.

طلب التسجيل كمان بيقبل كائن `domainSetupOptions` فيه إعدادات لكل دومين — `autoPark` و`autoEns` و`autoRenew` و`dnssec` و`keepExistingNameservers` (الأخير بيقول لـ Namefi تسيب تفويض خادم الأسماء الحالي للدومين زي ما هو بدل ما تعيد توجيهه، وده مفيد لو بتسجّل دومين المفروض يفضل شغال في مكان تاني فوراً). الحقل الاختياري `nftReceivingWallet` بيتحكم في المحفظة اللي بيروح لها توكن ملكية الدومين — لو ما بعتّوش، الدومين هيتسجل كـ NFT على Base للمحفظة المرتبطة بمفتاح الـ API بتاعك.

## جدول إعداد كل وكيل

| الوكيل | طريقة الاتصال | مكان الإعداد | هل هيدر مصادقة مخصص مدعوم؟ | التحقق تم مقابل |
| --- | --- | --- | --- | --- |
| Claude Code | MCP، ‏Streamable HTTP | أمر CLI اسمه `claude mcp add` (بيكتب في `~/.claude.json` أو `.mcp.json`) | أيوه — علامة `--header` | [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp)، تم التحقق في 2026-07-10 |
| Claude Desktop / claude.ai | MCP، ‏Streamable HTTP عبر Custom Connector | Settings → Connectors → Add custom connector | مطالبة مصادقة بيشغّلها الخادم (OAuth أو مفتاح API أو بيانات اعتماد، حسب اللي الخادم بيطلبه) | [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers)، تم التحقق في 2026-07-10 |
| OpenAI Codex CLI | MCP، ‏Streamable HTTP | `~/.codex/config.toml`، جدول `[mcp_servers.<name>]` | أيوه — `http_headers` (ثابتة) أو `env_http_headers` (من متغيرات البيئة) | [learn.chatgpt.com/docs/extend/mcp](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (هدف إعادة التوجيه الحالي لـ `developers.openai.com/codex/mcp`)، تم التحقق في 2026-07-10 |
| Cursor | MCP، ‏Streamable HTTP | `.cursor/mcp.json` (للمشروع) أو `~/.cursor/mcp.json` (عام) | أيوه — كائن `headers`، مع استبدال `${env:VAR}` | [cursor.com/docs/mcp](https://cursor.com/docs/mcp)، تم التحقق في 2026-07-10 |
| Windsurf (Cascade) | MCP، ‏Streamable HTTP | `~/.codeium/windsurf/mcp_config.json` | أيوه — كائن `headers` في مدخل `serverUrl`، مع استبدال `${env:VAR}` | [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (وقت نشر الدليل، الرابط بيحوّل إلى `docs.devin.ai/desktop/cascade/mcp` — راجع قسم Windsurf تحت)، تم التحقق في 2026-07-10 |
| Gemini CLI | MCP، ‏Streamable HTTP | `~/.gemini/settings.json` (للمستخدم) أو `.gemini/settings.json` (للمشروع) | أيوه — كائن `headers` في مدخل `httpUrl` | [geminicli.com/docs/tools/mcp-server](https://geminicli.com/docs/tools/mcp-server/)، تم التحقق في 2026-07-10 |
| أي عميل MCP آخر | MCP، ‏Streamable HTTP | أي صيغة إعدادات يوثقها العميل | حسب العميل — جانب خادم Namefi ما بيتغيرش | [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) |
| أي سكربت أو وكيل من غير MCP | REST مباشر | غير منطبق | أيوه — هيدر `x-api-key` في كل استدعاء كتابة | [namefi.io/llms.txt](https://namefi.io/llms.txt)، [docs.namefi.io](https://docs.namefi.io) |

كل صف فوق بيتصل بنفس الخادم وبنفس مجموعة العمليات بالضبط. الحاجة الوحيدة اللي بتتغيّر من وكيل للتاني هي صيغة إخبار العميل المحدد: «ده خادم MCP بعيد، وده الهيدر اللي تبعته معاه».

**نفس طلب الاختبار في كل مرة.** بعد ما توصل أي وكيل تحت، شغّل الطلب ده بالنص عشان تقدر تقارن النتائج بين العملاء:

> "تحقق مما إذا كان `example.com` متاحاً للتسجيل على Namefi، وأخبرني بأي أداة أو عملية استدعيتها لمعرفة ذلك. لا تسجّل أي شيء حتى الآن."

ده استدعاء للقراءة فقط — `checkAvailability` مش محتاج مصادقة — فآمن تشغّله مع وكيل اتوصل لسه حتى قبل ما تموّل أي شيء، وهيقولك فوراً إذا كان الاتصال وقائمة الأدوات شغالين.

## Claude Desktop وclaude.ai

Claude Desktop وclaude.ai بيتصلوا بخوادم MCP البعيدة من خلال **Custom Connectors**. افتح Settings، وروح لـ Connectors، واختار "Add custom connector"، واكتب `https://api.namefi.io/mcp` كرابط للخادم. بعد ما تدوس Add، Claude هيطلب منك تكمل المصادقة — وثائق Anthropic بتوصف الخطوة دي إنها غالباً بتشمل "OAuth أو مفاتيح API أو تركيبات اسم مستخدم/كلمة مرور"، والمطالبة الدقيقة بيحددها اللي الخادم المتصل بيحتاجه.

<!-- TODO: verify — الحقل الدقيق الذي تعرضه شاشة Custom Connector في Claude Desktop لهيدر على نمط x-api-key --> لو إعداد Desktop عندك ما بيعرضش مكان واضح تحط فيه المفتاح، فـ Claude Code (اللي بعده) هو المسار المُتحقَّق منه لعمليات الكتابة حالياً، وأدوات القراءة فقط زي البحث عن الإتاحة بتشتغل عبر الـ connector من غير مفتاح أصلاً. الشرح الكامل، بما فيه شكل مسار الـ connector بعد ما يتوصل، موجود في [اشتري دومين باستخدام Claude: دليل Namefi MCP خطوة بخطوة](/ar/blog/claude-mcp-domains/).

## Claude Code

وثائق Claude Code نفسها بتدي صياغة عامة دقيقة لإضافة خادم MCP بعيد عبر HTTP بهيدر مخصص:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

شغّل الأمر ده مرة واحدة من الطرفية بعد ما تستبدل مفتاحك الحقيقي. افتراضياً، ده بيكتب الخادم على نطاق **local** — متاح لك أنت بس، في مشروعك الحالي (إصدارات Claude Code الأقدم كانت بتسمّي النطاق ده "project"). أضف `--scope user` لو عايز الاتصال يبقى متاح في كل مشروع على جهازك، أو `--scope project` عشان تشاركه مع كل الناس في المشروع عبر ملف `.mcp.json` متسجل في Git. أكّد الاتصال باستخدام `claude mcp list`، وتحقق من عدد الأدوات الحي داخل جلسة بـ `/mcp`.

## OpenAI Codex CLI

Codex CLI بيحفظ إعدادات MCP في ملف TOML، افتراضياً `~/.codex/config.toml` (أو `.codex/config.toml` على نطاق المشروع للمشاريع الموثوقة). كل خادم له جدوله الخاص، والنقل بيتحدد من المفاتيح الموجودة: مفتاح `command` معناه خادم stdio محلي، ومفتاح `url` معناه Streamable HTTP. وثائق Codex واضحة إن اسم الجدول لازم يكون `mcp_servers` بشرطة سفلية — الصيغ زي `mcp-servers` بتتجاهل بصمت.

```toml
# ~/.codex/config.toml
[mcp_servers.namefi]
url = "https://api.namefi.io/mcp"
env_http_headers = { "x-api-key" = "NAMEFI_API_KEY" }
```

الصيغة دي بتسحب المفتاح من متغير بيئة اسمه `NAMEFI_API_KEY` بدل ما تكتبه في الملف — اضبطه في الـ shell قبل ما تشغل Codex. ولو تفضّل تكتبه صراحةً (مش مستحسن لملف ممكن تعمله commit)، فالصيغة الثابتة المكافئة هي `http_headers = { "x-api-key" = "YOUR_KEY" }`. Codex كمان بيوثق حقل `bearer_token_env_var` مخصص لمصادقة على نمط `Authorization: Bearer …`، لكن هيدر Namefi `x-api-key` محتاج حقول `http_headers` / `env_http_headers` العامة، مش الحقل الخاص بالـ bearer.

## Cursor

Cursor بيقرأ تعريفات خادم MCP من `mcp.json` — نسخة خاصة بالمشروع في `.cursor/mcp.json` عند جذر المستودع، أو نسخة عامة في `~/.cursor/mcp.json` بتتطبق في كل مكان. وثائق Cursor بتدي شكل الخادم البعيد مباشرةً، بما فيه المصادقة بالهيدر واستبدال متغيرات البيئة، عشان المفتاح نفسه ما يحتاجش يعيش في الملف:

```json
{
  "mcpServers": {
    "namefi": {
      "url": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

`${env:NAMEFI_API_KEY}` بيتحل إلى القيمة اللي متغير البيئة ده بيحملها وقت الاتصال. راجع [Namefi MCP Quickstart: Claude Code وCursor وWindsurf](/ar/blog/mcp-quickstart/) للنسخة المختصرة من نفس الإعداد.

## Windsurf (Cascade)

تكامل MCP في Windsurf — واسمه **Cascade** داخل المنتج — بيقرأ قائمة خوادمه من `~/.codeium/windsurf/mcp_config.json`. خوادم HTTP البعيدة بتستخدم حقل `serverUrl` (مش `command`)، جنب نفس نوع كائن `headers` واستبدال `${env:VAR}` اللي بيستخدمه Cursor:

```json
{
  "mcpServers": {
    "namefi": {
      "serverUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

حاجة مهم تتقال بوضوح: وقت نشر الدليل ده، `docs.windsurf.com/windsurf/cascade/mcp` بيحوّل إلى `docs.devin.ai/desktop/cascade/mcp`. وثائق Windsurf بقت دلوقتي تحت نطاق وثائق منتج Devin بتاع Cognition، والصفحة نفسها بتشير إلى "Windsurf" و"Cascade" بجانب "Devin Desktop". صيغة الإعداد اللي فوق هي اللي الصفحة الحالية بتوثقها؛ لو عندك إصدار Windsurf أقدم، أسماء الحقول المفروض تطابق، لكن راجع رابط الوثائق اللي مساعدة التطبيق في إصدارك بتشير له.

## Gemini CLI

Gemini CLI بيقرأ خوادم MCP من `settings.json` — نسخة على مستوى المستخدم في `~/.gemini/settings.json`، أو نسخة على مستوى المشروع في `.gemini/settings.json` بتتطبق داخل المشروع ده بس. شكل الخادم البعيد بيستخدم `httpUrl` بدل `url`:

```json
{
  "mcpServers": {
    "namefi": {
      "httpUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "YOUR_KEY"
      }
    }
  }
}
```

وثائق Gemini CLI كمان بتوثق حقل `timeout` (بالمللي ثانية، والقيمة الافتراضية 600,000) لو استدعاء أداة معيّن محتاج وقت أطول من المعتاد — الاستطلاع بعد التسجيل مش المفروض يحتاجه، لأن العميل بينتظر كل استدعاء منفرد، مش دورة الاستطلاع كلها.

## أي وكيل آخر بيدعم MCP

لو وكيلك بيدعم MCP لكنه مش واحد من الستة اللي فوق، فجانب الخادم واحد مهما كان العميل المتصل: وجّهه إلى `https://api.namefi.io/mcp` عبر Streamable HTTP، مع `x-api-key: YOUR_KEY` كهيدر مخصص. راجع وثائق عميلك نفسه لصيغة ملف الإعداد أو الأمر الخاص به — واصف الاكتشاف في [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) موجود تحديداً عشان وكيل (أو الشخص اللي بيضبطه) يقدر يعرف رابط الخادم والنقل ومتطلبات المصادقة من غير إنسان ينسخها له يدوياً.

نمط واحد يستحق تعرفه لو عميلك بيدعم بس خوادم MCP **محلية (stdio)**، ومش بيدعم HTTP أو SSE البعيدين مباشرةً: حزمة المجتمع `mcp-remote` بتعمل جسر من Streamable HTTP بعيد لعملية محلية يقدر عميلك يشغّلها بشكل عادي، وبتعيد تمرير أي هيدرات تضبطها. الدليل ده ما يقدرش يتحقق منها مقابل وثائق Namefi نفسها لأنها جسر خارجي مش مسار منشور من Namefi — اعتبرها بديل احتياطي لو عميلك المحدد فعلاً مفيهوش دعم أصلي لـ HTTP البعيد، مش الاختيار الافتراضي. <!-- TODO: verify — أمر mcp-remote دقيق لـ Namefi لو عميل لا يدعم Streamable HTTP أصلاً يحتاجه -->

## من غير MCP خالص: مسار REST المباشر

كل عملية اتوصفت فوق هي كمان نقطة HTTPS عادية، موثقة نقطة بنقطة في [namefi.io/llms.txt](https://namefi.io/llms.txt) وبالكامل في [docs.namefi.io](https://docs.namefi.io). إطار عمل وكيل يقدر يبعت طلبات HTTP لكنه ما بيتكلمش MCP — سكربت مخصص أو runtime وكيل مختلف أو مهمة CI — يقدر يشغّل نفس المسار مباشرةً:

```bash
# 1. Check availability (no auth required)
curl "https://api.namefi.io/v-next/search/availability?domain=example.com"

# 2. Register (requires x-api-key)
curl -X POST "https://api.namefi.io/v-next/orders/register-domain" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"normalizedDomainName": "example.com", "durationInYears": 1}'

# 3. Poll the order until it reaches a terminal status
curl "https://api.namefi.io/v-next/orders/{orderId}" \
  -H "x-api-key: YOUR_KEY"
```

llms.txt هو اصطلاح نص عادي — فهرس مقروء آلياً الموقع بينشره عند الجذر تحديداً عشان وكيل ذكاء اصطناعي يقدر يكتشف الـ API بتعمل إيه من غير ما يزحف في صفحات وثائق معروضة في المتصفح. ملف Namefi قصير كفاية تقرأه مباشرةً في [namefi.io/llms.txt](https://namefi.io/llms.txt) لو عايز النسخة الكاملة بدل الملخص المضغوط. راجع [llms.txt للدومينات: API يقدر أي وكيل ذكاء اصطناعي يقراها](/ar/blog/llms-txt/) عشان تعرف أكتر عن الاصطلاح نفسه.

## الدفع: مفتاح API أم الدفع من المحفظة

كل شيء في الأقسام فوق بيفترض مفتاح API بيتحاسب على رصيد NFSC (Namefi Service Credit) ممول — تقدر تراجعه في أي وقت من `GET /v-next/balance` (محتاج `x-api-key`)، وتموله عبر نقطة faucet في بيئات التطوير، أو من لوحة تحكم Namefi في الإنتاج. <!-- TODO: confirm with team — مسار تعبئة NFSC الدقيق في الإنتاج: وسائل الدفع المقبولة، وهل يمكن شراؤه عبر الدردشة/API أم من واجهة لوحة التحكم فقط -->

Namefi كمان بتدعم تسجيل دومين بمحفظة تشفير **من غير أي حساب Namefi إطلاقاً**، عبر بروتوكول [x402](/ar/glossary/x402/): محفظة الوكيل بتوقّع تفويض EIP-3009، والـ API بترد بـ HTTP 402 فيه السعر لو مفيش دفع مرفق لسه، والتسجيل بيتسوّى أول ما توصل دفعة موقعة صالحة — غالباً بعملة زي [العملة المستقرة](/ar/glossary/stablecoin/) USDC. فيه كمان نسخة challenge-response مرتبطة بـ MPP (Machine Payable Protocol)، ومسار توقيع EIP-712 يدوي للمحافظ اللي مش بتستخدم أي اختصار من الاتنين. مسار المحفظة أولاً ده مهم بالذات للوكلاء اللي الدليل بيتكلم عنهم: بيشيل خطوة إنشاء الحساب بالكامل، عشان العملية الذاتية ما تضطرش تمسك — أو تسرّب — مفتاح API. راجع [ادفع مقابل الدومينات بمحفظة تشفير: من غير حساب](/ar/blog/wallet-checkout/) للمسار ده وحده.

## احتياطات قبل ما تدي الوكيل صلاحية شراء

الوكيل اللي يقدر يسجّل دومين يقدر كمان يصرف فلوس ويعيد كتابة DNS لخاصية شغالة، فكام قرار يستاهل يتاخد بقصد بدل ما يكون افتراضي:

- **قيّد مفتاح API لأصغر محفظة ممكنة.** المفتاح بيرث صلاحيات المحفظة اللي أنشأته — أنشئه من المحفظة المقصود تملك التسجيلات الجديدة، مش محفظة فيها أصول مش عايز مفتاح الوكيل يتعرّض لها.
- **حط سقف لصرف الوكيل.** رصيد NFSC هو في حد ذاته سقف للصرف: موّله بقدر بس أنت مرتاح إن وكيل يستخدمه من غير متابعة، بدل رصيد كبير دائم.
- **قرّر فين الإنسان يفضل موجود في الحلقة.** عمليات القراءة فقط زي البحث عن الإتاحة مش محتاجة مصادقة وما فيهاش مخاطرة؛ أول ما استدعاء يرسل `registerDomain`، أو يفعّل التجديد التلقائي، أو يكتب سجل DNS على دومين عليه حركة مرور، هنا لازم تطلب تأكيد صريح بدل ما تسيب الوكيل يكمل لوحده.
- **راجع كتابات DNS قبل ما تأكدها،** زي ما بتراجع أي تغيير في البنية التحتية. تحقق Namefi بيرفض السجلات المشوّهة بدل ما يقبلها في صمت (شوف جدول استكشاف الأخطاء تحت)، لكن التحقق بيلحق أخطاء الصيغة مش قيمة شكلها صحيح لكنها غلط.

[ما هو مُسجِّل الدومينات المصمم للوكلاء؟](/ar/blog/agent-native/) بيعرض قائمة تحقق أكمل — قابلية الاكتشاف، وأخطاء مقروءة آلياً، ومسارات دفع ما بتفترضش إن إنسان ماسك بطاقة ائتمان — لتقييم السطح الموجّه للوكلاء لأي مُسجِّل، بما فيها Namefi.

## استكشاف الأخطاء وإصلاحها

| العَرَض | السبب المحتمل | الحل |
| --- | --- | --- |
| `401 UNAUTHORIZED` في أي استدعاء كتابة | مفتاح API غير صالح أو منتهي أو تم إنشاؤه من محفظة لا تملك الدومين المستهدف | أنشئ مفتاحاً جديداً في [namefi.io/api-key](https://namefi.io/api-key) من المحفظة التي تملك (أو ستملك) الدومين |
| `403 FORBIDDEN` | المفتاح صالح، لكن محفظته لا تملك هذا الدومين المحدد | تحقق من الملكية قبل إعادة المحاولة |
| Codex يتجاهل مدخل `[mcp_servers.namefi]` | خطأ مطبعي في اسم الجدول — Codex يحتاج صيغة الشرطة السفلية `mcp_servers`، مش `mcp-servers` | أصلح رأس الجدول في `config.toml` |
| Cursor أو Windsurf بيعرض الخادم كغير متصل | كائن `headers` مشوّه، أو `${env:VAR}` بيشير لمتغير غير مضبوط | تحقق إن JSON صالح وإن متغير البيئة المشار له معمول له export فعلاً في الـ shell اللي شغّلت منها المحرر |
| Gemini CLI مش لاقي الإعداد | عدّلت ملف `settings.json` الغلط — ملفات مستوى المستخدم ومستوى المشروع منفصلة | أكّد إذا كنت تقصد `~/.gemini/settings.json` أو `.gemini/settings.json` في المشروع الحالي |
| طلب التسجيل عالق في حالة غير نهائية | طبيعي — التسجيل غير متزامن | استمر في استطلاع `getOrder`؛ اعتبره عالقاً فقط لو لم يصل أبداً إلى `SUCCEEDED` أو `FAILED` أو `CANCELLED` أو `PARTIALLY_COMPLETED` |
| إنشاء/تحديث سجل DNS بيرفضه خطأ تحقق | `zoneName` فيه نقطة في آخره، أو قيمة `rdata` لـ CNAME/MX/NS ناقصها النقطة الختامية المطلوبة | `zoneName` = من غير نقطة أخيرة؛ و`rdata` من نوع FQDN = بنقطة أخيرة مطلوبة |
| التسجيل يفشل تماماً | رصيد NFSC غير كافٍ في المحفظة اللي بتدفع | راجع `GET /v-next/balance`، وموّل عبر faucet (تطوير) أو لوحة التحكم (إنتاج) |
| الوكيل بيقول إنه مفيش أدوات دومين متاحة | خادم MCP غير متصل، أو متصل من غير الهيدر المطلوب لعمليات الكتابة | راجع ملف إعدادات عميلك أو أعد تشغيل أمر «إضافة الخادم» بالهيدر المضمن |

## الأسئلة الشائعة

### هل لازم أختار وكيل واحد وألتزم به؟

لا. خادم MCP وكل نقاط REST متطابقة مهما كان العميل المتصل — تقدر تعمل الإعداد لـ Claude Code النهارده وCursor بكرة باستخدام نفس مفتاح API ونفس رصيد NFSC، من غير خطوة ترحيل.

### أي من الوكلاء دول هو «الأفضل» لتسجيل دومين؟

مفيش فرق قدرات له معنى في المهمة دي، لأن كل عميل بيستدعي نفس العمليات على جانب الخادم. الفروق كلها في صيغة إعداد MCP الخاصة بكل عميل، وده بالضبط سبب إن الدليل بيدي كل واحد قسم خاص ونفس طلب الاختبار — شغّله مرة لكل عميل وقارن السجلات بنفسك.

### ماذا لو كان وكيلي لا يدعم MCP إطلاقاً؟

استخدم مسار REST المباشر فوق. كل عملية بيوصل لها استدعاء أداة MCP هي كمان نقطة HTTPS موثقة، و`namefi.io/llms.txt` مصمم تحديداً كنقطة دخول نصية عادية يقدر يقرأها وكيل (أو الشخص اللي بيضبطه) من غير متصفح.

### هل الدومين بتاعي بيتحوّل لتوكن تلقائياً لما أسجله بالطريقة دي؟

أيوه، افتراضياً. لو ما حددتش `nftReceivingWallet` في طلب التسجيل، الدومين بيتسجل كـ NFT للمحفظة المرتبطة بمفتاح API بتاعك، على Base. تقدر توجهه لمحفظة مختلفة وقت التسجيل.

### هل وكيل يقدر يسجل دومين من غير ما أحتفظ بمفتاح API أصلاً؟

أيوه — مسار الدفع x402 الموقّع بالمحفظة مش محتاج حساب Namefi ولا مفتاح API، بس محتاج محفظة ممولة. قسم الدفع فوق بيغطي أساسيات المسار؛ راجع [ادفع مقابل الدومينات بمحفظة تشفير: من غير حساب](/ar/blog/wallet-checkout/) للشرح الكامل.

### هل التسجيل من خلال وكيل أغلى من التسجيل من موقع Namefi؟

الدليل ده ما بيدّعيش مقارنة أسعار في أي اتجاه. <!-- TODO: confirm with team — هل تسعير MCP/API في Namefi يطابق تسعير التسجيل المعتاد، أم يختلف؟ --> في كل الأحوال، كل مسار بيسحب من نفس رصيد NFSC سواء الطلب جاي من متصفح أو سكربت أو أداة الوكيل.

## ابدأ بالوكيل اللي فاتحه بالفعل

مش محتاج تثبّت ستة عملاء عشان تستخدم الدليل ده — محتاج واحد بس، بالإضافة لمفتاح API لـ Namefi أو محفظة ممولة. اختار القسم فوق اللي يطابق الوكيل اللي بتتكلم معاه بالفعل، نفّذ الإعداد، وجرّب طلب الاختبار. من هنا، باقي مسار الصفحة — البحث والتسجيل وضبط DNS — بيحصل في نفس المحادثة.

**[أنشئ مفتاح API لـ Namefi](https://namefi.io/api-key)** أو اتعمق أكثر مع [شرح Claude بسجل كامل](/ar/blog/claude-mcp-domains/) و[المقارنة المباشرة بين مُسجِّلات الدومينات المصممة للوكلاء](/ar/blog/cf-namecom-namefi/). وللمكوّنات اللي تحت الدليل ده، راجع [خادم Namefi MCP: أدوات دومين لوكلاء الذكاء الاصطناعي](/ar/blog/namefi-mcp/)، و[Namefi MCP Quickstart: Claude Code وCursor وWindsurf](/ar/blog/mcp-quickstart/)، و[ادفع مقابل الدومينات بمحفظة تشفير: من غير حساب](/ar/blog/wallet-checkout/)، و[llms.txt للدومينات: API يقدر أي وكيل ذكاء اصطناعي يقراها](/ar/blog/llms-txt/).

## المصادر وقراءات إضافية

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (رابط خادم MCP، والنقل، والمصادقة، ومرجع نقاط التسجيل/DNS، وحقول `domainSetupOptions` — المصدر الأساسي لكل ادعاء خاص بـ Namefi في الدليل)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (مسارات الدفع بالمحفظة x402 وMPP وEIP-712)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (واصف اكتشاف MCP: اسم الخادم، والرابط، والنقل، ونوع المصادقة)
- Namefi — [docs.namefi.io: Authentication](https://docs.namefi.io/docs/02-authentication.mdx) (أوضاع مصادقة مفتاح API وEIP-712 وSIWE؛ متطلبات المصادقة لكل عملية)
- Namefi — [docs.namefi.io: Register a domain](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (حقول طلب التسجيل، ومسار الاستطلاع، وقيم حالة الطلب)
- Namefi — [docs.namefi.io: Managing your balance](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (رصيد NFSC ونقاط faucet)
- Anthropic / Claude Code — [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (صيغة `claude mcp add --transport http`، وعلامة `--header`، وخيارات `--scope`)
- Model Context Protocol — [Connect to remote MCP servers](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication) (مسار Custom Connectors في Claude Desktop / claude.ai)
- OpenAI — [learn.chatgpt.com: Model Context Protocol (Codex CLI)](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (جدول `[mcp_servers.<name>]` في `config.toml`، وحقول `url` و`http_headers` و`env_http_headers` و`bearer_token_env_var`)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (صيغة الخادم البعيد في `mcp.json`، و`headers`، واستبدال `${env:VAR}`، وأماكن الملفات على مستوى المشروع أو المستوى العام)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (يحوّل إلى [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp)؛ صيغة `mcp_config.json`، و`serverUrl`، و`headers`)
- Google — [geminicli.com: MCP servers with the Gemini CLI](https://geminicli.com/docs/tools/mcp-server/) (صيغة `settings.json`، و`httpUrl`، و`headers`، و`timeout`)
- llmstxt.org — [The /llms.txt file](https://llmstxt.org) (المواصفة والمنطق وراء اصطلاح الاكتشاف الذي يتبعه `namefi.io/llms.txt`)
