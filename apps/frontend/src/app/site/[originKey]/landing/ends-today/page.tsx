import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/bespoke/domains/ends-today';
import { Landing } from '@/pbns/bespoke/domains/ends-today/landing';

const route = createThirdPartyLandingPage({
  originKey: 'ends.today',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
