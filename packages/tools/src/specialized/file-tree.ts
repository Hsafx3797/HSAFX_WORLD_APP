/**
 * File Structure Tree Generator
 * Generate visual tree representations of directory structures
 */

export interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  size?: number;
  extension?: string;
  path?: string;
}

export interface TreeOptions {
  style: 'ascii' | 'unicode' | 'markdown' | 'json' | 'html';
  showHidden: boolean;
  showSize: boolean;
  maxDepth: number;
  indent: number;
  excludePatterns: string[];
  includePatterns: string[];
  sortBy: 'name' | 'type' | 'size';
  sortOrder: 'asc' | 'desc';
  foldersFirst: boolean;
}

const DEFAULT_OPTIONS: TreeOptions = {
  style: 'unicode',
  showHidden: false,
  showSize: false,
  maxDepth: Infinity,
  indent: 2,
  excludePatterns: ['node_modules', '.git', '.DS_Store', 'Thumbs.db'],
  includePatterns: [],
  sortBy: 'name',
  sortOrder: 'asc',
  foldersFirst: true,
};

const TREE_CHARS = {
  ascii: {
    branch: '|-- ',
    lastBranch: '`-- ',
    vertical: '|   ',
    space: '    ',
  },
  unicode: {
    branch: '├── ',
    lastBranch: '└── ',
    vertical: '│   ',
    space: '    ',
  },
};

function matchPattern(name: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(name);
    }
    return name === pattern;
  });
}

function sortNodes(nodes: TreeNode[], options: TreeOptions): TreeNode[] {
  return [...nodes].sort((a, b) => {
    // Folders first
    if (options.foldersFirst) {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
    }
    
    // Sort by specified field
    let comparison = 0;
    switch (options.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = (a.extension || '').localeCompare(b.extension || '');
        break;
      case 'size':
        comparison = (a.size || 0) - (b.size || 0);
        break;
    }
    
    return options.sortOrder === 'desc' ? -comparison : comparison;
  });
}

function filterNodes(nodes: TreeNode[], options: TreeOptions): TreeNode[] {
  return nodes.filter(node => {
    // Hidden files
    if (!options.showHidden && node.name.startsWith('.')) {
      return false;
    }
    
    // Exclude patterns
    if (matchPattern(node.name, options.excludePatterns)) {
      return false;
    }
    
    // Include patterns (if specified)
    if (options.includePatterns.length > 0) {
      if (node.type === 'directory') return true; // Always include directories for traversal
      return matchPattern(node.name, options.includePatterns);
    }
    
    return true;
  });
}

export function generateASCIITree(
  root: TreeNode,
  options: Partial<TreeOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chars = opts.style === 'ascii' ? TREE_CHARS.ascii : TREE_CHARS.unicode;
  
  const lines: string[] = [];
  
  function buildTree(node: TreeNode, prefix: string, isLast: boolean, depth: number): void {
    if (depth > opts.maxDepth) return;
    
    const connector = depth === 0 ? '' : (isLast ? chars.lastBranch : chars.branch);
    const icon = node.type === 'directory' ? '📁 ' : getFileIcon(node.extension);
    
    let line = prefix + connector + (opts.style === 'unicode' ? icon : '') + node.name;
    
    if (opts.showSize && node.size !== undefined) {
      line += ` (${formatSize(node.size)})`;
    }
    
    lines.push(line);
    
    if (node.children && node.children.length > 0 && depth < opts.maxDepth) {
      const filteredChildren = filterNodes(node.children, opts);
      const sortedChildren = sortNodes(filteredChildren, opts);
      
      sortedChildren.forEach((child, index) => {
        const newPrefix = depth === 0 ? '' : prefix + (isLast ? chars.space : chars.vertical);
        const isLastChild = index === sortedChildren.length - 1;
        buildTree(child, newPrefix, isLastChild, depth + 1);
      });
    }
  }
  
  buildTree(root, '', true, 0);
  
  return lines.join('\n');
}

export function generateMarkdownTree(
  root: TreeNode,
  options: Partial<TreeOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];
  
  function buildTree(node: TreeNode, depth: number): void {
    if (depth > opts.maxDepth) return;
    
    const indent = '  '.repeat(depth);
    const bullet = node.type === 'directory' ? '- 📁 **' : '- 📄 ';
    const suffix = node.type === 'directory' ? '**' : '';
    
    let line = indent + bullet + node.name + suffix;
    
    if (opts.showSize && node.size !== undefined) {
      line += ` *(${formatSize(node.size)})*`;
    }
    
    lines.push(line);
    
    if (node.children && node.children.length > 0 && depth < opts.maxDepth) {
      const filteredChildren = filterNodes(node.children, opts);
      const sortedChildren = sortNodes(filteredChildren, opts);
      
      sortedChildren.forEach(child => {
        buildTree(child, depth + 1);
      });
    }
  }
  
  buildTree(root, 0);
  
  return lines.join('\n');
}

export function generateHTMLTree(
  root: TreeNode,
  options: Partial<TreeOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  function buildTree(node: TreeNode, depth: number): string {
    if (depth > opts.maxDepth) return '';
    
    const icon = node.type === 'directory' ? '📁' : getFileIcon(node.extension);
    const className = node.type === 'directory' ? 'directory' : 'file';
    
    let sizeInfo = '';
    if (opts.showSize && node.size !== undefined) {
      sizeInfo = `<span class="size">${formatSize(node.size)}</span>`;
    }
    
    let html = `<li class="${className}"><span class="icon">${icon}</span> <span class="name">${escapeHtml(node.name)}</span>${sizeInfo}`;
    
    if (node.children && node.children.length > 0 && depth < opts.maxDepth) {
      const filteredChildren = filterNodes(node.children, opts);
      const sortedChildren = sortNodes(filteredChildren, opts);
      
      if (sortedChildren.length > 0) {
        html += '<ul>';
        sortedChildren.forEach(child => {
          html += buildTree(child, depth + 1);
        });
        html += '</ul>';
      }
    }
    
    html += '</li>';
    return html;
  }
  
  const treeHtml = buildTree(root, 0);
  
  return `
<style>
  .file-tree { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; }
  .file-tree ul { list-style: none; padding-left: 20px; margin: 0; }
  .file-tree > ul { padding-left: 0; }
  .file-tree li { padding: 4px 0; }
  .file-tree .icon { margin-right: 6px; }
  .file-tree .name { }
  .file-tree .directory > .name { font-weight: bold; }
  .file-tree .size { color: #888; margin-left: 8px; font-size: 12px; }
</style>
<div class="file-tree">
  <ul>${treeHtml}</ul>
</div>`.trim();
}

export function generateJSONTree(
  root: TreeNode,
  options: Partial<TreeOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  function processNode(node: TreeNode, depth: number): TreeNode | null {
    if (depth > opts.maxDepth) return null;
    
    const result: TreeNode = {
      name: node.name,
      type: node.type,
    };
    
    if (opts.showSize && node.size !== undefined) {
      result.size = node.size;
    }
    
    if (node.extension) {
      result.extension = node.extension;
    }
    
    if (node.children && node.children.length > 0 && depth < opts.maxDepth) {
      const filteredChildren = filterNodes(node.children, opts);
      const sortedChildren = sortNodes(filteredChildren, opts);
      
      const processedChildren = sortedChildren
        .map(child => processNode(child, depth + 1))
        .filter((child): child is TreeNode => child !== null);
      
      if (processedChildren.length > 0) {
        result.children = processedChildren;
      }
    }
    
    return result;
  }
  
  const processed = processNode(root, 0);
  return JSON.stringify(processed, null, 2);
}

export function parseDirectoryStructure(input: string): TreeNode {
  const lines = input.trim().split('\n');
  const root: TreeNode = {
    name: 'root',
    type: 'directory',
    children: [],
  };
  
  const stack: { node: TreeNode; indent: number }[] = [{ node: root, indent: -1 }];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Calculate indent level
    const match = line.match(/^(\s*)/);
    const indent = match ? match[1].length : 0;
    
    // Extract name
    let name = line.trim();
    // Remove tree characters
    name = name.replace(/^[│├└─\s|`-]+/, '').trim();
    // Remove emojis
    name = name.replace(/^[\u{1F4C1}\u{1F4C4}\u{1F4DD}]\s*/u, '').trim();
    
    if (!name) continue;
    
    const isDirectory = name.endsWith('/') || name.includes('**');
    name = name.replace(/\*\*/g, '').replace(/\/$/, '').trim();
    
    const extension = isDirectory ? undefined : getExtension(name);
    
    const node: TreeNode = {
      name,
      type: isDirectory ? 'directory' : 'file',
      extension,
      children: isDirectory ? [] : undefined,
    };
    
    // Find parent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    
    const parent = stack[stack.length - 1].node;
    if (!parent.children) {
      parent.children = [];
    }
    parent.children.push(node);
    
    if (isDirectory) {
      stack.push({ node, indent });
    }
  }
  
  return root.children?.length === 1 ? root.children[0] : root;
}

function getExtension(filename: string): string | undefined {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : undefined;
}

function getFileIcon(extension?: string): string {
  const iconMap: Record<string, string> = {
    // Code
    ts: '📘',
    tsx: '⚛️',
    js: '📒',
    jsx: '⚛️',
    py: '🐍',
    rb: '💎',
    go: '🐹',
    rs: '🦀',
    java: '☕',
    kt: '🟣',
    swift: '🍊',
    c: '🔷',
    cpp: '🔷',
    h: '📋',
    cs: '🟢',
    php: '🐘',
    
    // Web
    html: '🌐',
    css: '🎨',
    scss: '🎨',
    sass: '🎨',
    less: '🎨',
    
    // Data
    json: '📋',
    yaml: '📋',
    yml: '📋',
    xml: '📋',
    csv: '📊',
    sql: '🗃️',
    
    // Docs
    md: '📝',
    txt: '📄',
    pdf: '📕',
    doc: '📘',
    docx: '📘',
    
    // Config
    env: '⚙️',
    config: '⚙️',
    gitignore: '🔧',
    
    // Images
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    ico: '🖼️',
    webp: '🖼️',
    
    // Other
    zip: '📦',
    tar: '📦',
    gz: '📦',
    lock: '🔒',
  };
  
  return iconMap[extension || ''] || '📄 ';
}

function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Convenience function
export function generateTree(
  root: TreeNode,
  options: Partial<TreeOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  switch (opts.style) {
    case 'ascii':
    case 'unicode':
      return generateASCIITree(root, opts);
    case 'markdown':
      return generateMarkdownTree(root, opts);
    case 'html':
      return generateHTMLTree(root, opts);
    case 'json':
      return generateJSONTree(root, opts);
    default:
      return generateASCIITree(root, opts);
  }
}

// Parse text input and generate tree
export function textToTree(
  input: string,
  options: Partial<TreeOptions> = {}
): string {
  const root = parseDirectoryStructure(input);
  return generateTree(root, options);
}
