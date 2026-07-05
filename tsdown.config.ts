import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['cjs'],
  outDir: '.',
  target: 'es2019',
  fixedExtension: false,
  sourcemap: true,
  clean: false,
  dts: true,
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  deps: {
    neverBundle: [
      /^views\//,
      '@blueprintjs/core',
      /^react(\/.*)?$/,
      /^react-dom(\/.*)?$/,
      'react-fontawesome',
      'react-i18next',
      'react-redux',
      'redux',
      'redux-observers',
      'reselect',
      'styled-components',
      'lodash',
      /^lodash\/.*/,
      'classnames',
    ],
  },
})
