import { NewsletterFormWithSearchQuery } from '@/components/newsletter/newsletter-form';

export const metadata = {
  title: 'Newsletter Subscription - Namefi Astra',
  description:
    'Subscribe to the Namefi Astra newsletter for the latest updates, announcements, and domain releases.',
};

export default function NewsletterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Join Our Newsletter</h1>
          <p className="text-lg text-muted-foreground">
            Get the latest updates delivered straight to your inbox
          </p>
        </div>

        <NewsletterFormWithSearchQuery
          key="newsletter-form"
          from="namefi-astra/newsletter-page"
          title="Stay in the Loop"
          description="Be the first to know about new domain releases, platform updates, exclusive features, and special announcements."
          showNameField={true}
          variant="default"
        />

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>We respect your privacy. You can unsubscribe at any time.</p>
        </div>
      </div>
    </div>
  );
}
