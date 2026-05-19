import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/bespoke/domains/starts-today';
import { Landing } from '@/pbns/bespoke/domains/starts-today/landing';

const route = createThirdPartyLandingPage({
  originKey: 'starts.today',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
