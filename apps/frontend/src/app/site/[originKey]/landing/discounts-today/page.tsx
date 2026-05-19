import { createThirdPartyLandingPage } from '@/components/landing-page';
import { originConfig } from '@/pbns/bespoke/domains/discounts-today';
import { Landing } from '@/pbns/bespoke/domains/discounts-today/landing';

const route = createThirdPartyLandingPage({
  originKey: 'discounts.today',
  Landing,
  originConfig,
});

export const metadata = route.metadata;

export default route.Page;
