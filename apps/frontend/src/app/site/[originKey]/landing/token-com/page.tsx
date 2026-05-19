import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/token-com/config';
import { Landing } from '@/pbns/token-com/landing';

const route = createThirdPartyLandingPage({
  originKey: 'token.com',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
