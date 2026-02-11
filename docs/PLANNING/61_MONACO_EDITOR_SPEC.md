# 📝 Monaco Editor Integration Specification

**Tools Using Monaco:** 192-297 (106 CODE EDITOR tools)  
**Package:** `@monaco-editor/react`  
**Features:** Syntax highlighting, auto-format, validation, diff mode

---

## 1. Overview

Monaco Editor (VS Code's editor) powers all CODE EDITOR tools (JSON, YAML, XML, SQL, etc.).

**Features Enabled:**
- Syntax highlighting for 40+ languages
- Auto-formatting (Prettier integration)
- Real-time validation
- Diff mode for comparison tools
- Minimap, line numbers, folding
- Multi-cursor editing
- Find/replace

---

## 2. Monaco Wrapper Component

```tsx
// packages/ui-components/MonacoEditor.tsx

import { useRef, useEffect } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, WrapText } from 'lucide-react';

export type MonacoLanguage =
  | 'json'
  | 'yaml'
  | 'xml'
  | 'html'
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'sql'
  | 'markdown'
  | 'dockerfile'
  | 'plaintext';

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: MonacoLanguage;
  readOnly?: boolean;
  height?: string;
  showMinimap?: boolean;
  autoFormat?: boolean; // Auto-format on mount
  validate?: boolean; // Enable validation
  lineNumbers?: 'on' | 'off' | 'relative';
  wordWrap?: 'on' | 'off' | 'bounded';
  fontSize?: number;
}

export function MonacoEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = '400px',
  showMinimap = true,
  autoFormat = false,
  validate = true,
  lineNumbers = 'on',
  wordWrap = 'off',
  fontSize = 14
}: MonacoEditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentWordWrap, setCurrentWordWrap] = useState(wordWrap);
  
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Auto-format on mount
    if (autoFormat && !readOnly) {
      setTimeout(() => {
        editor.getAction('editor.action.formatDocument')?.run();
      }, 100);
    }
    
    // Configure validation
    if (validate) {
      configureValidation(monaco, language);
    }
  };
  
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  
  const toggleWordWrap = () => {
    const newWrap = currentWordWrap === 'on' ? 'off' : 'on';
    setCurrentWordWrap(newWrap);
    editorRef.current?.updateOptions({ wordWrap: newWrap });
  };
  
  return (
    <div className={`relative border rounded-md ${fullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 p-2 border-b bg-muted/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleWordWrap}
          aria-label="Toggle word wrap"
        >
          <WrapText className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <Editor
        height={fullscreen ? 'calc(100vh - 48px)' : height}
        language={language}
        value={value}
        onChange={onChange}
        theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: showMinimap },
          lineNumbers,
          wordWrap: currentWordWrap,
          fontSize,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
          // Accessibility
          accessibilitySupport: 'auto',
          ariaLabel: `Code editor for ${language}`,
        }}
      />
    </div>
  );
}

function configureValidation(monaco: Monaco, language: MonacoLanguage) {
  switch (language) {
    case 'json':
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [],
        allowComments: false
      });
      break;
    
    case 'yaml':
      // YAML validation via custom markers
      // (Monaco doesn't have built-in YAML validation)
      break;
    
    case 'javascript':
    case 'typescript':
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false
      });
      break;
  }
}
```

---

## 3. Diff Editor for Comparison Tools

```tsx
// packages/ui-components/MonacoDiffEditor.tsx

import { DiffEditor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import type { MonacoLanguage } from './MonacoEditor';

interface MonacoDiffEditorProps {
  original: string;
  modified: string;
  language: MonacoLanguage;
  height?: string;
  renderSideBySide?: boolean;
}

export function MonacoDiffEditor({
  original,
  modified,
  language,
  height = '600px',
  renderSideBySide = true
}: MonacoDiffEditorProps) {
  const { theme } = useTheme();
  
  return (
    <DiffEditor
      height={height}
      language={language}
      original={original}
      modified={modified}
      theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
      options={{
        readOnly: true,
        renderSideBySide,
        automaticLayout: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        fontSize: 14,
        wordWrap: 'off'
      }}
    />
  );
}
```

**Usage for Comparison Tools:**
```tsx
// Tool 255: Compare JSON
<MonacoDiffEditor
  original={inputA}
  modified={inputB}
  language="json"
  renderSideBySide={true}
/>
```

---

## 4. Language-Specific Configurations

### 4.1 JSON Tools (192-210)

```typescript
// JSON Formatter, Minifier, Validator
{
  language: 'json',
  autoFormat: true,
  validate: true,
  options: {
    formatOnPaste: true,
    formatOnType: false,
    tabSize: 2
  }
}
```

**Auto-Format Action:**
```typescript
function formatJSON(editor: editor.IStandaloneCodeEditor) {
  editor.getAction('editor.action.formatDocument')?.run();
}
```

---

### 4.2 YAML Tools (211-220)

```typescript
// YAML Formatter, Validator
{
  language: 'yaml',
  autoFormat: true, // Uses Prettier
  validate: true, // Custom validation
  options: {
    tabSize: 2,
    insertSpaces: true
  }
}
```

**Custom YAML Validation:**
```typescript
import yaml from 'js-yaml';

function validateYAML(content: string, monaco: Monaco, editor: editor.IStandaloneCodeEditor) {
  try {
    yaml.load(content);
    // Clear markers
    monaco.editor.setModelMarkers(editor.getModel()!, 'yaml', []);
  } catch (error: any) {
    // Add error marker
    monaco.editor.setModelMarkers(editor.getModel()!, 'yaml', [{
      startLineNumber: error.mark?.line || 1,
      startColumn: error.mark?.column || 1,
      endLineNumber: error.mark?.line || 1,
      endColumn: error.mark?.column || 100,
      message: error.message,
      severity: monaco.MarkerSeverity.Error
    }]);
  }
}
```

---

### 4.3 XML Tools (221-230)

```typescript
// XML Formatter, Minifier
{
  language: 'xml',
  autoFormat: true,
  validate: true,
  options: {
    formatOnPaste: true
  }
}
```

**XML Formatting with fast-xml-parser:**
```typescript
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

function formatXML(content: string): string {
  const parser = new XMLParser({ ignoreAttributes: false });
  const builder = new XMLBuilder({ ignoreAttributes: false, format: true, indentBy: '  ' });
  
  const parsed = parser.parse(content);
  return builder.build(parsed);
}
```

---

### 4.4 SQL Tools (241-250)

```typescript
// SQL Formatter
{
  language: 'sql',
  autoFormat: true,
  validate: false, // No built-in SQL validation
  options: {
    tabSize: 4,
    wordWrap: 'bounded'
  }
}
```

**SQL Formatting with sql-formatter:**
```typescript
import { format } from 'sql-formatter';

function formatSQL(content: string, dialect: 'mysql' | 'postgresql' | 'tsql' = 'mysql'): string {
  return format(content, {
    language: dialect,
    tabWidth: 4,
    keywordCase: 'upper',
    linesBetweenQueries: 2
  });
}
```

---

## 5. Prettier Integration

```typescript
// packages/ui-components/utils/prettier.ts

import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';
import parserHTML from 'prettier/parser-html';
import parserYAML from 'prettier/parser-yaml';
import parserMarkdown from 'prettier/parser-markdown';

const parsers = {
  javascript: parserBabel,
  typescript: parserBabel,
  json: parserBabel,
  html: parserHTML,
  xml: parserHTML,
  css: parserHTML,
  yaml: parserYAML,
  markdown: parserMarkdown
};

export async function formatWithPrettier(
  code: string,
  language: MonacoLanguage
): Promise<string> {
  try {
    const parser = getParserForLanguage(language);
    
    return prettier.format(code, {
      parser,
      plugins: [parsers[language]],
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5'
    });
  } catch (error) {
    console.error('Prettier formatting failed:', error);
    return code; // Return original if formatting fails
  }
}

function getParserForLanguage(language: MonacoLanguage): string {
  const mapping: Record<string, string> = {
    json: 'json',
    javascript: 'babel',
    typescript: 'babel-ts',
    html: 'html',
    xml: 'html',
    css: 'css',
    yaml: 'yaml',
    markdown: 'markdown'
  };
  
  return mapping[language] || 'babel';
}
```

**Usage in Monaco:**
```typescript
import { formatWithPrettier } from '@/utils/prettier';

const handleFormat = async () => {
  if (!editorRef.current) return;
  
  const value = editorRef.current.getValue();
  const formatted = await formatWithPrettier(value, language);
  
  editorRef.current.setValue(formatted);
};
```

---

## 6. Keyboard Shortcuts

```typescript
// Register custom keyboard shortcuts
function registerShortcuts(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
  // Ctrl+S to format
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    editor.getAction('editor.action.formatDocument')?.run();
  });
  
  // Ctrl+Shift+F to find
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
    () => {
      editor.getAction('actions.find')?.run();
    }
  );
  
  // Ctrl+D to duplicate line
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
    editor.getAction('editor.action.copyLinesDownAction')?.run();
  });
}
```

---

## 7. Language-to-Tool Mapping

```typescript
// Map tool IDs to Monaco languages
export const toolLanguageMap: Record<number, MonacoLanguage> = {
  // JSON Tools (192-210)
  192: 'json', // JSON Formatter
  193: 'json', // JSON Minifier
  194: 'json', // JSON Validator
  195: 'json', // JSON to YAML
  
  // YAML Tools (211-220)
  211: 'yaml', // YAML Formatter
  212: 'yaml', // YAML Validator
  213: 'yaml', // YAML to JSON
  
  // XML Tools (221-230)
  221: 'xml', // XML Formatter
  222: 'xml', // XML Minifier
  223: 'xml', // XML Validator
  
  // HTML Tools (231-235)
  231: 'html', // HTML Formatter
  232: 'html', // HTML Minifier
  
  // CSS Tools (236-240)
  236: 'css', // CSS Formatter
  237: 'css', // CSS Minifier
  
  // SQL Tools (241-250)
  241: 'sql', // SQL Formatter
  242: 'sql', // SQL Beautifier
  
  // JavaScript Tools (251-260)
  251: 'javascript', // JS Formatter
  252: 'javascript', // JS Minifier
  253: 'javascript', // JS Obfuscator
  
  // TypeScript Tools (261-270)
  261: 'typescript', // TS Formatter
  
  // Python Tools (271-280)
  271: 'python', // Python Formatter
  
  // Markdown Tools (281-285)
  281: 'markdown', // Markdown Editor
  282: 'markdown', // Markdown Preview
  
  // Dockerfile Tools (286-290)
  286: 'dockerfile', // Dockerfile Formatter
  
  // Others
  291: 'plaintext' // Text Editor
};

export function getLanguageForTool(toolId: number): MonacoLanguage {
  return toolLanguageMap[toolId] || 'plaintext';
}
```

---

## 8. Theme Configuration

```typescript
// Custom Monaco themes matching app theme
export function defineCustomThemes(monaco: Monaco) {
  // Light theme
  monaco.editor.defineTheme('productivity-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1a1a1a',
      'editor.lineHighlightBackground': '#f5f5f5',
      'editorCursor.foreground': '#0066cc',
      'editor.selectionBackground': '#b3d4fc'
    }
  });
  
  // Dark theme
  monaco.editor.defineTheme('productivity-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1a1a1a',
      'editor.foreground': '#d4d4d4',
      'editor.lineHighlightBackground': '#2a2a2a',
      'editorCursor.foreground': '#ffffff',
      'editor.selectionBackground': '#264f78'
    }
  });
}
```

---

## 9. Performance Optimization

### 9.1 Lazy Loading Monaco

```typescript
// Only load Monaco when CODE_EDITOR tool is accessed
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(
  () => import('@/components/MonacoEditor').then(mod => mod.MonacoEditor),
  {
    ssr: false,
    loading: () => <div>Loading editor...</div>
  }
);
```

### 9.2 Virtual Scrolling for Large Files

```typescript
// Automatically enabled by Monaco for files > 100,000 lines
// Configure threshold:
{
  options: {
    stopRenderingLineAfter: 10000, // Stop rendering after 10k chars/line
    renderValidationDecorations: 'off' // Disable for large files
  }
}
```

---

## 10. Complete Tool Implementation Example

```tsx
// Tool 192: JSON Formatter

import { useState } from 'react';
import { MonacoEditor } from '@/components/MonacoEditor';
import { ToolContainer } from '@/components/ToolContainer';
import { Button } from '@/components/ui/button';
import { getToolById } from '@/tool-definitions';

export default function JSONFormatterTool() {
  const tool = getToolById(192)!;
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  
  const handleFormat = async () => {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };
  
  return (
    <ToolContainer
      tool={tool}
      actions={
        <>
          <Button onClick={handleFormat}>Format</Button>
          <Button variant="outline" onClick={() => setInput('')}>Clear</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Input JSON</label>
          <MonacoEditor
            value={input}
            onChange={setInput}
            language="json"
            height="500px"
            autoFormat={false}
            validate={true}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Formatted Output</label>
          <MonacoEditor
            value={output}
            language="json"
            height="500px"
            readOnly={true}
            autoFormat={false}
          />
        </div>
      </div>
    </ToolContainer>
  );
}
```

---

**This specification provides complete Monaco Editor integration for all 106 CODE EDITOR tools with formatting, validation, and diff capabilities.**
