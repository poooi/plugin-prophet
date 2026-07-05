import type { PoiRootState } from '../../../host/poi-types'

export declare function extensionSelectorFactory(key: string): (state: PoiRootState) => Record<string, unknown> | undefined
export declare function fleetShipsDataSelectorFactory(fleetId: number): (state: PoiRootState) => Array<[unknown, unknown] | undefined> | undefined
export declare function fleetShipsEquipDataSelectorFactory(fleetId: number): (state: PoiRootState) => Array<Array<[unknown, unknown] | undefined> | undefined> | undefined
export declare function fleetSelectorFactory(fleetId: number): (state: PoiRootState) => unknown
