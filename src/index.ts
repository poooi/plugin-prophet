/**
 * Poi plugin entry point.
 * Exports: reactClass, settingsClass, reducer, switchPluginPath.
 */
export { ProphetRoot as reactClass } from './plugin/prophet-root'
export { SettingsRoot as settingsClass } from './plugin/settings-root'
export { reducer } from './state/plugin-reducer'
export { switchPluginPath } from './plugin/plugin-exports'
