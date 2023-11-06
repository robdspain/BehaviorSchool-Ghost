import react from '@vitejs/plugin-react';
import glob from 'glob';
import {resolve} from 'path';
import svgr from 'vite-plugin-svgr';
import {defineConfig} from 'vitest/config';

// https://vitejs.dev/config/
export default (function viteConfig() {
    return defineConfig({
        plugins: [
            svgr(),
            react()
        ],
        define: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            'process.env.VITEST_SEGFAULT_RETRY': 3,
            'process.env.DEBUG': false // Shim env var utilized by the @tryghost/nql package
        },
        preview: {
            port: 4174
        },
        build: {
            minify: false,
            sourcemap: true,
            outDir: 'es',
            lib: {
                formats: ['es'],
                entry: glob.sync(resolve(__dirname, 'src/**/*.{ts,tsx}')).reduce((entries, path) => {
                    if (path.includes('.stories.') || path.endsWith('.d.ts')) {
                        return entries;
                    }

                    const outPath = path.replace(resolve(__dirname, 'src') + '/', '').replace(/\.(ts|tsx)$/, '');
                    entries[outPath] = path;
                    return entries;
                }, {} as Record<string, string>)
            },
            commonjsOptions: {
                include: [/packages/, /node_modules/]
            },
            rollupOptions: {
                external: /node_modules/
            }
        },
        test: {
            globals: true, // required for @testing-library/jest-dom extensions
            environment: 'jsdom',
            include: ['./test/unit/**/*'],
            testTimeout: process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 10000,
            ...(process.env.CI && { // https://github.com/vitest-dev/vitest/issues/1674
                minThreads: 1,
                maxThreads: 2
            })
        }
    });
});
