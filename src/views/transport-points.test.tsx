import '@testing-library/jest-dom/vitest'

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { APIGetMemberShip2Response } from 'kcsapi/api_get_member/ship2/response'
import type { APIGetMemberSlotItemResponse } from 'kcsapi/api_get_member/slot_item/response'
import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'

import type { ProphetEquipEntry, ProphetFleetEntry } from '../types'
import { SortieState } from '../utils/constants'

const mocks = vi.hoisted(() => ({
  state: {} as unknown as PoiRootState,
  fleets: {} as Record<number, unknown[]>,
  equips: {} as Record<number, unknown[]>,
}))

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: PoiRootState) => unknown) => selector(mocks.state),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('react-fontawesome', () => ({
  default: ({ name }: { name: string }) => React.createElement('span', { 'data-testid': `fa-${name}` }),
}))

vi.mock('views/components/etc/overlay', () => ({
  Tooltip: ({ children, content }: { children?: React.ReactNode; content?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children, content),
}))

// Host-only selector factories: the plugin's own selectFleetsEquips runs on top of them.
vi.mock('views/utils/selectors', () => ({
  extensionSelectorFactory: () => (state: PoiRootState) => state.ext,
  fleetSelectorFactory: (id: number) => () => ({
    api_ship: new Array((mocks.fleets[id] as unknown[] | undefined)?.length ?? 0).fill(0),
    api_name: '',
  }),
  fleetShipsDataSelectorFactory: (id: number) => () => mocks.fleets[id] ?? [],
  fleetShipsEquipDataSelectorFactory: (id: number) => () => mocks.equips[id] ?? [],
}))

vi.mock('../redux', () => ({
  tankTransportMapsSelector: (state: PoiRootState) =>
    (state.ext as { tankTransportMaps?: number[] } | undefined)?.tankTransportMaps ?? [],
}))

import TransportPoints from './transport-points'

const memberShip = (api_id: number, api_ship_id: number, nowhp = 10, maxhp = 10) =>
  ({ api_id, api_ship_id, api_nowhp: nowhp, api_maxhp: maxhp }) as APIGetMemberShip2Response

const masterShip = (api_stype: number) => ({ api_stype }) as APIMstShip

const memberItem = (api_slotitem_id: number) =>
  ({ api_slotitem_id }) as APIGetMemberSlotItemResponse

const masterItem = (api_type: number) =>
  ({ api_type: [0, 0, api_type, 0, 0] }) as APIMstSlotitem

const slot = (itemId: number, itemType: number): ProphetEquipEntry =>
  [memberItem(itemId), masterItem(itemType), undefined]

const ship = (api_stype: number, api_id: number): ProphetFleetEntry =>
  [memberShip(api_id, api_stype), masterShip(api_stype)]

const destroyer = (api_id: number): ProphetFleetEntry => ship(2, api_id)

const setFleet = (
  id: number,
  ships: ProphetFleetEntry[],
  slots: (ProphetEquipEntry | undefined)[][],
): void => {
  mocks.fleets[id] = ships
  mocks.equips[id] = slots
}

beforeEach(() => {
  mocks.fleets = {}
  mocks.equips = {}
  mocks.state = {
    sortie: { combinedFlag: 1, escapedPos: [], sortieMapId: 624 },
    info: { fleets: {} },
    const: { $maps: { 201: {} } },
    ext: { tankTransportMaps: [625] },
  } as unknown as PoiRootState
})

afterEach(cleanup)

describe('TransportPoints', () => {
  it('shows both tables while in port', () => {
    setFleet(0, [destroyer(101)], [[slot(68, 24)]])
    render(<TransportPoints sortieState={SortieState.InPort} />)
    expect(screen.getByText('Transport Point')).toBeInTheDocument()
    expect(screen.getByText('Tank Transport Point')).toBeInTheDocument()
    expect(screen.getByTestId('fa-database').parentElement).toHaveTextContent('[13]')
    expect(screen.getByTestId('fa-truck').parentElement).toHaveTextContent('[9]')
  })

  it('shows only the tank table on a tank map once sortied', () => {
    setFleet(0, [destroyer(101)], [[slot(68, 24)]])
    mocks.state.sortie.sortieMapId = 625
    render(<TransportPoints sortieState={SortieState.Navigation} />)
    expect(screen.getByText('Tank Transport Point')).toBeInTheDocument()
    expect(screen.queryByText('Transport Point')).not.toBeInTheDocument()
    expect(screen.getByTestId('fa-truck').parentElement).toHaveTextContent('[9]')
  })

  it('accepts a string map id from the api', () => {
    setFleet(0, [destroyer(101)], [[slot(68, 24)]])
    mocks.state.sortie.sortieMapId = '625' as unknown as number
    render(<TransportPoints sortieState={SortieState.Navigation} />)
    expect(screen.getByText('Tank Transport Point')).toBeInTheDocument()
  })

  it('shows only the normal table on a non-tank map once sortied', () => {
    setFleet(0, [destroyer(101)], [[slot(68, 24)]])
    mocks.state.sortie.sortieMapId = 624
    render(<TransportPoints sortieState={SortieState.Navigation} />)
    expect(screen.getByText('Transport Point')).toBeInTheDocument()
    expect(screen.queryByText('Tank Transport Point')).not.toBeInTheDocument()
  })

  it('hides the indicator when there is no transport cargo', () => {
    setFleet(0, [destroyer(101)], [[]])
    const { container } = render(<TransportPoints sortieState={SortieState.InPort} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('hides a zero-total table even when cargo is present', () => {
    // Ship type 1 (base 0) with a ration (category 43, base 1):
    // normal 1, but tank floor(1 * 0.75) = 0.
    setFleet(0, [ship(1, 101)], [[slot(145, 43)]])
    render(<TransportPoints sortieState={SortieState.InPort} />)
    expect(screen.getByTestId('fa-database').parentElement).toHaveTextContent('[1]')
    expect(screen.queryByTestId('fa-truck')).not.toBeInTheDocument()
  })

  it('renders nothing on a tank map when the tank total is zero', () => {
    setFleet(0, [ship(1, 101)], [[slot(145, 43)]])
    mocks.state.sortie.sortieMapId = 625
    const { container } = render(<TransportPoints sortieState={SortieState.Navigation} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('hides the indicator outside event maps', () => {
    setFleet(0, [destroyer(101)], [[slot(68, 24)]])
    mocks.state.const = { $maps: {} }
    const { container } = render(<TransportPoints sortieState={SortieState.InPort} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows deliverable vs planned and floors the A-rank tooltip', () => {
    mocks.state.info.fleets = {
      0: { api_ship: [101, 102], api_name: '' },
      1: { api_ship: [], api_name: '' },
    }
    mocks.state.sortie.escapedPos = [1]
    setFleet(0, [destroyer(101), destroyer(102)], [[slot(68, 24)], [slot(68, 24)]])
    render(<TransportPoints sortieState={SortieState.InPort} />)
    // 13 delivered / 26 planned; 9 delivered / 19 planned in the tank table.
    expect(screen.getByTestId('fa-database').parentElement).toHaveTextContent('[13 / 26]')
    expect(screen.getByTestId('fa-truck').parentElement).toHaveTextContent('[9 / 19]')
    // floor(13 * 0.7) = 9 and floor(9 * 0.7) = 6.
    expect(screen.getByText('A_rank9')).toBeInTheDocument()
    expect(screen.getByText('A_rank6')).toBeInTheDocument()
  })
})
