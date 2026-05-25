# Order models 

## Order status

| Status    | Description                                                                              |
|-----------|------------------------------------------------------------------------------------------|
| active    | Indicates that the order is currently valid and can be traded                            |
| inactive  | Indicates that the order is temporarily inactive and may become active again in the future |
| cancelled | Indicates that the order has been cancelled and cannot be traded                         |
| sold      | Indicates that the order has been traded and cannot be traded again                      |


## OKX order model

The response to creating an order or query order:

| **Parameter**     | **Type** | **Description**                                                                                 |
|-------------------|----------|-------------------------------------------------------------------------------------------------|
| orderId           | String   | Order ID                                                                                        |
| createTime        | Long     | Creation time of the order, timestamp in seconds                                                |
| updateTime        | Long     | Time when order status is updated, timestamp in seconds                                         |
| listingTime       | Long     | Order listing time, timestamp in seconds                                                        |
| expirationTime    | Long     | Expiry time of the order, end time, timestamp in seconds                                        |
| status            | String   | Order status, including active, cancelled, sold, inactive, see “Order Status Enumeration”       |
| orderHash         | String   | The Order hash                                                                                  |
| protocolData      | String   | Order parameters (json), structure varies for each market                                       |
| protocolAddress   | String   | Order transaction contract address                                                              |
| chain             | String   | Chain name refer to [Supported blockchains](./marketplace-supported-blockchains) for details |
| maker             | String   | Address of the person who initiated the order                                                   |
| orderType         | String   | Offer indicates offer; BuyNow indicates listings                                                |
| price             | String   | Price per NFT for the order                                                                     |
| currencyAddress   | String   | Address of the token used in the order                                                          |
| collectionAddress | String   | NFT contract address                                                                            |
| tokenId           | String   | NFT token ID                                                                                    |
| amount            | String   | Quantity of NFTs for the order                                                                  |
| availableAmount   | String   | Quantity of NFTs that can be use for this order                                                 |


## Order parameters model 

The order parameters details for creating an order:

| **Parameter**                   | **Type**  | **Description**                                                                                                                                                     |
|---------------------------------|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| offerer                         | String    | The wallet address initiating the order                                                                                                                             |
| offer                           | Array     | The offerer of the order supplies all offered items list, an array of [Offer Item Model](#offer-item-model)                                                         |
| consideration                   | Array     | The consideration contains an array of items that must be received in order to fulfill the order, An array of [Consideration Item Model](#consideration-item-model) |
| startTime                       | timestamp | The startTime indicates the block timestamp at which the order becomes active                                                                                      |
| endTime                         | timestamp | The endTime indicates the block timestamp at which the order expires                                                                                               |
| orderType                       | number    | The orderType designates one of four types for the order depending on two distinct preferences: [OrderType](#ordertype)                                             |
| zone                            | String    |                                                                                                                                                                     |
| zoneHash                        | String    | A fixed value:0x00000000000000000000000000000000<br/>00000000000000000000000000000000                                                                                    |
| salt                            | String    | The salt represents an arbitrary source of entropy for the order                                                                                                  |
| conduitKey                      | String    | A fixed value: 0x066003C1493A346357Af15158cD98<br/>5b4A6e29D3F888888888888888888888888                                                                                    |
| totalOriginalConsiderationItems | number    | The amount of  consideration size                                                                                                                                   |
| counter                         | number    | The counter indicates a value that must match the current counter for the given offerer                                                                           |

## Offer item model

The offerer of the order supplies all the offered items listed. When listing order, the offer array must have exactly one item, and it must be an ERC-721 or ERC-1155 token. When offering order, the offer array must have exactly one item, which must be a currency.

| **Parameter**         | **Type** | **Description**                                                                                                                                                                                                                                                                                                                                              |
|-----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [itemType](#itemtype) | number   | The itemType designates the type of item, with valid types being Ether (or other native token for the given chain), ERC20, ERC721, ERC1155, ERC721 with "criteria" (explained below), and ERC1155 with criteria.                                                                                                                                             |
| token                 | String   | The token designates the account of the item's token contract (with the null address used for Ether or other native tokens).                                                                                                                                                                                                                                 |                                                                                                                                                      |
| identifierOrCriteria  | String   | The identifierOrCriteria represents either the ERC721 or ERC1155 token identifier or, in the case of a criteria-based item type, a merkle root composed of the valid set of token identifiers for the item. This value will be ignored for Ether and ERC20 item types, and can optionally be zero for criteria-based item types to allow for any identifier. |
| startAmount           | number   | The startAmount represents the amount of the item in question that will be required, should the order be fulfilled at the moment the order becomes active.                                                                                                                                                                                                    |                                                                                                                           |
| endAmount             | number   | The endAmount represents the amount of the item in question that will be required, should the order be fulfilled at the moment the order expires. If this value differs from the item's startAmount, the realized amount is calculated linearly based on the time elapsed since the order became active.                                                      |

## Consideration item model

The consideration contains an array of items that must be received in order to fulfill the order. The consideration array must have exactly two or three items. The items are (in order): the asset (when offer is NFT, listing is the offerer fee), the optional OKX fee, and an optional collection fee.

| **Parameter**         | **Type** | **Description**                                                                                                                                                                                                                                                                                                                                              |
|-----------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [itemType](#itemtype) | number   | The itemType designates the type of item, with valid types being Ether (or other native token for the given chain), ERC20, ERC721, ERC1155, ERC721 with "criteria" (explained below), and ERC1155 with criteria.                                                                                                                                             |
| token                 | String   | The token designates the account of the item's token contract (with the null address used for Ether or other native tokens).                                                                                                                                                                                                                                 |
| identifierOrCriteria  | String   | The identifierOrCriteria represents either the ERC721 or ERC1155 token identifier or, in the case of a criteria-based item type, a merkle root composed of the valid set of token identifiers for the item. This value will be ignored for Ether and ERC20 item types, and can optionally be zero for criteria-based item types to allow for any identifier. |
| startAmount           | number   | The startAmount represents the amount of the item in question that will be required, should the order be fulfilled at the moment the order becomes active.                                                                                                                                                                                                   |
| endAmount             | number   | The endAmount represents the amount of the item in question that will be required, should the order be fulfilled at the moment the order expires. If this value differs from the item's startAmount, the realized amount is calculated linearly based on the time elapsed since the order became active.                                                      |
| recipient             | String   | Recipient that will receive each item.                                                                                                                                                                                                                                                                                                  |

### Enums

#### OrderType

```java
enum OrderType {
  FULL_OPEN,
  PARTIAL_OPEN,
  FULL_RESTRICTED,
  PARTIAL_RESTRICTED
}
```

#### ItemType

```java
enum ItemType {
  NATIVE,
  ERC20,
  ERC721,
  ERC1155,
  ERC721_WITH_CRITERIA,
  ERC1155_WITH_CRITERIA
}
```

## Buy item model

| **Parameter** | **Type** | **Description**            |
|---------------|----------|----------------------------|
| orderId       | String   | order ID to fill          |
| takeCount     | Integer  | Quantity of tokens to buy |
