# 30 — Tools Catalog (Compacted)

> Original: 446 numbered tool entries. Registry (`packages/tool-definitions/src/registry/`) is source of truth with **454 tool IDs**.

## Registry Totals (from `index.ts`)

| Category    | Count   | Registry File          | Engine Coverage                  |
| ----------- | ------- | ---------------------- | -------------------------------- |
| Text        | 191     | `text-tools.ts`        | ✅ 191/191 mapped                |
| Data        | 106     | `data-tools.ts`        | ✅ Engines done, presets partial |
| Media       | 83      | `media-tools.ts`       | Server-side (FastAPI)            |
| Generator   | 38      | `generator-tools.ts`   | Engine done, presets needed      |
| Calculator  | 9       | `calculator-tools.ts`  | Engine done, presets needed      |
| Converter   | 23      | `converter-tools.ts`   | Engine done, presets needed      |
| Specialized | 4       | `specialized-tools.ts` | Custom UI/logic                  |
| **Total**   | **454** |                        |                                  |

## Catalog Categories (by original numbering)

| Range   | Category                                                                                                                                                                                                                | Count |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 001-050 | Text case converters                                                                                                                                                                                                    | 50    |
| 051-097 | Text wrappers/formatters                                                                                                                                                                                                | 47    |
| 098-120 | Unicode/fun text transforms                                                                                                                                                                                             | 23    |
| 121-161 | Encoders/decoders/ciphers                                                                                                                                                                                               | 41    |
| 162-191 | Text manipulation/cleanup                                                                                                                                                                                               | 30    |
| 192-297 | Data format converters                                                                                                                                                                                                  | 106   |
| 298-379 | Media tools (image/video/audio)                                                                                                                                                                                         | 82    |
| 380-414 | Generators (UUID, password, lorem, QR, color, SEO, CSS, etc.)                                                                                                                                                           | 35    |
| 415-419 | Calculators (BMI, GPA, Islamic inheritance, Zakat, timezone)                                                                                                                                                            | 5     |
| 420-442 | Unit converters (length, weight, temp, area, volume, time, speed, energy, pressure, power, frequency, data storage, electrical, angle, force, torque, fuel, radiation, density, illumination, magnetic, cooking, paper) | 23    |
| 443-446 | Specialized (DB visualization, file tree, cheque generator, seaport tracker)                                                                                                                                            | 4     |

## Key Notes

- **Doc numbered 446, registry has 454** — some tools were added/split during implementation beyond original catalog
- All tool metadata (slug, name, description, category, keywords, engine mapping) lives in registry code
- Media tools (#298-379) execute server-side via FastAPI, not client engines
- Specialized tools (#443-446) have custom UI: cheque generator, file tree viewer, DB visualization, seaport container tracker
- Calculator references exist in `docs/DUST_BIN/EXAMPLE/`: GPA_CALCULATOR.md, ISLAMIC_INHERITANCE_CALCULATOR.md, ISLAMIC_ZAKAT_CALCULATOR.md, TIMEZONE_CONVERSION.md
- Specialized references: DB_VISULIZATION.md, FILE_STRUCTURE_TREE.md, CHEQUE_GENERATOR.md, seaport_terminal_scraper/
