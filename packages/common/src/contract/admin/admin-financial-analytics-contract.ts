import { z } from 'zod';

import { createContract } from '../create-contract';

const dateRangeSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

const financialFiltersSchema = z
  .object({
    searchTerm: z.string().optional(),
    filterOptions: z.any().optional(),
  })
  .default({});

const financialTableInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  dateRange: dateRangeSchema,
  globalFilters: financialFiltersSchema.optional(),
  tableFilters: z.any().optional(),
  sorting: z.any().optional(),
});

const financialSummaryInputSchema = z.object({
  dateRange: dateRangeSchema,
  globalFilters: financialFiltersSchema.optional(),
});

const financialExportInputSchema = z.object({
  mode: z.enum(['orderItemsByOrder', 'paymentsByOrder', 'ordersWithItems']),
  format: z.enum(['csv', 'json']),
  dateRange: dateRangeSchema,
  globalFilters: financialFiltersSchema.optional(),
  tableFilters: z.any().optional(),
  sorting: z.any().optional(),
});

const paginatedFinancialRowsOutputSchema = z.object({
  items: z.array(z.any()),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

const financialExportOutputSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  content: z.string(),
});

export const adminFinancialAnalyticsContract = createContract(
  { softOutput: true },
  {
    getSummary: {
      type: 'query',
      input: financialSummaryInputSchema,
      output: z.any(),
    },
    listOrderItemGroups: {
      type: 'query',
      input: financialTableInputSchema,
      output: paginatedFinancialRowsOutputSchema,
    },
    listPaymentGroups: {
      type: 'query',
      input: financialTableInputSchema,
      output: paginatedFinancialRowsOutputSchema,
    },
    listOrdersWithItems: {
      type: 'query',
      input: financialTableInputSchema,
      output: paginatedFinancialRowsOutputSchema,
    },
    exportData: {
      type: 'mutation',
      input: financialExportInputSchema,
      output: financialExportOutputSchema,
    },
  },
);

export type AdminFinancialAnalyticsContract =
  typeof adminFinancialAnalyticsContract;
