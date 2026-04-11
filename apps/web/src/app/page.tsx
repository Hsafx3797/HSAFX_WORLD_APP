// Home page — links to /tools for browsing engines
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-linear-to-b from-primary/5 to-background">
        <div className="container text-center">
          <Badge variant="secondary" className="mb-4">
            30 Engines Available
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
            Developer Tools for{' '}
            <span className="text-primary">Every Need</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Free online tools for text transformation, data conversion, image processing,
            code generation, and more. Fast, secure, and privacy-focused.
          </p>

          {/* TODO: Add SearchBar component back once tool routes are built (Task 1000) */}

          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/tools">Browse Tools</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/api-docs">API Access</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-3 text-center">
            <div>
              <p className="text-4xl font-bold text-primary">30</p>
              <p className="text-muted-foreground mt-1">Engines Available</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">10</p>
              <p className="text-muted-foreground mt-1">Categories</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">100%</p>
              <p className="text-muted-foreground mt-1">Free to Use</p>
            </div>
          </div>
        </div>
      </section>

      {/* TODO: Categories Section — render tool categories grid with links once tool routes are built (Task 1000) */}

      {/* TODO: Popular Tools Section — render popular tools cards with links once tool routes are built (Task 1000) */}

      {/* Features Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Tools?</h2>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Server-side processing with Rust, Node.js, and Python engines.
                Optimized for speed and throughput.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-muted-foreground">
                Secure server-side processing with encryption in transit.
                No data stored after processing.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-semibold mb-2">Free Forever</h3>
              <p className="text-muted-foreground">
                All basic tools are free with no limits. Premium features for power users.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔌</div>
              <h3 className="text-xl font-semibold mb-2">API Access</h3>
              <p className="text-muted-foreground">
                Integrate our tools into your workflow with our REST API.
                Available for all tiers.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Mobile Friendly</h3>
              <p className="text-muted-foreground">
                Responsive design works perfectly on any device.
                Use tools on the go.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2">Beautiful UI</h3>
              <p className="text-muted-foreground">
                Clean, modern interface with dark mode support.
                Customizable themes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join thousands of developers using our tools every day.
            Create a free account to save your preferences and unlock premium features.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/signup">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
