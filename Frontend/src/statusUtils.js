// Fast heuristic (no ML call) — used only as a placeholder the instant parts load,
// before the real per-part predictions come back from the backend.
export function getPartStatus(part) {
  const daysRemaining = part.avgDailyUsage > 0 ? part.stockQuantity / part.avgDailyUsage : Infinity;
  let status = 'Healthy';
  if (daysRemaining < 7) status = 'Critical';
  else if (daysRemaining < 21) status = 'Low Stock';
  return { daysRemaining, status };
}

// Real signal: predicted stockout day vs. predicted resupply time. This is what should
// drive status everywhere once predictions are available, since it's the only one that
// actually knows about the supplier's lead time.
export function classifyFromGap(gap) {
  if (gap < 2) return { status: 'Critical', action: 'ORDER_NOW' };
  if (gap < 7) return { status: 'Low Stock', action: 'ORDER_SOON' };
  return { status: 'Healthy', action: 'NO_ACTION' };
}

export function statusVariant(status) {
  if (status === 'Critical') return 'danger';
  if (status === 'Low Stock') return 'warning';
  return 'success';
}