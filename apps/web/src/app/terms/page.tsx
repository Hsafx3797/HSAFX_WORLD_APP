import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | HSAFX Tools',
  description: 'Terms of service for HSAFX Tools API platform.',
};

export default function TermsPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 2026</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
        <h2 className="text-xl font-semibold text-foreground">1. Acceptance</h2>
        <p>
          By accessing or using HSAFX Tools (&quot;the Service&quot;), you agree to these terms.
          If you do not agree, do not use the Service.
        </p>

        <h2 className="text-xl font-semibold text-foreground">2. Service Description</h2>
        <p>
          HSAFX Tools provides a server-side API platform with 30 parameterized engines for text,
          data, and media processing. Access is provided through API keys under subscription plans.
        </p>

        <h2 className="text-xl font-semibold text-foreground">3. Account Responsibilities</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>You are responsible for maintaining the security of your API keys</li>
          <li>You must not share API keys or exceed your plan&apos;s usage limits</li>
          <li>You must not use the Service for illegal activities</li>
          <li>Automated abuse, reverse engineering, or scraping is prohibited</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground">4. Usage Limits &amp; Billing</h2>
        <p>
          Each subscription plan includes defined quotas per engine suite. Usage beyond your
          plan&apos;s limits will be rejected until the next billing period or plan upgrade.
          Billing is handled through Polar. All fees are non-refundable unless required by law.
        </p>

        <h2 className="text-xl font-semibold text-foreground">5. Intellectual Property</h2>
        <p>
          You retain ownership of all content you submit for processing. We claim no rights to
          your input or output data. The Service itself, including all engines, APIs, and
          documentation, is our intellectual property.
        </p>

        <h2 className="text-xl font-semibold text-foreground">6. Limitation of Liability</h2>
        <p>
          The Service is provided &quot;as is.&quot; We are not liable for data loss, downtime,
          or damages arising from use of the Service. Our total liability is limited to the
          amount you paid in the 12 months preceding the claim.
        </p>

        <h2 className="text-xl font-semibold text-foreground">7. Termination</h2>
        <p>
          We may suspend or terminate accounts that violate these terms. You may close your
          account at any time by contacting{' '}
          <a href="mailto:support@hsafx.world" className="text-primary hover:underline">
            support@hsafx.world
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold text-foreground">8. Changes</h2>
        <p>
          We may modify these terms. Continued use after changes constitutes acceptance.
          Material changes will be communicated via email.
        </p>
      </div>
    </div>
  );
}
