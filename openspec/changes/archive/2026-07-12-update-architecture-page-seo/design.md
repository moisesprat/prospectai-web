## Context

`architecture.html` explains the 6-agent CrewAI pipeline via a live animated demo. Its current SEO surface is minimal: a brand-first title, a generic H1 ("ProspectAI Pipeline"), an already-accurate meta description, and no structured data at all (unlike `index.html`, which already carries a `SoftwareApplication` JSON-LD block from an earlier change). This page is content-rich and explanatory — closer to a technical article than a product landing page — which is why `TechArticle` (a subtype of `Article`) is the right schema.org type, rather than reusing `SoftwareApplication`.

## Goals / Non-Goals

**Goals:**
- Title and H1 both target long-tail, intent-matching phrases ("multi-agent AI architecture," "CrewAI pipeline," "adversarial critic") rather than leading with the brand name.
- Meta description stays accurate and aligns with the new title/H1 framing.
- Add `TechArticle` JSON-LD so Google can understand this page as an explanatory technical article about the system design, distinct from the homepage's `SoftwareApplication` listing.

**Non-Goals:**
- No change to the page's visual layout, live pipeline animation, or the subtitle paragraph beneath the H1.
- No Open Graph/Twitter Card additions — out of scope for this change (could be a future follow-up matching the homepage's pattern).
- No change to `index.html`, `stats.html`, `reports.html`, or `report.html`.

## Decisions

**1. Title and H1 share the exact same string**: `"Multi-Agent AI Architecture: 6-Agent CrewAI Pipeline with Adversarial Critic"`, as specified. Keeping title and H1 identical (rather than variants) is intentional and simple here — this page has one clear topic, so there's no benefit to differentiating them, and it removes any ambiguity about what the page is "about" for both users and crawlers.

**2. Meta description**: `"A deep dive into ProspectAI's 6-agent CrewAI pipeline: parallel analysis phases, adversarial critic review, and self-correcting final investment strategy."` (154 characters, within the established 150–160 convention used for `index.html`). Keeps the accurate "6-agent" framing already present on this page — no correction needed here, unlike the homepage's earlier 5-agent/6-agent bug.

**3. `TechArticle` JSON-LD fields**: `headline` (= new title/H1), `description` (= new meta description), `author` (Person, matching the existing homepage JSON-LD author block for consistency), `about`/`keywords` omitted (same rationale as removing `meta keywords` from the homepage — not a ranking factor), `mainEntityOfPage` set to the page's own canonical URL. **`datePublished`/`dateModified` are deliberately omitted** rather than fabricated — there's no tracked authorship/publish date for this page's content, and Google's structured-data guidance is explicit that omitting a date field is preferable to guessing one, since an incorrect date is worse than no date (open question below on whether to introduce real tracking later).

**4. Reuse the homepage's `author` shape, don't invent a new format.** `index.html`'s `SoftwareApplication` JSON-LD already has `"author": {"@type": "Person", "name": "Moises Prat", "url": "https://moisesprat.dev"}` — the `TechArticle` block mirrors this exactly, keeping author identity consistent across every structured-data block on the site.

## Risks / Trade-offs

- [No `datePublished`/`dateModified` reduces eligibility for certain date-aware rich result treatments] → Accepted: fabricating a date is worse than omitting it; revisit if the site starts tracking real content-modification dates (e.g. via git commit history exposed at build time).
- [Title (76 characters) exceeds Google's typical ~60-character search-result display truncation] → Accepted per explicit user instruction; the full title still exists in the `<title>` tag and H1 for on-page/long-tail relevance even if the SERP snippet truncates it.
