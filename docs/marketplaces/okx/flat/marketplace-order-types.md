# Interact with different order types

Order types can be divided into the OKX Aggregator contract and OKX NFT Market contract.


## OKX Aggregator contract

The OKX Aggregator API is ```trade```, and this interface encapsulates the calldata needed to make calls to other markets.

```sql
function tradeV3(
    MarketRegistry.TradeDetails[] calldata tradeDetails,
    AggregatorParamV3[] calldata aggregatorParam,
    bool isAtomic
) external payable nonReentrant
```

**MarketRegistry**

``MarketRegistry`` is the registration contract in which all other markets supported by the aggregator need in order to be registered.

```sql
struct TradeDetails {
  uint256 marketId;
  uint256 value;
  bytes32 orderHash;
  bytes tradeData;
}
```

| **Parameter** | **Description**                                                                            |
|---------------|--------------------------------------------------------------------------------------------|
| marketId      | Marketplace custom ID                                                                      |
| value         | Pay amount of native tokens, such as ETH                                                   |
| orderHash     | Order hash                                                                                 |
| tradeData     | Calldata of transaction executed in other markets. Please refer to the Using Marketplace API section. |


**AggregatorParamV3**



```sql
struct AggregatorParamV3 {
    uint256 actionType;
    uint256 payAmount;
    address payToken;
    address tokenAddress;
    uint256 tokenId;
    uint256 amount;
    uint256 tradeType;
    bytes extraData;
}
```

| **Parameter** | **Description**                                                                                                                                                                                                                |
|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| actionType    | Operation type, currently only supporting seaport<br/>```1```: ```_SEAPORT_BUY_ETH```<br/>```2```: ```_SEAPORT_BUY_ERC20```<br/>```3```: _```SEAPORT_ACCEPT```                                                                   |
| payAmount     | The number of ERC-20 tokens used for order payment                                                                                                                                                                   |
| payToken      | ERC-20 token address for order payment                                                                                                                                                                               |
| tokenAddress  | The token address of ERC-721/ERC-1155                                                                                                                                                                                 |
| tokenId       | Token ID                                                                                                                                                                                                                     |
| amount        | Token amount                                                                                                                                                                                                           |
| tradeType     | ```0```: ```NATIVE```,  // ETH on mainnet, MATIC on Polygon<br/>```1```: ```ERC721```,<br/>```2```: ```ERC1155```,<br/>```3```: ```ERC721_WITH_CRITERIA```,<br/>```4```: ```ERC1155_WITH_CRITERIA```,<br/>```5```: ```ERC20``` |
| extraData     | Extra data: address, address, address (order's maker, order's taker, approve contract's address)                                                                                                                               |


**isAtomic**

Setting this to true means a revert action will happen if any order execution fails during batch order execution, and setting this to false means a revert does not happen.


## OKX NFT market contract

### 1. Listing

Listing order means to list the NFT and wait for the buyer to purchase.  
Order will be generated and signed during listing. Please refer to the [retrieve Marketplace listing structure](./marketplace-create-a-listing) section. 

### 2. Order execution

Support interfaces of ***fulfillBasicOrder*** and ***fulfillAdvancedOrder***

**2.1 fulfillBasicOrder**

```sql
function fulfillBasicOrder(BasicOrderParameters calldata parameters)
    external
    payable
    override
    returns (bool fulfilled);
```

Indices of fulfillBasicOrder interface are shown below:

```sql
struct BasicOrderParameters {
    address considerationToken; 
    uint256 considerationIdentifier; 
    uint256 considerationAmount; 
    address payable offerer; 
    address zone; 
    address offerToken; 
    uint256 offerIdentifier; 
    uint256 offerAmount; 
    BasicOrderType basicOrderType; 
    uint256 startTime; 
    uint256 endTime; 
    bytes32 zoneHash; 
    uint256 salt; 
    bytes32 offererConduitKey; 
    bytes32 fulfillerConduitKey; 
    uint256 totalOriginalAdditionalRecipients; 
    AdditionalRecipient[] additionalRecipients; 
    bytes signature; 
}
```

```considerationToken```: Consideration token address  
```considerationIdentifier```: Consideration token ID 
```considerationAmount```: The number of consideration tokens  
```offerer```: The account address of the offerer  
```zone```: Order zone  
```offerToken```: Address of the offer token  
```offerIdentifier```: Offer token ID 
```offerAmount```: Number of the offer token  
```basicOrderType```: Order type  
```startTime```: Order effective time  
```endTime```: Order expiration time  
```zoneHash```: The hash value passed to the zone  
```salt```: Order random entropy source  
```offererConduitKey```: ConduitKey of the offerer  
```fulfillerConduitKey```: ConduitKey of the fulfiller  
```totalOriginalAdditionalRecipients```: The number of addresses that receives consideration tokens  
```additionalRecipients```: Recipients of additional tokens  
```signature```: Signature of the transaction executor  

```sql
enum BasicOrderType {
    // 0: no partial fills, anyone can execute
    ETH_TO_ERC721_FULL_OPEN,

    // 1: partial fills supported, anyone can execute
    ETH_TO_ERC721_PARTIAL_OPEN,

    // 2: no partial fills, only offerer or zone can execute
    ETH_TO_ERC721_FULL_RESTRICTED,

    // 3: partial fills supported, only offerer or zone can execute
    ETH_TO_ERC721_PARTIAL_RESTRICTED,

    // 4: no partial fills, anyone can execute
    ETH_TO_ERC1155_FULL_OPEN,

    // 5: partial fills supported, anyone can execute
    ETH_TO_ERC1155_PARTIAL_OPEN,

    // 6: no partial fills, only offerer or zone can execute
    ETH_TO_ERC1155_FULL_RESTRICTED,

    // 7: partial fills supported, only offerer or zone can execute
    ETH_TO_ERC1155_PARTIAL_RESTRICTED,

    // 8: no partial fills, anyone can execute
    ERC20_TO_ERC721_FULL_OPEN,

    // 9: partial fills supported, anyone can execute
    ERC20_TO_ERC721_PARTIAL_OPEN,

    // 10: no partial fills, only offerer or zone can execute
    ERC20_TO_ERC721_FULL_RESTRICTED,

    // 11: partial fills supported, only offerer or zone can execute
    ERC20_TO_ERC721_PARTIAL_RESTRICTED,

    // 12: no partial fills, anyone can execute
    ERC20_TO_ERC1155_FULL_OPEN,

    // 13: partial fills supported, anyone can execute
    ERC20_TO_ERC1155_PARTIAL_OPEN,

    // 14: no partial fills, only offerer or zone can execute
    ERC20_TO_ERC1155_FULL_RESTRICTED,

    // 15: partial fills supported, only offerer or zone can execute
    ERC20_TO_ERC1155_PARTIAL_RESTRICTED,

    // 16: no partial fills, anyone can execute
    ERC721_TO_ERC20_FULL_OPEN,

    // 17: partial fills supported, anyone can execute
    ERC721_TO_ERC20_PARTIAL_OPEN,

    // 18: no partial fills, only offerer or zone can execute
    ERC721_TO_ERC20_FULL_RESTRICTED,

    // 19: partial fills supported, only offerer or zone can execute
    ERC721_TO_ERC20_PARTIAL_RESTRICTED,

    // 20: no partial fills, anyone can execute
    ERC1155_TO_ERC20_FULL_OPEN,

    // 21: partial fills supported, anyone can execute
    ERC1155_TO_ERC20_PARTIAL_OPEN,

    // 22: no partial fills, only offerer or zone can execute
    ERC1155_TO_ERC20_FULL_RESTRICTED,

    // 23: partial fills supported, only offerer or zone can execute
    ERC1155_TO_ERC20_PARTIAL_RESTRICTED
}
```





**2.2 fulfillAdvancedOrder**

```sql
function fulfillAdvancedOrder(
        AdvancedOrder calldata advancedOrder,
        CriteriaResolver[] calldata criteriaResolvers,
        bytes32 fulfillerConduitKey
        address recipient
) external payable override returns (bool fulfilled)
```

Among them, the parameters ```fulfillerConduitKey```, ```CriteriaResolver``` and ```AdvancedOrder``` are resolved as follows:

- **fulfillerConduitKey**: Order executor's ConduitKey  
- **recipient**: Specifies the recipient address of the token. If it is not set, it defaults to msg.sender.  
- **CriteriaResolver**: The condition resolver used to verify whether the parameters such as the merkle path of the restriction are satisfied  

    ```sql
    struct CriteriaResolver {
        uint256 orderIndex;
        Side side;
        uint256 index;
        uint256 identifier;
        bytes32[] criteriaProof;
    }
    ```
    
    ```orderIndex```: Specifies the order among multiple orders
    ```side```: The offerer or its counterparty to the offer  
    ```index```: The index value of OfferItem or ConsiderationItem in the order  
    ```identifier```: The token id of the order transaction  
    ```criteriaProof```: Merkle proof  

- **Advanced Order**: Order indices

    ```sql
    struct AdvancedOrder {
        OrderParameters parameters;   
        uint120 numerator;   
        uint120 denominator;    
        bytes signature;    
        bytes extraData;   
    }
    ```

   ```numerator```: The numerator of the partial transaction  
   ```denominator```: Denominator of the partial transaction  
   ```signature```: Order signature  
   ```parameters```: Order parameters, as follows:

    ```sql
    struct OrderParameters {
        address offerer; 
        address zone; 
        OfferItem[] offer; 
        ConsiderationItem[] consideration; 
        OrderType orderType; 
        uint256 startTime; 
        uint256 endTime; 
        bytes32 zoneHash; 
        uint256 salt; 
        bytes32 conduitKey; 
        uint256 totalOriginalConsiderationItems; 
    }
    ```

   ```offerer```: Order quoter  
   ```offer```: The assets marked by the offerer  
   ```Consideration```: Assets the offerer receives after the order is fulfilled  
   ```zone```: The address of the account that can cancel an order and restrict parties to fulfill restricted order  
   ```orderType```: Order type. This supports a duo combination of open or restricted and complete or partial orders. Open orders can be executed by anyone, and restricted orders are those that can only be executed by the offerer or the zone.  
   ```startTime```: Order effective time  
   ```endTime```: Order expiration time  
   ```zoneHash```: The hash value used for the verification of restricted orders. The zone can decide whether to use the hash value.
   ```salt```: Order random entropy source  
   ```conduitKey```: A bytes32 type value. conduitKey corresponds to a contract that can perform a token transfer on behalf of the order offerer.
   ```totalOriginalConsiderationItems```: The number of consideration items. This parameter must be defined because the caller may pass in additional underlying assets.

- **OfferItem**

    ```sql
    struct OfferItem {
        ItemType itemType;    
        address token;   
        uint256 identifierOrCriteria;    
        uint256 startAmount;    
        uint256 endAmount;    
    }
    ```

    ```token```: The address of the quote token  
    ```identifierOrCriteria```: This value can be 0, the value of a single token ID or the merkle root of token IDs
    ```startAmount```: The initial quantity  
    ```endAmount```: The final amount. startAmount and endAmount are the same for fixed price orders, but in the auction endAmount would be greater or lesser than startAmount over time.

   Order type is expressed by **ItemType**:
    ```sql
    enum ItemType {
        // 0: ETH on mainnet, MATIC on polygon, etc.
        NATIVE,
        // 1: ERC20 items (ERC777 and ERC20 analogues could also technically work)
        ERC20,
        // 2: ERC721 items
        ERC721,
        // 3: ERC1155 items
        ERC1155,
        // 4: ERC721 items where a number of tokenIds are supported
        ERC721_WITH_CRITERIA,
        // 5: ERC1155 items where a number of ids are supported 
        ERC1155_WITH_CRITERIA
    }
    ```

   ```NATIVE```: Main chain token  
   ```ERC721_WITH_CRITERIA```: Multiple ERC-721 standard NFTs. Can be used with identifierOrCriteria  
   ```ERC1155_WITH_CRITERIA```: Multiple ERC-1155 standard NFTs. Can be used with identifierOrCriteria

    ```sql
    struct ConsiderationItem {
        ItemType itemType;
        address token;
        uint256 identifierOrCriteria;
        uint256 startAmount;
        uint256 endAmount;
        address payable recipient;
    }
    ```

    ```ConsiderationItem``` and ```OfferItem``` almost have the same items.
    ConsiderationItem adds the recipient field to indicate which addresses will get the token from the order execution. 



### 3. Order cancellation

Support batch order cancellation. Only the ```offerer``` and the ```zone``` can cancel an order.

```sql
function cancel(OrderComponents[] calldata orders)
    external
    override
    returns (bool cancelled);
```

Data structure of OrderComponents:

```sql
struct OrderComponents {
    address offerer;
    address zone;
    OfferItem[] offer;
    ConsiderationItem[] consideration;
    OrderType orderType;
    uint256 startTime;
    uint256 endTime;
    bytes32 zoneHash;
    uint256 salt;
    bytes32 conduitKey;
    uint256 counter;
}
```

```OrderComponents``` and ```OrderParameters``` have very similar parameters. The ```counter``` is a count of the transaction number.

 
