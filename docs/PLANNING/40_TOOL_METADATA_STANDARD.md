# 🏷️ Tool Metadata Standard

**Purpose:** Define minimal SEO-safe contract for every tool page to ensure discoverability, educational value, and user success.

---

## ⚠️ GOLDEN RULE

> **"Never ship a tool page without structured educational metadata."**
> 
> Google ranks **content**, not just tools. A tool without context is invisible and unusable.

---

## 📋 TypeScript Interface

```typescript
/**
 * Tool Metadata Standard
 * 
 * Every tool page MUST implement this interface to ensure:
 * - SEO discoverability (structured data for Google)
 * - User onboarding (clear use cases and examples)
 * - Error prevention (common mistakes documented)
 * - Navigation (related tools for discovery)
 */
interface ToolPage {
  /** URL-safe identifier (e.g., "json-formatter", "base64-encoder") */
  slug: string;
  
  /** 
   * Main heading for the page (H1)
   * Format: "[Tool Name] - [Primary Benefit]"
   * Example: "JSON Formatter - Beautify & Validate JSON Online"
   */
  h1: string;
  
  /** 
   * Meta description (150-160 chars)
   * Should include: what it does + primary use case + benefit
   * Example: "Format, validate, and beautify JSON data instantly. Perfect for API debugging and code readability."
   */
  description: string;
  
  /**
   * Detailed use cases (3-5 scenarios)
   * Each use case should answer: "When would I use this?"
   */
  useCases: UseCase[];
  
  /**
   * Working examples with input/output pairs (2-4 examples)
   * Show realistic, relatable scenarios
   */
  examples: Example[];
  
  /**
   * Common errors users might encounter (3-5 errors)
   * Each error should include: symptom, cause, solution
   */
  commonErrors: CommonError[];
  
  /**
   * Related tools for cross-discovery (3-5 tools)
   * Format: {slug, title, relationship}
   */
  relatedTools: RelatedTool[];
  
  /**
   * Optional: Tool-specific configuration
   */
  config?: ToolConfig;
}

interface UseCase {
  /** Short title (e.g., "API Response Debugging") */
  title: string;
  
  /** 1-2 sentence description of when/why to use */
  description: string;
  
  /** Optional: Industry or role (e.g., "Backend Developer", "Data Analyst") */
  audience?: string;
}

interface Example {
  /** Descriptive title (e.g., "Format API Response") */
  title: string;
  
  /** Input data/text */
  input: string;
  
  /** Expected output */
  output: string;
  
  /** Optional: Explanation of transformation */
  explanation?: string;
}

interface CommonError {
  /** User-facing symptom (e.g., "Invalid JSON Error") */
  symptom: string;
  
  /** Technical cause (e.g., "Trailing comma on line 5") */
  cause: string;
  
  /** Step-by-step solution */
  solution: string;
  
  /** Optional: Example of fix */
  example?: string;
}

interface RelatedTool {
  /** Tool slug for internal linking */
  slug: string;
  
  /** Tool display name */
  title: string;
  
  /** How it relates (e.g., "Alternative format", "Next step", "Complementary") */
  relationship: "alternative" | "next-step" | "complementary" | "prerequisite";
  
  /** Optional: 1-sentence explanation */
  description?: string;
}

interface ToolConfig {
  /** Category for grouping (e.g., "Text", "Developer", "Converter", "Media") */
  category: "text" | "developer" | "converter" | "media";
  
  /** Subcategory for finer grouping */
  subcategory?: string;
  
  /** SEO keywords (5-10 relevant terms) */
  keywords: string[];
  
  /** Execution context (browser-only, API-available, etc.) */
  executionEnvironments: Array<'browser-wasm' | 'api-python' | 'api-node'>;
  // Example: ['browser-wasm', 'api-python'] for hybrid tools
    
  /** Requires authentication for API access */
  requiresAuth?: boolean;
}
```

---

## 📐 Validation Rules

### Required Fields (Must Never Be Empty)
- ✅ `slug` — Must be kebab-case, unique across all tools
- ✅ `h1` — Must be 40-70 characters for SEO
- ✅ `description` — Must be 150-160 characters
- ✅ `useCases` — Minimum 3, maximum 5
- ✅ `examples` — Minimum 2, maximum 4
- ✅ `commonErrors` — Minimum 3, maximum 5
- ✅ `relatedTools` — Minimum 3, maximum 5

### Content Quality Rules
- 🎯 **Use Cases:** Must answer "When would I use this?" not just "What does this do?"
- 📝 **Examples:** Must use realistic data, not "foo/bar" placeholders
- ⚠️ **Errors:** Must include solution, not just describe the problem
- 🔗 **Related Tools:** Must explain relationship, not just list tools

---

## 🎨 Content Generation Strategy

### Manual vs AI-Assisted

**ALLOWED (AI-Assisted):**
- ✅ Generating initial use case drafts
- ✅ Creating example scenarios
- ✅ Writing error explanations
- ✅ Suggesting related tools

**REQUIRED (Manual Review):**
- ✅ Validating technical accuracy
- ✅ Testing all examples work correctly
- ✅ Ensuring error solutions are current
- ✅ Verifying related tool links exist

**PRINCIPLE:** AI can draft, humans must verify. No hallucinated examples in production.

---

## 📊 SEO Impact

### Structured Data Benefits
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "{{ h1 }}",
  "description": "{{ description }}",
  "applicationCategory": "UtilityApplication",
  "offers": {
    "@type": "Offer",
    "price": "0"
  }
}
```

### Content Richness Signals
- **Use Cases:** Target long-tail keywords ("when to use JSON formatter")
- **Examples:** Provide rich snippets for featured results
- **Errors:** Capture troubleshooting queries ("JSON formatter error")
- **Related Tools:** Internal linking strengthens domain authority

---

## 🚦 Implementation Checklist

Before shipping a tool page:

- [ ] All required fields populated
- [ ] H1 is 40-70 characters
- [ ] Description is 150-160 characters
- [ ] At least 3 use cases with audience context
- [ ] At least 2 working examples tested
- [ ] At least 3 common errors with solutions
- [ ] At least 3 related tools with valid slugs
- [ ] All examples produce correct output
- [ ] No "TODO" or placeholder content
- [ ] Structured data JSON-LD added to page
- [ ] Internal links verified working

---

## 🎯 Example: JSON Formatter Tool

```typescript
const jsonFormatterMetadata: ToolPage = {
  slug: "json-formatter",
  h1: "JSON Formatter - Beautify & Validate JSON Online",
  description: "Format, validate, and beautify JSON data instantly. Perfect for API debugging, code readability, and finding syntax errors in JSON files.",
  
  useCases: [
    {
      title: "API Response Debugging",
      description: "Quickly format minified JSON responses from APIs to identify structure and find errors.",
      audience: "Backend Developer"
    },
    {
      title: "Code Review Preparation",
      description: "Beautify JSON configuration files before committing to ensure consistent formatting across team.",
      audience: "Full-Stack Developer"
    },
    {
      title: "Data Analysis",
      description: "Structure nested JSON data to understand hierarchies and extract specific fields.",
      audience: "Data Analyst"
    }
  ],
  
  examples: [
    {
      title: "Format Minified API Response",
      input: '{"user":{"id":123,"name":"Alice","roles":["admin","editor"]}}',
      output: `{
  "user": {
    "id": 123,
    "name": "Alice",
    "roles": [
      "admin",
      "editor"
    ]
  }
}`,
      explanation: "Transforms compact JSON into readable, indented format with 2-space indentation."
    },
    {
      title: "Validate JSON Syntax",
      input: '{"name": "Bob", "age": 30,}',
      output: "❌ Error: Unexpected token } in JSON at position 24 (trailing comma)",
      explanation: "Identifies syntax errors like trailing commas that break JSON parsing."
    }
  ],
  
  commonErrors: [
    {
      symptom: "Unexpected token in JSON at position X",
      cause: "Trailing comma after last object property or array element",
      solution: "Remove comma after the last item. JSON does not allow trailing commas unlike JavaScript.",
      example: 'Before: {"a": 1,}\nAfter: {"a": 1}'
    },
    {
      symptom: "Unexpected end of JSON input",
      cause: "Incomplete JSON structure - missing closing bracket or brace",
      solution: "Ensure every opening bracket [ or brace { has a matching closing bracket ] or brace }.",
      example: 'Before: {"users": [{"name": "Alice"}\nAfter: {"users": [{"name": "Alice"}]}'
    },
    {
      symptom: "Invalid character in string",
      cause: "Unescaped special characters like quotes or newlines in string values",
      solution: "Escape special characters with backslash: \\\" for quotes, \\n for newlines, \\\\ for backslashes.",
      example: 'Before: {"msg": "Hello "World""}\nAfter: {"msg": "Hello \\"World\\""}'
    }
  ],
  
  relatedTools: [
    {
      slug: "json-minifier",
      title: "JSON Minifier",
      relationship: "alternative",
      description: "Remove whitespace to compress JSON (opposite operation)"
    },
    {
      slug: "json-to-csv",
      title: "JSON to CSV Converter",
      relationship: "next-step",
      description: "Convert formatted JSON to spreadsheet format"
    },
    {
      slug: "yaml-formatter",
      title: "YAML Formatter",
      relationship: "complementary",
      description: "Format YAML configuration files with similar structure"
    },
    {
      slug: "xml-formatter",
      title: "XML Formatter",
      relationship: "alternative",
      description: "Format XML data if working with XML instead of JSON"
    }
  ],
  
  config: {
    category: "developer",
    subcategory: "data-format",
    keywords: ["json", "formatter", "beautify", "validate", "syntax", "pretty-print", "api", "debugging"],
    execution: "both",
    requiresAuth: false
  }
};
```

---

## 🔄 Maintenance

### Quarterly Review
- Verify all examples still work
- Update error messages if tool behavior changed
- Refresh related tools if new tools added
- Review keywords for SEO performance

### When to Update
- Tool functionality changes
- Common errors evolve
- Related tools added/deprecated
- SEO performance drops

---

## 📚 References

- **SEO:** Google's [Quality Guidelines](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- **Structured Data:** [Schema.org SoftwareApplication](https://schema.org/SoftwareApplication)
- **Content Strategy:** Nielsen Norman Group's [Writing for the Web](https://www.nngroup.com/articles/how-users-read-on-the-web/)

---

**Last Updated:** January 10, 2026  
**Status:** ✅ Production Standard — Ready for Implementation
