import {
  domainTagsTable,
  namefiNftOwnersView,
  namefiNftOwnersCte,
  orderItemsTable,
  ordersTable,
} from '@namefi-astra/db';
import { db } from '@namefi-astra/db';
import {
  getTagOfEnglishWordClubFromTagId,
  getTagOfLangFromTagId,
  getTagOfLengthOfLastSegmentFromTagId,
  getTagOfNumberClubFromTagId,
  getTagOfTldFromTagId,
} from '@namefi/cat';
import { getTags } from '@namefi/cat';
import { asc, eq, getTableColumns, ilike, isNull, sql } from 'drizzle-orm';
import { filter, isNotNil, pick, pluck } from 'ramda';
import { logger } from './logger';

type TagDetails = Awaited<ReturnType<typeof getTags>>[number];
/**
 * Check domains with no categories
 */
export const checkDomainsWithNoCategories = async () => {
  const domains = await db
    .with(namefiNftOwnersCte)
    .select({
      normalizedDomainName: namefiNftOwnersView.normalizedDomainName,
    })
    .from(namefiNftOwnersView)
    .leftJoin(
      domainTagsTable,
      eq(
        namefiNftOwnersView.normalizedDomainName,
        domainTagsTable.normalizedDomainName,
      ),
    )
    .where(isNull(domainTagsTable.tag));
  return pluck('normalizedDomainName', domains);
};

/**
 * Add categories to domains with no categories
 */
export const addCategoriesToDomainsWithNoCategories = async () => {
  const domains = await checkDomainsWithNoCategories();
  const newValues = domains.flatMap((domain) => {
    const tags = getTags(domain);

    return tags.map((tag) => ({
      normalizedDomainName: domain,
      tag: tag.id,
    }));
  });
  if (newValues.length > 0) {
    await db.insert(domainTagsTable).values(newValues);
  }
};

/**
 * Get distinct tags
 */
export const getDistinctTagIdsFromDb = async (
  parentDomainName?: string | null,
) => {
  let tagsQuery = db
    .selectDistinctOn([domainTagsTable.tag], { tag: domainTagsTable.tag })
    .from(domainTagsTable)
    .orderBy(asc(domainTagsTable.tag))
    .$dynamic();
  if (parentDomainName) {
    tagsQuery = tagsQuery.where(
      ilike(domainTagsTable.normalizedDomainName, `%.${parentDomainName}`),
    );
  }
  const tags = await tagsQuery;
  return pluck('tag', tags);
};

export const getDistinctTagsWithDetails = async (
  parentDomainName?: string | null,
): Promise<TagDetails[]> => {
  const tagIds = await getDistinctTagIdsFromDb(parentDomainName);
  const tags = filter(
    isNotNil,
    tagIds.map((tagId) => {
      try {
        return getTagDetailsFromTagId(tagId);
      } catch (error) {
        logger.warn(`Error getting tag details for tag id: ${tagId}`, error);
        return null;
      }
    }),
  );
  return tags;
};

/**
 * Get tag details from tag id
 * @param tagId
 * @returns tag details
 */
function getTagDetailsFromTagId(tagId: string): TagDetails {
  if (tagId.startsWith('num_')) {
    return getTagOfNumberClubFromTagId(tagId);
  }
  if (tagId.startsWith('lang_')) {
    return getTagOfLangFromTagId(tagId);
  }
  if (tagId.startsWith('length_')) {
    return getTagOfLengthOfLastSegmentFromTagId(tagId);
  }
  if (tagId.startsWith('tld_')) {
    return getTagOfTldFromTagId(tagId);
  }
  if (tagId.startsWith('en_') || tagId.startsWith('ewc_')) {
    return getTagOfEnglishWordClubFromTagId(tagId.replace(/^en_/, 'ewc_'));
  }
  throw new Error(`Unknown tag id: ${tagId}`);
}

/**
 * Get clubs with stats
 * @param parentDomainName
 * @returns clubs with stats
 */
export async function getClubsCategoriesWithStats(
  parentDomainName?: string | null,
) {
  const domainTagsStatsCte = domainTagsStatsCteFactory(parentDomainName);
  const domainsWithCategories = await db
    .with(domainTagsStatsCte)
    .select()
    .from(domainTagsStatsCte);

  return domainsWithCategories.map((club) => ({
    ...club,
    tagDetails: getTagDetailsFromTagId(club.tag),
  }));
}

/**
 * View to join domain tags with nft and order items
 */
export const domainTagsWithNftAndOrderItemsCte = db
  .$with('domain_tags_with_nft_and_order_items_cte')
  .as((qb) =>
    qb
      .with(namefiNftOwnersCte)
      .select({
        ...pick(
          ['createdAt', 'status', 'amountInUSDCents', 'orderId'],
          getTableColumns(orderItemsTable),
        ),
        normalizedDomainName: domainTagsTable.normalizedDomainName,
        tag: domainTagsTable.tag,
        chainId: namefiNftOwnersView.chainId,
        ownerAddress: namefiNftOwnersView.ownerAddress,
        asOfBlockNumber: namefiNftOwnersView.asOfBlockNumber,
        orderStatus: sql<string>`orders.status`.as('order_status'),
        orderUserId: sql<string>`orders.user_id`.as('order_user_id'),
        orderPaymentId: sql<string>`orders.payment_id`.as('order_payment_id'),
      })
      .from(domainTagsTable)
      .leftJoin(
        namefiNftOwnersView,
        eq(
          domainTagsTable.normalizedDomainName,
          namefiNftOwnersView.normalizedDomainName,
        ),
      )
      .leftJoin(
        orderItemsTable,
        eq(
          domainTagsTable.normalizedDomainName,
          orderItemsTable.normalizedDomainName,
        ),
      )
      .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
      .orderBy(
        asc(orderItemsTable.createdAt),
        asc(domainTagsTable.normalizedDomainName),
      ),
  );

/**
 * CTE to join domain tags with nft and order items and payments
 * This CTE is used to get the amount spent per chain id for each tag
 * and the amount spent per chain id in the last 30 days for each tag
 */
export const domainTagsStatsCteFactory = (parentDomainName?: string | null) =>
  db.$with('domain_tags_stats_cte').as((qb) => {
    const innerCte = qb.$with('domain_tags_stats_cte_inner_cte').as((qb) => {
      let innerCteQuery = qb
        .with(domainTagsWithNftAndOrderItemsCte)
        .select({
          tag: domainTagsWithNftAndOrderItemsCte.tag,
          chainId: domainTagsWithNftAndOrderItemsCte.chainId,
          distinctOwnerAddresses:
            sql<string>`jsonb_agg(distinct ${domainTagsWithNftAndOrderItemsCte.ownerAddress})`.as(
              'distinct_owner_addresses',
            ),
          count:
            sql<number>`count(${domainTagsWithNftAndOrderItemsCte.chainId})::integer`.as(
              'count',
            ),
          amountSpentInUsdCents:
            sql<number>`sum(${domainTagsWithNftAndOrderItemsCte.amountInUSDCents})::double precision`.as(
              'amount_spent_in_usd_cents',
            ),
          amountSpentInUsdCentsInLast30Days:
            sql<number>`sum(${domainTagsWithNftAndOrderItemsCte.amountInUSDCents}) filter (where ${domainTagsWithNftAndOrderItemsCte.createdAt} > now() - interval '30 days')::double precision`.as(
              'amount_spent_in_usd_cents_in_last_30_days',
            ),
        })
        .from(domainTagsWithNftAndOrderItemsCte)
        .$dynamic()
        .groupBy(
          domainTagsWithNftAndOrderItemsCte.tag,
          domainTagsWithNftAndOrderItemsCte.chainId,
        );
      if (parentDomainName) {
        innerCteQuery = innerCteQuery.where(
          ilike(
            domainTagsWithNftAndOrderItemsCte.normalizedDomainName,
            `%.${parentDomainName}`,
          ),
        );
      }
      return innerCteQuery;
    });

    return qb
      .with(innerCte)
      .select({
        tag: innerCte.tag,
        distinctOwnerAddressesArray:
          sql<string>`jsonb_flatten_agg(${innerCte.distinctOwnerAddresses})`.as(
            'distinct_owner_addresses',
          ),
        distinctChainIds:
          sql<number>`array_agg(distinct ${innerCte.chainId})`.as(
            'distinct_chain_ids',
          ),
        countPerChainId: sql<
          Record<number, number>
        >`json_object_agg(${innerCte.chainId}, ${innerCte.count})`.as(
          'count_per_chain_id',
        ),
        countTotal: sql<number>`sum(${innerCte.count})::integer`.as(
          'count_total',
        ),
        amountSpentInUsdCents:
          sql<number>`sum(${innerCte.amountSpentInUsdCents})::double precision`.as(
            'amount_spent_in_usd_cents',
          ),
        amountSpentInUsdCentsInLast30Days:
          sql<number>`sum(${innerCte.amountSpentInUsdCentsInLast30Days})::double precision`.as(
            'amount_spent_in_usd_cents_in_last_30_days',
          ),
      })
      .from(innerCte)
      .groupBy(innerCte.tag);
  });
