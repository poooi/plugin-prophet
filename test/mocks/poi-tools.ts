// Mock for views/utils/tools
export const compareUpdate = <T>(prev: T, next: T): T => {
  return JSON.stringify(prev) === JSON.stringify(next) ? prev : next
}
export const pickExisting = <T extends object>(existing: T, next: Partial<T>): Partial<T> => {
  const result: Partial<T> = {}
  for (const key of Object.keys(existing) as Array<keyof T>) {
    if (key in next) {
      result[key] = next[key]
    }
  }
  return result
}
