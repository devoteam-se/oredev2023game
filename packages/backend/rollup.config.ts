import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'src/main.ts',
  output: {
    file: 'dist/bundle.cjs',
    format: 'cjs',
  },
  plugins: [nodeResolve(), commonjs(), json()],
};
