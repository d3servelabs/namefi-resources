import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/cv/names/ali';
import { Landing } from '@/pbns/cv/names/ali/landing';

const route = createThirdPartyLandingPage({
  originKey: 'ali.cv',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
