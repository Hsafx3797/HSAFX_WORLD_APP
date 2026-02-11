# 🎯 Core Principle (Non-Negotiable)

> **Duration must be calculated in a single absolute time reference**
> (UTC / epoch time), **never directly between local times**.

Any system that subtracts
`local_end_datetime − local_start_datetime`
**without normalization is mathematically wrong**.

---

# 🧠 Mental Model

Think of **local date-time + time zone** as:

* A **label** for humans
* Not a real point in time

The **real point in time** is:

```
absolute_time = local_time − UTC_offset
```

Once both times are absolute → subtraction is trivial and correct.

---

# 🧩 Logical Components

## 1. Input Model (Canonical)

Each datetime input must be represented as:

```
{
  year,
  month,
  day,
  hour,
  minute,
  second,
  timezone_offset_minutes
}
```

Example:

### From

```
2026-01-10 02:22:00
UTC offset: +05:00 → +300 minutes
```

### To

```
2026-01-31 04:22:00
UTC offset: +04:00 → +240 minutes
```

---

## 2. Normalize Each Date-Time to UTC

### Rule

```
UTC_time = local_time − timezone_offset
```

### Apply to example

#### Start (PKT UTC+5)

```
Local: 2026-01-10 02:22:00
UTC:   2026-01-09 21:22:00
```

#### End (GST UTC+4)

```
Local: 2026-01-31 04:22:00
UTC:   2026-01-31 00:22:00
```

⚠️ This is the **step that timeanddate’s wrong example skipped**.

---

## 3. Convert UTC Date-Times to Absolute Scalar

You now need a **monotonic numeric value** for subtraction.

Two valid choices:

* Epoch seconds
* Total seconds since a fixed reference (e.g., year 0001)

Logically:

```
absolute_seconds = seconds_from_epoch(UTC_datetime)
```

You don’t subtract dates —
**you subtract numbers**.

---

## 4. Compute Raw Duration

```
duration_seconds =
  end_absolute_seconds − start_absolute_seconds
```

This value is now:

* Time-zone independent
* DST safe
* Mathematically correct

---

## 5. Decompose Duration into Human Units

Use **fixed unit conversion**, not calendar math.

```
1 day    = 86,400 seconds
1 hour   = 3,600 seconds
1 minute = 60 seconds
```

### Decomposition order

```
days    = floor(total_seconds / 86400)
remainder = total_seconds % 86400

hours   = floor(remainder / 3600)
remainder = remainder % 3600

minutes = floor(remainder / 60)
seconds = remainder % 60
```

---

## 6. Final Result (Correct)

Using the normalized UTC times:

```
2026-01-09 21:22:00
→
2026-01-31 00:22:00
```

Difference:

```
21 days
1 hour
0 minutes
0 seconds
```

✅ **Correct**
❌ **Not 2 hours**, because the time zones differ by **1 hour**.

---

# 🚫 Why the Wrong Result Happens

The incorrect logic is:

```
(31 Jan 04:22) − (10 Jan 02:22)
= 21 days, 2 hours
```

This assumes:

* Same time zone
* Same offset
* No normalization

Which is **logically invalid** for cross-zone calculations.

---

# 🧱 Mandatory Logical Rules (Hard Constraints)

Your system **must enforce**:

1. **Never subtract local times**
2. **Always normalize to UTC first**
3. **Use absolute numeric time for math**
4. **Apply time zone offset before subtraction**
5. **Only format after calculation**

If any rule is violated → results will be wrong.

---

# 🧠 Architecture Summary (Pure Logic Flow)

```
User Input
  ↓
Parse local datetime
  ↓
Apply timezone offset → UTC
  ↓
Convert to absolute seconds
  ↓
Subtract
  ↓
Decompose into days / hours / minutes / seconds
  ↓
Display
```

---

# 🧪 Validation Invariant (Important)

For any calculator you build:

```
duration(A → B)
==
duration(UTC(A) → UTC(B))
```

If this invariant fails — your math is broken.