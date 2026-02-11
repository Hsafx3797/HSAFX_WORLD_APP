## Inheritance Calculator: ( According Islamic Shreya ): 

Below is a **clear, implementation-ready breakdown** of an **Islamic Inheritance Calculator (according to Sharia / Faraid)** — **what inputs you need** and **how the calculation works step-by-step**.

This is **logic + formulas**, not country law.

---

# 🕌 Islamic Inheritance Calculator (Sharia / Faraid)

Below is a **clean, properly structured, step-by-step rewrite** of your content, **aligned strictly with the blocking rules logic** and written in a way that is **implementation-ready** for an Islamic inheritance calculator.

No fiqh discussion, no duplication — **only clear inputs + blocking order**.

---

# 🕌 Islamic Inheritance Calculator

## Inputs & Blocking-Order Specification

---

## 1️⃣ REQUIRED ESTATE INPUTS (MANDATORY)

These inputs are **always required** before any inheritance calculation.

1. **Total Estate Value** `total_estate`

2. **Funeral Expenses** `funeral_cost`

3. **Debts of the Deceased** `debts`

4. **Will (Wasiyyah) Amount** `will_amount`

**Constraints**
   * Maximum allowed: **1/3 of the net estate**
   * Cannot be assigned to any legal heir

---

## 2️⃣ REQUIRED FAMILY COUNTS (RAW INPUT)

All values are **counts (0, 1, 2, …)**.

> Only relatives listed below are **standard heirs**.
> Any relative **not listed** is **not eligible** for inheritance.

---

### A) Spouses

1. **Husband** `boolean` OR **Wives** `number`
   * impossible to have both at once
   * Must be legally married
   * Secret / undocumented marriages are invalid
   * Multiple wives allowed
   * Divorced wife eligible only if **ʿiddah not completed**

---

### B) Direct Descendants (Highest Priority)

2. **Sons & Daughters**
   * Biological only
   * No adopted / step / illegitimate daughters

---

### C) Descendants via Son Only

5. **Grandsons**
   * Only **son’s sons**
   * Daughter’s sons are not eligible

6. **Granddaughters**
   * Only **son’s daughters**
   * Daughter’s daughters are not eligible

---

### D) Ascendants

7. **Father**
8. **Mother**

   * Biological only

9. **Grandfather**
   * Only **father’s father**
   * Mother’s father is always excluded

---

### E) Grandmothers

10. **Paternal Grandmother**
    * Father’s mother

11. **Maternal Grandmother**
    * Mother’s mother

---

### F) Siblings

12. **Full Brothers**
13. **Full Sisters**

14. **Paternal Brothers**
15. **Paternal Sisters**

16. **Maternal Brothers**
17. **Maternal Sisters**

---

### G) Nephews (Male Line Only)

18. **Full Nephews**
19. **Paternal Nephews**
20. **Full Nephew’s Sons**
21. **Paternal Nephew’s Sons**

---

### H) Uncles

22. **Full Paternal Uncles**
23. **Paternal Paternal Uncles**

---

### I) Cousins (Male Line Only)

24. **Full Cousins**
25. **Paternal Cousins**
26. **Full Cousin’s Sons**
27. **Paternal Cousin’s Sons**
28. **Full Cousin’s Grandsons**
29. **Paternal Cousin’s Grandsons**

---

## 3️⃣ UNIVERSAL ELIGIBILITY FILTER (APPLIED FIRST)

Before blocking logic begins, **remove any relative** who is:

```text
• Not alive
• Non-Muslim
• Illegitimate
• Not listed in the standard heirs list
```

---

## 4️⃣ BLOCKING RULES — STEP-BY-STEP LOGIC

Blocking is applied **in strict order**.
Once a higher-priority class exists, all lower classes are removed.

---

### STEP 1 — UNBLOCKABLE HEIRS

These heirs are **never blocked** if alive:

```text
Husband
Wife
Father
Mother
Son
Daughter
```

---

### STEP 2 — DESCENDANT BLOCKING

#### If **at least one Son exists**

Block **all** of the following:

```text
• All grandchildren
• All siblings (full, paternal, maternal)
• All nephews
• All uncles
• All cousins
```

#### Else if **at least one Grandson (son’s son) exists**

Block:

```text
• All siblings
• All nephews
• All uncles
• All cousins
```

---

### STEP 3 — ASCENDANT BLOCKING

#### If **Father exists**

Block:

```text
• Grandfather
• All siblings
• All nephews
• All uncles
• All cousins
```

#### Else if **Grandfather exists**

Block:

```text
• All nephews
• All uncles
• All cousins
```

---

### STEP 4 — GRANDMOTHER BLOCKING

#### If **Mother exists**

Block:

```text
• Paternal grandmother
• Maternal grandmother
```

#### Else

```text
• Only one grandmother may inherit
• If both exist, share rules apply later
```

---

### STEP 5 — SIBLING HIERARCHY

#### If **Full Brother exists**

Block:

```text
• Paternal brothers
• Paternal sisters
• All nephews
• All uncles
• All cousins
```

#### Else if **Paternal Brother exists**

Block:

```text
• All nephews
• All uncles
• All cousins
```

---

### STEP 6 — MATERNAL SIBLINGS (WEAKEST LINE)

If **any** of the following exist:

```text
• Son
• Grandson
• Father
• Grandfather
```

Then block:

```text
• Maternal brothers
• Maternal sisters
```

---

### STEP 7 — NEPHEWS

#### If **Full Nephew exists**

Block:

```text
• Paternal nephew
• All uncles
• All cousins
```

#### Else if **Paternal Nephew exists**

Block:

```text
• All uncles
• All cousins
```

---

### STEP 8 — UNCLES

#### If **Full Paternal Uncle exists**

Block:

```text
• Paternal paternal uncle
• All cousins
```

#### Else if **Paternal Paternal Uncle exists**

Block:

```text
• All cousins
```

---

### STEP 9 — COUSINS

Apply closest-male rule:

```text
• Full cousin blocks paternal cousin
• Closer generation blocks farther generation
```

---

### STEP 10 — FEMALE-ONLY DESCENDANT RULE

```text
Inheritance does NOT continue through females
```

Examples:

```text
• Daughter’s children → always blocked
• Sister’s children → always blocked
```

---

## 5️⃣ FINAL HEIRS LIST

After all blocking steps:

```text
Remaining relatives = eligible heirs
Proceed to share calculation (Faraid, Taʿseeb, Awl, Radd)
```

🟢 NOTES

* Unborn child (pregnancy) is **reserved a share**
* Spouse can **never block** or be blocked
* Blocking is applied **before** share calculation
* This logic works for **Hanafi-based systems**


---

🧠 ISLAMIC INHERITANCE — BLOCKING LOGIC (ALGORITHM)

> **Goal:**
> Determine **who is eliminated (Mahjoob)** *before* any shares are calculated.

🔑 CORE PRINCIPLE

> **Closer relatives block more distant relatives**
> **Male paternal line dominates**
> **Fixed heirs are never blocked**

0. — IMMUTABLE HEIRS (NEVER BLOCKED)

These heirs **always remain if alive**:

```text
Husband: boolean or Wife: number
Father: boolean
Mother: boolean
Son: number
Daughter: number
```

❗ No logic can remove them.

1. — REMOVE NON-ELIGIBLE HEIRS

```text
If heir.isMuslim == false → remove
If heir.isLegitimate == false → remove
If heir.isAlive == false → remove
```

2. — DESCENDANT BLOCKING (STRONGEST)

If **Son exists**

```text
BLOCK:
- All grandchildren (son’s sons, son’s daughters)
- All siblings (full, paternal, maternal)
- All nephews
- All uncles
- All cousins
```

Else if **Grandson (son’s son) exists**

```text
BLOCK:
- All siblings
- All nephews
- All uncles
- All cousins
```

3. — ASCENDANT BLOCKING

If **Father exists**

```text
BLOCK:
- Paternal grandfather
- All siblings (full, paternal, maternal)
- All nephews
- All uncles
- All cousins
```

Else if **Paternal Grandfather exists**

```text
BLOCK:
- All nephews
- All uncles
- All cousins
```

4. — PARENTAL FEMALE BLOCKING

If **Mother exists**

```text
BLOCK:
- Maternal grandmother
- Paternal grandmother
```

Else if **Paternal Grandmother exists**

```text
BLOCK:
- Higher paternal grandmothers
```

Else if **Maternal Grandmother exists**

```text
BLOCK:
- Higher maternal grandmothers
```

5. — SIBLING HIERARCHY BLOCKING

If **Full Brother exists**

```text
BLOCK:
- Paternal brothers
- Paternal sisters
- All nephews (full & paternal)
- All uncles
- All cousins
```

Else if **Paternal Brother exists**

```text
BLOCK:
- All nephews
- All uncles
- All cousins
```

6. — SISTER CONDITIONS (SPECIAL)

If **Full Sister exists**

```text
BLOCK:
- Paternal sisters
```

📌 *Only applies when she is NOT in the 2/3 zone*

7. — NEPHEW HIERARCHY

If **Full Nephew exists**

```text
BLOCK:
- Paternal nephew
- All uncles
- All cousins
```

Else if **Paternal Nephew exists**

```text
BLOCK:
- All uncles
- All cousins
```

8. — UNCLE HIERARCHY

If **Full Paternal Uncle exists**

```text
BLOCK:
- Paternal paternal uncle
- All cousins
```

Else if **Paternal Paternal Uncle exists**

```text
BLOCK:
- All cousins
```

9. — COUSIN HIERARCHY

Apply **closest male wins**:

```text
Full cousin blocks paternal cousin
Closer generation blocks farther generation
```

10. — MATERNAL SIBLINGS (WEAK LINE)

If **Father OR Son OR Grandson exists**

```text
BLOCK:
- Maternal brothers
- Maternal sisters
```

11. — FEMALE-ONLY DESCENDANT RULE

```text
Female descendants do NOT extend inheritance to their children
```

➡ Daughter’s children are always blocked.

12. — 2/3 ZONE OVERRIDE (IMPORTANT)

If any of the following females are **in 2/3 zone**:

```text
Daughter
Granddaughter (son’s)
Full sister
Paternal sister
```

Then:

```text
They CANNOT block anyone
```

Blocking resumes only when:

```text
Male of same class exists
```

13. — FINAL CLEANUP

```text
Remove anyone marked BLOCKED
Return remaining heirs list
```

🧩 VISUAL SUMMARY

```text
Descendants
 ↓
Ascendants
 ↓
Siblings
 ↓
Nephews
 ↓
Uncles
 ↓
Cousins
 ↓
Maternal line (weakest)
```

---