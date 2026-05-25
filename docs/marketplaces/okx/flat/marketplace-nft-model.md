# NFT models

The primary object in the OKX API is NFT. It represents a unique digital item with its ownership managed by blockchain.
<br/>
The below OKX Football Cup is an example of an NFT shown on OKX.

![nft](../images/nft.png)

## NFT model


| **Parameter**    | **Type**       | **Description**                                                                                       |
|-------------------|--------|-------------------------------------------------------------------------------------------------------|
| name              | String | Name of the NFT                                                                                |
| tokenId           | String | Token ID of the NFT                                                                              |
| tokenUri          | String | NFT address stored in Metadata                                                                        |
| image             | String | Image of the NFT. Note: it is a cached url stored on our end                          |
| imagePreviewUrl   | String | Preview image of the NFT. Note: it is a cached url stored on our end                   |
| imageThumbnailUrl | String | Thumbnail image of the NFT. Note: it is a cached url stored on our end                |
| animationUrl      | String | Animation resource url for the NFT. Note: it is a cached url stored on our end |
| attributes        | Object | Attributes info of the NFT, an object of [Attributes Model](#attributes-model)                                          |
| assetContracts    | Object | Contract info of the NFT, an object of [Asset Contract Model](./marketplace-collection-model.html#asset-contract-model)           |
| collection        | Object | Collection info of the NFT, an object of [Collection Model](./marketplace-collection-model.html#collection-model)                   |


## Attributes model

Attributes are special properties of an NFT. They can be either numbers or strings. Below is an example of how OKX displays the attributes for a specific NFT.

| **Parameter** | **Type** | **Description**                                                                                        |
|----------------|----------|--------------------------------------------------------------------------------------------------------|
| trait_type     | String   | Name of the attribute (e.g. color)                                                                  |
| value          | String   | Value of the attribute (e.g., string/number)                                                 |
| display_type   | String   | Format of the attribute (displayed in number, boost_percentage, boost_number, or date) |
