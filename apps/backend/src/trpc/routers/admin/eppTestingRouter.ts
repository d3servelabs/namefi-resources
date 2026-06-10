import {
  auditedAdminProcedureWithPermissions,
  adminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminEppTestingContract } from '@namefi-astra/common/contract/admin/admin-epp-testing-contract';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { logger } from '#lib/logger';
import { getCentralnicOte2Registrar } from '#lib/epp-registrars/centralnic';
import {
  toPunycodeDomainName,
  type PunycodeDomainName,
} from '@namefi-astra/registrars/data/validations';
import { ResourceType } from '#lib/auditor';
import type {
  RegisterDomainInput,
  TransferDomainInput,
} from '@namefi-astra/registrars/abstract-registrar/types';
import { DomainContactPrivacyEnum } from '@namefi-astra/registrars/data/types';

const normalizeDomainName = (val: string): PunycodeDomainName =>
  toPunycodeDomainName(val.toLowerCase().trim());

/**
 * EPP Testing Router - Admin-only operations for CentralNic OTE2
 * Used for testing domain transfers in/out in OTE environment
 */
export const eppTestingRouter = createContractTRPCRouter<
  typeof adminEppTestingContract
>({
  /**
   * Create a new domain on OTE2 for testing
   */
  createDomain: auditedAdminProcedureWithPermissions(
    Permission.EPP_TESTING,
    ({ ctx, input }) => ({
      actorType: 'admin' as const,
      actorId: ctx.user.id,
      resourceType: ResourceType.EPP_TESTING,
      resourceId: input.domainName,
      action: 'create_domain',
      extraInput: { domainName: input.domainName, years: input.years },
    }),
  )
    .input(adminEppTestingContract.createDomain.input)
    .output(adminEppTestingContract.createDomain.output)
    .mutation(async ({ input }) => {
      const domainName = normalizeDomainName(input.domainName);
      const { years } = input;

      logger.debug({ domainName, years }, 'Creating domain on OTE2');

      try {
        const registrar = getCentralnicOte2Registrar();
        const result = await registrar.registerDomain({
          domainName,
          durationInYears: years,
          renewOption: 'MANUAL',
          contacts: {} as any,
          privacy: DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA,
        } satisfies RegisterDomainInput);

        logger.debug({ domainName, result }, 'Domain creation result');

        return {
          success: result.status === 'SUCCESSFUL',
          operationId: result.operationId,
          status: result.status,
          message: result.message,
          response: result.response,
        };
      } catch (error) {
        logger.error({ error, domainName }, 'Failed to create domain on OTE2');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to create domain',
          cause: error,
        });
      }
    }),

  /**
   * Get domain info from OTE2
   */
  getDomainInfo: adminProcedureWithPermissions(Permission.EPP_TESTING)
    .input(adminEppTestingContract.getDomainInfo.input)
    .output(adminEppTestingContract.getDomainInfo.output)
    .query(async ({ input }) => {
      const domainName = normalizeDomainName(input.domainName);

      logger.debug({ domainName }, 'Getting domain info from OTE2');

      try {
        const registrar = getCentralnicOte2Registrar();
        const details = await registrar.getDomainDetails(domainName);

        return {
          success: true,
          domain: details,
        };
      } catch (error) {
        logger.error(
          { error, domainName },
          'Failed to get domain info from OTE2',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to get domain info',
          cause: error,
        });
      }
    }),

  /**
   * Change/retrieve auth code for a domain
   */
  changeAuthCode: auditedAdminProcedureWithPermissions(
    Permission.EPP_TESTING,
    ({ ctx, input }) => ({
      actorType: 'admin' as const,
      actorId: ctx.user.id,
      resourceType: ResourceType.EPP_TESTING,
      resourceId: input.domainName,
      action: 'change_authcode',
      extraInput: { domainName: input.domainName },
    }),
  )
    .input(adminEppTestingContract.changeAuthCode.input)
    .output(adminEppTestingContract.changeAuthCode.output)
    .mutation(async ({ input }) => {
      const domainName = normalizeDomainName(input.domainName);

      logger.debug({ domainName }, 'Changing auth code on OTE2');

      try {
        const registrar = getCentralnicOte2Registrar();
        const authCode = await registrar.retrieveAuthCode(domainName);

        logger.debug({ domainName }, 'Auth code changed successfully');

        return {
          success: true,
          authCode,
          domainName,
        };
      } catch (error) {
        logger.error({ error, domainName }, 'Failed to change auth code');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to change auth code',
          cause: error,
        });
      }
    }),

  /**
   * Query pending transfer status
   */
  queryTransfer: adminProcedureWithPermissions(Permission.EPP_TESTING)
    .input(adminEppTestingContract.queryTransfer.input)
    .output(adminEppTestingContract.queryTransfer.output)
    .query(async ({ input }) => {
      const domainName = normalizeDomainName(input.domainName);

      logger.debug({ domainName }, 'Querying transfer status on OTE2');

      try {
        const registrar = getCentralnicOte2Registrar();
        const transferInfo = await registrar.queryPendingTransfer(domainName);

        return {
          success: true,
          hasPendingTransfer: transferInfo !== null,
          transfer: transferInfo,
        };
      } catch (error) {
        logger.error({ error, domainName }, 'Failed to query transfer status');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to query transfer status',
          cause: error,
        });
      }
    }),

  /**
   * Request transfer of a domain (transfer in)
   */
  requestTransfer: auditedAdminProcedureWithPermissions(
    Permission.EPP_TESTING,
    ({ ctx, input }) => ({
      actorType: 'admin' as const,
      actorId: ctx.user.id,
      resourceType: ResourceType.EPP_TESTING,
      resourceId: input.domainName,
      action: 'request_transfer',
      extraInput: { domainName: input.domainName },
    }),
  )
    .input(adminEppTestingContract.requestTransfer.input)
    .output(adminEppTestingContract.requestTransfer.output)
    .mutation(async ({ input }) => {
      const domainName = normalizeDomainName(input.domainName);
      const { authCode } = input;

      logger.debug({ domainName }, 'Requesting transfer on OTE2');

      try {
        const registrar = getCentralnicOte2Registrar();
        const result = await registrar.transferDomain({
          domainName,
          authCode,
          contacts: {} as any,
          privacy: DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA,
          nameservers: [],
        } satisfies TransferDomainInput);

        logger.debug({ domainName, result }, 'Transfer request result');

        return {
          success:
            result.status === 'SUCCESSFUL' || result.status === 'IN_PROGRESS',
          operationId: result.operationId,
          status: result.status,
          message: result.message,
          response: result.response,
        };
      } catch (error) {
        logger.error({ error, domainName }, 'Failed to request transfer');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to request transfer',
          cause: error,
        });
      }
    }),

  /**
   * Approve incoming transfer
   */
  approveTransfer: auditedAdminProcedureWithPermissions(
    Permission.EPP_TESTING,
    ({ ctx, input }) => ({
      actorType: 'admin' as const,
      actorId: ctx.user.id,
      resourceType: ResourceType.EPP_TESTING,
      resourceId: input.domainName,
      action: 'approve_transfer',
      extraInput: { domainName: input.domainName },
    }),
  )
    .input(adminEppTestingContract.approveTransfer.input)
    .output(adminEppTestingContract.approveTransfer.output)
    .mutation(async ({ input }) => {
      const domainName = normalizeDomainName(input.domainName);

      logger.debug({ domainName }, 'Approving transfer on OTE2');

      try {
        const registrar = getCentralnicOte2Registrar();
        const result = await registrar.approveTransfer(domainName);

        logger.debug({ domainName, result }, 'Transfer approval result');

        return {
          success: result.status === 'SUCCESSFUL',
          operationId: result.operationId,
          status: result.status,
          message: result.message,
          response: result.response,
        };
      } catch (error) {
        logger.error({ error, domainName }, 'Failed to approve transfer');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to approve transfer',
          cause: error,
        });
      }
    }),

  /**
   * Reject incoming transfer
   */
  rejectTransfer: auditedAdminProcedureWithPermissions(
    Permission.EPP_TESTING,
    ({ ctx, input }) => ({
      actorType: 'admin' as const,
      actorId: ctx.user.id,
      resourceType: ResourceType.EPP_TESTING,
      resourceId: input.domainName,
      action: 'reject_transfer',
      extraInput: { domainName: input.domainName },
    }),
  )
    .input(adminEppTestingContract.rejectTransfer.input)
    .output(adminEppTestingContract.rejectTransfer.output)
    .mutation(async ({ input }) => {
      const domainName = normalizeDomainName(input.domainName);

      logger.debug({ domainName }, 'Rejecting transfer on OTE2');

      try {
        const registrar = getCentralnicOte2Registrar();
        const result = await registrar.rejectTransfer(domainName);

        logger.debug({ domainName, result }, 'Transfer rejection result');

        return {
          success: result.status === 'SUCCESSFUL',
          operationId: result.operationId,
          status: result.status,
          message: result.message,
          response: result.response,
        };
      } catch (error) {
        logger.error({ error, domainName }, 'Failed to reject transfer');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to reject transfer',
          cause: error,
        });
      }
    }),

  /**
   * Lock domain (prevent transfers)
   */
  lockDomain: auditedAdminProcedureWithPermissions(
    Permission.EPP_TESTING,
    ({ ctx, input }) => ({
      actorType: 'admin' as const,
      actorId: ctx.user.id,
      resourceType: ResourceType.EPP_TESTING,
      resourceId: input.domainName,
      action: 'lock_domain',
      extraInput: { domainName: input.domainName },
    }),
  )
    .input(adminEppTestingContract.lockDomain.input)
    .output(adminEppTestingContract.lockDomain.output)
    .mutation(async ({ input }) => {
      const domainName = normalizeDomainName(input.domainName);

      logger.debug({ domainName }, 'Locking domain on OTE2');

      try {
        const registrar = getCentralnicOte2Registrar();
        const result = await registrar.lockDomain(domainName);

        return {
          success: result.status === 'SUCCESSFUL',
          operationId: result.operationId,
          status: result.status,
          message: result.message,
        };
      } catch (error) {
        logger.error({ error, domainName }, 'Failed to lock domain');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to lock domain',
          cause: error,
        });
      }
    }),

  /**
   * Unlock domain (allow transfers)
   */
  unlockDomain: auditedAdminProcedureWithPermissions(
    Permission.EPP_TESTING,
    ({ ctx, input }) => ({
      actorType: 'admin' as const,
      actorId: ctx.user.id,
      resourceType: ResourceType.EPP_TESTING,
      resourceId: input.domainName,
      action: 'unlock_domain',
      extraInput: { domainName: input.domainName },
    }),
  )
    .input(adminEppTestingContract.unlockDomain.input)
    .output(adminEppTestingContract.unlockDomain.output)
    .mutation(async ({ input }) => {
      const domainName = normalizeDomainName(input.domainName);

      logger.debug({ domainName }, 'Unlocking domain on OTE2');

      try {
        const registrar = getCentralnicOte2Registrar();
        const result = await registrar.unlockDomain(domainName);

        return {
          success: result.status === 'SUCCESSFUL',
          operationId: result.operationId,
          status: result.status,
          message: result.message,
        };
      } catch (error) {
        logger.error({ error, domainName }, 'Failed to unlock domain');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to unlock domain',
          cause: error,
        });
      }
    }),

  /**
   * Check domain availability
   */
  checkAvailability: adminProcedureWithPermissions(Permission.EPP_TESTING)
    .input(adminEppTestingContract.checkAvailability.input)
    .output(adminEppTestingContract.checkAvailability.output)
    .query(async ({ input }) => {
      const domainName = normalizeDomainName(input.domainName);

      logger.debug({ domainName }, 'Checking domain availability on OTE2');

      try {
        const registrar = getCentralnicOte2Registrar();
        const results = await registrar.bulkSearch([domainName]);
        const result = results[0];

        if (!result) {
          throw new Error('No result returned from availability check');
        }

        return {
          success: true,
          available: result.available,
          domainName: result.domainName,
          price: result.price,
        };
      } catch (error) {
        logger.error(
          { error, domainName },
          'Failed to check domain availability',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to check availability',
          cause: error,
        });
      }
    }),
});
