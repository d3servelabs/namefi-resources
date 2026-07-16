---
title: "Namefi MCP விரைவுத் தொடக்கம்: Claude Code, Cursor & Windsurf"
date: '2026-07-10'
language: 'ta'
tags: ['ai-agents', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
format: guide
ogImage: ../../assets/mcp-quickstart-og.jpg
description: "Claude Code, Cursor மற்றும் Windsurf-க்கான ஒவ்வொரு எடிட்டருக்கும் உரிய OAuth மற்றும் API விசை MCP அமைப்பு; பின்னர் புதிய செயலியிலிருந்து நேரடி தனிப்பயன் டொமைன் வரை ஐந்து படிகளிலான விரைவுத் தொடக்கம்."
keywords: ["claude code mcp டொமைன்", "cursor mcp டொமைன்", "windsurf mcp டொமைன்", "எடிட்டரிலேயே டொமைன் பதிவு", "code முகவர் டொமைன் பதிவு", "எடிட்டரிலிருந்து டொமைன் பதிவு", "mcp விரைவுத் தொடக்கம்", "namefi mcp அமைப்பு", "MCP OAuth PKCE", "vercel தனிப்பயன் டொமைன் namefi", "cloudflare pages தனிப்பயன் டொமைன் namefi", "ai முகவர் deploy தனிப்பயன் டொமைன்", "டொமைன் பதிவு விரைவுத் தொடக்கம்", "x-api-key mcp அமைப்பு", "deploy-ஐ நோக்கி டொமைனைச் சுட்டுதல்"]
relatedArticles:
  - /ta/blog/ai-agent-register/
  - /ta/blog/claude-mcp-domains/
  - /ta/blog/namefi-mcp/
  - /ta/blog/wallet-checkout/
  - /ta/blog/vibe-coding-domain/
relatedTopics:
  - /ta/topics/domain-tokenization/
  - /ta/topics/domain-basics/
relatedSeries:
  - /ta/series/tokenize-your-com/
  - /ta/series/blockchain-concepts/
relatedGlossary:
  - /ta/glossary/ai-agent/
  - /ta/glossary/registrar/
  - /ta/glossary/dns-record-types/
  - /ta/glossary/nameserver/
  - /ta/glossary/domain-renewal/
---

நீங்கள் ஏற்கெனவே எடிட்டருக்குள் இருக்கிறீர்கள். செயலியின் அடித்தளம் உருவாக்கப்பட்டுவிட்டது; முதல் deploy ஒரு தளத்தின் subdomain-க்குச் சென்றுவிட்டது; இப்போது அதை மக்களிடம் பகிர்வதற்கு முன் மீதமிருப்பது உண்மையான ஒரு டொமைன் மட்டுமே. செயலியை உருவாக்கிய அதே [code எழுதும் முகவர்](/ta/glossary/ai-agent/) அமர்விலிருந்து அந்தப் பதிவுப் படியைச் செய்வதற்கான விரைவுத் தொடக்கம் இதுதான்: Claude Code, Cursor மற்றும் Windsurf-க்கான துல்லியமான [MCP](https://modelcontextprotocol.io) இணைப்பு அமைப்பு, சுருக்கமான ஐந்து படி செயல்முறை, மேலும் — பெரும்பாலான டொமைன் வழிகாட்டிகள் தவிர்க்கும் பகுதி — இப்போது பதிவுசெய்த டொமைனை, இப்போது deploy செய்த செயலியை நோக்கிச் சுட்டுவது எப்படி என்பதும் இதில் அடங்கும். அங்கீகாரத்திற்காக OAuth ஒருமுறை உலாவியைத் திறக்கலாம்; அதன் பிறகு டொமைன் செயல்முறை மீண்டும் எடிட்டருக்குத் திரும்பும்.

இந்த வழிகாட்டி மூன்று எடிட்டர்களைத் திட்டமிட்டே உள்ளடக்குகிறது. நீங்கள் OpenAI Codex, Gemini CLI அல்லது Claude Desktop-ஐப் பயன்படுத்தினால், [Namefi-ல் உங்கள் AI முகவர் மூலம் ஒரு டொமைனைப் பதிவுசெய்வது எப்படி](/ta/blog/ai-agent-register/) என்ற மைய வழிகாட்டியில் ஆறு client-களுக்குமான சரிபார்க்கப்பட்ட அமைப்பும், MCP-ஐ இயல்பாக ஆதரிக்காத எதற்கும் நேரடி REST வழியும் உள்ளன. இங்குள்ள அனைத்தும் அந்த மைய வழிகாட்டி குறிப்பிடும் அதே [Namefi](https://namefi.io) MCP சேவையகத்துடன் இணைகின்றன; எனவே கீழுள்ள எதுவும் அதற்கு முரணாகாது — இந்தப் பக்கம் developer கருவிகளை மையமாகக் கொண்ட சுருக்கப்பட்ட பதிப்பு மட்டுமே; மைய வழிகாட்டியில் இல்லாத deploy படியும் இதில் உள்ளது.

## எடிட்டருக்குள்ளேயே டொமைனைப் பதிவுசெய்வது ஏன்

"ஒரு டொமைனைப் பதிவுசெய்" என்பது ஐந்து நிமிட வேலையைக் காட்டிலும் அதிகச் செலவுள்ள ஒரு context switch: எடிட்டரை விட்டு வெளியேறுதல், ரெஜிஸ்ட்ரார் தளத்தைத் திறத்தல், பெயரைத் தேடுதல், நீங்கள் கேட்காத privacy protection மற்றும் email hosting upsell-களைத் தாண்டிச் செல்லுதல், பணம் செலுத்துதல், பின்னர் திரும்பிவந்து எந்த DNS பதிவுகளைச் சேர்க்க வேண்டும் என்று கண்டறிதல்.

அதற்குப் பதிலாக, திட்டத்தை உருவாக்கி deploy-ஐ இணைத்த அதே முகவரையே இறுதிப் பணியையும் கையாள விடலாம்: பெயரைச் சரிபார்த்து, பதிவுசெய்து, DNS-ஐ இணைப்பது — இவை அனைத்தையும் நீங்கள் ஏற்கெனவே நடத்திக்கொண்டிருக்கும் உரையாடலுக்குள் tool call-களாகச் செய்யலாம். [Cloudflare தனது சொந்த Registrar API-க்காக இதே எண்ணத்தின் ஒரு பதிப்பைச் சந்தைப்படுத்துகிறது](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=An%20agent%20using%20the%20API%20can%20suggest%20domain%20names%2C%20check%20registrability%2C%20and%20complete%20the%20purchase%20without%20the%20user%20leaving%20their%20current%20context) — இது சிலரின் தனிப்பட்ட விருப்பம் அல்ல; ஒன்றுக்கு மேற்பட்ட ரெஜிஸ்ட்ரார்கள் உருவாக்கிவரும் செயல்முறை என்பதற்கான சான்று. இறுதிக்கு அருகிலுள்ள ஒப்பீட்டுப் பகுதி Cloudflare கோணத்தைத் தனியாக விளக்குகிறது; Namefi-ன் பதிப்பு [டோக்கனைஸ் செய்யப்பட்ட டொமைன்](/ta/glossary/tokenized-domain/) விருப்பத்தையும், கணக்கே தேவையில்லாத பணப்பைக் கையொப்பப் பணம் செலுத்தும் வழியையும் சேர்க்கிறது; அது [கிரிப்டோ பணப்பை மூலம் டொமைன்களுக்கு பணம் செலுத்துதல்](/ta/blog/wallet-checkout/) என்ற கட்டுரையில் விளக்கப்பட்டுள்ளது.

## இணைப்பை அமைத்தல்: மூன்று எடிட்டர்கள், மூன்று அமைப்புக் கோப்புகள்

கீழுள்ள மூன்று எடிட்டர்களும் Streamable HTTP வழியாக `https://api.namefi.io/mcp` முகவரிக்கு இணைகின்றன. தற்போதைய சேவையகம் இரண்டு அங்கீகார வழிகளை அறிவிக்கிறது: PKCE உடனான OAuth 2.1 authorization code (dynamic client registration உட்பட) மற்றும் `x-api-key` header-ல் அனுப்பப்படும் Namefi [API விசை](https://namefi.io/api-key). client OAuth-ஐ ஆதரித்து, உங்களிடம் ஏற்கெனவே விசை இல்லையெனில் OAuth-ஐத் தேர்ந்தெடுக்கவும்; வெளிப்படையான header அடிப்படையிலான அல்லது தானியக்க அமைப்புகளுக்கு விசையைப் பயன்படுத்தவும்.

இந்த விரைவுத் தொடக்கத்திற்கு முக்கியமான தற்போதைய நடத்தை குறித்த ஓர் எச்சரிக்கை உள்ளது. படிக்க மட்டும் பயன்படும் கருவிகளுக்கு அங்கீகாரம் தேவையில்லை என்று Namefi-ன் discovery descriptor கூறுகிறது; ஆனால் இந்தக் கட்டுரை **ஜூலை 14, 2026** அன்று சரிபார்க்கப்பட்டபோது, அங்கீகாரம் இல்லாத MCP `initialize` கோரிக்கை `401 Unauthorized` எனத் திரும்பியது. படிக்க மட்டும் பயன்படும் கருவியைக் கூட அழைப்பதற்கு முன் client MCP அமர்வை initialize செய்ய வேண்டும்; எனவே சேவையக நடத்தை அல்லது descriptor மாறும் வரை, நேரடி endpoint-க்கு அங்கீகாரம் தேவைப்படுகிறது என்றே கருதுங்கள்.

### Claude Code

OAuth-க்கு நிலையான அங்கீகார header இல்லாமல் சேவையகத்தைச் சேர்க்கவும்:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp
claude mcp login namefi
```

ஊடாடும் அமர்வுக்குள் `/mcp` மூலமும் Claude Code OAuth செயல்முறையைத் தொடங்க முடியும். `401` அல்லது `403` பதில் வந்தால் தொலைநிலைச் சேவையகத்திற்கு அங்கீகாரம் தேவை என்று அதன் ஆவணம் குறிப்பிடுகிறது; உலாவியில் வரும் அங்கீகாரப் படிகளைப் பின்பற்றுங்கள். அதற்குப் பதிலாக API விசை அங்கீகாரத்தைப் பயன்படுத்த, தனிப்பயன் header-ஐச் சேர்க்கவும்:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

நீங்கள் பயன்படுத்த விரும்பும் அங்கீகார வகைக்கான கட்டளையை மட்டும் இயக்குங்கள். விசைக் கட்டளையில் `YOUR_KEY` என்பதற்குப் பதிலாக உண்மையான விசையை இடுங்கள்; அதை commit செய்வதைத் தவிர்க்கவும். இயல்பாக Claude Code சேவையகத்தை **local** scope-ல் எழுதுகிறது — இந்தத் திட்டத்தில் உங்களுக்கு மட்டும் கிடைக்கும். உங்கள் கணினியிலுள்ள எல்லாத் திட்டங்களிலும் கிடைக்க `--scope user` சேர்க்கவும்; `claude mcp list` மூலம் இணைப்பை உறுதிசெய்யவும்.

### Cursor

Cursor, `mcp.json`-லிருந்து MCP சேவையகங்களைப் படிக்கிறது — திட்ட அளவிலான கோப்பு `.cursor/mcp.json`; எல்லாத் திட்டங்களுக்குமான கோப்பு `~/.cursor/mcp.json`. Streamable HTTP சேவையகங்களுக்கு OAuth ஆதரவை Cursor ஆவணப்படுத்துகிறது. OAuth-க்கு URL மட்டும் அமைத்து, சேவையகத்தை இயக்கி, ஊடாடும் அங்கீகாரக் கேள்வியை நிறைவு செய்யுங்கள்:

```json
{
  "mcpServers": {
    "namefi": {
      "url": "https://api.namefi.io/mcp"
    }
  }
}
```

API விசை அங்கீகாரத்திற்கு, Cursor ஆவணப்படுத்தியுள்ள தொலைநிலைச் சேவையக வடிவம் சூழல் மாறி இடைச்செருகலுடன் header-களை ஆதரிக்கிறது; ஆகவே விசையை கோப்பிலேயே எழுத வேண்டியதில்லை:

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

Cursor-ஐத் தொடங்கிய shell-ல் `NAMEFI_API_KEY` என்ன மதிப்பைக் கொண்டிருக்கிறதோ அதுவாக `${env:NAMEFI_API_KEY}` மாறும் — எடிட்டரைத் திறப்பதற்கு முன் அந்த மாறியை export செய்யுங்கள். OAuth ஆதரிக்கும் சேவையகம் “Needs authentication” நிலையிலேயே இருந்தால், Cursor-ன் MCP settings-ல் இருந்து அங்கீகாரச் செயல்முறையைத் தொடங்குங்கள்; client பதிப்புக்கும் Remote SSH-க்கும் ஏற்ப நடத்தை மாறலாம், எனவே API விசை அமைப்பை fallback ஆக வைத்திருங்கள்.

### Windsurf (Cascade)

**Cascade** என்ற பெயரில் வழங்கப்படும் Windsurf-ன் MCP ஒருங்கிணைப்பு, `~/.codeium/windsurf/mcp_config.json`-ஐப் படிக்கிறது. Streamable HTTP இணைப்புகளுக்கு OAuth-ஐ Cascade ஆதரிக்கிறது என்று அதன் தற்போதைய ஆவணம் கூறுகிறது. URL மட்டும் உள்ள பதிவுடன் தொடங்கி, MCP settings UI-ல் இருந்து அங்கீகாரத்தை நிறைவு செய்யுங்கள்:

```json
{
  "mcpServers": {
    "namefi": {
      "serverUrl": "https://api.namefi.io/mcp"
    }
  }
}
```

API விசை அங்கீகாரத்திற்கு, சூழல் மாறி இடைச்செருகல் வழியாக header-ஐச் சேர்க்கவும்:

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

குறிப்பிட வேண்டிய ஒன்று: இந்த வழிகாட்டி வெளியான தேதியில் `docs.windsurf.com/windsurf/cascade/mcp`, `docs.devin.ai/desktop/cascade/mcp`-க்கு வழிமாற்றுகிறது — Windsurf-ன் ஆவணங்கள் இப்போது Cognition-ன் Devin தயாரிப்பு ஆவண domain-ல் உள்ளன; மேலுள்ள அமைப்பு வடிவமே அந்தத் தற்போதைய பக்கம் ஆவணப்படுத்துவது. நீங்கள் பழைய build-ஐப் பயன்படுத்தினால், உங்கள் பதிப்பின் in-app help சுட்டும் ஆவண இணைப்பில் புலப் பெயர்களைச் சரிபார்க்கவும்.

## ஐந்து படி விரைவுத் தொடக்கம்: புதிய செயலியிலிருந்து நேரடி DNS வரை

மேலுள்ள இணைப்புகளில் ஒன்று செயல்படத் தொடங்கியதும், நீங்கள் எந்த எடிட்டரைப் பயன்படுத்தினாலும் மீதமுள்ள செயல்முறை ஒன்றே.

1. **அங்கீகாரத்தைத் தேர்ந்தெடுக்கவும்.** எடிட்டரின் OAuth செயல்முறையைப் பயன்படுத்துங்கள்; அல்லது [namefi.io/api-key](https://namefi.io/api-key)-ல் API விசையை உருவாக்கி, version control-க்கு வெளியே வைத்திருங்கள்.
2. **மேலுள்ள பொருத்தமான அமைப்பைப் பயன்படுத்தி இணைத்து அங்கீகரிக்கவும்.** பின்னர் ஒரு sanity check செய்யுங்கள்: “Namefi-ல் `<yourapp>.com` கிடைக்கிறதா என்று சரிபார்த்து, எந்தக் கருவியை அழைத்தீர்கள் என்று சொல்லுங்கள்” எனக் கேளுங்கள். `checkAvailability` படிக்க மட்டும் பயன்படும்; அது பணம் செலவிடாது. ஆனால் MCP அமர்வை initialize செய்ய தற்போதைய நிலையில் அங்கீகாரம் இன்னும் தேவைப்படுகிறது.
3. **பதிவுசெய்யவும்.** பெயரையும் கால அளவையும் இயல்பான மொழியில் உறுதிசெய்யுங்கள் — “அதை ஓர் ஆண்டுக்குப் பதிவுசெய்.” முகவர் `registerDomain`-ஐச் சமர்ப்பித்து, ஆர்டர் `SUCCEEDED` நிலையை (அல்லது இறுதியான தோல்வி நிலையை) அடையும் வரை polling செய்யும்; வழக்கமான ஒரு பதிவு சில polling சுற்றுகளில் முடிகிறது.
4. **உங்கள் deploy-ஐ நோக்கிச் சுட்டுங்கள்.** அடுத்த பகுதி இந்தப் படியை விரிவாக விளக்குகிறது — உங்கள் hosting platform கேட்கும் DNS பதிவுகளை அதே உரையாடல் வழியாகச் சேர்க்கவும்.
5. **அது resolve ஆகிறதா என்று சரிபார்க்கவும்.** [DNS பரவல்](/ta/glossary/dns-propagation/) உடனடியாக நடக்காது; சில நிமிடங்கள் காத்திருந்து, பொது DNS lookup மூலம் அல்லது டொமைனை உலாவியில் திறந்து உறுதிசெய்யுங்கள்.

## புதிய டொமைனை இப்போது deploy செய்த செயலியுடன் இணைத்தல்

பொதுவான “ஒரு டொமைனை எப்படிப் பதிவுசெய்வது” என்ற வழிகாட்டி இந்தப் பகுதிக்குச் செல்வதில்லை; ஏனெனில் இது பதிவுக்குப் பிறகு hosting platform பக்கத்தில் நடைபெறும். ஆனால் எடிட்டருக்குள் இதைச் செய்வதன் உண்மையான பயன் இதுவே: உங்கள் முகவருக்கு எந்தத் தளத்தில் deploy செய்தது என்பது ஏற்கெனவே தெரியும்; பதிவோடு சேர்த்து அதே உரையாடலில் DNS-ஐ இணைக்க முடியும்.

### Vercel

Vercel-ன் சொந்த டொமைன் ஆவணம், உங்கள் project dashboard-ல் **Settings → Domains** வழியாகச் செல்லச் சொல்கிறது: டொமைனைச் சேர்த்ததும், அது apex domain-ஆ அல்லது subdomain-ஆ என்பதைப் பொறுத்து எந்தப் பதிவை உருவாக்க வேண்டும் என்று Vercel காட்டும். **Apex domain** (`yourapp.com`) என்றால், அதன் serving IP-ஐ நோக்கிய **A record**-ஐ Vercel கேட்கும்; **subdomain** (`www.yourapp.com`) என்றால் **CNAME**-ஐக் கேட்கும். பழைய வழிகாட்டியிலிருந்து ஓர் உதாரணத்தை நகலெடுப்பதற்கு முன் அறிய வேண்டியது: [ஒவ்வொரு project-க்கும் தனித்துவமான CNAME பதிவு உள்ளது என்று Vercel-ன் ஆவணம் தெளிவாகக் கூறுகிறது](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record); எல்லா project-களும் பகிரும் ஒரே நிலையான hostname அல்ல, dashboard உங்களுக்குக் காட்டும் மதிப்பையே பயன்படுத்த வேண்டும்.

அந்த மதிப்பைப் பெற்றதும், DNS பக்கம் இன்னொரு முகவர் கோரிக்கை மட்டுமே:

> “`@`-க்கு `76.76.21.21`-ஐ நோக்கிய A record-ஐயும், `www`-க்கு Vercel எனக்குக் கொடுத்த CNAME இலக்கை நோக்கிய CNAME-ஐயும் சேர்க்கவும்.”

இது `createDnsRecord`-ஐ இருமுறை அழைக்கும் — ஒவ்வொரு பதிவுக்கும் ஒருமுறை — Namefi-ல் எந்த DNS எழுதும் செயலுக்கும் பயன்படுத்தப்படும் அதே [DNS பதிவு](/ta/glossary/dns-record-types/) கருவி இது. மற்ற இடங்களைப் போலவே இங்கும் trailing-dot விதி பொருந்தும்: CNAME இலக்கின் `rdata` இறுதியில் ஒரு புள்ளி இருக்க வேண்டும்; `zoneName`-ல் (உங்கள் டொமைன்) இருக்கக் கூடாது.

### Cloudflare Pages

உங்கள் deploy இலக்கு Cloudflare Pages எனில், நீங்கள் subdomain-ஐ இணைக்கிறீர்களா அல்லது apex-ஐ இணைக்கிறீர்களா என்பதைப் பொறுத்து பதிவு முறை மாறும். DNS வேறொரு வழங்குநரிடமே இருக்கும் `app.yourdomain.com` போன்ற **subdomain**-க்கு, [Cloudflare-ன் custom-domain ஆவணம்](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain) உங்கள் project-ன் `.pages.dev` hostname-ஐ நோக்கிய ஒரே **CNAME**-ஐப் பயன்படுத்துகிறது. முதலில் Workers & Pages → உங்கள் project → Custom domains → Set up a domain என்பதில் அந்தத் துல்லியமான subdomain-ஐச் சேர்க்கவும்; அதன் பிறகு உங்கள் DNS வழங்குநரிடம் CNAME-ஐ உருவாக்கவும்.

> “`app`-க்கு `my-project.pages.dev.`-ஐ நோக்கிய CNAME-ஐச் சேர்க்கவும்.”

`yourdomain.com` போன்ற **apex domain**-க்கு Cloudflare வேறு தேவையை ஆவணப்படுத்துகிறது: டொமைனை Cloudflare zone ஆகச் சேர்த்து, ரெஜிஸ்ட்ராரின் nameserver-களை ஒதுக்கப்பட்ட Cloudflare nameserver-களை நோக்கிச் சுட்ட வேண்டும். வெளிப்புற DNS வழங்குநரிடம் CNAME அமைப்பது, apex-க்கான ஆவணப்படுத்தப்பட்ட முறை அல்ல. இந்த நிலையில், தற்போதைய Namefi கருவிகள் அந்தச் செயல்பாட்டை ஆதரித்தால் மட்டுமே, ரெஜிஸ்ட்ரார் nameserver அமைப்பில் முகவர் உதவ முடியும்; `createDnsRecord` மட்டும் அதற்குப் பதிலாகாது. மேலுள்ள subdomain வழியில், அதே DNS-record கருவி அழைப்பும், இலக்கின் இறுதியில் அதே trailing-dot விதியும் பொருந்தும்.

<!-- TODO: சரிபார்க்க வேண்டும் — புதிதாக இணைக்கப்பட்ட custom domain-ல் TLS சான்றிதழை வழங்கவும் புதுப்பிக்கவும் Vercel மற்றும் Cloudflare Pages மேற்கொள்ளும் துல்லியமான படிகள்; இரண்டிலும் அது தானாக நடக்கிறதா அல்லது கைமுறை trigger தேவையா என்பதை நம்பிக்கையுடன் கூறுவதற்காக -->

## இது Cloudflare-ன் எடிட்டருக்குள் நடைபெறும் பதிவுடன் எவ்வாறு ஒப்பிடப்படுகிறது

எடிட்டருக்குள் பதிவு செய்யும் கோணத்தைச் சந்தைப்படுத்தும் மற்றொரு ரெஜிஸ்ட்ரார் Cloudflare; அதனால் அதை நேரடியாகக் குறிப்பிடுவது பொருத்தமானது. [ஏப்ரல் 2026 நிலவரப்படி beta-வில் இருப்பதாகச் செய்தி வெளியான](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/) அதன் Registrar API, Cursor மற்றும் Claude Code உட்பட MCP திறன் கொண்ட எடிட்டர்களுடன் ஒருங்கிணைகிறது; முகவர் அதன் தற்போதைய context-ஐ விட்டு வெளியேறாமல், டொமைனைத் தேடி, விலையை அறிந்து, ஒத்திசைவாகப் பதிவுசெய்ய முடியும் — இந்த வழிகாட்டி Namefi-க்காக விளக்கும் அதே மைய எண்ணம். beta நிலையில், பதிவுக்குப் பிந்தைய transfers மற்றும் renewals போன்ற நிர்வாகத்தை Cloudflare API இன்னும் உள்ளடக்கவில்லை; அவை 2026-ன் பிற்பகுதிக்கு திட்டமிடப்பட்டுள்ளன என்றும் அதே அறிக்கை குறிப்பிடுகிறது.

Namefi-ன் MCP சேவையகம் இன்று முழு lifecycle-ஐ உள்ளடக்குகிறது — பதிவு, DNS, [தானியங்கி புதுப்பித்தல்](/ta/glossary/domain-renewal/) — மேலும் Cloudflare வழியில் இல்லாத இரண்டு அம்சங்களையும் சேர்க்கிறது: இயல்பாக டொமைன் ஒரு [டோக்கனைஸ் செய்யப்பட்ட டொமைன்](/ta/glossary/tokenized-domain/) NFT ஆகப் பதிவாகிறது (எந்தப் பணப்பைக்கும் திருப்பிவிடலாம்); மேலும் Namefi கணக்கே இல்லாமல் பணப்பைக் கையொப்ப checkout-ஐ ஆதரிக்கிறது, இது [கிரிப்டோ பணப்பை மூலம் டொமைன்களுக்கு பணம் செலுத்துதல்](/ta/blog/wallet-checkout/) என்ற கட்டுரையில் விரிவாக விளக்கப்பட்டுள்ளது. இரண்டுமே “எடிட்டரை விட்டு வெளியேற வேண்டாம்” என்ற செயல்முறையை நோக்கி உருவாகின்றன; வழக்கமான பதிவு வேண்டுமா, அல்லது on-chain சொத்தாகவும் இருக்கும் பதிவு வேண்டுமா என்பதைப் பொறுத்து பொருத்தமானது மாறும்.

## அடிக்கடி கேட்கப்படும் கேள்விகள்

### இது Codex அல்லது Gemini CLI-யையும் உள்ளடக்குகிறதா?
இந்தப் பக்கத்தில் இல்லை — Claude Code, Cursor மற்றும் Windsurf ஆகியவற்றுக்கே இந்த வழிகாட்டி திட்டமிட்டு வரையறுக்கப்பட்டுள்ளது. [Namefi-ல் உங்கள் AI முகவர் மூலம் ஒரு டொமைனைப் பதிவுசெய்வது எப்படி](/ta/blog/ai-agent-register/) என்ற வழிகாட்டியில் Codex CLI, Gemini CLI மற்றும் Claude Desktop-க்கான அதே துல்லியமான, சரிபார்க்கப்பட்ட அமைப்பு உள்ளது.

### இதை முயற்சிப்பதற்கு முன் எனக்கு Namefi கணக்கு தேவையா?
தற்போதைய நேரடி endpoint-ஐ initialize செய்ய அங்கீகரிக்கப்பட்ட MCP அமர்வு தேவை. OAuth-ஐப் பயன்படுத்துங்கள் அல்லது API விசையை வழங்குங்கள். availability call படிக்க மட்டும் பயன்படும்; அதற்கு நிதி தேவையில்லை. ஆனால் discovery descriptor-ன் அங்கீகாரம் தேவையில்லை என்ற கூற்று நேரடி நடத்தையுடன் பொருந்தும் வரை அதை நம்ப வேண்டாம்.

### என் deployment platform Vercel அல்லது Cloudflare Pages அல்ல என்றால் என்ன செய்வது?
எங்கும் அடிப்படை முறை இதேதான்: உங்கள் platform dashboard எந்த DNS பதிவு வகை தேவை என்று தெரிவிக்கும் — பெரும்பாலும் apex domain-க்கு A record, subdomain-க்கு CNAME — அந்த மதிப்பை `createDnsRecord` வழியாக எழுத உங்கள் முகவரிடம் கொடுங்கள்.

### இந்த முறையில் பதிவுசெய்தால் டொமைன் தானாகவே டோக்கனைஸ் செய்யப்படுமா?
ஆம், இயல்பாக — கோரிக்கையில் வேறொரு `nftReceivingWallet`-ஐ குறிப்பிடாவிட்டால், அங்கீகரிக்கப்பட்ட வாங்குபவரின் பணப்பைக்கு Base-ல் NFT ஆக டொமைன் பதிவாகும். இது உங்களுக்குப் புதியதாக இருந்தால் [டோக்கனைஸ் செய்யப்பட்ட டொமைன்கள் என்றால் என்ன?](/ta/blog/what-are-tokenized-domains/) என்பதைப் பார்க்கவும்.

### API விசையை முற்றிலும் தவிர்க்க முடியுமா?
ஆம். இணக்கமான MCP client-ல் PKCE உடனான OAuth 2.1-ஐப் பயன்படுத்துங்கள்; அப்போது எடிட்டர் அமைப்பில் நிலையான Namefi API விசை சேமிக்கப்படாது. தனியாக, Namefi-ன் பணப்பைக் கையொப்ப [x402](/ta/glossary/x402/) checkout வழி, API விசை இல்லாமலேயே ஒரு பதிவுக்கு அங்கீகாரம் வழங்கி பணம் செலுத்த முடியும்; அது [கிரிப்டோ பணப்பை மூலம் டொமைன்களுக்கு பணம் செலுத்துதல்](/ta/blog/wallet-checkout/) என்ற கட்டுரையில் விளக்கப்பட்டுள்ளது. ஆனால் அந்த x402 பரிவர்த்தனை வழி, அங்கீகாரம் இல்லாத MCP `initialize` கோரிக்கையை வெற்றிபெறச் செய்யாது.

## செயலியுடன் சேர்த்து பெயரையும் வெளியிடுங்கள்

deploy இலக்கும் database-உம் போல டொமைனும் infrastructure-ன் ஒரு பகுதி. மேலுள்ள மூன்று அமைப்புகளில் ஒன்றை இணைத்து, OAuth-ஐ நிறைவுசெய்யுங்கள் அல்லது விசையை வழங்குங்கள்; அதன் பிறகு ஐந்து படி செயல்முறையை இயக்குங்கள். OAuth-க்கு உலாவி அங்கீகாரப் படி தேவைப்படலாம்; அதன்பிறகு பதிவு, DNS மாற்றங்கள் மற்றும் சரிபார்ப்பை எடிட்டரிலிருந்தே தொடரலாம்.

OAuth-ஐப் பயன்படுத்துங்கள் அல்லது **[Namefi API விசையை உருவாக்குங்கள்](https://namefi.io/api-key)**; பின்னர் நீங்கள் ஏற்கெனவே திறந்துவைத்திருக்கும் எடிட்டரில் availability-check prompt-ஐ முயற்சிக்கவும். ஒவ்வொரு படியையும் விரிவாகப் பார்க்க விரும்பினால், [குறிப்புரைகளுடனான உரையாடல் பதிவைக் கொண்ட முழுமையான Claude Code வழிகாட்டியை](/ta/blog/claude-mcp-domains/) படிக்கவும்.

## ஆதாரங்களும் மேலும் வாசிக்கவும்

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP சேவையக URL, transport, authentication, registration/DNS endpoint reference — இந்த வழிகாட்டியின் ஒவ்வொரு Namefi சார்ந்த கூற்றிற்குமான முதன்மை ஆதாரம்)
- Namefi — [docs.namefi.io: ஒரு டொமைனைப் பதிவுசெய்தல்](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (பதிவுக் கோரிக்கைப் புலங்கள், polling செயல்முறை, order status மதிப்புகள்)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP discovery descriptor, OAuth metadata, மேலும் ஜூலை 14, 2026 அன்று நேரடி `initialize` நடத்தையுடன் மாறுபட்ட படிக்க மட்டும் பயன்படும் கருவிகளுக்கான அங்கீகாரக் கூற்று)
- Anthropic / Claude Code — [MCP மூலம் Claude Code-ஐ கருவிகளுடன் இணைத்தல்](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (`claude mcp add --transport http` தொடரமைப்பு, `--header`, `--scope` கொடிகள்)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (`mcp.json` தொலைநிலைச் சேவையக வடிவம், `headers`, `${env:VAR}` இடைச்செருகல், திட்டம் மற்றும் global அமைப்பு இருப்பிடங்கள்)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (இந்த வழிகாட்டி வெளியான தேதியில் [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp)-க்கு வழிமாற்றுகிறது; `mcp_config.json` வடிவம், `serverUrl`, `headers`)
- Vercel — [தனிப்பயன் டொமைனைச் சேர்த்தலும் அமைத்தலும்](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record) (apex-domain A record, subdomain-களுக்கான project-க்கே உரிய CNAME இலக்கு, nameserver முறை)
- Vercel — [Domains மேலோட்டம்](https://vercel.com/docs/domains#:~:text=76.76.21.21) (apex A record-களுக்குப் பயன்படுத்தப்படும் `76.76.21.21` serving IP)
- Cloudflare — [Pages-க்கான custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/) (custom subdomain-களுக்கான வெளிப்புற-DNS CNAME செயல்முறை; apex domain-களுக்கான Cloudflare zone மற்றும் nameserver தேவைகள்)
- webhosting.today — [AI முகவர்கள் இப்போது மனிதர் இல்லாமல் டொமைன்களைப் பதிவுசெய்யலாம்](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/) (Cloudflare Registrar API beta அறிக்கை: எடிட்டர் ஒருங்கிணைப்புகள், beta வரம்புகள்)
- Model Context Protocol — [modelcontextprotocol.io](https://modelcontextprotocol.io) (நெறிமுறை மேலோட்டம்)
