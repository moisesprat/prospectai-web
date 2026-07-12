## Why

`architecture.html`'s current title ("ProspectAI Architecture — 6-Agent Pipeline") and H1 ("ProspectAI Pipeline") are brand-first and generic — they don't contain the long-tail phrases someone would actually search for when researching multi-agent AI system design (e.g. "multi-agent AI architecture," "CrewAI pipeline," "adversarial critic"). This page is the site's best candidate for organic long-tail search traffic from people researching agentic AI architecture patterns, not just people who already know the ProspectAI brand — retargeting its title/H1/description to match those search intents, and adding structured data so Google can understand it as a technical article, directly supports that.

## What Changes

- Rewrite `<title>` and the page's `<h1>` to `"Multi-Agent AI Architecture: 6-Agent CrewAI Pipeline with Adversarial Critic"` for long-tail query targeting.
- Rewrite the meta description to align with the new title/H1 (150–160 characters, keeping the existing accurate "6-agent" framing).
- Add a `TechArticle` JSON-LD block (net new — `architecture.html` currently has no structured data at all, unlike the homepage's existing `SoftwareApplication` block).

## Capabilities

### New Capabilities
- `architecture-page-seo`: title/H1/meta-description alignment and `TechArticle` structured data requirements for `architecture.html`.

### Modified Capabilities
- (none — `homepage-seo-metadata` covers `index.html` only; no overlap)

## Impact

- Affected file: `architecture.html` only (`<head>` `<title>`/meta description, and the `<h1>` in `.arch-header`).
- No JS, build script, or backend changes — static markup content only.
- No visible layout change beyond the H1 text itself; the surrounding subtitle paragraph and live pipeline demo are untouched.
