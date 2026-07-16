---
title: "ஒவ்வொரு பிளாக்செயினுக்கும் அடித்தளமான முக்கிய கிரிப்டோகிராஃபிக் அடிப்படை கூறுகள்"
date: '2026-07-02'
language: ta
tags: ['guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 10
format: roundup
description: பிளாக்செயின்களை இயங்க வைக்கும் முக்கிய கிரிப்டோகிராஃபிக் அடிப்படை கூறுகளுக்கான வழிகாட்டி—hash செயல்பாடுகள், டிஜிட்டல் கையொப்பங்கள், Merkle மரங்கள், நீள்வட்ட வளைவுக் கிரிப்டோகிராஃபி மற்றும் உறுதிப்பாட்டுத் திட்டங்கள்.
ogImage: ../../assets/blockchain-cryptographic-primitives-og.jpg
keywords: ['பிளாக்செயின் கிரிப்டோகிராஃபி', 'கிரிப்டோகிராஃபிக் அடிப்படை கூறுகள்', 'hash செயல்பாடு', 'SHA-256', 'Keccak-256', 'டிஜிட்டல் கையொப்பம்', 'ECDSA', 'EdDSA', 'BLS கையொப்பம்', 'Merkle மரம்', 'நீள்வட்ட வளைவுக் கிரிப்டோகிராஃபி', 'secp256k1', 'உறுதிப்பாட்டுத் திட்டம்', 'குவாண்டத்துக்குப் பிந்தைய கிரிப்டோகிராஃபி', 'பொது விசைக் கிரிப்டோகிராஃபி', 'பிளாக்செயின் பாதுகாப்பு']
relatedArticles:
  - /ta/blog/blockchain-privacy-technologies/
  - /ta/blog/blockchain-consensus-mechanisms/
  - /ta/blog/blockchain-virtual-machines/
  - /ta/blog/blockchain-scaling-approaches/
  - /ta/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /ta/glossary/hash-function/
  - /ta/glossary/digital-signature/
  - /ta/glossary/merkle-tree/
  - /ta/glossary/public-key/
  - /ta/glossary/private-key/
relatedTopics:
  - /ta/topics/web3-foundations/
  - /ta/topics/domain-tokenization/
relatedSeries:
  - /ta/series/tokenize-your-com/
  - /ta/series/domain-flipping-skills/
---

ஒவ்வொரு பிளாக்செயின் கூற்றும் — "இந்தப் பரிவர்த்தனை இறுதியானது", "இந்த முகவரிக்கு இந்தச் சொத்து சொந்தமானது", "இந்த வரலாறு மாற்றப்படவில்லை" — இறுதியில், குறுகியதும் தெளிவாக வரையறுக்கப்பட்டதுமான பணிகளைச் செய்யும் சில கிரிப்டோகிராஃபிக் அடிப்படை கூறுகளையே சார்ந்துள்ளது. அவற்றில் எதுவும் பிளாக்செயின் கண்டுபிடிப்பல்ல. Hash செயல்பாடுகள், டிஜிட்டல் கையொப்பங்கள், Merkle மரங்கள் ஆகியவை Bitcoin-க்கு பல தசாப்தங்களுக்கு முன்பே இருந்தன. இக்கூற்றுகள் செல்லுபடியாக இருப்பதற்கு எந்த ஒரு தரப்பையும் தனியாக நம்பத் தேவையில்லாத ஓர் அமைப்பாக அவற்றை ஒன்றிணைத்ததே பிளாக்செயின்கள் செய்த புதுமை.

உண்மையில் பெரும் பொறுப்பை ஏற்றிருக்கும் அடிப்படை கூறுகளை இந்த வழிகாட்டி விளக்குகிறது: தரவுக்குத் தனித்துவமான அடையாளம் வழங்கும் [hash செயல்பாடுகள்](/ta/glossary/hash-function/), பரிவர்த்தனைகளை அங்கீகரிக்கும் [டிஜிட்டல் கையொப்பங்கள்](/ta/glossary/digital-signature/), மிகப்பெரிய தரவுத்தொகுப்புகளைப் பகுதிகளாகச் சரிபார்க்க உதவும் [Merkle மரங்கள்](/ta/glossary/merkle-tree/), அந்தக் கையொப்பங்கள் இயங்கும் நீள்வட்ட வளைவுக் கணிதம், மேலும் [பூஜ்ஜிய-அறிவுச் சான்றுகளுக்கு](/ta/glossary/zero-knowledge-proof/) வழிவகுக்கும் கட்டுமானக் கூறான உறுதிப்பாட்டுத் திட்டங்கள். ஒவ்வொன்றையும் புரிந்துகொள்வதே ஒரு பிளாக்செயின் அதன் உள்ளே உண்மையில் என்ன செய்கிறது என்பதைப் புரிந்துகொள்வதற்கான விரைவான வழி.

---

## கிரிப்டோகிராஃபிக் Hash செயல்பாடுகள் (SHA-256, Keccak)

![Hash செயல்பாட்டு இயந்திரத்துக்குள் செலுத்தப்படும் ஓர் ஆவணம் நிலையான நீளமுள்ள fingerprint digest-ஐ உருவாக்குகிறது; உள்ளீட்டில் ஓர் எழுத்தை மட்டும் மாற்றினால் முற்றிலும் வேறுபட்ட digest உருவாகி avalanche effect-ஐ விளக்குகிறது](../../assets/blockchain-cryptographic-primitives-01-hash-function.jpg)

ஒரு [hash செயல்பாடு](/ta/glossary/hash-function/) எந்த அளவிலான உள்ளீட்டையும் பெற்று, நிர்ணயிக்கப்பட்ட முறையில் நிலையான அளவுள்ள வெளியீட்டை — ஒரு "digest"-ஐ — உருவாக்குகிறது. உள்ளீட்டின் ஒரு bit-ஐ மாற்றினால்கூட வெளியீடு முற்றிலும் மாறிவிடும்; மேலும், ஒரே வெளியீட்டுக்கு hash ஆகும் இரண்டு வேறுபட்ட உள்ளீடுகளைக் கண்டறிவது கணினிச் செயலாக்க ரீதியாகச் சாத்தியமற்றது. மோதல் எதிர்ப்பு என்ற அந்தப் பண்புதான், எந்த அளவிலான தரவுக்கும் hash-ஐ சுருக்கமான, மாற்றம் புலப்படும் fingerprint ஆகப் பயன்படுத்த உதவுகிறது.

Bitcoin முழுவதும் SHA-256-ஐப் பயன்படுத்துகிறது: முந்தைய header-இன் SHA256(SHA256()) hash-ஐ ஒவ்வொரு புதிய block header-இலும் உட்பொதிப்பதன் மூலம் அவை சங்கிலியாக இணைக்கப்படுகின்றன; எனவே கடந்தகால block ஒன்றை மாற்றினால் அதன் hash மாறி, அதன் பின்னால் வரும் ஒவ்வொரு header-உம் முறிந்துவிடும் ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Each%20block%20also%20stores%20the%20hash%20of%20the%20previous%20block%27s%20header%2C%20chaining%20the%20blocks%20together)). அதே இரட்டை-SHA-256 கட்டமைப்பு, பரிவர்த்தனைகளை block-இன் [Merkle மரத்துக்குள்](/ta/glossary/merkle-tree/) hash செய்கிறது ([Bitcoin.org reference](https://developer.bitcoin.org/reference/block_chain.html#:~:text=A%20SHA256%28SHA256%28%29%29%20hash%20in%20internal%20byte%20order)).

மாறாக Ethereum, அதன் பொதுப் பயன்பாட்டு hash ஆக Keccak-256-ஐ (பின்னர் வந்த NIST SHA-3 தரநிலையிலிருந்து வேறுபட்ட, அசல் Keccak சமர்ப்பிப்பு) தரப்படுத்தியுள்ளது. ஒவ்வொரு account முகவரியும், account-இன் [பொது விசையின்](/ta/glossary/public-key/) Keccak-256 hash-இன் கடைசி 20 byte-களை எடுத்துப் பெறப்படுகிறது ([ethereum.org](https://ethereum.org/en/developers/docs/accounts/#:~:text=You%20get%20a%20public%20address%20for%20your%20account%20by%20taking%20the%20last%2020%20bytes%20of%20the%20Keccak-256%20hash%20of%20the%20public%20key)). Ethereum-இன் நிலையைச் சேமிக்கும் [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=key%20%3D%3D%20keccak256%28rlp%28value%29%29) முழுவதிலும் பயன்படுத்தப்படும் key/value உள்ளடக்க முகவரியிடலுக்கும் அதே செயல்பாடே அடித்தளமாக உள்ளது.

Block header-களைத் தனித்தனி பதிவுகளின் தளர்வான தொகுப்பாக இல்லாமல் ஒரு சங்கிலியாக இணைப்பதும் hashing தான்: ஒரு header-ஐ மாற்றினால் அதன் hash மாறி, அதன் பின் வரும் header-களில் உள்ள குறிப்புகள் முறிந்துவிடும். பின்னர் செய்யப்பட்ட வேலைகளை மீண்டும் செய்து, நேர்மையான வலையமைப்பை முந்த வேண்டிய கூடுதல் தேவை Bitcoin-இன் வேலை-நிரூபண ஒருமித்த கருத்துக்கே உரியது. அதில் கடந்தகால block ஒன்றை மாற்றும் தாக்குபவர், அந்த block-இன் வேலை-நிரூபணத்தையும் அதன் பிறகு செய்யப்பட்ட அனைத்து வேலைகளையும் மீண்டும் செய்து, பின்னர் நேர்மையான சங்கிலியைப் பிடிக்க வேண்டும் ([Bitcoin whitepaper, §4](https://bitcoin.org/bitcoin.pdf)). மற்ற பிளாக்செயின்கள் வேறுபட்ட ஒருமித்த கருத்து விதிகளின் கீழ் வரலாற்றை அங்கீகரித்து இறுதிப்படுத்துகின்றன; எனவே hash இணைப்பு மட்டும் அந்த வேலை-நிரூபணச் செலவை உருவாக்காது. இணைக்கப்பட்ட header hash-களே இந்தத் தரவுக் கட்டமைப்பு **பிளாக்செயின்** என்று அழைக்கப்படுவதற்கான நேரடிக் காரணம்.

---

## பொது விசைக் கிரிப்டோகிராஃபியும் டிஜிட்டல் கையொப்பங்களும் (ECDSA, EdDSA, BLS)

![ஒரு தனிப்பட்ட விசை பரிவர்த்தனையில் கையொப்பமிட்டு டிஜிட்டல் கையொப்பத்தை உருவாக்குகிறது; பொருந்தும் பொது விசை பச்சை checkmark-உடன் அதைச் செல்லுபடியாக உறுதிப்படுத்துகிறது, பொருந்தாத பொது விசை சிவப்பு X-உடன் நிராகரிக்கிறது](../../assets/blockchain-cryptographic-primitives-02-signatures.jpg)

பிளாக்செயினில் login form இல்லை; எனவே "இந்தப் பரிவர்த்தனை உண்மையில் இந்த account-இன் உரிமையாளரிடமிருந்து வந்தது" என்பதை நிரூபிக்க வேறொரு வழி தேவை. [பொது விசைக் கிரிப்டோகிராஃபி](/ta/glossary/public-key/) இதை ஒரு விசை இணையைக் கொண்டு தீர்க்கிறது: இரகசியமாக வைக்கப்படும் [தனிப்பட்ட விசை](/ta/glossary/private-key/), வெளிப்படையாகப் பகிரக்கூடிய பொது விசை. தனிப்பட்ட விசையைக் கொண்டு ஒரு பரிவர்த்தனையில் கையொப்பமிடுவது, பொது விசையுடன் ஒப்பிட்டு யார் வேண்டுமானாலும் சரிபார்க்கக்கூடிய [டிஜிட்டல் கையொப்பத்தை](/ta/glossary/digital-signature/) உருவாக்குகிறது — தனிப்பட்ட விசையையே ஒருபோதும் வெளிப்படுத்தாமல் அங்கீகாரத்தை நிரூபிக்கிறது.

Bitcoin பயன்படுத்தும் அதே secp256k1 வளைவில் Elliptic Curve Digital Signature Algorithm ஆன ECDSA-ஐப் பயன்படுத்தி, Ethereum account-கள் தனிப்பட்ட விசையிலிருந்து தங்கள் பொது விசையைப் பெறுகின்றன ([ethereum.org account ஆவணங்கள்](https://ethereum.org/en/developers/docs/accounts/#:~:text=The%20public%20key%20is%20generated%20from%20the%20private%20key%20using%20the%20Elliptic%20Curve%20Digital%20Signature%20Algorithm); [EIP-2, secp256k1 கையொப்ப மாற்றத்தன்மைத் திருத்தம்](https://eips.ethereum.org/EIPS/eip-2#:~:text=secp256k1n%2F2)). ECDSA-ஐ விரைவாகச் சரிபார்க்க முடியும்; அது பல தசாப்தங்களாக ஆய்வு செய்யப்பட்டுள்ளது. ஆனால் புதிய வடிவமைப்புகளுக்குப் பொருத்தமான ஓர் இயக்கக் குறைபாடு அதற்கு உள்ளது: தனித்தனி ECDSA கையொப்பங்களைத் திறமையாக ஒருங்கிணைக்க முடியாது; எனவே ஆயிரக்கணக்கான கையொப்பங்களைச் சரிபார்க்க ஆயிரக்கணக்கான தனித்தனிச் சோதனைகள் தேவை.

அந்த இடைவெளியை EdDSA மற்றும் BLS கையொப்பங்கள் நிரப்புகின்றன. EdDSA (Solana, Stellar போன்ற சங்கிலிகள் பயன்படுத்துவது) நிர்ணயிக்கப்பட்ட முறையில் இயங்கும் வேறுபட்ட வளைவுக் கட்டமைப்பைப் பயன்படுத்துகிறது; வரலாற்றில் ECDSA nonce-ஐ மீண்டும் பயன்படுத்திய பிழைகளை உண்டாக்கிய சில செயலாக்கக் குறைபாடுகளையும் இது எதிர்க்கிறது. BLS கையொப்பங்கள் இன்னும் ஒரு படி மேலே செல்கின்றன: அவை பயன்படுத்தும் வளைவுகளின் கணித pairing பண்பால், பல BLS கையொப்பங்களை ஒரே ஒருங்கிணைந்த கையொப்பமாகச் சேர்த்து, அவை அனைத்தையும் ஒரே நேரத்தில் சரிபார்க்க முடியும். Ethereum-இன் பங்கு-நிரூபண ஒருமித்த கருத்து அடுக்கு இதையே சார்ந்துள்ளது — சரிபார்ப்பாளர்கள் BLS விசைகளைக் கொண்டு attestations-இல் கையொப்பமிடுகின்றனர்; எனவே beacon chain, நூறாயிரக்கணக்கான சரிபார்ப்பாளர்களின் வாக்குகளை விரைவாகச் சரிபார்க்கக்கூடிய அளவுக்குச் சுருக்கமான கையொப்பங்களாக ஒருங்கிணைக்க முடிகிறது. இதுதான் பெரிய அளவிலான பங்கு-நிரூபணத்தை நடைமுறையில் சாத்தியமாக்குகிறது ([ethereum.org, *The Beacon Chain*](https://eth2book.info/capella/part2/building_blocks/signatures/#:~:text=BLS%20signatures%20can%20be%20aggregated%20together%2C%20making%20them%20efficient%20to%20verify%20at%20large%20scale)). Smart contract-களில் BLS கையொப்பச் சரிபார்ப்பை ஆதரிக்கவே, BLS12-381 வளைவுச் செயல்பாடுகளை EVM precompile-களாகவும் Ethereum வழங்குகிறது ([EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#:~:text=Add%20functionality%20to%20efficiently%20perform%20operations%20over%20the%20BLS12-381%20curve%2C%20including%20those%20for%20BLS%20signature%20verification)).

---

## Merkle மரங்கள்

![Merkle மரத்தின் hash node-கள் இணை இணையாகச் சேர்ந்து மேலே ஒரு root வரை உருவாகும் பிரமிடு; ஓர் இலை முதல் root வரையிலான proof பாதை ஆரஞ்சு நிறத்தில் காட்டப்பட்டு light-client Merkle proof-ஐ விளக்குகிறது](../../assets/blockchain-cryptographic-primitives-03-merkle-tree.jpg)

ஒவ்வொரு பங்கேற்பாளரையும் ஒவ்வொரு பரிவர்த்தனையையும் சேமிக்கச் சொல்லாமல், ஆயிரக்கணக்கான பரிவர்த்தனைகளை ஒரே 32-byte hash-ஆக ஒரு பிளாக்செயின் சுருக்க உதவுவது [Merkle மரம்](/ta/glossary/merkle-tree/). இலைகள் தனித்தனி தரவுக் கூறுகளின் hash-கள் (பரிவர்த்தனைகள், account நிலைகள்); ஒவ்வொரு hash இணையையும் ஒன்றிணைத்து மீண்டும் hash செய்யும் செயல்முறை, ஒரே hash — root — எஞ்சும் வரை தொடர்கிறது ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Copies%20of%20each%20transaction%20are%20hashed%2C%20and%20the%20hashes%20are%20then%20paired%2C%20hashed%2C%20paired%20again%2C%20and%20hashed%20again%20until%20a%20single%20hash%20remains%2C%20the%20merkle%20root%20of%20a%20merkle%20tree)). அந்த root நேரடியாக block header-இல் சேமிக்கப்படுகிறது; இதனால் கிட்டத்தட்ட எந்தக் கூடுதல் இடமும் பயன்படுத்தாமல் ஒரு block-இன் முழு உள்ளடக்கத்துக்கும் full node உறுதியளிக்க முடிகிறது.

இதன் பயன் சான்றின் அளவில் தெரிகிறது. ஒரு பரிவர்த்தனை block ஒன்றில் சேர்க்கப்பட்டிருக்கிறது என்பதைக் காட்ட முழு block-உம் தேவையில்லை — அந்தப் பரிவர்த்தனையும், அந்த இலையிலிருந்து root வரையிலான பாதையில் உள்ள sibling hash-களான "Merkle branch"-உம் மட்டும் போதும்; n பரிவர்த்தனைகளுக்கு இது பொதுவாக log₂(n) hash-களின் அளவில் இருக்கும். Simplified Payment Verification (SPV) இதன் அடிப்படையில் இயங்குகிறது: block header-களை மட்டும் வைத்திருக்கும் lightweight client-கூட, முழுப் பிளாக்செயினையும் பதிவிறக்காமல், குறிப்பிட்ட ஒரு பரிவர்த்தனையின் Merkle branch-ஐ header-இன் root-உடன் ஒப்பிட்டுச் சரிபார்ப்பதன் மூலம் அந்தப் பரிவர்த்தனை நடந்ததை உறுதிசெய்ய முடியும் ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/operating_modes.html#:~:text=the%20merkle%20root%20in%20the%20block%20header%20along%20with%20a%20merkle%20branch%20can%20prove%20to%20the%20SPV%20client%20that%20the%20transaction%20in%20question%20is%20embedded%20in%20a%20block%20in%20the%20block%20chain)).

பரிவர்த்தனைகளின் பட்டியலை மட்டும் அல்லாமல் முழு account நிலையையும் சேமிக்கப் பயன்படும் Merkle மரம் மற்றும் prefix (radix) trie ஆகியவற்றின் கலவையான Merkle Patricia Trie மூலம் Ethereum இந்த எண்ணத்தை விரிவுபடுத்துகிறது. ஒவ்வொரு block header-உம் தனித்தனியாக நிரூபிக்கக்கூடிய மூன்று வேறுபட்ட trie root-களை — `stateRoot`, `transactionsRoot`, `receiptsRoot` — கொண்டிருக்கிறது ([ethereum.org](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=From%20a%20block%20header%20there%20are%203%20roots%20from%203%20of%20these%20tries)). முழுச் சங்கிலியையும் மீண்டும் இயக்காமல், ஒரு smart contract அல்லது light client ஒரே account இருப்பையோ ஒரே storage slot-ஐயோ சரிபார்க்க இதுவே உதவுகிறது.

---

## நீள்வட்ட வளைவுக் கிரிப்டோகிராஃபி

ECDSA, EdDSA, BLS ஆகிய அனைத்துக்கும் அடிப்படையான கணிதம் நீள்வட்ட வளைவுக் கிரிப்டோகிராஃபி (ECC). பாரம்பரிய RSA போல் பெரிய எண்களை காரணிகளாகப் பிரிப்பதன் கடினத்தன்மையைச் சாராமல், நீள்வட்ட வளைவு discrete logarithm சிக்கலின் கடினத்தன்மையை ECC சார்ந்துள்ளது: ஒரு base point-ஐத் தன்னுடன் பலமுறை கூட்டுவதால் கிடைத்த வளைவின் ஒரு point கொடுக்கப்பட்டால், எத்தனை முறை கூட்டப்பட்டது என்பதை மீட்டறிவது கணினிச் செயலாக்க ரீதியாகச் சாத்தியமற்றது — ஆனால் முன்னோக்கிச் சென்று அந்த point-ஐக் கணக்கிடுவது எளிது. அந்தச் சமச்சீரின்மை (ஒரு திசையில் எளிது, பின்னோக்கிச் செல்வது கடினம்) தான், பெறப்பட்ட பொது விசையைப் பகிர்வது பாதுகாப்பாக இருக்கும் அதே நேரத்தில் தனிப்பட்ட விசையைக் கையொப்பமிடுவதற்குப் பாதுகாப்பாகப் பயன்படுத்த உதவுகிறது.

குறிப்பிட்ட வளைவும் கையொப்பத் திட்டமும் முக்கியம். Bitcoin, Ethereum இரண்டும் நன்கு ஆய்வுசெய்யப்பட்ட 256-bit அளவுருக்களுடன் Standards for Efficient Cryptography Group தரப்படுத்திய Koblitz வளைவான secp256k1-ஐப் பயன்படுத்துகின்றன ([SEC 2: பரிந்துரைக்கப்பட்ட நீள்வட்ட வளைவு domain அளவுருக்கள்](https://www.secg.org/sec2-v2.pdf)). மற்ற சுற்றுச்சூழல்கள் வேறுபட்ட சமரசங்களைச் செய்கின்றன: Ed25519 என்பது Edwards25519 வளைவில் செயல்படுத்தப்பட்ட ஒரு குறிப்பிட்ட EdDSA கையொப்பத் திட்டம் ([RFC 8032, §5.1](https://www.rfc-editor.org/rfc/rfc8032.html#section-5.1)); RFC 8032 அதை ஏறத்தாழ 128-bit பாரம்பரியப் பாதுகாப்பு நிலையில் வைக்கிறது ([§8.5](https://www.rfc-editor.org/rfc/rfc8032.html#section-8.5)). BLS12-381 என்பது BLS கையொப்ப ஒருங்கிணைப்பு போன்ற செயல்பாடுகளுக்குத் தேர்ந்தெடுக்கப்பட்ட pairing-க்கு ஏற்ற வளைவு; EIP-2537, 120+ bit பாதுகாப்பை விவரிக்கிறது ([EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#motivation)). இந்த மதிப்பீடுகள் ஒரே "ஒவ்வொரு key bit-க்குமான பாதுகாப்பு" இருப்பதாகக் கூறவில்லை: இந்த அமைப்புகள் வேறுபட்ட group-கள், encoding-கள், அனுமானங்களைப் பயன்படுத்துகின்றன; பெயரளவிலான key length மட்டுமே பாதுகாப்பின் வலிமை அல்ல. எடுத்துக்காட்டாக, 128-bit பாரம்பரியப் பாதுகாப்பை 256–383-bit வழக்கமான ECC விசைகளுக்கும், 3072-bit RSA விசைகளுக்கும் NIST ஒப்பிடுகிறது ([NIST SP 800-57 Part 1 Rev. 5, அட்டவணை 2](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf#page=67)). பிளாக்செயின் account-களுக்கு நீள்வட்ட வளைவு அமைப்புகள் இயல்புநிலையாக மாறியதற்கான காரணத்தை இது விளக்க உதவுகிறது.

---

## உறுதிப்பாட்டுத் திட்டங்கள் (பூஜ்ஜிய-அறிவை நோக்கிய பாலம்)

ஒரு மதிப்பை "பூட்டி வைக்க" உறுதிப்பாட்டுத் திட்டம் உதவுகிறது — தரவையே வெளிப்படுத்தாமல், குறிப்பிட்ட ஒரு தரவுடன் உங்களைப் பிணைக்கும் ஒன்றை வெளியிட்டு, அது என்னவென்பதை நிரூபிக்க பின்னர் அந்த உறுதிப்பாட்டை "திறக்க" முடியும். இதற்கான அன்றாட ஒப்புமை மூடிய உறை: ஒரு பதிலை ஏற்கெனவே முடிவுசெய்துவிட்டீர்கள் என்பதற்கான சான்றாக இன்று ஒருவரிடம் மூடிய உறையைக் கொடுக்கலாம்; நீங்கள் அதைத் திறக்கத் தேர்ந்தெடுக்கும் வரை அவர் உள்ளே இருப்பதைப் பார்க்க முடியாது; ஒருமுறை மூடிய பிறகு உள்ளே இருக்கும் பதிலை மாற்றவும் முடியாது.

இது ஒரு சிறிய அடிப்படை கூறாகத் தோன்றலாம்; ஆனால் பெரும்பாலான பூஜ்ஜிய-அறிவுச் சான்று அமைப்புகளின் அடிப்படையில் பெரும் சுமையைத் தாங்கும் கூறு இதுதான். எடுத்துக்காட்டாக, Ethereum-இன் blob அடிப்படையிலான தரவுக் கிடைப்புநிலை வடிவமைப்பு, ஒவ்வொரு blob-ஐயும் ஒரு சிறிய கிரிப்டோகிராஃபிக் உறுதிப்பாடாகச் சுருக்க KZG polynomial commitment-களைப் பயன்படுத்துகிறது. அந்த உறுதிப்பாட்டுடன் ஒப்பிட்டு ஓர் evaluation அல்லது மாதிரி எடுக்கப்பட்ட cell-ஐ KZG proof அங்கீகரிக்க முடியும்; ஆனால் முழு blob-உம் கிடைக்கிறது என்பதை அது தனியாக நிரூபிப்பதில்லை: கிடைப்புநிலை, ஒருமித்த கருத்து அடுக்கின் விநியோக மற்றும் sampling விதிகளிலிருந்து வருகிறது; பெறப்பட்ட தரவின் ஒருமைப்பாட்டுச் சோதனையை KZG வழங்குகிறது ([EIP-4844](https://eips.ethereum.org/EIPS/eip-4844#consensus-layer-validation); [EIP-7594, PeerDAS](https://eips.ethereum.org/EIPS/eip-7594#networking)). அனைத்து blob தரவும் வெளியிடப்பட்டதற்கான சான்று என்று ஒரு சுருக்கமான evaluation proof-ஐத் தவறாகப் புரிந்துகொள்ளாமல், ஒரு blob-இன் சிறிய பகுதியை verifier சரிபார்க்க இந்தப் பிரிப்பே உதவுகிறது. உண்மையில், Merkle root தானே ஓர் எளிய உறுதிப்பாட்டுத் திட்டம்: root hash மூலம் முழுத் தரவுத்தொகுப்புக்கும் அது உறுதியளிக்கிறது; அதில் ஒரு பகுதியை வெளிப்படுத்தும் "opening" தான் Merkle branch. ZK-rollup-கள் மேம்பட்ட உறுதிப்பாட்டுத் திட்டங்களை (polynomial மற்றும் vector commitment-கள்) அடிப்படையாகக் கொண்டு, முழுப் பரிவர்த்தனைத் தொகுப்பின் செயலாக்கத்தையும் ஆன்-செயினில் குறைந்த செலவில் சரிபார்க்கக்கூடிய ஒரே சான்றாகச் சுருக்குகின்றன — இந்தத் தலைப்பு [முழுமையான vs கணக்கீட்டு பூஜ்ஜிய-அறிவு](/ta/blog/perfect-vs-computational-zero-knowledge/) என்பதில் விரிவாக விளக்கப்பட்டுள்ளது.

---

## ஒப்பீடு: பிளாக்செயின் கிரிப்டோகிராஃபிக் அடிப்படை கூறுகள்

| அடிப்படை கூறு | அது வழங்கும் பண்பு | ஆன்-செயினில் பயன்படுத்தப்படும் இடம் | பாரம்பரிய vs குவாண்டத்துக்குப் பிந்தைய ஆபத்து |
|---|---|---|---|
| Hash செயல்பாடுகள் (SHA-256, Keccak-256) | மோதல் எதிர்ப்புள்ள fingerprint; block-களைச் சங்கிலியாக இணைக்கிறது | Block hashing, முகவரி பெறுதல், Merkle root-கள் | தற்போதைய வெளியீட்டு அளவுகளில் பாரம்பரிய ரீதியாக வலுவானவை; இன்றைய நீள்வட்ட வளைவுக் கையொப்பங்களைவிட hash அடிப்படையிலான திட்டங்கள் பொதுவாகக் குவாண்டம் தாக்குதலை அதிகம் எதிர்க்கக்கூடியவையாகக் கருதப்படுகின்றன |
| டிஜிட்டல் கையொப்பங்கள் — ECDSA | தனிப்பட்ட/பொது விசை இணையால் பரிவர்த்தனையை அங்கீகரித்தல் | Bitcoin மற்றும் Ethereum account கையொப்பங்கள் | பாரம்பரிய ரீதியாகப் பாதுகாப்பானது; போதுமான திறனுள்ள பெரிய அளவிலான குவாண்டம் கணினி நீள்வட்ட வளைவு அடிப்படையிலான திட்டங்களை உடைக்கக்கூடும் என்று எதிர்பார்க்கப்படுகிறது; அதனால்தான் குவாண்டத்துக்குப் பிந்தைய மாற்று வழிகளை NIST தரப்படுத்தியுள்ளது ([NIST, 2024](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards#:~:text=A%20sufficiently%20capable%20quantum%20computer%2C%20though%2C%20would%20be%20able%20to%20sift%20through%20a%20vast%20number%20of%20potential%20solutions%20to%20these%20problems%20very%20quickly%2C%20thereby%20defeating%20current%20encryption)) |
| டிஜிட்டல் கையொப்பங்கள் — EdDSA / BLS | நிர்ணயிக்கப்பட்ட கையொப்பமிடல் (EdDSA); திறமையான கையொப்ப ஒருங்கிணைப்பு (BLS) | Solana/Stellar கையொப்பமிடல் (EdDSA); Ethereum சரிபார்ப்பாளர் attestations (BLS) | ECDSA-வைப் போன்ற அதே அடிப்படை நீள்வட்ட வளைவு அனுமானம் — அதே நீண்டகாலக் குவாண்டம் ஆபத்து |
| Merkle மரங்கள் | பெரிய தரவுத்தொகுப்புக்கான சுருக்கமான உறுதிப்பாடு; சிறிய சேர்ப்புச் சான்றுகள் | Block header-கள், light-client (SPV) சரிபார்ப்பு, Ethereum-இன் state/transactions/receipts trie-கள் | அடிப்படையான hash செயல்பாட்டின் மோதல் எதிர்ப்பை மட்டுமே சார்ந்துள்ளது; எனவே புதிய ஆபத்தைச் சேர்க்காமல் அந்த hash-இன் குவாண்டம் நிலையைப் பெறுகிறது |
| நீள்வட்ட வளைவுக் கிரிப்டோகிராஃபி | சுருக்கமான விசைகள் மற்றும் கையொப்பங்களுக்கான கணித அடித்தளம் | secp256k1 (Bitcoin, Ethereum), Ed25519, BLS12-381 | எதிர்காலப் பெரிய அளவிலான குவாண்டம் கணினியால் ECDSA/EdDSA/BLS போன்றே பாதிக்கப்படக்கூடியது; குவாண்டத்துக்குப் பிந்தைய மாற்றம் குறித்த ஆராய்ச்சியின் முக்கிய உந்துதல் இதுதான் |
| உறுதிப்பாட்டுத் திட்டங்கள் | ஒரு மதிப்பை இப்போது பிணைத்து, அதை முன்கூட்டியே வெளிப்படுத்தாமல் பின்னர் வெளிப்படுத்துதல்/நிரூபித்தல் | Ethereum தரவுக் கிடைப்புநிலையில் KZG commitment-கள்; எளிய commitment-களாக Merkle root-கள்; ZK-rollup-களுக்கான கட்டுமானக் கூறு | திட்டத்தை உருவாக்கப் பயன்படுத்திய அடிப்படை hash அல்லது நீள்வட்ட வளைவு அனுமானத்தையே பாதுகாப்பு சார்ந்துள்ளது |

---

## இது டோக்கனைஸ் செய்யப்பட்ட டொமைன்களுடன் எப்படி இணைகிறது?

ஒரு டொமைனை [டோக்கனைஸ் செய்யும்போது](/ta/glossary/tokenize/) இந்த அடிப்படை கூறுகள் ஒவ்வொன்றும் நேரடியாகப் பயன்படுகின்றன. உரிமையைப் பிரதிநிதித்துவப்படுத்தும் [NFT](/ta/glossary/nft/), சங்கிலியின் account மற்றும் token அங்கீகார விதிகளால் பாதுகாக்கப்படுகிறது. அதை externally owned account வைத்திருந்தால், அந்த account-இன் தனிப்பட்ட விசை அதன் செயல்களை அங்கீகரிக்கிறது; contract account-க்கு தனிப்பட்ட விசை இல்லை, அதன் code அதைக் கட்டுப்படுத்துகிறது ([ethereum.org, *Ethereum account-கள்*](https://ethereum.org/en/developers/docs/accounts/#account-types)). ERC-721 token-இல், அங்கீகரிக்கப்பட்ட முகவரி அல்லது operator-உம் இடமாற்றத்தைத் தொடங்க முடியும் ([ERC-721](https://eips.ethereum.org/EIPS/eip-721#specification)). அதனால்தான் தானே கட்டுப்படுத்தும் EOA உரிமைக்கு [வன்பொருள் பணப்பைகளும்](/ta/glossary/hardware-wallet/) [விதைச் சொற்றொடரை](/ta/glossary/seed-phrase/) கவனமாகப் பாதுகாப்பதும் முக்கியம்; smart-contract மற்றும் custodial பணப்பைகள் வேறுபட்ட அங்கீகாரம் மற்றும் நம்பிக்கை எல்லைகளை அறிமுகப்படுத்துகின்றன. டொமைனின் உரிமைப் பதிவு, சங்கிலியிலுள்ள மற்ற ஒவ்வொரு account இருப்பையும் [ஸ்மார்ட் கான்ட்ராக்டையும்](/ta/glossary/smart-contract/) பாதுகாக்கும் அதே Merkle-உறுதியளிக்கப்பட்ட நிலையில் உள்ளது. அதனால்தான், டோக்கனைஸ் செய்யப்பட்ட டொமைன் மற்ற எந்த ஆன்-செயின் சொத்துக்கும் உள்ள அதே மாற்றம் புலப்படும் தன்மையைப் பெறுகிறது — ரெஜிஸ்ட்ராரின் தரவுத்தளம் மட்டுமே உண்மையின் ஒரே ஆதாரமாக இல்லாமல், இடமாற்றக்கூடியதாகவும், சரிபார்க்கக்கூடியதாகவும், உரிமையை நிரூபிக்கக்கூடியதாகவும் உள்ளது.

டோக்கனைசேஷன் எதை மாற்றுகிறது, எதை மாற்றவில்லை என்பதையும் இந்த அடிப்படை கூறுகளைப் புரிந்துகொள்வது தெளிவாக்குகிறது: டொமைனின் DNS record மற்றும் registry நிலை இன்னும் ICANN விதிகளையே பின்பற்றுகின்றன; ஆனால் அதன் உரிமைச் சான்று, login மூலம் பாதுகாக்கப்படும் [ரெஜிஸ்ட்ரார்](/ta/glossary/registrar/) account-க்குப் பதிலாக, மேலே விவரிக்கப்பட்ட கிரிப்டோகிராஃபியில் இயங்குகிறது. விரிவான கண்ணோட்டத்திற்கு [பிளாக்செயின் ஒருமித்த கருத்து வழிமுறைகள்](/ta/blog/blockchain-consensus-mechanisms/) மற்றும் [பிளாக்செயின் scaling அணுகுமுறைகள்](/ta/blog/blockchain-scaling-approaches/) ஆகியவற்றைப் பாருங்கள்; அல்லது [namefi.io](https://namefi.io)-இல் டோக்கனைஸ் செய்யத் தொடங்குங்கள்.

---

## ஆதாரங்களும் கூடுதல் வாசிப்பும்

- Bitcoin Developer Guide — [Block Chain](https://developer.bitcoin.org/devguide/block_chain.html), முந்தைய header-இன் SHA256(SHA256()) வழியாகச் சங்கிலியாக இணைத்தல்
- Bitcoin — [Bitcoin: ஒரு peer-to-peer மின்னணுப் பண அமைப்பு](https://bitcoin.org/bitcoin.pdf), வேலை-நிரூபண வரலாற்றை மீண்டும் எழுதுதல் மற்றும் ஒட்டுமொத்த வேலை
- Bitcoin Developer Reference — [Block Chain](https://developer.bitcoin.org/reference/block_chain.html), Merkle root உருவாக்கம்
- Bitcoin Developer Guide — [இயக்க முறைகள்](https://developer.bitcoin.org/devguide/operating_modes.html), SPV மற்றும் Merkle branch-கள்
- ethereum.org — [Ethereum account-கள்](https://ethereum.org/en/developers/docs/accounts/), ECDSA மற்றும் Keccak-256 முகவரி பெறுதல்; EOA மற்றும் contract-account கட்டுப்பாடு
- ethereum.org — [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/), state/transactions/receipts root-கள்
- ethereum.org — [Danksharding](https://ethereum.org/en/roadmap/danksharding/), KZG polynomial commitment-கள்
- EIP-4844 — [Shard Blob பரிவர்த்தனைகள்](https://eips.ethereum.org/EIPS/eip-4844), blob commitment-கள், proof-கள், ஒருமித்த கருத்து அடுக்கு கிடைப்புநிலை
- EIP-7594 — [PeerDAS](https://eips.ethereum.org/EIPS/eip-7594), cell proof-கள் மற்றும் தரவுக் கிடைப்புநிலை sampling
- ERC-721 — [Non-Fungible Token தரநிலை](https://eips.ethereum.org/EIPS/eip-721), token உரிமை, அங்கீகாரங்கள், operator-கள்
- EIP-2 — [Homestead Hard-fork மாற்றங்கள்](https://eips.ethereum.org/EIPS/eip-2), secp256k1 கையொப்பக் கட்டுப்பாடுகள்
- EIP-2537 — [BLS12-381 வளைவுச் செயல்பாடுகளுக்கான precompile](https://eips.ethereum.org/EIPS/eip-2537)
- RFC 8032 — [Edwards-Curve Digital Signature Algorithm (EdDSA)](https://www.rfc-editor.org/rfc/rfc8032.html), Ed25519-இன் திட்டம், வளைவு, பாதுகாப்பு நிலை
- SEC 2: Recommended Elliptic Curve Domain Parameters — [secg.org](https://www.secg.org/sec2-v2.pdf)
- NIST SP 800-57 Part 1 Rev. 5 — [விசை நிர்வாகத்திற்கான பரிந்துரை](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final), ஒப்பிடத்தக்க ECC மற்றும் RSA பாதுகாப்பு வலிமைகள்
- *The Eth2 Book* — [கையொப்பங்களும் BLS ஒருங்கிணைப்பும்](https://eth2book.info/capella/part2/building_blocks/signatures/)
- NIST — [குவாண்டத்துக்குப் பிந்தைய முதல் 3 இறுதி encryption தரநிலைகளை NIST வெளியிட்டது](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards)
