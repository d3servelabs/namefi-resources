export const Registrars = {
  Route53: 'route53',
  Dynadot: 'dynadot',
  NamefiMock: 'namefiMock',
  NamefiInMemoryMock: 'namefiInMemoryMock',
};
export type Registrars = (typeof Registrars)[keyof typeof Registrars];
