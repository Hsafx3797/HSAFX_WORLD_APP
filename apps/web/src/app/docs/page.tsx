import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Documentation - HSAFX World',
  description: 'Learn how to use HSAFX World tools and API',
};

const docSections = [
  {
    title: 'Getting Started',
    icon: '🚀',
    items: [
      { title: 'Introduction', href: '/docs/introduction', description: 'Overview of HSAFX World platform' },
      { title: 'Quick Start', href: '/docs/quick-start', description: 'Get up and running in 5 minutes' },
      { title: 'Account Setup', href: '/docs/account', description: 'Setting up your account' },
    ],
  },
  {
    title: 'Tools Guide',
    icon: '🔧',
    items: [
      { title: 'Using Tools', href: '/docs/tools/using', description: 'How to use tools effectively' },
      { title: 'Tool Categories', href: '/docs/tools/categories', description: 'Browse tools by category' },
      { title: 'Favorites & History', href: '/docs/tools/favorites', description: 'Managing your favorite tools' },
    ],
  },
  {
    title: 'API Reference',
    icon: '📡',
    items: [
      { title: 'Authentication', href: '/docs/api/auth', description: 'API key management and auth' },
      { title: 'Endpoints', href: '/docs/api/endpoints', description: 'Available API endpoints' },
      { title: 'Rate Limits', href: '/docs/api/rate-limits', description: 'API rate limiting info' },
      { title: 'Error Handling', href: '/docs/api/errors', description: 'Error codes and handling' },
    ],
  },
  {
    title: 'Billing & Plans',
    icon: '💳',
    items: [
      { title: 'Pricing Plans', href: '/docs/billing/plans', description: 'Compare available plans' },
      { title: 'Coins System', href: '/docs/billing/coins', description: 'How coins work' },
      { title: 'Invoices', href: '/docs/billing/invoices', description: 'Manage your invoices' },
    ],
  },
  {
    title: 'Integrations',
    icon: '🔗',
    items: [
      { title: 'Webhooks', href: '/docs/integrations/webhooks', description: 'Set up webhooks' },
      { title: 'SDKs', href: '/docs/integrations/sdks', description: 'Official SDK libraries' },
      { title: 'Zapier', href: '/docs/integrations/zapier', description: 'Zapier integration guide' },
    ],
  },
  {
    title: 'Support',
    icon: '💬',
    items: [
      { title: 'FAQ', href: '/docs/support/faq', description: 'Frequently asked questions' },
      { title: 'Contact Us', href: '/docs/support/contact', description: 'Get in touch with support' },
      { title: 'Status Page', href: '/docs/support/status', description: 'System status and uptime' },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 border-b border-border/50 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Documentation</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Everything you need to know about HSAFX World tools and API
            </p>
            
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <input
                type="search"
                placeholder="Search documentation..."
                className="w-full px-5 py-3 pl-12 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/docs/quick-start"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Quick Start Guide →
            </Link>
            <Link
              href="/docs/api"
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              API Reference
            </Link>
            <Link
              href="/docs/tools/categories"
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Browse Tools
            </Link>
            <Link
              href="/docs/support/faq"
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              FAQ
            </Link>
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {docSections.map((section) => (
              <div key={section.title} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{section.icon}</span>
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                </div>
                
                <ul className="space-y-3">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-12 bg-muted/30 border-t border-border/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-8 text-center">Popular Articles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <Link
              href="/docs/api/auth"
              className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <span className="text-xl mb-2 block">🔐</span>
              <h3 className="font-medium">API Authentication</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Learn how to authenticate API requests
              </p>
            </Link>
            
            <Link
              href="/docs/billing/coins"
              className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <span className="text-xl mb-2 block">🪙</span>
              <h3 className="font-medium">Understanding Coins</h3>
              <p className="text-sm text-muted-foreground mt-1">
                How the coin system works
              </p>
            </Link>
            
            <Link
              href="/docs/tools/using"
              className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <span className="text-xl mb-2 block">🛠️</span>
              <h3 className="font-medium">Using Tools</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tips for effective tool usage
              </p>
            </Link>
            
            <Link
              href="/docs/integrations/webhooks"
              className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <span className="text-xl mb-2 block">🔗</span>
              <h3 className="font-medium">Webhooks Setup</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Configure webhook notifications
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-4">Need More Help?</h2>
            <p className="text-muted-foreground mb-6">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/docs/support/contact"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="https://github.com/hsafx/hsafx-world/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Community Forum
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
