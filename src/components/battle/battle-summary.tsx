import React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import compact from 'lodash/compact'
import { resolvePluginPath } from '../../host/poi-assets'

const ResultIcon = styled.img<{ isLight?: boolean }>`
  width: 32px;
  height: 32px;
  margin-right: 0.5ex;
  ${({ isLight }) =>
    isLight &&
    css`
      background-color: #ccc;
      border-radius: 4px;
    `}
`

const Container = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;

  div + div {
    margin-left: 2rem;
  }

  div {
    display: flex;
    align-items: center;
  }
`

const BATTLE_RESULT = ['SS', 'S', 'A', 'B', 'C', 'D', 'E']

interface BattleSummaryProps {
  rank: string
  eFormation: string
  battleForm: string
  airControl: string
  smokeType: number
  isDarkTheme: boolean
}

// Translation map for formation/engagement/air control strings
// These come from lib-battle directly as English strings
const translationMap: Record<string, string> = {
  'Parallel Engagement': 'Parallel Engagement',
  'Head-on Engagement': 'Head-on Engagement',
  'Crossing the T (Advantage)': 'Crossing the T (Advantage)',
  'Crossing the T (Disadvantage)': 'Crossing the T (Disadvantage)',
  'Line Ahead': 'Line Ahead',
  'Double Line': 'Double Line',
  Diamond: 'Diamond',
  Echelon: 'Echelon',
  'Line Abreast': 'Line Abreast',
  Vanguard: 'Vanguard',
  'Cruising Formation 1 (anti-sub)': 'Cruising Formation 1',
  'Cruising Formation 2 (forward)': 'Cruising Formation 2',
  'Cruising Formation 3 (diamond)': 'Cruising Formation 3',
  'Cruising Formation 4 (battle)': 'Cruising Formation 4',
  'Air Parity': 'Air Parity',
  'Air Supremacy': 'Air Supremacy',
  'Air Superiority': 'Air Superiority',
  'Air Denial': 'Air Denial',
  'Air Incapability': 'Air Incapability',
}

function translateBattleStr(str: string, t: (k: string) => string): string {
  const mapped = translationMap[str]
  return t(mapped ?? str)
}

export const BattleSummary: React.FC<BattleSummaryProps> = ({
  rank,
  eFormation,
  battleForm,
  airControl,
  smokeType,
  isDarkTheme,
}) => {
  const { t } = useTranslation('poi-plugin-prophet')

  const texts = compact([
    eFormation ? translateBattleStr(eFormation, t) : null,
    battleForm ? translateBattleStr(battleForm, t) : null,
    airControl ? translateBattleStr(airControl, t) : null,
    smokeType ? `${t('smoke')}: ${smokeType}` : null,
  ])

  return (
    <Container>
      <div>
        {BATTLE_RESULT.includes(rank) ? (
          <ResultIcon
            src={resolvePluginPath(`./assets/icons/result-${rank}.svg`)}
            isLight={!isDarkTheme}
            alt="result"
          />
        ) : (
          t(rank)
        )}
      </div>
      {texts.map((text) => (
        <div key={text}>{text}</div>
      ))}
    </Container>
  )
}
