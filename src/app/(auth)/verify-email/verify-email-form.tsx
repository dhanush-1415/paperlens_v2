'use client';

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useRef,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyOtpAction, resendOtpAction } from '@/server/actions/auth';
import { cn } from '@/shared/ui/cn';
import { Button, Alert, Text } from '@/shared/ui';

/* --- 6-box OTP input ------------------------------------------------------- */
interface OtpInputProps {
  value: string[];
  onChange: (val: string[]) => void;
  hasError: boolean;
}

function OtpInput({ value, onChange, hasError }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const focus = (i: number) => refs.current[i]?.focus();

  // Auto-focus first box on mount
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const handleChange = (i: number, raw: string) => {
    const char = raw.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[i] = char;
    onChange(next);
    if (char && i < 5) focus(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[i]) {
        const next = [...value];
        next[i] = '';
        onChange(next);
      } else if (i > 0) {
        focus(i - 1);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focus(i - 1);
    } else if (e.key === 'ArrowRight' && i < 5) {
      focus(i + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    const next = Array(6).fill('');
    digits.forEach((d, i) => {
      next[i] = d;
    });
    onChange(next);
    focus(Math.min(digits.length, 5));
  };

  return (
    <div className="flex justify-center gap-2 py-4 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-12 w-10 rounded-xl border border-border-strong/50 bg-surface-2/50 text-center text-xl font-bold text-text-primary sm:h-14 sm:w-12 sm:text-2xl',
            'transition-all outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20',
            hasError
              ? 'border-risk-critical text-risk-critical focus:border-risk-critical focus:ring-risk-critical/20'
              : value[i]
                ? 'border-brand-primary/50 text-brand-primary'
                : '',
          )}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

/* --- Main content ---------------------------------------------------------- */
const RESEND_SECONDS = 30;

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [isPending, startTransition] = useTransition();
  const [isResending, startResend] = useTransition();

  const canResend = seconds <= 0;
  const otp = digits.join('');
  const formatted = `0:${String(seconds).padStart(2, '0')}`;

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const handleVerify = useCallback(() => {
    if (otp.length < 6 || isPending) return;
    setOtpError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('token', otp);
      try {
        await verifyOtpAction(null, formData);
      } catch (err: unknown) {
        setOtpError(err instanceof Error ? err.message : 'Invalid verification code');
        setDigits(Array(6).fill(''));
      }
    });
  }, [otp, email, isPending]);

  useEffect(() => {
    if (otp.length === 6 && !digits.includes('')) setTimeout(handleVerify, 0);

  }, [otp]);

  const handleResend = useCallback(() => {
    if (!canResend || !email) return;
    startResend(async () => {
      const formData = new FormData();
      formData.append('email', email);
      try {
        await resendOtpAction(null, formData);
        setSeconds(RESEND_SECONDS);
        setDigits(Array(6).fill(''));
        setOtpError(null);
      } catch (err: unknown) {
        setOtpError(err instanceof Error ? err.message : 'Failed to resend code');
      }
    });
  }, [canResend, email]);

  return (
    <div className="flex w-full flex-col gap-5">
      {otpError && (
        <Alert tone="critical" title="Verification Failed">
          <Text size="sm">{otpError}</Text>
        </Alert>
      )}

      <OtpInput value={digits} onChange={setDigits} hasError={!!otpError} />

      <Button
        variant="premium"
        size="lg"
        fullWidth
        onClick={handleVerify}
        loading={isPending}
        disabled={otp.length < 6 || digits.includes('')}
        className="mt-2"
      >
        Verify Email
      </Button>

      <div className="mt-2 flex flex-col gap-4 border-t border-border-strong/30 pt-4">
        {canResend ? (
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={handleResend}
            loading={isResending}
          >
            Resend code
          </Button>
        ) : (
          <p className="py-2 text-center text-sm font-medium text-text-tertiary">
            Resend in <span className="font-mono font-bold text-text-primary">{formatted}</span>
          </p>
        )}
      </div>
    </div>
  );
}
