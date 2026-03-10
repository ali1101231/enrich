import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePackages } from '@/hooks/useApi';
import type { PackageItem } from '@/lib/api';

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeUpVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
};

// ============================================================================
// FALLBACK PLAN DATA (used when DB has no packages)
// ============================================================================

const fallbackPlans = [
  {
    name: 'Starter',
    monthlyPrice: 24,
    yearlyPrice: 19,
    credits: 100000,
    subtitle: 'Essential tools for small teams and startups.',
    features: [
      'Up to 5 team members',
      'Basic analytics dashboard',
      '24/7 email support',
      '1GB storage limit',
    ],
    buttonText: 'Start free trial',
    isHighlighted: false,
    badge: null as string | null,
  },
  {
    name: 'Business',
    monthlyPrice: 79,
    yearlyPrice: 63,
    credits: 200000,
    subtitle: 'Advanced features for growing companies.',
    features: [
      'Up to 20 team members',
      'Advanced performance reporting',
      'Priority chat & email support',
      '10GB storage limit',
      'Custom integrations',
    ],
    buttonText: 'Get Started',
    isHighlighted: true,
    badge: 'MOST POPULAR',
  },
  {
    name: 'Enterprise',
    monthlyPrice: 249,
    yearlyPrice: 199,
    credits: 500000,
    subtitle: 'Full customization for large organizations.',
    features: [
      'Unlimited team members',
      'Custom analytics & reporting',
      'Dedicated success manager',
      'Unlimited storage',
      'SSO & advanced security',
      'SLA guarantees',
    ],
    buttonText: 'Contact Sales',
    isHighlighted: false,
    badge: null as string | null,
  },
];

function formatCredits(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

// ============================================================================
// SWEEP BUTTON
// ============================================================================

function SweepButton({
  children,
  isHighlighted,
}: {
  children: React.ReactNode;
  isHighlighted?: boolean;
}) {
  return (
    <button
      className={cn(
        'relative w-full font-bold py-4 rounded-2xl text-sm transition-all duration-300 transform active:scale-[0.98] overflow-hidden group',
        isHighlighted
          ? 'gradient-koldify text-white shadow-glow'
          : 'bg-secondary text-secondary-foreground'
      )}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 transition-colors duration-500 group-hover:text-white">
        {children}
        {isHighlighted && <ArrowRight className="h-4 w-4" />}
      </span>
      <div
        className={cn(
          'absolute inset-0 z-0 origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
          isHighlighted
            ? 'bg-[hsl(var(--koldify-amber))]'
            : 'gradient-koldify'
        )}
      />
    </button>
  );
}

// ============================================================================
// PRICING PAGE
// ============================================================================

export default function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const { data: dbPackages } = usePackages();

  const plans = useMemo(() => {
    if (dbPackages && dbPackages.length > 0) {
      return dbPackages.map((p) => ({
        name: p.name,
        monthlyPrice: p.monthlyPrice,
        yearlyPrice: p.yearlyPrice,
        credits: p.credits,
        subtitle: p.subtitle ?? '',
        features: Array.isArray(p.features) ? p.features : [],
        buttonText: p.buttonText,
        isHighlighted: p.isHighlighted,
        badge: p.badge,
      }));
    }
    return fallbackPlans;
  }, [dbPackages]);

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <motion.h1
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight"
        >
          Choose a plan that fits{' '}
          <span className="gradient-koldify-text">your workflow.</span>
        </motion.h1>
        <motion.p
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className="text-muted-foreground text-lg"
        >
          All plans include core features. Scale as you grow.
        </motion.p>
      </div>

      {/* Billing Toggle */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUpVariants}
        custom={0.4}
        className="flex items-center justify-center mb-12"
      >
        <div className="flex items-center bg-secondary p-1.5 rounded-full border border-border">
          <button
            onClick={() => setBilling('monthly')}
            className={cn(
              'relative px-8 py-2.5 rounded-full text-sm font-bold tracking-tight transition-colors duration-300 z-10',
              billing === 'monthly'
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {billing === 'monthly' && (
              <motion.div
                layoutId="billing-pill"
                className="absolute inset-0 gradient-koldify shadow-glow-sm rounded-full z-[-1]"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.6 }}
              />
            )}
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={cn(
              'relative px-8 py-2.5 rounded-full text-sm font-bold tracking-tight transition-colors duration-300 z-10 flex items-center gap-2',
              billing === 'yearly'
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {billing === 'yearly' && (
              <motion.div
                layoutId="billing-pill"
                className="absolute inset-0 gradient-koldify shadow-glow-sm rounded-full z-[-1]"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.6 }}
              />
            )}
            Yearly
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border transition-all duration-300',
                billing === 'yearly'
                  ? 'bg-white/20 border-white/20 text-white'
                  : 'bg-primary/10 border-primary/20 text-primary'
              )}
            >
              Save 20%
            </span>
          </button>
        </div>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            custom={0.5 + index * 0.1}
            className={cn(
              'bg-card text-card-foreground rounded-3xl p-8 relative overflow-hidden flex flex-col transition-all duration-500 border',
              plan.isHighlighted
                ? 'border-primary/50 shadow-glow ring-1 ring-primary/20'
                : 'border-border'
            )}
          >
            {/* Subtle grid background */}
            <div className="absolute top-0 left-0 right-0 h-[200px] bg-grid-pattern opacity-30 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
              {/* Plan header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                {plan.badge && (
                  <span className="gradient-koldify text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                    {plan.badge}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="flex flex-col gap-1 mb-6 overflow-hidden h-[80px] justify-center">
                <div className="flex items-baseline gap-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={billing}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="text-5xl font-bold tracking-tighter inline-block"
                    >
                      ${billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-lg text-muted-foreground">/mo</span>
                </div>
                <motion.p
                  key={billing + '-sub'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  {billing === 'monthly'
                    ? `or $${plan.yearlyPrice}/mo billed yearly`
                    : `billed $${plan.yearlyPrice * 12} per year`}
                </motion.p>
              </div>

              {/* Subtitle + credits */}
              <p className="text-sm text-muted-foreground mb-4">{plan.subtitle}</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">
                <span className="font-semibold text-primary">{formatCredits(plan.credits)}</span> credits included
              </p>

              {/* Features */}
              <div className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-success" strokeWidth={2.5} />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <SweepButton isHighlighted={plan.isHighlighted}>
                {plan.buttonText}
              </SweepButton>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer note */}
      <motion.p
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        custom={1.0}
        className="text-center text-sm text-muted-foreground mt-10"
      >
        Prices exclude any applicable taxes.{' '}
        <a href="#" className="underline hover:text-foreground">
          Terms & Conditions
        </a>{' '}
        apply.
      </motion.p>
    </div>
  );
}
