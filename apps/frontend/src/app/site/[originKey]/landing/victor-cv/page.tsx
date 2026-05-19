import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/cv/names/victor';
import { Landing } from '@/pbns/cv/names/victor/landing';

const route = createThirdPartyLandingPage({
  originKey: 'victor.cv',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
