import styled from 'styled-components'

export const ShipItem = styled.div`
  opacity: ${(props) => props.escaped && 0.4};
  margin-bottom: 4px;
  height: 2.5em;
  max-height: 2.5em;
  display: flex;
`

export const ShipContainer = styled.div`
  width: 50%;
  padding-right: 8px;
`

export const ShipInfo = styled.div`
  flex: 1;
  flex-grow: ${({ compact }) => compact && 0};
  margin-right: auto;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
  position: relative;

  .ship-avatar-container {
    position: relative;
    top: 0;
    left: 0;
  }
`

export const ShipHp = styled.div`
  width: 50%;
  white-space: nowrap;
  flex: 1;
`

export const ShipNameContainer = styled.div`
  flex: 1;
  padding-top: 3px;
  font-size: 1.25em;
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`
