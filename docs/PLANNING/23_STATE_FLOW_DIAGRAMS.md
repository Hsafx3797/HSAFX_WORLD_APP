# 23 — State Flow Diagrams

**Project:** HSAFX WORLD (MacroApps)  
**Version:** 1.0  
**Last Updated:** January 4, 2026  
**Status:** ✅ APPROVED — State Flow Diagrams v1 Locked

> **⚠️ Change Control Note**  
> Any modification to this document requires review of:  
> `14_API_CONTRACTS`, `21_BILLING_LOGIC`, and `15_SECURITY_MODEL`.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication Flows](#2-authentication-flows)
3. [Subscription Lifecycle](#3-subscription-lifecycle)
4. [Coin Transaction Flows](#4-coin-transaction-flows)
5. [Tool Execution Flow](#5-tool-execution-flow)
6. [File Processing Flow](#6-file-processing-flow)
7. [Admin Impersonation Flow](#7-admin-impersonation-flow)
8. [Webhook Processing Flow](#8-webhook-processing-flow)
9. [Error & Recovery Flows](#9-error--recovery-flows)

---

## 1. Overview

### 1.1 Purpose

This document visualizes critical state transitions and data flows in HSAFX WORLD. Each diagram represents a **production-grade flow** with error paths, retry logic, and failure modes.

### 1.2 Diagram Conventions

| Symbol | Meaning |
|--------|---------|
| `[State]` | Stable state (can persist) |
| `(Action)` | Transient action/decision |
| `──▶` | Happy path transition |
| `--▶` | Error/alternate path |
| `⚡` | Async/background process |
| `🔒` | Security checkpoint |
| `💰` | Billing-related |

---

## 2. Authentication Flows

### 2.1 Email/Password Login

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EMAIL/PASSWORD LOGIN FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

                              [Unauthenticated]
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │  Submit Credentials   │
                         │  (email + password)   │
                         └───────────┬───────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
       ┌─────────────────────┐  ┌────────────────┐  ┌────────────────────┐
       │ Rate Limit Exceeded │  │ User Not Found │  │ Password Incorrect │
       └───────────┬─────────┘  └───┬────────────┘  └──────┬─────────────┘
                   │                │                      │
                   │                └────────┬─────────────┘
                   │                         │
                   │                         ▼
                   │              ┌──────────────────────┐
                   │              │ Return SAME error    │
                   │              │ (prevent enumeration)│
                   │              └──────────┬───────────┘
                   │                         │
                   ▼                         ▼
          [Locked 15min]            [Increment Fail Count]
                   │                         │
                   │      ┌──────────────────┤
                   │      │                  │
                   │      ▼                  ▼
                   │  fail < 5          fail >= 5
                   │      │                  │
                   │      │                  ▼
                   │      │         ┌──────────────┐
                   │      │         │ Show CAPTCHA │
                   │      │         └────────┬─────┘
                   │      │                  │
                   └──────┴────────▶ [Retry Login]
                                           
                                     │ (success)
                                     ▼
                         ┌───────────────────────┐
                         │ 🔒 Check 2FA Required │
                         └───────────┬───────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼                                 ▼
              [2FA Enabled]                    [2FA Disabled]
                    │                                 │
                    ▼                                 │
         ┌───────────────────┐                        │
         │ Verify TOTP/SMS   │                        │
         └─────────┬─────────┘                        │
                   │                                  │
                   ├────────▶ [2FA Failed] ─────▶ [Retry]
                   │                                 |
                   ▼                                 |
         ┌───────────────────┐                       |
         │ Create Session    │◀──────────────────────┘
         │ (Redis + Cookie)  │
         └─────────┬─────────┘
                   │
                   ▼
         ┌──────────────────────────────┐
         │ Log Auth Event (audit trail) │
         └─────────┬────────────────────┘
                   │
                   ▼
              [Authenticated]
```

### 2.2 OAuth Login (Google/GitHub)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OAUTH LOGIN FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

[Unauthenticated]
       │
       ▼
┌─────────────────┐
│ Click "Sign in  │
│ with Google"    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Redirect to Provider                    │
│ (state token + PKCE challenge)          │
└────────────────────┬────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ User Authorizes App   │
         │ (on provider site)    │
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Callback with Authorization Code        │
│ 🔒 Verify state token (CSRF protection) │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
  [State Invalid]          [State Valid]
        │                         │
        ▼                         ▼
   [Error Page]          ┌──────────────────────────┐
                         │ Exchange Code for Tokens │
                         └────────┬─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Fetch User Info │
                         │ (email, name)   │
                         └────────┬────────┘
                                  │
                     ┌────────────┴────────────┐
                     │                         │
                     ▼                         ▼
            [Email Exists]              [New Email]
                     │                         │
        ┌────────────┴────────────┐            │
        │                         │            │
        ▼                         ▼            ▼
  [Same Provider]          [Different      ┌─────────────────┐
        │                   Provider]      │ Create Account  │
        ▼                       │          │ (auto-verify)   │
┌─────────────────┐             ▼          └────────┬────────┘
│ Link Account    │      ┌─────────────────┐        │
│ (if not linked) │      │ Prompt: "Log in │        │
└────────┬────────┘      │ with original   │        │
        │                │ provider"       │        │
        │                └────────┬────────┘        │
        │                         │                 │
        │                         ▼                 │
        │                  [Return to Login]        │
        │                                           │
        └─────────────────────────┬─────────────────┘
                                  │
                                  ▼
                         ┌────────────────┐
                         │ Create Session │
                         └────────┬───────┘
                                  │
                                  ▼
                           [Authenticated]
```

### 2.3 API Key Authentication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       API KEY AUTHENTICATION FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

[API Request Received]
         │
         ▼
┌──────────────────────────────────────┐
│ Extract Bearer Token                 │
│ Authorization: Bearer hsafx_prod_xxx │
└────────────────────┬─────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
  [No Token]               [Token Present]
        │                         │
        ▼                         ▼
   [401 Unauthorized]    ┌───────────────┐
                         │ 🔒 Hash Token │
                         │ (SHA-256)     │
                         └────────┬──────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Lookup by Hash  │
                         │ in api_keys     │
                         └────────┬────────┘
                                  │
                     ┌────────────┴────────────┐
                     │                         │
                     ▼                         ▼
              [Not Found]               [Key Found]
                     │                         │
                     ▼                         ▼
              [401 Invalid]          ┌─────────────────┐
                                     │ Check Revoked   │
                                     │ Check Expired   │
                                     └────────┬────────┘
                                              │
                                 ┌────────────┴────────────┐
                                 │                         │
                                 ▼                         ▼
                        [Revoked/Expired]               [Valid]
                                 │                         │
                                 ▼                         ▼
                          [401 Expired]          ┌─────────────────┐
                                                 │ Check Rate Limit│
                                                 │ (per-key limit) │
                                                 └────────┬────────┘
                                                          │
                                            ┌─────────────┴─────────────┐
                                            │                           │
                                            ▼                           ▼
                                    [Limit Exceeded]              [Under Limit]
                                            │                           │
                                            ▼                           ▼
                                     [429 Rate Limited]         ┌─────────────┐
                                                                │ Load User   │
                                                                │ Context     │
                                                                └──────┬──────┘
                                                                       │
                                                                       ▼
                                                                ┌─────────────────────────┐
                                                                │ 🔒 Check API Key Scopes │
                                                                └──────┬──────────────────┘
                                                                       │
                                                          ┌────────────┴────────────┐
                                                          │                         │
                                                          ▼                         ▼
                                                   [Scope Denied]            [Scope Allowed]
                                                          │                         │
                                                          ▼                         ▼
                                                   [403 Forbidden]          [Request Authorized]
```

---

## 3. Subscription Lifecycle

### 3.1 Subscription State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SUBSCRIPTION STATE MACHINE                             │
│                                                                             │
│  Legend: Status is DERIVED, never stored. These represent logical states.   │
│                                                                             │
│  ⚠️ INVARIANT: `EXPIRED` is a transient derived state used for downgrade    │
│  logic only; enforcement treats users as `NO_SUB (Free)` once expired.      │
└─────────────────────────────────────────────────────────────────────────────┘

                                ┌─────────────┐
                                │   NO_SUB    │ ◀─────────────────────────┐
                                │ (Free Plan) │                            │
                                └──────┬──────┘                            │
                                       │                                   │
                                       │ 💰 checkout.completed             │
                                       ▼                                   │
                         ┌─────────────────────────────┐                   │
                         │         TRIALING            │                   │
                         │  (trial_ends_at > now)      │                   │
                         └──────────────┬──────────────┘                   │
                                        │                                  │
               ┌────────────────────────┼────────────────────────┐         │
               │                        │                        │         │
               ▼                        ▼                        ▼         │
    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
    │ Trial Expires    │    │ First Payment    │    │ User Cancels     │   │
    │ No Payment       │    │ Succeeds         │    │ During Trial     │   │
    └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘   │
             │                       │                       │             │
             ▼                       ▼                       │             │
      [EXPIRED] ─────────────▶ ┌──────────────────┐          │            │
             │                 │      ACTIVE      │          │            │
             │                 │ (current_period  │          │            │
             │                 │  _end > now)     │          │            │
             │                 └────────┬─────────┘          │            │
             │                          │                    │            │
             │         ┌────────────────┼────────────────┐   │            │
             │         │                │                │   │            │
             │         ▼                ▼                ▼   │            │
             │  ┌────────────┐  ┌────────────┐  ┌────────────┴───┐        │
             │  │ Payment    │  │ User Clicks│  │ Immediate      │        │
             │  │ Fails      │  │ "Cancel"   │  │ Cancel         │        │
             │  └─────┬──────┘  └─────┬──────┘  └────────┬───────┘        │
             │        │               │                  │                │
             │        ▼               ▼                  ▼                │
             │  ┌──────────┐  ┌───────────────┐  ┌──────────────┐         │
             │  │ PAST_DUE │  │ ACTIVE_       │  │  CANCELED    │         │
             │  │ (grace   │  │ CANCELING     │  │  (mid-period)│         │
             │  │ period)  │  │ (until period │  └───────┬──────┘         │
             │  └────┬─────┘  │  end)         │          │                │
             │       │        └───────┬───────┘          │                │
             │       │                │                  │                │
             │       │    ┌───────────┴───────────┐      │                │
             │       │    │                       │      │                │
             │       │    ▼                       ▼      │                │
             │       │ [Period Ends]      [User Reactivates]              │
             │       │    │                       │      │                │
             │       │    │                       │      │                │
             │       │    │        ┌──────────────┘      │                │
             │       │    │        │                     │                │
             │       │    │        ▼                     │                │
             │       │    │   [ACTIVE] ◀─────────────────┤                │
             │       │    │        │                     │                │
             │       │    ▼        │                     │                │
             │       │ ┌──────────────────┐              │                │
             │       │ │     EXPIRED      │◀─────────────┘                │
             │       │ └────────┬─────────┘                               │
             │       │          │                                         │
             │       └──────────┴─────────────────────────────────────────┘
             │                  │
             │                  │ (returns to Free plan)
             └──────────────────┴─────────────────────────────────────────▶
```

### 3.2 Plan Upgrade Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PLAN UPGRADE FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

[User on Free/Pro Plan]
         │
         ▼
┌─────────────────┐
│ Click "Upgrade" │
│ (select plan)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ 💰 Create Polar Checkout Session        │
│ • productPriceId (new plan)             │
│ • metadata: { userId, fromPlan, toPlan }│
└────────────────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Redirect to Polar Checkout              │
│ (Polar handles payment + tax)           │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
  [User Cancels]           [User Pays]
        │                         │
        ▼                         ▼
  [Return to App]         ┌──────────────────┐
  [No Change]             │ ⚡ Polar Webhook │
                          │ subscription.    │
                          │ created/updated  │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │ 🔒 Verify       │
                          │ Webhook Sig     │
                          └────────┬────────┘
                                   │
                                   ▼
                          ┌─────────────────────────────────┐
                          │ Update Local Subscription       │
                          │ • polar_subscription_id         │
                          │ • plan_code (pro/advance)       │
                          │ • current_period_start/end      │
                          │ • proration handled by Polar    │
                          └────────────────┬────────────────┘
                                           │
                                           ▼
                          ┌─────────────────────────────────┐
                          │ Invalidate Cache                │
                          │ • Redis: user:{id}:plan         │
                          │ • Redis: user:{id}:limits       │
                          └────────────────┬────────────────┘
                                           │
                                           ▼
                                  [New Plan Active]
                                  [Immediate Access]
```

### 3.3 Plan Downgrade Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PLAN DOWNGRADE FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

[User on Pro/Advance Plan]
         │
         ▼
┌─────────────────────────────────────────┐
│ Click "Downgrade" or "Cancel"           │
│ (select target: lower plan or cancel)   │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
  [Downgrade to              [Cancel
   Lower Plan]                Subscription]
        │                         │
        ▼                         ▼
┌─────────────────┐      ┌─────────────────┐
│ Schedule Change │      │ Set cancel_at_  │
│ at Period End   │      │ period_end=true │
└────────┬────────┘      └────────┬────────┘
         │                        │
         └────────────┬───────────┘
                      │
                      ▼
             ┌─────────────────────────────────┐
             │ Status: ACTIVE_CANCELING        │
             │ (full access until period end)  │
             └────────────────┬────────────────┘
                              │
                              ▼
             ┌─────────────────────────────────┐
             │ Show UI Warning:                │
             │ "Access ends on [date]"         │
             │ "Reactivate anytime before"     │
             └────────────────┬────────────────┘
                              │
                              │ ⚡ At Period End
                              ▼
             ┌─────────────────────────────────┐
             │ ⚡ Polar Webhook:               │
             │ subscription.canceled           │
             └────────────────┬────────────────┘
                              │
                              ▼
             ┌─────────────────────────────────┐
             │ Apply Downgrade Rules:          │
             │ • Keep user data (no deletion)  │
             │ • Enforce new limits            │
             │ • Revoke API keys (if to Free)  │
             │ • Keep coins (they paid)        │
             └────────────────┬────────────────┘
                              │
                              ▼
                     [New Plan Active]
                     [Lower Limits Apply]
```

---

## 4. Coin Transaction Flows

### 4.1 Coin Purchase Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COIN PURCHASE FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

[User Wants Coins]
         │
         ▼
┌────────────────────────────┐
│ Select Coin Pack (500-10K) │
└────────┬───────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 🔒 Check: User not in dispute freeze │
└────────────────────┬─────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
  [Frozen]                 [Not Frozen]
        │                         │
        ▼                         ▼
  [403 Account             ┌───────────────────────────────────┐
   Frozen]                 │ 💰 Create Stripe Checkout Session │
                           └────────┬──────────────────────────┘
                                    │
                                    ▼
                           ┌──────────────────────────────┐
                           │ Metadata:                    │
                           │ • userId                     │
                           │ • packId, packCode           │
                           │ • coinsTotal (coins + bonus) │
                           └────────────────┬─────────────┘
                                            │
                                            ▼
                           ┌─────────────────────────────┐
                           │ Redirect to Stripe Checkout │
                           └────────────────┬────────────┘
                                            │
                               ┌────────────┴────────────┐
                               │                         │
                               ▼                         ▼
                        [User Cancels]            [User Pays]
                               │                         │
                               ▼                         ▼
                        [Return to App]           ┌──────────────────┐
                                                  │ ⚡ Stripe Webhook│
                                                  │ checkout.session │
                                                  │ .completed       │
                                                  └────────┬─────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │ 🔒 Idempotency  │
                                                  │ Check event.id  │
                                                  └────────┬────────┘
                                                           │
                                              ┌────────────┴────────────┐
                                              │                         │
                                              ▼                         ▼
                                       [Already                  [New Event]
                                        Processed]                      │
                                              │                         ▼
                                              ▼                ┌───────────────────┐
                                         [Return 200]          │ BEGIN TRANSACTION │
                                                               └────────┬──────────┘
                                                                        │
                                                                        ▼
                                                               ┌──────────────────────────┐
                                                               │ INSERT coin_transaction  │
                                                               │ (+coins, type: purchase) │
                                                               └────────┬─────────────────┘
                                                                        │
                                                                        ▼
                                                               ┌─────────────────────────┐
                                                               │ INSERT coin_transaction │
                                                               │ (+bonus, type: bonus)   │
                                                               └────────┬────────────────┘
                                                                        │
                                                                        ▼
                                                               ┌─────────────────┐
                                                               │ UPDATE wallet   │
                                                               │ cache (balance) │
                                                               └────────┬────────┘
                                                                        │
                                                                        ▼
                                                                    ┌────────┐
                                                                    │ COMMIT │
                                                                    └───┬────┘
                                                                        │
                                                                        ▼
                                                               [Coins Available]
```

### 4.2 Coin Deduction Flow (Tool Usage)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       COIN DEDUCTION FLOW                                   │
│                                                                             │
│  ⚠️ INVARIANT: Tool execution MUST only begin after successful coin        │
│  deduction COMMIT; job retries never re-run deduction if idempotency        │
│  key exists.                                                                │
└─────────────────────────────────────────────────────────────────────────────┘

[Tool Execution Request]
         │
         ▼
┌────────────────────────┐
│ Check Plan Usage Limit │
└────────────────────┬───┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
  [Under Limit]            [Limit Exceeded]
        │                         │
        ▼                         ▼
  [Execute Free]           ┌────────────────────┐
        │                  │ Get Tool Coin Cost │
        │                  └────────┬───────────┘
        │                           │
        │              ┌────────────┴────────────┐
        │              │                         │
        │              ▼                         ▼
        │       [No Coin Option]          [Has Coin Cost]
        │              │                         │
        │              ▼                         ▼
        │        [403 Limit              ┌────────────────────┐
        │         Exceeded]              │ Check Coin Balance │
        │                                └────────┬───────────┘
        │                                         │
        │                            ┌────────────┴────────────┐
        │                            │                         │
        │                            ▼                         ▼
        │                    [Insufficient]              [Sufficient]
        │                            │                         │
        │                            ▼                         ▼
        │                    ┌─────────────────┐      ┌─────────────────┐
        │                    │ Return:         │      │ Prompt User:    │
        │                    │ canPayWithCoins │      │ "Use X coins?"  │
        │                    │ = false         │      └────────┬────────┘
        │                    │ coinCost        │               │
        │                    │ upgradeRequired │      ┌────────┴────────┐
        │                    └─────────────────┘      │                 │
        │                                             ▼                 ▼
        │                                       [Decline]         [Accept]
        │                                             │                 │
        │                                             ▼                 ▼
        │                                       [403 Limit]      ┌────────────────────────┐
        │                                                        │ 💰 deductCoins()       │
        │                                                        │ (with idempotency key) │
        │                                                        └────────┬───────────────┘
        │                                                                 │
        │                                                                 ▼
        │                                                        ┌────────────────────────────────┐
        │                                                        │ BEGIN TRANSACTION              │
        │                                                        │ SELECT ... FOR UPDATE (wallet) │
        │                                                        └────────┬───────────────────────┘
        │                                                                 │
        │                                                                 ▼
        │                                                        ┌──────────────────────────────────┐
        │                                                        │ Check Idempotency                │
        │                                                        │ (already deducted for this key?) │
        │                                                        └────────┬─────────────────────────┘
        │                                                                 │
        │                                                    ┌────────────┴────────────┐
        │                                                    │                         │
        │                                                    ▼                         ▼
        │                                             [Already Done]             [New Deduction]
        │                                                    │                         │
        │                                                    ▼                         ▼
        │                                        [Return cached result]       ┌────────────────────────┐
        │                                                                     │ INSERT coin_txn        │
        │                                                                     │ (-amount, type: spend) │
        │                                                                     └────────┬───────────────┘
        │                                                                              │
        │                                                                              ▼
        │                                                                     ┌──────────────────────┐
        │                                                                     │ UPDATE wallet COMMIT │
        │                                                                     └────────┬─────────────┘
        │                                                                              │
        └──────────────────────────────────────────────────────────────────────────────┤
                                                                                       │
                                                                                       ▼
                                                                              [Execute Tool]
```

---

## 5. Tool Execution Flow

### 5.1 Client-Side Tool (WASM)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE TOOL EXECUTION (WASM)                        │
└─────────────────────────────────────────────────────────────────────────────┘

[User Selects Tool]
         │
         ▼
┌─────────────────────────────────────────┐
│ Load Tool Metadata                      │
│ (execution_type: 'wasm')                │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ 🔒 Check Access (tRPC call)             │
│ • Plan feature gate                     │
│ • Usage limit                           │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
  [Access Denied]           [Access Granted]
        │                         │
        ▼                         ▼
  [Show Upgrade          ┌─────────────────────────────────┐
   Prompt]               │ Load WASM Module (lazy, cached) │
                         └────────┬────────────────────────┘
                                  │
                                  ▼
                         ┌───────────────────────────┐
                         │ User Inputs Data (client) │
                         └────────┬──────────────────┘
                                  │
                                  ▼
                         ┌────────────────────────────┐
                         │ Execute in WASM            │
                         │ • Runs entirely in browser │
                         │ • No server roundtrip      │
                         │ • Data never leaves client │
                         └────────────────┬───────────┘
                                          │
                                          ▼
                         ┌───────────────────────────────────┐
                         │ ⚡ Background: Log Usage          │
                         │ (tRPC mutation, fire-and-forget)  │
                         │ • Increment usage counter         │
                         │ • Analytics event                 │
                         │                                   │
                         │ ⚠️ Best-effort: if logging fails, │
                         │ limits enforced server-side on    │
                         │ next authenticated action.        │
                         └────────────────┬──────────────────┘
                                          │
                                          ▼
                                   [Display Result]
                                   [Download Option]
```

### 5.2 Server-Side Tool (API/FastAPI)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   SERVER-SIDE TOOL EXECUTION (API)                          │
└─────────────────────────────────────────────────────────────────────────────┘

[User Selects Tool]
         │
         ▼
┌────────────────────────────────────────────┐
│ Load Tool Metadata (execution_type: 'api') │
└────────────────────┬───────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│ 🔒 Check Access + Limits (same as WASM flow) │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────┐
│ User Inputs Data                    │
│ • Text input, OR                    │
│ • File upload to R2 (presigned URL) │
└────────────────────┬────────────────┘
                     │
                     ▼
┌──────────────────────────────────────┐
│ Submit Job (tRPC mutation)           │
│ • Create job record (status: queued) │
│ • Return job_id                      │
└────────────────────┬─────────────────┘
                     │
                     ▼
┌───────────────────────────────────────┐
│ ⚡ Inngest: Dispatch to FastAPI       │
│ • HMAC-signed request                 │
│ • Includes: job_id, input_url, params │
└────────────────────┬──────────────────┘
                     │
                     ▼
┌───────────────────────────────────┐
│ FastAPI Processing                │
│ • Download input from R2          │
│ • Execute tool logic              │
│ • Upload output to R2             │
│ • Callback to Next.js with result │
└────────────────────┬──────────────┘
                     │
                     ▼
┌────────────────────────────────┐
│ Update Job Status              │
│ • status: completed/failed     │
│ • output_url or error_message  │
└────────────────────┬───────────┘
                     │
                     ▼
┌──────────────────────────────┐
│ Client Polling / SSE         │
│ • Show progress              │
│ • Display result when ready  │
└────────────────────┬─────────┘
                     │
                     ▼
              [Result Available]
              [Download from R2]
```

---

## 6. File Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FILE PROCESSING FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

[User Selects File]
         │
         ▼
┌────────────────────────────────┐
│ Client-Side Validation         │
│ • File size (max 50MB default) │
│ • Extension allowlist          │
└────────────────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
    [Invalid]                  [Valid]
        │                         │
        ▼                         ▼
  [Show Error]             ┌─────────────────────────────────────┐
                           │ Request Presigned Upload URL (tRPC) │
                           └────────┬────────────────────────────┘
                                    │
                                    ▼
                           ┌───────────────────────────────┐
                           │ 🔒 Server Validates:          │
                           │ • User authenticated          │
                           │ • File size within plan limit │
                           │ • Storage quota not exceeded  │
                           └────────────────┬──────────────┘
                                            │
                               ┌────────────┴────────────┐
                               │                         │
                               ▼                         ▼
                        [Quota Exceeded]           [Quota OK]
                               │                         │
                               ▼                         ▼
                        [403 + Upgrade          ┌────────────────────┐
                         Prompt]                │ Generate Presigned │
                                                │ URL (R2, 15min)    │
                                                └────────┬───────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ Client: PUT to  │
                                                │ Presigned URL   │
                                                │ (direct to R2)  │
                                                └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────────────────────┐
                                                │ 🔒 Server-Side Revalidation     │
                                                │ • Magic bytes (MIME)            │
                                                │ • Virus scan (see 15_SECURITY   │
                                                │   triggers: retention >24h,     │
                                                │   shareable, or executable)     │
                                                │ • Create file_uploads record    │
                                                └────────────────┬────────────────┘
                                                                 │
                                                    ┌────────────┴────────────┐
                                                    │                         │
                                                    ▼                         ▼
                                             [Scan Failed]              [Scan Passed]
                                                    │                         │
                                                    ▼                         ▼
                                             ┌─────────────────┐      ┌─────────────────┐
                                             │ Delete from R2  │      │ File Ready      │
                                             │ Notify User     │      │ for Processing  │
                                             └─────────────────┘      └─────────────────┘
```

---

## 7. Admin Impersonation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ADMIN IMPERSONATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

[Admin Logged In]
         │
         ▼
┌─────────────────────────────────────────┐
│ Search for User                         │
│ (by email, ID, or name)                 │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Click "Impersonate"                     │
│ Enter Reason (mandatory)                │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ 🔒 Permission Check                     │
│ • Has admin:impersonate permission?     │
│ • Target is not an admin?               │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
  [Denied]                 [Allowed]
        │                         │
        ▼                         ▼
  [403 Error]             ┌──────────────────────────────┐
                          │ Create Impersonation Context │
                          │ • expiresAt: +1h             │
                          │ • allowedActions             │
                          └────────┬─────────────────────┘
                                   │
                                   ▼
                          ┌─────────────────────┐
                          │ Audit Log:          │
                          │ impersonation_start │
                          └────────┬────────────┘
                                   │
                                   ▼
                          ┌─────────────────────────────────┐
                          │ UI Shows:                       │
                          │ • Banner: "Viewing as [user]"   │
                          │ • Timer: "Expires in XX:XX"     │
                          │ • Button: "Stop Impersonation"  │
                          └────────────────┬────────────────┘
                                           │
                                           ▼
                          ┌──────────────────────────┐
                          │ Admin Performs Actions   │
                          │ (scoped to allowed list) │
                          └────────────────┬─────────┘
                                           │
               ┌───────────────────────────┼───────────────────────────┐
               │                           │                           │
               ▼                           ▼                           ▼
        [Action Allowed]          [Action Blocked]              [Time Expires]
               │                           │                           │
               ▼                           ▼                           ▼
        ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
        │ Execute +       │        │ 403 "Action not │        │ Auto-Terminate  │
        │ Log with        │        │ allowed during  │        │ Impersonation   │
        │ impersonation   │        │ impersonation"  │        └────────┬────────┘
        │ context         │        └─────────────────┘                 │
        └─────────────────┘                                            │
               │                                                       │
               │                      ┌────────────────────────────────┘
               │                      │
               │           [OR: Click "Stop Impersonation"]
               │                      │
               └──────────────────────┼──────────────────────────────────────┐
                                      │                                      │
                                      ▼                                      │
                             ┌───────────────────┐                           │
                             │ Clear Context     │                           │
                             │ Audit Log:        │                           │
                             │ impersonation_end │                           │
                             └────────┬──────────┘                           │
                                      │                                      │
                                      ▼                                      │
                             [Return to Admin Session]                       │
                                      ▲                                      │
                                      └──────────────────────────────────────┘
```

---

## 8. Webhook Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       WEBHOOK PROCESSING FLOW                               │
│                                                                             │
│  ⚠️ INVARIANT: All side effects for a webhook event execute in a single    │
│  transaction to guarantee atomicity.                                        │
└─────────────────────────────────────────────────────────────────────────────┘

[Webhook Request Received]
         │
         ▼
┌─────────────────────────────────────────┐
│ 🔒 Signature Verification               │
│ • Extract signature header              │
│ • Extract timestamp                     │
│ • HMAC-SHA256 verify                    │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
  [Invalid Sig]             [Valid Sig]
        │                         │
        ▼                         ▼
  [401 + Alert]            ┌─────────────────┐
                           │ Timestamp Check │
                           │ (< 5 min old)   │
                           └────────┬────────┘
                                    │
                               ┌────┴────┐
                               │         │
                               ▼         ▼
                         [Too Old]  [Fresh]
                               │         │
                               ▼         ▼
                         [401 +    ┌─────────────────┐
                          Alert]   │ Parse Event     │
                                   │ (type, id, data)│
                                   └────────┬────────┘
                                            │
                                            ▼
                                   ┌─────────────────────────────────┐
                                   │ 🔒 Idempotency Check            │
                                   │ SELECT FROM processed_webhooks  │
                                   │ WHERE event_id = ?              │
                                   └────────────────┬────────────────┘
                                                    │
                                       ┌────────────┴────────────┐
                                       │                         │
                                       ▼                         ▼
                                [Already Seen]              [New Event]
                                       │                         │
                                       ▼                         ▼
                                [200 OK                   ┌──────────────────┐
                                 (no-op)]                 │ BEGIN TRANSACTION│
                                                          └────────┬─────────┘
                                                                   │
                                                                   ▼
                                                          ┌─────────────────┐
                                                          │ INSERT INTO     │
                                                          │ processed_      │
                                                          │ webhooks        │
                                                          │ (blocks race)   │
                                                          └────────┬────────┘
                                                                   │
                                                                   ▼
                                                          ┌─────────────────┐
                                                          │ Route to Handler│
                                                          │ by event.type   │
                                                          └────────┬────────┘
                                                                   │
                                              ┌────────────────────┼────────────────────┐
                                              │                    │                    │
                                              ▼                    ▼                    ▼
                                      [subscription.*]      [checkout.*]         [charge.*]
                                              │                    │                    │
                                              ▼                    ▼                    ▼
                                      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
                                      │ Update Sub  │      │ Credit Coins│      │ Handle      │
                                      │ Record      │      │ to Wallet   │      │ Refund/     │
                                      └──────┬──────┘      └──────┬──────┘      │ Dispute     │
                                             │                    │             └──────┬──────┘
                                             │                    │                    │
                                             └────────────────────┼────────────────────┘
                                                                  │
                                                                  ▼
                                                          ┌─────────────────┐
                                                          │ COMMIT          │
                                                          └────────┬────────┘
                                                                   │
                                                                   ▼
                                                                [200 OK]
```

---

## 9. Error & Recovery Flows

### 9.1 Payment Failure Recovery

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PAYMENT FAILURE RECOVERY                               │
└─────────────────────────────────────────────────────────────────────────────┘

[Payment Fails]
(Polar webhook: subscription.past_due)
         │
         ▼
┌─────────────────────────────────────────┐
│ Update Local State:                     │
│ • Mark subscription as past_due         │
│ • Record failure timestamp              │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Start 3-Day Grace Period                │
│ • User keeps full access                │
│ • Daily reminder emails                 │
└────────────────────────────────┬────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
   [Day 1]                    [Day 2]                 [Day 3]
         │                       │                       │
         ▼                       ▼                       ▼
  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
  │ Email:      │        │ Email:      │        │ Email:      │
  │ "Payment    │        │ "Reminder:  │        │ "Final:     │
  │ failed"     │        │ Update      │        │ Access ends │
  │             │        │ payment"    │        │ tomorrow"   │
  └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
         │                      │                      │
         └──────────────────────┴──────────────────────┘
                                │
               ┌────────────────┼────────────────┐
               │                │                │
               ▼                ▼                ▼
        [User Updates    [Polar Retries   [Grace Period
         Payment]         (auto)]          Ends]
               │                │                │
               ▼                ▼                ▼
        ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
        │ Payment     │  │ Payment     │  │ Downgrade   │
        │ Succeeds    │  │ Succeeds    │  │ to Free     │
        └──────┬──────┘  └──────┬──────┘  │ • Keep data │
               │                │         │ • Enforce   │
               └────────┬───────┘         │   limits    │
                        │                 │ • Revoke    │
                        ▼                 │   API keys  │
                 [Status: ACTIVE]         └──────┬──────┘
                 [Full Access                    │
                  Restored]                      ▼
                                          [Status: EXPIRED]
                                          [Free Plan Limits]
```

### 9.2 Wallet Reconciliation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WALLET RECONCILIATION FLOW                              │
│                        (Daily Job @ 02:00 UTC)                              │
└─────────────────────────────────────────────────────────────────────────────┘

[Cron Trigger]
         │
         ▼
┌─────────────────────────────────────────┐
│ SELECT all user_coin_wallets            │
└────────────────────┬────────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │ For Each Wallet│
            └────────┬───────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Calculate True Balance:                 │
│ SELECT SUM(amount)                      │
│ FROM coin_transactions                  │
│ WHERE user_id = ?                       │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Compare: wallet.balance vs ledger_sum   │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   [Match]                   [Drift]
        │                         │
        ▼                         ▼
   [Next                  ┌─────────────────┐
    Wallet]               │ Calculate Delta │
                          │ drift = cached  │
                          │        - actual │
                          └────────┬────────┘
                                   │
                          ┌────────┴────────┐
                          │                 │
                          ▼                 ▼
                   [Minor Drift]      [Major Drift]
                   (< 100 coins)      (>= 100 coins)
                          │                 │
                          ▼                 ▼
                   ┌─────────────┐  ┌──────────────────┐
                   │ Auto-Fix    │  │ Auto-Fix +       │
                   │ UPDATE      │  │ Alert Admin      │
                   │ wallet.     │  │ (Slack/PagerDuty)│
                   │ balance     │  │                  │
                   │             │  │ ⚠️ Alert only;   │
                   │             │  │ no auto-suspend  │
                   │             │  │ without manual   │
                   │             │  │ review           │
                   └──────┬──────┘  └────────┬─────────┘
                          │                  │
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │ Log:            │
                          │ • user_id       │
                          │ • cached_balance│
                          │ • actual_balance│
                          │ • drift         │
                          └────────┬────────┘
                                   │
                                   ▼
                            [Next Wallet]
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │ Generate Reconciliation Report│
                   │ • wallets_checked             │
                   │ • drifts_found                │
                   │ • drifts_fixed                │
                   │ • alerts_sent                 │
                   └───────────────────────────────┘
```

### 9.3 Anonymous Usage Cleanup Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  ANONYMOUS USAGE CLEANUP FLOW                               │
│                     (Daily Job @ 03:00 UTC)                                 │
└─────────────────────────────────────────────────────────────────────────────┘

[Cron Trigger: cleanup/expired-anonymous-usage]
         │
         ▼
┌─────────────────────────────────────────┐
│ Define Retention Policy:                │
│ • Keep last 90 days                     │
│ • Delete older records                  │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ SELECT COUNT(*) FROM anonymous_usage                             │
│ WHERE period_end < NOW() - INTERVAL '90 days' → old_record_count │
└────────────────────┬─────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   [0 records]              [N records]
        │                         │
        ▼                         ▼
   [Skip cleanup]     ┌─────────────────────────┐
   [Log: "No old      │ DELETE FROM             │
    records"]         │ anonymous_usage         │
                      │ WHERE period_end        │
                      │ < NOW() - INTERVAL      │
                      │ '90 days'               │
                      └───────────┬─────────────┘
                                  │
                                  ▼
                      ┌─────────────────────────┐
                      │ Log Cleanup Results:    │
                      │ • records_deleted: N    │
                      │ • retention_days: 90    │
                      │ • cleanup_duration_ms   │
                      └───────────┬─────────────┘
                                  │
                                  ▼
                      ┌─────────────────────────┐
                      │ Send Monitoring Event:  │
                      │ datadog.gauge(          │
                      │   'db.anonymous_usage   │
                      │   .cleanup.deleted', N) │
                      └─────────────────────────┘
```

**Retention Policy:**
- **Keep:** Last 90 days of anonymous usage data
- **Delete:** Records where `period_end < NOW() - INTERVAL '90 days'`
- **Frequency:** Daily @ 03:00 UTC (off-peak)
- **Monitoring:** Log deleted count, alert if count > 1M (indicates retention issue)

**Implementation Note:**  
Create Inngest function or use `background_jobs` table fallback if Inngest unavailable.

```typescript
// lib/inngest/functions/cleanup-anonymous-usage.ts
import { inngest } from '../client';
import { db } from '@/lib/db';
import { anonymous_usage } from '@/lib/db/schema';
import { lt, sql } from 'drizzle-orm';

export const cleanupAnonymousUsage = inngest.createFunction(
  { id: 'cleanup-anonymous-usage', name: 'Cleanup Anonymous Usage Data' },
  { cron: '0 3 * * *' }, // Daily at 3 AM UTC
  async ({ step }) => {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const result = await step.run('delete-old-records', async () => {
      const deleted = await db
        .delete(anonymous_usage)
        .where(lt(anonymous_usage.period_end, cutoffDate))
        .returning({ id: anonymous_usage.id });
      
      return { deleted: deleted.length, cutoffDate };
    });
    
    await step.run('log-results', async () => {
      console.log(`[Cleanup] Deleted ${result.deleted} anonymous_usage records older than ${result.cutoffDate}`);
      
      // Send to monitoring
      // datadog.gauge('db.anonymous_usage.cleanup.deleted', result.deleted);
    });
    
    return result;
  }
);
```

---

## Appendix A: State Enums Reference

| Entity | States | Derived? |
|--------|--------|----------|
| Subscription | trialing, active, active_canceling, past_due, canceled, expired | ✅ Yes |
| Payment | pending, paid, failed, refunded | ❌ Stored |
| Invoice | draft, open, partially_paid, paid, void, uncollectible | ❌ Stored |
| Job | queued, processing, completed, failed | ❌ Stored |
| File Upload | uploading, processing, ready, expired, deleted | ❌ Stored |

---

## Appendix B: Failure Mode Summary

| Flow | Failure | Recovery |
|------|---------|----------|
| Payment | Card declined | 3-day grace + retry + downgrade |
| Webhook | Missed delivery | Daily reconciliation job |
| Coin deduction | Concurrent race | FOR UPDATE lock |
| File upload | Virus detected | Delete + notify |
| Impersonation | Timeout | Auto-terminate, audit logged |
| WASM execution | OOM | Browser handles, graceful error |
| API job | Timeout | Mark failed, allow retry |

---

## Document Cross-References

| Document | Relevant Sections |
|----------|-------------------|
| [14_API_CONTRACTS](14_API_CONTRACTS.md) | Endpoint definitions |
| [21_BILLING_LOGIC](21_BILLING_LOGIC.md) | Payment/subscription logic |
| [15_SECURITY_MODEL](15_SECURITY_MODEL.md) | Auth flows, impersonation |
| [13_DATABASE_SCHEMA](13_DATABASE_SCHEMA.md) | State storage |

---

*This document visualizes critical flows in HSAFX WORLD. All diagrams represent production behavior.*