<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>

# Get Popular collections

This API is used to get trading data of popular collections.

<RequestParamsWrapper>

### Request address

<RequestTag>GET</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/runes/get-hot-collection`

### Request param

| **Parameter**   | **Type** | **Required** | **Description**                                                           |
|-----------------|----------|--------------|---------------------------------------------------------------------------|
| timeType           | Integer   | No          | Returns data for N projects, sorted by transaction volume in the specified time range. Enum values: 1. 24h 2. 7d 3. 30d 4. all Defaults to 24h if not provided. |
| cursor | String   | No          | Cursor for pagination, default is empty.      |
| limit         | Integer   | No          | Page size for query results, default is 10.                                                           |

</RequestParamsWrapper>

<ResponseParamsWrapper>

### Response parameters

| **Parameter**     | **Type** | **Description**                                                                                       |
|-------------------|----------|-------------------------------------------------------------------------------------------------------|
| cusor              | String   | Cursor for pagination                                                                                 |
| runesId           | String   | runeid                                                                            |
| name          | String   | Rune name                                                                          |
| spaceName             | String   | Rune name with dots                           |
| maxMintNumber   | String   | Maximum mint number                  |
| mintedNumber | String   | Minted number                |
| limitPerMint      | String   | Limit per mint |
| deployedTime        | Long   | Deployment time                                          |
| startBlock    |  String   | Start block          |
| endBlock        |  String   | End block                  |
| symbol | String | Symbol |
| divisibility | Integer | Precision |
| collectionUrl | String | OKX collection link |
| totalVolume | String | Transaction volume in BTC and USD |
| usdTotalVolume | String | Transaction volume in USD |
| marketCap | String | Market cap in BTC |
| usdMarketCap | String | Market cap in USD
| floorprice | String | Floor price in Sats |
| usdFloorPrice | String | Floor price in USD |
| holders | Integer | Number of holders |
| salesCount | Integer | Number of sales |
| volumeGains | String | Transaction volume growth |

</ResponseParamsWrapper>

</ParamsWrapper>

<CodeExampleWrapper>

### Request example

<RequestCodeExampleWrapper>

  <RequestCodeExample language="shell">
    ```shell
    curl --location 'https://web3.okx.com/api/v5/mktplace/nft/runes/get-hot-collection?timeType=2&cursor=Mg%3D%3D' \
    --header 'OK-ACCESS-PASSPHRASE: xxxxxx' \
    --header 'OK-ACCESS-KEY: xxxx' \
    ```
  </RequestCodeExample>

</RequestCodeExampleWrapper>

### Response example

<ResponseCodeExampleWrapper>

  <ResponseCodeExample codeStatus='200'>
  ```json
    {
      "code":0,
      "data":{
      "items":[
    {
      "collectionUrl":"https://web3.okx.com/web3/marketplace/runes/token/DOG•GO•TO•THE•MOON/840000:3",
      "deployedTime":1713571767,
      "divisibility":5,
      "marketData":{
      "floorPrice":"10.6509577683",
      "holders":72903,
      "marketCap":"10651.030343051788712385",
      "salesCount":35436,
      "totalVolume":"1124.64783456999999",
      "usdFloorPrice":"0.006598097922137557",
      "usdMarketCap":"659814288.103509427870310934",
      "usdTotalVolume":"69670133.915076187380516"
    },
      "maxMintNumber":"100000000000",
      "mintedNumber":"100000000000",
      "name":"DOG•GO•TO•THE•MOON",
      "runesId":"840000:3",
      "spaceName":"DOGGOTOTHEMOON",
      "startBlock":840000,
      "symbol":"🐕"
    }
      ],
      "cursor":""
    },
      "msg":""
    }
  ```
  </ResponseCodeExample>

</ResponseCodeExampleWrapper>

</CodeExampleWrapper>

</ApiLayout>
