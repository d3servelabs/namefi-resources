export const Registrars = {
  Route53: 'route53',
  DynadotGdg: 'dynadot',
  DynadotRegular: 'dynadot_regular',
  NamefiMock: 'namefiMock',
  NamefiInMemoryMock: 'namefiInMemoryMock',
};
export type Registrars = (typeof Registrars)[keyof typeof Registrars];
