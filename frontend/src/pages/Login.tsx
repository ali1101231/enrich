import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, user } = useApp();
  const [isRightPanelActive, setIsRightPanelActive] = useState(location.pathname === '/signup');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setIsRightPanelActive(location.pathname === '/signup');
  }, [location.pathname]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    const err = await login(signInEmail, signInPassword);
    if (err) {
      setFormError(err);
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const switchToSignUp = () => {
    setIsRightPanelActive(true);
    setFormError(null);
    navigate('/signup', { replace: true });
  };

  const switchToSignIn = () => {
    setIsRightPanelActive(false);
    setFormError(null);
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, hsl(var(--koldify-orange)) 0%, hsl(var(--koldify-amber)) 100%)' }}>
      
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-20 h-20 rounded-full bg-white/10 top-[10%] left-[10%] animate-[float_6s_ease-in-out_infinite]" />
        <div className="absolute w-30 h-30 rounded-full bg-white/10 top-[70%] right-[10%] animate-[float_6s_ease-in-out_infinite_2s]" />
        <div className="absolute w-15 h-15 rounded-full bg-white/10 top-[40%] left-[80%] animate-[float_6s_ease-in-out_infinite_4s]" />
      </div>

      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className={`relative w-full max-w-[850px] h-[550px] bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden transition-none ${isRightPanelActive ? 'auth-right-active' : ''}`}>
        
        {/* Sign Up Form */}
        <div className={`absolute w-1/2 h-full flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] left-1/2 max-md:relative max-md:w-full max-md:left-0 ${
          isRightPanelActive ? 'opacity-100 z-[5]' : 'opacity-0 z-[1]'
        }`}>
          <form onSubmit={handleSignUp} className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl w-[320px] border border-white/50 animate-fade-in">
            <h1 className="text-2xl font-bold text-center mb-8 text-foreground relative pb-3">
              Create Account
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-[3px] rounded-full gradient-koldify" />
            </h1>

            {formError && isRightPanelActive && (
              <p className="text-sm text-red-600 text-center mb-4">{formError}</p>
            )}

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                className="w-full px-5 py-3.5 border-2 border-border rounded-xl text-base bg-white/80 outline-none transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)] focus:-translate-y-0.5 placeholder:text-muted-foreground"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                className="w-full px-5 py-3.5 border-2 border-border rounded-xl text-base bg-white/80 outline-none transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)] focus:-translate-y-0.5 placeholder:text-muted-foreground"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                className="w-full px-5 py-3.5 border-2 border-border rounded-xl text-base bg-white/80 outline-none transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)] focus:-translate-y-0.5 placeholder:text-muted-foreground"
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={signUpConfirm}
                onChange={(e) => setSignUpConfirm(e.target.value)}
                className="w-full px-5 py-3.5 border-2 border-border rounded-xl text-base bg-white/80 outline-none transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)] focus:-translate-y-0.5 placeholder:text-muted-foreground"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 mt-6 rounded-xl text-base font-semibold text-white gradient-koldify transition-all duration-300 hover:-translate-y-1 hover:shadow-glow disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Sign Up'}
            </button>

            {/* Mobile only: switch link */}
            <p className="text-center text-sm text-muted-foreground mt-4 md:hidden">
              Already have an account?{' '}
              <button type="button" onClick={switchToSignIn} className="text-primary font-medium hover:underline">
                Sign In
              </button>
            </p>
          </form>
        </div>

        {/* Sign In Form */}
        <div className={`absolute w-1/2 h-full flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] left-0 z-[2] max-md:relative max-md:w-full`}>
          <form onSubmit={handleSignIn} className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl w-[320px] border border-white/50 animate-fade-in">
            <h1 className="text-2xl font-bold text-center mb-8 text-foreground relative pb-3">
              Welcome Back
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-[3px] rounded-full gradient-koldify" />
            </h1>

            {formError && !isRightPanelActive && (
              <p className="text-sm text-red-600 text-center mb-4">{formError}</p>
            )}

            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="w-full px-5 py-3.5 border-2 border-border rounded-xl text-base bg-white/80 outline-none transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)] focus:-translate-y-0.5 placeholder:text-muted-foreground"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                className="w-full px-5 py-3.5 border-2 border-border rounded-xl text-base bg-white/80 outline-none transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)] focus:-translate-y-0.5 placeholder:text-muted-foreground"
                required
              />
            </div>

            <div className="text-center mt-3">
              <button type="button" className="text-sm text-primary hover:underline">
                Forgot your password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 mt-4 rounded-xl text-base font-semibold text-white gradient-koldify transition-all duration-300 hover:-translate-y-1 hover:shadow-glow disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Sign In'}
            </button>

            {/* Mobile only: switch link */}
            <p className="text-center text-sm text-muted-foreground mt-4 md:hidden">
              Don't have an account?{' '}
              <button type="button" onClick={switchToSignUp} className="text-primary font-medium hover:underline">
                Sign Up
              </button>
            </p>
          </form>
        </div>

        {/* Overlay */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-[100] transition-transform duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] max-md:hidden ${
          isRightPanelActive ? '-translate-x-full' : ''
        }`}>
          <div className={`gradient-koldify relative -left-full h-full w-[200%] transition-transform duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
            isRightPanelActive ? 'translate-x-1/2' : 'translate-x-0'
          }`}>
            {/* Left overlay panel (shown when sign-up is active) */}
            <div className={`absolute flex flex-col items-center justify-center px-10 text-center top-0 h-full w-1/2 transition-transform duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
              isRightPanelActive ? 'translate-x-0' : '-translate-x-[20%]'
            }`}>
              <Sparkles className="h-10 w-10 text-white/90 mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Welcome Back!</h2>
              <p className="text-lg text-white/90 mb-8 leading-relaxed">
                To keep connected with us please login with your personal info
              </p>
              <button
                onClick={switchToSignIn}
                className="px-8 py-3 rounded-xl text-base font-semibold bg-transparent text-white border-2 border-white transition-all duration-300 hover:bg-white hover:text-foreground hover:-translate-y-0.5"
              >
                Sign In
              </button>
            </div>

            {/* Right overlay panel (shown when sign-in is active) */}
            <div className={`absolute flex flex-col items-center justify-center px-10 text-center top-0 h-full w-1/2 right-0 transition-transform duration-700 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
              isRightPanelActive ? 'translate-x-[20%]' : 'translate-x-0'
            }`}>
              <Sparkles className="h-10 w-10 text-white/90 mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Hello, Friend!</h2>
              <p className="text-lg text-white/90 mb-8 leading-relaxed">
                Enter your personal details and start your journey with us
              </p>
              <button
                onClick={switchToSignUp}
                className="px-8 py-3 rounded-xl text-base font-semibold bg-transparent text-white border-2 border-white transition-all duration-300 hover:bg-white hover:text-foreground hover:-translate-y-0.5"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
