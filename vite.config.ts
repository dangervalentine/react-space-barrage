import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

const singleFile = process.env.SINGLE_FILE === 'true';

export default defineConfig({
  plugins: [react(), ...(singleFile ? [viteSingleFile()] : [])],
  base: singleFile ? './' : '/react-space-barrage/',
  resolve: {
    alias: {
      '@arcade': path.resolve(__dirname, 'src/arcade'),
      '@arcade/cabinet.module.css': path.resolve(__dirname, 'src/arcade/cabinet.module.css'),
      '@arcade/visually-hidden.module.css': path.resolve(__dirname, 'src/arcade/visually-hidden.module.css'),
    },
  },
});
