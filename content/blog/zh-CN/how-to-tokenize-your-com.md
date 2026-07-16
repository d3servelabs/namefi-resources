---
title: "如何代币化您的 .com 域名：分步指南（2026）"
date: '2026-05-22'
language: zh-CN
tags: ['guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
description: "一份实用的分步讲解指南，教您如何将已拥有的域名进行代币化——涵盖资格要求、钱包、费用、时间以及每个页面的预期情况。专为域名所有者而非协议极客编写。"
keywords: ['如何代币化域名', '如何代币化.com', '代币化我的域名', '代币化现有域名', '分步代币化域名', '域名代币化教程', '代币化.com指南', '代币化.xyz', '代币化.io', 'namefi代币化', 'NFT域名教程', '将域名转移为NFT', '域名转NFT', '域名代币化流程', '代币化域名设置', '代币化ICANN域名']
relatedArticles:
  - /zh-CN/blog/tokenize-your-com-to-flip-it/
  - /zh-CN/blog/how-to-sell-a-domain-name-you-own/
  - /zh-CN/blog/dns-on-tokenized-domains/
  - /zh-CN/blog/how-tokenized-marketplaces-replace-escrow/
  - /zh-CN/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /zh-CN/topics/domain-tokenization/
  - /zh-CN/topics/domain-investing/
relatedSeries:
  - /zh-CN/series/tokenize-your-com/
  - /zh-CN/series/domain-flipping-skills/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/web3/
---

假设您拥有一个域名——可能是 `mybrand.com`，也可能是一批 `.xyz` 域名组合——并且您已经决定要将其**代币化**（tokenize）。本指南将逐屏详细介绍实际的操作流程，以便您在开始之前规划好所需的时间、资金和访问权限。

如果您还在犹豫*为什么*要代币化，请先阅读[为什么要在链上代币化域名？](/zh-CN/blog/why-tokenize-domains/)。如果您甚至不确定代币化*是*什么意思，请从[什么是代币化域名？](/zh-CN/blog/what-are-tokenized-domains/)开始了解。

本文假定您已经决定要进行代币化操作。

---

## 开始之前：60秒检查清单

在点击任何按钮之前，确保满足以下条件会让您的操作过程顺畅得多：

- **您在当前的[注册商](/zh-CN/glossary/registrar/)处拥有该域名的控制权。** 您可以登录账户、更改域名服务器（nameservers），并批准转移 / 提取[转移密码（auth codes）](/zh-CN/glossary/auth-code/)。
- **您拥有一个自托管[钱包](/zh-CN/glossary/wallet/)。** 比如 MetaMask、Rabby、Coinbase Wallet 或任何标准的 EVM 钱包。请确保您确实掌握了[助记词（seed phrase）](/zh-CN/glossary/seed-phrase/)——而不仅仅是一个交易所账户。
- **钱包里有少量的[Gas费](/zh-CN/glossary/gas/)。** 几美元的 ETH 或 Base ETH 即可覆盖[链上](/zh-CN/glossary/on-chain/)[铸造](/zh-CN/glossary/minting/)交易的费用。您不需要准备太多。
- **该域名未被锁定、未面临过期，且未处于转移过程中。** 如果域名在近 60 天内进行过[跨注册商转移](/zh-CN/glossary/cross-registrar-transfer/)，或者距离到期不到 30 天，通常是无法转移的。请先确认清楚。
- **您有足够的时间。** 准备好大约 30 分钟的专注操作时间，外加长达 5-7 天的跨注册商转移后台处理时间。

如果其中任何一项不太确定，请在开始之前解决它。这个过程需要的是耐心，而不是意外。

---

## 第 1 步：在 namefi.io 连接您的钱包

前往 [namefi.io](https://namefi.io) 并点击“Connect Wallet”（连接钱包）。在您的钱包中批准连接请求。该钱包将成为[代币化域名](/zh-CN/glossary/tokenized-domain/)的**所有者**——NFT 将存放在这里，谁持有这个钱包，谁就拥有这个域名。

> **请务必重视这一点。** 如果您丢失了这个钱包，您就会失去域名在链上的控制权。我们有一份单独的指南介绍[如何在钱包丢失后恢复代币化域名](/zh-CN/blog/recovering-a-tokenized-domain-after-wallet-loss/)——请现在就阅读它，不要等以后再说。

---

## 第 2 步：添加您想要代币化的域名

在您的 Namefi 仪表板中，搜索或添加您已经拥有的域名。Namefi 将检查其资格条件——它当前所在的[注册商](/zh-CN/glossary/registrar/)、是否处于锁定状态、是否符合 [ICANN](/zh-CN/glossary/icann/) 的转移规则，以及是否支持该[顶级域名（TLD）](/zh-CN/glossary/tld/)。

您将看到以下三种状态之一：

- **现在符合条件（Eligible now）。** 请继续进行第 3 步。
- **需等待后符合条件（Eligible after a wait）。** 通常意味着近期的转移仍处于 ICANN 的 60 天限制期内。请等待该期限结束后再来。
- **不支持（Not supported）。** 某些 TLD 目前尚未支持。请查看支持的 TLD 列表，或联系客服支持。

---

## 第 3 步：选择代币化路径

Namefi 通常会根据域名当前的注册商提供几种路径：

1. **转入后代币化（Transfer-in then tokenize）。** 将域名转移至 Namefi 的认证注册商合作伙伴，然后铸造链上代币。这是最常见的路径。由于 ICANN 的转移流程规定，这需要几天时间，但这与[区块链](/zh-CN/glossary/blockchain/)层面的操作无关。
2. **原地代币化（In-place tokenize，如果支持）。** 对于某些集成了该功能的注册商，域名无需转移，直接在原处添加链上层。这种方式更快，但仅限于特定的合作注册商。

您将看到适用于您域名的具体路径。仪表板会提前显示预计操作时间以及相关费用。

---

## 第 4 步：确认转移密码 / 批准转移（如需要）

对于转入路径，您需要从当前的注册商处获取[**转移密码（auth code）**](/zh-CN/glossary/auth-code/)（有时称为 EPP 代码），并将其粘贴到 Namefi 中。您可能还需要：

- 在您当前的注册商处解锁域名。
- 批准发送给[注册人](/zh-CN/glossary/registrant/)联系邮箱的确认邮件。

这是整个流程中最耗时的一步。请预留 5-7 天的时间让跨注册商转移完成，尽管实际上通常会更快。

---

## 第 5 步：铸造链上代币

一旦域名归属到 Namefi 的注册商集成下，系统将提示您**铸造（mint）**代表该域名的 [NFT](/zh-CN/glossary/nft/)（标准的 [ERC-721](/zh-CN/glossary/erc-721/) 代币）。您的钱包会弹出提示；您确认交易；支付 [Gas 费](/zh-CN/glossary/gas/)；随后代币会存入您的钱包。

此时，该域名正式完成[*代币化*](/zh-CN/glossary/tokenize/)。您现在拥有：

- 传统的 [DNS](/zh-CN/glossary/dns/) / 注册商记录（依然真实有效，且受 ICANN 认可）。
- 位于您钱包中的、代表所有权的[链上](/zh-CN/glossary/on-chain/) NFT。

往后，这两者将由协议保持自动同步。

---

## 第 6 步：在您的钱包和区块浏览器中进行验证

打开钱包的 NFT 选项卡。您应该能看到这个新的代币化域名 NFT。点击进入区块浏览器（如 Etherscan、Basescan 等）以确认合约及所有权地址。现在是个为自己的记录截屏保存的好时机。

如果您有[硬件钱包](/zh-CN/glossary/hardware-wallet/)，此时是将 NFT 转移进去的绝佳时机。这只是一次普通的 NFT 转移操作，同样需要消耗 Gas 费。

---

## 第 7 步：管理 DNS 与续费

代币化域名并不会改变其解析方式。您的域名服务器（nameservers）、A 记录、MX 记录、[DNSSEC](/zh-CN/glossary/dnssec/)——所有这些都将继续正常工作。您可以在 Namefi 仪表板中管理这些设置，或者像以前一样委派给您现有的 DNS 提供商（如 Cloudflare、Route53 等）。

有关 DNS 层发生了什么变化（以及未发生的变化）的详细信息，请参阅[DNS 依然有效：代币化域名上的域名服务器、电子邮件和 DNSSEC](/zh-CN/blog/dns-on-tokenized-domains/)。

续费操作依然在注册商层面进行。Namefi 负责处理注册商一侧的账单；您则继续保留链上的所有权。

---

## 费用预期

您大致需要为以下三项付费：

- **注册商费用。** 正常的域名年度续费价格，加上任何转入费用。无论是否进行代币化，这些都是实际生活中必须承担的成本。
- **Gas 费。** 铸造交易所需的一小笔费用（几美元），具体取决于使用的是哪条链（Base 链通常比[以太坊](/zh-CN/glossary/ethereum/) L1 更便宜）。
- **协议费。** Namefi 收取的代币化服务费。这些费用会在您最终确认之前明明白白地显示在仪表板上。

这里没有任何隐藏的意外费用。如果在确认屏幕上没有出现的数字，就不会收费。

---

## 常见问题与阻碍

- **“我的注册商不释放转移密码。”** 有些注册商将其隐藏在用户界面的深处，或者要求提交支持工单（ticket）。请保持耐心并坚持不懈。
- **“我已经解锁了域名，但系统仍然显示处于锁定状态。”** 注册商通常会将锁定状态缓存长达 24 小时。等一天再刷新试试。
- **“我的钱包显示了 NFT，但域名似乎仍在我的旧注册商处。”** 在转移的过渡期内，两边可能会短暂地同时显示所有权。转移最终落定后，将以链上状态为权威基准。
- **“我想使用[多签钱包](/zh-CN/glossary/multi-sig/)作为所有者。”** 这是支持的。只需连接该多签钱包即可。但请确保您确实可以从中执行交易——如果您丢失了多签钱包的签名者权限，也就等于丢失了这个域名。背景阅读：[多签钱包真的能提高安全性吗？](/zh-CN/blog/do-multisig-wallets-actually-improve-security/)

---

## 友情免责声明（请务必阅读！）

> 我们不是律师、会计师、财务顾问或医生——**本文中的任何内容均不构成法律、财务、税务、会计、医疗或任何其他形式的专业建议。** 我们撰写这些文章是为了自我学习，同时也为了方便我们的客户。这里的信息可能已经过时、具有地域局限性，或者纯粹就是错的——毕竟我们也会犯错。
>
> 针对任何重大决策，**请咨询真正的专业人士（认真的！）**。或者，如果您不想这么做，可以问问朋友、Twitter、Reddit、AI 或算命先生。简而言之：**DOYR —— 自己做好研究（Do Your Own Research）**。让我们共同学习，享受乐趣。

---

## 总结

- 对您已拥有的域名进行代币化是一个有指引的互动过程，大约需要 30 分钟的时间，外加注册商端最长一周的等待时间。
- 您需要具备：该域名的控制权、一个自托管钱包、少量的 Gas 费，以及耐心。
- 链上铸造是*最后*一步；绝大部分的工作其实是枯燥的注册商转移流程，这是 ICANN 强制要求的，与区块链本身无关。
- 代币化之后，您将拥有**两个同步的所有权层级**——传统的 DNS 记录和钱包中的 NFT。
- 请在代币化*之前*阅读[钱包丢失恢复指南](/zh-CN/blog/recovering-a-tokenized-domain-after-wallet-loss/)，而不是之后。

准备好开始了吗？请前往 [namefi.io](https://namefi.io)。