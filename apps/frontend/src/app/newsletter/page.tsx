import { permanentRedirect } from 'next/navigation';

// The dedicated /newsletter page used to host its own NewsletterForm. We
// consolidate newsletter intent onto the homepage anchor (/#newsletter) so a
// single, primary section captures subscriptions and so all "Newsletter" CTAs
// (nav, footer, sitelinks, emails) point to one canonical surface. The hash is
// preserved in the Location header on a 308; browsers honor it and scroll to
// the section automatically.
export default function NewsletterRedirect(): never {
  permanentRedirect('/#newsletter');
}
