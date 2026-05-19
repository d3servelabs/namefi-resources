import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/cv/names/muller';
import { Landing } from '@/pbns/cv/names/muller/landing';

const route = createThirdPartyLandingPage({
  originKey: 'muller.cv',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
