import { Metadata } from 'next';
import { FileTreeVisualizer } from '@/components/tools/file-tree-visualizer';

export const metadata: Metadata = {
    title: 'File Tree Generator | HSAFX Tools',
    description: 'Generate ASCII file tree diagrams from indented text. Perfect for documentation, README files, and project structure visualization.',
    keywords: ['file tree', 'directory structure', 'ASCII tree', 'project structure', 'tree diagram', 'file structure generator'],
    openGraph: {
        title: 'File Tree Generator | HSAFX Tools',
        description: 'Generate ASCII file tree diagrams for documentation and README files.',
    },
};

export default function FileTreeGeneratorPage() {
    return (
        <div className="container py-8 min-h-[calc(100vh-200px)] flex flex-col">
            {/* Hero Section */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">🌳 File Tree Generator</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Generate ASCII file tree diagrams from indented text. Perfect for documentation, 
                    <span className='text-blue-500'>README</span> files, and visualizing project structures. 
                    {/* Inspired by{' '}
                    <a
                        href="https://tree.nathanfriend.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        tree.nathanfriend.com
                    </a>. */}
                </p>
            </div>

            {/* File Tree Visualizer */}
            <FileTreeVisualizer className="flex-1" />

            {/* SEO Content */}
            {/* <div className="mt-12 prose prose-sm dark:prose-invert max-w-none">
                <h2>About File Tree Generator</h2>
                <p>
                    The HSAFX File Tree Generator is a simple yet powerful tool for creating ASCII tree diagrams
                    that represent file and folder structures. It's perfect for documentation, README files,
                    code reviews, and project planning.
                </p>

                <h3>Features</h3>
                <div className="grid gap-4 md:grid-cols-2 not-prose">
                    <div className="p-4 rounded-lg border bg-card">
                        <h4 className="font-semibold mb-2">📝 Simple Input</h4>
                        <p className="text-sm text-muted-foreground">Just type your structure using indentation. Use 2 spaces or tabs for each level.</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                        <h4 className="font-semibold mb-2">⚡ Real-time Preview</h4>
                        <p className="text-sm text-muted-foreground">See your tree update instantly as you type. No "generate" button needed.</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                        <h4 className="font-semibold mb-2">🎨 Style Options</h4>
                        <p className="text-sm text-muted-foreground">Toggle fancy characters, full paths, trailing slashes, and root dot display.</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                        <h4 className="font-semibold mb-2">🔗 Shareable Links</h4>
                        <p className="text-sm text-muted-foreground">Generate a link that preserves your tree structure for sharing with others.</p>
                    </div>
                </div>

                <h3>Input Format</h3>
                <p>The input format is flexible and supports multiple styles:</p>
                <ul>
                    <li><strong>Indentation:</strong> Use 2 spaces or tabs to indicate hierarchy levels</li>
                    <li><strong>Folders:</strong> End a line with <code>/</code> to mark it as a folder</li>
                    <li><strong>Markdown:</strong> You can use <code>- </code> bullet points (they'll be stripped)</li>
                    <li><strong>Auto-detect:</strong> Items with children are automatically treated as folders</li>
                </ul>

                <h3>Example Input</h3>
                <pre className="bg-muted p-4 rounded-lg text-sm">
                    {`my-project/
                        src/
                            components/
                            Button.tsx
                            Input.tsx
                            utils/
                            helpers.ts
                        package.json
                        README.md`}
                </pre>

                <h3>Use Cases</h3>
                <ul>
                    <li><strong>Documentation:</strong> Show project structure in README files</li>
                    <li><strong>Code Reviews:</strong> Visualize proposed file changes</li>
                    <li><strong>Architecture:</strong> Plan folder organization before implementation</li>
                    <li><strong>Tutorials:</strong> Show expected directory layout in educational content</li>
                </ul>
            </div> */}
        </div>
    );
}
