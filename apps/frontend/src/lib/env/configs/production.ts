import type { ConfigInput } from '../schema';

const productionConfig: ConfigInput = {
  BACKEND_URL: 'https://backend.astra.namefi.io',
  GA_MEASUREMENT_ID: 'G-PHKF9PM32W',
  PRIVY_APP_ID: 'cm2lx4u5a03x3rtgp4keapmrb',
  STRIPE_PUBLISHABLE_KEY:
    'pk_test_51Pqc6fP7AJmUlGkqATatN7ovwZrEo0WjmJTjryazMHsXRIzk1WrMQv1C0SQ8J4LrTnrc2O5P4XxnTmtSKIfdl2Ct00o9GOerUj',
  NAMEFI_FIRST_PARTY_HOSTNAMES: ['astra.namefi.io'],
  POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES: ['0x.city', 'defi.build'],
  USER_CENTRICS_SETTINGS_ID: '5UJHpI8CWth59m',
  USER_CENTRICS_GOOGLE_ANALYTICS_SERVICE_ID: 'HkocEodjb7',
};

export default productionConfig;
