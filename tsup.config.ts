import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/faq.ts'],
    format: ['esm', 'cjs'],
    target: 'node20',
    outDir: 'dist',
    clean: true,
    banner: {
        js: '#!/usr/bin/env node',
    }
})
