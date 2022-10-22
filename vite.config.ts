import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import typescript from 'rollup-plugin-typescript2';

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'Socket Methods',
      formats: ['es', 'umd'],
      // the proper extensions will be added
      fileName: (format) => `socket-methods.${format}.js`,
    },
  },
  plugins: [
    dts({ insertTypesEntry: true }),
    {
      ...typescript({
        check: true,
        tsconfig: './tsconfig.json',
        tsconfigOverride: {
          noEmits: true,
        },
      }),
      // run before build
      enforce: 'pre',
  },
  ],
})