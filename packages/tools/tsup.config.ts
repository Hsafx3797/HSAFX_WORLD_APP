import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'calculators/index': 'src/calculators/index.ts',
    'converters/index': 'src/converters/index.ts',
    'data-converters/index': 'src/data-converters/index.ts',
    'encoders/index': 'src/encoders/index.ts',
    'generators/index': 'src/generators/index.ts',
    'generators/seo': 'src/generators/seo.ts',
    'generators/css': 'src/generators/css.ts',
    'generators/web': 'src/generators/web.ts',
    'generators/web-css': 'src/generators/web-css.ts',
    'generators/web-seo': 'src/generators/web-seo.ts',
    'text/index': 'src/text/index.ts',
    'validators/index': 'src/validators/index.ts',
    'validators/web': 'src/validators/web.ts',
    'specialized/index': 'src/specialized/index.ts',
    'engines/index': 'src/engines/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
  minify: false,
});
