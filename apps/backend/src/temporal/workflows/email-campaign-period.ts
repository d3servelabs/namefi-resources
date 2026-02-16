export function getWeeklyPeriodStartUtc(date: Date, weekStartsOn = 1) {
  const day = date.getUTCDay();
  const diff = (day - weekStartsOn + 7) % 7;
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  start.setUTCDate(start.getUTCDate() - diff);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function getMonthlyPeriodStartUtc(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0),
  );
}
