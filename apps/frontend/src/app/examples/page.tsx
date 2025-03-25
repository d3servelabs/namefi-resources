import Link from 'next/link';

export default function ExamplesPage() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <Link href="/examples/datatable">DataTable</Link>
      <Link href="/examples/table">Table</Link>
    </div>
  );
}
