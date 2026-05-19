import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/bespoke/domains/promos-today';
import { Landing } from '@/pbns/bespoke/domains/promos-today/landing';

const route = createThirdPartyLandingPage({
  originKey: 'promos.today',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
