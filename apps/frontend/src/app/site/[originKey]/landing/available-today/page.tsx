import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/bespoke/domains/available-today';
import { Landing } from '@/pbns/bespoke/domains/available-today/landing';

const route = createThirdPartyLandingPage({
  originKey: 'available.today',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
