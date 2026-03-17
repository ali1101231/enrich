import { useState, type FormEvent } from 'react';

export default function SignupPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f1eef9]">
      <div className="absolute inset-0 p-3 sm:p-5">
        <div className="h-full w-full overflow-hidden rounded-[30px] border border-[#ddd5f6] bg-[#f5f2ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <div className="grid h-full grid-cols-[220px_1fr] blur-[1.2px]">
            <aside className="border-r border-[#e2dcf4] bg-[#f3efff] px-3 py-4">
              <div className="mb-5 flex items-center gap-2 text-[#2e2348]">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#6738dd] text-white">✦</div>
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
                <div className="px-3 py-2">Domain → LinkedIn</div>
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
                  <div className="h-24 rounded-2xl bg-[#f4f0ff]" />
                  <div className="h-24 rounded-2xl bg-[#f4f0ff]" />
                  <div className="h-24 rounded-2xl bg-[#f4f0ff]" />
                  <div className="h-24 rounded-2xl bg-[#f4f0ff]" />
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
        </div>
      </div>

      <div className="absolute inset-0 bg-[#0d0b1f]/32 backdrop-blur-[8px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-[820px] overflow-hidden rounded-[20px] border border-[#d0c4f7] bg-white shadow-[0_40px_100px_rgba(83,52,174,0.32)] sm:px-12">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#7c3aed] via-[#6f4cc6] to-[#9f7aea]" />
          <div className="px-10 py-8 sm:px-12">
          <h1 className="mx-auto max-w-[420px] text-center text-[34px] font-bold leading-[1.1] tracking-[-0.03em] text-[#1e1245] sm:text-[46px]">
            Sign up for Enrich It — free forever
          </h1>

          <p className="mx-auto mt-4 max-w-[560px] text-center text-[16px] leading-[1.48] text-[#4e4572]">
            Find, contact, and close your ideal buyers with over 210 million contacts in one, easy-to-use AI sales platform.
          </p>

          <p className="mt-6 text-center text-[14px] font-medium text-[#7c6faa]">
            Verify your business email with Google or Microsoft
          </p>

          <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter email"
              className="h-[50px] flex-1 rounded-[11px] border border-[#d0c4f7] bg-white px-4 text-[15px] text-[#1e1245] outline-none transition placeholder:text-[#a799cc] focus:border-[#6f4cc6] focus:ring-2 focus:ring-[#6f4cc6]/15"
              required
            />
            <button
              type="submit"
              className="h-[50px] rounded-[11px] bg-[#6f4cc6] px-8 text-[15px] font-semibold text-white shadow-[0_8px_22px_rgba(111,76,198,0.38)] transition hover:bg-[#5e3daf]"
            >
              Sign up for free
            </button>
          </form>

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
              <span>Sign up with Google</span>
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
              <span>Sign up with Microsoft</span>
            </button>
          </div>

          <p className="mt-5 text-center text-[13px] text-[#9b8ec8]">
            By signing up, I agree to Enrich It&apos;s{' '}
            <span className="cursor-pointer text-[#6f4cc6] underline underline-offset-2">Terms of Service</span> and{' '}
            <span className="cursor-pointer text-[#6f4cc6] underline underline-offset-2">Privacy Policy</span>.
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}