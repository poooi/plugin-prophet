export * from './lib-battle-adapter'
export * from './constants'
export * from './spot'
export * from './transport'
export * from './path'

/**
 * determines layout by content width and height
 * @param width {number}
 * @param height {number}
 * @return 'horizontal' | 'vertical'
 */
export const getAutoLayout = (width, height) => {
  // vertical space limited, use horizontal layout
  if (height < 300) {
    return 'horizontal'
  }

  // suppose W:H = 5:3 is perfect ratio, it we have less height than the ratio, we'll use horizontal
  if (height * 5 < width * 3) {
    return 'horizontal'
  }

  return 'vertical'
}
