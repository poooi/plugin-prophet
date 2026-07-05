declare module 'redux-observers' {
  type Selector<S, T> = (state: S) => T
  type Handler<T> = (dispatch: (action: unknown) => void, current: T, previous: T) => void

  export function observer<S, T>(selector: Selector<S, T>, handler: Handler<T>): unknown
  export function observe(store: unknown, observers: unknown[]): () => void
}
