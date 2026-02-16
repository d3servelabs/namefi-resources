// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { buildTemplate } from '../components/build-template';
import {
  CartDomainsPopularTemplate,
  cartDomainsPopularPreviewBase,
  type CartDomainsPopularProps,
} from '../template-components/cart-domains-popular';

export const CartDomainsPopularVariant4 =
  buildTemplate<CartDomainsPopularProps>(CartDomainsPopularTemplate, {
    ...cartDomainsPopularPreviewBase,
    variant: 3,
  });

// biome-ignore lint/style/noDefaultExport: required for react-email
export default CartDomainsPopularVariant4;
