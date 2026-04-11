declare module 'views/env-parts/i18next' {
  import { i18n } from 'i18next'
  const i18nextInstance: i18n
  export default i18nextInstance
}

declare module 'views/utils/selectors' {
  import { Selector } from 'reselect'

  export const extensionSelectorFactory: (id: string) => Selector<any, any>
  export const fleetSelectorFactory: (id: number) => Selector<any, any>
  export const fleetShipsDataSelectorFactory: (id: number) => Selector<any, any>
  export const fleetShipsEquipDataSelectorFactory: (id: number) => Selector<any, any>
}

declare module 'views/utils/tools' {
  export const compareUpdate: <T>(prev: T, next: T) => T
  export const pickExisting: <T extends object>(target: T, source: Partial<T>) => Partial<T>
}

declare module 'views/components/etc/overlay' {
  export { Tooltip, Popover, Dialog } from '@blueprintjs/core'
}

declare module 'views/components/etc/avatar' {
  import { ComponentType } from 'react'
  export const Avatar: ComponentType<{ mstId: number; height?: number; isDamaged?: boolean }>
}

declare module 'views/components/etc/icon' {
  import { ComponentType } from 'react'
  export const SlotitemIcon: ComponentType<any>
  export const MaterialIcon: ComponentType<any>
}

declare module 'views/utils/game-utils' {
  export const getCondStyle: (cond: number) => string
  export const getHpStyle: (pcnt: number) => string
}

declare module 'views/create-store' {
  export const store: any
}
