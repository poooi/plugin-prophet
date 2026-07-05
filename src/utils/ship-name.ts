/**
 * Ship name text width measurement utility.
 */

let textCanvas: HTMLCanvasElement | null = null
let computedFont = ''

function getFont(): string {
  if (typeof document === 'undefined') return ''
  const mainWrapper = document.querySelector('#plugin-prophet')
  if (!mainWrapper) return ''
  const style = window.getComputedStyle(mainWrapper)
  return `${style.getPropertyValue('font-size')} ${style.getPropertyValue('font-family')}`
}

export function getTextWidth(text: string): number {
  if (typeof document === 'undefined') return 0
  if (!textCanvas) textCanvas = document.createElement('canvas')
  const ctx = textCanvas.getContext('2d')
  if (!ctx) return 0
  if (!computedFont) computedFont = getFont()
  ctx.font = computedFont
  return Math.ceil(ctx.measureText(text).width)
}

export function getFullname(
  t: (key: string, opts?: Record<string, unknown>) => string,
  name: string,
  yomi: string,
  apiId: number,
): string {
  const baseName = t(name)
  const fullName = t(name, { context: apiId ? String(apiId) : undefined })
  if (fullName !== baseName && fullName) return fullName
  if (['elite', 'flagship'].includes(yomi)) {
    return `${baseName} ${yomi.charAt(0).toUpperCase() + yomi.slice(1)}`
  }
  return baseName
}
