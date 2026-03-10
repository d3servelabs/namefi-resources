import { sql, type SQL, type SQLWrapper } from 'drizzle-orm';

export function stringArrayMatchCount(
  arr1: SQL<string[]> | SQLWrapper,
  arr2: SQL<string[]> | SQLWrapper,
  direction: 'start' | 'end' | SQL<'start' | 'end'> | SQL<string> | SQLWrapper,
) {
  return sql<number>`string_array_match_count(${arr1}, ${arr2}, ${direction})`;
}

export function dnsLabelsFromText(
  inputName: string | SQL<string> | SQLWrapper,
) {
  return sql<string[]>`dns_labels_from_text(${inputName})`;
}

export function dnsLabelsFromTextArray(
  parts: string[] | SQL<string[]> | SQLWrapper,
) {
  return sql<string[]>`dns_labels_from_text_array(${parts})`;
}

export function labelsExactMatch(
  a: SQL<string[]> | SQLWrapper,
  b: SQL<string[]> | SQLWrapper,
) {
  return sql<boolean>`labels_exact_match(${a}, ${b})`;
}

export function isApexMatch(
  a: SQL<string[]> | SQLWrapper,
  b: SQL<string[]> | SQLWrapper,
) {
  return sql<boolean>`is_apex_match(${a}, ${b})`;
}

export function isImmediateSibling(
  a: SQL<string[]> | SQLWrapper,
  b: SQL<string[]> | SQLWrapper,
) {
  return sql<boolean>`is_immediate_sibling(${a}, ${b})`;
}

export function isSecondDescendantOfFirst(
  a: SQL<string[]> | SQLWrapper,
  b: SQL<string[]> | SQLWrapper,
) {
  return sql<boolean>`is_second_descendant_of_first(${a}, ${b})`;
}
