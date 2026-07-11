## Why

The homepage's SEO metadata (`<title>`, meta description, Open Graph, Twitter Card, and JSON-LD) currently says the pipeline runs "5 agents," while every other page on the site (`architecture.html`, `report.html`, `reports.html`) and the pipeline itself consistently describe it as a "6-agent pipeline." This inconsistency undermines the credibility of the description shown in search results and social previews — the exact content Google/LinkedIn/X render to users deciding whether to click through. The current title and description are also generic/keyword-light relative to what ranks well for this kind of demo (no mention of "CrewAI," a term people specifically search for), and the `meta keywords` tag is dead weight — Google has not used it for ranking in over a decade, so keeping it maintained is pure cost with no SEO benefit.

## What Changes

- Rewrite `<title>` to `"ProspectAI — Multi-Agent AI Investment Research (CrewAI)"`.
- Rewrite the meta description to 150–160 characters, fixing the 5-agent/6-agent inconsistency (align to 6-agent, matching the rest of the site).
- Sync `og:title`/`og:description` and `twitter:title`/`twitter:description` to the new title/description so all three surfaces (search result, Open Graph preview, Twitter/X card) show consistent copy.
- Remove the `<meta name="keywords">` tag entirely.
- Update the existing `SoftwareApplication` JSON-LD block's `description` to match the new copy (also fixes its own separate "5-agent" reference) and remove its `keywords` property (same rationale as removing the meta tag). **Note**: JSON-LD structured data already exists on this page from a prior change — this change updates it rather than adding it from scratch.

## Capabilities

### New Capabilities
- `homepage-seo-metadata`: correctness and consistency requirements for the homepage's `<title>`, meta description, Open Graph tags, Twitter Card tags, and JSON-LD structured data.

### Modified Capabilities
- (none — `site-indexability` covers sitemap/canonical/static-rendering concerns, not metadata copy content; no overlap)

## Impact

- Affected file: `index.html` only (`<head>` section).
- No JS, build script, or backend changes — this is static markup content only.
- No visible on-page UI change; affects only what search engines, social previews, and rich-result parsers see.
