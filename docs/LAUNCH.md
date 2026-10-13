# Natalastra launch handoff — 2026-10-10

## Implemented and checked

- Homepage-first entry, login/logout navigation, guest preferences and separate chart workspace.
- Homepage module no longer imports the chart workspace; chart routes load it when requested.
- Direct public `/pricing`, `/privacy`, `/terms`, `/refunds` and `/support` routes. No birth profile is required to open these pages.
- Public billing catalog exposes product prices and availability only. Purchases and setup fields require account authorization.
- Support form accepts an authenticated request, validates its topic and length, and appends the server-verified reply email. Stored in `natal_product_feedback` with `rating=support`; excluded from displayed product-rating totals. Visible in `/research`, included in the account export and removed by feedback/archive deletion. Replies are manual email by the owner; no automatic support reply is promised.
- Private `/launch` diagnostics show configuration gaps, provider reachability and manual acceptance tasks without exposing secrets. The page does not claim a complete paid launch from configuration alone.
- No new database migration needed; support uses the existing closed SQL registry and existing table. Production check constraint is 500 characters, including the reply address.
- Current yellow/black visual tokens preserved.

## Verification completed

- TypeScript and production Worker build.
- `tests/quality.mjs`: 10 independent reference charts, 110 planetary comparisons, 240 house cusps; DST fold/gap, invalid dates, unknown-time handling. Largest sampled planet error 0.015035 degrees, within 0.02-degree tolerance.
- `tests/pricing.mjs`: shared $14 dossier / $39 annual-pass catalog and explicit cost-model arithmetic.
- `tests/browser-session.mjs`, `tests/entry-flow.mjs`, `tests/auth-worker.mjs`: homepage flow, account isolation, secure cookies, logout, PKCE and recovery.
- `tests/business-worker.mjs`: public info routes, support validation/recipient identity/export, private owner diagnostics, mock checkout transport, signature checks, webhook replay/refund ordering, account-scoped access, annual expiry and permanent dossier access.
- `tests/account-email-worker.mjs`: welcome once, per-session return message, concurrent deduplication, stable retry idempotency and escaped text. No real email sent.
- `tests/studio-worker.mjs`: private records, reflection snapshots, export and deletion. Updated its old homepage assertion to the current public-home contract.
- `tests/dossier-render.mjs`: known/unknown birth-time PDFs; 10 A4 pages each, visual contact-sheet inspection and no text outside page bounds. Browser PDF download still needs acceptance testing.
- Supabase: all 13 application tables have RLS enabled. No-policy informational notices are intentional for server-only tables. Existing leaked-password-protection warning remains; review in Auth settings.
- Production support-table validation performed within a rolled-back transaction; no test support record retained.
- Live Supabase settings: email and Google enabled; email auto-confirm disabled. Cancelled OAuth probe returns to the correct Site `/auth/complete`, not localhost. This is not a completed Google account sign-in.

## Owner-supplied setup still required

### Business contact

Supply approved public values using protected Site runtime settings:

- `NATALASTRA_OPERATOR_NAME`: actual legal operator/business name.
- `NATALASTRA_BUSINESS_ADDRESS`: public business/contact address.
- `NATALASTRA_SUPPORT_EMAIL`: monitored support mailbox. Used on support/privacy pages; the private owner-auth email is never exposed as a substitute.

Current policy pages describe the implemented beta service. Final operator details and jurisdiction-specific legal review are still needed before paid public launch.

### Email delivery

- Site runtime: secret `RESEND_API_KEY` and a verified sender in `NATALASTRA_MAIL_FROM`.
- Supabase Auth: custom SMTP with a verified sender. Welcome email and Auth verification/reset email are distinct delivery paths.
- Verify SPF/DKIM/DMARC, non-owner signup, confirmation, password reset and a received welcome message.
- Current pending mail is not proof of delivery. The outbox retries during authenticated entry and does not have an independent scheduled drain.

### Payments

Use `docs/PAYMENTS.md` for exact Lemon Squeezy settings. Merchant keys/store/variants are absent in the deployed runtime; no live charge was attempted. Keep checkout disabled until real merchant tests cover both products, signed delivery, purchased access and refund. Test mocks do not prove external webhook delivery. A private Site needs authorized server-to-server webhook delivery or an explicitly approved public audience.

### Domain and audience

No custom domain is currently attached. Supply the exact owned domain and configure returned DNS records, then verify HTTPS. Preserve existing private audience until public launch is explicitly chosen. Update Supabase Site URL and redirect allowlist for the final hostname; Google callback remains the Supabase callback unless its Auth domain changes.

### Human acceptance

No supported browser-control plugin was available. Test phone widths 320/375/390/768, real Google account consent, email links, PDF/audio, checkout return and logout on the final domain. Automated Worker tests do not prove browser layout or delivery. Recruit 5–10 real participants and use `/research` to review useful/generic feedback and return usage; do not fabricate users or retention.

## References

- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/redirect-urls
- https://resend.com/docs/api-reference/emails/send-email
- https://docs.lemonsqueezy.com/help/webhooks/signing-requests
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Personalized dossier access (edition 2)

The dossier remains locked at $14 even while screen readings and comparisons are complimentary. `capabilities.dossier` comes only from active live purchases (dossier or pass); test orders and refunded orders do not qualify. `/api/dossier` checks identity, same-origin request and entitlement before generating premium content. It returns a no-store report model for local PDF rendering; premium text generation is not shipped in client bundles. There is no complimentary dossier fallback. Payment setup still needs a verified merchant configuration and signed test delivery before live charging.

Reports add a chosen focus, Sun/Moon synthesis, personal-body distribution, Mercury/Saturn communication experiments, Venus/Mars boundaries, occupied-house interpretation, personal-body aspect analysis and a four-week practice workbook. Unknown times omit houses and Moon contacts; meanings are symbolic, not clinical or validated personality findings. Existing downloaded files cannot be revoked. Birth details submitted to report generation are not inserted as new profiles.

Validation: `tests/dossier-analysis.mjs`, `tests/feature-access.mjs`, and `tests/business-worker.mjs` cover personalization, focus, unknown time, guest/unpaid/account isolation, successful live purchase and refund. Known/unknown PDF samples render to 10 A4 pages. Browser acceptance and live payment setup remain outstanding.
