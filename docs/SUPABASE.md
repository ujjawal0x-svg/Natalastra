# Natalastra backend storage

Production project: `nftpehdlqofukylqtsgy` (Mumbai). Verified Supabase Auth accounts and the existing trusted ChatGPT identity are supported. Their archive IDs remain separate unless the user explicitly links matching verified accounts.

Production runtime uses `NATALASTRA_DATABASE=supabase`, `SUPABASE_URL` and secret `SUPABASE_SECRET_KEY`. The secret is stored in Sites runtime settings, never source, browser bundles or local `.env` files. The public project configuration uses the same project, not the former Supabase account.

All ten archive tables and both account tables have RLS enabled and no access for `anon` or `authenticated`. The backend authorizes identity, ownership and owner-only reporting before accessing the database. The security advisor's “RLS Enabled No Policy” informational findings ([advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)) are intentional: browser access is denied rather than exposing private records directly to browser clients.

`public.natalastra_batch(jsonb)` is a SECURITY INVOKER RPC callable only by `service_role`. It executes a closed catalog of source-controlled statements, identified by hashes, and quotes each scalar parameter independently. It accepts no arbitrary SQL from callers. Multi-statement calls execute in one transaction, including webhook reconciliation and archive deletion. UTC dates and Postgres quota UPSERTs preserve the existing app semantics.

After changing application SQL, run `node scripts/supabase-statements.mjs`. Inspect the generated SQL and apply it as a Supabase migration through the connector before publishing the matching app. Commit the generated `lib/supabase-statements.json`. Missing statements fail closed.

The D1 copy is retained as a historical migration snapshot, not an active replica. Do not silently fall back to D1 during a Supabase outage: doing so would split user data. New writes, exports and deletion use Supabase exclusively when selected. `NATALASTRA_STORAGE_MAINTENANCE=true` pauses storage while a migration snapshot is copied and checked. Do not roll back to D1 after Supabase has received new writes without a deliberate reverse migration.

Validation: TypeScript, build, existing local D1 regression suites, and `tests/supabase-worker.mjs` against the real project. That test takes credentials through hidden stdin, creates a unique temporary test identity, and removes its records in `finally`. Test payments are mocked and do not activate the live merchant configuration. Production checks should use read-only backend requests unless testing writes with a clearly labeled, removable test record.

## Application accounts

Natalastra offers its own Supabase email/password account flow alongside the existing Sites ChatGPT identity. `NATALASTRA_AUTH=hybrid` enables it. Access and refresh tokens use Secure, HttpOnly, SameSite=Lax host-only cookies; tokens never enter localStorage or responses to frontend JavaScript. Every protected request validates the access token with Auth, then checks the live session and canonical identity through `natalastra_account_context`. Logout revokes all sessions and marks the browser signed out so its platform identity cannot silently sign it back in.

Verified Supabase accounts receive a separate `sb:<uuid>` archive. A matching verified email and simultaneous trusted ChatGPT session permit an explicit archive link. No email-only claims are allowed. Link only before saving into the new account: a nonempty new archive is rejected to preserve both sets of records. `natal_account_links` and its RPCs are service-role only. Private archive erasure deliberately leaves account identity links and payment records intact.

### Before public signup

In Supabase → Authentication → URL Configuration, set Site URL to `https://natalastra.jauntycomet1.chatgpt.site` and add the exact redirect URL `https://natalastra.jauntycomet1.chatgpt.site/auth/complete`. Keep email confirmations enabled. Signup and recovery use PKCE: open their emails in the same browser that requested them. Recovery authorization lasts ten minutes after the callback. Login and password reset do not work until the email is verified.

Configure custom SMTP for production email delivery. Supabase's default development mail is restricted and is not a production delivery guarantee. The Google button is visible on login/signup and reports pending setup while the provider is disabled. Enable Google in Authentication → Sign In / Providers with a Google Cloud Web OAuth Client ID and Secret. Google’s authorized redirect URI is `https://nftpehdlqofukylqtsgy.supabase.co/auth/v1/callback`; the app redirect allowlist remains `/auth/complete`. Embedded Google sign-in opens a browser tab. This code does not create Google credentials or claim to configure SMTP.

The Site's existing owner-private audience remains separate from application accounts. Creating an app account does not grant platform access to this private deployment. Public launch needs an explicit sharing change, provider configuration, and email delivery verification.

Auth security advisor: identity and rate-limit tables intentionally expose no client RLS policies because all access is server-only. Supabase reported leaked-password protection disabled; enable it in Authentication → Security when the project's plan supports it. The application enforces a 12-character signup/reset minimum.

Auth verification: `tests/auth-worker.mjs` checks compiled routes with deterministic provider responses and renders all five account pages. `tests/auth-supabase.mjs` creates confirmed test accounts through the admin API without sending mail, validates login, linked identity, private writes, refresh, old-token revocation and separate-account isolation, then deletes its test users and records. Email delivery and Google OAuth require configured providers and separate live checks.

### Profile and header

Login and signup actions sit beside Your Universe in the publication masthead. Authenticated users receive an initials avatar and profile dropdown. The former global account strip has been removed; the shared account provider keeps session refresh behavior.

`GET /api/auth/profile` returns only the authenticated owner's saved birth-chart summaries, archive counts and verified purchase/access records. It does not include journal bodies or shadow-work notes. It uses existing closed-catalog statements. `POST /api/auth/profile` permits a verified Supabase account to update only its display name through Auth's user endpoint; account email, identity and authorization fields are not editable by this action. ChatGPT names remain managed by ChatGPT. Saved chart links select an owned profile through the normal archive loader.

`tests/auth-worker.mjs` covers these profile authorization and name-update boundaries. `tests/profile-supabase.mjs` verifies the same compiled Worker against an isolated confirmed Supabase account without sending email, then deletes the account and its rate-limit record.

### Persistent logout and OAuth completion

The browser stores only a guest preference (`natalastra:guest`), never tokens or personal data. All same-origin application API requests add `X-Natalastra-Guest: 1` while signed out. The server treats this header and the signed-out cookie as denial signals before access-token checks or ChatGPT fallback. Refresh cannot revive a signed-out browser. Successful logout revokes Supabase sessions, clears cookies and private UI memory, and immediately mounts a fresh guest homepage through the persistent account provider, and replaces the browser URL with `/`. Logout does not wait for a framework router transition or reload the document. Explicit login links open the login route normally. This avoids re-entering the private Site access boundary. Guest homepage onboarding skips private archive loading. Browser account events synchronize open tabs and restored pages.

Password login verifies cookie-backed Supabase identity before clearing the preference. PKCE callbacks pass through `/auth/ready` for the same check. Browsers that reject sign-in cookies receive a clear instruction to open a browser tab instead of a false success. This guest flag does not authorize requests or replace server revocation. `tests/browser-session.mjs` covers storage denial, restored pages, verified sign-in and header isolation; `tests/auth-worker.mjs` covers stale-token and refresh denial. Live Google OAuth requires owner-supplied provider credentials and a browser verification after activation.

### Entry flow

Successful sign-in home destinations (`/` or `/dashboard`) now mount the public homepage at `/`; explicit destinations such as `/account` are preserved. Signup awaiting verification and logout also mount the public homepage. Chart routes use the Universe component: authenticated accounts load a valid saved profile, while empty accounts and guests receive birth details. Saving requires authentication and stays off for guests.

`tests/entry-flow.mjs` covers saved-profile selection and first-use/error cases. Auth Worker tests cover default login destinations, safe return paths, the dashboard route and the signed-out homepage. Browser walkthrough of the full entry flow remains to be verified.

### Automatic sign-in and account messages

A verified Supabase session on `/login` or `/signup` now opens the intended dashboard automatically. Password sign-in and the OAuth completion bridge mount the dashboard immediately, replace browser history and retain private-session checks. Explicit return destinations such as `/account` remain supported. There is no required “Open my dashboard” step. Pending email signup opens the guest homepage with a verification notice; the user remains signed out until the verification link completes successfully.

`public.natal_account_emails` is a server-only outbox with RLS enabled and client privileges revoked. It records one welcome per account, then a welcome-back per distinct Supabase session (legacy ChatGPT identity is deduplicated per UTC day). Messages use the authenticated email, never a request-body recipient. Password login, verified non-recovery PKCE callbacks, explicit legacy login and authenticated entry completion enqueue messages without blocking navigation. Refresh and logout do not trigger email. Requests for the same session share a stable message key and an atomic claim; Resend receives the same Idempotency-Key on retries. The sender is server configuration. Templates include no birth data or journal content.

Production delivery is **not active until** the owner configures `RESEND_API_KEY` as a Sites runtime secret and `NATALASTRA_MAIL_FROM` as a verified Resend-domain sender (for example `Natalastra <hello@your-verified-domain>`). Do not put the API key in NEXT_PUBLIC variables, source or chat. The current runtime has no mail provider configured: welcome messages remain `pending`, with zero delivery attempts. Signup confirmation/recovery email delivery remains Supabase SMTP configuration and is separate from these messages.

With mail configured, background sends run under Workers waitUntil. `accepted` means provider acceptance, not confirmed inbox delivery. Failures keep a safe error code and retry on the next authenticated entry, at most three attempts within 23 hours of the first send attempt. This stays inside Resend’s 24-hour deduplication window. Pending messages with no initial attempt can send after configuration. There is no scheduled drain or inbox-delivery webhook in this change; old uncertain sends require operator review.

In Supabase Table Editor, open `natal_account_emails` to inspect `status`, `attempts`, `accepted_at`, `provider_id` and `last_error`. Email failures do not stop login. `tests/account-email-worker.mjs` uses actual SQLite claims and a mocked mail API to verify authenticated recipients, concurrent deduplication, retries, CSRF and escaped HTML without sending real email. `tests/profile-supabase.mjs` verifies the real PostgreSQL outbox with a temporary confirmed account, then removes its outbox and auth records. Browser storage/navigation tests cover immediate sign-in home and pending-signup home; a live browser walkthrough and inbox delivery remain unverified.

### Public homepage first

The discarded yellow introductory screen remains removed. `/` now renders a public editorial homepage with working chart and feature links; it does not mount onboarding, request the profile archive, or automatically open a chart. Login, signup and logout return to this homepage without an extra button. `/chart` and the other workspace routes retain saved-profile loading and birth-details entry. Verification-pending signup shows a notice on the homepage.
