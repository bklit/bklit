/**
 * Maximum limit for analytics queries when we need to fetch all records
 * for accurate statistics calculations.
 *
 * This should be used whenever calculating stats, aggregations, or time series
 * data where we need the complete dataset, not just a sample.
 */
export const ANALYTICS_UNLIMITED_QUERY_LIMIT = 100_000;
