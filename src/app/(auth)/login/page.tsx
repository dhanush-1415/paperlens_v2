import type { Metadata } from 'next';
import { Suspense } from 'react';

import { isDevelopment } from '@/config';
import { DEMO_USERS } from '@/core/auth';
import { QUERY_PARAMS, sanitizeRedirectTo } from '@/shared/constants/query-params';
import { DEFAULT_AUTHENTICATED_ROUTE } from '@/shared/constants/routes';
import { Alert, Card, CardContent, Container, Heading, Section, Text } from '@/shared/ui';

import { SignInForm } from './sign-in-form';
import Link from 'next/link';

export const metadata: Metadata = {
 title: 'Sign in',
 robots: { index: false, follow: false },
};

async function SignIn({ searchParams }: { readonly searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
 const params = await searchParams;
 const raw = params[QUERY_PARAMS.redirectTo];

 const redirectTo = sanitizeRedirectTo(
 typeof raw === 'string' ? raw : undefined,
 DEFAULT_AUTHENTICATED_ROUTE,
 );

 return <SignInForm redirectTo={redirectTo} />;
}

export default function LoginPage(props: PageProps<'/login'>) {
 return (
 <div className="relative min-h-[calc(100vh-10rem)] w-full flex items-center justify-center overflow-hidden bg-canvas py-12 md:py-24">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--brand-primary-rgb),0.03),transparent_70%)] pointer-events-none" />
 <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
 <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-brand-primary/5 rounded-full blur-[80px] pointer-events-none -z-10" />

 <Container className="relative z-10 flex flex-col items-center">
 <div className="w-full max-w-[420px] rounded-3xl bg-surface-1/60 border border-border-strong/50 backdrop-blur-xl shadow-2xl overflow-hidden relative">
 <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent opacity-50" />
 
 <div className="p-8 md:p-10 flex flex-col gap-8">
 <div className="flex flex-col items-center text-center gap-3">
 <Link href="/" className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-hover shadow-[0_0_20px_-5px_rgba(var(--brand-primary-rgb),0.5)] mb-2">
 <span className=" text-2xl font-extrabold text-canvas">P</span>
 </Link>
 <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
 Welcome back
 </h1>
 <p className="text-sm text-text-secondary leading-relaxed font-medium">
 Your documents stay yours. We never sell or train on them.
 </p>
 </div>

 <Suspense fallback={<Card><CardContent>Loading…</CardContent></Card>}>
 <SignIn searchParams={props.searchParams} />
 </Suspense>

 {isDevelopment ? (
 <div className="mt-2 rounded-xl bg-risk-safe/5 border border-risk-safe/20 p-4 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-risk-safe/10 rounded-full blur-2xl pointer-events-none" />
 <h4 className="text-xs font-bold text-risk-safe uppercase tracking-widest mb-2">
 Development Build
 </h4>
 <p className="text-xs text-text-secondary leading-relaxed">
 Sessions come from <code className=" bg-surface-raised px-1 py-0.5 rounded text-text-primary">InMemoryAuthProvider</code>. 
 Sign in as <code className=" bg-surface-raised px-1 py-0.5 rounded text-text-primary">{DEMO_USERS[0]?.email}</code> with <code className=" bg-surface-raised px-1 py-0.5 rounded text-text-primary">{DEMO_USERS[0]?.password}</code>.
 </p>
 </div>
 ) : null}
 </div>
 </div>
 </Container>
 </div>
 );
}
