export enum ServiceName {
  USERS = 'USERS_SERVICE',
  STRIPE = 'STRIPE_PAYMENTS_SERVICE',
}

export class ServiceError extends Error {
  readonly serviceName: ServiceName;

  constructor(message: string, service: ServiceName) {
    super(message);
    this.serviceName = service;
  }
}
