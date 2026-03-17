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
    if (tab === 'signup') {
      navigate('/signup');
      return;
    }
    setActiveTab(tab);
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen koldify-shell-bg text-[#2f2453]">
      <div className="grid min-h-screen lg:grid-cols-[43.2%_56.8%]">
        <section className="relative flex min-h-screen flex-col bg-transparent px-7 pb-8 pt-6 sm:px-10 lg:px-0 lg:pt-5">
          <div className="mb-10 flex items-center gap-3 pl-1 text-[15px] font-semibold tracking-tight text-[#3b2a68] lg:ml-7 lg:mb-0 lg:mt-1">
            <div className="grid h-7 w-7 place-items-center rounded-full border border-[#d8cbff] bg-white text-[#6f4cc6] shadow-[0_8px_20px_rgba(111,76,198,0.15)]">
              <div className="h-3.5 w-3.5 rounded-full border border-[#6f4cc6] border-l-transparent border-r-transparent" />
            </div>
            <span>Enrich It</span>
          </div>

          <div className="mx-auto flex w-full max-w-[354px] flex-1 flex-col justify-center lg:ml-[clamp(176px,24vw,248px)] lg:mr-0 lg:max-w-[354px] lg:justify-start lg:pt-[104px] xl:pt-[110px]">
            <div className="mb-[27px] rounded-[13px] border border-[#e3d7ff] bg-white p-1.5 shadow-[0_16px_34px_rgba(121,95,194,0.14)]">
              <div className="grid grid-cols-2 gap-1.5 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => switchTo('login')}
                  className={`rounded-[10px] px-4 py-[13px] transition ${
                    activeTab === 'login'
                      ? 'bg-[#6f4cc6] text-white shadow-[0_8px_20px_rgba(111,76,198,0.28)]'
                      : 'text-[#6b5f90] hover:bg-[#f7f2ff] hover:text-[#4f3c85]'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => window.open('/signup', '_blank')}
                  className="flex items-center justify-center gap-2 rounded-[10px] px-4 py-[13px] text-[#6b5f90] transition hover:bg-[#f7f2ff] hover:text-[#4f3c85]"
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
                  className="flex h-[49px] w-full items-center justify-center gap-3 rounded-[11px] border border-[#e2d8ff] bg-white px-4 text-[15px] font-semibold text-[#4d3f7d] transition hover:border-[#cdbaff] hover:bg-[#f8f4ff]"
                >
                  <span className="grid h-5 w-5 place-items-center text-[#6f4cc6]">{provider.icon}</span>
                  <span>{provider.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-[30px] flex items-center gap-4 px-9 text-sm text-[#7f74a7]">
              <div className="h-px flex-1 bg-[#e6ddff]" />
              <span>Or</span>
              <div className="h-px flex-1 bg-[#e6ddff]" />
            </div>

            {formError && (
              <div
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {formError}
              </div>
            )}

            {activeTab === 'login' ? (
              <form onSubmit={handleSignIn} className="space-y-[18px]">
                <div className="space-y-2.5">
                  <label htmlFor="sign-in-email" className="block text-[15px] font-semibold text-[#4a3e74]">
                    Email
                  </label>
                  <input
                    id="sign-in-email"
                    type="email"
                    value={signInEmail}
                    onChange={(event) => setSignInEmail(event.target.value)}
                    className="h-[42px] w-full rounded-[10px] border border-[#ddd0ff] bg-white px-4 text-[15px] text-[#2f2453] outline-none transition placeholder:text-[#b2a5d6] focus:border-[#8b5cf6] focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="sign-in-password" className="block text-[15px] font-semibold text-[#4a3e74]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="sign-in-password"
                      type={showPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(event) => setSignInPassword(event.target.value)}
                      className="h-[42px] w-full rounded-[10px] border border-[#ddd0ff] bg-white px-4 pr-12 text-[15px] text-[#2f2453] outline-none transition placeholder:text-[#b2a5d6] focus:border-[#8b5cf6] focus:bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9c8dc8] transition hover:text-[#5f4b99]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 flex h-[41px] w-full items-center justify-center rounded-[10px] bg-[#6f4cc6] text-[16px] font-bold text-white shadow-[0_12px_26px_rgba(111,76,198,0.28)] transition hover:bg-[#603cb9] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
                </button>

                <div className="flex items-center justify-between gap-4 pt-1 text-[13px]">
                  <button
                    type="button"
                    onClick={() => setKeepSignedIn((current) => !current)}
                    className="flex items-center gap-2 text-[#6e6198] transition hover:text-[#4f3c85]"
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded border transition ${
                        keepSignedIn ? 'border-[#6f4cc6] bg-[#6f4cc6] text-white' : 'border-[#cbbef0] bg-white text-transparent'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>Keep me signed in</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password', { replace: true })}
                    className="text-[#7b5ad3] underline-offset-2 transition hover:text-[#5a3eb1] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-[18px]">
                <div className="space-y-2.5">
                  <label htmlFor="sign-up-name" className="block text-[15px] font-semibold text-[#4a3e74]">
                    Full name
                  </label>
                  <input
                    id="sign-up-name"
                    type="text"
                    value={signUpName}
                    onChange={(event) => setSignUpName(event.target.value)}
                    className="h-[42px] w-full rounded-[10px] border border-[#ddd0ff] bg-white px-4 text-[15px] text-[#2f2453] outline-none transition placeholder:text-[#b2a5d6] focus:border-[#8b5cf6] focus:bg-white"
                    placeholder="Tim Zheng"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="sign-up-email" className="block text-[15px] font-semibold text-[#4a3e74]">
                    Work email
                  </label>
                  <input
                    id="sign-up-email"
                    type="email"
                    value={signUpEmail}
                    onChange={(event) => setSignUpEmail(event.target.value)}
                    className="h-[42px] w-full rounded-[10px] border border-[#ddd0ff] bg-white px-4 text-[15px] text-[#2f2453] outline-none transition placeholder:text-[#b2a5d6] focus:border-[#8b5cf6] focus:bg-white"
                    placeholder="you@company.com"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="sign-up-password" className="block text-[15px] font-semibold text-[#4a3e74]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="sign-up-password"
                      type={showPassword ? 'text' : 'password'}
                      value={signUpPassword}
                      onChange={(event) => setSignUpPassword(event.target.value)}
                      className="h-[42px] w-full rounded-[10px] border border-[#ddd0ff] bg-white px-4 pr-12 text-[15px] text-[#2f2453] outline-none transition placeholder:text-[#b2a5d6] focus:border-[#8b5cf6] focus:bg-white"
                      placeholder="Create a password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9c8dc8] transition hover:text-[#5f4b99]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="sign-up-confirm" className="block text-[15px] font-semibold text-[#4a3e74]">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="sign-up-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={signUpConfirm}
                      onChange={(event) => setSignUpConfirm(event.target.value)}
                      className="h-[42px] w-full rounded-[10px] border border-[#ddd0ff] bg-white px-4 pr-12 text-[15px] text-[#2f2453] outline-none transition placeholder:text-[#b2a5d6] focus:border-[#8b5cf6] focus:bg-white"
                      placeholder="Repeat your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9c8dc8] transition hover:text-[#5f4b99]"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 flex h-[41px] w-full items-center justify-center rounded-[10px] bg-[#6f4cc6] text-[16px] font-bold text-white shadow-[0_12px_26px_rgba(111,76,198,0.28)] transition hover:bg-[#603cb9] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
                </button>
              </form>
            )}

            <div className="mt-[70px] pl-1 text-center text-[13px] text-[#978bbb] lg:mt-[74px]">2026 All Rights Reserved.</div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-transparent lg:block">

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-[820px] w-[940px] origin-center scale-[0.82] xl:scale-[0.9] 2xl:scale-[0.97]">
              <div className="absolute left-[42px] top-[16px] h-[774px] w-[742px] overflow-hidden bg-[#ede7ff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] [clip-path:polygon(14%_0%,100%_0%,100%_100%,16%_100%,0%_86%,0.8%_22%)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(255,255,255,0.62),transparent_24%),radial-gradient(circle_at_86%_10%,rgba(167,139,250,0.28),transparent_28%)]" />
              </div>

              <div className="absolute left-[348px] top-[104px] z-20 grid h-[31px] w-[31px] place-items-center rounded-[6px] bg-[#8b5cf6] text-white shadow-[0_12px_24px_rgba(88,56,170,0.28)]">
                <span className="text-[18px] leading-none">✳</span>
              </div>

              <div className="absolute left-[236px] top-[248px] z-10 h-[146px] w-[226px] rounded-[18px] border border-[#ddd2ff] bg-white/85 shadow-[0_20px_40px_rgba(126,102,201,0.2)] backdrop-blur-sm">
                <div className="flex h-7 items-center gap-1 rounded-t-[18px] bg-[#6f4cc6] px-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                </div>
                <div className="space-y-3 px-4 py-4">
                  <div className="h-4 w-16 rounded-full bg-[#f2ebff]" />
                  <div className="h-4 w-24 rounded-full bg-[#f2ebff]" />
                  <div className="h-16 rounded-2xl bg-[#f8f4ff]" />
                </div>
              </div>

              <div className="absolute left-[402px] top-[70px] z-30 w-[274px] rounded-[18px] border border-[#e2d8ff] bg-[#f8f4ff] shadow-[0_24px_60px_rgba(95,82,148,0.24)]">
                <div className="flex items-center justify-between border-b border-[#eee5ff] px-4 py-3 text-[#31245d]">
                  <div className="flex items-center gap-2 text-[15px] font-semibold">
                    <span className="text-[13px] leading-none">✳</span>
                    <span>Enrich It</span>
                  </div>
                  <X className="h-4 w-4 text-[#7a6fa2]" />
                </div>

                <div className="px-4 pb-4 pt-3">
                  <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-white/90 p-1 text-[11px] font-semibold text-[#7a709e] shadow-[inset_0_0_0_1px_rgba(215,201,255,0.75)]">
                    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#6f4cc6] px-3 py-[8px] text-white">
                      <UserRound className="h-3.5 w-3.5" />
                      <span>Person</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-[8px]">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Company</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-[13px] font-bold text-[#31245d]">Tim Zheng</div>
                    <div className="mt-1 text-[11px] font-medium text-[#7a709e]">CEO & Founder at Enrich It</div>
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#e8defd] px-2 py-1 text-[10px] font-semibold text-[#5d409f]">
                      <span>95</span>
                      <span>Excellent match</span>
                    </div>
                  </div>

                  <div className="mb-5 rounded-[18px] border border-[#ece4ff] bg-white/95 px-2 py-3 shadow-[0_12px_24px_rgba(109,92,163,0.12)]">
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-[#756b97]">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          className="flex flex-col items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-[#f6f1ff]"
                        >
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f4edff] text-[#685c91]">
                            {action.icon}
                          </span>
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 border-b border-[#ece4ff] pb-5 text-[#635b7f]">
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f4edff] text-[#6f4cc6]">
                        <Mail className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-[12px] font-semibold text-[#4a3e74]">hello@enrichit.ai</div>
                        <div className="text-[10px] font-medium text-[#9a8ec2]">Work</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f4edff] text-[#6b6291]">
                        <Phone className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-[12px] font-semibold text-[#4a3e74]">(123) 456-7890</div>
                        <div className="text-[10px] font-medium text-[#9a8ec2]">Mobile</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-around pt-4 text-[#6a618b]">
                    <div className="grid h-8 w-8 place-items-center rounded-full text-[14px] hover:bg-[#efe6ff]">✳</div>
                    <div className="grid h-8 w-8 place-items-center rounded-full text-[18px] font-semibold hover:bg-[#efe6ff]">in</div>
                    <div className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#efe6ff]">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div className="grid h-8 w-8 place-items-center rounded-full text-[18px] hover:bg-[#efe6ff]">𝕏</div>
                  </div>
                </div>
              </div>

              <div className="absolute left-[326px] top-[570px] z-20 w-[430px] text-center text-[#33295a]">
                <div className="text-[51px] font-semibold tracking-[-0.05em]">800,000+</div>
                <p className="mx-auto mt-2 max-w-[410px] text-[17px] leading-[1.55] text-[#43336f]">
                  Teams use Enrich It to find better contacts, connect faster, and convert more leads.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
