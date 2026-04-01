/* ============================================================
   STATIC DATA
   Sectors, dummy agent scripts, and report templates.
   Replace agentScripts + REPORT_TEMPLATES with API responses
   once the Modal backend is connected.
   ============================================================ */

export const SECTORS = [
  { ticker: 'XLK',  name: 'Technology' },
  { ticker: 'XLV',  name: 'Healthcare' },
  { ticker: 'XLE',  name: 'Energy' },
  { ticker: 'XLF',  name: 'Financials' },
  { ticker: 'XLY',  name: 'Consumer Discretionary', display: 'Consumer Discr.' },
  { ticker: 'XLI',  name: 'Industrials' },
  { ticker: 'XLRE', name: 'Real Estate' },
  { ticker: 'XLU',  name: 'Utilities' },
];

/* ---- Agent scripts (dummy) ---- */
export const AGENT_SCRIPTS = {
  Technology: [
    {
      active: 'Fetching macro indicators for Technology sector. Scanning Reddit for sentiment signals. Analyzing YTD performance vs SPY...',
      done:   'Macro: Bullish bias. Fed path neutral-to-dovish. Reddit sentiment 72% positive. XLK outperforming SPY +4.2% YTD. AI infrastructure spend accelerating.',
    },
    {
      active: 'Running technical analysis on top 10 XLK holdings. Computing RSI, MACD, Bollinger Bands...',
      done:   'NVDA: RSI 61, bullish momentum. AAPL: consolidating near $185 support. MSFT: MACD crossover positive. Sector trend: higher lows pattern intact.',
    },
    {
      active: 'Pulling earnings data via yfinance. Calculating P/E ratios, revenue growth, FCF yield...',
      done:   'Sector avg P/E 28.4x (vs 5yr avg 24.1x). FCF yield 3.1%. Top picks by fundamentals: NVDA, MSFT, GOOG. Revenue growth accelerating across AI plays.',
    },
    {
      active: 'Synthesizing Market + Technical + Fundamental signals. Constructing portfolio recommendations...',
      done:   'Recommendation: OVERWEIGHT Technology. Core: NVDA (AI infra), MSFT (enterprise AI), GOOG (search + cloud). Risk: valuation stretch, rate sensitivity.',
    },
  ],
  Healthcare: [
    {
      active: 'Fetching macro indicators for Healthcare. Analyzing FDA approval pipeline, policy risk, demographic tailwinds...',
      done:   'Defensive sector with aging population tailwind. Policy uncertainty weighs near-term. FDA approvals above 5yr avg. Sentiment: cautiously positive.',
    },
    {
      active: 'Technical analysis on XLV holdings. Screening for relative strength vs SPY, 200-day MA proximity...',
      done:   'XLV holding 200-day MA. LLY showing exceptional relative strength. UNH consolidating. Biotech recovering from Q1 selloff.',
    },
    {
      active: 'Fundamental deep-dive: P/E multiples, R&D pipeline value, patent cliff analysis...',
      done:   'Sector avg P/E 18.2x -- below market, attractive on relative basis. LLY GLP-1 pipeline commanding premium. Managed care P/E compression from policy risk.',
    },
    {
      active: 'Building portfolio strategy for Healthcare exposure...',
      done:   'Recommendation: NEUTRAL-to-OVERWEIGHT. Barbell: LLY/NVO (GLP-1 growth) + defensive managed care (UNH, CVS). Hedge policy risk.',
    },
  ],
};

export const DEFAULT_SCRIPT = [
  {
    active: 'Fetching macro data and sentiment analysis for selected sector...',
    done:   'Macro analysis complete. Sector trends identified. Sentiment signals processed.',
  },
  {
    active: 'Running technical analysis on sector ETF and top holdings...',
    done:   'Technical analysis complete. Key levels and momentum indicators assessed.',
  },
  {
    active: 'Analyzing fundamentals: earnings, valuation multiples, balance sheets...',
    done:   'Fundamental analysis complete. Valuation framework and key metrics compiled.',
  },
  {
    active: 'Synthesizing all signals into investment strategy and recommendations...',
    done:   'Strategy complete. Risk/reward framework constructed.',
  },
];

/* ---- Report templates (dummy) ---- */
const DISCLAIMER = `
  <div class="disclaimer-box">
    <p><strong>DISCLAIMER:</strong> This report was generated autonomously by an AI multi-agent system
    for the sole purpose of demonstrating agentic pipeline architecture. It does NOT constitute
    investment advice. Always consult a licensed financial professional before making investment
    decisions.</p>
  </div>`;

export const REPORT_TEMPLATES = {
  Technology: `
    <h2>Executive Summary</h2>
    <p>The Technology sector maintains a structural growth thesis underpinned by AI infrastructure
    investment, enterprise software adoption, and cloud expansion. The multi-agent pipeline identified
    an <strong style="color:#00C896">OVERWEIGHT</strong> stance across a composite of macro, technical,
    and fundamental signals.</p>
    <div class="metric-row">
      <div class="metric-box"><div class="m-label">Sector Signal</div><div class="m-value up">OVERWEIGHT</div></div>
      <div class="metric-box"><div class="m-label">YTD vs SPY</div><div class="m-value up">+4.2%</div></div>
      <div class="metric-box"><div class="m-label">Sector P/E</div><div class="m-value">28.4x</div></div>
    </div>
    <h2>Market Analyst Findings</h2>
    <p>The macro environment remains supportive for Technology with a neutral-to-dovish Fed trajectory
    reducing discount rate pressure on growth multiples. Reddit sentiment analysis across r/investing
    and r/stocks registered 72% positive mentions for major Tech holdings over the trailing 30 days.</p>
    <ul>
      <li>AI capital expenditure cycle showing no signs of deceleration</li>
      <li>Enterprise software renewal rates holding above historical averages</li>
      <li>Consumer device cycle turning from trough -- Apple upgrade cycle potential</li>
    </ul>
    <h2>Technical Analyst Findings</h2>
    <p>XLK is maintaining a pattern of higher lows since the Q4 2023 breakout, with price action
    constructive above the 50-day moving average. NVDA registered an RSI of 61 -- strong momentum
    without overbought signals.</p>
    <ul>
      <li>Key support for XLK: $195 (50-day MA), $183 (200-day MA)</li>
      <li>AAPL consolidating near $185 support zone -- potential accumulation zone</li>
      <li>Sector breadth: 7 of top 10 holdings trading above 50-day MA</li>
    </ul>
    <h2>Fundamental Analyst Findings</h2>
    <p>At 28.4x forward P/E, Technology trades at a premium to the market and to its own 5-year average
    of 24.1x. The premium is partially justified by accelerating AI revenue streams.</p>
    <ul>
      <li>Free cash flow yield at 3.1% -- supportive of buybacks and dividends</li>
      <li>NVDA revenue growth accelerating on data center demand</li>
      <li>MSFT Azure and Copilot driving enterprise ARR expansion</li>
    </ul>
    <h2>Portfolio Strategy</h2>
    <p>The Investor Strategist recommends an overweight allocation with concentration in three core
    positions.</p>
    <ul>
      <li>NVDA -- Core AI infrastructure position (highest conviction)</li>
      <li>MSFT -- Enterprise AI platform with durable moat</li>
      <li>GOOG -- Valuation discount vs peers, search + cloud combination</li>
    </ul>
    ${DISCLAIMER}`,

  Healthcare: `
    <h2>Executive Summary</h2>
    <p>Healthcare presents a defensive growth profile with structural tailwinds from aging demographics
    and an active FDA approval cycle. The pipeline identified a <strong style="color:#F0A500">NEUTRAL-to-OVERWEIGHT</strong>
    stance, with bifurcated opportunities between high-growth GLP-1 plays and defensive managed care.</p>
    <div class="metric-row">
      <div class="metric-box"><div class="m-label">Sector Signal</div><div class="m-value">NEUTRAL+</div></div>
      <div class="metric-box"><div class="m-label">Sector P/E</div><div class="m-value">18.2x</div></div>
      <div class="metric-box"><div class="m-label">vs Market P/E</div><div class="m-value up">-DISCOUNT</div></div>
    </div>
    <h2>Market Analyst Findings</h2>
    <p>Defensive sector characteristics with aging population tailwind. Policy uncertainty introduces
    near-term noise, but FDA approval pace is running above the 5-year average.</p>
    <ul>
      <li>Demographic tailwind: aging population drives structural demand growth</li>
      <li>FDA approvals above 5-year average -- pipeline conversion accelerating</li>
      <li>Policy risk: managed care reimbursement uncertainty weighs on UNH, CVS</li>
    </ul>
    <h2>Technical Analyst Findings</h2>
    <p>XLV is holding the 200-day MA -- a critical support level in the current macro environment.
    LLY shows exceptional relative strength versus the sector and SPY.</p>
    <ul>
      <li>XLV holding 200-day MA -- structural support intact</li>
      <li>LLY: clear outperformer, GLP-1 momentum reflected in price</li>
      <li>Biotech sub-sector recovering from Q1 selloff -- selective opportunity</li>
    </ul>
    <h2>Fundamental Analyst Findings</h2>
    <p>At 18.2x forward P/E, Healthcare trades at a discount to the broader market. LLY commands a
    significant premium driven by the GLP-1 pipeline; managed care trades at compression multiples
    on policy risk.</p>
    <ul>
      <li>Sector P/E 18.2x -- below market average, relative value opportunity</li>
      <li>LLY/NVO: premium valuations justified by GLP-1 addressable market</li>
      <li>UNH/CVS: P/E compression from policy overhang -- potential mean-reversion</li>
    </ul>
    <h2>Portfolio Strategy</h2>
    <p>Barbell approach: growth exposure via GLP-1 leaders, defensive ballast via managed care.</p>
    <ul>
      <li>LLY -- Core GLP-1 position, highest conviction growth name in sector</li>
      <li>NVO -- Secondary GLP-1 exposure with European market diversification</li>
      <li>UNH -- Defensive anchor, policy discount creates asymmetric risk/reward</li>
    </ul>
    ${DISCLAIMER}`,

  default: `
    <h2>Executive Summary</h2>
    <p>Analysis pipeline completed. The four-agent CrewAI pipeline processed macro, technical,
    fundamental, and strategic signals to produce this composite view.</p>
    <div class="metric-row">
      <div class="metric-box"><div class="m-label">Pipeline Status</div><div class="m-value up">COMPLETE</div></div>
      <div class="metric-box"><div class="m-label">Agents Run</div><div class="m-value">4 / 4</div></div>
      <div class="metric-box"><div class="m-label">Data Sources</div><div class="m-value">3</div></div>
    </div>
    <h2>Market Analyst</h2>
    <p>Macro and sentiment analysis complete. The agent processed macroeconomic indicators, Reddit
    community sentiment signals, and sector ETF performance relative to the SPY benchmark.</p>
    <h2>Technical Analyst</h2>
    <p>Technical evaluation of the sector ETF and top holdings complete. RSI, MACD, and moving average
    analysis produced key support/resistance levels and momentum signals.</p>
    <h2>Fundamental Analyst</h2>
    <p>Fundamental review including earnings multiples, revenue growth rates, and balance sheet quality
    complete. Valuations were benchmarked against 5-year historical averages and cross-sector peers.</p>
    <h2>Portfolio Strategy</h2>
    <p>The Investor Strategist synthesized all upstream signals into a directional stance and portfolio
    construction recommendations with an explicit risk management framework.</p>
    ${DISCLAIMER}`,
};
