import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/cv/names/taylor';
import { Landing } from '@/pbns/cv/names/taylor/landing';

const route = createThirdPartyLandingPage({
  originKey: 'taylor.cv',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
