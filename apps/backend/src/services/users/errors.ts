import { ServiceError, ServiceName } from '#services/serviceError';

export class UserNotFoundError extends ServiceError {
  constructor(userId: string) {
    super(`Could not find User with userId: ${userId}`, ServiceName.USERS);
  }
}
