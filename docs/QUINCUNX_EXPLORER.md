# Cosmic Blindspot Explorer

## Calculation and presentation

This chart module detects natal quincunxes separately from the existing five major aspects. For each unique supported body pair, normalize ecliptic longitudes, compute the shortest 0–180° separation, and include `abs(separation - 150) <= 2°`. The fixed 2° orb is a Natalastra product convention; astrologers use differing orbs. Major-aspect, synastry, PDF and exact-transit calculations retain their existing scope.

Unknown birth time excludes Moon pairs, rising and houses. Local-noon positions remain provisional. No matching pair produces an explicit empty state, not an invented blindspot. The circle and 148–152° window show geometry. No internal-friction percentage, toxicity metric, psychological score or fate prediction is calculated. Decimal display precision does not imply corresponding ephemeris accuracy.

Near sign cusps, admitted aspects can share element or modality. Detection is based on actual degrees, not an assertion that all quincunxes always join disparate signs. Outer-planet/outer-planet pairs receive a generational notice. Chiron and True Node use the existing calculated chart positions; the module does not claim NASA certification or direct DE421 use.

## AI prompt architecture and flow

1. User chooses a detected pair; no automatic Groq call occurs.
2. User explicitly consents to share selected chart evidence.
3. `/api/ai/reading`, mode `quincunx`, validates inputs and recalculates the chart server-side. It rejects a forged/nonmatching pair before consuming AI allowance.
4. Build E1/E2 for the two placements and E3 for actual quincunx separation/orb. Include symbolic planetary themes and unknown-time/generational context; omit identifying birth inputs from the provider prompt.
5. The shared Groq client requests strict JSON: title, tentative pattern, everyday alternative explanation, usable first-person phrase, optional two-minute experiment, checking question and evidence IDs.
6. Validate lengths, completion status, plain text, unknown-time exclusions, allowed evidence IDs and required E3 citation. Reject bad outputs safely; chart geometry remains available.
7. UI shows selected evidence. It resets outdated results, consent and feedback on chart/pair/language changes. Copied phrases require a click. Feedback stays in the current view and is not model training.

The prompt explicitly avoids treating the natal aspect as a current transit, diagnosing a hidden problem, claiming another person's intentions, assigning attachment styles, asserting a tension score, or directing major decisions. A symbolic lens is not evidence of a psychological cause.

## Sharing and storage

Explicit preview creates a 1080×1350 PNG in the browser. It includes the chosen planet pair, measured separation and orb, and a reflective caption; no name, date, place, journal or AI reflection. Users see the preview before downloading. These chart facts can still be personal information. No graphic-generation API or server upload is used.

No new database tables are required: calculations use the current chart and AI output/feedback/card preview remain ephemeral. Existing shared AI auth, consent, provider deadline and per-isolate quota guards apply. Provider retention policies still apply. Durable organization-wide quota enforcement remains a pre-public-rollout requirement.

## Verification and scope

`node tests/quincunx.mjs` covers geometry, wraparound, orb boundary, unknown time, cusp exceptions and actual-chart variation. `node tests/groq-reading.mjs` covers valid pair recomputation, forged-pair rejection, required E3 citation and existing provider/auth failures. TypeScript and a Worker build check integration. Live synthetic provider checks do not establish real-user usefulness or browser behavior.

This release implements natal quincunx exploration and optional sharing. Automated AI synastry, daily per-user scheduled AI notifications and generated mood graphics are separate proposals, not implemented by this module. It is not a claim to be the first astrology platform with quincunxes.
