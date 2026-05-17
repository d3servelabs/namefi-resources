export {
  emitOrderPlacedIfTracked,
  gaEventOrderPlaced,
  gaEventPaymentSuccess,
  gaEventPaymentFailed,
  gaEventPaymentRefunded,
  gaEventDomainAcquisitionStarted,
  gaEventDomainAcquisitionFinished,
  gaEventDnsRecordsPropagated,
  gaEventParkingFinished,
  gaEventOrderFinishedEmailSent,
  gaEventOrderFinishedEmailOpened,
} from './events';

export {
  resolveApiCheckoutTracking,
  resolveWebCheckoutTracking,
  toGaEventTracking,
  type CheckoutTrackingContext,
  type CheckoutTrackingIdentity,
  type GaEventTracking,
} from './context';
