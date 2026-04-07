import { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Changelog | HSAFX Tools',
  description: 'See what\'s new and what we\'ve been working on.',
};

interface ChangelogEntry {
  date: string;
  version: string;
  title: string;
  type: 'feature' | 'improvement' | 'fix';
  items: string[];
}

const changelog: ChangelogEntry[] = [
  {
    date: '2025-01-15',
    version: '1.3.0',
    title: 'Dashboard & Activity Feed',
    type: 'feature',
    items: [
      'Live dashboard stats with real execution counts',
      'Activity feed showing recent tool usage',
      'Auth-aware header with user dropdown menu',
      'Notification bell wired into header',
      'Trust badges on tool pages (client/server processing)',
      'Stats section on landing page',
    ],
  },
  {
    date: '2025-01-10',
    version: '1.2.0',
    title: 'Media & Generator Tools',
    type: 'feature',
    items: [
      'Added 83 media processing tools with file upload',
      'Added 38 generator tools (UUID, password, QR, etc.)',
      'Added 23 unit converter tools',
      'Added 9 calculator tools',
      'Tool page options panels for all media tools',
    ],
  },
  {
    date: '2025-01-05',
    version: '1.1.0',
    title: 'Billing & Subscriptions',
    type: 'feature',
    items: [
      'Coin wallet with daily bonus rewards',
      'Stripe and Polar payment integration',
      'Subscription tiers: Free, Pro, Advance',
      'API key management for developers',
      'Usage history and execution tracking',
    ],
  },
  {
    date: '2025-01-01',
    version: '1.0.0',
    title: 'Initial Launch',
    type: 'feature',
    items: [
      '28 parameterized engines across 3 backends',
      '9 text/data engines (Rust)',
      '11 code/format engines (Node.js),'
      'User authentication with social login (Google, GitHub, Facebook)',
      'Dark/light mode with theme customization',
      'Smart search across all tools',
      'Responsive design for mobile and desktop',
    ],
  },
];

const typeBadge: Record<ChangelogEntry['type'], { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  feature: { label: 'Feature', variant: 'default' },
  improvement: { label: 'Improvement', variant: 'secondary' },
  fix: { label: 'Fix', variant: 'destructive' },
};

export default function ChangelogPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Changelog</h1>
        <p className="text-muted-foreground">
          All notable changes and updates to HSAFX Tools.
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-1.75 top-2 bottom-2 w-px bg-border" />

        <div className="space-y-8">
          {changelog.map((entry) => {
            const badge = typeBadge[entry.type];
            return (
              <div key={entry.version} className="relative pl-8">
                {/* Timeline dot */}
                <div className="absolute left-0 top-2 w-3.75 h-3.75 rounded-full border-2 border-primary bg-background" />

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <span className="text-sm font-mono text-muted-foreground">v{entry.version}</span>
                      <span className="text-sm text-muted-foreground ml-auto">{entry.date}</span>
                    </div>
                    <h2 className="text-lg font-semibold mb-3">{entry.title}</h2>
                    <ul className="space-y-1.5">
                      {entry.items.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
