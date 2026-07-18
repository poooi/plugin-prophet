declare module 'views/env-parts/i18next' {
  // Mirrored from poooi/poi views/env-parts/i18next.
  import { i18n } from 'i18next'
  const i18nextInstance: i18n
  export default i18nextInstance
}

declare module 'views/utils/selectors' {
  // Mirrored from poooi/poi views/utils/selectors.
  import type { Selector } from 'reselect'
  import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
  import type { APIGetMemberShip2Response } from 'kcsapi/api_get_member/ship2/response'
  import type { APIGetMemberSlotItemResponse } from 'kcsapi/api_get_member/slot_item/response'

  type ShipData = [APIGetMemberShip2Response, APIMstShip]
  type EquipData = [APIGetMemberSlotItemResponse, APIMstSlotitem, number | undefined]

  export const extensionSelectorFactory: (id: string) => (state: PoiRootState) => Record<string, unknown>
  export const fleetSelectorFactory: (id: number) => (state: PoiRootState) => { api_ship: number[]; api_name: string } | undefined
  export const fleetShipsDataSelectorFactory: (id: number) => (state: PoiRootState) => (ShipData | undefined)[] | undefined
  export const fleetShipsEquipDataSelectorFactory: (id: number) => (state: PoiRootState) => (EquipData[] | undefined)[] | undefined
}

declare module 'views/utils/tools' {
  // Mirrored from poooi/poi views/utils/tools.
  export const compareUpdate: <T>(prev: T, next: T) => T
  export const pickExisting: <T extends object>(target: T, source: Partial<T>) => Partial<T>
}

declare module 'views/components/etc/overlay' {
  // Mirrored from poooi/poi views/components/etc/overlay.
  export { Tooltip, Popover, Dialog } from '@blueprintjs/core'
}

declare module 'views/components/etc/avatar' {
  // Mirrored from poooi/poi views/components/etc/avatar.
  import { ComponentType } from 'react'
  export const Avatar: ComponentType<{ mstId: number; height?: number; isDamaged?: boolean }>
}

declare module 'views/components/etc/icon' {
  // Mirrored from poooi/poi views/components/etc/icon.
  import { ComponentType } from 'react'
  export const SlotitemIcon: ComponentType<{ slotitemId?: number; className?: string; alt?: string }>
  export const MaterialIcon: ComponentType<{ materialId?: number; className?: string; alt?: string }>
}

declare module 'views/utils/game-utils' {
  // Mirrored from poooi/poi views/utils/game-utils.
  export const getCondStyle: (cond: number) => string
  export const getHpStyle: (pcnt: number) => string
}

declare module 'views/create-store' {
  // Mirrored from poooi/poi views/create-store.
  import type { Store } from 'redux'
  export const store: Store<PoiRootState>
}
