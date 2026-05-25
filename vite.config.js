import { defineConfig } from 'vite';

export default defineConfig({
    build:{
        rollupOptions:{
            input:{
                main:'index.html',
                page_1:'page_1/index.html',
                page_2:'page_2/index.html',
            }
        }
    }
});