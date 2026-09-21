import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 keeps the connection URL out of schema.prisma: migrations read it here,
// the running app passes it through the pg adapter (see src/prisma/prisma.service.ts).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
