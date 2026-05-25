# Asset models

One of the primary objects in the OKX API is the asset, which represents a unique digital item whose ownership is managed by the blockchain.


## NFT object details

| **Parameter**     | **Type**        | **Description**                                                                                       |
|-------------------|---------|-------------------------------------------------------------------------------------------------------|
| name              | String  | The name of the NFT                                                                                  |
| tokenId           | String  | The token ID of the NFT                                                                              |
| amount            | String  | Specified tokenId NFT's total supply                                                                              |
| tokenUri          | String  | NFT MetaData stored address                                                                           |
| image             | String  | An image of the item. Note that this is the cached url we store on our end.                           |
| imagePreviewUrl   | String  | A preview image of the item. Note that this is the cached url we store on our end.                    |
| imageThumbnailUrl | String  | A thumbnail image of the item. Note that this is the cached url we store on our end.                  |
| animationUrl      | String  | A link to animation Resource Url for the item. Note that this is the cached url we store on our end. |
| attributes        | Object  | An object of the Token Attributes Model                                          |
| assetContracts    | Object  | An object of the Token [Asset Contract Model](./marketplace-collection-model.md#asset-contract-model)           |
| collection        | Object  | An object of the Token [Collection Model](./marketplace-collection-model.md#collection-model)                   |
| ownerAddress      | String  | The address of the owner of the assets                                                               |
| isLazyMintType    | Boolean | Whether or not it is delayed minting and no transfer has occurred                                          |
