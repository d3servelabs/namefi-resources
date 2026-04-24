export function DateTokenizedCell({
  dateTokenized,
}: {
  dateTokenized: Date | string | null | undefined;
}) {
  if (!dateTokenized) {
    return <span className="text-muted-foreground">-</span>;
  }

  const date = new Date(dateTokenized);
  if (Number.isNaN(date.getTime())) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <span className="text-sm text-muted-foreground">
      {date.toISOString().slice(0, 10)}
    </span>
  );
}
