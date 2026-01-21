import * as React from 'react';
const DEBUG_COMPOSE_REFS = true;

const MAX_CALLS = 20;
const WINDOW_MS = 1000;
const LOG_COOLDOWN_MS = 2000;

const refStats = new WeakMap<
  object,
  {
    count: number;
    first: number;
    last: number;
    lastLog: number;
  }
>();

const describeValue = (value: unknown) => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') {
    const element = value as HTMLElement;
    if (typeof element.tagName === 'string') {
      return `<${element.tagName.toLowerCase()}>`;
    }
  }
  return typeof value;
};

const recordRefCall = (ref: unknown, value: unknown) => {
  if (!DEBUG_COMPOSE_REFS) return;
  if (typeof ref !== 'function') return;

  const now = Date.now();
  let stats = refStats.get(ref as object);

  if (!stats || now - stats.first > WINDOW_MS) {
    stats = {
      count: 0,
      first: now,
      last: now,
      lastLog: stats?.lastLog ?? 0,
    };
  }

  stats.count += 1;
  stats.last = now;

  if (stats.count >= MAX_CALLS && now - stats.lastLog > LOG_COOLDOWN_MS) {
    stats.lastLog = now;
    const refName = (ref as Function).name || '(anonymous)';
    const stack = new Error().stack;

    console.warn('[radix-compose-refs] high-frequency ref callback', {
      ref: ref as Function,
      refName,
      calls: stats.count,
      windowMs: WINDOW_MS,
      value: describeValue(value),
      stack,
    });
  }

  refStats.set(ref as object, stats);
};

function setRef<T>(ref: React.Ref<T> | undefined | null, value: T) {
  if (typeof ref === 'function') {
    recordRefCall(ref, value);
    return ref(value);
  }
  if (ref !== null && ref !== undefined) {
    ref.current = value;
  }
}

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined | null>) {
  return (node: T) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node);
      if (!hasCleanup && typeof cleanup === 'function') {
        hasCleanup = true;
      }
      return cleanup;
    });

    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i += 1) {
          const cleanup = cleanups[i];
          if (typeof cleanup === 'function') {
            cleanup();
          } else {
            setRef(refs[i], null);
          }
        }
      };
    }

    return undefined;
  };
}

function useComposedRefs<T>(...refs: Array<React.Ref<T> | undefined | null>) {
  return React.useCallback(composeRefs(...refs), [...refs]);
}

export { composeRefs, useComposedRefs };
