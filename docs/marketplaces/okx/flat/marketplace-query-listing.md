{/* api-page */}

<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>
# Query listing

This endpoint is used to fetch the set of active listings on a given NFT for the Seaport contract.


<RequestParamsWrapper>

### Request address

<RequestTag>GET</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/markets/listings`

### Request param

| **Parameter**     | **Type** | **Required** | **Description**                                                                                                                                                            
|-------------------|----------|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| chain             | String   | Yes          | Chain name refer to [Supported blockchains](./marketplace-supported-blockchains) for details |
| collectionAddress | String   | No           | Address of the contract for an NFT                                                                                                                                                                                            |
| tokenId           | String   | No           | The token for an NFT                                                                                                                                                                                                          |
| maker             | String   | No           | Filter by the order makers wallet address                                                                                                                                                                                     |
| createAfter       | String     | No           | Only show orders listed after this timestamp; seconds since the UNIX epoch                                                                                                                                                 |
| createBefore      | String     | No           | Only show orders listed before this timestamp; seconds since the UNIX epoch                                                                                                      |
| updateAfter       | String     | No           | Only show orders updated before this timestamp; seconds since the UNIX epoch                                                                                                     |
| updateBefore      | String     | No           | Only show orders updated before this timestamp; seconds since the UNIX epoch                                                                                                     |
| status            | String   | No           | Filter by the order status; the options are active, inactive, cancelled, and sold                                                                                               |
| platform          | String   | No           | For supported platform, refer to [Integrated markets](./marketplace-integrated-markets)                                                                                                                    |
| sort              | String   | No           | How to sort the orders: can be create_time_desc for when they were made, or price_desc to see the highest-priced orders first or price_asc to see the lowest-priced orders first; the default sort is in positive order |
| limit             | String   | No           | Number of listings to retrieve. The default value is 50                                                                                                                                                                       |
| cursor            | String   | No           | A cursor to be supplied as a query param to retrieve a specified  page                                                                                                                                                        |

</RequestParamsWrapper>

<ResponseParamsWrapper>

### Response param

An array of [OKX order model](./marketplace-order-model.html#okx-order-model)

| **Parameter**     | **Type** | **Description**                                                                        |
|-------------------|----------|----------------------------------------------------------------------------------------|
| orderId           | String   | ID of order                                                                           |
| createTime        | Long     | The date order was created                                                           |
| updateTime        | Long     | The date order was updated                                                           |
| listingTime       | Long     | The date order was listed                                                           |
| expirationTime    | Long     | The endTime indicates the block timestamp at which the order expires                  |
| status            | String   | The order status, includes active, cancelled, sold, and inactive                           |
| orderHash         | String   | The order hash                                                                         |
| protocolData      | String   | The parameters of order (JSON)                                                       |
| protocolAddress   | String   | The contract address for fulfilling the order                                          |
| chain             | String   | Chain name refer to [Supported blockchains](./marketplace-supported-blockchains) for details |
| maker             | String   | The wallet address initiating the order                                               |
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
    curl -X GET "https://web3.okx.com/api/v5/mktplace/nft/markets/listings?{REQUEST PARAMS}" \
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
        "cursor": "NjE5MTQ0MTM5",
        "data": [
          {
            "amount": "1",
            "chain": "OKTC",
            "collectionAddress": "0xe4c0578279269c4f0265bc486c199509566fe863",
            "createTime": 1672828395,
            "updateTime": 1672828395,
            "status": "active",
            "currencyAddress": "0x382bb369d343125bfb2117af9c149795c6c65c50",
            "expirationTime": 1673433171,
            "listingTime": 1672828387,
            "maker": "0x5164370b3ba971474d10da1d409ce8872cb8ca97",
            "orderHash": "0x5bdaa259cb76ace593f3e631099319f955b48397482e7e4d45c008d985b61ade",
            "orderType": "BuyNow",
            "price": "1000000000000000",
            "protocolAddress": "0x34df5c035e31c0edfd104f3ea83d9548f108df56",
            "protocolData": {
              "parameters": {
                "conduitKey": "0x618Cf13c76c1FFC2168fC47c98453dCc6134F5c8888888888888888888888888",
                "consideration": [
                  {
                    "endAmount": "1000000000000000",
                    "identifierOrCriteria": "0",
                    "itemType": 1,
                    "recipient": "0x5164370b3ba971474d10da1d409ce8872cb8ca97",
                    "startAmount": "1000000000000000",
                    "token": "0x382bb369d343125bfb2117af9c149795c6c65c50"
                  }
                ],
                "counter": 0,
                "endTime": 1673433171,
                "offer": [
                  {
                    "endAmount": "1",
                    "identifierOrCriteria": "17230",
                    "itemType": 2,
                    "startAmount": "1",
                    "token": "0xe4c0578279269c4f0265bc486c199509566fe863"
                  }
                ],
                "offerer": "0x5164370b3ba971474d10da1d409ce8872cb8ca97",
                "orderType": 2,
                "salt": "27454607645473204",
                "startTime": 1672828387,
                "totalOriginalConsiderationItems": 1,
                "zone": "0xa472fAd4B6cAdFDEd63f7aE5BFEe6eCf4F08Ae95",
                "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
              },
              "signature": "0x"
            },
            "tokenId": "17230"
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
