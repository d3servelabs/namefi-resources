# Introduction

Welcome to the developers' documentation for the OKX NFT Marketplace, a one-stop decentralized NFT aggregated exchange platform that supports multi-chain NFT creations and cross-platform transactions. OKX NFT Marketplace provides real-time on-chain data for users and developers, and is dedicated to building a decentralized multi-chain NFT ecosystem.

## NFT aggregator

OKX NFT Marketplace combines the order book depth from multiple mainstream marketplaces and platforms to provide up-to-date order data for developers and users. OKX Marketplace also includes abundant NFT collection data, and supports real-time and accurate on-chain data. Marketplaces that support aggregation are OKX NFT, Opensea, Magic Eden, Looksrare, IMX, and X2Y2.

OKX NFT Marketplace allows NFT holders to list their NFTs on multiple platforms simultaneously with the least of efforts and the best liquidity. Marketplaces that support listings are OKX NFT, Opensea, Looksrare, and Magic Eden.

OKX NFT Marketplace supports ETH, OKTC, BSC, Polygon, IMX, AVAX-C, Solana, Arbitrum One, zkSync Era, Aptos, Optimism, Klaytn, Arbitrum Nova, Base and Linea. We also plan to support NFT aggregated transactions on more chains.

## Issuance Marketplace & Secondary Marketplace

Issuance Marketplace: OKX NFT's exclusive primary issuance platform selects high-quality NFT projects for completely decentralized offerings, allowing users to obtain their preferred NFT at lower prices in the issuance market as soon as possible.

Secondary Marketplace: OKX NFT Marketplace lets users conduct peer-to-peer transactions and helps both buyers and sellers seek the best price. OKX is dedicated to providing users with an efficient and low-cost NFT trading experience with high liquidity.


## Contract architecture

### Overview


![contract-overview-uml](../images/contract-overview-uml.jpg)

#### Features that EVM contract supports

- Batch purchasing
- Collection offers
- Listing
- Offer functions
- Instant royalties for the creator
- ERC-2981 royalties support

#### Features that Solana contract supports

- Batch purchasing
- Listing
- Instant royalties for the creator

### OKX NFT Marketplace contract
Users authorize the OKX secondary market to authorize ```union approve``` contract to use tokens (this step is not required for native tokens)

Users then call the OKX ```Aggregator``` contract interface to interact with the OKX secondary market, such as making bids or listing orders


### OKX NFT aggregator contract
Develop ```Adapter``` contracts for different markets

Register ```Adapter``` contracts to ```Market Registry``` contracts

OKX ```Aggregator``` contracts are linked to different markets via ```Adapter``` contracts; for instance, OKX ```Aggregator``` contracts interact with ```OpenSea``` markets via ```OpenSea Adapter``` contracts

<br/>
<br/>

![contract-architecture-image](../images/contract-architecture-img.jpg)




## How to start

Go to [NFT Market](https://web3.okx.com/web3/marketplace/nft) to begin your NFT journey.

[//]: # (![nft-wallet]&#40;./images/nft-wallet.png&#41;)

Go to the marketplace and choose NFTs to bid or purchase directly. Visit your profile to view your NFT assets and begin trading.

[//]: # (![nft-asset]&#40;./images/nft-asset.png&#41;)

If you are a digital artist, you are welcome to make your own NFT on our Create NFT page.

[//]: # (![nft-create]&#40;./images/nft-create.png&#41;)



## Deployed contract

### OKX NFT aggregator contract

| **Number** | **Network**   | **Contract address**                       |
|------------|---------------|--------------------------------------------|
| 1          | Ethereum      | 0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c |
| 2          | OKTC          | 0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c |
| 3          | BNB Chain     | 0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c |
| 4          | Polygon       | 0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c |
| 5          | Avalanche-C   | 0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c |
| 6          | Arbitrum One  | 0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c |
| 7          | Arbitrum Nova | 0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c |
| 8          | zkSync Era    | 0x444b2Fd4395Ec890fbC492753DCe1bE2fC8Ff63D |
| 9          | Optimism      | 0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c |
| 10         | Klaytn        | 0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c |
| 11         | Base          | 0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c |
| 12         | Linea         | 0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c |
| 13         | opBNB         | 0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c |
| 14         | Polygon zkEVM | 0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c |

### OKX self-operated marketplace contract


| **Number** | **Network**   | **Contract address**                       |
|------------|---------------|--------------------------------------------|
| 1          | Ethereum      | 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC |
| 2          | OKTC          | 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC |
| 3          | BNB Chain     | 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC |
| 4          | Polygon       | 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC |
| 5          | Avalanche-C   | 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC |
| 6          | Arbitrum One  | 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC |
| 7          | Arbitrum Nova | 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC |
| 8          | zkSync Era    | 0xd756E8070b33a35E42f00140Ac92c4b4e0bBfb82 |
| 9          | Optimism      | 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC |
| 10         | Klaytn        | 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC |
| 11         | Base          | 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC |
| 12         | Linea         | 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC |
| 13         | opBNB         | 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC |
| 14         | Polygon zkEVM | 0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC |

