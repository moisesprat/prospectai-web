## 1. Title and meta description

- [x] 1.1 Update `<title>` in `index.html` to `ProspectAI — Multi-Agent AI Investment Research (CrewAI)`
- [x] 1.2 Update `<meta name="description">` in `index.html` to the new 151-character copy fixing the agent count to 6

## 2. Open Graph and Twitter Card sync

- [x] 2.1 Update `og:title` to match the new `<title>`
- [x] 2.2 Update `og:description` to match the new meta description
- [x] 2.3 Update `twitter:title` to match the new `<title>`
- [x] 2.4 Update `twitter:description` to match the new meta description

## 3. Cleanup and JSON-LD

- [x] 3.1 Remove the `<meta name="keywords">` tag from `index.html`
- [x] 3.2 Update the `SoftwareApplication` JSON-LD block's `description` field to the new copy (6-agent, consistent wording)
- [x] 3.3 Remove the `keywords` property from the JSON-LD block

## 4. Verification

- [x] 4.1 View-source `index.html` locally and confirm no remaining "5-agent" references anywhere in `<head>`
- [x] 4.2 Validate the JSON-LD block is still well-formed JSON (e.g. `python3 -c "import json; json.load(open('...'))"` on the extracted block, or a schema.org validator)
- [x] 4.3 Commit, push, and confirm Cloudflare Pages deploys the change
- [x] 4.4 Spot-check the deployed page's title/description/OG tags via `curl` or a social share debugger (e.g. LinkedIn Post Inspector) to confirm the new copy renders correctly
