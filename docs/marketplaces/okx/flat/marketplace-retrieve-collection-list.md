{/* api-page */}

<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>

# Retrieve collection list

This interface provides a list of all the collections supported and vetted by OKX.

To get the collection list of the specified chain, set the ```chain``` field in the request parameter.

<RequestParamsWrapper>

### Request address

<RequestTag>GET</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/collection/list`

### Request param

| **Parameter** | **Type** | **Required** | **Description**                                                                                          |
|---------------|----------|--------------|----------------------------------------------------------------------------------------------------------|
| chain         | String   | No           | Chain name refer to [Supported blockchains](./marketplace-supported-blockchains) for details                               |
| cursor        | String   | No           | For pagination; a cursor pointing to the page to retrieve                                            |
| limit         | String   | No           | For pagination; the maximum number of collections to return; the default value is 2, and the max is 300 |

</RequestParamsWrapper>

<ResponseParamsWrapper>

### Response param

Array of objects of the [collection model](./marketplace-collection-model.html#collection-model)

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
| assetContracts  | Array    | An array of the [asset contract model](./marketplace-collection-model#asset-contract-model) that are associated with this collection, including contract address, protocol standard, owner address, whether the ERC-2981 protocol is supported, etc. |
| stats           | Object   | A dictionary containing some statistics related to this collection, including trade volume and floor prices, an object of the [collection stats model](./marketplace-collection-model#collection-stats-model)                                        |

</ResponseParamsWrapper>

</ParamsWrapper>

<CodeExampleWrapper>

### Request example

<RequestCodeExampleWrapper>

  <RequestCodeExample language="shell">
    ```shell
    curl -X GET "https://web3.okx.com/api/v5/mktplace/nft/collection/list" \
      -H 'OK-ACCESS-KEY: XXX' \
      -H 'OK-ACCESS-TIMESTAMP: XXX' \
      -H 'OK-ACCESS-PASSPHRASE: XXX' \
      -H 'OK-ACCESS-SIGN: XXX' \
      -d "chain=eth" \
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
      "data": [
        {
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
          "categoryList": ["Collectibles"],
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
        }
      ],
      "msg": ""
    }
    ```
  </ResponseCodeExample>

</ResponseCodeExampleWrapper>

</CodeExampleWrapper>

</ApiLayout>
