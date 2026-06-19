import {
  announcementsTable,
  db,
  poweredbyNamefiDomainsTable,
} from '@namefi-astra/db';
import type {
  AnnouncementCondition,
  PriceOperand,
} from '@namefi-astra/common/announcements-condition';
import { adminAnnouncementsContract } from '@namefi-astra/common/contract/admin/admin-announcements-contract';
import { Permission } from '@namefi-astra/utils';
import { asc, desc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import {
  evaluateConditionWithDetail,
  normalizeTld,
} from '#lib/announcements/evaluate-condition';
import { getTldPricingTable, type TldPricingInfo } from '#lib/namefi-registry';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';

/**
 * Admin CRUD for announcements.
 *
 * `list` is read-only (`ANNOUNCEMENTS;;READ`); create/update/remove are
 * audited and gated on `ANNOUNCEMENTS;;WRITE` — the banner is a site-wide,
 * unauthenticated surface, so changes are sensitive. `tld` operands have their
 * value normalized on write so lookups against the pricing table are stable.
 */

/** Normalize a TLD operand's `tld` value; literals pass through unchanged. */
function normalizeOperand(operand: PriceOperand): PriceOperand {
  if (operand.kind === 'tld') {
    return { ...operand, tld: normalizeTld(operand.tld) };
  }
  return operand;
}

/** Normalize a condition's mutable fields before persistence. */
function normalizeCondition(
  condition: AnnouncementCondition | null | undefined,
): AnnouncementCondition | null {
  if (!condition) return null;
  if (condition.type === 'PRICE_COMPARE') {
    return {
      ...condition,
      left: normalizeOperand(condition.left),
      right: normalizeOperand(condition.right),
    };
  }
  return condition;
}

export const adminAnnouncementsRouter = createContractTRPCRouter<
  typeof adminAnnouncementsContract
>({
  list: adminProcedureWithPermissions(Permission.READ_ANNOUNCEMENTS)
    .input(adminAnnouncementsContract.list.input)
    .output(adminAnnouncementsContract.list.output)
    .query(async () => {
      const rows = await db
        .select()
        .from(announcementsTable)
        .orderBy(
          desc(announcementsTable.priority),
          desc(announcementsTable.createdAt),
        );

      // Evaluate each condition for the admin table (check/X + tooltip), so
      // admins can see whether a rule currently holds. Shares one pricing fetch.
      let pricingPromise: Promise<TldPricingInfo[]> | null = null;
      const getPricingTable = () => {
        pricingPromise ??= getTldPricingTable();
        return pricingPromise;
      };

      const items = await Promise.all(
        rows.map(async (row) => {
          if (!row.condition) {
            return { ...row, conditionMet: null, conditionDetail: null };
          }
          try {
            const { met, detail } = await evaluateConditionWithDetail(
              row.condition,
              { getPricingTable },
            );
            return { ...row, conditionMet: met, conditionDetail: detail };
          } catch (error) {
            return {
              ...row,
              conditionMet: false,
              conditionDetail: `Error: ${error instanceof Error ? error.message : String(error)}`,
            };
          }
        }),
      );

      return { items };
    }),

  listSiteTargets: adminProcedureWithPermissions(Permission.READ_ANNOUNCEMENTS)
    .input(adminAnnouncementsContract.listSiteTargets.input)
    .output(adminAnnouncementsContract.listSiteTargets.output)
    .query(async () => {
      const rows = await db
        .select({ domain: poweredbyNamefiDomainsTable.normalizedDomainName })
        .from(poweredbyNamefiDomainsTable)
        .orderBy(asc(poweredbyNamefiDomainsTable.normalizedDomainName));
      return { pbnDomains: rows.map((r) => r.domain) };
    }),

  create: auditedAdminProcedureWithPermissions(
    [Permission.WRITE_ANNOUNCEMENTS],
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'announcement',
      resourceId: 'new',
      action: 'create_announcement',
      extraInput: input,
    }),
  )
    .input(adminAnnouncementsContract.create.input)
    .output(adminAnnouncementsContract.create.output)
    .mutation(async ({ input }) => {
      const [row] = await db
        .insert(announcementsTable)
        .values({
          title: input.title ?? null,
          body: input.body,
          backgroundColor: input.backgroundColor ?? null,
          textColor: input.textColor ?? null,
          backgroundOpacity: input.backgroundOpacity ?? null,
          linkUrl: input.linkUrl ?? null,
          linkLabel: input.linkLabel ?? null,
          linkTarget: input.linkTarget ?? null,
          dismissible: input.dismissible,
          isActive: input.isActive,
          targetSites: input.targetSites,
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
          priority: input.priority,
          condition: normalizeCondition(input.condition),
        })
        .returning({ id: announcementsTable.id });

      return { id: row.id };
    }),

  update: auditedAdminProcedureWithPermissions(
    [Permission.WRITE_ANNOUNCEMENTS],
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'announcement',
      resourceId: input.id,
      action: 'update_announcement',
      extraInput: input,
    }),
  )
    .input(adminAnnouncementsContract.update.input)
    .output(adminAnnouncementsContract.update.output)
    .mutation(async ({ input }) => {
      const { id, condition, ...rest } = input;

      // Only set the fields that were provided. `condition` is special-cased
      // because `null` is a meaningful value (clear the condition).
      const patch: Partial<typeof announcementsTable.$inferInsert> = {};
      if (rest.title !== undefined) patch.title = rest.title;
      if (rest.body !== undefined) patch.body = rest.body;
      if (rest.backgroundColor !== undefined)
        patch.backgroundColor = rest.backgroundColor;
      if (rest.textColor !== undefined) patch.textColor = rest.textColor;
      if (rest.backgroundOpacity !== undefined)
        patch.backgroundOpacity = rest.backgroundOpacity;
      if (rest.linkUrl !== undefined) patch.linkUrl = rest.linkUrl;
      if (rest.linkLabel !== undefined) patch.linkLabel = rest.linkLabel;
      if (rest.linkTarget !== undefined) patch.linkTarget = rest.linkTarget;
      if (rest.dismissible !== undefined) patch.dismissible = rest.dismissible;
      if (rest.isActive !== undefined) patch.isActive = rest.isActive;
      if (rest.targetSites !== undefined) patch.targetSites = rest.targetSites;
      if (rest.startsAt !== undefined) patch.startsAt = rest.startsAt;
      if (rest.endsAt !== undefined) patch.endsAt = rest.endsAt;
      if (rest.priority !== undefined) patch.priority = rest.priority;
      if (condition !== undefined)
        patch.condition = normalizeCondition(condition);

      const [row] = await db
        .update(announcementsTable)
        .set(patch)
        .where(eq(announcementsTable.id, id))
        .returning({ id: announcementsTable.id });

      if (!row) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Announcement not found',
        });
      }

      return { id: row.id };
    }),

  remove: auditedAdminProcedureWithPermissions(
    [Permission.WRITE_ANNOUNCEMENTS],
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'announcement',
      resourceId: input.id,
      action: 'delete_announcement',
      extraInput: input,
    }),
  )
    .input(adminAnnouncementsContract.remove.input)
    .output(adminAnnouncementsContract.remove.output)
    .mutation(async ({ input }) => {
      const deleted = await db
        .delete(announcementsTable)
        .where(eq(announcementsTable.id, input.id))
        .returning({ id: announcementsTable.id });

      return { success: deleted.length > 0 };
    }),
});
