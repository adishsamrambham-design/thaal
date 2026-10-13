# Payments and money

**Status:** Proposed. The commission base (§1) and the tax treatment (§4) must be confirmed by the founder and a chartered accountant.

## 1. Commission base (working assumption)

- Authors set a **book price** in whole rupees: free, or **₹49 minimum**. INR only.
- The buyer pays **book price + applicable GST**.
- **Author share = 85% of book price. Platform share = 15% of book price.**
- **The platform pays gateway fees, split fees and GST on those fees** out of its share.
- Rounding: all amounts are **integer paise**. The author share is rounded half-up, and the platform gets the exact remainder, so the two always add up to the price.

Worked examples (calculated in code):

| Price | GST (5% / 18%) | Buyer pays        | Author  | Platform gross | Gateway 2% + 18% GST | Platform net    |
| ----- | -------------- | ----------------- | ------- | -------------- | -------------------- | --------------- |
| ₹49   | ₹2.45 / ₹8.82  | ₹51.45 / ₹57.82   | ₹41.65  | ₹7.35          | ₹1.22 / ₹1.37        | ₹6.13 / ₹5.98   |
| ₹199  | ₹9.95 / ₹35.82 | ₹208.95 / ₹234.82 | ₹169.15 | ₹29.85         | ₹4.93 / ₹5.55        | ₹24.92 / ₹24.30 |

The gateway rate, the GST rate and the commission rate are **configuration, not code**. Each sale records the rates in force at the time it happened.

## 2. Provider findings (official documentation, Oct 2026)

**Razorpay Route** — [docs](https://razorpay.com/docs/payments/route/), [linked account API](https://razorpay.com/docs/api/payments/route/create-linked-account-composite.md)

- Splits a payment to "linked accounts". Transfers can be immediate, deferred or delayed, and reversals are supported for refunds.
- **Must be enabled on the account by a Razorpay integration manager.** Without that, the API returns "Route product is not enabled".
- A linked account needs a legal name matching its PAN, a PAN, and one bank account (penny-drop verified in about 10–15 minutes) or UPI ID.
- ⚠️ The documented allowed PAN types (4th character C, H, F, A, T, B, J, G, L) **do not include P (individual person)**, yet an example uses `business_type: individual`. **We need written confirmation that individual authors with a personal PAN are supported.**
- Standard gateway fee: 2% + 18% GST on the fee. A ₹199 KYC fee applies to new merchants. Route pricing isn't published, so ask.

**Cashfree Easy Split** — [overview](https://www.cashfree.com/docs/payments/split/overview), [FAQ](https://cashfree.com/docs/payments/split/faq)

- **Not on by default. You ask your account manager to enable it.**
- A vendor needs a PAN and a bank account or UPI. KYC documents depend on vendor type. Activation is asynchronous.
- **+0.2% per split** on top of gateway fees. Vendor payout charges are set by the account manager.
- Settlement can be instant, standard (T+2) or on demand. Refunds after settlement are recovered from vendors pro rata by default.
- Limits: 5 vendors per order, 48-hour post-payment split (needs enabling), 45-day maximum hold.

**Recommendation:** Apply to both once the company is incorporated. Choose whichever confirms (a) individual personal-PAN payees and (b) digital goods / publishing as an accepted category. The code uses a `PaymentProvider` interface so the choice isn't locked in.

**Why not collect everything and pay authors ourselves?** Holding other people's money and paying it out later can bring the business under RBI payment-aggregator rules. Using the gateway's split product keeps author money moving through the regulated provider. This needs a lawyer or CA to confirm, not an engineering judgement.

## 3. How money is recorded (design for Phase 4)

- `orders` (one checkout) → `order_items` (one per book) → `payments` (gateway records).
- **`ledger_entries`** is append-only and double-entry: every sale writes balanced rows (buyer → gateway clearing → author payable / platform revenue / gateway fees). Rows are never updated or deleted; corrections are new reversing rows.
- **Entitlement** (the right to read) is created only when the gateway payment is **verified on the server**: signature check plus `payment.captured` webhook, idempotent on the gateway payment ID.
- **Refunds:** a reversing ledger entry, entitlement revoked, and the provider's transfer reversal.
- **Reconciliation job:** a daily comparison of our ledger against the gateway's settlement reports. Mismatches raise an alert and are never auto-corrected.
- Test mode only until the founder explicitly approves going live.

## 4. Tax items for the CA (not answered by this code)

- The GST rate on e-books and digital comics, and **who is liable** (author vs. platform as e-commerce operator).
- GST on the platform's 15% commission.
- GST TCS (s.52 CGST Act) and income-tax TDS (s.194-O; 0.1% since 1 Oct 2024, with an exemption for resident individuals under ₹5 lakh sales who give a PAN/Aadhaar) on author proceeds.
- Invoicing format for buyers and authors.

The ledger stores enough detail (gross, GST, commission, fees, withholdings) to support whatever the CA decides. The actual rules will be set from their advice.
