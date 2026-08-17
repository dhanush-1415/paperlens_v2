import type { Metadata } from 'next';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = {
  title: 'Reset Password | PaperLens',
  description: 'Recover access to your PaperLens account',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
            Reset password
          </h1>
          <p className="text-sm leading-relaxed font-medium text-text-secondary">
            Enter your email and we&apos;ll send a secure reset link.
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  );
}
