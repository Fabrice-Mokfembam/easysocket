import  terser  from '@rollup/plugin-terser';     
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts', 
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs', 
      sourcemap: true,
    },
    {
      file: 'dist/index.mjs',
      format: 'es', 
      sourcemap: true,
    },
    {
      file: 'dist/index.min.js',
      format: 'cjs',
      plugins: [terser()], 
      sourcemap: true,
    },
    {
      file: 'dist/index.min.mjs',
      format: 'es',
      plugins: [terser()],
      sourcemap: true,
    }
  ],
  plugins: [
    typescript() 
  ]
};