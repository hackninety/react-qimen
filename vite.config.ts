import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/** node_modules 包名（含 scope），用于手动分包路由 */
function pkgOf(id: string): string | undefined {
  const m = id.match(/node_modules[\\/]((?:@[^\\/]+[\\/])?[^\\/]+)/);
  return m?.[1]?.replace('\\', '/');
}

/** 包名 → chunk 名：六引擎/历法/React/动画各自成包，便于缓存与体积归因 */
const CHUNK_BY_PKG: Record<string, string> = {
  '3meta': 'engine-3meta',
  'bigfishmarquis-qimen': 'engine-bigfish',
  'qimendunjia-standalone': 'engine-jelly',
  taobi: 'engine-taobi',
  kinqimen: 'engine-kinqimen',
  tyme4ts: 'engine-kinqimen', // kinqimen 的历法依赖，同包
  'qimen-mingfa': 'engine-mingfa',
  'lunar-typescript': 'calendar-lunar',
  react: 'react',
  'react-dom': 'react',
  scheduler: 'react',
  'framer-motion': 'motion',
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 6699,
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const pkg = pkgOf(id);
          // qmdj-ts-lib 与 react-markdown 生态不指派：保持随动态导入自然分包（懒加载）
          return pkg ? CHUNK_BY_PKG[pkg] : undefined;
        },
      },
    },
  },
});
