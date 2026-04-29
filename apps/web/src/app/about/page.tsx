import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | HSAFX Tools',
  description: 'Learn about HSAFX Tools — a B2B API platform for text, data, and media processing engines.',
};

export default function AboutPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">About HSAFX Tools</h1>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>
          HSAFX Tools is a B2B API platform providing 30 parameterized engines for text processing,
          data transformation, and media manipulation — all server-side, all via API.
        </p>

        <h2 className="text-xl font-semibold text-foreground">What We Do</h2>
        <p>
          We provide developers and businesses with a unified API to handle common processing tasks
          that would otherwise require maintaining dozens of separate libraries and infrastructure:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>9 text/data engines — case conversion, encoding, hashing, text filtering, generation</li>
          <li>11 code/format engines — JSON/YAML/XML conversion, formatting, schema generation, validation</li>
          <li>10 media engines — image, video, audio, PDF, document, archive, and font processing</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground">Architecture</h2>
        <p>
          Engines run across three server-side backends — a Rust service for high-performance text
          processing, Node.js for code/format operations, and Python (FastAPI) for media processing.
          One API, three optimized runtimes.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Contact</h2>
        <p>
          Questions or partnership inquiries? Reach us at{' '}
          <a href="mailto:contact@hsafx.world" className="text-primary hover:underline">
            contact@hsafx.world
          </a>
        </p>
      </div>
    </div>
  );
}
