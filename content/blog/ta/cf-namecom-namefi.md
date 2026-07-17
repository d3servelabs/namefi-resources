---
title: "Cloudflare vs Name.com vs Namefi: முகவர்-நேட்டிவ் ரெஜிஸ்ட்ரார்கள்"
date: '2026-07-10'
language: 'ta'
tags: ['ai-agents', 'comparison']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['arivu-iyandhiran']
draft: false
format: comparison
ogImage: ../../assets/cf-namecom-namefi-og.jpg
description: "மூன்று முகவர்-நேட்டிவ் ரெஜிஸ்ட்ரார்களின் அம்சவாரியான ஒப்பீடு: விலையிடல், MCP ஆதரவு, கிரிப்டோ checkout, டோக்கனைஸ் செய்யப்பட்ட உரிமை மற்றும் ஒவ்வொன்றையும் எப்போது தேர்ந்தெடுப்பது."
keywords: ["cloudflare registrar api", "name.com ai api", "namefi mcp", "முகவர்-நேட்டிவ் ரெஜிஸ்ட்ரார்", "AI ரெஜிஸ்ட்ரார் ஒப்பீடு", "கிரிப்டோ டொமைன் checkout", "டோக்கனைஸ் செய்யப்பட்ட டொமைன்", "MCP டொமைன் பதிவு", "AI முகவர் டொமைன் வாங்குதல்", "cloudflare vs namefi", "name.com vs namefi", "அடக்க விலை டொமைன் விலையிடல்", "பணப்பை checkout டொமைன்"]
relatedArticles:
  - /ta/blog/ai-domain-platforms/
  - /ta/blog/agent-native/
  - /ta/blog/airo-vs-namefi/
  - /ta/blog/claude-mcp-domains/
  - /ta/blog/ai-agent-register/
relatedTopics:
  - /ta/topics/domain-tokenization/
  - /ta/topics/choosing-a-tld/
relatedSeries:
  - /ta/series/tokenize-your-com/
  - /ta/series/best-tlds-by-industry/
relatedGlossary:
  - /ta/glossary/ai-agent/
  - /ta/glossary/registrar/
  - /ta/glossary/tokenized-domain/
  - /ta/glossary/dnssec/
  - /ta/glossary/wallet/
---

இப்போது மூன்று [ரெஜிஸ்ட்ரார்கள்](/ta/glossary/registrar/), checkout படிவத்தை ஒரு மனிதர் மட்டுமே நிரப்ப வேண்டும் என்ற கட்டுப்பாட்டை நீக்கியுள்ளன. Cloudflare, browser session இல்லாமலேயே ஓர் [AI முகவர்](/ta/glossary/ai-agent/) டொமைனைப் பதிவுசெய்ய உதவும் beta API-ஐ ஏப்ரல் 2026-இல் அறிமுகப்படுத்தியது. Name.com இதே கருத்தை மையமாகக் கொண்டு தனது API-ஐ மறுகட்டமைத்து, தன்னை முதல் AI-நேட்டிவ் டொமைன் தளம் என அழைக்கிறது. Namefi, Model Context Protocol (MCP) server-ஐயும் கணக்கு உருவாக்கும் படியை முழுவதுமாகத் தவிர்க்கும் பணப்பை கையொப்பமிட்ட checkout-ஐயும் உருவாக்கியுள்ளது. டொமைன் பதிவு என்பது browser-இல் ஒருவர் செய்யும் வேலையிலிருந்து, API அழைப்பின் மூலம் முகவர் செய்யும் வேலையாக மாறுகிறது என்ற ஒரே மாற்றத்தை மூன்றும் நோக்கிச் செல்கின்றன.

ஆனால் வெவ்வேறு logo-களை அணிந்த ஒரே தயாரிப்பு இவை அல்ல. விலை, “முகவர்-நேட்டிவ்” என்பதற்குத் தேவையான அம்சங்கள், வாங்குபவர் பணம் செலுத்தும் திறனை நிரூபிக்கும் முறை ஆகியவற்றில் ஒவ்வொன்றும் வெவ்வேறு முடிவுகளை எடுத்துள்ளன. Cloudflare-இன் விலையை மிஞ்சுவது உண்மையிலேயே கடினமான இடங்களையும், Name.com-இன் சந்தைப்படுத்தல் நிலைப்பாடு அது வெளியிட்டுள்ள அம்சங்களைவிட முன்னிலையில் இருக்கும் இடங்களையும் உள்ளடக்கிய அம்சவாரியான ஒப்பீடு இது.

## “முகவர்-நேட்டிவ்” என்பதற்கு உண்மையில் என்ன தேவை?

API இருப்பதும் அதை ஒரு முகவர் பயன்படுத்த முடிவதும் ஒன்றல்ல. பெரும்பாலான ரெஜிஸ்ட்ரார்கள் பல ஆண்டுகளாக நிரலாக்க முறையில் பதிவு செய்யும் வசதியை வழங்கியுள்ளன. ஆனால் அந்த இடைமுகங்கள், சாத்தியமான செயல்களைத் தானாகக் கண்டறியவும், ஒருவர் password தட்டச்சு செய்யாமல் அங்கீகரிக்கவும், ஒருவர் படிக்காமல் பிழைச் செய்தியைப் புரிந்துகொள்ளவும் வேண்டிய தன்னாட்சி செயல்முறைக்காக உருவாக்கப்படவில்லை; ஆவணங்களைப் படிக்கும் மறுவிற்பனையாளர்கள் மற்றும் டெவலப்பர்களுக்காக உருவாக்கப்பட்டவை. வெறுமனே “API கொண்ட” ரெஜிஸ்ட்ராரையும் முகவர்-நேட்டிவ் ரெஜிஸ்ட்ராரையும் பிரிக்கும் விரிவான சரிபார்ப்புப் பட்டியல் [AI முகவர்களை மையமாகக் கொண்ட டொமைன் ரெஜிஸ்ட்ரார் என்றால் என்ன?](/ta/blog/agent-native/) என்ற கட்டுரையில் உள்ளது. சுருக்கமாகச் சொன்னால், முகவரால் API-ஐத் தானாகக் கண்டறிய முடியுமா, பதில்கள் இயந்திரம் வாசிக்கக்கூடியவையா, மனிதர் credit card வைத்திருப்பார் என்று கருதாத பணம் செலுத்தும் பாதை உள்ளதா என்பவையே முக்கியம். கீழுள்ள மூன்று ரெஜிஸ்ட்ரார்களும் வெவ்வேறு அளவில் இந்தத் தகுதிநிலையை அடைகின்றன.

## Cloudflare Registrar API: அடக்க விலை, beta, உங்கள் editor-இலேயே தயார்

Cloudflare-இன் “Agents Week” அறிவிப்புகளின்போது, அதன் Registrar API ஏப்ரல் 15, 2026 அன்று beta-வில் அறிமுகமானது. கணக்கு உரிமையாளர் ஒருமுறை செய்ய வேண்டிய முன்னேற்பாடுகளை — Cloudflare கணக்கும் API token-உம், default payment method கொண்ட billing profile, இயல்புநிலை பதிவாளர் தொடர்புத் தகவல் மற்றும் Domain Registration Agreement-ஐ ஏற்றுக்கொள்வது — முடித்த பிறகு, ஒவ்வொரு கொள்முதலுக்கும் browser-க்குத் திரும்பாமல் முகவர் தேடவும், விலையைச் சரிபார்க்கவும், பதிவைச் சமர்ப்பிக்கவும் API உதவுகிறது ([Cloudflare Registrar API](https://developers.cloudflare.com/registrar/registrar-api/#before-you-begin)). பதிவு எப்போதும் synchronous ஆக முடியும் என்பதில்லை: endpoint ஒரு வரையறுக்கப்பட்ட நேரம் காத்திருந்து, அந்த நேரத்திற்குள் செயல்முறை முடிந்தால் `201 Created` எனத் திருப்பும்; இல்லாவிட்டால் முகவர் poll செய்ய வேண்டிய status URL-உடன் `202 Accepted` எனத் திருப்பும். `Prefer: respond-async` மூலம் client உடனடி asynchronous செயல்பாட்டையும் கோரலாம் ([Cloudflare Create Registration](https://developers.cloudflare.com/api/resources/registrar/subresources/registrations/methods/create/#response-behavior)). இந்த endpoints Cloudflare MCP வழியாகவும் கிடைப்பதால், அந்தக் கணக்கு அமைப்பை முடித்த பிறகு MCP-ஐ ஆதரிக்கும் editor-இலிருந்தே டெவலப்பர் அவற்றைப் பயன்படுத்தலாம்.

Cloudflare வழங்குவதில் மிகவும் வலுவான அம்சம் விலை. இந்த ஒப்பீடு நம்பகமாக இருக்க வேண்டுமெனில் அதன் உண்மையான பலத்தை ஏற்றுக்கொள்ள வேண்டும்: Cloudflare [.ai டொமைன் பதிவுகளையும் புதுப்பிப்புகளையும் எந்தக் கூடுதல் markup-உம் இல்லாமல் மொத்த விலையில் வழங்குகிறது](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups). மேலும், பதிவுசெய்யப்படும் ஒவ்வொரு டொமைனுடனும் [இலவச DNSSEC, இலவச SSL, இரு-காரணி அங்கீகாரம் மற்றும் இயல்பாகச் செயல்படுத்தப்பட்ட domain lock](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=free%20DNSSEC%2C%20free%20SSL%2C%20two-factor%20authentication%2C%20and%20a%20domain%20lock%20enabled%20by%20default), அதோடு [இலவச WHOIS மறைப்பு](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=every%20.ai%20domain%20comes%20with%20free%20WHOIS%20redaction) ஆகியவை கிடைக்கின்றன. மற்ற ரெஜிஸ்ட்ரார்கள் add-on ஆக விற்கும் [WHOIS தனியுரிமை](/ta/glossary/whois-privacy/) பாதுகாப்புக்கு இங்கு கூடுதல் கட்டணம் இல்லை. ரெஜிஸ்ட்ரார்களைப் பற்றிய தனி மதிப்பீடும் இந்த விலையிடல் முறையை உறுதிசெய்கிறது: Cloudflare-இன் [அடக்க விலையில், பதிவு அல்லது புதுப்பிப்பில் markup இல்லாமல், Cloudflare செலுத்தும் தொகையை மட்டுமே வாடிக்கையாளர் செலுத்துகிறார்](https://www.hostinger.com/tutorials/best-domain-registrars/#:~:text=At-cost%20pricing%20charges%20you%20only%20what%20Cloudflare%20pays%2C%20with%20no%20markup%20at%20registration%20or%20renewal). விலை மட்டுமே உங்கள் முடிவை நிர்ணயிக்கிறது, மேலும் “பதிவுசெய்து பாதுகாப்பாகப் பூட்டுவது” என்பதற்கு அப்பால் எதுவும் தேவையில்லை என்றால், Cloudflare-ஐ மிஞ்சுவது கடினம்.

இதன் குறைபாடு செயல்பாட்டு எல்லை. இந்த beta தேடல், விலைச் சரிபார்ப்பு, பதிவு, பதிவு நிலை மற்றும் தானியக்கப் புதுப்பிப்பு அமைப்பை உள்ளடக்குகிறது. பதிவின்போது `auto_renew`-ஐச் செயல்படுத்தலாம்; பின்னர் அந்த அமைப்பை மாற்றும் PATCH operation-ஐயும் API வழங்குகிறது. எனவே இந்த beta புதுப்பிப்பைத் தானியக்கமாக்குவதை **ஆதரிக்கிறது**. ஆனால் தேவைக்கேற்ப உடனடியாகப் புதுப்பிக்கும் operation, transfer அல்லது contact update ஆகியவற்றை இன்னும் வழங்கவில்லை ([Cloudflare beta limitations](https://developers.cloudflare.com/registrar/registrar-api/#beta-limitations), [Update Registration](https://developers.cloudflare.com/api/resources/registrar/subresources/registrations/methods/edit/)). கிரிப்டோ payment option-உம் டோக்கனைஸ் செய்யப்பட்ட உரிமையும் இல்லை. Cloudflare மூலம் பதிவுசெய்யப்படும் டொமைன் வழக்கமான ரெஜிஸ்ட்ரார் கணக்கில் உள்ள சொத்து; பணப்பை நேரடியாக வைத்திருக்கக்கூடிய சொத்து அல்ல.

## Name.com-இன் AI-நேட்டிவ் API: இயல்பான மொழியிலிருந்து இயங்கும் code வரை

Name.com-இன் முன்மொழிவு Cloudflare-இலிருந்து வேறுபட்டது. விலையை முதன்மைப்படுத்துவதற்குப் பதிலாக, Name.com தனது developer API-ஐ [“முகவர் சார்ந்த AI காலத்துக்காக டொமைன்களை நவீனப்படுத்தும் எங்கள் AI-நேட்டிவ் தளமான புதிய name.com API-இன் அறிமுகம்”](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI) என்பதை மையமாகக் கொண்டு மறுகட்டமைத்துள்ளது. இது [AI முகவர்கள் டொமைன் செயல்பாடுகளுடன் நேரடியாகத் தொடர்புகொள்ள உதவும் Model Context Protocol (MCP) மற்றும் OpenAPI specification](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=supported%20by%20modern%20standards%20like%20Model%20Context%20Protocol%20%28MCP%29%20and%20OpenAPI%20specification%2C%20which%20enable%20AI%20agents%20to%20interact%20directly%20with%20domain) ஆகியவற்றின் மேல் கட்டமைக்கப்பட்டுள்ளது. இதை editor-இலேயே பயன்படுத்தும் செயல்முறையாகவும் நிறுவனம் வெளிப்படையாகச் சந்தைப்படுத்துகிறது: MCP ஆதரவின் மூலம் டெவலப்பர்கள் [Claude, Cursor போன்ற AI tools-இடம் எளிய prompt-களைக் கொடுத்து டொமைன் செயல்பாடுகளைக் கையாளலாம்](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=Leverage%20AI%20tools%20like%20Claude%20and%20Cursor%20to%20handle%20domain%20operations%20through%20simple%20prompts%2C%20thanks%20to%20MCP%20support) என்று அது கூறுகிறது.

Name.com-இன் அறிவிப்பில் தெளிவாகத் தெரியும் வேறுபாடு, இயல்பான மொழியிலிருந்து code உருவாக்கும் அணுகுமுறை. முகவர் ஒரு நிலையான endpoints தொகுப்பை அழைப்பதற்குப் பதிலாக, “என் app-இல் டொமைன் பதிவு வசதியைச் சேர்” என்று நீங்கள் சொல்ல, API ஆவணங்களைப் பயன்படுத்தி ஒருங்கிணைப்புக்கான code-ஐ முகவரே எழுதும் என்பது அதன் முன்மொழிவு. “உலகம் இந்தத் திசையில் நகர்கிறது” என்ற வாதத்திற்கு Name.com தனது வாடிக்கையாளர் ஆய்வை ஆதாரமாகக் காட்டுகிறது: [பதிலளித்தவர்களில் 91% பேர், அடுத்த இரண்டு ஆண்டுகளில் AI முகவர்கள் தங்களது டொமைன் நிர்வாகத்தில் குறைந்தது சில பணிகளையாவது கையாளும் என எதிர்பார்க்கிறார்கள்](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years) என்று நிறுவனம் தெரிவிக்கிறது. இந்தப் புள்ளிவிவரம் மூன்றாம் தரப்பிடமிருந்து அல்லாமல் Name.com-இன் சொந்த அறிவிப்பிலிருந்து வருவதால், இதைத் தனித்த ஆய்வின் முடிவாக அல்ல, நிறுவனம் தெரிவித்த சந்தை மனநிலையாகவே கருத வேண்டும்.

இரண்டு வரம்புகளை நேர்மையாகக் குறிப்பிட வேண்டும். முதலாவதாக, Name.com-இன் blog post ஒரு சந்தைப்படுத்தல் நிலைப்பாடு மற்றும் எதிர்காலப் பார்வை பற்றியது. Cloudflare மற்றும் Namefi ஆவணங்கள் தருவது போன்ற அம்சவாரியான அட்டவணையை அது வெளியிடவில்லை. எனவே கீழுள்ள அட்டவணையின் சில புலங்கள் பரிசோதிக்கப்பட்ட specification-ஐ அல்ல, அறிவிப்பிலுள்ள கூற்றுகளையே பிரதிபலிக்கின்றன. இரண்டாவதாக, விலையிடல் தொடர்பாக Name.com-இன் பதிவு [உங்கள் சொந்த markup-ஐ நிர்ணயிக்கும் திறன்](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20ability%20to%20set%20your%20own%20markups) பற்றி பேசுகிறது. இது மறுவிற்பனையாளர் கூட்டாளருக்கான அம்சமே தவிர, Cloudflare வழங்குவது போன்ற இறுதிப் பயனருக்கான அடக்க விலை உறுதிமொழி அல்ல. அந்த அறிவிப்பில் கிரிப்டோ payment path அல்லது டோக்கனைஸ் செய்யப்பட்ட உரிமையும் இல்லை.

## Namefi: MCP server, பணப்பை checkout மற்றும் டோக்கனைஸ் செய்யப்பட்ட உரிமை

வாங்குபவர் browser session அல்லது credit card வைத்திருக்கும் மனிதராகவே இருக்க வேண்டியதில்லை; செயல்படுவதற்கு முன் Namefi கணக்கை உருவாக்கவும் அவர் விரும்பாமல் இருக்கலாம் என்ற வேறுபட்ட கருதுகோளிலிருந்து Namefi-இன் அணுகுமுறை தொடங்குகிறது. அதன் தயாரிப்புக் கூற்றுகளுக்கான ஒரே ஆதாரமாகக் கொள்ள வேண்டிய, Namefi-இன் சொந்த இயந்திரம் வாசிக்கக்கூடிய API ஆவணங்களின்படி, `https://api.namefi.io/mcp` என்ற முகவரியில் Streamable HTTP transport மூலம் Namefi ஓர் MCP server-ஐ இயக்குகிறது. அது “ஒவ்வொரு `/v-next` operation-ஐயும் typed tool ஆக (தேடல், பதிவு, DNS, டொமைன் அமைவு, outbound) வழங்குகிறது”; `https://namefi.io/.well-known/mcp/servers.json` என்ற முகவரியில் கண்டறியலாம்; Claude Code-க்கான ஒரே வரி அமைவுக் command-உம் ஆவணப்படுத்தப்பட்டுள்ளது (`claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"`). REST API அங்கீகாரத்திற்கு டொமைன் உரிமையுள்ள பணப்பையுடன் இணைக்கப்பட்ட `x-api-key` header பயன்படுத்தப்படுகிறது; read-only tools-க்கு key தேவையில்லை.

இதன் தனித்துவமான அம்சம் பணம் செலுத்தும் முறை. Namefi ஆவணப்படுத்தியுள்ள [x402](https://x402.org) payment flow மூலம், Namefi கணக்கை முதலில் உருவாக்காமலேயே முகவர் stablecoin USDC-ஐப் பயன்படுத்தி டொமைன் வாங்கலாம். வாங்குபவரின் பணப்பை EIP-3009 `transferWithAuthorization`-இல் கையொப்பமிடும்; payment இணைக்கப்படாவிட்டால் API விலையுடன் `402 Payment Required` பதிலைத் திருப்பும்; செல்லுபடியாகும் payment header வந்தவுடன் பதிவை முடிக்கும். தனியான Machine Payable Protocol (MPP) flow-வும் இதே போன்ற challenge-and-sign முறையை வழங்குகிறது. Cloudflare அல்லது Name.com இதனுடன் ஒப்பிடக்கூடிய எதையும் ஆவணப்படுத்தவில்லை; இந்த ஒப்பீட்டின் மிகத் தெளிவான வேறுபாடு இதுதான். முழு checkout செயல்முறைக்கு [கிரிப்டோ பணப்பை மூலம் டொமைன்களுக்கு பணம் செலுத்துங்கள்: கணக்கு தேவையில்லை](/ta/blog/wallet-checkout/) என்ற கட்டுரையைப் பாருங்கள்.

Namefi டொமைன்களை [NFT-களாகவும்](/ta/glossary/nft/) பதிவுசெய்கிறது. அவை ரெஜிஸ்ட்ராரின் உள் database-இல் மட்டும் அல்லாமல், உரிமை blockchain-இல் சரிபார்க்கப்படும் [டோக்கனைஸ் செய்யப்பட்ட டொமைன்கள்](/ta/glossary/tokenized-domain/). அதன் DNS toggles-இல் auto-[ENS](/ta/glossary/ens/) records மற்றும் [DNSSEC](/ta/glossary/dnssec/) உள்ளன; அதோடு முழுமையான CRUD DNS record நிர்வாகம் (தனி மற்றும் batch), தானியக்கப் புதுப்பிப்பு, domain parking மற்றும் forwarding வசதிகளும் உள்ளன. ஆனால் Namefi-இன் llms.txt வெளிப்படுத்தாத ஒன்று அதன் விலையிடல் கொள்கை. Cloudflare-உடன் ஒப்பிடக்கூடிய “அடக்க விலை” கூற்றோ, இந்தக் கட்டுரைக்காகப் பரிசீலிக்கப்பட்ட ஆவணங்களில் பொதுவாகத் தெரியும் விலைப் பட்டியலோ இல்லை. எனவே விலையில் Cloudflare-உடன் சமம் என்று கருதாமல், namefi.io-வில் தற்போதைய விலையை நேரடியாகச் சரிபார்க்கவும். <!-- TODO: confirm with team — Namefi's published pricing/markup policy relative to registry cost -->

## அம்ச ஒப்பீட்டு அட்டவணை

| திறன் | Cloudflare Registrar API | Name.com AI-நேட்டிவ் API | Namefi |
|---|---|---|---|
| கிடைப்புநிலைத் தேடல் | ஆம் | ஆம் | ஆம் (`search/availability`, bulk) |
| விலைச் சரிபார்ப்பு | ஆம் | ஆம் (ஆவணப்படுத்தப்பட்டுள்ளது; அம்சவாரியாகப் பட்டியலிடப்படவில்லை) | ஆம் (x402 402 பதிலில் திருப்பப்படும்; API வழியாகவும் கிடைக்கும்) |
| வாங்குதல் / பதிவு | ஆம் — பெரும்பாலானவை வரையறுக்கப்பட்ட synchronous காத்திருப்பு நேரத்திற்குள் முடியும்; இல்லாவிட்டால் `202` + polling | ஆம் (முகவர் உருவாக்கும் ஒருங்கிணைப்புக் code) | ஆம் — API key அல்லது x402/MPP வழியாக பணப்பை கையொப்பமிட்ட USDC |
| DNS நிர்வாகம் | தற்போதைய beta-வில் இல்லை | அறிவிப்பில் அம்சவாரியாகப் பட்டியலிடப்படவில்லை | ஆம் — முழுமையான CRUD, batch operations, A/CNAME/TXT/MX மற்றும் பல |
| புதுப்பிப்பைத் தானியக்கமாக்குதல் | ஆம் — பதிவின்போது `auto_renew`-ஐ அமைக்கலாம் அல்லது பின்னர் மாற்றலாம்; தேவைக்கேற்ப உடனடிப் புதுப்பிப்பு endpoint இன்னும் இல்லை | அறிவிப்பில் அம்சவாரியாகப் பட்டியலிடப்படவில்லை | ஆம் — ஒவ்வொரு டொமைனுக்கும் auto-renew toggle |
| கிரிப்டோ payment | இல்லை | இல்லை | ஆம் — x402 வழியாக USDC; கணக்கு தேவையில்லை |
| டோக்கனைஸ் செய்யப்பட்ட உரிமை | இல்லை | இல்லை | ஆம் — டொமைன் NFT-ஆகப் பதிவுசெய்யப்பட்டு, உரிமை blockchain-இல் சரிபார்க்கப்படும் |
| கணக்கு தேவை | ஆம் — கணக்கு, API token, billing profile/default payment, பதிவாளர் தொடர்புத் தகவல் மற்றும் ஏற்றுக்கொண்ட agreement | ஆம் (developer/API access) | x402 பணப்பை checkout-க்கு இல்லை; API key முறை ஒரு பணப்பையுடன் இணைக்கப்படும் |
| MCP ஆதரவு | ஆம் — Registrar endpoints Cloudflare MCP வழியாகக் கிடைக்கின்றன | ஆம் (ஆவணப்படுத்தப்பட்டுள்ளது) | ஆம் — பிரத்யேக MCP server, discovery descriptor |
| Editor ஒருங்கிணைப்பு | Cursor, Claude Code (அறிக்கையின்படி) | Claude, Cursor (அறிவிப்பின்படி) | Claude Code (அமைவுக் command ஆவணப்படுத்தப்பட்டுள்ளது); திறந்த MCP protocol |
| அடக்க விலை / markup இல்லாத விலை | ஆம், வெளிப்படையாகக் கூறப்பட்டுள்ளது | கூறப்படவில்லை (மறுவிற்பனையாளர் markup குறிப்பிடப்பட்டுள்ளது) | வெளியிடப்படவில்லை — தற்போதைய விலையைச் சரிபார்க்கவும் |

## ஒவ்வொன்றையும் எப்போது தேர்ந்தெடுப்பது?

விலையும் எளிமையும் உங்கள் முடிவை நிர்ணயிக்கின்றன, மேலும் விரிவான டொமைன் lifecycle நிர்வாகம் தேவையில்லை என்றால் **Cloudflare**-ஐத் தேர்ந்தெடுக்கவும். அதன் அடக்க விலையும் உள்ளமைந்த பாதுகாப்பு இயல்புநிலைகளும் (DNSSEC, WHOIS மறைப்பு, இரு-காரணி அங்கீகாரம்), இதே பாதுகாப்புகளுக்கு பெரும்பாலான பழைய ரெஜிஸ்ட்ரார்கள் வசூலிப்பதைவிட உண்மையிலேயே சிறந்தவை. அதன் API தானியக்கப் புதுப்பிப்பைச் செயல்படுத்தவோ பின்னர் மாற்றவோ முடியும். செயல்பாட்டு எல்லையும் அமைப்புத் தேவைகளுமே இதில் சமரசம் செய்ய வேண்டியவை: இந்த Registrar API beta இன்னும் DNS நிர்வாகம், தேவைக்கேற்ப உடனடிப் புதுப்பிப்பு, transfer மற்றும் contact update ஆகியவற்றை வழங்கவில்லை. ஏற்கெனவே அமைக்கப்பட்ட Cloudflare கணக்கு, billing/contact விவரங்கள் மற்றும் agreement ஏற்பும் தேவை; கிரிப்டோ அல்லது டோக்கனைஸ் செய்யப்பட்ட உரிமை வழியும் இல்லை.

ஒரு நிலையான API-ஐ அழைக்கும் முகவருக்குப் பதிலாக, ஒருங்கிணைப்புக் code-ஐ உங்களுக்காக எழுதும் முகவர் வேண்டுமெனில் **Name.com**-ஐத் தேர்ந்தெடுக்கவும். அல்லது நீங்கள் ஏற்கெனவே Name.com மறுவிற்பனையாளராக இருந்து, நவீனப்படுத்தப்பட்ட MCP-இணக்கமான தளத்தின் மேல் markup flexibility வேண்டுமெனில் இது பொருந்தும். எவை தற்போது வெளியிடப்பட்டுள்ளன, எவை roadmap-இல் உள்ளன என்பது குறித்து அதன் ஆவணங்கள் Cloudflare அல்லது Namefi ஆவணங்களைவிடக் குறைவான விவரங்களையே தருகின்றன. எனவே சந்தைப்படுத்தல் கூற்றுகளுடன் உண்மையான API surface பொருந்துகிறதா எனப் பரிசோதிக்க நேரம் ஒதுக்கவும்.

வாங்குபவர் உண்மையாகவே முகவர்-மையமானவர் என்றால் **Namefi**-ஐத் தேர்ந்தெடுக்கவும்: மனிதர் கணக்கு தேவையில்லை; சேமிக்கப்பட்ட card-க்குப் பதிலாக பணப்பை கையொப்பத்தால் payment அங்கீகரிக்கப்படும்; மேலும் உரிமை ரெஜிஸ்ட்ரார் database-இன் ஒரு row-ஆக மட்டும் இல்லாமல், blockchain-இல் இடமாற்றக்கூடிய token-ஆகக் குறிப்பிடப்படும். MCP server, முழுமையான DNS control, auto-ENS மற்றும் பணப்பை-நேட்டிவ் checkout ஆகியவற்றின் இந்தச் சேர்க்கையை Cloudflare beta அல்லது Name.com அறிவிப்பு தற்போது வழங்கவில்லை. இதில் சமரசம் செய்ய வேண்டியது விலை: Cloudflare போன்று Namefi அடக்க விலை உறுதிமொழியை வெளியிடவில்லை. எனவே மொத்த விலையே உங்கள் முதல் முன்னுரிமை என்றால், Cloudflare-ஐவிட Namefi குறைந்த விலை என்று கருதுவதற்கு முன் அதன் தற்போதைய விலையை நேரடியாகச் சரிபார்க்கவும்.

பல குழுக்கள் ஒன்றுக்கு மேற்பட்டவற்றைப் பயன்படுத்தக்கூடும்: ஏற்கெனவே Cloudflare அல்லது Name.com-இல் இயங்கும் infrastructure-க்கு முன்னால் இருக்கும் டொமைனுக்கு அதே ரெஜிஸ்ட்ராரையும், blockchain-இல் சொந்தமாக வைத்துப் பரிவர்த்தனை செய்ய வேண்டிய டொமைனுக்கு Namefi போன்ற பணப்பை-நேட்டிவ் ரெஜிஸ்ட்ராரையும் பயன்படுத்தலாம். அது marketplace-இல் வர்த்தகம் செய்வதற்கான பெயராக இருக்கலாம்; அல்லது ஒரு நபரின் கணக்கிற்குப் பதிலாக முகவரின் சொந்தப் பணப்பைக்குச் சொந்தமான பெயராக இருக்கலாம். [பதிவாளர்](/ta/glossary/registrant/) ஒரு நபருக்குப் பதிலாக முகவராக இருக்கும்போது “உரிமை” என்பதன் பொருள் என்ன என்பது தனிக் கட்டுரைக்குரிய ஆழமான கேள்வி. இதற்கு [ஒரு AI முகவர் டொமைனைச் சொந்தமாக வைத்திருக்க முடியுமா? WHOIS, பாதுகாப்புப் பொறுப்பு மற்றும் டோக்கன்கள்](/ta/blog/agent-own-domain/) என்பதைப் பாருங்கள்.

## அடிக்கடி கேட்கப்படும் கேள்விகள்

### AI முகவர் பயன்படுத்துவதற்கு எந்த ரெஜிஸ்ட்ரார் மலிவானது?
மூன்றில் Cloudflare மட்டுமே வெளிப்படையான அடக்க விலை, markup இல்லாத விலையிடல் உறுதிமொழியை வெளியிடுகிறது; தனியான ரெஜிஸ்ட்ரார் மதிப்பீடும் இதே கொள்கையை உறுதிசெய்கிறது. Name.com-இன் அறிவிப்பு, இறுதிப் பயனருக்கான அடக்க விலை உறுதிமொழிக்குப் பதிலாக மறுவிற்பனையாளர்களுக்கான markup flexibility-ஐப் பேசுகிறது. Namefi தனது API ஆவணங்களில் விலையிடல் கொள்கையை வெளியிடவில்லை. எனவே ஒவ்வொரு தளத்தின் தற்போதைய விலையையும் நேரடியாகச் சரிபார்க்காமல் அவற்றுக்கிடையே விலை ஒப்பீடு செய்வது தற்போது சாத்தியமில்லை.

### மனிதர் வைத்திருக்கும் credit card இல்லாமல் முகவர் பணம் செலுத்த இவற்றில் ஏதேனும் உதவுமா?
ஆவணப்படுத்தப்பட்ட கிரிப்டோ-நேட்டிவ் payment flow கொண்ட ஒரே தளம் Namefi. முகவரின் பணப்பை, Namefi கணக்கை உருவாக்காமல் x402 protocol வழியாக USDC-இல் செலுத்தலாம்; அல்லது தனியான Machine Payable Protocol challenge-and-sign flow-ஐப் பயன்படுத்தலாம். Cloudflare beta அல்லது Name.com API இதனுடன் ஒப்பிடக்கூடிய, கணக்கு தேவையில்லாத payment path-ஐ ஆவணப்படுத்தவில்லை.

### டொமைனைப் பதிவுசெய்வதுடன், இந்த API-கள் வழியாக DNS records-ஐயும் நிர்வகிக்க முடியுமா?
Namefi-இன் ஆவணங்கள் batch create/update/delete உட்பட முழுமையான DNS record CRUD-ஐயும், parking, forwarding, auto-ENS மற்றும் Vercel anycast records-க்கான toggles-ஐயும் உள்ளடக்குகின்றன. இந்தக் கட்டுரை எழுதப்படும் நேரத்தில் Cloudflare-இன் Registrar API beta பதிவு செய்வதற்கு மட்டுமே பயன்படுகிறது; DNS உட்பட lifecycle மற்றும் பதிவுக்குப் பிந்தைய நிர்வாகம் பின்னர் வெளியிடத் திட்டமிடப்பட்டுள்ளது. Name.com-இன் அறிவிப்பு DNS நிர்வாகத் திறன்களைத் தனித்தனியாகப் பட்டியலிடவில்லை.

### Cloudflare-இன் Registrar API இப்போது பொதுப் பயன்பாட்டில் உள்ளதா?
இல்லை. Cloudflare-இன் “Agents Week” நிகழ்வின்போது, அது ஏப்ரல் 15, 2026 அன்று beta-வில் அறிமுகமானது. தற்போதைய API பதிவு மற்றும் தானியக்கப் புதுப்பிப்பு அமைப்பை ஆதரிக்கிறது. ஆனால் தேவைக்கேற்ப உடனடிப் புதுப்பிப்பு, transfer, contact update உள்ளிட்ட விரிவான lifecycle நிர்வாகம் இன்னும் கிடைக்கவில்லை. Beta-நிலை அம்சங்கள் மாறக்கூடும்; production-இல் அவற்றைச் சார்ந்து இயங்குவதற்கு முன் மீண்டும் சரிபார்க்கவும்.

### “முகவர்-நேட்டிவ்” என்றால் என்ன? மூன்றும் அந்தத் தகுதியைப் பெறுகின்றனவா?
Browser படிவத்தை மனிதர் நிரப்பாமல், ஒரு முகவர் API-ஐக் கண்டறிந்து, அங்கீகரித்து, கொள்முதலை முடிக்க முடிவதே முகவர்-நேட்டிவ் எனப்படும். முழுச் சரிபார்ப்புப் பட்டியலுக்கு [AI முகவர்களை மையமாகக் கொண்ட டொமைன் ரெஜிஸ்ட்ரார் என்றால் என்ன?](/ta/blog/agent-native/) என்பதைப் பாருங்கள். இந்த மூன்று ரெஜிஸ்ட்ரார்களும் அடிப்படைத் தகுதிநிலையை அடைகின்றன — நிரலாக்க முறையிலான தேடலிலிருந்து வாங்குதல் வரையிலான செயல்பாடு, MCP அல்லது அதனுடன் தொடர்புடைய tooling. ஆனால் பதிவுக்குப் பின்னர் முகவர்-நேட்டிவ் வடிவமைப்பு எவ்வளவு தூரம் செல்கிறது என்பதில் — DNS, புதுப்பிப்பு, payment method மற்றும் ownership model — பெரிதும் வேறுபடுகின்றன.

## Namefi-இல் டொமைன்களை வாங்கி டோக்கனைஸ் செய்யுங்கள்

பணப்பை-நேட்டிவ் checkout மற்றும் டோக்கனைஸ் செய்யப்பட்ட உரிமை உங்களுக்குத் தேவையெனில், [Namefi](https://namefi.io) மற்ற ICANN அங்கீகாரம் பெற்ற ரெஜிஸ்ட்ரார் செய்வதைப் போலவே உண்மையான ICANN டொமைன்களைப் பதிவுசெய்து, உங்கள் பணப்பை கட்டுப்படுத்தும் NFT-ஆக டொமைனை வைத்திருக்கும் விருப்பத்தையும் வழங்குகிறது. இந்த மூன்றைத் தாண்டிய முழுமையான சந்தை நிலவரத்துக்கு [AI முகவர் சார்ந்த டொமைன் தளங்கள்: 2026 வழிகாட்டி](/ta/blog/ai-domain-platforms/) என்பதைப் பாருங்கள்; அல்லது நேரடியாக [Namefi-ல் உங்கள் AI முகவர் மூலம் ஒரு டொமைனைப் பதிவுசெய்வது எப்படி](/ta/blog/ai-agent-register/) என்ற செயல்முறை வழிகாட்டிக்குச் செல்லுங்கள். முகவர் தானாக வாங்குதலை முடிக்கும் நடைமுறைக்கு [மனிதர் இல்லாமல் AI முகவர்கள் டொமைன்களை எப்படி வாங்குகின்றன? (2026)](/ta/blog/agents-buy-domains/) என்பதைப் பாருங்கள்.

**[Namefi-இல் டொமைனைத் தேடிப் பதிவுசெய்யுங்கள்](https://namefi.io).**

## ஆதாரங்களும் கூடுதல் வாசிப்பும்

- webhosting.today — [இப்போது AI முகவர்கள் மனிதர் இல்லாமல் டொமைன்களைப் பதிவுசெய்யலாம் (Cloudflare Registrar API beta, ஏப்ரல் 2026)](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=lets%20an%20AI%20agent%20search%20for%20domain%20availability%2C%20check%20pricing%2C%20and%20complete%20registration%20programmatically%20without%20any%20browser%20interaction%20or%20manual%20approval)
- Cloudflare — [Registrar API beta செயல்முறை, முன்னேற்பாடுகள், response behavior மற்றும் வரம்புகள்](https://developers.cloudflare.com/registrar/registrar-api/)
- Cloudflare — [பதிவை உருவாக்குதல்](https://developers.cloudflare.com/api/resources/registrar/subresources/registrations/methods/create/) மற்றும் [பதிவைப் புதுப்பித்தல்](https://developers.cloudflare.com/api/resources/registrar/subresources/registrations/methods/edit/) (`auto_renew`, வரையறுக்கப்பட்ட காத்திருப்பு மற்றும் asynchronous polling)
- Cloudflare — [.ai டொமைன்களை வாங்குதல்: அடக்க விலையும் உள்ளடங்கிய பாதுகாப்பு அம்சங்களும்](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)
- Name.com — [முதல் AI-நேட்டிவ் டொமைன் தளம்](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI)
- Hostinger — [Cloudflare-இன் அடக்க விலை உட்பட சிறந்த டொமைன் ரெஜிஸ்ட்ரார்களின் ஒப்பீடு](https://www.hostinger.com/tutorials/best-domain-registrars/#:~:text=At-cost%20pricing%20charges%20you%20only%20what%20Cloudflare%20pays%2C%20with%20no%20markup%20at%20registration%20or%20renewal)
- llmstxt.org — [llms.txt specification](https://llmstxt.org/#:~:text=context%20windows%20are%20too%20small%20to%20handle%20most%20websites%20in%20their%20entirety)
- Model Context Protocol — [MCP என்றால் என்ன?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Namefi — [namefi.io/llms.txt (MCP server, API மற்றும் அங்கீகாரக் குறிப்பு)](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt (பணப்பை கையொப்பமிட்ட மற்றும் x402 கிரிப்டோ payment குறிப்பு)](https://namefi.io/web3/llms.txt)
