# 50 — Complex Tool Algorithms

> Algorithm reference for tools with non-trivial logic. Implementations in `packages/tools/src/specialized/`.

---

## GPA Calculator ✅ Built (`gpa-calculator.ts`)

- 3 grading systems: US 4.0, Pakistan/India percentage, Germany 5.0
- Supports: simple (unweighted), weighted (credit hours), cumulative (multi-semester)
- Edge cases: pass/fail filtering, retaken courses (uses higher grade)

## Islamic Inheritance Calculator ✅ Engine preset mapped

- Heir categories: Ashab al-Furud (fixed share), Asabah (residuary), Dhawil Arham (distant)
- Fixed shares: husband (1/2 or 1/4), wife (1/4 or 1/8 ÷ count), mother (1/3 or 1/6), father (1/6 or residuary)
- Blocking rules (Hijab): sons block grandsons, father blocks grandfather, children block siblings
- Residuary: male=2 shares, female=1 share ratio
- Special cases: 'Awl (proportional reduction when shares >100%), Radd (return surplus to non-spouse heirs)
- Supports 4 madhhab: Hanafi, Shafi'i, Maliki, Hanbali

## Zakat Calculator ✅ Engine preset mapped

- Nisab: gold 87.48g (7.5 tola), silver 612.36g (52.5 tola)
- Assets: cash, bank, gold/silver, business, investments, retirement
- Algorithm: total wealth − liabilities ≥ nisab → 2.5% of net
- Special: agricultural (rain 10%, irrigated 5%, mixed 7.5%), livestock (nisab tables)

## Cheque Generator ✅ Built (`cheque-generator.ts`)

- Amount to words conversion: handles scales (trillion→hundred), teens, tens
- Currency: "Rupees" + "Paisa" suffix + "Only"
- Locale: `en-PK` formatting

## Age Calculator ✅ Engine preset mapped

- Luxon-based timezone-aware date arithmetic
- Returns: years/months/days/hours/minutes, totals, next birthday, zodiac sign
- Handles leap years, DST transitions

## Validation Rules

| Tool        | Key Rules                                         |
| ----------- | ------------------------------------------------- |
| GPA         | creditHours>0, gradePoint≤scale, ≥1 course        |
| Inheritance | estate>0, ≥1 heir, no circular relations          |
| Zakat       | amounts≥0, valid nisab standard, prices provided  |
| Cheque      | amount>0 & <10M, non-empty payee, date within 6mo |
| Age         | birth<target, birth>1900, valid IANA timezone     |
