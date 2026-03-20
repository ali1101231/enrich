import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { authApi, ApiError } from '@/lib/api';
import { useApp } from '@/contexts/AppContext';

// â”€â”€â”€ blurred app preview (same as before) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AppPreview() {
  return (
    <div className="grid h-full grid-cols-[220px_1fr] blur-[1.2px]">
      <aside className="border-r border-[#e2dcf4] bg-[#f3efff] px-3 py-4">
        <div className="mb-5 flex items-center gap-1.5 text-[#2e2348]">
          <img src="/logo-web.png" alt="Enrich it" className="h-9 w-9 rounded-xl object-cover" />
          <div className="text-[28px] font-semibold tracking-tight">Enrich it</div>
        </div>
        <div className="space-y-2 text-[23px] text-[#433e57]">
          <div className="rounded-xl bg-[#dcd4f5] px-3 py-2 font-medium text-[#4f2fd6]">Dashboard</div>
          <div className="px-3 py-2">Runs</div>
          <div className="px-3 py-2">Files</div>
        </div>
        <div className="mt-8 border-t border-[#e3dcf7] pt-4 text-[20px] text-[#5f5a74]">
          <div className="px-3 py-2">Email Enricher</div>
          <div className="px-3 py-2">Phone Finder</div>
          <div className="px-3 py-2">Company Enricher</div>
          <div className="px-3 py-2">Domain â†’ LinkedIn</div>
        </div>
      </aside>
      <main className="bg-[#f8f5ff] px-6 py-5">
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-white/85 px-4 py-3">
          <div className="h-10 w-[380px] rounded-full bg-[#ece8f8]" />
          <div className="h-10 w-[210px] rounded-full bg-[#ece8f8]" />
        </div>
        <div className="rounded-[22px] bg-white/90 px-5 py-5 shadow-[0_18px_40px_rgba(55,41,98,0.08)]">
          <div className="h-12 w-[420px] rounded-xl bg-[#e9e3fa]" />
          <div className="mt-3 h-5 w-[300px] rounded-lg bg-[#ede8fb]" />
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-[#f4f0ff]" />
            ))}
          </div>
          <div className="mt-5 grid grid-cols-[1fr_320px] gap-4">
            <div className="h-[350px] rounded-2xl bg-[#f7f4ff]" />
            <div className="space-y-3">
              <div className="h-16 rounded-2xl bg-[#ece5ff]" />
              <div className="h-16 rounded-2xl bg-[#f1ebff]" />
              <div className="h-16 rounded-2xl bg-[#f1ebff]" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// â”€â”€â”€ card wrapper (top gradient bar + shadow) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Card({ children, wide = true }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className={`w-full overflow-hidden rounded-[20px] border border-[#d0c4f7] bg-white shadow-[0_40px_100px_rgba(83,52,174,0.32)] ${wide ? 'max-w-[820px]' : 'max-w-[480px]'}`}
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-[#7c3aed] via-[#6f4cc6] to-[#9f7aea]" />
      <div className="px-10 py-8 sm:px-12">{children}</div>
    </div>
  );
}

// â”€â”€â”€ Step 1: Email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StepEmail({
  onNext,
}: {
  onNext: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await authApi.sendOtp(email.trim().toLowerCase());
      onNext(email.trim().toLowerCase());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h1 className="mx-auto max-w-[420px] text-center text-[34px] font-bold leading-[1.1] tracking-[-0.03em] text-[#1e1245] sm:text-[46px]">
        Sign up for Enrich It â€” free forever
      </h1>
      <p className="mx-auto mt-4 max-w-[560px] text-center text-[16px] leading-[1.48] text-[#4e4572]">
        Find, contact, and close your ideal buyers with over 210 million contacts in one,
        easy-to-use AI sales platform.
      </p>
      <p className="mt-6 text-center text-[14px] font-medium text-[#7c6faa]">
        Enter your business email to get started
      </p>

      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your business email"
          className="h-[50px] flex-1 rounded-[11px] border border-[#d0c4f7] bg-white px-4 text-[15px] text-[#1e1245] outline-none transition placeholder:text-[#a799cc] focus:border-[#6f4cc6] focus:ring-2 focus:ring-[#6f4cc6]/15"
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="flex h-[50px] items-center justify-center gap-2 rounded-[11px] bg-[#6f4cc6] px-8 text-[15px] font-semibold text-white shadow-[0_8px_22px_rgba(111,76,198,0.38)] transition hover:bg-[#5e3daf] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Sendingâ€¦' : 'Sign up for free'}
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-center text-[13px] text-red-600">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center gap-4 text-[14px] text-[#9b8ec8]">
        <div className="h-px flex-1 bg-[#dfd7f7]" />
        <span>or</span>
        <div className="h-px flex-1 bg-[#dfd7f7]" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          className="flex h-[50px] items-center justify-center gap-3 rounded-[11px] border border-[#d0c4f7] bg-white text-[14px] font-medium text-[#2e1a6e] transition hover:border-[#9b7de8] hover:bg-[#f7f3ff]"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.21-2.27H12.24v4.3h6.31a5.4 5.4 0 0 1-2.34 3.54v2.94h3.79c2.22-2.05 3.49-5.09 3.49-8.51Z" />
            <path fill="#34A853" d="M12.24 24c3.17 0 5.82-1.05 7.76-2.84l-3.79-2.94c-1.05.71-2.39 1.13-3.97 1.13-3.05 0-5.64-2.05-6.57-4.81H1.76v3.03A11.72 11.72 0 0 0 12.24 24Z" />
            <path fill="#FBBC05" d="M5.67 14.54a7.04 7.04 0 0 1 0-4.48V7.03H1.76a11.72 11.72 0 0 0 0 10.54l3.91-3.03Z" />
            <path fill="#EA4335" d="M12.24 4.77c1.72 0 3.26.59 4.47 1.76l3.35-3.35A11.17 11.17 0 0 0 12.24 0 11.72 11.72 0 0 0 1.76 7.03l3.91 3.03c.93-2.76 3.52-4.81 6.57-4.81Z" />
          </svg>
          Sign up with Google
        </button>
        <button
          type="button"
          className="flex h-[50px] items-center justify-center gap-3 rounded-[11px] border border-[#d0c4f7] bg-white text-[14px] font-medium text-[#2e1a6e] transition hover:border-[#9b7de8] hover:bg-[#f7f3ff]"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <rect x="1" y="1" width="10" height="10" fill="#F25022" />
            <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
            <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
            <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
          </svg>
          Sign up with Microsoft
        </button>
      </div>

      <p className="mt-5 text-center text-[13px] text-[#9b8ec8]">
        By signing up, I agree to Enrich It&apos;s{' '}
        <span className="cursor-pointer text-[#6f4cc6] underline underline-offset-2">Terms of Service</span>{' '}
        and{' '}
        <span className="cursor-pointer text-[#6f4cc6] underline underline-offset-2">Privacy Policy</span>.
      </p>
    </Card>
  );
}

// â”€â”€â”€ Step 2: OTP verification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StepOtp({
  email,
  onBack,
  onNext,
}: {
  email: string;
  onBack: () => void;
  onNext: () => void;
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  // Focus first box on mount
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const submitOtp = useCallback(
    async (code: string) => {
      setLoading(true);
      setError('');
      try {
        await authApi.verifyOtp(email, code);
        setSuccess(true);
        setTimeout(onNext, 700);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Invalid code. Please try again.');
        setDigits(['', '', '', '', '', '']);
        setTimeout(() => refs.current[0]?.focus(), 0);
      } finally {
        setLoading(false);
      }
    },
    [email, onNext],
  );

  const handleInput = (i: number, raw: string) => {
    const val = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    setError('');
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (val && i === 5 && next.every(Boolean)) submitOtp(next.join(''));
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) submitOtp(pasted);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) return;
    submitOtp(code);
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await authApi.sendOtp(email);
      setCooldown(60);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => refs.current[0]?.focus(), 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card wide={false}>
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-[13px] font-medium text-[#7c6faa] transition hover:text-[#6f4cc6]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Icon */}
      <div className="mb-5 flex justify-center">
        <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-gradient-to-br from-[#6738dd]/20 to-[#9f7aea]/10 ring-1 ring-[#6738dd]/30 shadow-[0_8px_28px_rgba(103,56,221,0.25)]">
          <Mail className="h-8 w-8 text-[#7c3aed]" />
          {success && (
            <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e] shadow-lg">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Heading */}
      <h2 className="text-center text-[26px] font-bold leading-tight tracking-[-0.02em] text-[#1e1245]">
        Check your inbox
      </h2>
      <p className="mt-2 text-center text-[14px] leading-relaxed text-[#7c6faa]">
        We sent a 6-digit verification code to
        <br />
        <span className="font-semibold text-[#4f2fd6]">{email}</span>
      </p>

      {/* OTP boxes */}
      <form onSubmit={handleSubmit} className="mt-8">
        <div className="flex justify-center gap-2.5">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              disabled={loading || success}
              className={`h-[58px] w-[48px] rounded-[12px] border-2 bg-[#faf8ff] text-center text-[24px] font-bold text-[#1e1245] outline-none transition
                ${error ? 'border-red-400 bg-red-50' : d ? 'border-[#6f4cc6] bg-[#f3eeff] shadow-[0_0_0_3px_rgba(111,76,198,0.12)]' : 'border-[#d0c4f7] focus:border-[#6f4cc6] focus:bg-[#f9f5ff] focus:shadow-[0_0_0_3px_rgba(111,76,198,0.12)]'}
                disabled:opacity-50`}
            />
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-center text-[13px] text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={digits.join('').length < 6 || loading || success}
          className="mt-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-[11px] bg-[#6f4cc6] text-[15px] font-semibold text-white shadow-[0_8px_22px_rgba(111,76,198,0.38)] transition hover:bg-[#5e3daf] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Verified!
            </>
          ) : loading ? (
            'Verifyingâ€¦'
          ) : (
            'Verify code'
          )}
        </button>
      </form>

      {/* Resend */}
      <p className="mt-5 text-center text-[13px] text-[#9b8ec8]">
        Didn&apos;t receive it?{' '}
        {cooldown > 0 ? (
          <span className="font-medium text-[#b0a4cf]">Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-[#6f4cc6] underline underline-offset-2 transition hover:text-[#5e3daf] disabled:opacity-50"
          >
            {resending ? 'Sendingâ€¦' : 'Resend code'}
          </button>
        )}
      </p>
    </Card>
  );
}

// â”€â”€â”€ Step 3: Complete registration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StepComplete({
  email,
  onBack,
  onDone,
}: {
  email: string;
  onBack: () => void;
  onDone: (response: { user: import('@/lib/api').AuthUser; token: string }) => void;
}) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][strength];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError('');
    try {
      const result = await authApi.completeRegister(email, password, name.trim());
      onDone(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card wide={false}>
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-[13px] font-medium text-[#7c6faa] transition hover:text-[#6f4cc6]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Verified badge */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e]/15 ring-1 ring-[#22c55e]/40">
          <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
        </div>
        <span className="text-[13px] font-medium text-[#22c55e]">Email verified</span>
      </div>
      <h2 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-[#1e1245]">
        Complete your account
      </h2>
      <p className="mt-1 text-[14px] text-[#7c6faa]">Just a few more details to get you started.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        {/* Full name */}
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#3a3060]">
            Full name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a799cc]" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              className="h-[50px] w-full rounded-[11px] border border-[#d0c4f7] bg-white pl-10 pr-4 text-[15px] text-[#1e1245] outline-none transition placeholder:text-[#a799cc] focus:border-[#6f4cc6] focus:ring-2 focus:ring-[#6f4cc6]/15"
              required
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#3a3060]">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a799cc]" />
            <input
              type="email"
              value={email}
              readOnly
              className="h-[50px] w-full cursor-not-allowed rounded-[11px] border border-[#e6e0f7] bg-[#f7f4ff] pl-10 pr-10 text-[15px] text-[#7c6faa] outline-none"
            />
            <Lock className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c4b4f0]" />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#3a3060]">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="h-[50px] w-full rounded-[11px] border border-[#d0c4f7] bg-white px-4 pr-11 text-[15px] text-[#1e1245] outline-none transition placeholder:text-[#a799cc] focus:border-[#6f4cc6] focus:ring-2 focus:ring-[#6f4cc6]/15"
              required
              minLength={6}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a799cc] transition hover:text-[#6f4cc6]"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className="h-1 flex-1 rounded-full transition-all"
                    style={{ background: s <= strength ? strengthColor : '#e9e1f8' }}
                  />
                ))}
              </div>
              <p className="mt-1 text-[12px] font-medium" style={{ color: strengthColor }}>
                {strengthLabel}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#3a3060]">
            Confirm password
          </label>
          <div className="relative">
            <input
              type={showCf ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              className={`h-[50px] w-full rounded-[11px] border bg-white px-4 pr-11 text-[15px] text-[#1e1245] outline-none transition placeholder:text-[#a799cc] focus:ring-2
                ${confirm && confirm !== password
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-400/15'
                  : confirm && confirm === password
                  ? 'border-[#22c55e] focus:border-[#22c55e] focus:ring-[#22c55e]/15'
                  : 'border-[#d0c4f7] focus:border-[#6f4cc6] focus:ring-[#6f4cc6]/15'}`}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowCf((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a799cc] transition hover:text-[#6f4cc6]"
              tabIndex={-1}
            >
              {showCf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            {confirm && confirm === password && (
              <CheckCircle2 className="pointer-events-none absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 text-[#22c55e]" />
            )}
          </div>
          {confirm && confirm !== password && (
            <p className="mt-1 text-[12px] text-red-500">Passwords don&apos;t match</p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-center text-[13px] text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim() || !password || password !== confirm}
          className="mt-2 flex h-[50px] w-full items-center justify-center gap-2 rounded-[11px] bg-[#6f4cc6] text-[15px] font-semibold text-white shadow-[0_8px_22px_rgba(111,76,198,0.38)] transition hover:bg-[#5e3daf] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Creating accountâ€¦' : 'Create my account'}
        </button>
      </form>

      <p className="mt-4 text-center text-[13px] text-[#9b8ec8]">
        By creating an account, you agree to our{' '}
        <span className="cursor-pointer text-[#6f4cc6] underline underline-offset-2">Terms</span>{' '}
        and{' '}
        <span className="cursor-pointer text-[#6f4cc6] underline underline-offset-2">Privacy Policy</span>.
      </p>
    </Card>
  );
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function SignupPage() {
  const navigate = useNavigate();
  const { authenticate, isAuthenticated } = useApp();

  const [step, setStep] = useState<'email' | 'otp' | 'complete'>('email');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleEmailNext = (e: string) => {
    setEmail(e);
    setStep('otp');
  };

  const handleOtpNext = () => setStep('complete');

  const handleDone = (response: { user: import('@/lib/api').AuthUser; token: string }) => {
    authenticate(response);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f1eef9]">
      {/* blurred app background */}
      <div className="absolute inset-0 p-3 sm:p-5">
        <div className="h-full w-full overflow-hidden rounded-[30px] border border-[#ddd5f6] bg-[#f5f2ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <AppPreview />
        </div>
      </div>

      {/* dark overlay + blur */}
      <div className="absolute inset-0 bg-[#0d0b1f]/32 backdrop-blur-[8px]" />

      {/* modal */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6 sm:p-8">
        {step === 'email' && <StepEmail onNext={handleEmailNext} />}
        {step === 'otp' && (
          <StepOtp email={email} onBack={() => setStep('email')} onNext={handleOtpNext} />
        )}
        {step === 'complete' && (
          <StepComplete email={email} onBack={() => setStep('otp')} onDone={handleDone} />
        )}
      </div>
    </div>
  );
}
