<ApiLayout defaultRequestLanguage='shell' defaultResponseStatusCode='200' supportedRequestLanguageList={['shell']} supportedResponseStatusCodeList={['200']}>

<ParamsWrapper>

# Create listing

This API is used to list a single Runes inscription on the OKX platform. Before listing, you can [get wallet assets](./marketplace-runes-asset) (get the holding information of a specific token in the wallet) to first get the list of Runes inscriptions you hold.

<RequestParamsWrapper>

### Request address

<RequestTag>POST</RequestTag> `https://web3.okx.com/api/v5/mktplace/nft/runes/make-order`

### Request param

| **Parameter**   | **Type** | **Required** | **Description**                                                           |
|-----------------|----------|--------------|---------------------------------------------------------------------------|
| runesId | String | Yes | runes token's unique identifier, e.g., 840000:3 |
| walletAddress | String | Yes | Wallet address holding the above runesId inscription |
| utxo | String | Yes | UTXO where the rune token is located, format: txHash:vout, e.g., d578a0967605257f75be625cbdc2506f2a52f9135f56f302badab6a3da54e0d4:0 |
| unitPrice | BigDecimal | Yes | Listing unit price of the inscription, in Satoshis |
| totalPrice | BigDecimal | Yes | Listing total price of the inscription, in BTC |
| psbt | String | Yes | Signed listing PSBT, currently only accepts base64-encoded PSBT. The UTXO containing the inscription must be placed in the input at index=1, and the receiving address and amount must be placed in the corresponding output at index=1 |

</RequestParamsWrapper>

<ResponseParamsWrapper>

### Response param

| **Parameter**     | **Type** | **Description**                                                                                       |
|-------------------|----------|-------------------------------------------------------------------------------------------------------|
| code | Integer | Response result code, code=0 indicates success, other values indicate failure |
| data | Object | Response result body, specific fields refer to response example |
| msg | String | Result message, refer to this when code is not 0 |

</ResponseParamsWrapper>

</ParamsWrapper>

<CodeExampleWrapper>

### Request example

<RequestCodeExampleWrapper>

<RequestCodeExample language="shell">
  ```shell
  curl --location 'https://web3.okx.com/api/v5/mktplace/nft/runes/make-order' \
  --header 'OK-ACCESS-KEY: your apikey' \
  --header 'OK-ACCESS-PASSPHRASE: your passphrase' \
  --header 'Content-Type: application/json' \
  --data '{
  "runesId": "840000:3",
  "walletAddress": "bc1pud5f80a06y6jcwlllt2t5vdq24sd8d24f39jccay24dqhqmgelkq9dqghx",
  "utxo": "c1dd6736a19d7744353731c85f7f3b7fb9908041e03a1fe66507102e5af930ec:2",
  "unitPrice": 130000,
  "totalPrice": 1300000,
  "psbt": "j2li1jlkjsalkdfjsalkjdo"
  }'
  ```
</RequestCodeExample>

</RequestCodeExampleWrapper>

### Response example

<ResponseCodeExampleWrapper>

<ResponseCodeExample codeStatus='200'>
  ```json
  {
    "code": 0,    // code=0 indicates success, other values indicate failure
    "data": {
    "assetId": "1",   // asset id of the listing
  },
    "msg": ""
  }
  ```
</ResponseCodeExample>

</ResponseCodeExampleWrapper>

</CodeExampleWrapper>

</ApiLayout>
