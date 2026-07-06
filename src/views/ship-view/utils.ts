import _ from 'lodash'

const getFont = (): string => {
  const mainWrapper = document.querySelector('#plugin-prophet')
  if (!mainWrapper) return ''
  const mainWrapperStyle = window.getComputedStyle(mainWrapper, null)
  return `${mainWrapperStyle.getPropertyValue('font-size')} ${mainWrapperStyle.getPropertyValue('font-family')}`
}

const textCanvas = document.createElement('canvas')
let computedFont = ''

export const getTextWidth = (text: string): number => {
  const context = textCanvas.getContext('2d')!
  computedFont = computedFont || getFont()
  context.font = computedFont
  const metrics = context.measureText(text)
  return Math.ceil(metrics.width)
}

export const getFullname = (
  t: (key: string, opts?: Record<string, unknown>) => string,
  name: string,
  yomi: string,
  apiId: number,
): string => {
  const baseName = t(name)
  const fullName = t(name, { context: apiId && apiId.toString() })
  return (
    (fullName !== baseName && fullName) ||
    (['elite', 'flagship'].includes(yomi)
      ? `${baseName} ${_.capitalize(yomi)}`
      : baseName)
  )
}
