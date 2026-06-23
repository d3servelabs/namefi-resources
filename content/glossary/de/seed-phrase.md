---
title: 'Seed-Phrase (Wiederherstellungsphrase)'
date: '2026-05-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Eine Liste von 12 oder 24 Wörtern, die den Master-Schlüssel einer Wallet kodiert; wer sie besitzt, kontrolliert die Wallet, weshalb sie das Einzige ist, das unbedingt gesichert werden muss.
keywords: ['Seed-Phrase', 'Wiederherstellungsphrase', 'Mnemonic-Phrase', 'Wallet-Backup', 'BIP39', '12 Wörter', '24 Wörter', 'Krypto-Wiederherstellung']
level: 1
sources:
  - https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
---

Eine **Seed-Phrase** – auch **Wiederherstellungsphrase** oder **Mnemonic-Phrase** genannt – ist eine menschenlesbare Liste von 12 oder 24 Wörtern, die den Master-Private-Key einer [Wallet](/de/glossary/wallet/) kodiert. Das Format ist durch [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) standardisiert und wird von den meisten modernen Wallets verwendet (MetaMask, Ledger, Trezor, Rabby, Coinbase Wallet usw.). Mit der Seed-Phrase können Sie die Wallet – und alle darin enthaltenen Assets, einschließlich [tokenisierter Domains](/de/blog/what-are-tokenized-domains/) – auf jedem kompatiblen Gerät wiederherstellen. Ohne sie bedeutet der Verlust des Gerätezugangs in der Regel dauerhaft verlorene Mittel, da es keine zentrale Instanz gibt, die ein „Passwort zurücksetzen" ausstellen kann. Best Practices: Schreiben Sie die Seed-Phrase auf Papier oder ein Metallbackup, bewahren Sie mindestens zwei Kopien an getrennten physischen Orten auf, und tippen Sie sie **niemals** in einen Computer, ein Cloud-Dokument, einen Passwort-Manager mit Cloud-Verbindung, einen Chat oder einen KI-Assistenten ein. Lesen Sie [Eine tokenisierte Domain nach Wallet-Verlust wiederherstellen](/de/blog/recovering-a-tokenized-domain-after-wallet-loss/) als vollständige Betriebsanleitung.
