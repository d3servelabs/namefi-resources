# Collection models

Collections are used to represent all the assets in a single (or multiple) contract address(es) and help users group items from the same creator. They have one or more owners and are typically associated with important metadata such as creator royalties and descriptions.

## Collection model

All related information for the collection:

| **Parameter**  | <div style={{width:180}}>**Type**</div> | **Description**                                                                                                                                                                                                        |
|-----------------|-----------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| name            | String                                  | Collection name                                                                                                                                                                                                        |
| des             | String                                  | Collection description                                                                                                                                                                                                 |
| image           | String                                  | Collection logo URL                                                                                                                                                                                                    |
| backgroundImage | String                                  | Collection background image URL                                                                                                                                                                                        |
| slug            | String                                  | Collection slug, which is the unique identifier of the collection                                                                                                                                                      |
| certificateFlag | Boolean                                 | Collection certification flag                                                                                                                                                                                          |
| officialWebsite | String                                  | Collection official website                                                                                                                                                                                            |
| instagramUrl    | String                                  | The Instagram URL of the collection                                                                                                                                                                                    |
| discordUrl      | String                                  | The Discord URL of the collection                                                                                                                                                                                      |
| mediumUrl       | String                                  | The Medium URL of the collection                                                                                                                                                                                       |
| twitterUrl      | String                                  | The Twitter URL of the collection                                                                                                                                                                                      |
| categoryList    | Array                                   | The category list of the collection                                                                                                                                                                                    |
| assetContracts  | Array                                   | An Array of the [Asset Contract Model](#asset-contract-model) that are associated with this collection, including contract address, protocol standard, owner address, whether the ERC-2981 protocol is supported, etc. |
| stats           | Object                                  | A dictionary containing some statistics related to this collection, including trade volume and floor prices, an object of the [Collection Stats Model](#collection-stats-model)                                        |

## Asset contract model

The Information for Collection

| **Parameter**  | **Type** | **Description**                                                    |
|-----------------|----------|--------------------------------------------------------------------|
| chain           | String   | The chain of the contract that is associated with this collection |
| contractAddress | String   | A contract address that is associated with this collection        |
| tokenStandard   | String   | The protocol type of the contract eg: ERC-721, ERC-1155              |
| ownerAddress    | String   | The owner address of the contract                                |
| erc2981         | Boolean  | Whether the contract supports 2981 protocol                      |

## Collection stats model

The related statistics for the collection

| **Parameter** | **Type** | **Description**                           |
|----------------|----------|-------------------------------------------|
| latestPrice    | String   | The latest sale price of this collection |
| totalVolume    | String   | The total sale volume of this collection |
| totalCount     | String   | The total NFT count of this collection   |
| ownerCount     | String   | The owner count of this collection       |
| floorPrice     | String   | The floor price of this collection       |
