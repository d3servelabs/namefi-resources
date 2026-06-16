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

type Stage3MethodDecoratorContext = {
  kind: 'method';
  name: string | symbol;
};

type WithRegistrarErrorDecorator = {
  <T extends AnyAsyncMethod>(
    original: T,
    context: Stage3MethodDecoratorContext,
  ): T;
  <T extends AnyAsyncMethod>(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T>;
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
 * Method decorator that routes a registrar method through the host's
 * `withErrorHandling`, converting thrown native errors into `RegistrarError`s.
 *
 * The backend dev runner can invoke workspace-package decorators with the
 * current TC39 method-decorator shape even though package tests and typecheck
 * still exercise the legacy `experimentalDecorators` descriptor shape, so this
 * intentionally supports both call protocols.
 *
 * It is generic over the method type `T` and returns a
 * `TypedPropertyDescriptor<T>`, so the decorated method's original signature
 * (parameters and return type) is preserved — no `<any>` annotation needed at
 * call sites, regardless of the method's argument shape.
 */
export function withRegistrarError(
  options?: WithRegistrarErrorOptions,
): WithRegistrarErrorDecorator {
  const wrap = <T extends AnyAsyncMethod>(
    methodName: string,
    original: T,
  ): T => {
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

    return wrapped as unknown as T;
  };

  const decorator = <T extends AnyAsyncMethod>(
    targetOrOriginal: object | T,
    propertyKeyOrContext: string | symbol | Stage3MethodDecoratorContext,
    descriptor?: TypedPropertyDescriptor<T>,
  ): T | TypedPropertyDescriptor<T> => {
    if (descriptor) {
      const original = descriptor.value;
      if (!original) {
        return descriptor;
      }

      descriptor.value = wrap(String(propertyKeyOrContext), original);
      return descriptor;
    }

    const context = propertyKeyOrContext as Stage3MethodDecoratorContext;
    return wrap(String(context.name), targetOrOriginal as T);
  };

  return decorator as WithRegistrarErrorDecorator;
}
