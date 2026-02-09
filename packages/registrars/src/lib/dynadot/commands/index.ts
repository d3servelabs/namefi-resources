import { DynadotCommand } from '../common-types';
import type {
  DynadotCancelTransferCommandOutput,
  DynadotCancelTransferCommandParams,
} from './cancel_transfer';
import type {
  DynadotClearDnssecCommandOutput,
  DynadotClearDnssecCommandParams,
} from './clear_dnssec';
import type {
  DynadotCreateContactCommandOutput,
  DynadotCreateContactCommandParams,
} from './create_contact';
import type {
  DynadotDomainInfoCommandOutput,
  DynadotDomainInfoCommandParams,
} from './domain_info';
import type {
  DynadotGetAccountBalanceCommandOutput,
  DynadotGetAccountBalanceCommandParams,
} from './get_account_balance';
import type {
  DynadotGetDnssecCommandOutput,
  DynadotGetDnssecCommandParams,
} from './get_dnssec';
import type {
  DynadotGetContactCommandOutput,
  DynadotGetContactCommandParams,
} from './get_contact';
import type {
  DynadotGetNsCommandOutput,
  DynadotGetNsCommandParams,
} from './get_ns';
import type {
  DynadotGetTransferAuthCodeCommandOutput,
  DynadotGetTransferAuthCodeCommandParams,
} from './get_transfer_auth_code';
import type {
  DynadotGetTransferStatusCommandOutput,
  DynadotGetTransferStatusCommandParams,
} from './get_transfer_status';
import type {
  DynadotListDomainCommandOutput,
  DynadotListDomainCommandParams,
} from './list_domain';
import type {
  DynadotLockDomainCommandOutput,
  DynadotLockDomainCommandParams,
} from './lock_domain';
import type {
  DynadotRegisterCommandOutput,
  DynadotRegisterCommandParams,
} from './register';
import type {
  DynadotRenewCommandOutput,
  DynadotRenewCommandParams,
} from './renew';
import type {
  DynadotSearchCommandOutput,
  DynadotSearchCommandParams,
} from './search';
import type {
  DynadotSetClearDomainSettingCommandOutput,
  DynadotSetClearDomainSettingCommandParams,
} from './set_clear_domain_setting';
import type {
  DynadotSetDnssecCommandOutput,
  DynadotSetDnssecCommandParams,
} from './set_dnssec';
import type {
  DynadotSetNsCommandOutput,
  DynadotSetNsCommandParams,
} from './set_ns';
import type {
  DynadotSetPrivacyCommandOutput,
  DynadotSetPrivacyCommandParams,
} from './set_privacy';
import type {
  DynadotSetRenewOptionCommandOutput,
  DynadotSetRenewOptionCommandParams,
} from './set_renew';
import type {
  DynadotSetWhoisCommandOutput,
  DynadotSetWhoisCommandParams,
} from './set_whois';
import type {
  DynadotTldPriceCommandOutput,
  DynadotTldPriceCommandParams,
} from './tld_price';
import type {
  DynadotTransferCommandOutput,
  DynadotTransferCommandParams,
} from './transfer';
import type {
  DynadotUnlockDomainCommandOutput,
  DynadotUnlockDomainCommandParams,
} from './unlock_domain';
import type {
  DynadotAuthorizeTransferAwayCommandOutput,
  DynadotAuthorizeTransferAwayCommandParams,
} from './transfer/authorize_transfer_away';

export * from './create_contact';
export * from './domain_info';
export * from './lock_domain';
export * from './register';
export * from './renew';
export * from './search';
export * from './set_dnssec';
export * from './set_ns';
export * from './set_privacy';
export * from './set_renew';
export * from './set_whois';

export * from './set_clear_domain_setting';
export * from './clear_dnssec';

export * from './tld_price';
export * from './transfer';
export * from './get_transfer_status';
export * from './get_transfer_auth_code';
export * from './get_account_balance';
export * from './list_domain';
export * from './cancel_transfer';
export * from './get_ns';
export * from './get_contact';
export * from './unlock_domain';
export * from './transfer/authorize_transfer_away';

export type DynadotCommandsParams = Record<DynadotCommand, unknown> & {
  [DynadotCommand.search]: DynadotSearchCommandParams;
  [DynadotCommand.register]: DynadotRegisterCommandParams;
  [DynadotCommand.transfer]: DynadotTransferCommandParams;
  [DynadotCommand.cancel_transfer]: DynadotCancelTransferCommandParams;
  [DynadotCommand.tld_price]: DynadotTldPriceCommandParams;
  [DynadotCommand.lock_domain]: DynadotLockDomainCommandParams;
  [DynadotCommand.domain_info]: DynadotDomainInfoCommandParams;
  [DynadotCommand.renew]: DynadotRenewCommandParams;
  [DynadotCommand.set_ns]: DynadotSetNsCommandParams;
  [DynadotCommand.get_ns]: DynadotGetNsCommandParams;
  [DynadotCommand.set_whois]: DynadotSetWhoisCommandParams;
  [DynadotCommand.set_dnssec]: DynadotSetDnssecCommandParams;
  [DynadotCommand.get_dnssec]: DynadotGetDnssecCommandParams;
  [DynadotCommand.clear_dnssec]: DynadotClearDnssecCommandParams;
  [DynadotCommand.set_clear_domain_setting]: DynadotSetClearDomainSettingCommandParams;
  [DynadotCommand.set_renew_option]: DynadotSetRenewOptionCommandParams;
  [DynadotCommand.set_privacy]: DynadotSetPrivacyCommandParams;
  [DynadotCommand.create_contact]: DynadotCreateContactCommandParams;
  [DynadotCommand.get_transfer_auth_code]: DynadotGetTransferAuthCodeCommandParams;
  [DynadotCommand.get_transfer_status]: DynadotGetTransferStatusCommandParams;
  [DynadotCommand.get_contact]: DynadotGetContactCommandParams;
  [DynadotCommand.get_account_balance]: DynadotGetAccountBalanceCommandParams;
  [DynadotCommand.list_domain]: DynadotListDomainCommandParams;
  [DynadotCommand.unlock_domain]: DynadotUnlockDomainCommandParams;
  [DynadotCommand.authorize_transfer_away]: DynadotAuthorizeTransferAwayCommandParams;
};
export type DynadotCommandOutput = Record<DynadotCommand, unknown> & {
  [DynadotCommand.search]: DynadotSearchCommandOutput;
  [DynadotCommand.register]: DynadotRegisterCommandOutput;
  [DynadotCommand.cancel_transfer]: DynadotCancelTransferCommandOutput;
  [DynadotCommand.transfer]: DynadotTransferCommandOutput;
  [DynadotCommand.tld_price]: DynadotTldPriceCommandOutput;
  [DynadotCommand.lock_domain]: DynadotLockDomainCommandOutput;
  [DynadotCommand.domain_info]: DynadotDomainInfoCommandOutput;
  [DynadotCommand.renew]: DynadotRenewCommandOutput;
  [DynadotCommand.set_ns]: DynadotSetNsCommandOutput;
  [DynadotCommand.get_ns]: DynadotGetNsCommandOutput;
  [DynadotCommand.set_whois]: DynadotSetWhoisCommandOutput;
  [DynadotCommand.set_dnssec]: DynadotSetDnssecCommandOutput;
  [DynadotCommand.get_dnssec]: DynadotGetDnssecCommandOutput;
  [DynadotCommand.clear_dnssec]: DynadotClearDnssecCommandOutput;
  [DynadotCommand.set_clear_domain_setting]: DynadotSetClearDomainSettingCommandOutput;
  [DynadotCommand.set_renew_option]: DynadotSetRenewOptionCommandOutput;
  [DynadotCommand.set_privacy]: DynadotSetPrivacyCommandOutput;
  [DynadotCommand.create_contact]: DynadotCreateContactCommandOutput;
  [DynadotCommand.get_transfer_auth_code]: DynadotGetTransferAuthCodeCommandOutput;
  [DynadotCommand.get_transfer_status]: DynadotGetTransferStatusCommandOutput;
  [DynadotCommand.get_contact]: DynadotGetContactCommandOutput;
  [DynadotCommand.get_account_balance]: DynadotGetAccountBalanceCommandOutput;
  [DynadotCommand.list_domain]: DynadotListDomainCommandOutput;
  [DynadotCommand.unlock_domain]: DynadotUnlockDomainCommandOutput;
  [DynadotCommand.authorize_transfer_away]: DynadotAuthorizeTransferAwayCommandOutput;
};
