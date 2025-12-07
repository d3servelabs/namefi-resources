import { path } from 'ramda';

/**
 * Any async (Promise-returning) method — the only kind `withRegistrarError`
 * wraps. Kept loose on purpose: the decorator is generic over the concrete
 * method type `T` so the decorated method's signature is preserved.
 */
// biome-ignore lint/suspicious/noExplicitAny: any[] params are required so every concrete method type satisfies the constraint; unknown[] fails via parameter contravariance.
type AnyAsyncMethod = (...args: any[]) => Promise<unknown>;

type RegistrarErrorHandlingHost = {
  withErrorHandling<T>(
    operation: string,
    domainName: string | undefined,
    fn: () => Promise<T>,
  ): Promise<T>;
};

function getDefaultDomainName(...args: unknown[]): string | undefined {
  const first = args[0];

  if (typeof first === 'string') {
    return first;
  }

  if (first && typeof first === 'object' && 'domainName' in first) {
    const domainName = (first as { domainName?: unknown }).domainName;
    if (typeof domainName === 'string') {
      return domainName;
    }
  }

  return undefined;
}

/**
 * Build a `getDomainName` resolver that reads the domain from a fixed path into
 * the call arguments (e.g. `fromArgsPath([0, 'domainName'])`).
 */
export function fromArgsPath(
  valuePath: (string | number)[],
): (...args: unknown[]) => string | undefined {
  return (...args: unknown[]) => {
    const value = path(valuePath, args);
    return typeof value === 'string' ? value : undefined;
  };
}

export interface WithRegistrarErrorOptions {
  /** Operation name recorded on the error (defaults to the method name). */
  operation?: string;
  /**
   * Resolve the domain name from the call arguments for error context. Defaults
   * to the first argument when it is a string or has a `domainName` property.
   */
  // biome-ignore lint/suspicious/noExplicitAny: mirrors the decorated method's loosely-typed args.
  getDomainName?: (...args: any[]) => string | undefined;
}

/**
 * Method decorator (legacy / `experimentalDecorators`) that routes a registrar
 * method through the host's `withErrorHandling`, converting thrown native errors
 * into `RegistrarError`s.
 *
 * It is generic over the method type `T` and returns a
 * `TypedPropertyDescriptor<T>`, so the decorated method's original signature
 * (parameters and return type) is preserved — no `<any>` annotation needed at
 * call sites, regardless of the method's argument shape.
 */
export function withRegistrarError(options?: WithRegistrarErrorOptions) {
  return <T extends AnyAsyncMethod>(
    _target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> => {
    const original = descriptor.value;
    if (!original) {
      return descriptor;
    }
    const methodName = String(propertyKey);

    // Function expression (not a hoisted declaration) so the closure captures
    // the narrowed, non-undefined `original`.
    const wrapped = function (
      this: RegistrarErrorHandlingHost,
      ...args: Parameters<T>
    ): ReturnType<T> {
      const operation = options?.operation ?? methodName;
      const domainName =
        options?.getDomainName?.(...args) ?? getDefaultDomainName(...args);

      return this.withErrorHandling(operation, domainName, () =>
        original.apply(this, args),
      ) as ReturnType<T>;
    };

    descriptor.value = wrapped as unknown as T;
    return descriptor;
  };
}
