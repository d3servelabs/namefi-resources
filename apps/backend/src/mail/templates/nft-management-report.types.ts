/**
 * Shared types for the NFT Management Report email + activity pipeline.
 *
 * Lives under `mail/templates` so the template file can import it without
 * pulling in Temporal or DB modules.
 *
 * Note on Date serialization: these structures cross the Temporal
 * activity/workflow boundary, so date fields are typed as ISO strings.
 * The activity layer is responsible for converting `Date` -> ISO string
 * when populating these structures.
 */

export type NftIssueCategory =
  | 'DATE_MISMATCH'
  | 'DOMAIN_EXISTS_MISSING_NFT'
  | 'NFT_EXISTS_MISSING_DOMAIN'
  | 'EXPIRED';

export interface KnownIssueExplanation {
  normalizedDomainName: string;
  explanation: string;
  category?: NftIssueCategory;
  acknowledgedBy: string;
  acknowledgedAt: string;
  updatedAt: string;
}

export interface CategorizedDomainEntry {
  normalizedDomainName: string;
  chainId?: number;
  ownerAddress?: string;
  registrarKey: string | null;
  /** ISO string or null. */
  nftExpirationTime: string | null;
  /** ISO string or null. */
  domainExpirationTime: string | null;
  /** Seconds between NFT and registrar expiration (DATE_MISMATCH only). */
  expirationDiffSeconds?: number;
  /** True iff the effective expiration time is in the past. */
  isExpired: boolean;
  knownIssue?: KnownIssueExplanation;
}

export interface CategorizedSections {
  dateMismatch: CategorizedDomainEntry[];
  domainExistsMissingNft: CategorizedDomainEntry[];
  nftExistsMissingDomainNotExpired: CategorizedDomainEntry[];
  expired: CategorizedDomainEntry[];
}

export interface CategorySummary {
  total: number;
  acknowledged: number;
  needsReview: number;
}

export interface NftReportSummary {
  totalNfts: number;
  dateMismatch: CategorySummary;
  domainExistsMissingNft: CategorySummary;
  nftExistsMissingDomainNotExpired: CategorySummary;
  expired: CategorySummary;
  knownIssuesTotal: number;
}

export interface NftReportMeta {
  /** ISO timestamp the report was generated. */
  generatedAt: string;
  adminUrl: string;
  githubActionsUrl: string;
}

export interface NftManagementReportProps {
  title: string;
  summary: NftReportSummary;
  categorized: CategorizedSections;
  meta: NftReportMeta;
}
