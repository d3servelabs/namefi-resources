---
title: "முக்கிய பிளாக்செயின் அளவிடுதல் அணுகுமுறைகள்: Rollup-கள், Sidechain-கள், Channel-கள் மற்றும் Sharding"
date: '2026-07-02'
language: ta
tags: ['guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['arivu-iyandhiran']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 40
format: roundup
description: பிளாக்செயின் அளவிடுதல் பற்றிய தொடக்கநிலைக் கையேடு — optimistic rollup-கள், ZK rollup-கள், sidechain-கள், payment channel-கள், sharding மற்றும் தரவுக் கிடைப்புநிலை அடுக்குகளின் ஒப்பீடு.
ogImage: ../../assets/blockchain-scaling-approaches-og.jpg
keywords: ['பிளாக்செயின் அளவிடுதல்', 'பிளாக்செயின் அளவிடுதல் தீர்வுகள்', 'layer 2 அளவிடுதல்', 'rollup-கள்', 'optimistic rollup', 'zk rollup', 'sidechain-கள்', 'payment channel-கள்', 'state channel-கள்', 'sharding', 'தரவுக் கிடைப்புநிலை', 'அளவிடுதிறன் மும்முனைச் சிக்கல்', 'Arbitrum', 'Optimism', 'zkSync', 'Starknet', 'Celestia', 'EigenDA', 'Polygon PoS', 'Lightning Network']
relatedArticles:
  - /ta/blog/blockchain-virtual-machines/
  - /ta/blog/blockchain-consensus-mechanisms/
  - /ta/blog/blockchain-privacy-technologies/
  - /ta/blog/blockchain-cryptographic-primitives/
  - /ta/blog/premium-web3-tlds/
relatedGlossary:
  - /ta/glossary/rollup/
  - /ta/glossary/optimistic-rollup/
  - /ta/glossary/zk-rollup/
  - /ta/glossary/data-availability/
  - /ta/glossary/layer-2/
relatedTopics:
  - /ta/topics/web3-foundations/
  - /ta/topics/domain-tokenization/
relatedSeries:
  - /ta/series/tokenize-your-com/
  - /ta/series/domain-flipping-skills/
---

Ethereum mainnet ஒரு வினாடிக்கு ஏறத்தாழ 15 பரிவர்த்தனைகளைச் செயலாக்குகிறது. Visa போன்ற ஒரு கட்டண வலையமைப்பு பல்லாயிரக்கணக்கானவற்றைக் கையாளுகிறது. அந்த இடைவெளிதான் பிளாக்செயின்களுக்கு அளவிடுதல் ஏன் தேவை என்பதை விளக்குகிறது: அடிப்படைச் சங்கிலியில் உள்ள ஒவ்வொரு பரிவர்த்தனையையும் ஒவ்வொரு பங்கேற்பாளரும் சரிபார்க்க வேண்டிய அவசியமின்றி அதிகப் பணியைச் செய்வதற்கான ஒரு வழி. கடந்த பல ஆண்டுகளில் இந்தத் துறை சில தனித்துவமான அணுகுமுறைகளைத் தேர்ந்தெடுத்துள்ளது—[rollup-கள்](/ta/glossary/rollup/), sidechain-கள், payment channel-கள் மற்றும் sharding—ஒவ்வொன்றும் பாதுகாப்பு, பரவலாக்கம் மற்றும் செலவு ஆகியவற்றுக்கு இடையில் வெவ்வேறு சமரசங்களைச் செய்கின்றன.

இந்தக் கையேடு முக்கிய அளவிடுதல் அணுகுமுறைகளை விளக்கி, ஒவ்வொன்றின் பின்னணியிலுள்ள செயல்முறையை விவரித்து, அவற்றை அருகருகே ஒப்பிடுகிறது. இதனால் அடுத்த முறை ஒரு திட்டத்தின் ஆவணங்களில் இவை இடம்பெறும்போது, அவற்றின் வேறுபாடு தெளிவாக இருக்கும்.

---

## அளவிடுதிறன் மும்முனைச் சிக்கல்

Vitalik Buterin முன்வைத்த **அளவிடுதிறன் மும்முனைச் சிக்கல்** என்ற கட்டமைப்பே இந்தத் துறையின் பெரும்பகுதிக்கான சிந்தனை மாதிரி. ஒரு பிளாக்செயின் ஒரே நேரத்தில் மூன்று பண்புகளை விரும்புகிறது: "அளவிடுதிறன்: ஒரு சாதாரண தனி node-ஆல்... சரிபார்க்க முடிவதைவிட அதிகமான பரிவர்த்தனைகளைச் சங்கிலி செயலாக்க முடியும்," "பரவலாக்கம்: பெரிய மையப்படுத்தப்பட்ட அமைப்புகளைக் கொண்ட ஒரு சிறிய குழுவை நம்ப வேண்டிய சார்புகள் இல்லாமல் சங்கிலி இயங்க முடியும்," மற்றும் "பாதுகாப்பு: பங்கேற்கும் node-களில் பெரும் சதவீதத்தினர் அதைத் தாக்க முயன்றாலும் சங்கிலியால் அதை எதிர்க்க முடியும்"—ஆனால் பாரம்பரிய வடிவமைப்புகள் இம்மூன்றில் இரண்டை மட்டுமே அடைகின்றன ([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Scalability%3A%20the%20chain%20can%20process%20more%20transactions%20than%20a%20single%20regular%20node)). Bitcoin மற்றும் ஆரம்பகால Ethereum செயல்திறனைவிட பரவலாக்கத்தையும் பாதுகாப்பையும் தேர்ந்தெடுத்தன; சக்திவாய்ந்த validator-களின் சிறிய தொகுப்பைச் சார்ந்திருக்கும் அதிக-TPS சங்கிலிகள் அளவிடுதிறனையும் பாதுகாப்பையும் பெறுகின்றன, ஆனால் பரவலாக்கத்தை விட்டுக்கொடுக்கின்றன; எளிமையான multi-chain வடிவமைப்புகள் அளவிடப்பட்டும் பரவலாக்கப்பட்டும் இருக்கலாம், ஆனால் தாக்குபவர் ஒரே ஒரு சங்கிலியை மட்டும் கைப்பற்றினால் போதும் என்றால் அவை பாதுகாப்பற்றதாகிவிடும்.

கீழே உள்ள ஒவ்வொரு அணுகுமுறையும் உண்மையில் ஒரே கேள்விக்கான பதில்தான்: முக்கோணத்தின் மற்ற இரண்டு முனைகளைக் கைவிடாமல் செயல்திறனை எவ்வாறு அதிகரிப்பது?

## Rollup-கள்: ஆஃப்-செயினில் செயல்படுத்தி, ஆன்-செயினில் தீர்வு காணுதல்

![பல சிறிய பரிவர்த்தனைச் சீட்டுகள் "Rollup Compressor" என்று பெயரிடப்பட்ட ஒரு சுருக்கிக்குள் செலுத்தப்பட்டு, அவை சுருக்கப்பட்ட தொகுப்புக் கனசதுரமாகப் பிழியப்பட்டு, பின்னர் இணைக்கப்பட்ட block-களைக் கொண்ட அடிப்படை அடுக்குச் சங்கிலியில் பதிவிடப்படுவதைக் காட்டும் தட்டையான vector வரைபடம்](../../assets/blockchain-scaling-approaches-01-rollup-batching.jpg)

ஒரு **[rollup](/ta/glossary/rollup/)**, layer 1-க்கு (L1) வெளியே பரிவர்த்தனைகளைச் செயல்படுத்தி, பின்னர் ஒரு சுருக்கமான விவரத்தையும்—அதன் அடிப்படையிலுள்ள பரிவர்த்தனைத் தரவையும்—அடிப்படைச் சங்கிலியில் பதிவிடுகிறது. இவ்வமைப்புகளைக் கண்காணிப்பதில் முன்னணியில் இருக்கும் L2BEAT, rollup-களை "Ethereum-இல் state commitment-களை அவ்வப்போது பதிவிடும் L2-கள்" என்று வரையறுக்கிறது; அந்த commitment-கள் "Validity Proof-களால் சரிபார்க்கப்படுகின்றன அல்லது... நம்பிக்கையின் அடிப்படையில் ஏற்கப்பட்டு, குறிப்பிட்ட fraud proof காலப்பகுதிக்குள் [ஒரு] Fraud Proof செயல்முறை மூலம் எதிர்க்கப்படலாம்" ([l2beat.com](https://l2beat.com/scaling/summary)). தரவும் commitment-உம் இரண்டுமே L1-இல் பதிவாவதால், Ethereum-ஐ மட்டும் கொண்டு எவரும் rollup-இன் state-ஐ மீளுருவாக்க முடியும்—புதிய validator தொகுப்பை நம்புமாறு பயனர்களைக் கேட்பதற்குப் பதிலாக, L1-இன் பாதுகாப்பை rollup பெறுவதற்கு இதுவே வழிவகுக்கிறது. இன்று பெரும்பாலானவர்கள் பயன்படுத்தும் [layer 2](/ta/glossary/layer-2/) வலையமைப்புகளின் பின்னணித் தொழில்நுட்பம் இதுதான்: Base, Arbitrum, Optimism, zkSync மற்றும் Starknet அனைத்தும் rollup-களே.

தங்களின் ஆஃப்-செயின் செயலாக்கம் சரியானது என்பதை எப்படி நிரூபிக்கின்றன என்பதன் அடிப்படையில் rollup-கள் இரண்டு வகைகளாகப் பிரிகின்றன.

### Optimistic Rollup-கள்

![அருகருகே உள்ள இரண்டு கதவுகளைக் காட்டும் தட்டையான vector விளக்கப்படம்: fraud-proof காலத்தைச் சுட்டும் 7 நாள் கடிகாரமும் challenge-period கொடியும் கொண்ட ஆரஞ்சு நிற "Optimistic" கதவு; உடனடி validity-proof சரிபார்ப்புக் குறியைக் கொண்ட பச்சை நிற "ZK" கதவு](../../assets/blockchain-scaling-approaches-02-optimistic-vs-zk.jpg)

ஒரு [optimistic rollup](/ta/glossary/optimistic-rollup/) "ஆஃப்-செயின் பரிவர்த்தனைகள் செல்லுபடியாகும் என்று கருதி, பரிவர்த்தனைத் தொகுப்புகளுக்கான validity proof-களை வெளியிடுவதில்லை" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=Optimistic%20rollups%20assume%20offchain%20transactions%20are%20valid%20and%20don%27t%20publish%20proofs%20of%20validity)). Operator-கள் பரிவர்த்தனைகளைத் தொகுத்து, அவற்றை ஆஃப்-செயினில் செயல்படுத்தி, சுருக்கப்பட்ட தரவை Ethereum-இல் பதிவிடுகின்றனர். அதன் பிறகு திறக்கப்படும் challenge window-இல், முழு node-ஐ இயக்கும் எவரும் fraud proof மூலம் அந்தத் தொகுப்பை எதிர்க்கலாம்; L2-இலிருந்து L1-க்கு நிதியைத் திரும்பப் பெற, "ஏறத்தாழ ஏழு நாட்கள் நீடிக்கும் challenge period முடியும்" வரை காத்திருக்க வேண்டும் ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=the%20challenge%20period%E2%80%94lasting%20roughly%20seven%20days%E2%80%94elapses)). மூன்றாம் தரப்பு பணப்புழக்க வழங்குநரைப் பயன்படுத்தி, கட்டணம் செலுத்தி வேகமாக வெளியேறாவிட்டால், ஒரு சாதாரண optimistic-rollup பணமெடுப்பு சுமார் ஒரு வாரம் எடுப்பதற்கு அந்த ஒரு வார காலப்பகுதியே காரணம்.

Optimistic rollup-களுக்கு முழுமையான கிரிப்டோகிராஃபிக் proof உருவாக்கும் pipeline-க்குப் பதிலாக fraud-proof அமைப்பு மட்டுமே தேவை. இதனால் வரலாற்று ரீதியாக அவற்றின் மேல் பொது நோக்க smart contract-களை ஆதரிப்பது எளிதாக இருந்தது. **Arbitrum**, **Optimism** மற்றும் **Base**—Coinbase-இன் rollup; ethereum.org இதை "OP Stack கொண்டு உருவாக்கப்பட்ட Optimistic Rollup" என்று விவரிக்கிறது ([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Base%20is%20an%20Optimistic%20Rollup%20built%20with%20the%20OP%20Stack))—இன்று பயன்பாட்டின் அடிப்படையில் மிகப்பெரிய optimistic rollup-களாக உள்ளன.

### ZK Rollup-கள்

ஒரு [ZK rollup](/ta/glossary/zk-rollup/) இதற்கு எதிரான அணுகுமுறையைப் பயன்படுத்துகிறது: செல்லுபடியாகும் என்று கருதி challenge period-ஐ அனுமதிப்பதற்குப் பதிலாக, ஒவ்வொரு தொகுப்புடனும் validity proof-ஐ—தொகுப்பின் state transition சரியானது என்பதை உறுதிப்படுத்தும் கிரிப்டோகிராஃபிக் சான்றை—சமர்ப்பிக்கிறது. அந்த proof-ஐ Ethereum ஆன்-செயினில் சரிபார்ப்பதால், "ZK-rollup-இலிருந்து Ethereum-க்கு நிதியை நகர்த்தும்போது தாமதம் இல்லை... ஏனெனில் ZK-rollup contract validity proof-ஐச் சரிபார்த்தவுடன் வெளியேற்றப் பரிவர்த்தனைகள் செயல்படுத்தப்படுகின்றன" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=There%20are%20no%20delays%20when%20moving%20funds%20from%20a%20ZK%2Drollup%20to%20Ethereum)). ZK-rollup-கள் "ஆயிரக்கணக்கான பரிவர்த்தனைகளை ஒரு தொகுப்பில் செயலாக்கி, பின்னர் குறைந்தபட்ச சுருக்கத் தரவை மட்டும் Mainnet-இல் பதிவிட முடியும்" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20can%20process%20thousands%20of%20transactions%20in%20a%20batch)); இதற்கு zk-SNARK-கள் (சிறிய proof-கள், விரைவான சரிபார்ப்பு) அல்லது zk-STARK-கள் (வெளிப்படையானவை, trusted setup தேவையில்லை) போன்ற proof அமைப்புகளைப் பயன்படுத்துகின்றன. **zkSync Era**, **Starknet**—"STARK-கள் மற்றும் Cairo VM-ஐ அடிப்படையாகக் கொண்ட ஒரு பொது நோக்க ZK Rollup" ([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Starknet%20is%20a%20general%20purpose%20ZK%20Rollup%20based%20on%20STARKs%20and%20the%20Cairo%20VM))—மற்றும் **Linea** ஆகியவை குறிப்பிடத்தக்க ZK rollup-கள்; ஏற்கெனவே உள்ள Ethereum smart contract-களை ZK proof உருவாக்கக்கூடிய சூழலில் இயக்குவதற்காக Polygon zkEVM மற்றும் Scroll ஆகியவையும் zkEVM-ஐச் செயல்படுத்துகின்றன.

இதன் சமரசம்: validity proof-களை உருவாக்க கணக்கீட்டுச் செலவு அதிகம்; முழுமையான EVM சமத்துவத்தை அடைய, fraud-proof அமைப்பைவிட அவற்றை உருவாக்குவது தொழில்நுட்ப ரீதியாகக் கடினம்—ZK rollup-கள் விரைவான இறுதித்தன்மையை வழங்கினாலும், optimistic rollup-கள் முதலில் பரவலான பயன்பாட்டை அடைந்ததற்கான காரணங்களில் இதுவும் ஒன்று.

## Sidechain-கள்

ஒரு **sidechain** என்பது "Ethereum-இலிருந்து சுயாதீனமாக இயங்கி, இருவழிப் பாலத்தால் Ethereum Mainnet-உடன் இணைக்கப்பட்டிருக்கும் ஒரு தனி பிளாக்செயின்"; மேலும் rollup-ஐப் போலல்லாமல், "sidechain ஒரு தனியான consensus mechanism-ஐப் பயன்படுத்துவதால் Ethereum-இன் பாதுகாப்பு உத்தரவாதங்களைப் பெறுவதில்லை" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/#:~:text=A%20sidechain%20uses%20a%20separate%20consensus%20mechanism%20and%20doesn%27t%20benefit%20from%20Ethereum%27s%20security%20guarantees)). Layer 2-இலிருந்து இதை வேறுபடுத்தும் முக்கிய அம்சம் இதுதான்: Ethereum-இன் validator-களுக்குப் பதிலாகத் தனது சொந்த validator தொகுப்புக்குப் பதிலளிப்பதால், sidechain பரம்பரையாகப் பெறும் பாதுகாப்பைச் சுயாதீன வடிவமைப்புச் சுதந்திரத்திற்காகவும், பொதுவாகக் குறைந்த கட்டணங்களுக்கும் விரைவான block-களுக்கும் பரிமாறிக்கொள்கிறது.

**Polygon PoS** மிகவும் பிரபலமான எடுத்துக்காட்டு. Polygon-இன் சொந்தத் தயாரிப்புப் பக்கம் இதை "Ethereum-இல் அதிகம் பயன்படுத்தப்படும் sidechain—பில்லியன் கணக்கான மதிப்பைப் பாதுகாத்து, ஏறத்தாழ உடனடிப் பரிவர்த்தனைகளையும் ஒரு சென்ட்டிற்கும் குறைவான கட்டணங்களையும் வழங்கி நடைமுறையில் சோதிக்கப்பட்டது" என்று விவரிக்கிறது ([polygon.technology](https://polygon.technology/polygon-pos)); இது Ethereum-இன் validator-களுக்குப் பதிலாகத் தனது சொந்த proof-of-stake validator தொகுப்பால் பாதுகாக்கப்படுகிறது. **Gnosis Chain** (முன்பு xDai) மற்றொரு பரவலாகப் பயன்படுத்தப்படும் sidechain; Skale மற்றும் Metis Andromeda ஆகியவையும் இதில் அடங்கும். நீங்கள் வேறொரு, பொதுவாகச் சிறிய validator தொகுப்பை நம்புவதால், ஒரு sidechain-இன் பாதுகாப்பு அந்தத் தொகுப்பின் வலிமையை மட்டுமே சார்ந்தது—இது rollup வழங்கும் உத்தரவாதத்திலிருந்து கணிசமாக வேறுபட்டது; rollup-இல் செல்லாத state-களை, கொள்கையளவில், L1-இல் பதியப்பட்ட தரவைக் கொண்டு கண்டறிந்து மாற்றியமைக்கலாம்.

## State மற்றும் Payment Channel-கள்

ஒரு **state channel**, இரண்டு அல்லது அதற்கு மேற்பட்ட தரப்பினர் நிதியை ஒரு பகிரப்பட்ட contract-இல் பூட்டி, கையொப்பமிட்ட புதுப்பிப்புகளை நேரடியாகப் பரிமாறுவதன் மூலம் ஆஃப்-செயினில் பரிவர்த்தனை செய்ய அனுமதிக்கிறது. இதனால் "channel பங்கேற்பாளர்கள், channel-ஐத் திறக்கவும் மூடவும் இரண்டு ஆன்-செயின் பரிவர்த்தனைகளை மட்டுமே சமர்ப்பித்து, எத்தனை ஆஃப்-செயின் பரிவர்த்தனைகளை வேண்டுமானாலும் மேற்கொள்ள முடியும்" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=Channel%20peers%20can%20conduct%20an%20arbitrary%20number%20of%20offchain%20transactions%20while%20only%20submitting%20two%20onchain%20transactions)). ஒரு payment channel இதை எளிய இருப்புப் பரிமாற்றங்களுக்காகத் தனிப்பயனாக்குகிறது; அது "இரண்டு பயனர்கள் கூட்டாகப் பராமரிக்கும் 'இருவழிப் பேரேடு' எனச் சிறப்பாக விவரிக்கப்படுகிறது" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=A%20payment%20channel%20is%20best%20described%20as%20a%20%E2%80%9Ctwo%2Dway%20ledger%E2%80%9D%20collectively%20maintained%20by%20two%20users)). பங்கேற்பாளர்கள் தங்களுக்கு இடையே எத்தனை முறை வேண்டுமானாலும் உடனடியாகவும் ஆஃப்-செயினிலும் பரிவர்த்தனை செய்யலாம்; channel-ஐத் திறப்பதற்கும் (பிணையைப் பூட்டுதல்), மூடுவதற்கும் (இறுதி இருப்பைத் தீர்த்தல்) மட்டுமே அடிப்படைச் சங்கிலியைத் தொடுகின்றனர்.

மிகவும் பிரபலமான செயலாக்கம் Bitcoin-இன் **Lightning Network**. அதன் சொந்தத் தளம் இதை, "பங்கேற்பாளர்களின் வலையமைப்பு முழுவதும் உடனடிக் கட்டணங்களைச் செயல்படுத்த பிளாக்செயினின் smart contract செயல்பாட்டைப் பயன்படுத்தும் பரவலாக்கப்பட்ட வலையமைப்பு" என்று விவரிக்கிறது; இணையத்தில் தரவுப் பொட்டலங்கள் வழிமாற்றப்படுவதைப் போலக் கட்டணங்களை வழிமாற்றும் "இருதிசை payment channel-களால்" இது கட்டமைக்கப்பட்டுள்ளது ([lightning.network](https://lightning.network/)). இதில் உள்ள சிக்கல்: *ஒருவருக்கொருவர் இடையே திறந்த channel-களின் பாதையைக் கொண்டுள்ள தரப்புகளுக்கு இடையிலான* பரிவர்த்தனைகளை மட்டுமே channel-கள் அளவிடுகின்றன; channel-ஐத் திறக்க நிதியை முன்கூட்டியே ஒதுக்க வேண்டும்; மேலும் channel வலையமைப்புகள் பெரிய அளவில் சிறப்பாகச் செயல்பட பணப்புழக்க வழிமாற்றம் தேவை—எவருக்கும் விருப்பமான smart contract-களை இயக்கக்கூடிய பொது நோக்க rollup-க்கு இவற்றில் எதுவும் பொருந்தாது.

## Sharding மற்றும் தரவுக் கிடைப்புநிலை அடுக்குகள்

![பரிவர்த்தனைகள் நான்கு இணையான shard தடங்களாகப் பிரிக்கப்படுவதையும் (Shard 1 முதல் Shard 4 வரை), ஒவ்வொன்றும் அதன் சொந்த block சங்கிலியைச் சுயாதீனமாகச் செயலாக்குவதையும், அவை அனைத்தும் கீழே உள்ள தரவுக் கிடைப்புநிலை அடுக்குப் பட்டையில் இணைவதையும் காட்டும் தட்டையான vector வரைபடம்](../../assets/blockchain-scaling-approaches-03-sharding.jpg)

**Sharding**, ஒரு பிளாக்செயினின் சரிபார்ப்புப் பணியை node-களின் பல இணையான துணைத்தொகுப்புகளாக ("shard-கள்") பிரிக்கிறது; இதனால் எந்த ஒரு தனி node-உம் வலையமைப்பின் முழுப் பரிவர்த்தனைச் சுமையையும் செயலாக்க வேண்டியதில்லை. Vitalik Buterin-இன் கருத்துப்படி, மும்முனைச் சிக்கலின் மூன்று முனைகளையும் ஒரே நேரத்தில் பெற உதவும் "ஒரு நுட்பமே sharding" ([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Sharding%20is%20a%20technique%20that%20gets%20you%20all%20three)); வெவ்வேறு shard-களை இணையாகச் சரிபார்க்க, சீரற்ற முறையில் மாதிரி எடுக்கப்பட்ட validator குழுக்களை இது பயன்படுத்துகிறது. ஒவ்வொரு node-உம் ஒவ்வொரு shard-இன் முழுத் தரவையும் பதிவிறக்க வேண்டியதில்லாமல் sharding-ஐப் பாதுகாப்பாகச் செயல்படச் செய்யும் தொழில்நுட்பம் [தரவுக் கிடைப்புநிலை](/ta/glossary/data-availability/) மாதிரி எடுத்தல் (DAS)—"எந்தவொரு தனிப்பட்ட node மீதும் அதிக அழுத்தம் கொடுக்காமல், தரவு கிடைக்கிறதா என்பதை வலையமைப்பு சரிபார்க்கும் ஒரு வழி" ([ethereum.org](https://ethereum.org/en/developers/docs/data-availability/#:~:text=Data%20availability%20sampling%20is%20a%20way%20for%20the%20network%20to%20check%20that%20data%20is%20available%20without%20putting%20too%20much%20strain%20on%20any%20individual%20node)): ஒரு light node, block-இன் தரவில் சிறிய, சீரற்ற முறையில் தேர்ந்தெடுக்கப்பட்ட பகுதிகளை மட்டுமே பதிவிறக்குகிறது; erasure coding காரணமாக, முழுத் தரவும் வெளியிடப்பட்டது என்ற நம்பிக்கையை அதனால் பெற முடியும்.

இதே தரவுக் கிடைப்புநிலைச் சிக்கல் rollup-களுக்கும் நேரடியாகப் பொருந்துகிறது. இதனால்தான் பிரத்யேக தரவுக் கிடைப்புநிலை அடுக்குகள் தனி உட்கட்டமைப்பு வகையாக உருவாகியுள்ளன. **Celestia** என்பது "பரிவர்த்தனைத் தரவை வெளியிட்டு, எவரும் பதிவிறக்கும்படி கிடைக்கச் செய்வதற்கான வலையமைப்பாக Celestia-வை rollup-களும் L2-களும் பயன்படுத்தும்" வகையில் குறிப்பாக உருவாக்கப்பட்ட modular blockchain ([celestia.org](https://celestia.org/what-is-celestia/#:~:text=Rollups%20and%20L2s%20use%20Celestia%20as%20a%20network%20for%20publishing%20and%20making%20transaction%20data%20available%20for%20anyone%20to%20download)); இதனால் ஒரு rollup, தனது தரவை Ethereum mainnet-க்குப் பதிலாக மலிவான, இந்த நோக்கத்துக்காகவே உருவாக்கப்பட்ட DA அடுக்கில் பதிவிட முடியும். EigenLayer-இன் restaking உட்கட்டமைப்பில் உருவாக்கப்பட்ட **EigenDA**, DA அடுக்கையும் பாதுகாக்க விருப்பத்துடன் இணையும் Ethereum staker-களால் பாதுகாக்கப்படும் இதற்கு ஒப்பான சேவையை வழங்குகிறது. Ethereum L1-க்குப் பதிலாக வெளிப்புற DA அடுக்கில் தரவை வெளியிடும் rollup-கள் சில சமயங்களில் "தூய" rollup-கள் என்பதற்குப் பதிலாக *validium-கள்* அல்லது *optimium-கள்* என்று அழைக்கப்படுகின்றன; ஏனெனில் rollup-களுக்கும் பிற L2 தீர்வுகளுக்கும் அருகில் இவற்றை ஒரு தனி வகையாக L2BEAT கண்காணிக்கிறது ([l2beat.com](https://l2beat.com/scaling/summary))—குறைந்த தரவு பதிவிடல் செலவுக்காக, L1-இல் பதியப்பட்ட பாதுகாப்பு உத்தரவாதத்தின் ஒரு பகுதியை அவை பரிமாறிக்கொள்கின்றன.

## அணுகுமுறைகளின் ஒப்பீடு

| அணுகுமுறை | கணக்கீடு நடைபெறும் இடம் | L1 பாதுகாப்பைப் பெறுகிறதா? | தரவுக் கிடைப்புநிலை | முக்கியச் சமரசம் | எடுத்துக்காட்டுகள் |
|---|---|---|---|---|---|
| Optimistic rollup | ஆஃப்-செயின் (L2) | ஆம் — L1-இல் தரவு + fraud proof | முழுத் தரவும் L1-இல் பதிவிடப்படுகிறது | ~7 நாள் பணமெடுப்பு challenge window | Arbitrum, Optimism, Base |
| ZK rollup | ஆஃப்-செயின் (L2) | ஆம் — L1-இல் தரவு + validity proof | முழுத் தரவும் L1-இல் பதிவிடப்படுகிறது | proof உருவாக்க அதிகச் செலவு; முழுமையான EVM சமத்துவம் கடினம் | zkSync, Starknet, Linea |
| Sidechain | சுயாதீனச் சங்கிலி | இல்லை — சொந்த consensus/validator-கள் | சொந்தச் சங்கிலி; L1-இல் பதிவிடப்படாது | அதன் சொந்த validator தொகுப்பின் வலிமை அளவுக்கு மட்டுமே பாதுகாப்பு | Polygon PoS, Gnosis Chain |
| State/payment channel | ஆஃப்-செயினில், பங்கேற்பாளர்களுக்கு இடையே | மறைமுகமாக — L1-இல் நிதி பூட்டப்பட்டுள்ளது | வெளியிடப்படாது; இறுதி state மட்டும் ஆன்-செயினில் | channel மூலம் இணைந்த தரப்புகளுக்கு இடையிலான பரிவர்த்தனைகளை மட்டுமே அளவிடும்; நிதி முன்கூட்டியே பூட்டப்பட வேண்டும் | Lightning Network |
| Sharding / DA அடுக்கு | இணையான shard-கள் அல்லது ஒரு தனி DA வலையமைப்பு | மாறுபடும் — L1 sharding அதைப் பெறுகிறது; வெளிப்புற DA அடுக்குகள் புதிய நம்பிக்கை அனுமானத்தைச் சேர்க்கின்றன | தரவுக் கிடைப்புநிலை மாதிரி எடுத்தல் மூலம் சரிபார்க்கப்படுகிறது | வெளிப்புற DA செலவைக் குறைக்கிறது, ஆனால் L1-க்கு வெளியே ஒரு சார்பைச் சேர்க்கிறது | Ethereum-இன் sharding திட்டம், Celestia, EigenDA |

எந்த ஓர் அணுகுமுறையும் எல்லா பரிமாணங்களிலும் வெல்வதில்லை. அதனால்தான் நடைமுறை அமைப்புகள் அவற்றை அதிகளவில் இணைக்கின்றன—உதாரணமாக, Ethereum-க்குப் பதிலாக Celestia-வில் தனது தரவைப் பதிவிடும் ஒரு ZK rollup, ஓர் அடுக்கிடமிருந்து validity-proof பாதுகாப்பையும் மற்றொன்றிடமிருந்து மலிவான தரவுக் கிடைப்புநிலையையும் பெற்றுக்கொள்கிறது.

---

## டோக்கனாக்கப்பட்ட டொமைன்களுடன் இது எவ்வாறு தொடர்புபடுகிறது

[டோக்கனாக்கப்பட்ட டொமைன்களுக்கு](/ta/glossary/tokenized-domain/) அளவிடுதல் தேர்வுகள் முக்கியம். ஏனெனில் ஒவ்வொரு mint, transfer, DNS புதுப்பிப்பு அல்லது பிணை நடவடிக்கையும் ஓர் ஆன்-செயின் பரிவர்த்தனை; அது எங்கு தீர்க்கப்படுகிறது என்பதைப் பொறுத்தே அதன் செலவும் இறுதித்தன்மை அடையும் நேரமும் அமைகின்றன. Optimistic rollup-இல் உறுதிப்படுத்தப்பட்ட ஒரு டோக்கனாக்கப்பட்ட `.com` பரிமாற்றம் L2-இல் மலிவாகவும் வேகமாகவும் தோன்றலாம்; ஆனால் அந்த rollup பரிவர்த்தனை, [rollup block-ஐ Ethereum ஏற்றுக்கொண்ட பிறகே இறுதியானதாகிறது](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=transactions%20conducted%20on%20the%20rollup%20are%20only%20final%20after%20the%20rollup%20block%20is%20accepted%20on%20Ethereum). Fast-exit bridge ஒன்று rollup state-ஐ L1-இல் விரைவாக இறுதியாக்குவதில்லை: பணமெடுப்பின்போது, பணப்புழக்க வழங்குநர் ஒருவர் [நிலுவையிலுள்ள L2 பணமெடுப்பின் உரிமையை ஏற்று, பயனருக்கு L1-இல் பணம் செலுத்துகிறார்](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=A%20liquidity%20provider%20assumes%20ownership%20of%20a%20pending%20L2%20withdrawal%20and%20pays%20the%20user%20on%20L1), பொதுவாக ஒரு கட்டணத்திற்காக; அதே நேரம் canonical பணமெடுப்பு challenge period முடியும் வரை காத்திருக்கும். இதே பரிமாற்றம் ஒரு ZK rollup-இல் நடந்தால், validity proof பதிவானவுடன் L1-க்கு எதிராக இறுதியாகிறது. Sidechain-கள் இன்னும் மலிவாக இருக்கலாம்; ஆனால் sidechain-இல் மட்டுமே இருக்கும் domain NFT, Ethereum-இன் பாதுகாப்புக்குப் பதிலாக அந்த sidechain-இன் சிறிய validator தொகுப்பின் பாதுகாப்பையே பெறுகிறது. ஒரு டொமைன் ஆன்-செயினில் பிரதிநிதித்துவப்படுத்தப்படும்போது நீங்கள் உண்மையில் எதைச் சொந்தமாக வைத்திருக்கிறீர்கள் என்பதைப் புரிந்துகொள்வதில் இந்தச் சமரசங்களை அறிவதும் ஒரு பகுதியாகும்—பொதுவாக [Web3 அடிப்படைகள்](/ta/topics/web3-foundations/) முழுவதும் முக்கியத்துவம் பெறும் அதே உரிய கவன ஆய்வுப் பழக்கமே இது.

---

## ஆதாரங்களும் மேலதிக வாசிப்பும்

- [பிளாக்செயின் அளவிடுதிறனின் வரம்புகள் — Vitalik Buterin](https://vitalik.eth.limo/general/2021/04/07/sharding.html)
- [Layer 2 — ethereum.org](https://ethereum.org/en/layer-2/)
- [Optimistic Rollup-கள் — ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/)
- [ZK-Rollup-கள் — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [Sidechain-கள் — ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/)
- [State Channel-கள் — ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/)
- [தரவுக் கிடைப்புநிலை — ethereum.org](https://ethereum.org/en/developers/docs/data-availability/)
- [L2BEAT அளவிடுதல் சுருக்கம்](https://l2beat.com/scaling/summary)
- [Celestia என்றால் என்ன? — celestia.org](https://celestia.org/what-is-celestia/)
- [Lightning Network](https://lightning.network/)
- [Polygon PoS — polygon.technology](https://polygon.technology/polygon-pos)
