with open('src/config/env.server.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "  TENANT_ID: z.string().default('default'),\n});",
    "  TENANT_ID: z.string().default('default'),\n  AUTH_PROVIDER: z.enum(['in-memory', 'supabase']).default('in-memory'),\n  SUPABASE_URL: z.string().url().optional(),\n  SUPABASE_ANON_KEY: z.string().optional(),\n});"
)

content = content.replace(
    "  .safeParse(process.env);",
    "  .refine((env) => env.AUTH_PROVIDER !== 'supabase' || (Boolean(env.SUPABASE_URL) && Boolean(env.SUPABASE_ANON_KEY)), {\n    message: 'SUPABASE_URL and SUPABASE_ANON_KEY are required when AUTH_PROVIDER is supabase',\n    path: ['SUPABASE_URL'],\n  })\n  .safeParse(process.env);"
)

with open('src/config/env.server.ts', 'w') as f:
    f.write(content)
