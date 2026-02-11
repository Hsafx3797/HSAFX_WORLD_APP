import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'registry/index': 'src/registry/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: {
    // Generate types from all source files including types.ts
    entry: {
      index: 'src/index.ts',
      types: 'src/types.ts',
      'registry/index': 'src/registry/index.ts',
    },
  },
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
  minify: false,
});
