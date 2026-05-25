{/* api-page */}

<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>

# Retrieve asset list

This interface provides personal assets queries including the token details, the collection details of the token, the contract details of the token, and the token's attributes.

<RequestParamsWrapper>

### Request address

<RequestTag>GET</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/owner/asset-list`

### Request param

| **Parameter**   | **Type** | **Required** | **Description**                                                                                        |
|-----------------|----------|--------------|--------------------------------------------------------------------------------------------------------|
| chain           | String   | Yes          | Chain name refer to [Supported blockchains](../../linked-resources/marketplace-supported-blockchains.md) for details                              |
| contractAddress | String   | No           | Contract address, which must be a valid one                                   |
| ownerAddress    | String   | Yes          | Owner address, which must be a valid contract address                                                 |
| cursor          | String   | No           | For pagination. A cursor pointing to the page to retrieve.                                             |
| limit           | String   | No           | For pagination. The maximum number of collections to return. The default value is 10. The maximum value is 100. |

</RequestParamsWrapper>

<ResponseParamsWrapper>

### Response param

An object of the [Asset Model](../marketplace-models/marketplace-asset-model.md#asset-model)

| **Parameter**     | **Type** | **Description**                                                                                       |
|-------------------|----------|-------------------------------------------------------------------------------------------------------|
| name              | String   | The name of the NFT                                                                                  |
| tokenId           | String   | The token ID of the NFT                                                                      |
| amount            | String  | Specified tokenId NFT's total supply                                                                              |
| tokenUri          | String   | NFT MetaData stored address                                                                        |
| image             | String   | An image of the item; note that this is the cached URL we store on our end                          |
| imagePreviewUrl   | String   | A preview image of the item; note that this is the cached URL we store on our end                  |
| imageThumbnailUrl | String   | A thumbnail image of the item; note that this is the cached URL we store on our end                 |
| animationUrl      | String   | A link to animation resource URL for the item; note that this is the cached URL we store on our end |
| attributes        | Object   | An object of the token attributes Model.                                                              |
| assetContracts    | Object   | An object of the token [asset contract model](../marketplace-models/marketplace-collection-model.md#asset-contract-model)           |
| collection        | Object   | An object of the token [collection model](../marketplace-models/marketplace-collection-model.md#collection-model)                   |
| ownerAddress      | String   | The address of the assets' owner                                                              |
| isLazyMintType    | Boolean  | If it is delayed minting and no transfer has occurred                                           |

</ResponseParamsWrapper>

</ParamsWrapper>

<CodeExampleWrapper>

### Request example

<RequestCodeExampleWrapper>

  <RequestCodeExample language="shell">
    ```shell
    curl -X GET "https://web3.okx.com/api/v5/mktplace/nft/owner/asset-list" \
      -H 'OK-ACCESS-KEY: XXX' \
      -H 'OK-ACCESS-TIMESTAMP: XXX' \
      -H 'OK-ACCESS-PASSPHRASE: XXX' \
      -H 'OK-ACCESS-SIGN: XXX' \
      -d "contractAddress=0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d" \
      -d "ownerAddress=0x46efbaedc92067e6d60e84ed6395099723252496" \
      -d "limit=1"
    ```
  </RequestCodeExample>
</RequestCodeExampleWrapper>

### Response example

<ResponseCodeExampleWrapper>

  <ResponseCodeExample codeStatus='200'>
    ```json
    {
      "code": 0,
      "data": {
        "cursor": "MzQ2MDQ4Mg==",
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
            "attributes": "[{\"trait_type\":\"Mouth\",\"value\":\"Grin\"},{\"trait_type\":\"Clothes\",\"value\":\"Vietnam Jacket\"},{\"trait_type\":\"Background\",\"value\":\"Orange\"},{\"trait_type\":\"Eyes\",\"value\":\"Blue Beams\"},{\"trait_type\":\"Fur\",\"value\":\"Robot\"}]",
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
                "floorPrice": "83119.7",
                "latestPrice": "104451.04",
                "ownerCount": "5703",
                "totalCount": "10000",
                "totalVolume": "2304507531.1537676"
              },
              "twitterUrl": "https://twitter.com/BoredApeYC"
            },
            "image": "https://static.coinall.ltd/cdn/nft/files/0acbff90-be06-4f4f-b7df-d951310735f2.webp",
            "imagePreviewUrl": "https://static.coinall.ltd/cdn/nft/files/0acbff90-be06-4f4f-b7df-d951310735f2.webp/type=list",
            "imageThumbnailUrl": "https://static.coinall.ltd/cdn/nft/files/0acbff90-be06-4f4f-b7df-d951310735f2.webp/type=detail",
            "isLazyMintType": false,
            "name": "Bored Ape Yacht Club #1",
            "ownerAddress": "0x46efbaedc92067e6d60e84ed6395099723252496",
            "tokenId": "1",
            "tokenUri": "ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1"
          }
        ]
      },
      "msg": ""
    }
    ```
  </ResponseCodeExample>

</ResponseCodeExampleWrapper>

</CodeExampleWrapper>

</ApiLayout>
