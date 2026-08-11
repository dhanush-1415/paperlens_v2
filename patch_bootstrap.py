with open('src/server/bootstrap.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "import { createInMemoryAuthProvider } from '@/core/auth';",
    "import { createInMemoryAuthProvider, createSupabaseAuthProvider } from '@/core/auth';"
)

auth_provider_block = """  container.register(AUTH_PROVIDER, (c) => {
    if (serverEnv.AUTH_PROVIDER === 'supabase') {
      return createSupabaseAuthProvider({
        supabaseUrl: serverEnv.SUPABASE_URL!,
        supabaseKey: serverEnv.SUPABASE_ANON_KEY!,
        store: c.resolve(SESSION_STORE),
        now: c.resolve(CLOCK),
      });
    }

    if (isProduction) {
      c.resolve(LOGGER)
        .child('auth')
        .fatal('In-memory auth provider bound in a production build', undefined, {
          detail:
            'Passwords are compared as plaintext and sessions die with the process. ' +
            'Bind a real AuthProvider in buildServerContainer before serving real users.',
        });
    }

    return createInMemoryAuthProvider({
      store: c.resolve(SESSION_STORE),
      now: c.resolve(CLOCK),
    });
  });"""

import re
content = re.sub(r' container\.register\(AUTH_PROVIDER, \(c\) => \{[\s\S]*? return createInMemoryAuthProvider\(\{[\s\S]*? \}\);\n  \}\);', auth_provider_block, content)

with open('src/server/bootstrap.ts', 'w') as f:
    f.write(content)
