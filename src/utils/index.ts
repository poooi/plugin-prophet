export * from './lib-battle-adapter'
export * from './constants'
export * from './spot'
export * from './transport'
export * from './path'

export const getAutoLayout = (width: number, height: number): 'horizontal' | 'vertical' => {
  if (height < 300) return 'horizontal'
  if (height * 5 < width * 3) return 'horizontal'
  return 'vertical'
}
