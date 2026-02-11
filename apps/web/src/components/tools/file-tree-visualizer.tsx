'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCopyToClipboard } from '@/hooks/use-utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// Icons
const TreeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9" />
    <path d="M3 12a9 9 0 0 1 9-9" />
    <path d="M12 3v18" />
    <path d="M12 12h9" />
    <path d="M12 12H3" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

// Tree characters for different styles
const TREE_CHARS = {
  fancy: {
    branch: '├── ',
    lastBranch: '└── ',
    vertical: '│   ',
    empty: '    ',
  },
  ascii: {
    branch: '+-- ',
    lastBranch: '\\-- ',
    vertical: '|   ',
    empty: '    ',
  },
};

// Tree node type
interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  path?: string;
}

// Parse indentation-based input to tree structure (tree.nathanfriend.com style)
function parseToTree(input: string): TreeNode[] {
  const lines = input.split('\n');
  const root: TreeNode[] = [];
  const stack: { node: TreeNode; depth: number }[] = [];

  for (const rawLine of lines) {
    // Skip empty lines
    if (!rawLine.trim()) continue;

    // Calculate depth based on leading spaces (2 spaces = 1 level)
    let depth = 0;
    let i = 0;
    while (i < rawLine.length && (rawLine[i] === ' ' || rawLine[i] === '\t')) {
      if (rawLine[i] === '\t') {
        depth += 1;
      } else {
        depth += 0.5; // 2 spaces = 1 level
      }
      i++;
    }
    depth = Math.floor(depth);

    // Handle markdown bullet points
    let name = rawLine.slice(i).trim();
    if (name.startsWith('- ')) {
      name = name.slice(2);
    }
    if (!name) continue;

    // Determine if folder (ends with / or has children on next line)
    const isFolder = name.endsWith('/');
    const cleanName = isFolder ? name.slice(0, -1) : name;

    const node: TreeNode = {
      name: cleanName,
      type: isFolder ? 'folder' : 'file',
      children: isFolder ? [] : undefined,
    };

    // Find parent at appropriate depth
    while (stack.length > 0 && stack[stack.length - 1]!.depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      const parent = stack[stack.length - 1]!.node;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
      // Auto-convert parent to folder if it has children
      parent.type = 'folder';
    }

    stack.push({ node, depth });
  }

  return root;
}

// Generate ASCII tree output with options (matching tree.nathanfriend.com)
interface TreeOptions {
  fancy: boolean;
  fullPath: boolean;
  trailingSlash: boolean;
  rootDot: boolean;
}

function generateAsciiTree(
  nodes: TreeNode[],
  options: TreeOptions,
  prefix = '',
  currentPath = ''
): string {
  const chars = options.fancy ? TREE_CHARS.fancy : TREE_CHARS.ascii;
  let output = '';

  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const connector = isLast ? chars.lastBranch : chars.branch;

    // Build the display name based on options
    let displayName = node.name;
    if (options.fullPath && currentPath) {
      displayName = currentPath + '/' + node.name;
    }
    if (options.trailingSlash && node.type === 'folder') {
      displayName += '/';
    }

    output += prefix + connector + displayName + '\n';

    if (node.children && node.children.length > 0) {
      const newPrefix = prefix + (isLast ? chars.empty : chars.vertical);
      const newPath = currentPath ? currentPath + '/' + node.name : node.name;
      output += generateAsciiTree(node.children, options, newPrefix, newPath);
    }
  });

  return output;
}

// Example input (tree.nathanfriend.com style)
const EXAMPLE_INPUT = `Edit me to generate
  a
    nice
      tree
        diagram!
        :)
Use indentation
  to indicate
    file
    and
    folder
    nesting.
  You can even
    use
      markdown
      bullets!`;

export interface FileTreeVisualizerProps {
  className?: string;
}

export function FileTreeVisualizer({ className }: FileTreeVisualizerProps) {
  const [input, setInput] = React.useState(EXAMPLE_INPUT);
  const [tree, setTree] = React.useState<TreeNode[]>([]);
  const [asciiOutput, setAsciiOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const { copy, copied } = useCopyToClipboard();

  // Options matching tree.nathanfriend.com
  const [options, setOptions] = React.useState<TreeOptions>({
    fancy: true,
    fullPath: false,
    trailingSlash: false,
    rootDot: true,
  });

  // Generate tree on input or options change
  React.useEffect(() => {
    try {
      const parsedTree = parseToTree(input);
      setTree(parsedTree);

      // Build output with root dot if enabled
      let output = '';
      if (options.rootDot && parsedTree.length > 0) {
        output = '.\n';
      }
      output += generateAsciiTree(parsedTree, options);
      setAsciiOutput(output);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse input');
    }
  }, [input, options]);

  // Toggle option
  const toggleOption = (key: keyof TreeOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle download
  const handleDownload = () => {
    const blob = new Blob([asciiOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'file-tree.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle share (copy URL with encoded input)
  const handleShare = () => {
    const encoded = encodeURIComponent(input);
    const shareUrl = `${window.location.origin}${window.location.pathname}?tree=${encoded}`;
    copy(shareUrl);
  };

  // Load from URL on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const treeParam = params.get('tree');
    if (treeParam) {
      try {
        setInput(decodeURIComponent(treeParam));
      } catch {
        // Ignore invalid URL params
      }
    }
  }, []);

  return (
    <div className={cn('flex flex-col gap-4 h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TreeIcon />
          <h2 className="text-lg font-semibold">File Tree Generator</h2>
        </div>
        {/* <p className="text-xs text-muted-foreground hidden sm:block">
          Inspired by{' '}
          <a
            href="https://tree.nathanfriend.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            tree.nathanfriend.com
          </a>
        </p> */}
      </div>

      {/* Main content - side by side like tree.nathanfriend.com */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Input panel (left) */}
        <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Edit me to generate a tree diagram!
            </span>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your tree structure here...
                          Use indentation (2 spaces or tabs) for hierarchy.
                          Lines ending with / are treated as folders."
            className="flex-1 min-h-275 font-mono text-sm border-0 rounded-none resize-none bg-background focus-visible:ring-0 focus-visible:ring-offset-0"
            spellCheck={false}
          />
        </div>

        {/* Output panel (right) */}
        <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
            <span className="text-sm font-medium text-muted-foreground">Output</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => copy(asciiOutput)}
                title="Copy to clipboard"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={handleShare}
                title="Copy shareable link"
              >
                <ShareIcon />
                Share
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-87.5 overflow-auto p-4 bg-slate-950">
            {error ? (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            ) : (
              <pre className="font-mono text-sm text-emerald-400 whitespace-pre leading-relaxed">
                {asciiOutput || (
                  <span className="text-muted-foreground">
                    Start typing to see your tree...
                  </span>
                )}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Options bar at bottom (matching tree.nathanfriend.com style) */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="fancy"
              checked={options.fancy}
              onCheckedChange={() => toggleOption('fancy')}
            />
            <Label htmlFor="fancy" className="text-sm cursor-pointer">
              Fancy
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="fullPath"
              checked={options.fullPath}
              onCheckedChange={() => toggleOption('fullPath')}
            />
            <Label htmlFor="fullPath" className="text-sm cursor-pointer">
              Full path
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="trailingSlash"
              checked={options.trailingSlash}
              onCheckedChange={() => toggleOption('trailingSlash')}
            />
            <Label htmlFor="trailingSlash" className="text-sm cursor-pointer">
              Trailing /
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="rootDot"
              checked={options.rootDot}
              onCheckedChange={() => toggleOption('rootDot')}
            />
            <Label htmlFor="rootDot" className="text-sm cursor-pointer">
              Root .
            </Label>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
          <DownloadIcon />
          Download
        </Button>
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground text-center">
        Use indentation (spaces or tabs) to create hierarchy. Lines ending with{' '}
        <code className="px-1 bg-muted rounded">/</code> are treated as folders. You can also use{' '}
        <code className="px-1 bg-muted rounded">- </code> markdown bullets.
      </p>
    </div>
  );
}

export default FileTreeVisualizer;
