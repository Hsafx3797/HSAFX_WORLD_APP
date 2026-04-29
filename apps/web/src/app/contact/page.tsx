import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | HSAFX Tools',
  description: 'Get in touch with the HSAFX Tools team.',
};

export default function ContactPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>
          We&apos;d love to hear from you. Whether you have questions about our API, need enterprise
          support, or want to explore a partnership — reach out.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">General Inquiries</h2>
            <a href="mailto:contact@hsafx.world" className="text-primary hover:underline">
              contact@hsafx.world
            </a>
          </div>
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Technical Support</h2>
            <a href="mailto:support@hsafx.world" className="text-primary hover:underline">
              support@hsafx.world
            </a>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-foreground">Enterprise &amp; API Access</h2>
        <p>
          For custom plans, volume pricing, or dedicated support — email us at{' '}
          <a href="mailto:enterprise@hsafx.world" className="text-primary hover:underline">
            enterprise@hsafx.world
          </a>
        </p>
      </div>
    </div>
  );
}
