# 30 — Tools Catalog

> **30 engines**, **~454 tool operations**, ALL server-side.
> Updated: April 2026.

## Engine Catalog

| #  | Engine          | Backend  | Operations | Description                          |
|----|-----------------|----------|-----------|--------------------------------------|
| 1  | `case`          | Rust     | 68        | Case conversions (snake, camel, etc.)|
| 2  | `wrap`          | Rust     | 50+       | Text wrapping (quotes, brackets)     |
| 3  | `filter`        | Rust     | 15+       | Remove/extract/keep text patterns    |
| 4  | `transform`     | Rust     | 24        | Reverse/sort/shuffle/pad/join        |
| 5  | `encode`        | Rust     | ~70       | Base64/hex/URL/ROT13/morse           |
| 6  | `hash`          | Rust     | 10+       | SHA/MD5/CRC/HMAC/checksum           |
| 7  | `counter`       | Rust     | 5         | Word/char/line/frequency counts      |
| 8  | `unicode`       | Rust     | 10+       | Zalgo, fullwidth, math transforms    |
| 9  | `generate-data` | Rust     | 20+       | UUID/password/nanoid/person           |
| 10 | `comment`       | Node.js  | 37+       | Add/remove comments (37 languages)   |
| 11 | `markup`        | Node.js  | 20+       | HTML/MD/BBCode/LaTeX tag wrapping    |
| 12 | `convert`       | Node.js  | 30+       | JSON↔YAML↔XML↔CSV↔TOML converters   |
| 13 | `format`        | Node.js  | 15+       | Format/minify SQL/JSON/CSS/GraphQL   |
| 14 | `schema`        | Node.js  | 10+       | JSON Schema↔TypeScript↔Zod↔Joi      |
| 15 | `diff`          | Node.js  | 5+        | Text/schema/OpenAPI diff             |
| 16 | `api`           | Node.js  | 10+       | curl parse, JWT decode, URL parse    |
| 17 | `generate-web`  | Node.js  | 20+       | CSS generators, QR, SEO, lorem       |
| 18 | `validate`      | Node.js  | 39        | Format validators (email, UUID, etc.)|
| 19 | `calculate`     | Node.js  | 9         | Expression, financial, health calcs  |
| 20 | `unit`          | Node.js  | 23        | Unit conversions (length, weight)    |
| 21 | `image`         | FastAPI  | 19        | Resize, crop, convert, watermark     |
| 22 | `video`         | FastAPI  | 12        | Convert, trim, extract audio         |
| 23 | `audio`         | FastAPI  | 12        | Convert, normalize, split            |
| 24 | `pdf`           | FastAPI  | 27        | Merge, split, compress, OCR          |
| 25 | `document`      | FastAPI  | 15        | DOCX↔PDF, EPUB, markdown             |
| 26 | `archive`       | FastAPI  | 8         | Zip, tar, 7z, extract               |
| 27 | `file`          | FastAPI  | 5         | Metadata extraction                  |
| 28 | `font`          | FastAPI  | 4         | Convert, subset, WOFF2               |
| 29 | `tracking`      | FastAPI  | 3         | Container/vessel/flight tracking     |
| 30 | `cheque`        | FastAPI  | 1         | Multi-currency cheque generation     |

## Backend Distribution

| Backend  | Count | Protocol            |
|----------|-------|---------------------|
| Rust     | 9     | HTTP X-Internal-Secret |
| Node.js  | 11    | Direct import       |
| FastAPI  | 10    | HTTP X-Internal-Secret |

## Notes

- `packages/tool-definitions` registry is DELETED — do not reference
- All execution via `POST /api/v1/engine/{name}` with `{ input, options }`
- No presets, no slugs, no category routes

- **Doc numbered 446, registry has 454** — some tools were added/split during implementation beyond original catalog
- All tool metadata (slug, name, description, category, keywords, engine mapping) lives in registry code
- Media tools (#298-379) execute server-side via FastAPI, not client engines
- Specialized tools (#443-446) have custom UI: cheque generator, file tree viewer, DB visualization, seaport container tracker
- Calculator references exist in `docs/DUST_BIN/EXAMPLE/`: GPA_CALCULATOR.md, ISLAMIC_INHERITANCE_CALCULATOR.md, ISLAMIC_ZAKAT_CALCULATOR.md, TIMEZONE_CONVERSION.md
- Specialized references: DB_VISULIZATION.md, FILE_STRUCTURE_TREE.md, CHEQUE_GENERATOR.md, seaport_terminal_scraper/
