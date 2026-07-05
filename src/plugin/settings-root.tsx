import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Button } from '@blueprintjs/core'
import styled from 'styled-components'
import { CheckboxSetting } from '../components/settings/checkbox-setting'
import { RadioSetting } from '../components/settings/radio-setting'
import { clearHistory } from '../state/actions'

const CheckboxContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`

const Gap = styled.div`
  height: 2em;
  width: 100%;
`

const PLUGIN_I18N_KEY = 'poi-plugin-prophet'

export const SettingsRoot: React.FC = () => {
  const { t } = useTranslation(PLUGIN_I18N_KEY)
  const dispatch = useDispatch()
  const [done, setDone] = useState(false)

  const handleClearHistory = () => {
    dispatch(clearHistory() as never)
    setDone(true)
  }

  return (
    <>
      <CheckboxContainer>
        <CheckboxSetting
          label={t('Show scales on HP bar')}
          configName="plugin.prophet.showScale"
          defaultVal
        />
        <CheckboxSetting
          label={t('Display enemy combined fleet in game order')}
          configName="plugin.prophet.ecGameOrder"
          defaultVal
        />
        <CheckboxSetting
          label={t('Show enemy deck name if available')}
          configName="plugin.prophet.showEnemyTitle"
          defaultVal
        />
        <CheckboxSetting
          label={t('Show last chosen formation hint')}
          configName="plugin.prophet.showLastFormation"
          defaultVal
        />
        <CheckboxSetting
          label={t('Ship parameters include equipment bonus')}
          configName="plugin.prophet.useFinalParam"
          defaultVal
        />
        <CheckboxSetting
          label={t('Heavily damaged notification')}
          configName="plugin.prophet.notify.enable"
          defaultVal
        />
        <CheckboxSetting
          label={t('Enable avatars')}
          configName="plugin.prophet.showAvatar"
          defaultVal={false}
        />
        <CheckboxSetting
          label={t('Display air raid results')}
          configName="plugin.prophet.showAirRaid"
          defaultVal
        />
      </CheckboxContainer>
      <Gap />
      <div>
        <RadioSetting
          label={t('Layout')}
          configName="plugin.prophet.layout"
          default="auto"
          options={[
            { label: t('Auto'), value: 'auto' },
            { label: t('Horizontal'), value: 'horizontal' },
            { label: t('Vertical'), value: 'vertical' },
          ]}
        />
      </div>
      <Gap />
      <div>
        <Button
          rightIcon={done ? 'small-tick' : undefined}
          intent="primary"
          onClick={handleClearHistory}
        >
          {t('Clear map history')}
        </Button>
      </div>
    </>
  )
}
