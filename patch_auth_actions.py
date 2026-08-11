import re

with open('src/server/actions/auth.ts', 'r') as f:
    content = f.read()

signup_schema_and_action = """
const SIGN_UP_SCOPE = 'auth.register';

const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, { message: 'validation.minLength' }),
  displayName: z.string().optional(),
  redirectTo: z.string().optional(),
});

export const signUpAction = action(
  'auth.signUp',
  async (_previous: unknown, formData: FormData): Promise<never> => {
    const container = getServerContainer();

    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const decision = await container.resolve(RATE_LIMITER).consume(SIGN_UP_SCOPE, email);

    if (!decision.allowed) {
      const nowMs = container.resolve(CLOCK)().getTime();
      throw rateLimitError(
        Math.max(1, Math.ceil((decision.resetAt - nowMs) / 1_000)),
        SIGN_UP_SCOPE,
      );
    }

    const input = unwrapOrThrow(parseFormData(signUpSchema, formData));

    const attempt = await container.resolve(AUTH_PROVIDER).signUp({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      acceptedTerms: true,
    });

    if (!attempt.ok) {
      container.resolve(ANALYTICS).track('signup.failed', { reason: 'credentials' });
      throw attempt.error;
    }

    container.resolve(ANALYTICS).track('signup.completed', { method: 'email' });
    redirect(sanitizeRedirectTo(input.redirectTo, DEFAULT_AUTHENTICATED_ROUTE));
  },
);
"""

content = content.replace("export const signOutAction", signup_schema_and_action + "\nexport const signOutAction")

with open('src/server/actions/auth.ts', 'w') as f:
    f.write(content)
