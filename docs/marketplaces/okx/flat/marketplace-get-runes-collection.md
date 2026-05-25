<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>

# Get Runes collection

This API is used to get runes information, including the number of holders, collection link, transaction volume, number of transactions, and floor price.

<RequestParamsWrapper>

### Request address

<RequestTag>GET</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/runes/detail`

### Request param

| **Parameter**   | **Type** | **Required** | **Description**                                                           |
|-----------------|----------|--------------|---------------------------------------------------------------------------|
| runesId         | String   | Yes          | runesId, supports batch queries, separated by ',', e.g., 840000:3,840000:28 |

</RequestParamsWrapper>

<ResponseParamsWrapper>

### Response param

| **Parameter**     | **Type** | **Description**                                                                                       |
|-------------------|----------|-------------------------------------------------------------------------------------------------------|
| runesId           | String   | runeid                                                                                                |
| name              | String   |  Name of the rune                                                                          |
| spacename	          | String   | Rune name with dots                                                                           |
| maxMintNumber	             | String   | Maximum mint number                         |
| mintedNumber	   | String   | Minted number                    |
| limitPerMint	 | String   | Limit per mint                  |
| deployedTime	      | Long   | Deployment time |
| startBlock	        | String   | Start block                                          |
| endBlock	    | String   | End block           |
| symbol	        | String   | Symbol                   |
| divisibility | Integer | Precision                  |
| collectionUrl | String | OKX collection link        |
| totalVolume | String | Total volume in BTC |
| usdTotalVolume | String | Total volume in USD |
| marketCap | String | Market cap in BTC       |
| usdMarketCap | String | Market cap in USD    |
| floorprice | String  | Floor price in Sats   |
| usdFloorPrice | String | Floor price in USD  |
| holders     | Integer | Number of holders |
| salesCount  | Integer | Number of sales   |

</ResponseParamsWrapper>

</ParamsWrapper>

<CodeExampleWrapper>

### Request example

<RequestCodeExampleWrapper>

<RequestCodeExample language="shell">
  ```shell
  curl --location 'https://web3.okx.com/api/v5/mktplace/nft/runes/detail?runesId=840000%3A3%2C840000%3A28' \
  --header 'OK-ACCESS-PASSPHRASE: xxx' \
  --header 'OK-ACCESS-KEY: xxx' \
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
    "collectionUrl": "https://web3.okx.com/web3/marketplace/runes/token/DOG•GO•TO•THE•MOON/840000:3",
    "deployedTime": 1713571767,
    "divisibility": 5,
    "marketData": {
    "floorPrice": "10.6509577683",
    "holders": 72903,
    "marketCap": "10651.030343051788712385",
    "salesCount": 35436,
    "totalVolume": "1124.64783456999999",
    "usdFloorPrice": "0.006598097922137557",
    "usdMarketCap": "659814288.103509427870310934",
    "usdTotalVolume": "69670133.915076187380516"
  },
    "maxMintNumber": "100000000000",
    "mintedNumber": "100000000000",
    "name": "DOG•GO•TO•THE•MOON",
    "runesId": "840000:3",
    "spaceName": "DOGGOTOTHEMOON",
    "startBlock": 840000,
    "symbol": "🐕"
  }
    ],
    "msg": ""
  }
  ```
</ResponseCodeExample>

</ResponseCodeExampleWrapper>

</CodeExampleWrapper>

</ApiLayout>
