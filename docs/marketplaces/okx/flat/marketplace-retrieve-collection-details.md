{/* api-page */}

<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>

# Retrieve collection details

This interface is used to retrieve more information about individual collections, including real-time statistics such as floor prices.

<RequestParamsWrapper>

### Request address

<RequestTag>GET</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/collection/detail`

### Request param

| **Parameter** | **Type** | **Required** | **Description**                                                    |
|---------------|----------|--------------|--------------------------------------------------------------------|
| slug          | String   | Yes          | Collection slug, which is the unique identifier of the collection |

</RequestParamsWrapper>

<ResponseParamsWrapper>

### Response param

| **Parameter**   | **Type** | **Description**                                                                                                                                                                                                        |
|-----------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| name            | String   | Collection name                                                                                                                                                                                                        |
| des             | String   | Collection description                                                                                                                                                                                                 |
| image           | String   | Collection logo URL                                                                                                                                                                                                    |
| backgroundImage | String   | Collection background image URL                                                                                                                                                                                        |
| slug            | String   | Collection slug, which is the unique identifier of the collection                                                                                                                                                      |
| certificateFlag | Boolean  | Collection certification flag                                                                                                                                                                                          |
| officialWebsite | String   | Collection official website                                                                                                                                                                                            |
| instagramUrl    | String   | The Instagram URL of the collection                                                                                                                                                                                    |
| discordUrl      | String   | The Discord URL of the collection                                                                                                                                                                                      |
| mediumUrl       | String   | The Medium URL of the collection                                                                                                                                                                                       |
| twitterUrl      | String   | The Twitter URL of the collection                                                                                                                                                                                      |
| categoryList    | Array    | The category list of the collection                                                                                                                                                                                    |
| assetContracts  | Array    | An array of the [asset contract model](./marketplace-collection-model#asset-contract-model) that are associated with this collection, including the contract address, the protocol standard, the owner address, and whether the ERC-2981 protocol is supported, etc. |
| stats           | Object   | A dictionary containing some statistics related to this collection, including the trade volume and the floor prices. An object of the [collection stats model](./marketplace-collection-model#collection-stats-model)                                        |

</ResponseParamsWrapper>

</ParamsWrapper>

<CodeExampleWrapper>

### Request example

<RequestCodeExampleWrapper>

  <RequestCodeExample language="shell">
    ```shell
    curl -X GET "https://web3.okx.com/api/v5/mktplace/nft/collection/detail" \
      -H 'OK-ACCESS-KEY: XXX' \
      -H 'OK-ACCESS-TIMESTAMP: XXX' \
      -H 'OK-ACCESS-PASSPHRASE: XXX' \
      -H 'OK-ACCESS-SIGN: XXX' \
      -d "slug=xxx"
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
        "cursor": "NA==",
        "data": [
        {
          "assetContracts": [
            {
              "chain": "Ethereum",
              "contractAddress": "0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7",
              "erc2981": false,
              "ownerAddress": "0xf296178d553c8ec21a2fbd2c5dda8ca9ac905a00",
              "tokenStandard": "erc721"
            }
          ],
          "backgroundImage": "https://static.coinall.ltd/cdn/nft/files/collection/8000-background.png",
          "categoryList": [],
          "certificateFlag": true,
          "des": "Loot is randomized adventurer gear generated and stored on chain. Stats, images, and other functionality are intentionally omitted for others to interpret. Feel free to use Loot in any way you want.",
          "discordUrl": "",
          "image": "https://static.coinall.ltd/cdn/nft/78d10ba9-63fc-4104-a13c-73e51ac2acb6.jpg",
          "instagramUrl": "",
          "mediumUrl": "",
          "name": "Loot (for Adventurers)",
          "officialWebsite": "https://lootproject.com",
          "slug": "loot-for-adventurers",
          "stats": {
            "floorPrice": "866.74799",
            "latestPrice": "616.4433",
            "ownerCount": "2522",
            "totalCount": "7779",
            "totalVolume": "552505219.5371664"
          },
          "twitterUrl": ""
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
