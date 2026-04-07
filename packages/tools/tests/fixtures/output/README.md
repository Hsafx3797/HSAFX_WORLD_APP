# Output Directory

This directory receives test outputs during test runs.
Each test writes its results here so you can inspect what each tool produces.

**Structure:**
- `text/` - Text tool outputs (readability scores, extractions, diffs, etc.)
- `validators/` - Validation results
- `generators/` - Generated content (UUIDs, passwords, QR codes, etc.)
- `specialized/` - DB diagrams, file trees, cheques
- `encoders/` - Encoded/decoded outputs
- `seo/` - SEO tool outputs
- `css/` - CSS generator outputs
- `timezone/` - Timezone conversion results

These files are regenerated on every test run.
