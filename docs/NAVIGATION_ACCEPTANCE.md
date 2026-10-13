# P0 navigation acceptance — 11 October 2026

Status: code fixes and automated checks complete; real-browser acceptance remains OPEN. Do not mark all buttons working solely from a build or these tests.

## Fixed behavior

- Main, sidebar, More-menu and mobile navigation emit actual destination URLs. Ordinary clicks stay within the existing chart workspace; Ctrl/Cmd/middle clicks retain browser behavior. No framework soft-routing migration is involved.
- Eight workspace destinations use a single whitelist. Navigation preserves existing browser-history state and avoids duplicate entries for the current tab.
- Back/forward and page restoration synchronize the selected workspace view. Leaving workspace routes via browser history opens the actual destination rather than showing a stale workspace screen.
- More menus close on selection, outside pointer and Escape; menu listeners are cleaned up. Escape also dismisses the mobile panel and birth editor.
- Optional device speech and scroll failures cannot interrupt navigation.
- A pageshow notification does not erase an already-guest chart. Transitioning from signed-in to guest still clears the private chart.

## Automated evidence

`tests/workspace-navigation.mjs`: simulated history and DOM events; eight destinations, actual WorkspaceLink rendered URLs and click handlers, new-tab modifiers, duplicate history, outside-workspace exit, page restoration, speech/scroll failures and menu cleanup.

`tests/browser-session.mjs`: persistent logout preference, guest API headers, verified sign-in only, homepage events, pending signup and blocked browser storage.

`tests/auth-worker.mjs`: compiled Worker auth pages and server session/cookie/CSRF/logout/recovery/account behavior. Provider traffic is mocked.

TypeScript and the production build must pass. None of the above proves hydration, real Google consent, mobile touch behavior or actual email delivery.

## Real-browser acceptance still required

| Flow | Expected result | Status |
| --- | --- | --- |
| Home → Your universe | Chart entry/saved profile opens | Pending browser |
| Today / My chart / Journal | Correct view and URL, one history entry per switch | Pending browser |
| All five More entries | Destination opens and menu closes | Pending browser |
| More outside click / Escape | Menu closes; Escape returns focus to summary | Pending browser |
| Mobile four-tab navigation | Touch opens correct view, active state visible | Pending browser |
| Browser Back / Forward | URL and visible page agree | Pending browser |
| Guest page restoration | Chart is not erased solely by pageshow | Pending browser |
| Birth editor Escape | Dialog closes | Pending browser |
| Profile menu / Login / Signup | Destination opens; keyboard links work | Pending browser |
| Completed login → Home | Home opens automatically with account controls | Pending real auth |
| Logout → Home → Back | Home opens; previous private data stays inaccessible | Pending real auth |
| Slow/failed network action | Visible loading/error, no false success or duplicate submit | Pending browser |

Browser tooling was unavailable in this session. Payment checkout readiness and email-provider setup are separate P0 items and were not changed here.
