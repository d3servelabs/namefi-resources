# Ordinals related models

## Ordinals collection model

| **Parameter**       | **Type** | **Description**                                                         |
|---------------------|----------|-------------------------------------------------------------------------|
| slug                | String   | The collection’s slug, which is the unique identifier of the collection |
| totalVolume         | String   | Total volume of a collection, priced in BTC                             |
| floorPrice          | String   | Floor price of a collection, priced in BTC                              |
| inscriptionNumRange | String   | Range of inscription numbers for a collection                           |
| volume24h           | String   | 24-hour trading volume of the collection, priced in BTC                 |
| isBrc20             | Boolean  | Used to distinguish Ordinals inscription types: Brc20 or BTC NFT        |

## Ordinals order model

| **Parameter** | **Type** | **Description**                                                  |
|---------------|----------|------------------------------------------------------------------|
| inscriptionId | String   | Inscription number                                               |
| listingTime   | Long     | Listing time                                                     |
| listingUrl    | String   | Link to the page                                                 |
| ownerAddress  | String   | Owner address                                                    |
| price         | String   | Price of an order                                                |
| unitPrice     | String   | Order unit price, priced in BTC                                  |
| amount        | String   | Number of inscriptions in the order                              |
| isBrc20       | Boolean  | Used to distinguish Ordinals inscription types: Brc20 or BTC NFT |

## Ordinals activities model

| **Parameter** | **Type** | **Description**                                                  |
|---------------|----------|------------------------------------------------------------------|
| fromAddress   | String   | From address in the transaction                                  |
| inscriptionId | String   | Inscription number                                               |
| price         | String   | Price of the transaction                                         |
| timestamp     | Long     | Transaction timestamp                                            |
| toAddress     | String   | To address in the transaction                                    |
| unitPrice     | String   | Order unit price, priced in BTC                                  |
| amount        | String   | Number of inscriptions in the order                              |
| isBrc20       | Boolean  | Used to distinguish Ordinals inscription types: Brc20 or BTC NFT |
