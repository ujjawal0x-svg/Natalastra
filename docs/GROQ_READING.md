# Groq-assisted reading

This adds an optional AI reading within the existing chart card. Calculation and the original editorial reading remain available independently. Groq does not calculate astronomical coordinates.

## Local test

Use Node 22.13 or newer. In the folder containing `package.json`, create an ignored `.env` containing `GROQ_API_KEY=your_key`. If `.dev.vars` exists, put the key there instead: Wrangler prioritizes `.dev.vars` over `.env`. Never commit either file. `.env.example` contains names only.

After installing dependencies, run `npm run dev`, open the localhost URL printed in the terminal, calculate a chart, and expand **Explore an AI reading**. Tick consent and select **Create AI reading**. Restart after changing the key. The default model is `openai/gpt-oss-20b`, using Groq's HTTPS chat-completion endpoint and strict JSON output. No SDK is required.

This checkout and a user's laptop are separate environments. A laptop's ignored key is not sent here by Git push. Live provider delivery is unverified until a key is configured in the running environment and a request succeeds.

## Hosted environment

Hosted AI defaults off. Configure a server-side secret `GROQ_API_KEY` and explicitly set `NATALASTRA_AI_ENABLED=true` to enable it. Hosted requests require the existing application sign-in. Never use a `NEXT_PUBLIC_` prefix for the key. GitHub source is not the hosted runtime secret configuration.

Current request guards permit at most five attempts per user per hour, twenty per minute globally, and three in-flight requests, **per Worker isolate**. Local loopback testing shares one quota. Failed attempts consume allowance. These in-memory guards reset on restart and do not enforce organization-wide spending or distributed durable quotas. Before broad paid/public AI rollout, add durable quotas and configure provider spend controls. Provider limits remain authoritative.

## Data and behavior

The first-party server validates birth inputs and recomputes the chart. Groq receives selected placement/aspect evidence and editorial themes, focus and language. It receives no name, email, raw date/time, location, journal or account ID. Unknown birth time excludes Moon, rising and houses. The user grants explicit request-specific sharing consent. Consent resets when chart/focus/system/language changes. No generated reading is stored in the database or browser storage. The UI aborts outdated requests and resets output when inputs change. An aborted browser request may still consume provider allowance.

Responses are limited, schema-validated and rendered as plain React text. A fifteen-second provider deadline and safe errors handle missing key, provider failure, refusal, truncation, malformed output and rate limits. The original reading remains accessible. Strict JSON validation does not establish content truth: AI may still misunderstand symbolism. Evidence remains the original computed chart; the copy is not clinical advice or a prediction. The generated response is identified as AI-assisted.

## Verification

`node tests/groq-reading.mjs` exercises the provider client and route with mocked Cloudflare bindings/auth and provider responses. `node tests/guided-reading.mjs` checks the calculation-derived editorial evidence. TypeScript and a Worker build verify integration. These tests do not prove live Groq delivery, actual account auth flow or visual browser behavior.
