import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/0x-city/config';
import { Landing } from '@/pbns/0x-city/landing';

const route = createThirdPartyLandingPage({
  originKey: '0x.city',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
