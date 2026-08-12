import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Explicitly load .env files to ensure process.env has the variables before config evaluation
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
});
