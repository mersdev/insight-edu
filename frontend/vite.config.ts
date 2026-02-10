import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const envDir = __dirname;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '');
  const apiKey = env.VITE_OPENAI_API_KEY || env.OPENAI_API_KEY || '';
  return {
    envDir,
    server: {
      port: 5173,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.OPENAI_API_KEY': JSON.stringify(apiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
