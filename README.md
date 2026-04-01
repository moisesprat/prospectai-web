# ProspectAI Web

A static web front-end for **ProspectAI**, an agentic investment research demo. It presents a multi-agent pipeline—Market Analyst, Technical Analyst, Fundamental Analyst, and Investor Strategist—as a sequential “crew” that produces sector-level intelligence reports.

This repository is the **browser UI only**: vanilla JavaScript (ES modules), no framework, no bundler, and no package manager. It is intended to deploy as static assets (for example [Cloudflare Pages](https://pages.cloudflare.com/)).

## Disclaimer

**This is not an investment product.** The interface is a technical demonstration of multi-agent AI workflows. All shown output is simulated or AI-generated and must not be used as financial advice. See the in-app disclaimer bar for the full warning.

## Features

- **Sector selection** — Choose a market sector; each maps to a representative ETF (e.g. Technology → XLK).
- **Agent execution panel** — Four agent cards with activation, typed output, and completion states.
- **Final report** — Renders a sector report after the pipeline finishes.

Agent copy and report templates live in `ui/data.js`. The orchestration layer is `ui/pipeline.js`, where a clearly marked **simulation block** can be replaced with calls to a real backend (for example streaming SSE into the same panel APIs).

## Project structure

```
index.html          # Shell: disclaimer, header, main #app, footer
styles/style.css    # Layout, components, design tokens
app.js              # Entry: mounts UI modules on DOMContentLoaded
ui/
  state.js          # Shared UI state (selected sector, run status)
  data.js           # Sectors, ETF mapping, agent scripts, report templates
  utils.js          # Helpers (e.g. typing effect)
  sectorSelector.js # Sector grid and run control
  executionPanel.js # Agent cards and progress
  report.js         # Report section
  pipeline.js       # runAnalysis() — simulation vs future API integration
```

**Module flow:** `app.js` loads `sectorSelector`, `executionPanel`, and `report` into `#app`. `sectorSelector` triggers `runAnalysis()` from `pipeline.js`, which reads shared state and drives the panel and report modules.

## Local development

Because the app uses `import`/`export`, open it through a local HTTP server (not `file://`).

Examples:

```bash
# Python 3
python3 -m http.server 8080

# npx (if you have Node)
npx serve .
```

Then open `http://localhost:8080` (or the port your tool prints).

## Deployment

Build step is optional: upload the repo root (or the contents you need) as a static site. Ensure `index.html`, `app.js`, `styles/`, and `ui/` are served with correct paths and that the host supports ES modules over HTTPS as usual.

## Backend integration (outline)

To connect a real ProspectAI or Modal-style API:

1. Replace or extend the simulation in `ui/pipeline.js` with `fetch()` (and optionally streaming).
2. Keep using `executionPanel` methods: `activateAgent`, `typeAgentOutput` / streaming updates, and `completeAgent`.
3. Pass backend-rendered HTML into `report.show(sector, startTime, html)` when available.
4. Configure CORS on the API for your Pages domain.

Details and ETF mapping are documented in `CLAUDE.md` for contributors and AI assistants.

## Author

Built by [Moises Prat](https://github.com/moisesprat). Main project: [github.com/moisesprat/ProspectAI](https://github.com/moisesprat/ProspectAI).

## License

If the repository adds a `LICENSE` file, follow that file. Until then, treat usage as governed by the upstream ProspectAI project policy.
