<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>

# Get collection transaction history

This API is used to get NFT sales history information such as collectionAddress, platform, price, buyer and seller.

<RequestParamsWrapper>

### Request address

<RequestTag>GET</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/markets/trades`

### Request param

| **Parameter**   | **Type** | **Required** | **Description**                                                           |
|-----------------|----------|--------------|---------------------------------------------------------------------------|
| chain | Yes | String | Chain name refer to [Supported blockchains](./marketplace-supported-blockchains) for details. |
| collectionAddress |Yes | String | The unique collection address of the transaction history to query for. |
| platform | No | String | For supported platforms, refer to [Integrated markets](./marketplace-integrated-markets). If this is empty, it will query all platforms. |
| limit | No | String | The number of records displayed per page ranges from 1 to 50. If the input value exceeds 50 or is not provided, it will default to 50. |
| cursor | No | String | The cursor for pagination of the records. |
| startTime | No | String | The starting time range of the sale history record you want to query from. |
| endTime | No | String | The end time range of the sale history record you want to query from. |

</RequestParamsWrapper>

<ResponseParamsWrapper>

### Response param

| **Parameter**     | **Type** | **Description**                                                                                       |
|-------------------|----------|-------------------------------------------------------------------------------------------------------|
| cursor | String | The cursor for pagination.  Use this cursor as input for the next query. |
| amount | Integer | The number of nft being transacted in this transaction history. |
| chain | String | Chain name refer to [Supported blockchains](./marketplace-supported-blockchains) for details. |
| collectionAddress | String | The unique collection address of the transaction history to query for. |
| currencyAddress | String | Payment token address of this transaction. |
| from | String | The seller. |
| to | String | The buyer. |
| platform | String | For supported platforms, refer to [Integrated markets](./marketplace-integrated-markets). |
| price | BigDecimal | The unit price of each NFT. |
| timestamp | Long | The time that of the transaction occured. |
| tokenId | String | The unique Token ID of the NFT. |
| txHash | String | The transaction hash of this record that is taken place. |

</ResponseParamsWrapper>

</ParamsWrapper>

<CodeExampleWrapper>

### Request example

<RequestCodeExampleWrapper>

<RequestCodeExample language="shell">
  ```shell
  curl --location 'https://beta.okex.org/api/v5/mktplace/nft/markets/trades?chain=ethereum&collectionAddress=0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d' \
  --header 'OK-ACCESS-KEY: your api access key' \
  --header 'OK-ACCESS-PASSPHRASE: your api passphrase' \
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
    "cursor": "MTcxOTk0NDQ0NzoweDRiYjNhZjY1MDQwOTdkMjBkY2QxMzAxZDg0NTdjOGVkNzEzMzQ3OGY2NjFiODdhN2M4YzdlNTk4OTIxMjcwNDktMTU4",
    "data": [
  {
    "amount": 1,
    "chain": "Ethereum",
    "collectionAddress": "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
    "currencyAddress": "0x0000000000000000000000000000000000000000",
    "from": "0xf15c93562bc3944a68e938ef75d2a3360d98ca57",
    "platform": "Blur",
    "price": 9.71,
    "timestamp": 1720113467,
    "to": "0xeb0abe3e9f38fc74ed900f118744275af3a99618",
    "tokenId": "4382",
    "txHash": "0x11b30e98235053d2749a41249db60c895ca8bac1942b526a993f3c4be058a0b4"
  },
  {
    "amount": 1,
    "chain": "Ethereum",
    "collectionAddress": "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
    "currencyAddress": "0x0000000000a39bb272e79075ade125fd351887ac",
    "from": "0x29469395eaf6f95920e59f858042f0e28d98a20b",
    "platform": "Blur",
    "price": 9.45,
    "timestamp": 1720110203,
    "to": "0x0f2bbce1fcb6702a4d9ab30e5c68868f82af3d41",
    "tokenId": "3854",
    "txHash": "0xe34400d02d0330cd7b4cbbdd3d2d2e458e4fd702ef768ab6de73591bc2060906"
  }
    ],
    "next": true,
    "total": 10000
  },
    "msg": ""
  }
  ```
</ResponseCodeExample>

</ResponseCodeExampleWrapper>

</CodeExampleWrapper>

</ApiLayout>
