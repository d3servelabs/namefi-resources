export function assert(
  assertion: boolean,
  errorMsg: string,
): asserts assertion is true {
  if (!assertion) {
    throw new Error(errorMsg);
  }
}

export function assertNot(
  assertion: boolean,
  errorMsg: string,
): asserts assertion is false {
  if (assertion) {
    throw new Error(errorMsg);
  }
}

export function assertNotNil<T>(
  value: T,
  errorMsg: string,
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(errorMsg);
  }
}

export function assertExhaustive(
  value: never,
  message = `Reached unexpected case in exhaustive switch. Enum supplied with impossible value ${value}`,
): never {
  throw new Error(message);
}
