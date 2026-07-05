/**
 * Asset path resolution utilities.
 * Resolves plugin-owned assets relative to the plugin package root.
 * Resolves Poi host-owned assets through window.ROOT.
 */
import path from 'path'

const PLUGIN_ROOT = path.resolve(__dirname, '../../')

export function resolvePluginPath(...parts: string[]): string {
  return path.resolve(PLUGIN_ROOT, ...parts)
}

export function resolveMainPath(...parts: string[]): string {
  return path.resolve(window.ROOT, ...parts)
}
