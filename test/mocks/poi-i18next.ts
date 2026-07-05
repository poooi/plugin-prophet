// Mock for views/env-parts/i18next
const i18next = {
  getFixedT: (_lang: string | null, _ns: string | string[]) => (key: string) => key,
  t: (key: string) => key,
  exists: () => false,
  language: 'en-US',
}
export default i18next
