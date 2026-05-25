<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>

# Get sale activity

This API is used to get the transaction data under the collection (latest transaction price, quantity), supporting retrieving specific project transaction events by runesId.

<RequestParamsWrapper>

### Request address

<RequestTag>GET</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/runes/trade-history`

### Request parameter

| **Parameter**   | **Type** | **Required** | **Description**                                                           |
|-----------------|----------|--------------|---------------------------------------------------------------------------|
| runesIds | String | No | Unique token identifier; if multiple, separate by commas (,) with a maximum of 20. An empty string will query the transaction history of all tokens. |
| cursor | String | No | Cursor pointing to the sorting sequence to retrieve |
| limit | Integer | No | Pagination size (default value 10, maximum 100). Returns the maximum number of transaction histories |
| startTime | Long | No | Start time of the transaction activity (in seconds) |
| endTime | Long | No | End time of the transaction activity (in seconds) |

</RequestParamsWrapper>

<ResponseParamsWrapper>

### Response parameter

| **Parameter**     | **Type** | **Description**                                                                                       |
|-------------------|----------|-------------------------------------------------------------------------------------------------------|
| runesId | String | runesId |
| name | String | Token name |
| txHash | String	| Transaction hash |
| typeName | String |	Activity type name (SALE, TRANSFER, etc.) |
| amount | String | Token amount |
| from | String |	From address |
| to | String | To address |
| createOn | Date | Creation time |
| platformName | Long | Platform name |
| currency | String | Total price - currency |
| currencyUrl | String | Total price - currency URL |
| satPrice | BigDecimal | Total price in sat |
| price | BigDecimal | Total price in BTC |
| usdPrice | BigDecimal | Total price in USD |
| currency | String | Unit price - currency |
| currencyUrl | String | Unit price - currency URL |
| satPrice | BigDecimal | Unit price in sat |
| price | BigDecimal | Unit price in BTC |
| usdPrice | BigDecimal | Unit price in USD |
| status | Integer | Status (1: Success, 2: Pending) |

</ResponseParamsWrapper>

</ParamsWrapper>

<CodeExampleWrapper>

### Request example

<RequestCodeExampleWrapper>

<RequestCodeExample language="shell">
  ```shell
  curl --location --request GET 'https://beta.okex.org/api/v5/mktplace/nft/runes/trade-history?runesIds=840000:3&type=SALE&startTime=1713604337&endTime=1713607937' \
  --header 'OK-ACCESS-KEY: XXXX' \
  --header 'OK-ACCESS-PASSPHRASE: XXXX'
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
    "activityList": [
  {
    "amount": "3360",
    "createOn": 1714398184000,
    "from": "bc1p0a9xxqvh7c4l3xzcxuhdmsntlau69jnzu79jau20fza8676lfwmqnyy393",
    "name": "RSIC•GENESIS•RUNE",
    "platformName": "OKX",
    "runesId": "840000:28",
    "status": 1,
    "to": "bc1pnhukwhm2vmgsepkfxjyccgv2l0h2nu4fq0dchxdlkjpssmt2k45qkvnqjr",
    "totalPrice": {
    "currency": "BTC",
    "currencyUrl": "https://static.coinall.ltd/cdn/nft/4834651a-7c4e-4249-91c1-cf680af39dc0.png",
    "price": "0.00079968",
    "satPrice": "79968",
    "usdPrice": "49.54137552"
  },
    "txHash": "6ef9a11965cd8771a383f6447a5cdf438832368c86a46fa465aee1cd59cc4ad7",
    "typeName": "SALE",
    "unitPrice": {
    "currency": "BTC",
    "currencyUrl": "https://static.coinall.ltd/cdn/nft/4834651a-7c4e-4249-91c1-cf680af39dc0.png",
    "price": "0.000000238",
    "satPrice": "23.8",
    "usdPrice": "0.014744457"
  }
  }
    ],
    "cursor": "MTMyMjM3MTEwNTQyMzM2MTE=",
    "hasNext": true
  },
    "msg": ""
  }
  ```
</ResponseCodeExample>

</ResponseCodeExampleWrapper>

</CodeExampleWrapper>

</ApiLayout>
