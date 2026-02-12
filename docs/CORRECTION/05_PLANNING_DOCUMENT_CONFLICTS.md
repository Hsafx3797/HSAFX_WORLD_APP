# 05 — PLANNING DOCUMENT CONFLICTS

> **Last audited:** 2025-07-15
> **Scope:** All 49 planning documents cross-referenced for contradictions
> **Action needed:** Resolve each conflict before implementation

---

## WHY THIS MATTERS

When two planning documents specify different values for the same thing, developers don't know which is correct. This leads to:
- Picking one arbitrarily (50% chance of being wrong)
- Implementing neither (the current state for most of these)
- Implementing both and creating bugs

**These MUST be resolved before Sprint 6.**

---

## CONFLICT 1: Coin Pack Pricing

| Document | Coin Pack | Price |
|----------|-----------|-------|
| `20_BILLING_SYSTEM.md` §3.2 | Starter Pack (100 coins) | $4.99 |
| `21_BILLING_LOGIC.md` §3.1 | Starter Pack (100 coins) | $5.00 |
| `20_BILLING_SYSTEM.md` §3.2 | Pro Pack (500 coins) | $19.99 |
| `21_BILLING_LOGIC.md` §3.1 | Pro Pack (500 coins) | $20.00 |

**Resolution needed:** Are prices rounded (nice numbers) or $.99 styled?

---

## CONFLICT 2: Ad Reward Eligibility

| Document | Rule |
|----------|------|
| `20_BILLING_SYSTEM.md` §5.1 | Free users only can watch ads |
| `21_BILLING_LOGIC.md` §5.2 | All users can watch ads (free users get higher rewards) |

**Resolution needed:** Can paid subscribers watch ads for coins?

---

## CONFLICT 3: Daily Ad Coin Cap

| Document | Cap |
|----------|-----|
| `20_BILLING_SYSTEM.md` §5.1 | 1,000 coins/day from ads |
| `21_BILLING_LOGIC.md` §5.3 | 50 coins/day from ads |

**Resolution needed:** 1,000 vs 50 is a 20x difference. This directly affects revenue projections.

---

## CONFLICT 4: Max API Keys Per User

| Document | Limit |
|----------|-------|
| `22_BACKEND_OWNERSHIP_MATRIX.md` §API | Max 5 API keys per user |
| `25_API_KEY_AUTH.md` §3.1 | No explicit limit mentioned (unlimited implied) |

**Resolution needed:** Is there a per-user API key limit?

---

## CONFLICT 5: API Rate Limit Tiers

| Document | Free Tier | Pro Tier |
|----------|-----------|----------|
| `22_BACKEND_OWNERSHIP_MATRIX.md` | 100 req/hour | 1,000 req/hour |
| `25_API_KEY_AUTH.md` | 60 req/min (= 3,600/hour) | 120 req/min (= 7,200/hour) |

**Resolution needed:** Per-hour vs per-minute base, and values differ by 36x for free tier.

---

## CONFLICT 6: Plan Pricing (Pro Plan)

| Document | Monthly Price |
|----------|--------------|
| `20_BILLING_SYSTEM.md` §2.1 | $10/month |
| `21_BILLING_LOGIC.md` §2.2 | $29/month |

**Resolution needed:** $10 vs $29 is a fundamental business decision.

---

## CONFLICT 7: Billing Error Code B001

| Document | HTTP Status |
|----------|-------------|
| `24_ERROR_HANDLING.md` §Billing | B001: 403 Forbidden |
| `21_BILLING_LOGIC.md` §7 | B001: 402 Payment Required |

**Resolution needed:** 402 is semantically correct for billing. 403 is for authorization.

---

## CONFLICT 8: Coins Per Ad View

| Document | Value |
|----------|-------|
| `20_BILLING_SYSTEM.md` §5.1 | 10 coins per ad |
| `21_BILLING_LOGIC.md` §5.2 | 5-10 coins per ad (variable) |

**Resolution needed:** Fixed value or variable range?

---

## CONFLICT 9: Subscription Status Storage

| Document | Approach |
|----------|----------|
| `13_DATABASE_SCHEMA.md` §Invariants | "Status is NEVER stored as a column — derive from timestamps" |
| `13_DATABASE_SCHEMA.dbml` | `subscriptions` table has `status varchar` column |

**Resolution needed:** The DBML and the markdown contradict each other in the same doc pair.

---

## CONFLICT 10: Payment Provider

| Document | Provider |
|----------|----------|
| `20_BILLING_SYSTEM.md` | Stripe references throughout |
| `21_BILLING_LOGIC.md` | Stripe references throughout |
| Actual codebase | Polar + Stripe (dual) |

**Resolution needed:** Is the primary provider Stripe, Polar, or both? Code has `polar_product_id` + `polar_subscription_id` but Stripe webhook handler exists too.

---

## RESOLUTION TEMPLATE

For each conflict, the project owner should decide:

```
Conflict #: [number]
Decision: [which document's value to use]
Rationale: [business reasoning]
Documents to update: [list]
Code to update: [list, if already implemented wrong]
```

---

## IMPACT ON IMPLEMENTATION

Until these 10 conflicts are resolved:
- **Billing system cannot be finalized** (conflicts 1, 3, 5, 6, 8, 10)
- **API rate limits cannot be configured** (conflict 5)
- **Ad reward system values are unknown** (conflicts 2, 3, 8)
- **Error handling codes ambiguous** (conflict 7)
- **Schema migration blocked** (conflict 9)
