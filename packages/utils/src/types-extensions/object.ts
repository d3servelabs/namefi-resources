export const ObjectTyped: ObjectTypedConstructor = Object;

export interface ObjectTypedConstructor
  extends Omit<ObjectConstructor, 'keys' | 'entries' | 'fromEntries'> {
  keys<T>(obj: T): Array<keyof T>;
  entries<K extends keyof any, V>(o: Partial<Record<K, V>>): [K, V][];
  fromEntries<K extends keyof any, V>(
    entries: Iterable<readonly [K, V]>,
  ): Record<K, V>;
}
