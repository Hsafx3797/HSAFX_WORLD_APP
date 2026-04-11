import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for HSAFX Tools. Free tier for everyone, Pro for power users.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
