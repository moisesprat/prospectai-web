## Context

The site is a set of static HTML pages (`index.html`, `architecture.html`, `stats.html`, `reports.html`, `report.html`) deployed as-is to Cloudflare Pages, each mounting page-specific behavior via an ES module (e.g. `ui/architecturePage.js`) and sharing `ui/nav.js` for the persistent nav bar and `styles/style.css` for design tokens. There is no CMS or backend content store — page content is authored directly in HTML/JS at build time and redeployed via commit. The changelog data does not need to be dynamic: entries are added by editing a file whenever a release ships, mirroring how this project already tracks releases informally in commit messages (e.g. "v1.7.0", "v1.5.0").

## Goals / Non-Goals

**Goals:**
- Ship a `/changelog` static page reachable from the footer/nav of every page.
- Present dated entries, reverse-chronological, each describing what changed in the ProspectAI module (the multi-agent brain: Market Analyst → Technical Analyst → Fundamental Analyst → Draft Strategist → Critic → Final Strategist) and/or the web frontend.
- Backfill entries from real project history so the page isn't empty at launch.
- Keep the page indexable (sitemap entry, basic SEO meta) consistent with prior SEO work on `architecture.html` and `stats.html`.
- Zero backend dependency — page renders fully from static HTML/CSS, no fetch calls required.

**Non-Goals:**
- No admin UI or CMS for authoring changelog entries — entries are hand-edited HTML/data, same as `ui/data.js` sector content.
- No RSS/Atom feed generation (can be a future change).
- No automated changelog generation from git history — the initial backfill is a one-time manual pass; future entries are added manually per release.
- No versioning scheme enforcement beyond reusing the existing informal `vX.Y.Z` tags seen in commit messages.

## Decisions

**1. Plain static HTML page, entries as markup (not JSON + renderer).**
Mirrors `architecture.html`'s "no build step" philosophy. A small `ui/changelogPage.js` only handles `initNav()` and any footer-scroll-depth wiring already shared across pages — it does not fetch or render entry data dynamically. Alternative considered: JSON-driven renderer (`ui/data.js`-style array + render function). Rejected because it adds indirection for content that changes a few times a month at most, and static HTML is directly indexable by search engines without JS execution — a real advantage for a content/SEO page.

**2. Entries structured as semantic `<article>` blocks grouped by date.**
Each entry: date (e.g. `2026-03-12`), optional version tag, title, short body, optional tag/category (e.g. "ProspectAI Module", "Frontend", "SEO"). Using `<article>` + `<time datetime="...">` gives crawlers and screen readers clean structure without needing structured data (JSON-LD) — though JSON-LD `BlogPosting`/`ItemList` can be layered on later without touching the visible markup, matching the pattern used on `architecture.html`.

**3. Footer link added across all five HTML pages, not just a nav entry.**
The proposal calls for a footer link specifically (not just the persistent nav). Since `ui/nav.js` already renders a persistent nav bar on some pages, the footer link is the safer, guaranteed-everywhere placement (footer markup exists identically in `index.html`, `architecture.html`, `reports.html`, `stats.html`, `report.html`). Adding to nav as well is optional and left to implementation discretion during tasks, but the footer link is the required, testable surface.

**4. Content framing: ProspectAI module ("the brain") vs. frontend, called out per entry.**
Per the user's explicit ask, entries should read as changes to *ProspectAI* — the multi-agent reasoning system — where applicable (e.g. "ProspectAI's Draft Strategist and Critic agents now run a stricter adversarial review pass"), distinct from frontend-only entries (e.g. "Added a Stats page to show track record"). Each entry gets a small tag/badge so readers can tell module changes from web UI changes at a glance.

**5. Backfill entries sourced from commit history, hand-curated (not a raw commit log dump).**
Raw `git log` is noisy (chores, SEO regen commits, etc.). Entries are hand-written summaries anchored to meaningful commits/tags found in history: e.g. 6-agent pipeline (`0702b95`, v1.5.0), risk profile selector (`554f0b9`, v1.7.0), report persistence & My Reports (`00c1576`, `81b9961`), Stats page (`27417d5` and follow-ups), Architecture page (`eaf004f`, `fdcf78e`), SEO/indexability milestones. Dates use the commit's actual date where determinable; where only relative ordering is known, dates are approximated and clearly not claimed as exact ISO timestamps for unverifiable history.

## Risks / Trade-offs

- [Backfilled dates may not exactly match real deploy dates, since some history predates any changelog discipline] → Use `git log --format=%ai` for each anchor commit to get an accurate authored date; where a whole feature spans multiple commits, use the last commit's date for that entry.
- [Static entries mean every new release requires a manual HTML edit] → Acceptable given release cadence (roughly monthly); documented in this design as an explicit non-goal for automation. A future change can add a small data-driven renderer if cadence increases.
- [Duplicating footer markup across 5 pages risks drift] → Keep the footer link markup identical (same class names, same position) across all pages so a future refactor to a shared partial/include is straightforward; call this out in tasks.md for verification.

## Migration Plan

- Add `changelog.html` + optional `styles/changelog.css` + optional `ui/changelogPage.js`.
- Add footer link in `index.html`, `architecture.html`, `reports.html`, `stats.html`, `report.html`.
- Add `changelog.html` entry to `sitemap.xml`.
- No data migration, no backend changes, no feature flag needed — pure additive static content, safe to deploy directly.
- Rollback: revert the commit; no state or backend coupling.

## Open Questions

- Should the changelog also get a nav-bar entry (via `ui/nav.js`) in addition to the footer link, for parity with Architecture/Stats/Reports? Left as an implementation nice-to-have, not required by the proposal.
