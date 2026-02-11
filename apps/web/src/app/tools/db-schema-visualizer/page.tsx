import { Metadata } from 'next';
import { DbSchemaVisualizerInteractive } from '@/components/tools';

export const metadata: Metadata = {
  title: 'Database Schema Visualizer | HSAFX Tools',
  description: 'Interactive database schema visualization tool. Input DBML or SQL, drag tables, zoom, and explore relationships. Export as SVG or PNG.',
  keywords: ['database schema', 'DBML', 'ERD', 'entity relationship diagram', 'SQL visualization', 'database design', 'schema visualizer'],
  openGraph: {
    title: 'Database Schema Visualizer | HSAFX Tools',
    description: 'Interactive database schema visualization with drag, zoom, and relationship highlighting.',
  },
};

export default function DbSchemaVisualizerPage() {
  return (
    <div className="container py-8">
      {/* Hero Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🗄️ Database Schema Visualizer</h1>
        <p className="text-muted-foreground max-w-2xl">
          Visualize your database schema interactively. Input DBML or SQL, drag tables to arrange them,
          zoom and pan, hover to highlight relationships. Export your diagrams as SVG or PNG.
        </p>
      </div>

      {/* Interactive Visualizer */}
      <DbSchemaVisualizerInteractive className="min-h-[calc(100vh-250px)]" />

      {/* SEO Content */}
      {/* <div className="mt-12 prose prose-sm dark:prose-invert max-w-none">
        <h2>About Database Schema Visualizer</h2>
        <p>
          The HSAFX Database Schema Visualizer is an interactive tool for visualizing and exploring database schemas.
          Unlike static diagram generators, this tool lets you interact with your schema - drag tables, zoom in and out,
          and hover over relationships to understand your data model better.
        </p>
        
        <h3>Features</h3>
        <div className="grid gap-4 md:grid-cols-2 not-prose">
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-2">🔄 Interactive Canvas</h4>
            <p className="text-sm text-muted-foreground">Drag tables to rearrange, zoom with scroll wheel, pan by dragging the canvas background.</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-2">🔗 Relationship Highlighting</h4>
            <p className="text-sm text-muted-foreground">Hover over a table to highlight all its relationships. Click connections to see details.</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-2">📝 Multiple Input Formats</h4>
            <p className="text-sm text-muted-foreground">Supports DBML (Database Markup Language) and SQL CREATE TABLE statements.</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-semibold mb-2">📤 Export Options</h4>
            <p className="text-sm text-muted-foreground">Download your diagram as SVG for editing or PNG for sharing and documentation.</p>
          </div>
        </div>

        <h3>Supported Input Formats</h3>
        <ul>
          <li><strong>DBML:</strong> <a href="https://dbml.dbdiagram.io/docs/" target="_blank" rel="noopener noreferrer">Database Markup Language</a> - A simple DSL for defining database schemas</li>
          <li><strong>SQL:</strong> Standard CREATE TABLE statements with foreign key references</li>
        </ul>

        <h3>Keyboard Shortcuts</h3>
        <ul>
          <li><kbd>Ctrl/Cmd + +</kbd> — Zoom in</li>
          <li><kbd>Ctrl/Cmd + -</kbd> — Zoom out</li>
          <li><kbd>Ctrl/Cmd + 0</kbd> — Reset zoom</li>
          <li><kbd>Escape</kbd> — Deselect table</li>
        </ul>

        <h3>Use Cases</h3>
        <ul>
          <li><strong>Database Design:</strong> Plan and visualize your schema before implementation</li>
          <li><strong>Documentation:</strong> Generate diagrams for technical documentation</li>
          <li><strong>Code Review:</strong> Understand database changes in pull requests</li>
          <li><strong>Learning:</strong> Explore and understand existing database structures</li>
        </ul>
      </div> */}
    </div>
  );
}
