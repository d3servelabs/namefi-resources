export function reconcileLeadgenLeadOrder(
  userOrderedLeadIds: string[] | null | undefined,
  agentOrderedLeadIds: string[],
): string[] {
  if (!userOrderedLeadIds?.length) return agentOrderedLeadIds;

  const validLeadIds = new Set(agentOrderedLeadIds);
  const seenLeadIds = new Set<string>();
  const reconciledLeadIds: string[] = [];

  for (const leadId of userOrderedLeadIds) {
    if (!validLeadIds.has(leadId) || seenLeadIds.has(leadId)) continue;

    seenLeadIds.add(leadId);
    reconciledLeadIds.push(leadId);
  }

  for (const leadId of agentOrderedLeadIds) {
    if (seenLeadIds.has(leadId)) continue;

    seenLeadIds.add(leadId);
    reconciledLeadIds.push(leadId);
  }

  return reconciledLeadIds;
}

export function isLeadgenLeadOrderCustomized({
  agentOrderedLeadIds,
  userOrderedLeadIds,
}: {
  agentOrderedLeadIds: string[];
  userOrderedLeadIds: string[] | null | undefined;
}) {
  if (!userOrderedLeadIds?.length) return false;

  const reconciledLeadIds = reconcileLeadgenLeadOrder(
    userOrderedLeadIds,
    agentOrderedLeadIds,
  );

  return reconciledLeadIds.some(
    (leadId, index) => leadId !== agentOrderedLeadIds[index],
  );
}

export function getPersistableLeadgenLeadOrder({
  agentOrderedLeadIds,
  userOrderedLeadIds,
}: {
  agentOrderedLeadIds: string[];
  userOrderedLeadIds: string[] | null | undefined;
}) {
  const reconciledLeadIds = reconcileLeadgenLeadOrder(
    userOrderedLeadIds,
    agentOrderedLeadIds,
  );

  return isLeadgenLeadOrderCustomized({
    agentOrderedLeadIds,
    userOrderedLeadIds: reconciledLeadIds,
  })
    ? reconciledLeadIds
    : [];
}
