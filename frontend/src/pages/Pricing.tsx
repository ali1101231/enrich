import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Starter',
    description: 'Essential tools for small teams and startups.',
    price: 24,
    credits: '100K',
    features: [
      'Up to 5 team members',
      'Basic analytics dashboard',
      '24/7 email support',
      '1GB storage limit',
    ],
    popular: false,
  },
  {
    name: 'Business',
    description: 'Advanced features for growing companies.',
    price: 79,
    credits: '200K',
    features: [
      'Up to 20 team members',
      'Advanced performance reporting',
      'Priority chat & email support',
      '10GB storage limit',
      'Custom integrations',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'Full customization for large organizations.',
    price: 249,
    credits: '500K',
    features: [
      'Unlimited team members',
      'Custom analytics & reporting',
      'Dedicated success manager',
      'Unlimited storage',
      'SSO & advanced security',
      'SLA guarantees',
    ],
    popular: false,
  },
];

export default function Pricing() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-3xl lg:text-4xl font-bold mb-3">Simple, transparent pricing</h1>
        <p className="text-muted-foreground text-lg">
          Choose the plan that fits your needs. All plans include core features.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              'relative flex flex-col',
              plan.popular && 'border-primary shadow-lg shadow-primary/10'
            )}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-koldify text-white px-4">
                MOST POPULAR
              </Badge>
            )}
            <CardHeader className={cn('pb-4', plan.popular && 'pt-8')}>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold text-primary">{plan.credits}</span> credits included
                </p>
              </div>

              <Button
                className={cn(
                  'w-full mb-6',
                  plan.popular
                    ? 'gradient-koldify text-white hover:opacity-90'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                {plan.popular ? (
                  <>
                    Get started <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  'Start free trial'
                )}
              </Button>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  What's included
                </p>
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-10">
        Prices exclude any applicable taxes.{' '}
        <a href="#" className="underline hover:text-foreground">
          Terms & Conditions
        </a>{' '}
        apply.
      </p>
    </div>
  );
}
