import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/uniswap/config';
import { Landing } from '@/pbns/uniswap/landing';

const route = createThirdPartyLandingPage({
  originKey: 'uniswap',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
