import { z } from 'zod';
// Nothing is hardcoded: every URL, port and address comes from the environment.
// Defaults target local development so the API runs with no .env at all.
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  // Comma-separated list of origins allowed to call the API.
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .startsWith('postgresql://', 'must be a postgresql:// connection string')
    .default('postgresql://postgres:postgres@localhost:5432/dawacheck?schema=public'),
  RPC_URL: z.url().default('http://127.0.0.1:8545'),
  CHAIN_ID: z.coerce.number().int().positive().default(31337),
  // Optional: the API must still start before the contract is deployed.
  REGISTRY_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'must be a 0x contract address')
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(env: Record<string, unknown>): Env {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${problems}`);
  }

  return result.data;
}

/** "http://a.com, http://b.com" -> ["http://a.com", "http://b.com"] */
export function corsOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}