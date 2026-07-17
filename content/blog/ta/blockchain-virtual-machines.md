---
title: "முக்கிய பிளாக்செயின் மெய்நிகர் இயந்திரங்கள்: EVM, SVM, MoveVM, WebAssembly/RISC-V மற்றும் CairoVM"
date: '2026-07-02'
language: ta
tags: ['guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['arivu-iyandhiran']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 30
format: roundup
description: EVM, SVM, MoveVM, WebAssembly மற்றும் RISC-V VM-கள், CairoVM ஆகிய முக்கிய பிளாக்செயின் மெய்நிகர் இயந்திரங்களின் மொழிகள், செயலாக்க மாதிரிகள், சூழலமைப்புகள் ஆகியவற்றை ஒப்பிடும் கையேடு.
ogImage: ../../assets/blockchain-virtual-machines-og.jpg
keywords: ['பிளாக்செயின் மெய்நிகர் இயந்திரம்', 'பிளாக்செயின் மெய்நிகர் இயந்திரங்கள்', 'evm', 'ethereum மெய்நிகர் இயந்திரம்', 'svm', 'solana மெய்நிகர் இயந்திரம்', 'sealevel', 'movevm', 'move மொழி', 'wasm பிளாக்செயின்', 'cosmwasm', 'polkavm', 'cairovm', 'cairo மொழி', 'starknet', 'ஸ்மார்ட் கான்ட்ராக்ட் மொழி', 'பிளாக்செயின் இணைச் செயலாக்கம்', 'evm இணக்கமானது', 'பிளாக்செயின் செயலாக்கச் சூழல்', 'பிளாக்செயின் state machine']
relatedArticles:
  - /ta/blog/blockchain-consensus-mechanisms/
  - /ta/blog/blockchain-scaling-approaches/
  - /ta/blog/blockchain-cryptographic-primitives/
  - /ta/blog/blockchain-privacy-technologies/
  - /ta/blog/what-are-tokenized-domains/
relatedTopics:
  - /ta/topics/web3-foundations/
  - /ta/topics/domain-tokenization/
relatedSeries:
  - /ta/series/tokenize-your-com/
  - /ta/series/domain-flipping-skills/
relatedGlossary:
  - /ta/glossary/ethereum-virtual-machine/
  - /ta/glossary/webassembly/
  - /ta/glossary/smart-contract/
  - /ta/glossary/ethereum/
  - /ta/glossary/gas/
---

ஒவ்வொரு [ஸ்மார்ட் கான்ட்ராக்டும்](/ta/glossary/smart-contract/) எங்காவது இயங்க வேண்டும். அந்த "எங்காவது" என்பது பிளாக்செயின் மெய்நிகர் இயந்திரம் (VM)—வலையமைப்பிலுள்ள ஒவ்வொரு node-உம் ஒரே மாதிரியாகச் செயல்படுத்தும் தனிமைப்படுத்தப்பட்ட நிரல். இதனால் யார் அதை இயக்கினாலும் ஒரே input எப்போதும் ஒரே output-ஐ உருவாக்கும். நீங்கள் உருவாக்கும் VM, ஒரு சங்கிலியைப் பற்றிய ஏறத்தாழ அனைத்தையும் வடிவமைக்கிறது: எந்த மொழிகளில் code எழுதலாம், பரிவர்த்தனைகள் ஒரே நேரத்தில் இயங்குமா அல்லது ஒன்றன்பின் ஒன்றாக மட்டுமே இயங்குமா, ஏற்கெனவே உள்ள developer சூழலமைப்பில் தொடக்க நாளிலிருந்தே எவ்வளவு இணைத்துக்கொள்ளலாம் என்பவை இதில் அடங்கும்.

இன்று [Web3](/ta/glossary/web3/)-இல் நடைபெறும் smart contract செயல்பாட்டின் பெரும்பகுதியை இயக்கும் ஐந்து VM குடும்பங்களை இந்தக் கையேடு விளக்குகிறது: [Ethereum மெய்நிகர் இயந்திரம்](/ta/glossary/ethereum-virtual-machine/) (EVM), Solana-வின் SVM, Aptos மற்றும் Sui பயன்படுத்தும் MoveVM, CosmWasm மற்றும் PolkaVM போன்ற [WebAssembly](/ta/glossary/webassembly/) அல்லது RISC-V-இல் உருவாக்கப்பட்ட portable-bytecode VM-கள், Starknet-இன் CairoVM.

---

## பிளாக்செயின் மெய்நிகர் இயந்திரம் என்றால் என்ன, அது ஏன் முக்கியம்?

பிளாக்செயின் VM என்பது நிர்ணயிக்கப்பட்ட விளைவை வழங்கும், தனிமைப்படுத்தப்பட்ட செயலாக்கச் சூழல்: ஒவ்வொரு full node-உம் அதே பரிவர்த்தனைகளைப் பதிவிறக்கி, அதே VM வழியாக அவற்றை இயக்கி, விளைவாக அதே [ஆன்-செயின்](/ta/glossary/on-chain/) state-ஐ அடைகிறது. Ethereum-இன் சொந்த ஆவணம் EVM-ஐ, "அனைத்து Ethereum node-களிலும் code-ஐச் சீராகவும் பாதுகாப்பாகவும் செயல்படுத்தும் பரவலாக்கப்பட்ட மெய்நிகர் சூழல்" என்று விவரிக்கிறது ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20is%20a%20decentralized,mechanics%20of%20how%20they%20work))—இந்த விளக்கம் இக்கையேட்டிலுள்ள ஒவ்வொரு VM-க்கும் பொதுவாகப் பொருந்துகிறது.

இரண்டு பண்புகள் ஒரு VM-இன் வடிவமைப்புச் சமரசங்களை வரையறுக்கின்றன:

- **மொழியும் toolchain-உம்.** Developer-கள் எந்த மொழிகளில் contract-களை எழுதலாம்? ஏற்கெனவே தணிக்கை செய்யப்பட்ட code, tooling மற்றும் அவற்றை அறிந்த பணியாளர்களின் தொகுப்பு எவ்வளவு பெரியது?
- **செயலாக்க மாதிரி.** VM பரிவர்த்தனைகளை ஒரே நேரத்தில் கண்டிப்பாக ஒன்றாக (வரிசையாக) செயல்படுத்துகிறதா, அல்லது ஒன்றுக்கொன்று சாராத பரிவர்த்தனைகள் பல CPU core-களில் ஒரே நேரத்தில் இயங்க முடியுமா (இணைச் செயலாக்கம்)? வரிசைச் செயலாக்கத்தைப் புரிந்துகொள்வது எளிது; இணைச் செயலாக்கம் கோட்பாட்டளவிலான செயல்திறனை உயர்த்துகிறது, ஆனால் scheduling சிக்கலைச் சேர்க்கிறது.

இந்தத் தேர்வுகளின் தாக்கம் gas செலவுகள், நெரிசலின்போதான நடத்தை, மறுபடியும் எழுதாமல் எந்த contract-களையும் கருவிகளையும் மாற்றிப் பயன்படுத்தலாம் என்பவை வரை பரவுகிறது—இதனால்தான் ஒரு புதிய சங்கிலியோ, அதன் மேல் உருவாக்கப்படும் [டோக்கனைஸ் செய்யப்பட்ட](/ta/glossary/tokenize/) சொத்தோ பதிலளிக்க வேண்டிய முதல் கேள்விகளில் "எந்த VM" என்பதும் ஒன்று.

---

## EVM (Ethereum மெய்நிகர் இயந்திரம்)

![EVM-ஐ ஒற்றைத் தட stack machine ஆகக் காட்டும் தட்டையான vector வரைபடம்; instruction pointer ஒன்று செங்குத்தான stack-இல் மதிப்புகளைச் சேர்த்தும் அகற்றியும், gas meter அளவுகோல் செயலாக்கச் செலவைக் கண்காணித்தும் காட்டப்படுகிறது](../../assets/blockchain-virtual-machines-01-evm-stack.jpg)

EVM, 2015-இல் [Ethereum](/ta/glossary/ethereum/)-உடன் அறிமுகப்படுத்தப்பட்டது; இப்போது மிகவும் பரவலாகச் செயல்படுத்தப்பட்ட smart contract VM-களில் ஒன்றாக உள்ளது. இது ஒரு **stack அடிப்படையிலான** இயந்திரம்: "1024 உருப்படிகள் ஆழமுள்ள stack machine" ஆக இது செயல்படுவதாக Ethereum-இன் ஆவணம் குறிப்பிடுகிறது; இதில் ஒவ்வொரு உருப்படியும் 256-bit word ஆகும் ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20executes%20as%20a,256%2Dbit%20word)). Contract state ஒவ்வொரு account-உடனும் தொடர்புடைய Merkle Patricia trie-இல் இருக்கிறது; அதேபோல், அனைத்து account-களையும் hash மூலம் இணைக்கும் மாற்றியமைக்கப்பட்ட Merkle Patricia trie ஆக உலகளாவிய chain state ஒழுங்கமைக்கப்பட்டுள்ளது ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Ethereum%20uses%20a%20modified%20Merkle,linked%20by%20hashes)).

**மொழி.** Contract-கள் ஏறத்தாழ எப்போதும் **Solidity**-இல் எழுதப்படுகின்றன. C++ syntax-ஆல் பெரிதும் தாக்கம் பெற்ற இதை, smart contract-களைச் செயல்படுத்துவதற்கான "object-oriented, high-level language" என்று Ethereum-இன் சொந்த ஆவணம் விவரிக்கிறது ([ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Solidity)). Contract-களைத் தணிக்கை செய்வதை எளிதாக்க வேண்டுமென்றே அம்சங்களைக் குறைத்துள்ள "Pythonic" மொழியான **Vyper** முதன்மையான மாற்று ([ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Vyper)).

**செயலாக்க மாதிரி.** EVM ஒரு block-இலுள்ள பரிவர்த்தனைகளை **வரிசையாக**—ஒரு நிலையான வரிசையில் ஒன்றன்பின் ஒன்றாக—செயல்படுத்துகிறது. இதனால் state-transition logic எளிமையாகவும் தணிக்கை செய்வதற்கு வசதியாகவும் இருக்கிறது; ஆனால் அடிப்படை அடுக்கின் செயல்திறன் வரம்புக்குட்படுகிறது.

**Gas.** ஒவ்வொரு operation-க்கும் [கேஸ்](/ta/glossary/gas/) செலவாகும். இது "operation-களுக்குத் தேவையான கணக்கீட்டு முயற்சியை" அளக்கும் Ethereum-இன் அலகு; செயலாக்கத்திற்கான விலையை நிர்ணயித்து, spam அல்லது முடிவில்லா loop-களிலிருந்து வலையமைப்பைப் பாதுகாக்கிறது ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Since%20each%20transaction%20is%20broadcast,uses%20gas)).

**தனித்துவமான வலிமையும் பரவலும்.** EVM-இன் உண்மையான போட்டி அரண் அதன் சூழலமைப்புதான்: கிரிப்டோ துறையில் அதிகமாகச் செயல்படுத்தப்பட்ட VM இதுவே. ஏற்கெனவே உள்ள Solidity contract-கள், wallet-கள் மற்றும் tooling-ஐக் குறைந்த மாற்றத்துடனோ மாற்றமின்றியோ பயன்படுத்துவதற்காக, பல டஜன் Layer 2-களும் தனித்த சங்கிலிகளும் (Arbitrum, Optimism, Base, Polygon, BNB Chain, Avalanche C-Chain) **EVM-compatible** அல்லது **EVM-equivalent** சூழல்களை வழங்குகின்றன.

---

## SVM (Solana / Sealevel)

![Solana-வின் Sealevel இணைச் செயலாக்கத்தையும் வரிசைச் செயலாக்கத்தையும் ஒப்பிடும் வகையில், பரிவர்த்தனை வாகனங்கள் இணையாகப் பயணிக்கும் பல தட நெடுஞ்சாலையையும் வரிசையில் காத்திருக்கும் வாகனங்களைக் கொண்ட ஒற்றைத் தட சாலையையும் காட்டும் தட்டையான vector வரைபடம்](../../assets/blockchain-virtual-machines-02-parallel-execution.jpg)

Solana-வின் runtime ஆன **Sealevel**, ஒரு குறிப்பிட்ட அனுமானத்தை அடிப்படையாகக் கொண்டது: பெரும்பாலான பரிவர்த்தனைகள் ஒன்றுக்கொன்று தொடர்பில்லாத state பகுதிகளைத் தொடுகின்றன; எனவே அவற்றை ஒன்றன்பின் ஒன்றாகச் செயல்படுத்துவதற்குப் பதிலாக ஒரே நேரத்தில் செயல்படுத்தலாம். Solana-வின் சொந்த அறிவிப்பு, Sealevel-ஐ "Solana-வின் இணையான smart contract runtime" என்றும், "Validator-க்குக் கிடைக்கும் அளவு core-களைப் பயன்படுத்தி, ஆயிரக்கணக்கான contract-களை இணையாகச் செயலாக்கும்" திறன் கொண்டது என்றும் விவரிக்கிறது ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sealevel%E2%80%94Parallel%20Smart%20Contracts%20Runtime)).

**இணைச் செயலாக்கம் எவ்வாறு இயங்குகிறது.** Solana பரிவர்த்தனைகள், தாங்கள் படிக்கவோ எழுதவோ இருக்கும் ஒவ்வொரு account-ஐயும் முன்கூட்டியே அறிவிக்க வேண்டும். அந்த அறிவிப்புதான் scheduling-ஐச் சாத்தியமாக்குகிறது: runtime "நிலுவையிலுள்ள மில்லியன் கணக்கான பரிவர்த்தனைகளை வரிசைப்படுத்தி", "ஒன்றுடன் ஒன்று ஒட்டாத அனைத்துப் பரிவர்த்தனைகளையும் இணையாக schedule செய்ய" முடியும்; ஒரே account-ஐப் *படிக்க* மட்டும் செய்யும் பல பரிவர்த்தனைகளையும் ஒரே நேரத்தில் இயக்கலாம் ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sort%20millions%20of%20pending%20transactions)). இரண்டு பரிவர்த்தனைகள் ஒரே account-ஐ அணுகி, அவற்றில் குறைந்தது ஒன்று அதில் எழுதினால், அவை ஒன்றுக்கொன்று எதிராக வரிசைப்படுத்தப்படுகின்றன; ஒரே account-ஐப் படிக்க மட்டும் செய்யும் பரிவர்த்தனைகள் இன்னமும் ஒரே நேரத்தில் இயங்கலாம்.

**மொழியும் VM-இன் உள்செயல்பாடுகளும்.** Solana program-கள் (smart contract-களுக்கான அதன் சொல்), Berkeley Packet Filter bytecode-இன் ஒரு மாறுபாட்டிற்கு compile செய்யப்படுகின்றன—ஆன்-செயின் VM-க்காக "Berkeley Packet Filter (BPF) bytecode-இன் ஒரு மாறுபாட்டை" தேர்ந்தெடுத்ததாக Solana Labs விவரிக்கிறது ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Berkeley%20Packet%20Filter)). Program-கள் பெரும்பாலும் **Rust**-இல் எழுதப்படுகின்றன; C மற்றும் C++ மொழிகளும் ஆதரிக்கப்படுகின்றன.

**தனித்துவமான வலிமை.** Account அளவிலான இணைச் செயலாக்கம் ஒவ்வொரு contract ஆசிரியரும் தனியாக உருவாக்க வேண்டிய ஒன்றாக இல்லாமல் runtime-இன் பண்பாக இருப்பதால், செயலாக்கத்தை ஆஃப்-செயினுக்கு நகர்த்தாமலேயே Solana அதிக செயல்திறனைத் தக்கவைக்க முடியும். இதன் சமரசமாக, EVM-இன் கட்டுப்பாடற்ற storage-உடன் ஒப்பிடும்போது contract-கள் எழுதப்படும் முறையை மாற்றும் கடுமையான account அறிவிப்பு மாதிரியைப் பின்பற்ற வேண்டும்.

---

## MoveVM (Aptos & Sui)

![ஒரு coin-ஐ இயற்பொருள் வளமாகக் கருதி இரண்டு account பெட்டிகளுக்கு இடையே கையிலிருந்து கைக்கு மாற்றுவதைக் காட்டும் தட்டையான vector வரைபடம்; Move-இன் ability கட்டுப்பாட்டிலான resource மாதிரியை விளக்க "copy restricted" மற்றும் "no implicit drop" பாதுகாப்புக் குறியீடுகளும் காட்டப்படுகின்றன](../../assets/blockchain-virtual-machines-03-move-resource-v2.jpg)

**Move** என்பது முதலில் Meta-வின் Diem திட்டத்திற்காக உருவாக்கப்பட்ட smart contract மொழி; இப்போது **Aptos** மற்றும் **Sui** ஆகியவற்றின் அடிப்படை அடுக்காக உள்ளது, இவை ஒவ்வொன்றும் அதன் சொந்த MoveVM மாறுபாட்டை இயக்குகின்றன. Move-ஐ, "பற்றாக்குறை மற்றும் அணுகல் கட்டுப்பாட்டை வலியுறுத்தும் Web3-க்கான பாதுகாப்பான நிரலாக்க மொழி" என்று Aptos-இன் ஆவணம் விவரிக்கிறது ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Move%20is%20a%20safe%20and,scarcity%20and%20access%20control)).

**Resource மாதிரி.** டிஜிட்டல் சொத்துகளை **resource-களாக** கருதுவதே Move-இன் வரையறுக்கும் கருத்து—இவை "தற்செயலாக நகலெடுக்கவோ கைவிடவோ முடியாது" என்பதை மொழியின் type system உறுதிப்படுத்தும் சிறப்பு struct வகைகள் ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Resources%20cannot%20be%20copied%2C%20they,structs%20cannot%20be%20accidentally%20duplicated)). Move resource ஆக மாதிரியாக்கப்பட்ட token அல்லது NFT-ஐ, அதன் வகைக்கு `copy` ability இருந்தாலன்றி நகலெடுக்க முடியாது; `drop` ability இருந்தாலன்றி மறைமுகமாகக் கைவிடவும் முடியாது; செல்லாத பயன்பாடுகளை compiler நிராகரிக்கும். அந்த வகையை வரையறுக்கும் module இன்னமும் புதிய மதிப்புகளை pack செய்யவும், அவற்றை unpack செய்து வெளிப்படையாகப் பயன்படுத்தித் தீர்க்கவும் முடியும்; மேலும் கட்டுப்படுத்தப்பட்ட mint அல்லது burn function-களை வெளிப்படுத்தவும் முடியும் ([Aptos Move ability-கள்](https://aptos.dev/en/build/smart-contracts/book/abilities), [Move struct-களும் module சிறப்புரிமைகளும்](https://aptos-labs.github.io/move-book/structs-and-enums.html)). Ability-கள் தற்செயலான copy-and-drop பிழைகளைத் தடுக்கின்றன; ஆனால் ஒரு contract-இன் விரிவான asset logic சரியானது என்பதை அவை நிரூபிப்பதில்லை, சாத்தியமான ஒவ்வொரு double-spend அல்லது burn பிழையையும் விலக்குவதுமில்லை.

**இணைச் செயலாக்கம்.** Aptos, Move contract-களை **Block-STM** வழியாக இயக்குகிறது. Solana பயன்படுத்தும் அறிவிக்கப்பட்ட account பட்டியல்களைப் பயனரிடம் கோருவதற்குப் பதிலாக, runtime செயலாக்க நேரத்தில் எந்தப் பரிவர்த்தனைகள் ஒன்றுக்கொன்று சாராதவை என்பதை அனுமானிக்கிறது; இதன் மூலம் "பயனரிடமிருந்து எந்த input-உம் இல்லாமல் பரிவர்த்தனைகளை ஒரே நேரத்தில் செயல்படுத்த" முடிவதாக ஆவணம் விவரிக்கிறது ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Parallelism%20via%20Block,input%20from%20the%20user)).

**Sui-இன் object மாதிரி.** Object-ஐ மையமாகக் கொண்ட storage அடுக்கின் மூலம் Sui, Move-இன் resource கருத்தை மேலும் விரிவுபடுத்துகிறது: "Object என்பது வலையமைப்பில் storage-இன் அடிப்படை அலகு. ஆன்-செயினிலுள்ள ஒவ்வொரு resource, asset அல்லது தரவும் ஓர் object"; அவை account-இன் key-value store-இல் இருப்பதற்குப் பதிலாகத் தனிப்பட்ட ID மூலம் அணுகப்படுகின்றன ([Sui object மாதிரி](https://docs.sui.io/develop/sui-architecture/object-model)). Sui-இன் தற்போதைய object மாதிரி ஐந்து வகை ownership-களைப் பட்டியலிடுகிறது: **address-owned**, **immutable**, **consensus-address-owned** (party), **shared** மற்றும் **wrapped**. மாற்றக்கூடிய ஒவ்வொரு object input-உம் address-owned ஆகவும், மற்ற எல்லா object input-களும் immutable ஆகவும் இருந்தால் மட்டுமே ஒரு பரிவர்த்தனை consensus ordering இல்லாமல் Sui-இன் நேரடி fast path-ஐப் பயன்படுத்த முடியும். Consensus-address-owned மற்றும் shared object-கள், ஒரு பரிவர்த்தனை அவற்றைப் படிக்க மட்டும் செய்தாலும் consensus வழியாக வரிசைப்படுத்தப்படுகின்றன; இருப்பினும் ஒன்றுடன் ஒன்று முரண்படாத read-only அணுகல்கள் இன்னமும் ஒரே நேரத்தில் செயல்படலாம் ([Sui address-owned object-கள்](https://docs.sui.io/develop/objects/object-ownership/address-owned), [party object-கள்](https://docs.sui.io/develop/objects/object-ownership/party), [Lutris ஆய்வறிக்கை](https://docs.sui.io/paper/sui-lutris.pdf)). எனவே ஒன்றுக்கொன்று சாராத fast-path பரிவர்த்தனைகளை, ஒவ்வொரு object-ஐயும் உலகளவில் பகிரப்பட்ட state ஆகக் கருதாமல் ஒரே நேரத்தில் செயலாக்க முடியும்.

**தனித்துவமான வலிமை.** `copy` இல்லாமல் ஒரு மதிப்பை generic code நகலெடுப்பதையும், `drop` இல்லாமல் அது scope-ஐ விட்டு வெளியேறுவதையும் Move-இன் resource type-கள் தடுக்கின்றன. வரையறுக்கும் module இன்னமும் மதிப்புகளை mint செய்து, அவற்றை unpack செய்வதன் மூலம் வெளிப்படையாக அழிக்க முடியும். எனவே இந்தச் சோதனைகள் மட்டுமே asset conservation-ஐ நிரூபிப்பதோ ஒவ்வொரு asset-logic பிழையையும் ஒழிப்பதோ இல்லை. Aptos மற்றும் Sui இரண்டுமே இந்தப் பாதுகாப்பு மாதிரியுடன், பின்னர் சேர்க்கப்படாமல் தொடக்கத்திலிருந்தே வடிவமைக்கப்பட்ட இணைச் செயலாக்கத்தை இணைக்கின்றன.

---

## Portable-Bytecode VM-கள் (CosmWasm மற்றும் PolkaVM)

பிளாக்செயினுக்கெனத் தனியாக ஒரு bytecode-ஐ வரையறுப்பதற்குப் பதிலாக, சில சங்கிலிகள் எளிதில் மாற்றிப் பயன்படுத்தக்கூடிய பொது நோக்க instruction format-களைப் பயன்படுத்துகின்றன. **CosmWasm**, WebAssembly-ஐச் செயல்படுத்துகிறது; **PolkaVM**, RISC-V-இலிருந்து பெறப்பட்ட bytecode-ஐச் செயல்படுத்துகிறது. எனவே PolkaVM ஒரு WASM அடிப்படையிலான VM அல்ல. WebAssembly தரநிலை Wasm-ஐ, "stack அடிப்படையிலான மெய்நிகர் இயந்திரத்திற்கான binary instruction format" என்றும், "இயல்பான வேகத்தில் செயல்படுவதை நோக்கமாகக் கொண்ட", "நிரலாக்க மொழிகளுக்கான எளிதில் மாற்றிப் பயன்படுத்தக்கூடிய compilation target" என்றும் விவரிக்கிறது ([webassembly.org](https://webassembly.org/#:~:text=WebAssembly%20(abbreviated%20Wasm)%20is%20a,wide%20range%20of%20platforms)). Wasm-ஐ contract VM ஆகப் பயன்படுத்துவதால், Wasm compiler target கொண்ட எந்த மொழியாலும்—Rust, C, C++, Go—கொள்கையளவில் deploy செய்யக்கூடிய contract-ஐ உருவாக்க முடியும்.

**CosmWasm.** Cosmos சூழலமைப்பில் ஆதிக்கம் செலுத்தும் Wasm அடிப்படையிலான smart contract platform ஆன CosmWasm, தன்னை "multi-chain உலகிற்கான பாதுகாப்பான, செயல்திறன் மிக்க, ஒன்றோடொன்று இயங்கக்கூடிய smart contract platform" என்று விவரிக்கிறது ([cosmwasm.com](https://www.cosmwasm.com/#:~:text=Secure%2C%20performant%2C%20interoperable%20smart%20contract,platform%20for%20the%20multi%2Dchain%20world)). Contract-கள் **Rust**-இல் எழுதப்பட்டு, "மிகவும் மேம்படுத்தப்பட்ட Web Assembly runtime"-இல் இயங்குகின்றன ([cosmwasm.com](https://www.cosmwasm.com/#:~:text=highly%20optimized%20Web%20Assembly%20runtime)). Osmosis, Neutron, Injective, Secret Network மற்றும் Terra உள்ளிட்ட பல டஜன் Cosmos SDK சங்கிலிகளில் CosmWasm பயன்படுத்தப்படுகிறது; Cosmos-இன் சொந்த IBC cross-chain messaging-ஐ அது பெறுகிறது.

**PolkaVM.** Polkadot-இன் புதிய smart-contract VM வேறொரு பாதையைத் தேர்ந்தெடுத்தது: raw Wasm-ஐச் செயல்படுத்துவதற்குப் பதிலாக, அதன் சொந்த repository விளக்கத்தின்படி, "பொது நோக்க user-level RISC-V அடிப்படையிலான மெய்நிகர் இயந்திரம்" ஆக Parity, PolkaVM-ஐ உருவாக்கியது ([github.com/paritytech/polkavm](https://github.com/paritytech/polkavm#:~:text=PolkaVM%20is%20a%20general%20purpose,level%20RISC%2DV%20based%20virtual%20machine)). Ink! smart-contract ஆவணத்தின்படி, இதற்கான காரணம் செயல்திறன்: RISC-V செயலாக்கம் "பரிவர்த்தனைச் செயல்திறன் மற்றும் பரிவர்த்தனைச் செலவுகளுடன் தொடர்புடையது"; எனவே ink! முன்பு பயன்படுத்திய Wasm interpreter-ஐவிட வேகமான, மலிவான செயலாக்கத்தை வழங்குகிறது ([use.ink](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/#:~:text=performance%20correlates%20with%20transaction%20throughput)). குறிப்பிடத்தக்க வகையில், Polkadot-இன் PolkaVM stack ("Revive" என்று brand செய்யப்பட்டது) ஓர் EVM interpreter அடுக்கையும் வழங்குகிறது; இதனால் அதே RISC-V backend-இல் Solidity contract-கள் இயங்க முடியும்.

**தனித்துவமான வலிமை.** Portable-bytecode VM-கள், பிளாக்செயினுக்கெனத் தனியாக உருவாக்கப்பட்ட bytecode-க்குப் பதிலாக நிலைபெற்ற பொது நோக்க compilation target-களைத் தேர்ந்தெடுக்கின்றன. குறிப்பாக Rust, contract code-க்கு வலுவான memory-safety உத்தரவாதங்களை வழங்குகிறது; Wasm மற்றும் RISC-V இரண்டுமே மிகப் பெரிய, பிளாக்செயினுக்கு அப்பாற்பட்ட பயன்பாடுகளுக்காக உருவாக்கப்பட்ட tooling-இன் பயனைப் பெறுகின்றன. CosmWasm மற்றும் PolkaVM தனித்தனி architecture-களாகவே உள்ளன: முந்தையது Wasm-ஐச் செயல்படுத்துகிறது; பிந்தையது RISC-V-இலிருந்து பெறப்பட்ட bytecode-ஐச் செயல்படுத்துகிறது.

---

## CairoVM (Starknet)

**Cairo** என்பது zero-knowledge proof உருவாக்கத்திற்காகவே உருவாக்கப்பட்ட smart contract மொழியும் VM-உம்; இது Ethereum [லேயர் 2](/ta/glossary/layer-2/) ஆன **Starknet**-இன் அடித்தளமாக உள்ளது. வடிவமைப்பின் நோக்கத்தை Starknet-இன் சொந்த ஆவணம் தெளிவாகக் குறிப்பிடுகிறது: "Cairo என்பது எந்தக் கணக்கீட்டிற்கும் validity proof-களை உருவாக்கக்கூடிய STARK-க்கு உகந்த Von Neumann architecture" ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Cairo%20is%20a%20STARK,for%20arbitrary%20computations)). "STARK-க்கு உகந்தது" என்பது, "மற்ற proof system backend-களுடன் இணக்கமாக இருந்தாலும், STARK proof system-க்காக instruction set மேம்படுத்தப்பட்டுள்ளது" என்று பொருள் ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Being%20STARK,other%20proof%20system%20backends))—முதலில் செயலாக்கத்திற்காக வடிவமைக்கப்பட்டு, பின்னர் அளவிடுவதற்கான proof system-கள் இணைக்கப்பட்ட EVM அல்லது SVM-இன் முன்னுரிமைக்கு நேரெதிரானது இது.

**செயலாக்க மாதிரி.** Cairo, algebraic intermediate representation-களின் தொகுப்பாக வரையறுக்கப்பட்ட Turing-complete instruction set-க்கு ("Cairo machine") compile செய்யப்படுகிறது. இதனால் எந்த Cairo program-இன் execution trace-ஐயும், Ethereum L1-இல் சரிபார்க்கக்கூடிய சுருக்கமான STARK proof ஆக மாற்ற முடியும் ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=At%20its%20core%2C%20Cairo%20is,arbitrary%20code%29%20through%20the%20Cairo%20machine)). ஒவ்வொரு பரிவர்த்தனையையும் மீண்டும் இயக்குவதற்குப் பதிலாக, Starknet ஆயிரக்கணக்கான பரிவர்த்தனைகளை ஆஃப்-செயினில் தொகுத்து, அவற்றின் சரியான தன்மைக்கான ஒரே சுருக்கமான proof-ஐ Ethereum-இல் பதிவிட இதுவே உதவுகிறது.

**தனித்துவமான வலிமை.** Proof உருவாக்க ஏற்ற தன்மையே Cairo-வின் தொடக்க வடிவமைப்புக் கட்டுப்பாடாக இருந்தது: அதன் instruction set-உம் execution trace-உம் திறமையான STARK proof உருவாக்கத்திற்காக வடிவமைக்கப்பட்டுள்ளன. எனினும் உண்மையான proof உருவாக்கச் செலவு program, prover செயலாக்கம், proof-system parameter-கள், ஒப்பிடப்படும் இலக்கு ஆகியவற்றைப் பொறுத்தது; எனவே ஒவ்வொரு zkEVM workload-ஐவிடவும் அது எப்போதும் குறைவானது அல்ல. இதன் சமரசமாக, Ethereum-இலிருந்து வரும் developer-களுக்கு Solidity-ஐவிடப் புதிய, சிறிய மொழிச் சூழலமைப்பும் கடினமான கற்றல் வளைவும் உள்ளன.

---

## ஒப்பீட்டு அட்டவணை

| VM | Contract மொழி(கள்) | செயலாக்க / state மாதிரி | இணைச் செயலாக்கம் | சூழலமைப்பின் அளவு | EVM-compatible |
|---|---|---|---|---|---|
| **EVM** | Solidity, Vyper | Stack machine; Merkle Patricia trie-இல் account/storage state | இல்லை—ஒரு block-இல் வரிசையாக | மிகப்பெரியது; L2-களுக்கும் app-chain-களுக்கும் இயல்புநிலை target | Native |
| **SVM (Solana)** | Rust, C, C++ | BPF-இலிருந்து பெறப்பட்ட bytecode; அறிவிக்கப்பட்ட read/write தொகுப்புகளுடன் account அடிப்படையிலான state | ஆம்—ஒன்றுடன் ஒன்று ஒட்டாத பரிவர்த்தனைகளை Sealevel ஒரே நேரத்தில் schedule செய்கிறது | பெரியது, வேகமாக வளர்கிறது, பெரும்பாலும் Solana-வைச் சார்ந்தது | இல்லை (தனி சூழலமைப்பு) |
| **MoveVM (Aptos/Sui)** | Move | Resource type கொண்ட object-கள்; Aptos, Block-STM-ஐப் பயன்படுத்துகிறது; Sui, நேரடி மற்றும் consensus வரிசைப்படுத்தப்பட்ட பாதைகளுடன் பல ownership வடிவங்களைப் பயன்படுத்துகிறது | ஆம்—runtime-இல் அனுமானிக்கப்படுகிறது (Aptos) அல்லது object ownership வழியாக (Sui) | சிறியது, வளர்கிறது; இரண்டு சுயாதீன Move சூழலமைப்புகள் | இல்லை |
| **Portable bytecode (CosmWasm, PolkaVM)** | Rust (CosmWasm); Rust/C/RISC-V toolchain-கள் (PolkaVM) | Wasm bytecode (CosmWasm) அல்லது RISC-V bytecode (PolkaVM) | சங்கிலியைப் பொறுத்தது; எந்த instruction format-இன் பொதுவான பண்பும் அல்ல | நடுத்தரம்; பல Cosmos சங்கிலிகளிலும் Polkadot parachain தொகுப்பிலும் பரவியுள்ளது | PolkaVM/Revive ஓர் EVM interpreter அடுக்கைச் சேர்க்கிறது; CosmWasm, EVM-compatible அல்ல |
| **CairoVM (Starknet)** | Cairo | STARK proof உருவாக்கத்திற்காக வடிவமைக்கப்பட்ட Turing-complete AIR அடிப்படையிலான இயந்திரம் | முதன்மை வடிவமைப்பு நோக்கம் அல்ல—இணைச் செயலாக்கத்திற்குப் பதிலாக proof உருவாக்க ஏற்றதாக மேம்படுத்தப்பட்டுள்ளது | ஐந்தில் மிகச் சிறியது; ஆனால் Starknet-இன் L2 செயல்பாட்டுடன் வளர்கிறது | இல்லை (zkEVM திட்டங்கள் Solidity contract-களைத் தனியாக bridge செய்கின்றன) |

---

## டோக்கனாக்கப்பட்ட டொமைன்களுடன் இது எவ்வாறு தொடர்புபடுகிறது

ஒரு சங்கிலி எந்த VM-இல் இயங்குகிறது என்பது [டோக்கனைஸ் செய்யப்பட்ட டொமைன்](/ta/glossary/tokenized-domain/) உட்கட்டமைப்புக்கு நேரடியாக முக்கியமானது. [NFT](/ta/glossary/nft/) ஆகப் பிரதிநிதித்துவப்படுத்தப்படும் டொமைன், அடிப்படையில் ஒரு token-ஐ யார் சொந்தமாக வைத்திருக்கிறார், அதை வைத்து என்ன செய்யலாம் என்பதை நடைமுறைப்படுத்தும் smart contract. Resource-களை நகலெடுப்பதிலும் மறைமுகமாகக் கைவிடுவதிலும் Move விதிக்கும் compile-time கட்டுப்பாடுகள் அந்த logic-க்குப் பயனளிக்கின்றன; EVM-இன் முதிர்ச்சியடைந்த tooling, அதைத் தணிக்கை செய்வதையும் ஏற்கெனவே உள்ள wallet-களுடனும் marketplace-களுடனும் ஒருங்கிணைப்பதையும் எளிதாக்குகிறது. Namefi-இன் tokenization மாதிரி திட்டமிட்டே EVM சூழலமைப்பைக் குறிவைக்கிறது: EVM compatibility இருப்பதால், டோக்கனைஸ் செய்யப்பட்ட `.com` அல்லது `.ai` டொமைனின் ownership NFT, ஒவ்வொரு புதிய VM-க்கும் தனிப்பயன் ஒருங்கிணைப்பு தேவைப்படாமல், ஏற்கெனவே உள்ள EVM wallet-கள், marketplace-கள், DeFi protocol-கள் அனைத்துடனும் நேரடியாகச் செயல்படுகிறது. டோக்கனைஸ் செய்யப்பட்ட டொமைன்களை [namefi.io](https://namefi.io)-வில் ஆராயுங்கள்.

---

## ஆதாரங்களும் மேலதிக வாசிப்பும்

- [Ethereum மெய்நிகர் இயந்திரம் (EVM) — ethereum.org](https://ethereum.org/en/developers/docs/evm/)
- [Smart Contract மொழிகள் — ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/)
- [Sealevel — ஆயிரக்கணக்கான Smart Contract-களின் இணைச் செயலாக்கம் — Solana](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts)
- [Move — Aptos ஆவணம்](https://aptos.dev/en/network/blockchain/move)
- [Move Ability-கள் — Aptos ஆவணம்](https://aptos.dev/en/build/smart-contracts/book/abilities)
- [Struct-களும் Enum-களும் — Move Book](https://aptos-labs.github.io/move-book/structs-and-enums.html)
- [Object மாதிரி — Sui ஆவணம்](https://docs.sui.io/develop/sui-architecture/object-model)
- [Address-Owned Object-கள் — Sui ஆவணம்](https://docs.sui.io/develop/objects/object-ownership/address-owned)
- [Party Object-கள் — Sui ஆவணம்](https://docs.sui.io/develop/objects/object-ownership/party)
- [Sui Lutris](https://docs.sui.io/paper/sui-lutris.pdf)
- [CosmWasm](https://www.cosmwasm.com/)
- [PolkaVM — GitHub (paritytech)](https://github.com/paritytech/polkavm)
- [Smart Contract-களுக்கு RISC-V மற்றும் PolkaVM ஏன்? — ink! ஆவணம்](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/)
- [Cairo Architecture — The Cairo Programming Language / Starknet](https://www.starknet.io/cairo-book/ch201-architecture.html)
- [WebAssembly](https://webassembly.org/)
