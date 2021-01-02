import _ from 'lodash'

/**
 * compute css font size and font-family info based on main wrapper
 */
const getFont = () => {
  const mainWrapper = document.querySelector('#plugin-prophet')
  if (!mainWrapper) {
    return ''
  }

  const mainWrapperStyle = window.getComputedStyle(mainWrapper, null)

  return `${mainWrapperStyle.getPropertyValue(
    'font-size',
  )} ${mainWrapperStyle.getPropertyValue('font-family')}`
}

const textCanvas = document.createElement('canvas')
let computedFont = ''

/**
 * mesure given text's rendered width
 * @param text {string} text to measure
 */
export const getTextWidth = (text) => {
  const context = textCanvas.getContext('2d')
  computedFont = computedFont || getFont()
  context.font = computedFont
  const metrics = context.measureText(text)
  return Math.ceil(metrics.width)
}

export const getFullname = (t, name, yomi, apiId) => {
  const baseName = t(name)
  const fullName = t(name, { context: apiId && apiId.toString() })
  return (
    (fullName !== baseName && fullName) ||
    (['elite', 'flagship'].includes(yomi)
      ? `${baseName} ${_.capitalize(yomi)}`
      : baseName)
  )
}
