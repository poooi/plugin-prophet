declare module 'redux-observers' {
  export function observe(store: object, observers: any[], options?: any): () => void
  export function observer(
    mapper: (state: any) => any,
    dispatcher: (dispatch: any, current: any, previous: any) => void,
    locals?: any,
  ): any
}
