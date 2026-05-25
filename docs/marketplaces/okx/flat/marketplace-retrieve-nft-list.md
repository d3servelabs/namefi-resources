{/* api-page */}

<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>

# Retrieve NFT list

This endpoint provides a list of NFTs for a specific chain and the contract address supported and vetted by OKX.

<RequestParamsWrapper>

### Request address

<RequestTag>GET</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/asset/list`

### Request param

| **Parameter**   | **Type** | **Required** | **Description**                                                                                        |
|-----------------|----------|--------------|--------------------------------------------------------------------------------------------------------|
| chain           | String   | Yes          | Chain name refer to [Supported blockchains](./marketplace-supported-blockchains) for details                            |
| contractAddress | String   | Yes          | Collection contract address, which must be a valid one                                   |
| cursor          | String   | No           | For pagination. A cursor pointing to the page to retrieve.                                             |
| limit           | String   | No           | For pagination. The maximum number of collections to return. The default value is 300. The maximum value is 300. |

</RequestParamsWrapper>

<ResponseParamsWrapper>

### Response param

An array of objects of the [NFT Model](./marketplace-nft-model.html#nft-model)

| **Parameter**     | **Type** | **Description**                                                                                       |
|-------------------|----------|-------------------------------------------------------------------------------------------------------|
| name              | String   | The name of the NFT                                                                                 |
| tokenId           | String   | The token ID of the NFT                                                                             |
| tokenUri          | String   | The address where NFT MetaData is stored                                                                         |
| image             | String   | An image of the item; note that this is the cached URL we store on our end                          |
| imagePreviewUrl   | String   | A preview image of the item; note that this is the cached URL we store on our end                    |
| imageThumbnailUrl | String   | A thumbnail image of the item; note that this is the cached URL we store on our end                |
| animationUrl      | String   | A link to animation resource URL for the item; note that this is the cached URL we store on our end |
| attributes        | Object   | An object of the token [attributes model](./marketplace-nft-model#attributes-model)                                          |
| assetContracts    | Object   | An object of the token [asset contract model](./marketplace-collection-model#asset-contract-model)           |
| collection        | Object   | An object of the token [collection model](./marketplace-collection-model#collection-model)                   |

</ResponseParamsWrapper>

</ParamsWrapper>

<CodeExampleWrapper>

### Request example

<RequestCodeExampleWrapper>

  <RequestCodeExample language="shell">
    ```shell
    curl -X GET "https://web3.okx.com/api/v5/mktplace/nft/asset/list" \
      -H 'OK-ACCESS-KEY: XXX' \
      -H 'OK-ACCESS-TIMESTAMP: XXX' \
      -H 'OK-ACCESS-PASSPHRASE: XXX' \
      -H 'OK-ACCESS-SIGN: XXX' \
      -d "chain=xxx" \
      -d "contractAddress=xxx"
    ```
  </RequestCodeExample>

</RequestCodeExampleWrapper>

### Response example

<ResponseCodeExampleWrapper>

  <ResponseCodeExample codeStatus='200'>
  ```json
  {
    "code": 0,
    "data": [
    {
      "animationUrl": "",
      "assetContract": {
        "chain": "Ethereum",
        "contractAddress": "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
        "erc2981": false,
        "ownerAddress": "0xaba7161a7fb69c88e16ed9f455ce62b791ee4d03",
        "tokenStandard": "erc721"
      },
      "attributes": "[{\"trait_type\":\"Background\",\"value\":\"Gray\"},{\"trait_type\":\"Fur\",\"value\":\"Dark Brown\"},{\"trait_type\":\"Hat\",\"value\":\"Laurel Wreath\"},{\"trait_type\":\"Mouth\",\"value\":\"Bored Unshaven Cigarette\"},{\"trait_type\":\"Clothes\",\"value\":\"Smoking Jacket\"},{\"trait_type\":\"Eyes\",\"value\":\"Bloodshot\"}]",
      "collection": {
        "assetContracts": [
          {
            "chain": "Ethereum",
            "contractAddress": "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
            "erc2981": false,
            "ownerAddress": "0xaba7161a7fb69c88e16ed9f455ce62b791ee4d03",
            "tokenStandard": "erc721"
          }
        ],
        "backgroundImage": "https://static.coinall.ltd/cdn/nft/files/collection/205-background.png",
        "categoryList": [
          "Collectibles"
        ],
        "certificateFlag": true,
        "des": "The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs— unique digital collectibles living on the Ethereum blockchain. Your Bored Ape doubles as your Yacht Club membership card, and grants access to members-only benefits, the first of which is access to THE BATHROOM, a collaborative graffiti board. Future areas and perks can be unlocked by the community through roadmap activation. Visit www.BoredApeYachtClub.com for more details.",
        "discordUrl": "https://discord.gg/3P5K3dzgdB",
        "image": "https://static.coinall.ltd/cdn/nft/d962ef0d-1cc1-4333-b19f-fc19c7322335.jpg",
        "instagramUrl": "",
        "mediumUrl": "",
        "name": "Bored Ape Yacht Club",
        "officialWebsite": "http://www.boredapeyachtclub.com/",
        "slug": "bored-ape-yacht-club",
        "stats": {
          "floorPrice": "105752.05",
          "latestPrice": "102662.45",
          "ownerCount": "5666",
          "totalCount": "10000",
          "totalVolume": "2239291136.375853"
        },
        "twitterUrl": "https://twitter.com/BoredApeYC"
      },
      "image": "https://static.coinall.ltd/cdn/nft/files/8e8fd651-40cd-46e0-8e81-9d670f61e25b.webp",
      "imagePreviewUrl": "https://static.coinall.ltd/cdn/nft/files/8e8fd651-40cd-46e0-8e81-9d670f61e25b.webp/type=list",
      "imageThumbnailUrl": "https://static.coinall.ltd/cdn/nft/files/8e8fd651-40cd-46e0-8e81-9d670f61e25b.webp/type=detail",
      "name": "Bored Ape Yacht Club #11",
      "tokenId": "11",
      "tokenUri": "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/11"
    }
    ],
    "msg": ""
  }
  ```
  </ResponseCodeExample>

</ResponseCodeExampleWrapper>

</CodeExampleWrapper>

</ApiLayout>
