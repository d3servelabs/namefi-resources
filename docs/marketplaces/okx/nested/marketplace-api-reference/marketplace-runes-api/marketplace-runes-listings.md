<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>

# Get Runes listing

This API is used to get listings on OKX Runes, supporting retrieving specific collection listing information by runesId.

<RequestParamsWrapper>

### Request address

<RequestTag>GET</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/runes/get-runes-order-list`

### Request parameters

| **Parameter**   | **Type** | **Required** | **Description**                                                           |
|-----------------|----------|--------------|---------------------------------------------------------------------------|
| runesId           | String   | Yes          | runesId, the unique identifier for the runes token |
| cursor | String   | No          | Cursor pointing to the sorting sequence to retrieve (maximum 1,000)      |
| limit         | Integer   | No          | Pagination size (default value 10, maximum 100). Returns the maximum number of orders |
| sortBy | String | No | Order sorting rule, default is ascending unit price (unitPriceAsc). Sorting enum: unitPriceAsc, unitPriceDesc, totalPriceAsc, totalPriceDesc, listedTimeAsc, listedTimeDesc |

</RequestParamsWrapper>

<ResponseParamsWrapper>

### Response parameters

| **Parameter**     | **Type** | **Description**                                                                                       |
|-------------------|----------|-------------------------------------------------------------------------------------------------------|
| assetId              | Integer   | id (DB primary key, no actual meaning)                                                                                  |
| tickerType           | String   | Token type (4-Runes)                                     |
| ticker          | Integer   | Token name                                                                           |
| tickerId             | String   | Token id                           |
| ownerAddress   | String   | Wallet address                  |
| amount | String   | XRC20 amount in the UTXO                 |
| chain      | Integer   | Chain |
| inscriptionNum        | String   |Inscription number                                        |
| utxoTxHash	| String | Transaction hash |
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
| currencyUrl | String | Total price - currency URL |
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
  curl --location --request GET 'https://beta.okex.org/api/v5/mktplace/nft/runes/get-runes-order-list?runesId=840000:3' \
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
                "amount": "889806",
                "assetId": "28734126488062286",
                "chain": 0,
                "confirmations": null,
                "inscriptionNum": "",
                "listTime": 1714398972,
                "name": "DOG•GO•TO•THE•MOON",
                "orderId": 201268,
                "ownerAddress": "bc1pxav32udnt0062dlvmjn7tp3qneamudpg492t7qmxsu7m73ldd7uq768q8p",
                "status": 1,
                "symbol": "🐕",
                "ticker": "DOG•GO•TO•THE•MOON",
                "tickerIcon": "https://static.coinall.ltd/cdn/web3/currency/token/1714125941761.png/type=png_350_0",
                "tickerId": "840000:3",
                "tickerType": 4,
                "totalPrice": {
                    "currency": "BTC",
                    "currencyUrl": "https://static.coinall.ltd/cdn/nft/4834651a-7c4e-4249-91c1-cf680af39dc0.png",
                    "price": "0.05472306",
                    "satPrice": "5472306",
                    "usdPrice": "3388.298650632"
                },
                "txHash": "",
                "unavailable": null,
                "unitPrice": {
                    "currency": "BTC",
                    "currencyUrl": "https://static.coinall.ltd/cdn/nft/4834651a-7c4e-4249-91c1-cf680af39dc0.png",
                    "price": "0.0000000615",
                    "satPrice": "6.15",
                    "usdPrice": "0.0038079078"
                },
                "utxoTxHash": "80efaeffcbf70be91579afb631e45cd28df75b0883f45525d1bb6b04b21969f3",
                "utxoValue": "546",
                "utxoVout": 1015
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
