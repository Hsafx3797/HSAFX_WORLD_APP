import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for HSAFX Tools. Free tier for everyone, Pro for power users.',
};

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for casual users and trying out tools',
    features: [
      '400+ Free Tools',
      'Unlimited text transformations',
      'Basic data converters',
      'Standard generators',
      'Community support',
      '100 API requests/day',
    ],
    limitations: [
      '5MB file upload limit',
      'Basic media processing',
      'No batch operations',
    ],
    cta: 'Get Started Free',
    ctaLink: '/register',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$10',
    period: '/month',
    description: 'For developers and professionals who need more power',
    features: [
      'Everything in Free, plus:',
      '50MB file upload limit',
      'Advanced media processing',
      'Batch operations',
      'Priority processing',
      '10,000 API requests/day',
      'No watermarks',
      'Email support',
      'Custom themes',
      '150 coins/month',
    ],
    limitations: [],
    cta: 'Start Pro Trial',
    ctaLink: '/register?plan=pro',
    popular: true,
  },
  {
    name: 'Advance',
    price: '$20',
    period: '/month',
    description: 'For power users and small teams with advanced needs',
    features: [
      'Everything in Pro, plus:',
      '500MB file upload limit',
      'Unlimited API requests',
      'Priority execution',
      'API access',
      'All theme presets & customization',
      'Dedicated support',
      '250 coins/month',
    ],
    limitations: [],
    cta: 'Start Advance Trial',
    ctaLink: '/register?plan=advance',
    popular: false,
  },
];

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
    answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact support for a full refund.',
  },
  {
    question: 'What happens to my data?',
    answer: 'Most tools process data locally in your browser. For server-side tools, data is processed and immediately deleted. We never store or analyze your content.',
  },
];

export default function PricingPage() {
  return (
    <div className="container py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4">Pricing</Badge>
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start free and upgrade when you need more. No hidden fees, no surprises.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto mb-16">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`relative flex flex-col ${tier.popular ? 'border-primary shadow-lg' : ''}`}
          >
            {tier.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-muted-foreground">{tier.period}</span>
              </div>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-success shrink-0"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
                {tier.limitations.map((limitation) => (
                  <li key={limitation} className="flex items-start gap-2 text-muted-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m15 9-6 6" />
                      <path d="m9 9 6 6" />
                    </svg>
                    <span className="text-sm">{limitation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={tier.popular ? 'default' : 'outline'}
                asChild
              >
                <Link href={tier.ctaLink}>{tier.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Coins Section */}
      <div className="max-w-3xl mx-auto mb-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Need More Coins?</h2>
        <p className="text-muted-foreground mb-6">
          Coins are used for premium processing features. Buy additional coins anytime.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-2xl font-bold">100 Coins</p>
              <p className="text-muted-foreground">$5</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-2xl font-bold">500 Coins</p>
              <p className="text-muted-foreground">$20</p>
              <Badge variant="secondary" className="mt-2">20% off</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-2xl font-bold">1000 Coins</p>
              <p className="text-muted-foreground">$35</p>
              <Badge variant="secondary" className="mt-2">30% off</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

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
