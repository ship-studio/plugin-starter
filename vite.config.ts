import { defineConfig } from 'vite';

/**
 * Vite build config for Ship Studio plugins.
 *
 * Key details:
 * - React and ReactDOM are externalized via data: URL modules that read from
 *   the host app's window globals. This is necessary because Vite's
 *   rollupOptions.external + globals don't work with ES module output.
 * - Output is a single ES module at dist/index.js.
 * - Minification is disabled so plugin source is readable for debugging.
 */
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    minify: false,
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      // Map React imports to data: URL modules that re-export from window globals.
      // Plugins share the host app's React instance — bundling a separate copy
      // would cause hooks to break (duplicate React).
      react: `data:text/javascript,export default window.__SHIPSTUDIO_REACT__;export const useState=window.__SHIPSTUDIO_REACT__.useState;export const useEffect=window.__SHIPSTUDIO_REACT__.useEffect;export const useCallback=window.__SHIPSTUDIO_REACT__.useCallback;export const useMemo=window.__SHIPSTUDIO_REACT__.useMemo;export const useRef=window.__SHIPSTUDIO_REACT__.useRef;export const useContext=window.__SHIPSTUDIO_REACT__.useContext;export const createElement=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;`,
      'react-dom': `data:text/javascript,export default window.__SHIPSTUDIO_REACT_DOM__`,
      'react/jsx-runtime': `data:text/javascript,export const jsx=window.__SHIPSTUDIO_REACT__.createElement;export const jsxs=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;`,
    },
  },
});
