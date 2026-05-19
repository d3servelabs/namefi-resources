import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/cv/names/kumar';
import { Landing } from '@/pbns/cv/names/kumar/landing';

const route = createThirdPartyLandingPage({
  originKey: 'kumar.cv',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
