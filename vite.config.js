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
    }),
    {
      name: 'preserve-external-links',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          const lines = html.split('\n');
          const cssToPreserve = [
            '<link rel="stylesheet" href="/bootstrap/5/css/bootstrap.min.css" />',
            '<link rel="stylesheet" href="/fontawesome6/css/all.min.css" />',
            '<link rel="stylesheet" href="/dmxAppConnect/dmxBootstrap5TableGenerator/dmxBootstrap5TableGenerator.css" />'
          ];

          const headEndIndex = lines.findIndex(line => line.includes('</head>'));
          if (headEndIndex > -1) {
            cssToPreserve.forEach(link => {
              if (!html.includes(link)) {
                lines.splice(headEndIndex, 0, '    ' + link);
              }
            });
          }

          return lines.join('\n');
        }
      }
    }
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
