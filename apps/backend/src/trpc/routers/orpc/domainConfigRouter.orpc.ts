import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';
import {
  getDomainPreferencesAndConfig,
  updateDomainPreferencesAndConfig,
} from '#lib/domains/domain-preferences';
import { audit, createAuditRecord, ResourceType } from '#lib/auditor';
import { logger } from '#lib/logger';
import { createTRPCRouter, protectedProcedure } from '../../base';
import { assertAuthenticatedUserIsDomainOwner } from '../../guards/assert-domain-owner';
import { orpcMetaWithEip712FromZodSchema } from '#lib/eip712/orpc-meta-from-zod-schemas';

// ============================================================================
// Schemas
// ============================================================================

const successResponseSchema = z.object({
  success: z.boolean(),
});

const ToggleAutoRenew = z
  .object({
    normalizedDomainName: namefiNormalizedDomainSchema,
    enableAutoRenew: z.boolean(),
  })
  .meta({
    name: 'ToggleAutoRenew',
    description: 'ToggleAutoRenew',
    eip712: { structName: 'ToggleAutoRenew' },
  });

// ============================================================================
// Router Definition
// ============================================================================

export const domainConfigRouterOrpc = createTRPCRouter({
  /**
   * Toggle automatic renewal for a domain
   */
  toggleAutoRenew: protectedProcedure
    .meta(
      orpcMetaWithEip712FromZodSchema([ToggleAutoRenew], {
        route: {
          path: '/domain-config/auto-renew',
          method: 'PUT',
          tags: ['domain-config', 'EIP712'],
          operationId: 'toggleAutoRenew',
          summary: 'Toggle domain auto-renewal',
          description:
            'Enable or disable automatic renewal for a domain. When enabled, the domain will be renewed automatically before expiration using the available payment methods on the owner wallet.',
        },
      }),
    )
    .input(ToggleAutoRenew)
    .output(successResponseSchema)
    .mutation(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );

      try {
        await updateDomainPreferencesAndConfig(
          input.normalizedDomainName,
          ctx.user.id,
          { autoRenewEnabled: input.enableAutoRenew },
        );

        audit(
          createAuditRecord({
            actorType: 'user',
            actorId: ctx.user.id,
            resourceType: ResourceType.DOMAIN,
            resourceId: input.normalizedDomainName,
            action: 'update_auto_renew',
            extraInput: {
              autoRenewEnabled: input.enableAutoRenew,
            },
          }),
        );

        return { success: true };
      } catch (error) {
        logger.error(
          { error, domainName: input.normalizedDomainName },
          'Failed to toggle auto-renew for domain',
        );
        throw error;
      }
    }),

  /**
   * Get the auto-renewal status for a domain
   */
  getAutoRenew: protectedProcedure
    .meta({
      route: {
        path: '/domain-config/auto-renew',
        method: 'GET',
        tags: ['domain-config'],
        operationId: 'getAutoRenew',
        summary: 'Get domain auto-renewal status',
        description:
          'Check whether automatic renewal is enabled for a domain. Requires domain ownership.',
      },
    })
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
      }),
    )
    .output(z.object({ autoRenewEnabled: z.boolean() }))
    .query(async ({ input, ctx }) => {
      await assertAuthenticatedUserIsDomainOwner(
        input.normalizedDomainName,
        ctx.user,
      );

      const { autoRenewEnabled } = await getDomainPreferencesAndConfig(
        input.normalizedDomainName,
      );

      return { autoRenewEnabled };
    }),
});
