# Temporal
Orchestration of the temporal workflow used for Namefi-Astra.

- Workflows are defined in the `workflows` folder.
- Activities are defined in the `activities` folder.


## Checkout Flow (User-Triggered)

- trigger the payment (Stripe, Nfsc, etc)
- for each item in the cart, process it with subflows
- refund if needed
- notify user for result

```psudo code
CheckoutFlow
  -> ChargeStripeSubflow or ChargeNfscSubflow
  -> ProcessCartItemFlow(index=1)
    -> SubDomainRegisterSubflow
      -> MintNamefiNftSubflow
      -> PostAcquistionSubflow
        -> UpdateNameServerActivity
        -> AddNamefiParkDNSRecordsActivity
  -> RefundStripeSubflow or RefundNfscSubflow
  -> NotifyUserActivity("Entire order has been completed with no error.")
```