# Dossier editorial review — edition combinations-2026-10-v3

Status: **Awaiting a human editor.** Automated checks and author review do not qualify as human editorial review. No reviewer, approval date or endorsed outcome has been recorded.

## What changed

The dossier combines planet-pair meaning, both sign styles, actual major-aspect geometry, house context and reader focus. Sun/Moon, Mercury/Saturn and Venus/Mars have dedicated synthesis. Additional aspect notes exclude those pairs to reduce duplication. Unknown birth time suppresses Moon pair synthesis and all calculated house interpretations. A missing qualifying aspect is explicitly described as placement comparison, never invented.

Rule IDs and edition are returned in the server report metadata. `humanReviewed` stays false. Only enable a human-reviewed claim after recording a real reviewer and approved edition; a generated checklist is not approval.

## Review method

Review each of the 39 named pair families in `lib/dossier-synthesis.ts` with conjunction, sextile, square, trine, opposition and no qualifying aspect. Review all three focus variants. Use clearly labelled synthetic geometry fixtures for branch coverage; they are not real birth charts. Then read full dossiers from real calculated test charts with known and unknown times, both Whole Sign and Equal houses, and a custom location. Remove identifying user data from review material.

For each reading record:

| Field | Required review evidence |
| --- | --- |
| Rule ID / edition | Exact rule from report metadata |
| Calculated basis | Verify signs, aspect/orb and houses against the chart; no guessed house when time unknown |
| Synthesis | Explains an interaction between roles, rather than concatenating two sign descriptions |
| Useful action | Specific, feasible, low-stakes experiment appropriate to the selected focus |
| Agency | No prediction of events, destiny, relationship verdict, diagnosis or assumed trauma |
| Uncertainty | Placement comparisons and unknown time are acknowledged |
| Repetition | Check within the same dossier and against a similar chart; explain justified repeated guidance |
| Readability | Read naturally aloud; remove jargon and moral judgments |
| PDF layout | Ten pages, no split aspect block, clear references and no overflow |
| Human decision | Approve / revise / reject, with explanation, reviewer and date |

## Acceptance and revision

Have a human editor read a batch without the chart labels first, then compare each reading against the calculated basis. Ask which statements were specific, useful, repetitive or unsupported. Include readers who say the interpretation does not fit. Store feedback as feedback, not as proof that astrology is a psychological diagnostic instrument.

Before a reviewed release, record all requested edits, rerun geometry/unknown-time checks, render the PDF samples again and document reviewer approval. Unreviewed output must retain its current method disclosure. Do not invent a reviewer identity or testimonials.

## Current automated evidence

`tests/dossier-analysis.mjs` checks two real calculated charts, all three focus choices, unknown-time exclusions, rule metadata, duplicate-pair exclusion and same-sign fixtures with different geometry. `tests/dossier-render.mjs` renders known/unknown-time samples for layout review. These checks establish implementation behavior, not clinical validity, human approval or user usefulness.
