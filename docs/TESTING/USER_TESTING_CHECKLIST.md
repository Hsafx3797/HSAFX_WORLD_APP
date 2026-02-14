# HSAFX WORLD — Comprehensive User Testing Checklist

> **Purpose**: Structured, exhaustive testing guide covering every feature, route, interaction, and edge case in the HSAFX WORLD application. Designed for systematic manual QA and automated bot-driven testing.
>
> **Scope**: Web app (29 pages), Admin app (22 pages), 446+ tools across 7 categories, dual billing (Stripe + Polar), 2 backend services, B2B API, complete auth system.
>
> **How to use**: Work through each section sequentially. Mark items `[x]` as they pass. For failures, note the issue with reproduction steps. Each section includes preconditions and expected results.

---

## Table of Contents

1. [Environment Setup & Prerequisites](#1-environment-setup--prerequisites)
2. [Registration & Account Creation](#2-registration--account-creation)
3. [Login & Authentication](#3-login--authentication)
4. [Two-Factor Authentication (2FA)](#4-two-factor-authentication-2fa)
5. [Password Management](#5-password-management)
6. [Session Management](#6-session-management)
7. [User Dashboard](#7-user-dashboard)
8. [Onboarding System](#8-onboarding-system)
9. [Navigation & Routing](#9-navigation--routing)
10. [Tool Discovery & Browsing](#10-tool-discovery--browsing)
11. [Tool Execution — Text Tools (191 tools)](#11-tool-execution--text-tools-191-tools)
12. [Tool Execution — Data Tools (106 tools)](#12-tool-execution--data-tools-106-tools)
13. [Tool Execution — Media Tools (83 tools)](#13-tool-execution--media-tools-83-tools)
14. [Tool Execution — Generator Tools (38 tools)](#14-tool-execution--generator-tools-38-tools)
15. [Tool Execution — Calculator Tools (9 tools)](#15-tool-execution--calculator-tools-9-tools)
16. [Tool Execution — Converter Tools (23 tools)](#16-tool-execution--converter-tools-23-tools)
17. [Tool Execution — Specialized Tools](#17-tool-execution--specialized-tools)
18. [Pro Trial System](#18-pro-trial-system)
19. [Coin Economy](#19-coin-economy)
20. [Billing & Subscriptions](#20-billing--subscriptions)
21. [Streak & Rewards System](#21-streak--rewards-system)
22. [Referral Program](#22-referral-program)
23. [Settings & Profile](#23-settings--profile)
24. [Theme System](#24-theme-system)
25. [API Key Management](#25-api-key-management)
26. [B2B API Endpoints](#26-b2b-api-endpoints)
27. [Notifications](#27-notifications)
28. [Command Palette (Ctrl+K)](#28-command-palette-ctrlk)
29. [Execution History & Re-run](#29-execution-history--re-run)
30. [Analytics Dashboard](#30-analytics-dashboard)
31. [GDPR & Data Export](#31-gdpr--data-export)
32. [Account Deletion](#32-account-deletion)
33. [Status Page](#33-status-page)
34. [Admin Panel — Authentication](#34-admin-panel--authentication)
35. [Admin Panel — Dashboard](#35-admin-panel--dashboard)
36. [Admin Panel — User Management](#36-admin-panel--user-management)
37. [Admin Panel — Tool Management](#37-admin-panel--tool-management)
38. [Admin Panel — Category Management](#38-admin-panel--category-management)
39. [Admin Panel — Plan & Billing Management](#39-admin-panel--plan--billing-management)
40. [Admin Panel — Feature Flags](#40-admin-panel--feature-flags)
41. [Admin Panel — Configuration](#41-admin-panel--configuration)
42. [Webhooks & Cron Jobs](#42-webhooks--cron-jobs)
43. [Accessibility (WCAG)](#43-accessibility-wcag)
44. [Responsive Design & Cross-Device](#44-responsive-design--cross-device)
45. [Performance & Loading](#45-performance--loading)
46. [Security Testing](#46-security-testing)
47. [Rate Limiting & Abuse Prevention](#47-rate-limiting--abuse-prevention)
48. [Feature Flags & Kill Switches](#48-feature-flags--kill-switches)
49. [Error Handling & Edge Cases](#49-error-handling--edge-cases)
50. [SEO & Meta Tags](#50-seo--meta-tags)
51. [Cross-Browser Compatibility](#51-cross-browser-compatibility)

---

## 1. Environment Setup & Prerequisites

**Before testing, ensure:**

- [ ] Node.js 20+ installed
- [ ] pnpm 9+ installed
- [ ] Python 3.11+ installed (for FastAPI backend)
- [ ] PostgreSQL database running (Neon or local)
- [ ] Redis running (Upstash or local)
- [ ] `.env` files configured for web, admin, and fastapi
- [ ] Run `pnpm install` → `pnpm db:generate` → `pnpm db:migrate` → `pnpm db:seed`
- [ ] Run `pnpm dev` — all services start (web :3000, admin :3001, fastapi :8000)
- [ ] Stripe CLI installed for webhook testing (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- [ ] At least one admin user seeded in the database

**Test accounts to prepare:**

| Account | Role | Plan | Purpose |
|---------|------|------|---------|
| `guest` | — | Guest | Unauthenticated user testing |
| `free@test.com` | user | Free | Free tier feature testing |
| `pro@test.com` | user | Pro | Pro tier feature testing |
| `advance@test.com` | user | Advance | Advance tier feature testing |
| `admin@test.com` | admin | — | Admin panel testing |
| `newuser@test.com` | — | — | Fresh registration flow testing |

---

## 2. Registration & Account Creation

### 2.1 Email/Password Registration

- [ ] Navigate to `/auth/signup`
- [ ] Verify form fields: name, email, password, confirm password
- [ ] Submit with all fields empty — expect validation errors on every field
- [ ] Submit with invalid email format (e.g., `notanemail`) — expect email validation error
- [ ] Submit with password shorter than minimum — expect password requirement error
- [ ] Verify **password strength meter** appears and updates in real-time as you type
- [ ] Verify strength meter shows requirements: length, uppercase, lowercase, number, special character
- [ ] Verify strength meter color reflects strength: red (weak) → yellow (fair) → green (strong)
- [ ] Submit with mismatched passwords — expect "Passwords do not match" error
- [ ] Submit with an already-registered email — expect "Email already in use" error
- [ ] Submit valid registration — expect success redirect
- [ ] Verify email verification message is displayed after registration
- [ ] Check inbox for verification email (Resend)
- [ ] Click verification link — expect email confirmed and redirect to dashboard
- [ ] Verify user can now log in with the registered credentials
- [ ] Verify new user gets initial coin balance (if applicable from welcome bonus)
- [ ] Verify `user` row created in DB with correct fields and `emailVerified` timestamp

### 2.2 OAuth Registration (Google)

- [ ] Click "Continue with Google" on signup page
- [ ] Complete Google OAuth consent flow
- [ ] Verify redirect back to app with authenticated session
- [ ] Verify user profile populated from Google (name, email, avatar)
- [ ] Verify `account` row created with `providerId: 'google'`
- [ ] Verify no email verification required for OAuth users

### 2.3 OAuth Registration (GitHub)

- [ ] Click "Continue with GitHub" on signup page
- [ ] Complete GitHub OAuth consent flow
- [ ] Verify redirect back to app with authenticated session
- [ ] Verify user profile populated from GitHub data
- [ ] Verify `account` row created with `providerId: 'github'`

### 2.4 OAuth Registration (Facebook/Meta)

- [ ] Click "Continue with Facebook" on signup page (if `enable_oauth_facebook` flag is ON)
- [ ] Complete Meta OAuth consent flow
- [ ] Verify redirect and account creation

### 2.5 Account Linking

- [ ] Register with email/password first
- [ ] Log out, then log in with Google OAuth using the SAME email
- [ ] Verify accounts are linked (not duplicated)
- [ ] Go to settings → verify both email and Google are listed as auth methods

### 2.6 Registration Edge Cases

- [ ] Try registering with an email that has an existing OAuth account — verify account linking prompt
- [ ] Try registering with leading/trailing whitespace in email — verify it's trimmed
- [ ] Try registering with uppercase email (e.g., `USER@Test.Com`) — verify case-insensitive matching
- [ ] Register with a very long name (200+ characters) — verify it's handled gracefully
- [ ] Register with unicode characters in name — verify display is correct
- [ ] Try registering when `kill_signups` feature flag is ON — expect signup blocked

### 2.7 Referral Registration

- [ ] Generate a referral link from an existing user's dashboard
- [ ] Open the referral link (`?ref=CODE`) in an incognito browser
- [ ] Complete registration through the referral link
- [ ] Verify the referral is tracked (referral appears as "pending" in referrer's stats)
- [ ] Use first tool as new user → verify referral status changes to "activated"
- [ ] Verify both referrer and new user receive bonus coins

---

## 3. Login & Authentication

### 3.1 Email/Password Login

- [ ] Navigate to `/auth/signin`
- [ ] Submit with empty fields — expect validation errors
- [ ] Submit with wrong email — expect generic "Invalid credentials" (not "User not found")
- [ ] Submit with wrong password — expect generic "Invalid credentials"
- [ ] Submit with correct credentials — expect redirect to `/dashboard`
- [ ] Verify session cookie is set (`__hsafx` prefix)
- [ ] Verify user avatar/name appears in header after login
- [ ] Verify dropdown menu shows: Dashboard, History, Coins, API Keys, Settings, Sign Out

### 3.2 OAuth Login

- [ ] Login with Google — verify authenticated redirect
- [ ] Login with GitHub — verify authenticated redirect
- [ ] Login with Facebook (if enabled) — verify authenticated redirect

### 3.3 Login Security

- [ ] Attempt 5+ rapid failed logins — verify rate limiting kicks in (5 attempts/min)
- [ ] Verify IP-based lockout after threshold failures
- [ ] After lockout, wait for cooldown — verify login works again
- [ ] Verify login from a new device triggers any security notifications

### 3.4 Session Behavior

- [ ] Close browser and reopen — verify session persists (7-day expiry)
- [ ] Verify session auto-refreshes on activity (1-hour rolling renewal)
- [ ] Open app in two browser tabs — verify both share the same session
- [ ] Verify inactive session expires after 7 days

### 3.5 Logout

- [ ] Click "Sign Out" from user dropdown
- [ ] Verify redirect to homepage
- [ ] Verify session cookie is cleared
- [ ] Verify cannot access `/dashboard` after logout — redirect to login
- [ ] Verify protected API calls return 401 after logout

### 3.6 Already Authenticated Redirect

- [ ] While logged in, navigate to `/auth/signin` — expect redirect to `/dashboard`
- [ ] While logged in, navigate to `/auth/signup` — expect redirect to `/dashboard`

---

## 4. Two-Factor Authentication (2FA)

### 4.1 Enable 2FA

- [ ] Go to `/settings/security`
- [ ] Click "Enable Two-Factor Authentication"
- [ ] Verify QR code is displayed (scannable by Authenticator app)
- [ ] Verify backup codes are shown (copy/download option)
- [ ] Scan QR code with Google Authenticator / Authy
- [ ] Enter valid TOTP code — verify 2FA is now enabled
- [ ] Verify "2FA Enabled" badge appears on security page

### 4.2 Login with 2FA

- [ ] Log out and log back in with email/password
- [ ] Verify redirect to `/auth/verify-2fa` after password success
- [ ] Enter correct TOTP code — verify login completes
- [ ] Enter wrong TOTP code — verify error message
- [ ] Enter expired TOTP code — verify rejection
- [ ] Use a backup code — verify login completes
- [ ] Verify used backup code cannot be reused

### 4.3 Trust Device

- [ ] During 2FA verification, check "Trust this device" option
- [ ] Complete 2FA
- [ ] Log out and log in again — verify 2FA is skipped for 30 days on this device

### 4.4 Disable 2FA

- [ ] Go to `/settings/security`
- [ ] Click "Disable 2FA"
- [ ] Verify password re-entry is required
- [ ] Enter correct password — verify 2FA is disabled
- [ ] Log out and log in — verify no 2FA prompt

### 4.5 2FA Rate Limiting

- [ ] Attempt 3+ rapid TOTP entries — verify rate limiting (3 req/10s)
- [ ] Wait for cooldown — verify can try again

---

## 5. Password Management

### 5.1 Change Password

- [ ] Go to `/settings/security`
- [ ] Click "Change Password"
- [ ] Enter wrong current password — expect error
- [ ] Enter current password + new password that's too weak — expect validation error
- [ ] Enter current password + mismatched new passwords — expect error
- [ ] Enter current password + valid new password — expect success
- [ ] Log out and log in with new password — verify it works
- [ ] Log in with old password — verify it fails

### 5.2 Forgot Password

- [ ] Go to `/auth/signin` and click "Forgot Password?"
- [ ] Submit with unregistered email — verify no information leak (generic "Check your email" message)
- [ ] Submit with registered email — verify reset email is sent
- [ ] Click reset link in email — verify redirect to reset form
- [ ] Submit new password with weak password — expect validation error
- [ ] Submit valid new password — expect success
- [ ] Verify old password no longer works
- [ ] Click reset link a second time — verify it's expired / already used

### 5.3 Password Reset Rate Limiting

- [ ] Submit forgot-password 3+ times in 5 minutes — verify rate limit (3/5min)

---

## 6. Session Management

- [ ] Go to `/settings/security`
- [ ] Verify "Active Sessions" section shows current sessions with device info (browser, OS, IP)
- [ ] Verify current session is highlighted as "Current"
- [ ] Open app in a different browser to create a second session
- [ ] Verify second session appears in the list
- [ ] Click "Revoke" on the other session — verify it's removed
- [ ] Switch to the revoked browser — verify session is invalidated (redirect to login)
- [ ] Click "Revoke All Other Sessions" — verify all non-current sessions are terminated
- [ ] Verify current session remains active

---

## 7. User Dashboard

**Precondition**: Logged in as any authenticated user.

### 7.1 Dashboard Layout

- [ ] Navigate to `/dashboard`
- [ ] Verify welcome message with user's name
- [ ] Verify Pro/Advance badge appears next to name (if subscribed)
- [ ] Verify stats grid displays:
  - [ ] Coin Balance (with daily bonus claim button)
  - [ ] Login Streak (fire emoji + count)
  - [ ] Subscription status
  - [ ] Tools Available count (from registry)
  - [ ] Executions Today count

### 7.2 Dashboard Components

- [ ] Verify **Onboarding Wizard** appears for new users (first visit)
- [ ] Verify **Onboarding Checklist** appears with task progress
- [ ] Verify **Coin Event Banner** shows active multiplier events (if any)
- [ ] Verify **Referral Card** displays with referral link and stats
- [ ] Verify **Quick Actions** grid: Use a Tool, Favorites, History, API Keys, Settings, Upgrade
- [ ] Verify **Recent Activity** feed shows last 10 executions (real data, not placeholder)
- [ ] Click each Quick Action — verify navigation to correct page

### 7.3 Daily Bonus Claim

- [ ] Click "Claim Daily Bonus" button
- [ ] Verify coin balance increases by 10 (base, or multiplied by streak)
- [ ] Verify toast notification: "Daily bonus claimed! +X coins"
- [ ] Try claiming again — verify button is disabled and shows countdown
- [ ] Verify claim resets at midnight UTC

---

## 8. Onboarding System

### 8.1 Welcome Wizard (New Users)

- [ ] Register a brand new account
- [ ] On first dashboard visit, verify onboarding wizard modal appears
- [ ] **Step 1**: "What do you work with?" — select categories (Text, Code, Images, Data)
- [ ] **Step 2**: "Recommended tools" — verify personalized tool grid based on selection
- [ ] **Step 3**: "Try one now!" — verify direct link to a free tool
- [ ] Complete all 3 steps — verify 25 bonus coins are awarded
- [ ] Verify wizard doesn't appear on subsequent visits
- [ ] Verify "Skip" button is available at each step
- [ ] Click "Skip" on a new user — verify wizard is dismissed and doesn't return

### 8.2 Onboarding Checklist

- [ ] Verify checklist appears on dashboard after wizard
- [ ] Verify tasks:
  - [ ] Use your first tool (5 coins)
  - [ ] Favorite a tool (5 coins)
  - [ ] Claim daily bonus (5 coins)
  - [ ] Complete your profile (5 coins)
  - [ ] Try a Pro tool (5 coins)
- [ ] Complete each task — verify checkmark appears and coins are awarded
- [ ] Verify progress bar updates with each completion
- [ ] Verify checklist disappears after all tasks are done

---

## 9. Navigation & Routing

### 9.1 Public Pages (No Auth Required)

- [ ] `/` — Landing page loads with hero, stats, categories, footer
- [ ] `/tools` — Tool index page loads
- [ ] `/tools/all` — Full tool listing
- [ ] `/tools/category/[category]` — Category filtered listing (try each of the 7+ categories)
- [ ] `/tools/[slug]` — Individual tool page loads (try 5+ different tools)
- [ ] `/pricing` — Pricing page with plan comparison
- [ ] `/status` — System status page
- [ ] `/docs` — Documentation root
- [ ] `/docs/api` — API documentation
- [ ] `/changelog` — Changelog page
- [ ] `/auth/signin` — Sign in page
- [ ] `/auth/signup` — Sign up page

### 9.2 Protected Pages (Auth Required)

For each, verify redirect to `/auth/signin` when not logged in:

- [ ] `/dashboard`
- [ ] `/dashboard/analytics`
- [ ] `/dashboard/subscription`
- [ ] `/dashboard/coins`
- [ ] `/dashboard/history`
- [ ] `/dashboard/api-keys`
- [ ] `/settings`
- [ ] `/settings/profile`
- [ ] `/settings/security`
- [ ] `/settings/billing`
- [ ] `/settings/preferences`
- [ ] `/settings/notifications`

### 9.3 Navigation Elements

- [ ] **Header**: Logo links to `/`, all nav items work
- [ ] **Footer**: All links work (Pricing, Docs, Status, Changelog, etc.)
- [ ] **Mobile hamburger menu**: Opens/closes, all links work
- [ ] **User dropdown**: All items navigate correctly
- [ ] **Breadcrumbs**: Display correct hierarchy on nested pages
- [ ] **Browser back/forward**: Navigation state is preserved
- [ ] **404 page**: Navigate to `/nonexistent` — verify custom 404 page

### 9.4 Deep Linking

- [ ] Navigate directly to a tool URL (e.g., `/tools/json-formatter`) — page loads correctly
- [ ] Navigate directly to `/dashboard/analytics` while logged in — page loads
- [ ] Share a URL and open in a new browser — verify correct page loads

---

## 10. Tool Discovery & Browsing

### 10.1 Tool Index Page (`/tools`)

- [ ] Verify tool categories are displayed with counts
- [ ] Click each category — verify navigation to filtered listing
- [ ] Verify featured/popular tools section
- [ ] Verify search input is present and functional

### 10.2 All Tools Page (`/tools/all`)

- [ ] Verify all 446+ tools are listed (with pagination or infinite scroll)
- [ ] Verify tool cards show: name, description, category badge, tier badge
- [ ] Verify Pro/Advance tools show appropriate badge
- [ ] Click a tool card — verify navigation to tool page

### 10.3 Category Filtering

Test each category page (`/tools/category/[slug]`):

- [ ] **Text Tools** — verify ~191 tools listed with subcategories (Case, Unicode, Wrapper, Encoding, Cipher, Manipulation)
- [ ] **Data Tools** — verify ~106 tools (CSV, JSON, XML, YAML, TOML, INI converters/validators/formatters)
- [ ] **Media Tools** — verify ~83 tools (Image, Video, Audio, Document, Archive, Font, PDF)
- [ ] **Generator Tools** — verify ~38 tools (UUID, Password, Hash, Text, Visual, SEO, CSS)
- [ ] **Calculator Tools** — verify ~9 tools (BMI, GPA, Islamic calculators, Date, Math)
- [ ] **Converter Tools** — verify ~23 tools (Length, Weight, Temp, Speed, Area, Volume, Time, Digital Storage)
- [ ] **Specialized Tools** — verify 4+ tools (DB Schema Visualizer, File Tree Visualizer, etc.)

### 10.4 Search

- [ ] Type in search bar — verify results filter in real-time
- [ ] Search for partial tool name (e.g., "json") — verify matching tools appear
- [ ] Search for a category name (e.g., "text") — verify category tools appear
- [ ] Search with no results (e.g., "xyznonexistent") — verify "No tools found" message
- [ ] Clear search — verify all tools return

### 10.5 Tool Page (Individual Tool)

- [ ] Verify tool name, description, and category are displayed
- [ ] Verify trust badges: "Processed locally" for client-side tools, "Encrypted" for server-side
- [ ] Verify input area is appropriate for tool type (text input, file upload, options, etc.)
- [ ] Verify output area appears after execution
- [ ] Verify related tools section
- [ ] Verify tool metadata: execution type, tier requirement, coin cost (if any)
- [ ] Verify favorite button (heart icon) works — adds/removes from favorites

---

## 11. Tool Execution — Text Tools (191 tools)

**Execution**: Client-side (WASM with JS fallback). No server call. Free tier.

### 11.1 Case Conversion Tools (~55 tools)

Test at least 10 representative samples:

- [ ] **Uppercase** — input: `hello world` → output: `HELLO WORLD`
- [ ] **Lowercase** — input: `HELLO WORLD` → output: `hello world`
- [ ] **Title Case** — input: `hello world` → output: `Hello World`
- [ ] **Camel Case** — input: `hello world` → output: `helloWorld`
- [ ] **Snake Case** — input: `hello world` → output: `hello_world`
- [ ] **Kebab Case** — input: `hello world` → output: `hello-world`
- [ ] **Pascal Case** — input: `hello world` → output: `HelloWorld`
- [ ] **Dot Case** — input: `hello world` → output: `hello.world`
- [ ] **Sentence Case** — input: `HELLO WORLD. GOODBYE WORLD.` → output: `Hello world. Goodbye world.`
- [ ] **Toggle Case** — input: `Hello` → output: `hELLO`
- [ ] Test with empty input — verify handled gracefully (empty output, no crash)
- [ ] Test with very large input (10,000+ characters) — verify performance is acceptable
- [ ] Test with Unicode/emoji input — verify correct handling
- [ ] Test with multiline input — verify each line is processed

### 11.2 Encoding Tools

- [ ] **Base64 Encode** — verify `hello` → `aGVsbG8=`
- [ ] **Base64 Decode** — verify reverse
- [ ] **URL Encode** — verify `hello world` → `hello%20world`
- [ ] **URL Decode** — verify reverse
- [ ] **HTML Encode** — verify `<div>` → `&lt;div&gt;`
- [ ] **HTML Decode** — verify reverse
- [ ] **Hex Encode/Decode** — verify bidirectional
- [ ] **Binary Encode/Decode** — verify bidirectional
- [ ] **ROT13** — verify `hello` → `uryyb`
- [ ] Test with invalid Base64 input for decode — verify error message

### 11.3 Cipher Tools

- [ ] **Caesar Cipher** — verify shift encoding/decoding with configurable shift value
- [ ] **Atbash Cipher** — verify alphabet reversal
- [ ] **Vigenere Cipher** — verify with key input
- [ ] Test with empty key — verify error/fallback
- [ ] Test encode → decode cycle — verify original text is recovered

### 11.4 Manipulation Tools

- [ ] **Reverse Text** — verify `hello` → `olleh`
- [ ] **Remove Duplicates** — verify duplicate lines removed
- [ ] **Sort Lines** — verify alphabetical/numerical sorting
- [ ] **Trim Whitespace** — verify leading/trailing removed
- [ ] **Word Count** — verify correct word/character/line counts
- [ ] **Find and Replace** — verify text substitution
- [ ] **Remove Empty Lines** — verify blank lines stripped
- [ ] **Add Line Numbers** — verify numbered output

### 11.5 Unicode Tools

- [ ] **Unicode Escape/Unescape** — verify conversion
- [ ] **Punycode Encode/Decode** — verify IDN handling
- [ ] Test with various scripts (Arabic, Chinese, Japanese, Korean, Hindi)

### 11.6 Unified Text Converter (`/tools/text-converter`)

- [ ] Verify the combined text converter tool loads
- [ ] Test switching between different conversion modes
- [ ] Verify input/output areas work correctly

---

## 12. Tool Execution — Data Tools (106 tools)

**Execution**: Client-side. Free tier.

### 12.1 JSON Tools

- [ ] **JSON Formatter** — paste minified JSON → verify pretty-printed output
- [ ] **JSON Minifier** — paste formatted JSON → verify minified output
- [ ] **JSON Validator** — valid JSON → "Valid", invalid → error with line number
- [ ] **JSON to CSV** — verify tabular conversion
- [ ] **JSON to XML** — verify structure mapping
- [ ] **JSON to YAML** — verify conversion
- [ ] **JSON to TOML** — verify conversion
- [ ] **JSON Schema Generator** — paste JSON → verify schema output
- [ ] **JSON Path Finder** — verify path query works
- [ ] **JSON Diff** — paste two JSONs → verify difference highlighting
- [ ] Test with deeply nested JSON (10+ levels)
- [ ] Test with arrays of 1000+ elements — verify performance
- [ ] Test with invalid JSON input — verify clear error messages

### 12.2 CSV/TSV Tools

- [ ] **CSV to JSON** — verify array of objects output
- [ ] **CSV to XML** — verify structured output
- [ ] **CSV to SQL** — verify INSERT statements
- [ ] **TSV to CSV** — verify tab-to-comma conversion
- [ ] **CSV Validator** — verify header/row consistency check
- [ ] Test with quoted fields containing commas
- [ ] Test with different delimiters

### 12.3 XML Tools

- [ ] **XML Formatter** — verify pretty-print
- [ ] **XML Minifier** — verify minification
- [ ] **XML Validator** — verify well-formedness check
- [ ] **XML to JSON** — verify conversion
- [ ] **XPath Query** — verify element extraction
- [ ] Test with CDATA sections, namespaces, attributes

### 12.4 YAML Tools

- [ ] **YAML Formatter** — verify formatting
- [ ] **YAML Validator** — verify syntax checking
- [ ] **YAML to JSON** — verify conversion
- [ ] **YAML to TOML** — verify conversion
- [ ] Test with anchors and aliases
- [ ] Test with multiline strings (literal/folded)

### 12.5 Other Data Format Tools

- [ ] **TOML to JSON** / **JSON to TOML** — verify bidirectional
- [ ] **INI Parser** — verify section/key parsing
- [ ] **SQL Formatter** — verify pretty-print of SQL queries
- [ ] **Regex Tester** — verify pattern matching with test strings
- [ ] **Cron Expression Parser** — verify schedule explanation
- [ ] **Markdown to HTML** — verify rendering
- [ ] **HTML to Markdown** — verify conversion

### 12.6 DevOps/API Tools

- [ ] **.env Validator** — verify environment file checking
- [ ] **JWT Decoder** — paste JWT → verify header/payload display (no signature verification needed)
- [ ] **URL Parser** — verify protocol/host/path/query breakdown
- [ ] **HTTP Header Parser** — verify header decomposition

---

## 13. Tool Execution — Media Tools (83 tools)

**Execution**: Server-side (FastAPI). Some require Pro/Advance. May cost coins.

### 13.1 Image Tools

- [ ] **Image format conversion** (JPEG → PNG, PNG → WebP, etc.) — upload image, verify output format
- [ ] **Image resize** — upload image, set dimensions, verify resized output
- [ ] **Image compress** — upload image, verify reduced file size
- [ ] **HEIC to JPEG** — upload HEIC file, verify JPEG output
- [ ] **SVG converter** — test SVG to PNG/JPEG
- [ ] **RAW to JPEG** — test camera RAW format
- [ ] **PSD to PNG** — test Photoshop file conversion
- [ ] **Image watermark** — verify watermark placement
- [ ] Verify file size limit enforcement (guest: 5MB, free: 25MB, pro: 100MB, advance: 500MB)
- [ ] Upload file exceeding limit — verify clear error message
- [ ] Upload invalid file type — verify rejection
- [ ] Test with very large image (50MP+) — verify timeout handling

### 13.2 Video Tools

- [ ] **Video format conversion** (MP4 → WebM, AVI → MP4, etc.)
- [ ] **Video compress** — verify reduced file size
- [ ] **Video trim** — specify start/end time
- [ ] **Extract audio from video** — verify audio output
- [ ] Test with large video files — verify async job system works
- [ ] Verify progress tracking during processing

### 13.3 Audio Tools

- [ ] **Audio format conversion** (MP3 → WAV, FLAC → MP3, etc.)
- [ ] **Audio compress** — verify reduced size
- [ ] **Audio trim** — specify start/end time

### 13.4 Document Tools

- [ ] **PDF tools** — merge, split, compress
- [ ] **Document conversion** — DOCX → PDF, etc.
- [ ] Verify Pro/Advance gating for premium document tools

### 13.5 Archive Tools

- [ ] **ZIP/TAR creation** — upload files, verify archive output
- [ ] **Archive extraction** — upload archive, verify extracted files

### 13.6 Media Tool Edge Cases

- [ ] Upload a 0-byte file — verify error
- [ ] Upload a file with wrong extension (e.g., .txt renamed to .jpg) — verify error
- [ ] Upload multiple files quickly in succession — verify queuing
- [ ] Cancel upload mid-progress — verify cleanup
- [ ] Verify coin deduction happens only on successful execution
- [ ] Verify coin refund on server error

---

## 14. Tool Execution — Generator Tools (38 tools)

**Execution**: Client-side. Mostly free.

### 14.1 ID Generators

- [ ] **UUID v1** — verify time-based UUID format
- [ ] **UUID v4** — verify random UUID format
- [ ] **UUID v5** — verify namespace-based UUID with input
- [ ] **ULID** — verify ULID format
- [ ] **Nano ID** — verify custom-length ID
- [ ] Verify batch generation (generate 100+ UUIDs)
- [ ] Verify uniqueness — no duplicates in batch

### 14.2 Security Generators

- [ ] **Password Generator** — verify configurable length, character sets (uppercase, lowercase, numbers, symbols)
- [ ] **Hash Generator** (MD5, SHA-1, SHA-256, SHA-512) — input text → verify correct hash output
- [ ] Verify password generator uses cryptographically secure randomness
- [ ] Generate 100+ passwords — verify no duplicates

### 14.3 Text Generators

- [ ] **Lorem Ipsum** — verify paragraph/sentence/word generation with count input
- [ ] **Random Name Generator** — verify output
- [ ] **Placeholder Text** — verify various formats

### 14.4 Visual Generators

- [ ] **QR Code Generator** — input text/URL → verify QR image output (scannable)
- [ ] **Barcode Generator** — verify barcode image
- [ ] **Color Palette Generator** — verify color scheme output
- [ ] **Gradient Generator** — verify CSS gradient code

### 14.5 SEO Generators

- [ ] **Meta Tag Generator** — input title/description → verify HTML output
- [ ] **Robots.txt Generator** — verify valid robots.txt output
- [ ] **Sitemap Generator** — verify XML sitemap structure
- [ ] **Open Graph Tag Generator** — verify OG meta tags

### 14.6 CSS Generators

- [ ] **CSS Grid Generator** — verify valid CSS grid code
- [ ] **CSS Flexbox Generator** — verify valid flexbox code
- [ ] **Box Shadow Generator** — verify CSS shadow code
- [ ] **Border Radius Generator** — verify CSS border-radius code

---

## 15. Tool Execution — Calculator Tools (9 tools)

**Execution**: Client-side. Free tier.

- [ ] **BMI Calculator** — input height + weight → verify correct BMI with category (underweight/normal/overweight/obese)
- [ ] **GPA Calculator** — input grades + credits → verify correct GPA
- [ ] **Islamic Zakat Calculator** — input assets → verify zakat amount (2.5% of wealth above nisab)
- [ ] **Islamic Inheritance Calculator** — input family members → verify shares per Sharia law
- [ ] **Date Calculator** — input two dates → verify days between, add/subtract days
- [ ] **Math Calculator** — input expression → verify result
- [ ] Test with edge values: BMI with 0 weight, negative numbers, extremely large numbers
- [ ] Test with decimal precision — verify correct rounding

---

## 16. Tool Execution — Converter Tools (23 tools)

**Execution**: Client-side. Free tier.

- [ ] **Length** — meters ↔ feet, km ↔ miles, cm ↔ inches (verify all unit pairs)
- [ ] **Weight** — kg ↔ lbs, grams ↔ ounces (verify all unit pairs)
- [ ] **Temperature** — Celsius ↔ Fahrenheit ↔ Kelvin (verify: 0°C = 32°F = 273.15K)
- [ ] **Speed** — km/h ↔ mph ↔ m/s ↔ knots
- [ ] **Area** — sq meters ↔ sq feet ↔ acres ↔ hectares
- [ ] **Volume** — liters ↔ gallons ↔ cubic meters
- [ ] **Time** — seconds ↔ minutes ↔ hours ↔ days ↔ weeks ↔ years
- [ ] **Digital Storage** — bytes ↔ KB ↔ MB ↔ GB ↔ TB (verify: 1 MB = 1,048,576 bytes)
- [ ] Test with 0 input — verify 0 output
- [ ] Test with negative numbers — verify correct handling
- [ ] Test with very large numbers — verify no overflow
- [ ] Test with high-precision decimals — verify precision maintained

---

## 17. Tool Execution — Specialized Tools

- [ ] **DB Schema Visualizer** (`/tools/db-schema-visualizer`) — paste DBML/SQL → verify visual ERD output
- [ ] **File Tree Generator** (`/tools/file-tree-generator`) — paste directory structure → verify tree visualization
- [ ] Test with large schemas (50+ tables) — verify rendering performance
- [ ] Test with invalid input format — verify error messages

---

## 18. Pro Trial System

**Precondition**: Logged in as a FREE user.

- [ ] Navigate to a Pro-only tool
- [ ] Verify "Free trial — 1 remaining today" banner appears
- [ ] Execute the Pro tool — verify it works (trial consumed)
- [ ] Navigate to another Pro tool — verify "No trials remaining" or coin prompt
- [ ] Wait until next day (or manipulate `daily_pro_trials` in DB) — verify trial resets
- [ ] As a Pro user, verify no trial banner appears (unlimited access)
- [ ] As a Guest, verify Pro tools show upgrade prompt (no trial)

---

## 19. Coin Economy

### 19.1 Coin Balance

- [ ] Verify coin balance displays correctly in dashboard stats
- [ ] Verify balance in header (if shown)
- [ ] Verify balance on `/dashboard/coins`

### 19.2 Earning Coins

- [ ] **Daily Bonus**: Claim on dashboard — verify +10 coins (base)
- [ ] **Streak Multiplier**: With 3-day streak → 1.5×, 7-day → 2×, 14-day → 3×, 30-day → 5×
- [ ] **Onboarding Wizard Completion**: Verify +25 coins
- [ ] **Checklist Steps**: Verify +5 coins per step
- [ ] **Referral Reward**: Successful referral → verify +50 coins (referrer) + 25 coins (referred)
- [ ] **Coin Multiplier Event**: If active, verify multiplied rewards
- [ ] Verify all coin transactions appear in transaction history

### 19.3 Spending Coins

- [ ] Use a coin-cost tool — verify coins deducted
- [ ] Verify insufficient coins shows error with "Buy Coins" prompt
- [ ] Verify coin deduction only on successful execution (not on error)
- [ ] Use Pro trial — verify no coins deducted for trial use

### 19.4 Purchasing Coins (Stripe)

Navigate to `/dashboard/coins`:

- [ ] Verify all 5 coin packs displayed with correct prices and bonus amounts:
  - Starter: 100 coins / $1.99
  - Popular: 500 coins / $7.99 (+50 bonus)
  - Pro Pack: 1,000 coins / $14.99 (+150 bonus)
  - Mega Pack: 5,000 coins / $59.99 (+1,000 bonus)
  - Enterprise: 20,000 coins / $199.99 (+5,000 bonus)
- [ ] Click "Buy" on a pack — verify Stripe Checkout opens
- [ ] Complete Stripe test payment — verify coins credited to balance
- [ ] Verify Pro users get 20% coin discount, Advance users get 40%
- [ ] Verify transaction appears in history
- [ ] Cancel Stripe checkout — verify no coins credited
- [ ] Verify Stripe webhook processes correctly

### 19.5 Transaction History

- [ ] Navigate to `/dashboard/coins`
- [ ] Verify transaction list shows: type, amount, date, description
- [ ] Verify pagination works for long history
- [ ] Verify transactions are sorted newest-first

---

## 20. Billing & Subscriptions

### 20.1 Pricing Page

- [ ] Navigate to `/pricing`
- [ ] Verify all 4 plans displayed: Guest (implied), Free, Pro ($9.99/mo), Advance ($29.99/mo)
- [ ] Verify annual pricing: Pro ($99.99/yr), Advance ($299.99/yr)
- [ ] Verify feature comparison table is accurate
- [ ] Verify "Current Plan" indicator for logged-in users
- [ ] Verify "Upgrade" buttons navigate to checkout (Polar)

### 20.2 Subscribe to Pro

- [ ] Click "Upgrade to Pro" — verify Polar Checkout opens
- [ ] Complete Polar test payment
- [ ] Verify subscription activates (check `/dashboard/subscription`)
- [ ] Verify Pro badge appears in header
- [ ] Verify Pro features unlock (analytics, batch processing, etc.)
- [ ] Verify coin grant (500/cycle for Pro)
- [ ] Verify Polar webhook processes correctly

### 20.3 Subscribe to Advance

- [ ] Click "Upgrade to Advance" — similar flow
- [ ] Verify all Advance features: all theme presets, save custom presets, priority execution
- [ ] Verify coin grant (2,000/cycle)

### 20.4 Subscription Management

- [ ] Navigate to `/dashboard/subscription` or `/settings/billing`
- [ ] Verify current plan details displayed
- [ ] **Change Plan**: Pro → Advance — verify upgrade flow
- [ ] **Cancel Subscription** — verify cancellation with end-of-period access
- [ ] **Resume Subscription** — verify reactivation after cancellation
- [ ] Verify invoices are accessible

### 20.5 Plan Access Enforcement

Test feature gating for each plan:

| Feature | Guest | Free | Pro | Advance |
|---------|-------|------|-----|---------|
| Basic tool access | ✅ | ✅ | ✅ | ✅ |
| Daily bonus | ❌ | ✅ | ✅ | ✅ |
| Execution history | ❌ | Limited | Full | Full |
| Analytics dashboard | ❌ | ❌ | ✅ | ✅ |
| Batch processing | ❌ | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ | ✅ |
| Priority execution | ❌ | ❌ | ❌ | ✅ |
| Custom theme presets | ❌ | ❌ | ❌ | ✅ (save up to 20) |
| Pro tool access | ❌ | 1 trial/day | Unlimited | Unlimited |
| Advance tools | ❌ | ❌ | ❌ | Unlimited |

- [ ] Verify each cell in the above table by testing with appropriate user accounts

---

## 21. Streak & Rewards System

- [ ] Log in on Day 1 — verify streak starts at 1
- [ ] Log in on Day 2 — verify streak increments to 2
- [ ] Skip a day — verify streak resets to 0 (or 1 on next login)
- [ ] Verify streak display on dashboard (fire emoji + count)
- [ ] Verify streak multiplier on daily bonus:
  - Days 1-2: 1× (10 coins)
  - Day 3+: 1.5× (15 coins)
  - Day 7+: 2× (20 coins)
  - Day 14+: 3× (30 coins)
  - Day 30+: 5× (50 coins)
- [ ] Verify longest streak is tracked and displayed
- [ ] Verify streak break warning email — user with streak ≥3 who was active yesterday but not today should get a warning email at the cron interval

---

## 22. Referral Program

- [ ] Navigate to dashboard — find referral card
- [ ] Verify unique referral link is generated
- [ ] Click "Copy" on referral link — verify clipboard copy
- [ ] Verify referral stats: Referred count, Activated count, Coins Earned
- [ ] Use referral link to register a new account (incognito browser)
- [ ] Verify referral status goes from "pending" to "signed_up"
- [ ] New user completes first tool execution
- [ ] Verify referral status changes to "activated" → "rewarded"
- [ ] Verify referrer receives 50 coins
- [ ] Verify new user receives 25 bonus coins

---

## 23. Settings & Profile

### 23.1 Profile Settings (`/settings/profile`)

- [ ] Verify current profile info displayed (name, email, bio, avatar)
- [ ] Update display name — verify save and UI update
- [ ] Update bio — verify save
- [ ] Upload new avatar — verify image preview and save
- [ ] Remove avatar — verify default initials shown

### 23.2 Preferences (`/settings/preferences`)

- [ ] Change theme mode (light/dark/system) — verify immediate visual change
- [ ] Change language setting (if available) — verify UI updates
- [ ] Toggle auto-copy — verify tool outputs are auto-copied when enabled

### 23.3 Notification Settings (`/settings/notifications`)

- [ ] Toggle email notifications — verify save
- [ ] Toggle marketing emails — verify save
- [ ] Verify streak break warning emails respect notification preference

### 23.4 Security Settings (`/settings/security`)

- [ ] Tested in sections 4, 5, 6 above (2FA, password change, sessions)

### 23.5 Billing Settings (`/settings/billing`)

- [ ] Verify current plan displayed
- [ ] Verify upgrade/change plan link works
- [ ] Verify subscription details (if subscribed)

---

## 24. Theme System

### 24.1 Color Mode

- [ ] Switch to **Light** mode — verify all pages render in light theme
- [ ] Switch to **Dark** mode — verify all pages render in dark theme
- [ ] Switch to **System** mode — verify follows OS preference
- [ ] Toggle OS dark mode while on System — verify app switches automatically

### 24.2 Theme Presets (Free Tier — 8 presets)

- [ ] **Default** — verify base theme applies
- [ ] **Red, Rose, Orange, Green, Blue, Yellow, Violet** — verify each applies distinct color scheme
- [ ] Verify colors persist across page navigations
- [ ] Verify theme persists after logout/login

### 24.3 Theme Presets (Pro Tier — 15 flag presets)

- [ ] As Pro user, verify flag presets are accessible
- [ ] Test: **Japan, USA, UK, France, Germany, Brazil, Italy, Spain, India, Saudi Arabia, UAE, Australia, Canada, South Korea, Pakistan**
- [ ] As Free user, verify flag presets show an upgrade prompt or lock icon

### 24.4 Theme Presets (Advance Tier — 12 stylized presets)

- [ ] As Advance user, verify stylized presets are accessible
- [ ] Test: **Cyberpunk, Claude, Retro Arcade, Neo Brutalism, Forest, Ocean, Sunset, Midnight, Monochrome, Synthwave, Coffee, Lavender**
- [ ] As Pro user, verify stylized presets show upgrade prompt

### 24.5 Theme Customization (Pro+)

- [ ] Adjust **surface contrast**: soft → medium → high — verify visual difference
- [ ] Adjust **neutral bias**: warm → cool → true — verify color temperature change
- [ ] Change **font**: system, geist, inter — verify font family changes
- [ ] Adjust **shape roundness**: 0 (sharp) to 1 (pill) — verify border-radius changes
- [ ] Adjust **elevation** settings — verify shadow changes
- [ ] Adjust **spacing density**: 0.8 (compact) to 1.2 (spacious) — verify layout density

### 24.6 Custom Preset Save (Advance)

- [ ] As Advance user, customize theme and save as preset — verify save
- [ ] Load saved preset — verify all settings restored
- [ ] Save up to 20 presets — verify limit enforcement
- [ ] Delete a saved preset — verify removal

---

## 25. API Key Management

### 25.1 Generate API Key

- [ ] Navigate to `/dashboard/api-keys`
- [ ] Click "Generate New Key"
- [ ] Verify key is displayed once (one-time reveal, `sk_` prefix)
- [ ] Copy the key — verify clipboard copy works
- [ ] Verify key appears in the list (masked, only last 4 chars visible)
- [ ] Generate up to 5 keys — verify limit enforcement
- [ ] Try generating a 6th key — verify error: "Maximum 5 active keys"

### 25.2 Key Operations

- [ ] View key list — verify name, creation date, last used, status
- [ ] Revoke a key — verify it's removed from active list
- [ ] Use a revoked key for API call — verify 401 response

### 25.3 Rate Limit Display

- [ ] Verify rate limit quotas displayed: requests/minute, requests/day, requests/month
- [ ] Verify progress bars reflect current usage
- [ ] Verify rate limit header reference section is present

---

## 26. B2B API Endpoints

**Precondition**: Have a valid API key (`sk_...`).

### 26.1 Health Check

- [ ] `GET /api/v1/health` — verify `200 OK` with status payload (no auth required)

### 26.2 Tool Listing

- [ ] `GET /api/v1/tools` with API key header — verify tool list response
- [ ] `GET /api/v1/tools/[toolKey]` — verify individual tool metadata
- [ ] Try without API key — verify 401

### 26.3 Tool Execution

- [ ] `POST /api/v1/tools/[toolKey]/execute` with valid input — verify execution result
- [ ] Execute with invalid tool key — verify 404
- [ ] Execute with missing input — verify 400 validation error
- [ ] Execute without API key — verify 401
- [ ] Execute with revoked API key — verify 401

### 26.4 Account & Usage

- [ ] `GET /api/v1/account` — verify account info response
- [ ] `GET /api/v1/account/usage` — verify usage stats
- [ ] `GET /api/v1/billing/subscription` — verify subscription info
- [ ] `GET /api/v1/billing/balance` — verify coin balance
- [ ] `GET /api/v1/billing/transactions` — verify transaction list

### 26.5 Async Job API

- [ ] Execute an async tool → get job ID
- [ ] `GET /api/v1/jobs/[jobId]` — verify pending/running status
- [ ] Wait for completion → `GET /api/v1/jobs/[jobId]` — verify completed status
- [ ] `GET /api/v1/jobs/[jobId]/result` — verify result data

### 26.6 API Rate Limiting

- [ ] Send 60+ requests in 1 minute — verify rate limit response (429)
- [ ] Verify `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers

---

## 27. Notifications

- [ ] Verify notification bell icon in header (authenticated users)
- [ ] Click bell — verify dropdown shows notification list
- [ ] Verify notifications for: coin transactions, streak milestones, system alerts, new tool announcements
- [ ] Click a notification — verify navigation to relevant page
- [ ] Verify unread count badge on bell icon
- [ ] Mark notification as read — verify count decreases
- [ ] Mark all as read — verify all cleared

---

## 28. Command Palette (Ctrl+K)

- [ ] Press `Ctrl+K` (or `Cmd+K` on Mac) — verify command palette opens
- [ ] Verify search input is focused
- [ ] Type a tool name (e.g., "json") — verify matching tools appear
- [ ] Use arrow keys to navigate — verify selection highlight moves
- [ ] Press Enter on a tool — verify navigation to tool page
- [ ] Verify groups: Recent, Tools by category, Pages, Actions
- [ ] Search for a page (e.g., "settings") — verify page result appears
- [ ] Search for an action (e.g., "buy coins") — verify action appears
- [ ] Press Escape — verify palette closes
- [ ] Click outside palette — verify it closes
- [ ] Verify recently used tools appear at top

---

## 29. Execution History & Re-run

### 29.1 History Page

- [ ] Navigate to `/dashboard/history`
- [ ] Verify list of past executions with: tool name, date, status, input preview
- [ ] Verify pagination or infinite scroll for long history
- [ ] Verify newest-first sorting

### 29.2 Re-run

- [ ] Click "Re-run" on a history entry
- [ ] Verify navigation to tool page with pre-filled input
- [ ] Verify input matches the original execution
- [ ] Execute — verify it works correctly with pre-filled data

### 29.3 Favorites

- [ ] Navigate to `/dashboard/favorites` (or favorites section)
- [ ] Verify favorited tools are listed
- [ ] Click a favorite — verify navigation to tool page
- [ ] Remove a favorite — verify it's removed from list

---

## 30. Analytics Dashboard

**Precondition**: Logged in as Pro or Advance user with some execution history.

- [ ] Navigate to `/dashboard/analytics`
- [ ] Verify **executions per day** chart (bar chart, last 30 days)
- [ ] Verify **category breakdown** (horizontal bars)
- [ ] Verify **top tools** ranking (most used tools listed)
- [ ] Verify **coin flow** chart (earned vs spent by month)
- [ ] As Free user, navigate to `/dashboard/analytics` — verify upgrade CTA (not chart data)
- [ ] Verify data is accurate (cross-reference with execution history)

---

## 31. GDPR & Data Export

- [ ] Navigate to `/settings` → "Privacy & Data" section
- [ ] Click "Export My Data" (GDPR export button)
- [ ] Verify JSON file downloads containing:
  - [ ] User profile data
  - [ ] Preferences and settings
  - [ ] Execution history
  - [ ] Coin transactions
  - [ ] Favorites
  - [ ] API keys (redacted)
  - [ ] Referral data
  - [ ] Onboarding state
- [ ] Verify export completes within reasonable time
- [ ] Verify sensitive data is appropriately redacted (API key values, etc.)

---

## 32. Account Deletion

### 32.1 Request Deletion

- [ ] Navigate to `/settings` → "Danger Zone"
- [ ] Click "Delete Account"
- [ ] Verify confirmation modal appears
- [ ] Verify password re-entry is required
- [ ] Type "DELETE" for confirmation
- [ ] Enter correct password and confirm
- [ ] Verify account is marked for deletion (14-day grace period)
- [ ] Verify warning banner appears on dashboard with days remaining
- [ ] Verify confirmation email is sent

### 32.2 Cancel Deletion

- [ ] Within 14-day grace period, click "Cancel Deletion"
- [ ] Verify account is restored
- [ ] Verify warning banner disappears
- [ ] Verify cancellation email is sent
- [ ] Verify all features work normally after cancellation

### 32.3 Hard Deletion (After Grace Period)

- [ ] Verify cron job `cleanup-deleted-users` removes accounts past 14 days
- [ ] Verify all user data is permanently removed from DB
- [ ] Verify login with deleted credentials fails

---

## 33. Status Page

- [ ] Navigate to `/status`
- [ ] Verify 4 health checks displayed:
  - [ ] Web App (green/yellow/red indicator + latency)
  - [ ] API Server (indicator + latency)
  - [ ] Auth Service (indicator + latency)
  - [ ] Database (indicator + latency)
- [ ] Verify overall status banner: "All systems operational" / "Degraded" / "Outage"
- [ ] Verify auto-refresh every 60 seconds
- [ ] Click "Refresh Now" — verify immediate update
- [ ] If a service is down, verify correct degraded/outage status

---

## 34. Admin Panel — Authentication

- [ ] Navigate to admin app (`:3001`)
- [ ] Verify redirect to `/login` when not authenticated
- [ ] Log in with admin credentials — verify redirect to `/(admin)/dashboard`
- [ ] Verify non-admin accounts cannot access admin panel (403)
- [ ] Verify admin 2FA flow at `/verify-2fa` (if enabled)
- [ ] Log out — verify session cleared and redirect to `/login`

---

## 35. Admin Panel — Dashboard

- [ ] Navigate to `/(admin)/dashboard`
- [ ] Verify **4 Key Metric Cards** with trend indicators:
  - [ ] Total Users (+ growth %)
  - [ ] Active Subscriptions (+ growth %)
  - [ ] Today's Executions (+ growth %)
  - [ ] Today's Revenue (+ growth %)
- [ ] Verify **6 Secondary Metric Cards**:
  - [ ] Free Users, Paid Users, Active Tools, Total Tools, Error Rate, Avg Response Time
- [ ] Verify **4 Interactive Charts** (Recharts):
  - [ ] User Growth (30-day area chart)
  - [ ] Tool Executions (daily bar chart)
  - [ ] Revenue Trend (daily area chart)
  - [ ] User Breakdown (pie chart — free vs paid + conversion rate)
- [ ] Verify **Top 5 Tools** ranked list
- [ ] Verify **Recent Errors** feed
- [ ] Verify **Alerts** system (critical/warning/info banners)

---

## 36. Admin Panel — User Management

### 36.1 User List (`/(admin)/users`)

- [ ] Verify user list with: name, email, role, plan, status, joined date
- [ ] Verify search/filter functionality
- [ ] Verify pagination
- [ ] Click a user — verify navigation to user detail page

### 36.2 User Detail (`/(admin)/users/[id]`)

- [ ] Verify user profile data displayed
- [ ] Verify subscription info
- [ ] Verify execution history
- [ ] Verify coin balance and transactions
- [ ] **Ban user** — verify user is banned and can't log in
- [ ] **Unban user** — verify access restored
- [ ] **Change role** — assign admin → verify role change
- [ ] **Impersonate user** — verify admin can view app as user (if implemented)

---

## 37. Admin Panel — Tool Management

### 37.1 Tool List (`/(admin)/tools`)

- [ ] Verify all 446+ tools listed
- [ ] Verify search/filter by name, category, tier
- [ ] Click a tool — verify navigation to tool detail

### 37.2 Tool Detail (`/(admin)/tools/[id]`)

- [ ] Verify tool metadata: name, description, category, tier, coin cost, execution type
- [ ] **Enable/Disable tool** — verify toggle works
- [ ] **Edit tool details** — update name/description → verify save
- [ ] **Change coin cost** — verify save and enforcement
- [ ] **Change tier** — move tool between free/pro/advance → verify access changes

---

## 38. Admin Panel — Category Management

- [ ] Navigate to `/(admin)/categories`
- [ ] Verify all categories listed
- [ ] **Create category** — verify new category appears
- [ ] **Edit category** — change name/description → verify update
- [ ] **Delete category** — verify category removed (with tool reassignment handling)

---

## 39. Admin Panel — Plan & Billing Management

### 39.1 Plan Management (`/(admin)/plans`)

- [ ] Verify all plans listed: Free, Pro, Advance
- [ ] **Edit plan** — change price, features, limits → verify save
- [ ] **Create new plan** — verify creation
- [ ] **Plan Limits** — add/edit/remove per-plan limits (daily executions, file size, API rate)

### 39.2 Subscription Management (`/(admin)/subscriptions`)

- [ ] Verify active subscriptions listed
- [ ] Click subscription → verify detail page
- [ ] **Cancel subscription** — verify cancellation
- [ ] **Refund** — verify refund process

### 39.3 Coin Pack Management (`/(admin)/coin-packs`)

- [ ] Verify coin packs listed with prices and amounts
- [ ] **Edit coin pack** — change price/amount → verify save
- [ ] **Create coin pack** — verify new pack appears

### 39.4 Billing Transactions

- [ ] Navigate to billing section — verify transaction list
- [ ] Verify filtering by type, date range

---

## 40. Admin Panel — Feature Flags

- [ ] Navigate to `/(admin)/feature-flags`
- [ ] Verify all 13+ flags listed with current state
- [ ] **Toggle flag** — turn `enable_login_rewards` off → verify login rewards stop working on web app
- [ ] **Toggle flag back** — verify feature restored
- [ ] **Kill switch** — activate `kill_all_tools` → verify tools page shows maintenance message
- [ ] **Deactivate kill switch** — verify tools work again
- [ ] **Create new flag** — verify creation with name, type (toggle/kill_switch/experiment), default value
- [ ] Test experiment flag with percentage rollout

---

## 41. Admin Panel — Configuration

### 41.1 Admin Settings (`/(admin)/settings`)

- [ ] View system settings (site name, maintenance mode, etc.)
- [ ] Edit a setting — verify save and effect on web app

### 41.2 Streak Tiers (`/(admin)/streak-tiers`)

- [ ] View streak tier configuration
- [ ] **Edit tier** — change day threshold or multiplier → verify change on web app
- [ ] **Create tier** — add new streak level
- [ ] **Delete tier** — remove a level

### 41.3 Referral Config (`/(admin)/referral-config`)

- [ ] View referral reward amounts
- [ ] Edit referrer/referred bonus amounts → verify change

### 41.4 Analytics (`/(admin)/analytics`)

- [ ] Verify analytics overview
- [ ] Verify user cohort analysis
- [ ] Verify funnel analysis (signup → first tool → paid)
- [ ] Verify tool usage breakdown
- [ ] Verify revenue time series
- [ ] Verify user retention chart
- [ ] Verify churn analysis

### 41.5 Activity Logs (`/(admin)/activity`)

- [ ] Verify activity log feed
- [ ] Verify entries for admin actions (user bans, role changes, flag toggles)

### 41.6 Admin Management (`/(admin)/admins`)

- [ ] View admin users
- [ ] **Assign admin role** to a user
- [ ] **Remove admin role** from a user

---

## 42. Webhooks & Cron Jobs

### 42.1 Stripe Webhook

- [ ] Trigger Stripe test event: `checkout.session.completed` → verify coins credited
- [ ] Trigger `payment_intent.payment_failed` → verify no coins credited
- [ ] Verify idempotency — replay same event → verify no duplicate processing

### 42.2 Polar Webhook

- [ ] Trigger Polar test event: `subscription.created` → verify subscription activated
- [ ] Trigger `subscription.cancelled` → verify subscription cancelled
- [ ] Verify idempotency

### 42.3 Cron Jobs

Test each cron endpoint (requires `CRON_SECRET` Bearer token):

- [ ] `POST /api/cron/wallet-reconciliation` — verify wallet balance reconciliation
- [ ] `POST /api/cron/cleanup-deleted-users` — verify expired accounts removed
- [ ] `POST /api/cron/streak-warnings` — verify warning emails sent to at-risk users
- [ ] `POST /api/cron/subscription-sync` — verify Polar subscription state sync
- [ ] `POST /api/cron/anonymous-cleanup` — verify anonymous data pruned
- [ ] `POST /api/cron/stale-job-cleanup` — verify stuck jobs cleaned up
- [ ] Verify cron endpoints reject calls without valid `CRON_SECRET`

---

## 43. Accessibility (WCAG)

### 43.1 Keyboard Navigation

- [ ] Tab through entire page — verify all interactive elements receive focus
- [ ] Verify focus ring/outline is visible on all focused elements
- [ ] **Dialog**: Tab key cycles through dialog content (focus trap), Escape closes dialog
- [ ] **Dropdown Menu**: Enter/Space opens menu, Arrow keys navigate items, Escape closes
- [ ] **Select**: Arrow keys navigate options, Enter selects, Escape closes
- [ ] **Tabs**: ArrowLeft/ArrowRight switch tabs, Home goes to first, End goes to last
- [ ] **Button**: Enter and Space activate, asChild renders as custom element correctly
- [ ] **Command Palette**: Arrow keys navigate results, Enter selects, Escape closes

### 43.2 ARIA Attributes

- [ ] Verify all dialogs have `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- [ ] Verify dropdown menus have `role="menu"`, items have `role="menuitem"`
- [ ] Verify select components have `role="listbox"`, options have `role="option"` + `aria-selected`
- [ ] Verify tabs have proper `role="tablist"`/`role="tab"`/`role="tabpanel"` structure
- [ ] Verify all form inputs have associated labels (`<label for>` or `aria-label`)
- [ ] Verify buttons have accessible names
- [ ] Verify images have `alt` attributes

### 43.3 Screen Reader

- [ ] Navigate the app with screen reader (NVDA, VoiceOver, or Narrator)
- [ ] Verify page headings are logically structured (h1 → h2 → h3)
- [ ] Verify form fields are announced with their labels
- [ ] Verify error messages are associated with form fields
- [ ] Verify toast notifications are announced (live region)
- [ ] Verify loading states are announced

### 43.4 Color Contrast

- [ ] Verify text contrast ratio meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
- [ ] Test with all theme presets in both light and dark mode
- [ ] Verify no information conveyed by color alone (e.g., error states have text + icon)

---

## 44. Responsive Design & Cross-Device

### 44.1 Mobile (320px - 767px)

- [ ] Verify hamburger menu appears and works
- [ ] Verify all pages are usable without horizontal scroll
- [ ] Verify tool input/output areas are full-width
- [ ] Verify forms are usable with mobile keyboard
- [ ] Verify touch targets are ≥44px (WCAG guideline)
- [ ] Verify dashboard cards stack vertically
- [ ] Verify tables scroll horizontally or collapse to cards

### 44.2 Tablet (768px - 1023px)

- [ ] Verify layout adapts (2-column where appropriate)
- [ ] Verify sidebar collapses or becomes toggleable
- [ ] Verify charts resize correctly

### 44.3 Desktop (1024px+)

- [ ] Verify full layout with sidebar navigation
- [ ] Verify charts and data tables display at full width
- [ ] Verify command palette is centered and properly sized

### 44.4 Specific Device Testing

- [ ] iPhone SE (375×667)
- [ ] iPhone 12/13 (390×844)
- [ ] iPad (768×1024)
- [ ] iPad Pro (1024×1366)
- [ ] MacBook 13" (1440×900)
- [ ] Desktop 1920×1080
- [ ] Ultrawide 2560×1080

---

## 45. Performance & Loading

### 45.1 Page Load Times

Target: <3s First Contentful Paint, <5s Largest Contentful Paint

- [ ] `/` (Landing) — measure FCP and LCP
- [ ] `/tools` — measure load with 446+ tools
- [ ] `/tools/all` — measure with all tools rendered
- [ ] `/dashboard` — measure with all widgets
- [ ] `/dashboard/analytics` — measure with chart rendering

### 45.2 Skeleton Loading

- [ ] Verify skeleton states appear during data loading on: dashboard, tool list, history, settings
- [ ] Verify skeletons are replaced by real content (no flash of unstyled content)

### 45.3 Client-Side Tool Performance

- [ ] Execute text tool with 1KB input — expect <100ms
- [ ] Execute text tool with 100KB input — expect <500ms
- [ ] Execute text tool with 1MB input — expect <2s
- [ ] Execute data tool (JSON formatter) with 10MB JSON — verify doesn't freeze browser
- [ ] WASM fallback: if WASM fails to load, verify JS fallback works

### 45.4 Server-Side Tool Performance

- [ ] Upload small image (100KB) for conversion — expect <5s
- [ ] Upload medium image (5MB) — expect <15s
- [ ] Upload large file (50MB, Advance user) — expect async job system engagement

### 45.5 Memory Leaks

- [ ] Execute many tools in sequence (50+) without page reload — verify memory doesn't grow unboundedly
- [ ] Navigate between pages repeatedly (100+ times) — verify no memory leak

---

## 46. Security Testing

### 46.1 Authentication Security

- [ ] Verify cookies are `HttpOnly`, `Secure`, `SameSite=Lax`
- [ ] Verify no sensitive data in URL parameters
- [ ] Verify no sensitive data in browser localStorage (check for tokens, passwords)
- [ ] Verify CORS headers are restrictive (allowed origins only)
- [ ] Verify no authentication bypass on protected routes

### 46.2 Authorization

- [ ] Free user accessing Pro features → verify blocked
- [ ] Non-admin accessing admin panel → verify 403
- [ ] User A accessing User B's data → verify data isolation
- [ ] Revoked API key → verify cannot make API calls
- [ ] Expired session → verify redirect to login

### 46.3 Input Validation

- [ ] Inject SQL in form fields — verify no SQL execution
- [ ] Inject `<script>alert('xss')</script>` in text fields — verify XSS prevention
- [ ] Submit extremely long strings (100KB+) — verify server doesn't crash
- [ ] Submit special characters in all form fields — verify proper escaping
- [ ] Submit null bytes — verify handling
- [ ] Malformed JSON in API requests — verify 400 response with safe error

### 46.4 CSRF Protection

- [ ] Verify `Origin`/`Referer` header validation on POST/PUT/DELETE/PATCH
- [ ] Attempt cross-origin POST to `/api/` — verify rejection
- [ ] Verify exemptions: `/api/auth/`, `/api/webhooks/`, `/api/v1/` work correctly

### 46.5 Webhook Security

- [ ] Send forged Stripe webhook without valid signature — verify rejection
- [ ] Send forged Polar webhook without valid signature — verify rejection
- [ ] Replay a processed webhook — verify idempotency (no duplicate processing)

### 46.6 API Key Security

- [ ] Verify API keys are stored as SHA-256 hashes (not plain text)
- [ ] Verify API keys are shown only once at generation (cannot be retrieved later)
- [ ] Verify API key in network requests uses header (not URL parameter)

### 46.7 Encryption

- [ ] Verify TOTP secrets are encrypted at rest (AES-256-GCM)
- [ ] Verify OAuth tokens are encrypted at rest
- [ ] Verify `ENCRYPTION_KEY` env var is required for crypto operations

---

## 47. Rate Limiting & Abuse Prevention

- [ ] **IP-based**: >100 requests/min → verify 429 response
- [ ] **Auth endpoints**: >10 requests/15min → verify rate limit
- [ ] **API key**: >60 requests/min → verify rate limit
- [ ] **Sign-up**: >3 requests/min → verify rate limit
- [ ] **Sign-in**: >5 requests/min → verify rate limit
- [ ] **Forgot password**: >3 per 5 minutes → verify rate limit
- [ ] **2FA**: >3 per 10 seconds → verify rate limit
- [ ] Verify rate limit responses include `Retry-After` header
- [ ] Verify rate limits don't affect legitimate users in normal usage patterns

---

## 48. Feature Flags & Kill Switches

Test from admin panel, verify effect on web app:

- [ ] `kill_all_tools` ON → tools page shows maintenance message, tool execution blocked
- [ ] `kill_all_tools` OFF → tools work again
- [ ] `kill_payments` ON → checkout/purchase flows blocked
- [ ] `kill_signups` ON → registration page blocked
- [ ] `kill_file_uploads` ON → file upload disabled
- [ ] `enable_login_rewards` OFF → daily bonus claim disabled
- [ ] `enable_oauth_google` OFF → Google login option hidden
- [ ] `enable_oauth_github` OFF → GitHub login option hidden
- [ ] `enable_api_access` OFF → API key generation blocked
- [ ] `maintenance_mode` ON → site shows maintenance page
- [ ] Verify kill switch propagation: <5 seconds (Redis-backed)

---

## 49. Error Handling & Edge Cases

### 49.1 Network Errors

- [ ] Disconnect internet during tool execution — verify graceful error message
- [ ] Disconnect during file upload — verify error and retry option
- [ ] Slow connection (throttle to 2G) — verify timeouts handled

### 49.2 Server Errors

- [ ] Trigger 500 error — verify user-friendly error page (no stack traces)
- [ ] Trigger 503 (service unavailable) — verify maintenance message
- [ ] Trigger timeout — verify timeout error message

### 49.3 Form Errors

- [ ] Submit every form with invalid data — verify inline error messages
- [ ] Verify errors clear when corrected
- [ ] Verify error messages are descriptive (not generic "Error occurred")

### 49.4 Empty States

- [ ] Dashboard with no execution history — verify "No activity yet" message
- [ ] Favorites with none saved — verify empty state UI
- [ ] Coin transactions with no history — verify empty state
- [ ] API keys with none generated — verify empty state with "Generate" CTA

### 49.5 Concurrent Operations

- [ ] Click a button twice rapidly — verify no duplicate submissions
- [ ] Open same tool in two tabs, execute simultaneously — verify independent results
- [ ] Claim daily bonus in two tabs simultaneously — verify only one claim succeeds

---

## 50. SEO & Meta Tags

- [ ] Verify `<title>` is set on every page (unique, descriptive)
- [ ] Verify `<meta name="description">` on every page
- [ ] Verify Open Graph tags (`og:title`, `og:description`, `og:image`) on key pages
- [ ] Verify canonical URLs are set
- [ ] Verify `robots.txt` is accessible at `/robots.txt`
- [ ] Verify sitemap is accessible at `/sitemap.xml`
- [ ] Verify structured data (JSON-LD) on tool pages
- [ ] Verify social preview cards render correctly (Twitter Card, Facebook Share)
- [ ] Verify no `noindex` on public pages

---

## 51. Cross-Browser Compatibility

Test complete user flow (register → login → use tool → checkout) on each:

- [ ] **Chrome** (latest) — Windows, Mac
- [ ] **Firefox** (latest) — Windows, Mac
- [ ] **Safari** (latest) — macOS, iOS
- [ ] **Edge** (latest) — Windows
- [ ] **Chrome Mobile** — Android
- [ ] **Safari Mobile** — iOS
- [ ] Verify no browser-specific CSS issues
- [ ] Verify WASM tools work across all browsers
- [ ] Verify file upload works across all browsers
- [ ] Verify clipboard operations (copy) work across all browsers

---

## Automated Testing Checklist (for AI/Bot Test Runners)

### Setup for Automated Bots

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Playwright** | E2E browser testing | Config at project root, targets Chrome/Firefox/WebKit |
| **Vitest** | Unit + integration tests | Configs in `packages/api/`, `packages/ui/`, `apps/web/` |
| **pytest** | Python backend tests | Config in `backend/fastapi/` |
| **Stripe CLI** | Webhook simulation | `stripe listen --forward-to localhost:3000/api/webhooks/stripe` |
| **k6 / Artillery** | Load testing | Script POST to `/api/v1/tools/[key]/execute` |
| **OWASP ZAP** | Security scanning (DAST) | Script at `infra/scripts/zap-scan.ps1` |

### Critical Bot-Executable Test Flows

1. **Registration Flow Bot**: Create account → verify email → complete onboarding → claim bonus → verify coins
2. **Tool Execution Bot**: Login → iterate all 446+ tools → send sample input → verify output shape → log pass/fail
3. **Billing Bot**: Login → select Pro plan → complete Stripe test checkout → verify subscription → downgrade → verify
4. **API Bot**: Generate API key → call each B2B endpoint → verify responses → test rate limits → revoke key
5. **RBAC Bot**: Login as guest/free/pro/advance → attempt each protected action → verify permission enforcement
6. **Theme Bot**: Login → iterate all 35 theme presets → switch dark/light/system → take screenshots → compare
7. **Stress Bot**: Send 1000 concurrent tool executions → measure response latency → verify no crashes
8. **Security Bot**: Run ZAP scan → inject payloads in all form fields → verify no XSS/SQLi → check headers

### Test Data Generation Script

```bash
# Generate test users for each plan tier
pnpm db:seed

# Or manually create via admin API:
# POST /api/admin/users — create free/pro/advance test users
# POST /api/admin/plans — configure plan limits
# POST /api/admin/feature-flags — set flags for testing
```

### Environment Variables for Test Mode

```env
# Stripe test mode
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Polar sandbox
POLAR_ACCESS_TOKEN=polar_test_...
POLAR_WEBHOOK_SECRET=polar_whsec_test_...

# Test secrets
CRON_SECRET=test_cron_secret_for_testing
INTERNAL_SERVICE_SECRET=test_internal_secret
```

### Expected Test Coverage Targets

| Area | Target | Current Framework |
|------|--------|-------------------|
| Unit tests (shared, api, tools, schemas) | 60%+ statements | Vitest |
| Admin RBAC tests | All admin procedures | Vitest |
| Coin lifecycle tests | Pure function coverage | Vitest |
| Webhook idempotency | Mock DB tests | Vitest |
| Accessibility | Button, Dialog, Tabs, DropdownMenu, Select | Vitest + SSR |
| E2E critical flows | 5+ flows | Playwright |
| Python tools | Endpoint + scraper coverage | pytest |
| Security scan | No critical/high findings | OWASP ZAP |
| Load testing | 100 concurrent users, <2s p95 | k6 / Artillery |

---

_Last updated: February 14, 2026_
