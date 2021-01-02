import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withNamespaces } from 'react-i18next'
import { Button } from '@blueprintjs/core'
import { connect } from 'react-redux'
import { set } from 'lodash'
import styled from 'styled-components'
// import FA from '@skagami/react-fontawesome'

import CheckboxLabelConfig from './checkbox-label-config'
import RadioCheck from './radio-check'

import { PLUGIN_KEY } from '../../utils'
import { CACHE, setLocalStorage } from '../../redux'

const CheckboxContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`

const Gap = styled.div`
  height: 2em;
  width: 100%;
`

@withNamespaces(PLUGIN_KEY)
@connect()
class SettingsClass extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
  }

  state = {
    done: false,
  }

  handleClearHistory = () => {
    const { dispatch } = this.props
    dispatch({
      type: '@@poi-plugin-prophet@clearHistory',
    })
    set(CACHE, 'history', {})
    setLocalStorage()
    this.setState({
      done: true,
    })
  }

  render() {
    const { t } = this.props
    const { done } = this.state
    return (
      <>
        <CheckboxContainer>
          <CheckboxLabelConfig
            label={t('Show scales on HP bar')}
            configName="plugin.prophet.showScale"
            defaultVal
          />
          <CheckboxLabelConfig
            label={t('Display enemy combined fleet in game order')}
            configName="plugin.prophet.ecGameOrder"
            defaultVal
          />
          <CheckboxLabelConfig
            label={t('Show enemy deck name if available')}
            configName="plugin.prophet.showEnemyTitle"
            defaultVal
          />
          <CheckboxLabelConfig
            label={t('Show last chosen formation hint')}
            configName="plugin.prophet.showLastFormation"
            defaultVal
          />
          <CheckboxLabelConfig
            label={t('Ship parameters include equipment bonus')}
            configName="plugin.prophet.useFinalParam"
            defaultVal
          />
          <CheckboxLabelConfig
            label={t('Heavily damaged notification')}
            configName="plugin.prophet.notify.enable"
            defaultVal
          />
          <CheckboxLabelConfig
            label={t('Enable avatars')}
            configName="plugin.prophet.showAvatar"
            defaultVal={false}
          />
        </CheckboxContainer>
        <Gap />
        <div>
          <RadioCheck
            label={t('Layout')}
            configName="plugin.prophet.layout"
            default="auto"
            options={[
              {
                label: t('Auto'),
                value: 'auto',
              },
              {
                label: t('Horizontal'),
                value: 'horizontal',
              },
              {
                label: t('Vertical'),
                value: 'vertical',
              },
            ]}
          />
        </div>
        <Gap />
        <div>
          <Button
            rightIcon={done ? 'small-tick' : undefined}
            intent="primary"
            onClick={this.handleClearHistory}
          >
            {t('Clear map history')}
          </Button>
        </div>
      </>
    )
  }
}

export default SettingsClass
