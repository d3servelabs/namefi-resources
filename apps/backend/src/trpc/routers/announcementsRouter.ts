import { announcementsTable, db } from '@namefi-astra/db';
import {
  type AnnouncementDto,
  MAIN_SITE_TARGET,
  announcementsContract,
} from '@namefi-astra/common/contract/announcements-contract';
import {
  and,
  arrayContains,
  desc,
  eq,
  gte,
  isNull,
  lte,
  or,
} from 'drizzle-orm';
import { evaluateAnnouncementCondition } from '#lib/announcements/evaluate-condition';
import { getTldPricingTable, type TldPricingInfo } from '#lib/namefi-registry';
import { authedOrPublicProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';

type AnnouncementRow = typeof announcementsTable.$inferSelect;

function toDto(row: AnnouncementRow): AnnouncementDto {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    backgroundColor: row.backgroundColor,
    textColor: row.textColor,
    backgroundOpacity: row.backgroundOpacity,
    linkUrl: row.linkUrl,
    linkLabel: row.linkLabel,
    dismissible: row.dismissible,
    priority: row.priority,
    updatedAt: row.updatedAt,
  };
}

/**
 * Public, unauthenticated read for the announcements banner.
 *
 * Returns only announcements that are active, within their scheduling window,
 * and whose conditional rule (if any) currently holds. Condition evaluation
 * shares a single pricing-table fetch per request (and only fetches at all
 * when at least one candidate has a condition).
 */
export const announcementsRouter = createContractTRPCRouter<
  typeof announcementsContract
>({
  getActive: authedOrPublicProcedure
    .input(announcementsContract.getActive.input)
    .output(announcementsContract.getActive.output)
    .query(async ({ ctx }) => {
      const now = new Date();

      // The request's origin determines the site key: the PBN's normalized
      // domain name, or `MAIN_SITE_TARGET` for the main Namefi site. Show
      // announcements whose `targetSites` set contains that key.
      const siteKey = ctx.poweredByNamefiDomain ?? MAIN_SITE_TARGET;
      const siteFilter = arrayContains(announcementsTable.targetSites, [
        siteKey,
      ]);

      const rows = await db
        .select()
        .from(announcementsTable)
        .where(
          and(
            eq(announcementsTable.isActive, true),
            siteFilter,
            or(
              isNull(announcementsTable.startsAt),
              lte(announcementsTable.startsAt, now),
            ),
            or(
              isNull(announcementsTable.endsAt),
              gte(announcementsTable.endsAt, now),
            ),
          ),
        )
        .orderBy(
          desc(announcementsTable.priority),
          desc(announcementsTable.createdAt),
        );

      // Only fetch pricing if at least one candidate is conditional.
      const hasConditions = rows.some((row) => row.condition != null);
      let pricingPromise: Promise<TldPricingInfo[]> | null = null;
      const getPricingTable = () => {
        pricingPromise ??= getTldPricingTable();
        return pricingPromise;
      };

      if (!hasConditions) {
        return { items: rows.map(toDto) };
      }

      const items: AnnouncementDto[] = [];
      for (const row of rows) {
        const applies = await evaluateAnnouncementCondition(row.condition, {
          getPricingTable,
        });
        if (applies) items.push(toDto(row));
      }

      return { items };
    }),
});
