import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      delay: delay,
      ease: [0.25, 0.1, 0.25, 1] as const
    }
  })
};

// ============================================================================
// SPLIT TEXT COMPONENT
// ============================================================================

function SplitText({ 
  text, 
  className, 
  delay = 40, 
  duration = 1.1,
  onAnimationComplete 
}: { 
  text: string; 
  className?: string; 
  delay?: number; 
  duration?: number;
  onAnimationComplete?: () => void;
}) {
  const letters = text.split("");
  
  return (
    <span className={cn("inline-block", className)}>
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: duration,
            delay: (i * delay) / 1000,
            ease: [0.25, 0.1, 0.25, 1] as const,
          }}
          onAnimationComplete={i === letters.length - 1 ? onAnimationComplete : undefined}
          className="inline-block whitespace-pre"
        >
          {letter}
        </motion.span>
      ))}
    </span>
  );
}

// ============================================================================
// SWEEP BUTTON COMPONENT
// ============================================================================

function SweepButton({ 
  children, 
  isHighlighted 
}: { 
  children: React.ReactNode; 
  isHighlighted?: boolean;
}) {
  return (
    <button 
      className={cn(
        "relative w-full font-bold py-5 rounded-[24px] text-base transition-all duration-300 transform active:scale-[0.98] overflow-hidden group",
        isHighlighted 
          ? "gradient-koldify text-white glow-koldify-sm" 
          : "bg-card text-foreground border border-border hover:border-primary/50"
      )}
    >
      {/* Content Label */}
      <span className="relative z-10 transition-colors duration-500 group-hover:text-white">
        {children}
      </span>
      
      {/* Sweep Layer */}
      <motion.div 
        initial={false}
        className={cn(
          "absolute inset-0 z-0 origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          isHighlighted ? "bg-primary" : "gradient-koldify"
        )}
      />
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: "Starter",
      monthlyPrice: 24,
      yearlyPrice: 19,
      subtitle: "Essential tools for small teams and startups.",
      credits: "100K",
      features: [
        "Up to 5 team members",
        "Basic analytics dashboard",
        "24/7 email support",
        "1GB storage limit"
      ],
      buttonText: "Get Started",
      highlight: false
    },
    {
      name: "Business",
      monthlyPrice: 79,
      yearlyPrice: 63,
      subtitle: "Advanced features for growing companies.",
      credits: "200K",
      features: [
        "Up to 20 team members",
        "Advanced performance reporting",
        "Priority chat & email support",
        "10GB storage limit",
        "Custom integrations"
      ],
      buttonText: "Start Scaling",
      highlight: true,
      badge: "MOST POPULAR"
    },
    {
      name: "Enterprise",
      monthlyPrice: 249,
      yearlyPrice: 199,
      subtitle: "Full customization for large organizations.",
      credits: "500K",
      features: [
        "Unlimited team members",
        "Custom analytics & reporting",
        "Dedicated success manager",
        "Unlimited storage",
        "SSO & advanced security",
        "SLA guarantees"
      ],
      buttonText: "Get Started",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      
      <div className="relative z-10 px-6 py-16 lg:py-24 max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUpVariants}
          className="text-center mb-16"
        >
          <div className="mb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0.1}
              variants={fadeUpVariants}
            >
              <h1 className="text-5xl lg:text-7xl font-bold mb-4 tracking-tight">
                <SplitText 
                  text="Simple, transparent " 
                  className="text-foreground"
                />
                <SplitText 
                  text="pricing" 
                  className="gradient-koldify-text"
                />
              </h1>
            </motion.div>
          </div>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.2}
            variants={fadeUpVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Choose the plan that fits your needs. All plans include core features.
          </motion.p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.3}
          variants={fadeUpVariants}
          className="flex items-center justify-center gap-3 mb-16 bg-card/50 backdrop-blur-sm border border-border rounded-full p-2 w-fit mx-auto"
        >
          <button
            onClick={() => setBilling('monthly')}
            className={cn(
              "relative px-12 py-3 rounded-full text-[14px] font-bold tracking-tight transition-all duration-300 z-10",
              billing === 'monthly' ? "text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {billing === 'monthly' && (
              <motion.div
                layoutId="billing-bg"
                className="absolute inset-0 gradient-koldify rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">Monthly</span>
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={cn(
              "relative px-12 py-3 rounded-full text-[14px] font-bold tracking-tight transition-all duration-300 z-10 flex items-center gap-2",
              billing === 'yearly' ? "text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {billing === 'yearly' && (
              <motion.div
                layoutId="billing-bg"
                className="absolute inset-0 gradient-koldify rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">Yearly</span>
            <span className="relative z-10 text-xs bg-success/20 text-success-foreground px-2 py-1 rounded-full">
              Save 20%
            </span>
          </button>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial="hidden"
              animate="visible"
              custom={0.4 + index * 0.1}
              variants={fadeUpVariants}
              className="relative"
            >
              {/* Card Grid background */}
              <div className="absolute inset-0 bg-grid-pattern opacity-20 rounded-3xl" />

              <div className={cn(
                "relative bg-card/80 backdrop-blur-sm border rounded-3xl p-8 h-full flex flex-col transition-all duration-300 hover:scale-[1.02]",
                plan.highlight ? "border-primary shadow-glow" : "border-border hover:border-primary/50"
              )}>
                <div className="flex-1">
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-2xl font-bold text-foreground">
                        {plan.name}
                      </h3>

                      {plan.badge && (
                        <span className="gradient-koldify text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-5xl font-bold gradient-koldify-text">
                        ${billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                      </span>
                      <span className="text-muted-foreground text-lg">
                        /month
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {billing === 'monthly' 
                        ? `or $${plan.yearlyPrice}/month billed yearly` 
                        : `billed $${plan.yearlyPrice * 12} per year`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-semibold gradient-koldify-text">{plan.credits}</span> credits included
                    </p>
                  </div>

                  <p className="text-muted-foreground text-sm mb-8">
                    {plan.subtitle}
                  </p>

                  <hr className="border-border mb-6" />

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Check className="h-5 w-5 text-success shrink-0" />
                        </div>
                        <span className="text-sm text-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Animated Sweep Button */}
                <SweepButton isHighlighted={plan.highlight}>
                  {plan.buttonText}
                </SweepButton>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial="hidden"
          animate="visible"
          custom={0.8}
          variants={fadeUpVariants}
          className="text-center text-sm text-muted-foreground mt-12"
        >
          Prices exclude any applicable taxes.{' '}
          <a href="#" className="underline hover:text-foreground transition-colors">
            Terms & Conditions
          </a>{' '}
          apply.
        </motion.p>
      </div>
    </div>
  );
}
