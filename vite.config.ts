import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
        }),
    ],
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'GameEngineSocket',
            formats: ['es', 'umd'],
            fileName: (format) => `game-engine-socket.${format}.js`,
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'socket.io-client'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'socket.io-client': 'io',
                },
            },
        },
    },
});
