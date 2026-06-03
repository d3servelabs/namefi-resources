export type LeadgenRunOrderable = {
  id: string;
  createdAt: Date | string;
};

export function compareLeadgenRunsByCreatedDesc<T extends LeadgenRunOrderable>(
  left: T,
  right: T,
) {
  const createdDifference = toTime(right.createdAt) - toTime(left.createdAt);
  if (createdDifference !== 0) return createdDifference;

  return left.id.localeCompare(right.id);
}

export function upsertLeadgenRunByCreatedDesc<T extends LeadgenRunOrderable>({
  runs,
  run,
  limit,
}: {
  runs: T[] | undefined;
  run: T;
  limit: number;
}) {
  return [run, ...(runs ?? []).filter((item) => item.id !== run.id)]
    .sort(compareLeadgenRunsByCreatedDesc)
    .slice(0, limit);
}

function toTime(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}
