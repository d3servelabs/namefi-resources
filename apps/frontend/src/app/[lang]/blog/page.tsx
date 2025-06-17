export async function generateStaticParams() {
  // We can add more languages here in the future
  return ['en', 'zh'].map((lang) => ({ lang }));
}

export default async function BlogIndexPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const { lang } = params;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
    </div>
  );
}
