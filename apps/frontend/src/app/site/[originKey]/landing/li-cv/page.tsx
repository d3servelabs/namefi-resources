import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/cv/names/li';
import { Landing } from '@/pbns/cv/names/li/landing';

const route = createThirdPartyLandingPage({
  originKey: 'li.cv',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
