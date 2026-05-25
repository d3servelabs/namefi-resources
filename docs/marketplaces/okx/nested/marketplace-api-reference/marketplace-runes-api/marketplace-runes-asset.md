
<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>

# Get asset for an address

This API is used to get rune assets under a specific address.
<RequestParamsWrapper>

### Request address

<RequestTag>GET</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/runes/get-owned-asserts`

### Request param

| **Parameter**   | **Type** | **Required** | **Description**                                                           |
|-----------------|----------|--------------|---------------------------------------------------------------------------|
| runesId | String | Yes | Unique token identifier |
| walletAddresses | String | Yes | Wallet address(es), separated by commas (,) if multiple; up to 20 wallet addresses |
| cursor | String | No | Cursor pointing to the sorting sequence to retrieve (maximum 1,000) |
| limit | Integer | No | Pagination size (default value 10, maximum 100). Returns the maximum number of entries |

</RequestParamsWrapper>

<ResponseParamsWrapper>

### Response param

| **Parameter**     | **Type** | **Description**                                                                                       |
|-------------------|----------|-------------------------------------------------------------------------------------------------------|
| assetId | String | id (DB primary key, no actual meaning) |
| tickerType | Integer | Token type (4-Runes) |
| ticker | String | Token name |
| tickerId | String | Token id |
| ownerAddress | String | Wallet address |
| amount | String | XRC20 amount in the UTXO |
| chain | Integer | Chain |
| inscriptionNum | String	| Inscription number |
| utxoTxHash | String | Transaction hash |
| utxoVout | Integer | utxoVout |
| utxoValue | String | utxoValue |
| txHash | String | Transaction hash |
| name | String | Token name |
| tickerIcon | String | Token icon link |
| status | Integer | Listing status (0-unlisted, 1-listed, 2-pending) |
| listTime | Long | Listing time |
| orderId | Long | Order id |
| confirmations | Long | Block height information |
| currency | String | Total price - currency |
| currencyUrl	String	Total price - currency URL |
| satPrice | BigDecimal | Total price in sat |
| price | BigDecimal | Total price in BTC |
| usdPrice | BigDecimal | Total price in USD |
| currency | String | Unit price - currency |
| currencyUrl | String | Unit price - currency URL |
| satPrice | BigDecimal | Unit price in sat |
| price | BigDecimal | Unit price in BTC |
| usdPrice | BigDecimal | Unit price in USD |
| unavailable | Integer | 1 - UTXO contains multiple Atomicals assets; 2 - UTXO contains multiple protocol assets |
| symbol | String | Symbol |

</ResponseParamsWrapper>

</ParamsWrapper>

<CodeExampleWrapper>

### Request example

<RequestCodeExampleWrapper>

<RequestCodeExample language="shell">
  ```shell
  curl --location --request GET 'https://beta.okex.org/api/v5/mktplace/nft/runes/get-owned-asserts?runesId=840000:3&walletAddresses=bc1p3fj806enwnmz04444mpm42ykgdcta9p5mvzx46hp8wmg2knpwxpq0k46x9&limit=10' \
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
    "cursor": "1",
    "items": [
  {
    "amount": "500000",
    "assetId": "28912795273673038",
    "chain": 0,
    "confirmations": null,
    "inscriptionNum": "",
    "listTime": 1714399069,
    "name": "DOG•GO•TO•THE•MOON",
    "orderId": 201296,
    "ownerAddress": "bc1p3fj806enwnmz04444mpm42ykgdcta9p5mvzx46hp8wmg2knpwxpq0k46x9",
    "status": 1,
    "symbol": "🐕",
    "ticker": "DOG•GO•TO•THE•MOON",
    "tickerIcon": "https://static.coinall.ltd/cdn/web3/currency/token/1714125941761.png/type=png_350_0",
    "tickerId": "840000:3",
    "tickerType": 4,
    "totalPrice": {
    "currency": "BTC",
    "currencyUrl": "https://static.coinall.ltd/cdn/nft/4834651a-7c4e-4249-91c1-cf680af39dc0.png",
    "price": "0.031895",
    "satPrice": "3189500",
    "usdPrice": "1979.7003235"
  },
    "txHash": "",
    "unavailable": null,
    "unitPrice": {
    "currency": "BTC",
    "currencyUrl": "https://static.coinall.ltd/cdn/nft/4834651a-7c4e-4249-91c1-cf680af39dc0.png",
    "price": "0.00000006379",
    "satPrice": "6.379",
    "usdPrice": "0.003959400647"
  },
    "utxoTxHash": "ce302f5c946ff3ef502eade58405d64b545d59de9fcd731314b88ddadf709ca6",
    "utxoValue": "546",
    "utxoVout": 2
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
