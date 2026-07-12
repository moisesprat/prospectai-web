## Why

ProspectAI ships frequently (6-agent pipeline rollout, risk profiles, Stats page, Architecture page, report persistence) but there is no public record of what shipped or when. Visitors and returning users have no way to see how the ProspectAI module — the multi-agent brain that drives every analysis — has evolved, which undercuts trust and hides the pace of improvement. A static, linkable `/changelog` page closes that gap without requiring any backend work.

## What Changes

- Add a new static `changelog.html` page (following the existing `architecture.html` / `stats.html` static-page pattern) listing dated release entries in reverse chronological order.
- Backfill the changelog with historical entries derived from the project's git/release history (e.g. 6-agent pipeline, risk profile selector, Stats page, Architecture page, report persistence, SEO milestones), each entry framed around what changed in the ProspectAI module (the multi-agent brain) and/or the web frontend.
- Add a persistent nav/footer link to `/changelog` so it is reachable from every page (home, architecture, reports, stats, report viewer).
- Add a small `ui/changelogPage.js` (or equivalent) module only if interactivity is needed for rendering; otherwise keep the page fully static HTML consistent with the "no build step required" deployment model.
- Include the changelog page in `sitemap.xml` for indexability, consistent with prior SEO work on other static pages.

## Capabilities

### New Capabilities
- `changelog-page`: static, dated, reverse-chronological changelog page documenting ProspectAI module and frontend releases, linked from the footer/nav of every page.

### Modified Capabilities
(none — footer link addition is a UI wiring detail covered by the new capability, not a change to an existing spec's requirements)

## Impact

- New file: `changelog.html` (static page, mirrors `architecture.html` structure/nav).
- Possibly new file: `ui/changelogPage.js` (only if any client-side behavior is needed, e.g. nav init).
- Modified: `index.html`, `architecture.html`, `reports.html`, `stats.html`, `report.html` footers — add `/changelog` link.
- Modified: `sitemap.xml` — add changelog URL entry.
- Modified: `styles/style.css` (or a new `styles/changelog.css`) — changelog entry list styling, consistent with existing design tokens.
- No backend/API changes; no changes to SSE protocol, agent pipeline, or state modules.
