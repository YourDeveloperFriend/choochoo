
export type Constructor<T> = new (...args: any) => T;
export type ConstructorReturnType<T> = T extends Constructor<infer P> ? P : never;

export type Primitive = number | string | boolean;

export type PromiseOr<T> = Promise<T> | T;

export type UrlParameters = { [key: string]: Primitive };

export type SomePartial<T, OptionalProps extends keyof T> =
  Partial<Pick<T, OptionalProps>> & Required<Omit<T, OptionalProps>>;

export type Entry<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T];