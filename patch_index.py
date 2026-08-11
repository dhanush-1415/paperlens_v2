with open('src/core/auth/index.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "} from './in-memory-provider';\n",
    "} from './in-memory-provider';\n\nexport {\n createSupabaseAuthProvider,\n type SupabaseAuthOptions,\n} from './supabase-provider';\n"
)

with open('src/core/auth/index.ts', 'w') as f:
    f.write(content)
