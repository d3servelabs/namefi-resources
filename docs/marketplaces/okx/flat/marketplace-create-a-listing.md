{/* api-page */}

<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>

# Create a listing

This interface is used for listing on OKX and other markets.

<RequestParamsWrapper>

### Request address

<RequestTag>POST</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/markets/create-listing`

### Request parameters

- **Body param**

| **Parameter** | **Type** | **Required** | **Description**                                                                      |
|---------------|----------|--------------|--------------------------------------------------------------------------------------|
| chain         | String   | Yes          | Chain name refer to [Supported blockchains](./marketplace-supported-blockchains) for details                              |
| walletAddress | String   | Yes          | Wallet address for creating the listing                                              |
| collectionAddress     | String   | Yes          | NFT contract address                                     |
| tokenId    | String   | Yes          | NFT tokenId |
| price | String | Yes | Price of the NFT in decimal, example: 2000000 represents 2 |
| currencyAddress | String | Yes | Contract address of the pricing currency, native coins like ETH, OKT, etc. on different networks default to “0x000000000000000000000<br/>0000000000000000000” |
| count | String | Yes | Quantity of NFT, 1 for ERC-721 type |
| validTime | String | Yes | Listing expiration timestamp (s), example: 2039-09-19 07:06:40 converts to timestamp 2200000000 |
| platform | String | Yes | Target listing platform, refer to [Integrated markets](./marketplace-integrated-markets) |

</RequestParamsWrapper>


</ParamsWrapper>

<CodeExampleWrapper>

### Request example


<RequestCodeExampleWrapper>

  <RequestCodeExample language="shell">
    ```shell
    curl -X POST "https://web3.okx.com/api/v5/mktplace/nft/markets/create-listing" \
         -H "Content-Type: application/json" \
         -H 'OK-ACCESS-KEY: XXX' \
         -H 'OK-ACCESS-TIMESTAMP: XXX' \
         -H 'OK-ACCESS-PASSPHRASE: XXX' \
         -H 'OK-ACCESS-SIGN: XXX' \
         -d '{
                 "chain": "polygon",
                 "walletAddress": "0x76e2da406db566f0e79764a2bf01b992997d0586",
                 "items" : [
                     {
                         "collectionAddress": "0xa5561b779c086d37a77d7b35e97ce75bb9193491",
                         "tokenId": "101837856840664764261208575168687881837850830083487668871567409609794568798800",
                         "price": "50000000",
                         "currencyAddress": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
                         "count": 1,
                         "validTime":1748057424,
                         "platform": "okx"
                     }
                 ]
             }'
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
          "errors": [],
          "orders": [
              {
                  "collectionAddress": "0xa5561b779c086d37a77d7b35e97ce75bb9193491",
                  "count": "1",
                  "currencyAddress": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
                  "id": "a07b10bb8da04a9183cd0ca216126071",
                  "listingProfit": "",
                  "nftId": "27278971523568785",
                  "platform": "okx",
                  "platformFeePoints": null,
                  "price": "50000000",
                  "project": "",
                  "protocolFeePoints": null,
                  "royaltyFeePoints": null,
                  "source": 4,
                  "tokenId": "101837856840664764261208575168687881837850830083487668871567409609794568798800",
                  "validTime": 1748057424
              }
          ],
          "steps": [
              {
                  "action": "ApprovalItems",
                  "items": [
                      {
                          "approvalAddress": "0x1e0049783f008a0085193e00003d00cd54003c71",
                          "chain": 137,
                          "collectionAddress": "0xa5561b779c086d37a77d7b35e97ce75bb9193491",
                          "description": "",
                          "kind": "nftApproval",
                          "orderIds": [
                              "a07b10bb8da04a9183cd0ca216126071"
                          ],
                          "platform": {
                              "icon": "https://static.coinall.ltd/cdn/nft/1f4d2f3f-774c-4386-b8e1-52533d1af81d.webp",
                              "name": "OKX",
                              "source": 4
                          },
                          "platforms": [
                              {
                                  "icon": "https://static.coinall.ltd/cdn/nft/1f4d2f3f-774c-4386-b8e1-52533d1af81d.webp",
                                  "name": "OKX",
                                  "source": 4
                              }
                          ],
                          "status": "complete"
                      }
                  ]
              },
              {
                  "action": "SignOrders",
                  "items": [
                      {
                          "data": {
                              "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
                              "consideration": [
                                  {
                                      "endAmount": "49000000",
                                      "identifierOrCriteria": "0",
                                      "itemType": 1,
                                      "recipient": "0x76e2da406db566f0e79764a2bf01b992997d0586",
                                      "startAmount": "49000000",
                                      "token": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
                                  },
                                  {
                                      "endAmount": "1000000",
                                      "identifierOrCriteria": "0",
                                      "itemType": 1,
                                      "recipient": "0xecd8c2d00b969fddbb06c2c6bec9a98a7d8dfb85",
                                      "startAmount": "1000000",
                                      "token": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
                                  }
                              ],
                              "counter": "0",
                              "endTime": "1748057424",
                              "offer": [
                                  {
                                      "endAmount": "1",
                                      "identifierOrCriteria": "101837856840664764261208575168687881837850830083487668871567409609794568798800",
                                      "itemType": 2,
                                      "startAmount": "1",
                                      "token": "0xa5561b779c086d37a77d7b35e97ce75bb9193491"
                                  }
                              ],
                              "offerer": "0x76e2da406db566f0e79764a2bf01b992997d0586",
                              "orderType": 2,
                              "salt": "0x000000000000000000000000000000000000000000000000eb1c8424e64a1eec",
                              "startTime": 1719209238,
                              "totalOriginalConsiderationItems": 2,
                              "zone": "0xdf2d4bffec010debd302674c9fb9cda99bb5e852",
                              "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
                          },
                          "description": "",
                          "domain": {
                              "chainId": 137,
                              "name": "Seaport",
                              "verifyingContract": "0x0000000000000068f116a894984e2db1123eb395",
                              "version": "1.6"
                          },
                          "kind": "signature",
                          "orderIds": [
                              "a07b10bb8da04a9183cd0ca216126071"
                          ],
                          "platform": {
                              "icon": "https://static.coinall.ltd/cdn/nft/1f4d2f3f-774c-4386-b8e1-52533d1af81d.webp",
                              "name": "OKX",
                              "source": 4
                          },
                          "platforms": [
                              {
                                  "icon": "https://static.coinall.ltd/cdn/nft/1f4d2f3f-774c-4386-b8e1-52533d1af81d.webp",
                                  "name": "OKX",
                                  "source": 4
                              }
                          ],
                          "post": {
                              "body": {
                                  "chain": 137,
                                  "items": [
                                      {
                                          "collectionAddress": "0xa5561b779c086d37a77d7b35e97ce75bb9193491",
                                          "count": "1",
                                          "currencyAddress": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
                                          "id": "a07b10bb8da04a9183cd0ca216126071",
                                          "listingProfit": "",
                                          "nftId": "27278971523568785",
                                          "platform": "okx",
                                          "platformFeePoints": null,
                                          "price": "50000000",
                                          "project": "",
                                          "protocolFeePoints": null,
                                          "royaltyFeePoints": null,
                                          "source": 4,
                                          "tokenId": "101837856840664764261208575168687881837850830083487668871567409609794568798800",
                                          "validTime": 1748057424
                                      }
                                  ],
                                  "orderData": "",
                                  "r": "",
                                  "s": "",
                                  "signature": "",
                                  "walletAddress": "0x76e2da406db566f0e79764a2bf01b992997d0586"
                              },
                              "endpoint": "/priapi/v1/nft/trading/seaport/step/submitOrder",
                              "method": "post"
                          },
                          "primaryType": "OrderComponents",
                          "signKind": "eip712",
                          "status": "incomplete",
                          "types": {
                              "ConsiderationItem": [
                                  {
                                      "name": "itemType",
                                      "type": "uint8"
                                  },
                                  {
                                      "name": "token",
                                      "type": "address"
                                  },
                                  {
                                      "name": "identifierOrCriteria",
                                      "type": "uint256"
                                  },
                                  {
                                      "name": "startAmount",
                                      "type": "uint256"
                                  },
                                  {
                                      "name": "endAmount",
                                      "type": "uint256"
                                  },
                                  {
                                      "name": "recipient",
                                      "type": "address"
                                  }
                              ],
                              "OrderComponents": [
                                  {
                                      "name": "offerer",
                                      "type": "address"
                                  },
                                  {
                                      "name": "zone",
                                      "type": "address"
                                  },
                                  {
                                      "name": "offer",
                                      "type": "OfferItem[]"
                                  },
                                  {
                                      "name": "consideration",
                                      "type": "ConsiderationItem[]"
                                  },
                                  {
                                      "name": "orderType",
                                      "type": "uint8"
                                  },
                                  {
                                      "name": "startTime",
                                      "type": "uint256"
                                  },
                                  {
                                      "name": "endTime",
                                      "type": "uint256"
                                  },
                                  {
                                      "name": "zoneHash",
                                      "type": "bytes32"
                                  },
                                  {
                                      "name": "salt",
                                      "type": "uint256"
                                  },
                                  {
                                      "name": "conduitKey",
                                      "type": "bytes32"
                                  },
                                  {
                                      "name": "counter",
                                      "type": "uint256"
                                  }
                              ],
                              "EIP712Domain": [
                                  {
                                      "name": "name",
                                      "type": "string"
                                  },
                                  {
                                      "name": "version",
                                      "type": "string"
                                  },
                                  {
                                      "name": "chainId",
                                      "type": "uint256"
                                  },
                                  {
                                      "name": "verifyingContract",
                                      "type": "address"
                                  }
                              ],
                              "OfferItem": [
                                  {
                                      "name": "itemType",
                                      "type": "uint8"
                                  },
                                  {
                                      "name": "token",
                                      "type": "address"
                                  },
                                  {
                                      "name": "identifierOrCriteria",
                                      "type": "uint256"
                                  },
                                  {
                                      "name": "startAmount",
                                      "type": "uint256"
                                  },
                                  {
                                      "name": "endAmount",
                                      "type": "uint256"
                                  }
                              ]
                          }
                      }
                  ]
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
