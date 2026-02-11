Below is a **clear, Shariah-compliant breakdown** of how a **Zakat Calculator** should work, **what inputs you need**, and **which formulas to apply**.

---

# 🕌 Zakat Calculator (According to Islamic Shariah)

## 1️⃣ Basic Conditions (Before Calculation)

Zakat is **obligatory** if **ALL** are true:

1. Muslim
2. Owner of wealth **above Nisab**
3. Wealth held for **1 lunar year (Hawl)**
   *(exception: crops, minerals, business stock—details later)*

---

## 2️⃣ Nisab Threshold (Minimum Wealth)

Zakat applies **only if Total Zakatable Wealth ≥ Nisab**

### Nisab Values:

* **Gold Nisab**: 87.48 grams of gold
* **Silver Nisab**: 612.36 grams of silver

📌 **Most scholars recommend using Silver Nisab** (more beneficial to poor)

```
Nisab = (Silver price per gram) × 612.36
```

---

## 3️⃣ Inputs Required (What User Should Enter)

### 🟢 A. Zakatable Assets

#### 1. Cash & Bank Balances

* Cash at home
* Bank account balances
* Digital wallets

```
cash_total
```

---

#### 2. Gold & Silver (Owned for savings, not personal use*)

* Gold (grams)
* Silver (grams)

```
gold_value = gold_grams × gold_price_per_gram
silver_value = silver_grams × silver_price_per_gram
```

⚠️ *Difference of opinion on jewelry in use — you may add a toggle.*

---

#### 3. Business Assets

* Inventory (at market value)
* Cash in business
* Receivables (expected to be paid)

```
business_assets
```

---

#### 4. Investments

* Stocks (Zakatable portion only)
* Mutual funds
* Crypto (treated like trade assets)

```
investments_value
```

---

#### 5. Money Owed to You (Receivable Debts)

* Loans given
* Salary due
* Rent due

```
receivable_debts
```

---

### 🔴 B. Deductible Liabilities (Short-Term Only)

You may subtract:

* Personal debts due within 1 year
* Bills due
* Rent due
* Loan installments (12 months only)

```
short_term_liabilities
```

---

## 4️⃣ Total Zakatable Wealth Formula

```
total_assets =
    cash_total
  + gold_value
  + silver_value
  + business_assets
  + investments_value
  + receivable_debts

net_zakatable_wealth =
    total_assets - short_term_liabilities
```

---

## 5️⃣ Check Nisab Condition

```
IF net_zakatable_wealth < nisab
    → Zakat = 0
ELSE
    → Zakat is obligatory
```

---

## 6️⃣ Zakat Calculation Formula (Main Rule)

### ⭐ Standard Zakat Rate:

```
Zakat = 2.5% = 1/40
```

### Formula:

```
zakat_amount = net_zakatable_wealth × 0.025
```

---

## 7️⃣ Special Zakat Rules (Optional Advanced Features)

### 🌾 Agricultural Produce

* **10%** → natural rain
* **5%** → artificial irrigation
  (No Hawl required)

---

### ⛏ Minerals / Treasure

* **20%** immediately (Khums)

---

### 🏠 Personal Use Assets (NO ZAKAT)

❌ House you live in
❌ Car for personal use
❌ Furniture, clothes
❌ Tools of profession

---

## 8️⃣ Example Calculation

### Example Inputs:

```
Cash = 500,000
Gold = 50g × 18,000 = 900,000
Business Assets = 300,000
Debts = 200,000
Nisab (silver) = 612.36 × 250 = 153,090
```

### Calculation:

```
Total Assets = 1,700,000
Net Wealth = 1,700,000 - 200,000 = 1,500,000

Zakat = 1,500,000 × 0.025 = 37,500
```

✅ **Zakat Payable: 37,500**

---

## 9️⃣ Recommended Inputs for Your SaaS UI

**Required**

* Cash
* Gold (grams)
* Silver (grams)
* Debts
* Gold/Silver price (auto-fetch)

**Optional (Advanced Mode)**

* Business assets
* Investments
* Receivables
* Jewelry usage toggle
* Nisab method (Gold / Silver)

---

## 10️⃣ Final Summary (One-Line Logic)

```
Zakat = (All Zakatable Assets − Short-Term Liabilities) × 2.5%
(Only if ≥ Nisab and held for 1 lunar year)
```
