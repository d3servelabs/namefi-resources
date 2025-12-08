export const Registrars = {
  Route53: 'route53',
  DynadotGdg: 'dynadot',
  DynadotRegular: 'dynadot_regular',
  CentralNic: 'centralnic',
  CentralNic_OTE_01: 'centralnic_ote_01',
  CentralNic_OTE_02: 'centralnic_ote_02',
  NamefiMock: 'namefiMock',
  NamefiInMemoryMock: 'namefiInMemoryMock',
};
export type Registrars = (typeof Registrars)[keyof typeof Registrars];
