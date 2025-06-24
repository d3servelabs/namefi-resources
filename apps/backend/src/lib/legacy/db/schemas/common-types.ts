import crypto from 'node:crypto';
import { Schema } from 'mongoose';

// Enums
export enum Token {
  ETHER = 'ETHER',
  ETHER_WEI = 'ETHER_WEI',
  ETHER_GWEI = 'ETHER_GWEI',
  USDT = 'USDT',
  USDC = 'USDC',
  NFSC = 'NFSC',
}

export enum Currency {
  USD = 'USD',
}

export enum NamefiRegistrarOption {
  ROUTE53 = 'route53',
  DYNADOT = 'dynadot',
  NAMEFI_MOCK = 'namefiMock',
  NAMEFI_IN_MEMORY_MOCK = 'namefiInMemoryMock',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED',
}

export enum MintRequestStatus {
  PENDING = 'PENDING',
  MINTING = 'MINTING',
  DONE = 'DONE',
  FAILED = 'FAILED',
  RETRIED = 'RETRIED',
  OVERRIDDEN = 'OVERRIDDEN',
}

export enum OperationStatus {
  PENDING_SUBMIT = 'PENDING_SUBMIT',
  PENDING = 'PENDING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

export enum TransactionStatus {
  PENDING_SUBMIT = 'PENDING_SUBMIT',
  WAITING = 'WAITING',
  DONE = 'DONE',
  FAILED = 'FAILED',
  REVERTED = 'REVERTED',
  RETRIED = 'RETRIED',
  OVERRIDDEN = 'OVERRIDDEN',
}

export enum OperationType {
  IMPORT = 'IMPORT',
  TRANSFER = 'TRANSFER',
  REGISTER = 'REGISTER',
  ADD_DNSSEC = 'ADD_DNSSEC',
  REMOVE_DNSSEC = 'REMOVE_DNSSEC',
  RENEW = 'RENEW',
}

export enum NotificationRecordLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export enum ServerJobArgumentsType {
  POSITIONAL = 'POSITIONAL',
  NAMED = 'NAMED',
}

export enum ServerJobType {
  SINGLE = 'SINGLE',
  FLOW = 'FLOW',
}

export enum ServerJobStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  FAILED = 'FAILED',
}

export enum PaymentStatus {
  CREATED = 'CREATED',
  PROCESSING = 'PROCESSING',
  VOIDED = 'VOIDED',
  REQUIRES_CAPTURE = 'REQUIRES_CAPTURE',
  REQUIRES_CONFIRMATION = 'REQUIRES_CONFIRMATION',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  REQUIRES_PAYMENT_METHOD = 'REQUIRES_PAYMENT_METHOD',
  SUCCEEDED = 'SUCCEEDED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
}

export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  PENDING = 'PENDING',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
  SUCCEEDED = 'SUCCEEDED',
  OTHER = 'OTHER',
}

export enum NamefiPaymentProvider {
  STRIPE = 'STRIPE',
}

export enum NamefiPaymentType {
  NFSC_BASE = 'NFSC_BASE',
  NFSC_ETHEREUM = 'NFSC_ETHEREUM',
  NFSC_ETHEREUM_SEPOLIA = 'NFSC_ETHEREUM_SEPOLIA',
  STRIPE = 'STRIPE',
}

export enum CheckoutOrderItemType {
  DOMAIN_REGISTRATION = 'DOMAIN_REGISTRATION',
  DOMAIN_RENEW = 'DOMAIN_RENEW',
  DOMAIN_IMPORT = 'DOMAIN_IMPORT',
  NFSC_PURCHASE = 'NFSC_PURCHASE',
}

export enum CheckoutOrderItemStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum CheckoutOrderStatus {
  CREATED = 'CREATED',
  SUBMITTED = 'SUBMITTED',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PARTIAL_FULFILLMENT = 'PARTIAL_FULFILLMENT',
  CANCELED = 'CANCELED',
}

export enum CartNoteType {
  ITEM_PRICE_CHANGE = 'ITEM_PRICE_CHANGE',
  ITEM_NO_LONGER_AVAILABLE = 'ITEM_NO_LONGER_AVAILABLE',
}

export enum WorkflowStatus {
  CREATED = 'CREATED',
  SUBMITTED = 'SUBMITTED',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

export enum WorkflowStepType {
  REGISTER_DOMAIN = 'REGISTER_DOMAIN',
  MINT_NFSC = 'MINT_NFSC',
}

export enum WorkflowStepStatus {
  CREATED = 'CREATED',
  SUBMITTED = 'SUBMITTED',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

export enum MigrationStatus {
  STARTED = 'STARTED',
  FAILED = 'FAILED',
  SUCCEEDED = 'SUCCEEDED',
  SKIPPED = 'SKIPPED',
}

export enum RenewOption {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
}

// Common Schema Types
export const TokenAmountSchema = new Schema(
  {
    amount: { type: Schema.Types.BigInt, required: true },
    token: { type: String, enum: Object.values(Token), required: true },
  },
  { _id: false },
);

export const MoneyAmountSchema = new Schema(
  {
    amount: { type: Number, required: true },
    currency: { type: String, enum: Object.values(Currency), required: true },
  },
  { _id: false },
);

export const ExtraParamSchema = new Schema(
  {
    name: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

export const FrozenAssetSchema = new Schema(
  {
    amount: { type: String, required: true },
    contractAddress: { type: String, required: true },
    reason: { type: String, required: true },
    reasonType: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

export const ContactDetailsSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    organizationName: String,
    phoneNumber: String,
    phoneNumberVerified: Boolean,
    email: String,
    emailVerified: Boolean,
    fax: String,
    addressLines: { type: [String], default: [] },
    city: String,
    contactType: String,
    countryCode: String,
    state: String,
    zipCode: String,
    extraParams: [ExtraParamSchema],
  },
  { _id: false },
);

export const RenewOperationDetailsSchema = new Schema(
  {
    extendingDurationInYears: { type: Number, required: true },
    expirationDateThen: Date,
    newExpirationDateThen: Date,
    totalChargeAmountNfsc: { type: Number, required: true },
    totalPrice: Number,
    autoRenew: { type: Boolean, default: false },
    gift: { type: Boolean, default: false },
  },
  { _id: false },
);

export const DisableDnssecOperationDetailsSchema = new Schema(
  {
    disableZoneDnssecChangeId: String,
    disableZoneDnssecSubmittedAt: Date,
  },
  { _id: false },
);

export const MintRequestAttemptSchema = new Schema(
  {
    txHash: String,
    createdAt: { type: Date, default: Date.now },
    error: Schema.Types.Mixed,
  },
  { _id: false },
);

export const ServerJobStepsSchema = new Schema(
  {
    id: { type: String, required: true },
    args: {
      type: {
        type: String,
        enum: Object.values(ServerJobArgumentsType),
        default: ServerJobArgumentsType.NAMED,
      },
      value: Schema.Types.Mixed,
    },
    serviceName: { type: String, required: true },
    method: { type: String, required: true },
    keepResponse: { type: Boolean, default: false },
    keepError: { type: Boolean, default: false },
    error: Schema.Types.Mixed,
    response: Schema.Types.Mixed,
    status: {
      type: String,
      enum: Object.values(ServerJobStatus),
      default: ServerJobStatus.PENDING,
    },
    multipleCall: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 2 },
  },
  { _id: false },
);

export const AssetTransfersResultSchema = new Schema(
  {
    uniqueId: { type: String, required: true },
    category: Schema.Types.Mixed,
    blockNum: { type: String, required: true },
    from: { type: String, required: true },
    to: String,
    value: Number,
    erc721TokenId: String,
    erc1155Metadata: Schema.Types.Mixed,
    tokenId: String,
    asset: String,
    hash: { type: String, required: true },
    rawContract: Schema.Types.Mixed,
  },
  { _id: false },
);

export const CreditRecordExtraDataSchema = new Schema(
  {
    assetTransferResult: AssetTransfersResultSchema,
  },
  { _id: false },
);

export const RefundDetailsSchema = new Schema(
  {
    amount: { type: MoneyAmountSchema, required: true },
    status: {
      type: String,
      enum: Object.values(RefundStatus),
      default: RefundStatus.REQUESTED,
    },
    reason: String,
    txHash: String,
    stripeRefundId: String,
  },
  { _id: false },
);

export const CartItemSchema = new Schema(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    type: {
      type: String,
      enum: Object.values(CheckoutOrderItemType),
      required: true,
    },
    chainId: { type: Number, required: true },
    chargeAmount: { type: MoneyAmountSchema, required: true },
    domainNameLdh: String,
    registrar: { type: String, enum: Object.values(NamefiRegistrarOption) },
    durationInYears: Number,
    receivingWalletAddress: String,
    encryptionKeyId: String,
    encryptedEppAuthorizationCode: String,
    mintNfscAmount: Number,
  },
  { _id: false },
);

export const CartNoteSchema = new Schema(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    type: { type: String, enum: Object.values(CartNoteType), required: true },
    oldItem: CartItemSchema,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);
