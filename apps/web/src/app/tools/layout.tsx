import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | HSAFX Tools',
    default: 'Tools',
  },
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background">
      {children}
    </main>
  );
}
