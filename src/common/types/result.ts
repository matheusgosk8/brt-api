/**
 * Either (Right / Left) — retorno padrão dos use cases.
 * Discriminated union: use `isRight` / `isLeft` (interfaces somem em runtime;
 * `instanceof` só funciona com classe — por isso o `_tag`).
 */

export interface Right<T> {
  readonly _tag: 'Right';
  readonly right: T;
}

export interface Left<E> {
  readonly _tag: 'Left';
  readonly left: E;
}

export type Either<E, T> = Left<E> | Right<T>;

export function right<T>(value: T): Right<T> {
  return { _tag: 'Right', right: value };
}

export function left<E>(error: E): Left<E> {
  return { _tag: 'Left', left: error };
}

export function isRight<E, T>(either: Either<E, T>): either is Right<T> {
  return either._tag === 'Right';
}

export function isLeft<E, T>(either: Either<E, T>): either is Left<E> {
  return either._tag === 'Left';
}
