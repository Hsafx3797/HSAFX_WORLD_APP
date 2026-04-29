import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | HSAFX Tools',
  description: 'Privacy policy for HSAFX Tools API platform.',
};

export default function PrivacyPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 2026</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
        <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
        <p>
          When you create an account, we collect your email address and authentication credentials.
          When you use our API, we log request metadata (timestamps, engine used, response status)
          for billing and monitoring. We do not store the content you process through our engines
          beyond the duration needed to complete the operation.
        </p>

        <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Provide and maintain the service</li>
          <li>Process billing and enforce usage quotas</li>
          <li>Send transactional emails (account verification, billing receipts)</li>
          <li>Monitor and improve platform reliability</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground">3. Data Processing</h2>
        <p>
          All engine processing is server-side. Input data submitted to our engines is processed
          in-memory and not persisted after the response is returned. File uploads for media engines
          are deleted after processing completes or after a short retention window for async jobs.
        </p>

        <h2 className="text-xl font-semibold text-foreground">4. Third-Party Services</h2>
        <p>
          We use Polar for payment processing, Upstash for rate limiting, and Neon for database
          hosting. Each third party has their own privacy policies governing data they process.
        </p>

        <h2 className="text-xl font-semibold text-foreground">5. Data Security</h2>
        <p>
          API keys are encrypted at rest. All connections use TLS. We follow security best practices
          including input validation, rate limiting, and regular dependency auditing.
        </p>

        <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
        <p>
          You can request account deletion and data export by contacting{' '}
          <a href="mailto:privacy@hsafx.world" className="text-primary hover:underline">
            privacy@hsafx.world
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold text-foreground">7. Changes</h2>
        <p>
          We may update this policy. Significant changes will be communicated via email to
          registered users.
        </p>
      </div>
    </div>
  );
}
