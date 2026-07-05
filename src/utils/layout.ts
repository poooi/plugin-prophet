/**
 * Layout utility: determines display layout from container dimensions.
 */

export type Layout = 'horizontal' | 'vertical'

export function getAutoLayout(width: number, height: number): Layout {
  if (height < 300) return 'horizontal'
  if (height * 5 < width * 3) return 'horizontal'
  return 'vertical'
}

export const combinedFleetType: Record<number, string> = {
  0: 'Sortie Fleet',
  1: 'Carrier Task Force',
  2: 'Surface Task Force',
  3: 'Transport Escort',
}
