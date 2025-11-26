import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    client: '@hey-api/client-fetch',
    input: '../api/openapi.json',
    output: {
        path: './src/lib/api-client',
        format: 'prettier',
    },
    types: {
        enums: 'javascript',
    },
});
