import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'api/**/*',
          dest: 'api'
        },
        {
          src: 'dmxAppConnect/**/*',
          dest: 'dmxAppConnect'
        },
        {
          src: 'dmxRouting/**/*',
          dest: 'dmxRouting'
        },
        {
          src: 'dmxStateManagement/**/*',
          dest: 'dmxStateManagement'
        },
        {
          src: 'bootstrap/**/*',
          dest: 'bootstrap'
        },
        {
          src: 'fontawesome6/**/*',
          dest: 'fontawesome6'
        },
        {
          src: 'fonts/**/*',
          dest: 'fonts'
        },
        {
          src: 'js/**/*',
          dest: 'js'
        },
        {
          src: 'files/**/*',
          dest: 'files'
        }
      ]
    })
  ],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
});
