import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/aave/config';
import { Landing } from '@/pbns/aave/landing';

const route = createThirdPartyLandingPage({
  originKey: 'aave',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
