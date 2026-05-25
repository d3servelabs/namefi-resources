{/* api-page */}

<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>

# Query offer

This endpoint is used to fetch the set of active offers on a given NFT for the Seaport contract.

<RequestParamsWrapper>

### Request address

<RequestTag>GET</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/markets/offers`

### Request param

| **Parameter**     | **Type** | **Required** | **Description**                                                                                                                                                                                                                                                                 |
|-------------------|----------|--------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| chain             | String   | Yes          | Chain name refer to [Supported blockchains](./marketplace-supported-blockchains) for details |
| collectionAddress | String   | No           | Address of the contract for an NFT                                                                                                                                                                                                                                              |
| tokenId           | String   | No           | The token for an NFT                                                                                                                                                                                                                                                            |
| maker             | String   | No           | Filter by the order maker's wallet address                                                                                                                                                                                                                                       |
| createAfter       | String     | No           | Only show orders listed after this timestamp; seconds since the UNIX epoch                                                                                                                                                                                                     |
| createBefore      | String     | No           | Only show orders listed before this timestamp; seconds since the UNIX epoch                                                                                                                                                                                                    |
| updateAfter       | String     | No           | Only show orders updated after this timestamp; seconds since the UNIX epoch                                                                                                                                                             |
| updateBefore      | String     | No           | Only show orders updated before this timestamp; seconds since the UNIX epoch                                                                                                                                                                                                 |
| status            | String   | No           | Filter by the order status; the options are active, inactive, cancelled, and sold                                                                                                                                                                                           |
| sort              | String   | No           | How to sort the orders: can be create_time_desc for when they were made, or update_time_desc for when they were updated, or price_desc to see the highest-priced orders first or price_asc to see the lowest-priced orders first; the default sort is in positive order |
| limit             | String   | No           |Number of listings to retrieve; the default value is 50                                                                                                                                                                           |
| cursor            | String   | No           | A cursor to be supplied as a query param to retrieve a specified  page                                                                                                                                                                                                          |

</RequestParamsWrapper>

<ResponseParamsWrapper>

### Response param

An array of [OKX order model](./marketplace-order-model.html#okx-order-model)

| **Parameter**     | **Type** | **Description**                                                                        |
|-------------------|----------|----------------------------------------------------------------------------------------|
| orderId           | String   | ID of order                                                                           |
| createTime        | Long     | The date order was created                                                          |
| updateTime        | Long     | The date order was updated                                                          |
| listingTime       | Long     | The date order was listed                                                           |
| expirationTime    | Long     | The endTime indicates the block timestamp at which the order expires                 |
| status            | String   | The order status, includes active, cancelled, sold, and inactive                           |
| orderHash         | String   | The order hash                                                                         |
| protocolData      | String   | The parameters of order (JSON)                                                       |
| protocolAddress   | String   | The contract address for fulfilling the order                                          |
| chain             | String   | Chain name, includes ETH, Polygon, AVAX, BSC, OKTC, Arbitrum One, Optimism, Klaytn, and zkSync Era |
| maker             | String   | The wallet address initiating the order                                                |
| orderType         | String   | Offer indicates offer; BuyNow indicates listings                                       |
| price             | String   | Unit price of NFT for the order                                                        |
| currencyAddress   | String   | Address of the currency for paying the order                                           |
| collectionAddress | String   | Address of the contract for an NFT                                                     |
| tokenId           | String   | The token for an NFT                                                                   |
| amount            | String   | Count of NFT for the order                                                             |

</ResponseParamsWrapper>

</ParamsWrapper>

<CodeExampleWrapper>

### Request example

An array of [OKX Order Model](./marketplace-order-model.html#okx-order-model)

<RequestCodeExampleWrapper>

  <RequestCodeExample language="shell">
    ```shell
    curl -X GET "https://web3.okx.com/api/v5/mktplace/nft/markets/offers?{REQUEST PARAMS}" \
      -H 'OK-ACCESS-KEY: XXX' \
      -H 'OK-ACCESS-TIMESTAMP: XXX' \
      -H 'OK-ACCESS-PASSPHRASE: XXX' \
      -H 'OK-ACCESS-SIGN: XXX' \
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
        "cursor": "ODg0MjY2NDgz",
        "data": [
          {
            "amount": "1",
            "chain": "eth",
            "collectionAddress": "0x457efd33def0bff2dfe33089d385898d919d3a10",
            "createTime": 1680047938,
            "currencyAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            "expirationTime": 1680307118,
            "listingTime": 1680047927,
            "maker": "0x72fde15006cff1bfc1be596f03855a2c55b546e1",
            "orderHash": "0x48cc57480fdbe993821b6679910657845201351448bca623a6b7726fc1f7ff4b",
            "orderType": "Offer",
            "price": "110000",
            "protocolAddress": "0x90a77dd8ae0525e08b1c2930eb2eb650e78c6725",
            "protocolData": {
              "parameters": {
                "conduitKey": "0x618Cf13c76c1FFC2168fC47c98453dCc6134F5c8888888888888888888888888",
                "consideration": [
                  {
                    "endAmount": "1",
                    "identifierOrCriteria": "77735144008553370296572895450686144694166639583550383356598452408298996120723",
                    "itemType": 2,
                    "recipient": "0x72fde15006cff1bfc1be596f03855a2c55b546e1",
                    "startAmount": "1",
                    "token": "0x457efd33def0bff2dfe33089d385898d919d3a10"
                  }
                ],
                "counter": "0",
                "endTime": 1680307118,
                "offer": [
                  {
                    "endAmount": "110000",
                    "identifierOrCriteria": "0",
                    "itemType": 1,
                    "startAmount": "110000",
                    "token": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
                  }
                ],
                "offerer": "0x72fde15006cff1bfc1be596f03855a2c55b546e1",
                "orderType": 3,
                "salt": "1144075581",
                "startTime": 1680047927,
                "totalOriginalConsiderationItems": 1,
                "zone": "0x868B0635A8858dB9D984B5A27559f961Fd2736c0",
                "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
              },
              "signature": "0xa413e6e3496fcd8bc28af88d4e1f2db4ccb7b524763ba6d87a56b15b20510d5d1eb782121c96ed61e2b68d537e03f96c51b37e0c325d03ad035091bf1933d4b81b"
            },
            "status": "active",
            "tokenId": "77735144008553370296572895450686144694166639583550383356598452408298996120723",
            "updateTime": 1680047938
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
