'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useSubscription } from '@/hooks/use-subscription';
import { toast } from 'sonner';

function formatPrice(cents: number | null | undefined) {
  if (!cents) return '$0';
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

const faqs = [
  {
    question: 'What are coins used for?',
    answer: 'Coins are used for premium features like advanced AI processing, OCR, and heavy media operations. Free tier users can purchase coins separately, while Pro and Advance users receive monthly allocations.',
  },
  {
    question: 'Can I upgrade or downgrade anytime?',
    answer: 'Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the end of your billing cycle. Unused coins do not roll over.',
  },
  {
    question: 'Is there a free trial for Pro?',
    answer: 'Yes, we offer a 14-day free trial for Pro plan with full access to all features. No credit card required to start.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and for Enterprise customers, we can also process invoices and bank transfers.',
  },
  {
    question: 'Do you offer refunds?',
    answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact support for a full refund.",
  },
  {
    question: 'What happens to my data?',
    answer: 'Most tools process data locally in your browser. For server-side tools, data is processed and immediately deleted. We never store or analyze your content.',
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [tab, setTab] = useState<'b2c' | 'b2b'>('b2c');
  const { data: plansData, isLoading: plansLoading } = trpc.billing.getPlans.useQuery();
  const { data: coinPacks, isLoading: packsLoading } = trpc.billing.getCoinPacks.useQuery();
  const { data: b2bPlans, isLoading: b2bLoading } = trpc.b2b.getPlans.useQuery();
  const { subscription, subscribe } = useSubscription();

  const currentPlanSlug = subscription?.plan ?? 'free';

  const handleCheckout = async (planSlug: string) => {
    if (planSlug === 'free') return;
    const result = await subscribe(planSlug as 'pro' | 'advance', billingCycle);
    if (result.error) toast.error(result.error);
  };

  const sortedPlans = (plansData ?? []).sort((a, b) => (a.priceMonthlyCents ?? 0) - (b.priceMonthlyCents ?? 0));

  return (
    <div className="container py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">Pricing</Badge>
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start free and upgrade when you need more. No hidden fees, no surprises.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <button
          onClick={() => setTab('b2c')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'b2c' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          Personal
        </button>
        <button
          onClick={() => setTab('b2b')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'b2b' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          API / Business
        </button>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
        <button
          type="button"
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative w-12 h-6 rounded-full transition-colors ${billingCycle === 'yearly' ? 'bg-primary' : 'bg-muted'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-background rounded-full shadow transition-transform ${billingCycle === 'yearly' ? 'right-1' : 'left-1'}`} />
        </button>
        <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
          Yearly <Badge variant="secondary" className="ml-1 text-xs">Save ~17%</Badge>
        </span>
      </div>

      {tab === 'b2c' && (<>
      {/* Pricing Cards */}
      {plansLoading ? (
        <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto mb-16">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-6 bg-muted rounded w-20" /><div className="h-10 bg-muted rounded w-24 mt-2" /></CardHeader>
              <CardContent><div className="space-y-2">{[1,2,3,4].map(j => <div key={j} className="h-4 bg-muted rounded" />)}</div></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto mb-16">
          {sortedPlans.map((plan) => {
            const isCurrent = currentPlanSlug === plan.slug;
            const isPopular = plan.slug === 'pro';
            const price = billingCycle === 'monthly'
              ? plan.priceMonthlyCents
              : plan.priceYearlyCents;
            const period = plan.slug === 'free' ? 'forever' : billingCycle === 'monthly' ? '/month' : '/year';

            // Build feature list from plan data
            const featureLabels: string[] = [];
            for (const f of plan.features) {
              if (f.enabled) featureLabels.push(f.featureKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
            }
            // Add limits as features
            for (const l of plan.limits) {
              if (l.description) featureLabels.push(l.description);
              else featureLabels.push(`${l.limitKey.replace(/_/g, ' ')}: ${l.limitValue}${l.unit ? ` ${l.unit}` : ''}`);
            }
            if (plan.coinGrant > 0) featureLabels.push(`${plan.coinGrant} coins/month`);

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg' : ''}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{formatPrice(price)}</span>
                    <span className="text-muted-foreground">{period}</span>
                  </div>
                  {plan.description && <CardDescription>{plan.description}</CardDescription>}
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {featureLabels.map((label) => (
                      <li key={label} className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-success shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                        <span className="text-sm">{label}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>Current Plan</Button>
                  ) : plan.slug === 'free' ? (
                    <Button className="w-full" variant="outline" asChild>
                      <Link href="/register">Get Started Free</Link>
                    </Button>
                  ) : (
                    <Button className="w-full" variant={isPopular ? 'default' : 'outline'} onClick={() => handleCheckout(plan.slug)}>
                      {subscription ? `Upgrade to ${plan.name}` : `Start ${plan.name} Trial`}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Coin Packs Section */}
      <div className="max-w-3xl mx-auto mb-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Need More Coins?</h2>
        <p className="text-muted-foreground mb-6">
          Coins are used for premium processing features. Buy additional coins anytime.
        </p>
        {packsLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-8 bg-muted rounded w-24 mx-auto" /><div className="h-4 bg-muted rounded w-16 mx-auto mt-2" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {(coinPacks ?? []).map((pack) => (
              <Card key={pack.id}>
                <CardContent className="p-6 text-center">
                  <p className="text-2xl font-bold">{pack.coins.toLocaleString()} Coins</p>
                  <p className="text-muted-foreground">{formatPrice(pack.priceInCents)}</p>
                  {pack.bonusCoins > 0 && (
                    <Badge variant="secondary" className="mt-2">+{pack.bonusCoins} bonus</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </>)}

      {tab === 'b2b' && (
        <>
          {/* B2B Pricing Cards */}
          {b2bLoading ? (
            <div className="grid gap-8 lg:grid-cols-4 max-w-6xl mx-auto mb-16">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader><div className="h-6 bg-muted rounded w-20" /><div className="h-10 bg-muted rounded w-24 mt-2" /></CardHeader>
                  <CardContent><div className="space-y-2">{[1,2,3,4,5].map(j => <div key={j} className="h-4 bg-muted rounded" />)}</div></CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-4 max-w-6xl mx-auto mb-16">
              {(b2bPlans ?? []).map((plan) => {
                const price = billingCycle === 'monthly'
                  ? plan.priceMonthlyCents
                  : plan.priceYearlyCents;
                const isPopular = plan.slug === 'growth';

                return (
                  <Card key={plan.id} className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg' : ''}`}>
                    {isPopular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{formatPrice(price)}</span>
                        <span className="text-muted-foreground">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                      </div>
                      {plan.description && <CardDescription>{plan.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Monthly API Ops per Suite</p>
                      <ul className="space-y-2">
                        {plan.quotas.map((q) => (
                          <li key={q.suiteId} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{q.suiteName}</span>
                            <span className="font-mono text-xs font-medium">{q.monthlyLimit.toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" variant={isPopular ? 'default' : 'outline'} asChild>
                        <Link href="/register">Get Started</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}

          {/* B2B CTA */}
          <div className="max-w-3xl mx-auto mb-16 text-center">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-2">Need a Custom Plan?</h3>
                <p className="text-muted-foreground mb-4">
                  Enterprise customers can get custom quotas, dedicated support, and SLA guarantees.
                </p>
                <Button variant="outline" asChild>
                  <Link href="mailto:support@hsafx.com">Contact Sales</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
