import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  Mail,
  Phone,
  UserRound,
  X,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

type AuthMode = 'login' | 'signup';

type SocialProvider = {
  label: string;
  icon: ReactNode;
};

const socialProviders: SocialProvider[] = [
  {
    label: 'Log In with Google',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.55-.21-2.27H12.24v4.3h6.31a5.4 5.4 0 0 1-2.34 3.54v2.94h3.79c2.22-2.05 3.49-5.09 3.49-8.51Z"
        />
        <path
          fill="#34A853"
          d="M12.24 24c3.17 0 5.82-1.05 7.76-2.84l-3.79-2.94c-1.05.71-2.39 1.13-3.97 1.13-3.05 0-5.64-2.05-6.57-4.81H1.76v3.03A11.72 11.72 0 0 0 12.24 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.67 14.54a7.04 7.04 0 0 1 0-4.48V7.03H1.76a11.72 11.72 0 0 0 0 10.54l3.91-3.03Z"
        />
        <path
          fill="#EA4335"
          d="M12.24 4.77c1.72 0 3.26.59 4.47 1.76l3.35-3.35A11.17 11.17 0 0 0 12.24 0 11.72 11.72 0 0 0 1.76 7.03l3.91 3.03c.93-2.76 3.52-4.81 6.57-4.81Z"
        />
      </svg>
    ),
  },
  {
    label: 'Log In with Microsoft',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
        <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
        <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
        <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
      </svg>
    ),
  },
  {
    label: 'Sign in with Apple',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M16.84 12.6c.03 2.9 2.55 3.87 2.58 3.89-.02.07-.4 1.37-1.32 2.72-.79 1.17-1.62 2.34-2.91 2.36-1.27.02-1.68-.76-3.13-.76-1.46 0-1.9.74-3.1.78-1.24.05-2.19-1.25-2.99-2.41C4.3 16.66 3 12.98 4.7 10.03c.84-1.47 2.35-2.4 3.99-2.42 1.25-.03 2.43.84 3.13.84.69 0 1.99-1.04 3.35-.89.57.02 2.15.23 3.17 1.73-.08.05-1.89 1.1-1.86 3.31ZM14.35 5.93c.66-.8 1.1-1.92.98-3.03-.95.04-2.1.64-2.78 1.43-.61.7-1.15 1.83-1.01 2.91 1.05.08 2.13-.53 2.81-1.31Z" />
      </svg>
    ),
  },
  {
    label: 'Log In with your Organization',
    icon: <Link2 className="h-4 w-4" aria-hidden="true" />,
  },
];

const quickActions = [
  { label: 'Add to list', icon: <Building2 className="h-4 w-4" aria-hidden="true" /> },
  { label: 'Add to sequence', icon: <ChevronRight className="h-4 w-4" aria-hidden="true" /> },
  { label: 'Compose email', icon: <Mail className="h-4 w-4" aria-hidden="true" /> },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, user } = useApp();

  const [activeTab, setActiveTab] = useState<AuthMode>(location.pathname === '/signup' ? 'signup' : 'login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [signInEmail, setSignInEmail] = useState('arlo.simmons@thebussin-design.info');
  const [signInPassword, setSignInPassword] = useState('password123');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(location.pathname === '/signup' ? 'signup' : 'login');
    setFormError(null);
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
        return;
      }

      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const err = await login(signInEmail, signInPassword);
    if (err) {
      setFormError(err);
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (signUpPassword !== signUpConfirm) {
      setFormError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const err = await register(signUpEmail, signUpPassword, signUpName || undefined);
    if (err) {
      setFormError(err);
      setIsSubmitting(false);
    }
  };

  const switchTo = (tab: AuthMode) => {
    setFormError(null);
    setIsSubmitting(false);
    setActiveTab(tab);
    navigate(tab === 'signup' ? '/signup' : '/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#262223] text-white">
      <div className="grid min-h-screen lg:grid-cols-[43.2%_56.8%]">
        <section className="relative flex min-h-screen flex-col bg-[#262223] px-7 pb-8 pt-6 sm:px-10 lg:px-0 lg:pt-5">
          <div className="mb-10 flex items-center gap-3 pl-1 text-[15px] font-semibold tracking-tight text-white/95 lg:ml-7 lg:mb-0 lg:mt-1">
            <div className="grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-white/6 text-white">
              <div className="h-3.5 w-3.5 rounded-full border border-white/80 border-l-transparent border-r-transparent" />
            </div>
            <span>Apollo</span>
          </div>

          <div className="mx-auto flex w-full max-w-[354px] flex-1 flex-col justify-center lg:ml-[clamp(176px,24vw,248px)] lg:mr-0 lg:max-w-[354px] lg:justify-start lg:pt-[104px] xl:pt-[110px]">
            <div className="mb-[27px] rounded-[13px] border border-white/10 bg-white/[0.035] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
              <div className="grid grid-cols-2 gap-1.5 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => switchTo('login')}
                  className={`rounded-[10px] px-4 py-[13px] transition ${
                    activeTab === 'login'
                      ? 'bg-[#e6e3e4] text-[#2a2727] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]'
                      : 'text-white/78 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => switchTo('signup')}
                  className={`flex items-center justify-center gap-2 rounded-[10px] px-4 py-[13px] transition ${
                    activeTab === 'signup'
                      ? 'bg-[#e6e3e4] text-[#2a2727] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]'
                      : 'text-white/78 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Sign Up
                </button>
              </div>
            </div>

            <div className="mb-[28px] space-y-[13px]">
              {socialProviders.map((provider) => (
                <button
                  key={provider.label}
                  type="button"
                  className="flex h-[49px] w-full items-center justify-center gap-3 rounded-[11px] border border-white/10 bg-transparent px-4 text-[15px] font-semibold text-white/88 transition hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <span className="grid h-5 w-5 place-items-center text-white/92">{provider.icon}</span>
                  <span>{provider.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-[30px] flex items-center gap-4 px-9 text-sm text-white/45">
              <div className="h-px flex-1 bg-white/12" />
              <span>Or</span>
              <div className="h-px flex-1 bg-white/12" />
            </div>

            {formError && (
              <div
                className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                {formError}
              </div>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleSignIn} className="space-y-[18px]">
                <div className="space-y-2.5">
                  <label htmlFor="sign-in-email" className="block text-[15px] font-semibold text-white/82">
                    Email
                  </label>
                  <input
                    id="sign-in-email"
                    type="email"
                    value={signInEmail}
                    onChange={(event) => setSignInEmail(event.target.value)}
                    className="h-[42px] w-full rounded-[10px] border border-white/16 bg-[#211d1e] px-4 text-[15px] text-white outline-none transition placeholder:text-white/24 focus:border-[#eef75c] focus:bg-[#191617]"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="sign-in-password" className="block text-[15px] font-semibold text-white/82">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="sign-in-password"
                      type={showPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(event) => setSignInPassword(event.target.value)}
                      className="h-[42px] w-full rounded-[10px] border border-white/16 bg-[#211d1e] px-4 pr-12 text-[15px] text-white outline-none transition placeholder:text-white/24 focus:border-[#eef75c] focus:bg-[#191617]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white/72"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 flex h-[41px] w-full items-center justify-center rounded-[10px] bg-[#f3f75f] text-[16px] font-bold text-[#2b2a24] transition hover:bg-[#edf04a] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
                </button>

                <div className="flex items-center justify-between gap-4 pt-1 text-[13px]">
                  <button
                    type="button"
                    onClick={() => setKeepSignedIn((current) => !current)}
                    className="flex items-center gap-2 text-white/72 transition hover:text-white"
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded border transition ${
                        keepSignedIn ? 'border-white/30 bg-[#e6e3e4] text-[#2b2a24]' : 'border-white/20 bg-transparent text-transparent'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>Keep me signed in</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password', { replace: true })}
                    className="text-[#b7d7ff] underline-offset-2 transition hover:text-white hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-[18px]">
                <div className="space-y-2.5">
                  <label htmlFor="sign-up-name" className="block text-[15px] font-semibold text-white/82">
                    Full name
                  </label>
                  <input
                    id="sign-up-name"
                    type="text"
                    value={signUpName}
                    onChange={(event) => setSignUpName(event.target.value)}
                    className="h-[42px] w-full rounded-[10px] border border-white/16 bg-[#211d1e] px-4 text-[15px] text-white outline-none transition placeholder:text-white/24 focus:border-[#eef75c] focus:bg-[#191617]"
                    placeholder="Tim Zheng"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="sign-up-email" className="block text-[15px] font-semibold text-white/82">
                    Work email
                  </label>
                  <input
                    id="sign-up-email"
                    type="email"
                    value={signUpEmail}
                    onChange={(event) => setSignUpEmail(event.target.value)}
                    className="h-[42px] w-full rounded-[10px] border border-white/16 bg-[#211d1e] px-4 text-[15px] text-white outline-none transition placeholder:text-white/24 focus:border-[#eef75c] focus:bg-[#191617]"
                    placeholder="you@company.com"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="sign-up-password" className="block text-[15px] font-semibold text-white/82">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="sign-up-password"
                      type={showPassword ? 'text' : 'password'}
                      value={signUpPassword}
                      onChange={(event) => setSignUpPassword(event.target.value)}
                      className="h-[42px] w-full rounded-[10px] border border-white/16 bg-[#211d1e] px-4 pr-12 text-[15px] text-white outline-none transition placeholder:text-white/24 focus:border-[#eef75c] focus:bg-[#191617]"
                      placeholder="Create a password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white/72"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="sign-up-confirm" className="block text-[15px] font-semibold text-white/82">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="sign-up-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={signUpConfirm}
                      onChange={(event) => setSignUpConfirm(event.target.value)}
                      className="h-[42px] w-full rounded-[10px] border border-white/16 bg-[#211d1e] px-4 pr-12 text-[15px] text-white outline-none transition placeholder:text-white/24 focus:border-[#eef75c] focus:bg-[#191617]"
                      placeholder="Repeat your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white/72"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 flex h-[41px] w-full items-center justify-center rounded-[10px] bg-[#f3f75f] text-[16px] font-bold text-[#2b2a24] transition hover:bg-[#edf04a] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
                </button>
              </form>
            )}

            <div className="mt-[70px] pl-1 text-center text-[13px] text-white/48 lg:mt-[74px]">2026 All Rights Reserved.</div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-transparent lg:block">

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-[720px] w-[880px] origin-center scale-[0.88] xl:scale-[0.96] 2xl:scale-100">
              <div className="absolute left-[126px] top-[62px] h-[606px] w-[520px] overflow-hidden bg-[#d7e0f4] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.44)] [clip-path:polygon(14%_0%,100%_0%,100%_100%,16%_100%,0%_86%,0.8%_22%)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(255,255,255,0.56),transparent_24%),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.42),transparent_24%)]" />
              </div>

              <div className="absolute left-[356px] top-[108px] z-20 grid h-[31px] w-[31px] place-items-center rounded-[6px] bg-[#f3f75f] text-[#1d1c14] shadow-[0_12px_24px_rgba(76,82,20,0.18)]">
                <span className="text-[18px] leading-none">✳</span>
              </div>

              <div className="absolute left-[252px] top-[236px] z-10 h-[146px] w-[226px] rounded-[18px] border border-[#d1d9ee] bg-white/78 shadow-[0_20px_40px_rgba(111,132,168,0.18)] backdrop-blur-sm">
                <div className="flex h-7 items-center gap-1 rounded-t-[18px] bg-[#2d6698] px-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                </div>
                <div className="space-y-3 px-4 py-4">
                  <div className="h-4 w-16 rounded-full bg-[#edf1f7]" />
                  <div className="h-4 w-24 rounded-full bg-[#edf1f7]" />
                  <div className="h-16 rounded-2xl bg-[#f5f7fb]" />
                </div>
              </div>

              <div className="absolute left-[416px] top-[76px] z-30 w-[274px] rounded-[18px] border border-[#d8d5d1] bg-[#f6f2ee] shadow-[0_24px_60px_rgba(105,110,128,0.24)]">
                <div className="flex items-center justify-between border-b border-[#e5ded6] px-4 py-3 text-[#2d2926]">
                  <div className="flex items-center gap-2 text-[15px] font-semibold">
                    <span className="text-[13px] leading-none">✳</span>
                    <span>Apollo</span>
                  </div>
                  <X className="h-4 w-4 text-[#746e68]" />
                </div>

                <div className="px-4 pb-4 pt-3">
                  <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-white/75 p-1 text-[11px] font-semibold text-[#7a746e] shadow-[inset_0_0_0_1px_rgba(213,205,196,0.65)]">
                    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#45403c] px-3 py-[8px] text-white">
                      <UserRound className="h-3.5 w-3.5" />
                      <span>Person</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-[8px]">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Company</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-[13px] font-bold text-[#2d2926]">Tim Zheng</div>
                    <div className="mt-1 text-[11px] font-medium text-[#7b7671]">CEO & Founder at Apollo</div>
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#d9efd6] px-2 py-1 text-[10px] font-semibold text-[#547b53]">
                      <span>95</span>
                      <span>Excellent match</span>
                    </div>
                  </div>

                  <div className="mb-5 rounded-[18px] border border-[#e7e1db] bg-white/95 px-2 py-3 shadow-[0_12px_24px_rgba(112,115,131,0.1)]">
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-[#6e6964]">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          className="flex flex-col items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-[#f7f3ef]"
                        >
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f5f2ee] text-[#6c6760]">
                            {action.icon}
                          </span>
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 border-b border-[#e7e1db] pb-5 text-[#5a5754]">
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f7f3ef] text-[#4d8a57]">
                        <Mail className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-[12px] font-semibold text-[#4e4a46]">tz@apollo.io</div>
                        <div className="text-[10px] font-medium text-[#9a948e]">Work</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f7f3ef] text-[#6d665d]">
                        <Phone className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-[12px] font-semibold text-[#4e4a46]">(123) 456-7890</div>
                        <div className="text-[10px] font-medium text-[#9a948e]">Mobile</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-around pt-4 text-[#5f5a56]">
                    <div className="grid h-8 w-8 place-items-center rounded-full text-[14px] hover:bg-[#ede7e0]">✳</div>
                    <div className="grid h-8 w-8 place-items-center rounded-full text-[18px] font-semibold hover:bg-[#ede7e0]">in</div>
                    <div className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#ede7e0]">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div className="grid h-8 w-8 place-items-center rounded-full text-[18px] hover:bg-[#ede7e0]">𝕏</div>
                  </div>
                </div>
              </div>

              <div className="absolute left-[346px] top-[610px] z-20 w-[410px] text-center text-[#23221f]">
                <div className="text-[51px] font-semibold tracking-[-0.05em]">800,000+</div>
                <p className="mx-auto mt-2 max-w-[410px] text-[17px] leading-[1.55] text-[#2f2d2a]">
                  Salespeople and marketers use our extension to prospect, connect, and convert leads faster.
                </p>
                <button
                  type="button"
                  className="mt-7 inline-flex h-[45px] items-center justify-center rounded-[13px] bg-[#2f2c2a] px-[30px] text-[17px] font-semibold text-white shadow-[0_20px_40px_rgba(37,35,33,0.18)] transition hover:bg-[#252220]"
                >
                  Get Apollo Chrome Extension
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
