/* ============================================================
   PDF EXPORTER  — jsPDF text API (no html2canvas)
   Builds the PDF programmatically using jsPDF draw/text calls.
   This avoids all html2canvas DOM-capture issues (blank output,
   hidden-element bugs, flex/grid support gaps).
   ============================================================ */

// ── Resolved colors (RGB triples) ──────────────────────────
const HEADING = [30,  58,  95];
const WHITE   = [255, 255, 255];
const GREEN   = [22,  163,  74];
const AMBER   = [217, 119,   6];
const RED     = [220,  38,  38];
const TEXT    = [17,   24,  39];
const DIM     = [107, 114, 128];
const BORDER  = [209, 213, 219];
const CARDBG  = [249, 250, 251];
const METABG  = [241, 245, 249];

const ACTION_COLOR = {
  'LONG-BUY':       GREEN,
  'BUY':            GREEN,
  'HOLD':           AMBER,
  'WAIT-FOR-ENTRY': AMBER,
  'SHORT-SELL':     RED,
  'REDUCE':         RED,
  'AVOID':          RED,
};

const RISK_COLOR = {
  LOW:    GREEN, Low:    GREEN,
  MEDIUM: AMBER, Medium: AMBER,
  HIGH:   RED,   High:   RED, 'Very High': RED,
};

function fmtPrice(num) {
  return num != null ? `$${Number(num).toFixed(2)}` : '—';
}
function fmtPct(num) {
  return num != null ? `${Number(num).toFixed(1)}%` : '—';
}
function safeStr(val) {
  return String(val ?? '—');
}

// ── Page geometry ───────────────────────────────────────────
const PW = 210, PH = 297;
const ML = 14, MR = 14, MT = 14, MB = 14;
const CW = PW - ML - MR;  // 182 mm

// pt → mm factor for line-height math
const PT2MM = 0.352778;

/**
 * Wraps text to maxWidth, returns array of lines.
 * jsPDF's splitTextToSize already handles this but we centralise it here.
 */
function wrap(doc, text, maxW) {
  return doc.splitTextToSize(String(text ?? ''), maxW);
}

/**
 * Returns height (mm) that wrapped text will occupy.
 */
function textHeight(lines, fontSize, leading = 1.45) {
  return lines.length * fontSize * PT2MM * leading;
}

export async function exportToPdf(data, sector) {
  if (!data || data.parse_error) {
    window.print();
    return;
  }

  if (!window.jspdf?.jsPDF) {
    console.error('jsPDF not loaded');
    window.print();
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  // ── Helpers bound to doc ──────────────────────────────────
  let y = MT;

  function newPage() {
    doc.addPage();
    y = MT;
  }

  /** Ensure at least `needed` mm remain before bottom margin; add page if not. */
  function ensureSpace(needed) {
    if (y + needed > PH - MB) newPage();
  }

  function setC(rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
  function setF(rgb) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
  function setD(rgb) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }

  function txt(text, x, opts) {
    doc.text(String(text ?? ''), x, y, opts);
  }

  /**
   * Print wrapped text starting at current y.
   * Advances y by the rendered height and returns number of lines.
   */
  function printWrapped(text, x, maxW, fontSize, style, rgb, leading = 1.45) {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style || 'normal');
    setC(rgb || TEXT);
    const lines = wrap(doc, text, maxW);
    doc.text(lines, x, y);
    y += textHeight(lines, fontSize, leading);
    return lines.length;
  }

  // ── Extract data ─────────────────────────────────────────
  const riskLevel      = safeStr(data.risk_level ?? data.overall_risk_level ?? '—');
  const riskRgb        = RISK_COLOR[riskLevel] ?? DIM;
  const positions      = data.positions ?? data.stock_recommendations ?? [];
  const totalAllocated = data.total_allocated_pct ?? null;
  const cashReserve    = data.cash_reserve_pct    ?? null;
  const strategy       = data.overall_strategy
                      ?? data.portfolio_summary?.portfolio_rationale
                      ?? '';
  const activeCount    = positions.filter(
    p => !['AVOID', 'HOLD'].includes(p.action ?? p.recommendation)
  ).length;
  const dateStr = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

  // ══════════════════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════════════════
  const headerH = 18;
  setF(HEADING); setD(HEADING);
  doc.roundedRect(ML, y, CW, headerH, 2, 2, 'F');

  setC(WHITE);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text('ProspectAI', ML + 4, y + 7.5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text('Intelligence Report', ML + 4, y + 13.5);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text(safeStr(sector), ML + CW - 3, y + 7.5, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(dateStr, ML + CW - 3, y + 13.5, { align: 'right' });

  y += headerH + 7;

  // ══════════════════════════════════════════════════════════
  // SECTION HEADING helper
  // ══════════════════════════════════════════════════════════
  function sectionHeading(title) {
    ensureSpace(10);
    setC(HEADING);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(title.toUpperCase(), ML, y);
    y += 1.5;
    setD(HEADING); doc.setLineWidth(0.5);
    doc.line(ML, y, ML + CW, y);
    y += 5;
  }

  // ══════════════════════════════════════════════════════════
  // EXECUTIVE SUMMARY — 4-cell metrics row
  // ══════════════════════════════════════════════════════════
  sectionHeading('Executive Summary');

  const metrics = [
    { label: 'Risk Level',     value: riskLevel,               rgb: riskRgb  },
    { label: 'Active / Total', value: `${activeCount} / ${positions.length}`, rgb: TEXT   },
    { label: 'Allocated',      value: fmtPct(totalAllocated),  rgb: GREEN    },
    { label: 'Cash Reserve',   value: fmtPct(cashReserve),     rgb: DIM      },
  ];

  const boxW = (CW - 3 * 3) / 4;  // 4 boxes, 3mm gap each
  const boxH = 14;

  metrics.forEach((m, i) => {
    const bx = ML + i * (boxW + 3);
    setF(WHITE); setD(BORDER); doc.setLineWidth(0.25);
    doc.roundedRect(bx, y, boxW, boxH, 1.5, 1.5, 'FD');

    setC(DIM);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(m.label.toUpperCase(), bx + boxW / 2, y + 4.5, { align: 'center' });

    setC(m.rgb);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text(m.value, bx + boxW / 2, y + 10.5, { align: 'center' });
  });

  y += boxH + 8;

  // ══════════════════════════════════════════════════════════
  // PORTFOLIO STRATEGY
  // ══════════════════════════════════════════════════════════
  if (strategy) {
    sectionHeading('Portfolio Strategy');
    const stratLines = wrap(doc, strategy, CW);
    const stratH = textHeight(stratLines, 9, 1.5);
    ensureSpace(stratH + 2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setC(TEXT);
    doc.text(stratLines, ML, y);
    y += stratH + 8;
  }

  // ══════════════════════════════════════════════════════════
  // POSITION RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════
  sectionHeading('Position Recommendations');

  if (positions.length === 0) {
    printWrapped('No positions available.', ML, CW, 9, 'normal', DIM);
  }

  positions.forEach((pos) => {
    const action     = safeStr(pos.action ?? pos.recommendation ?? '—');
    const actionRgb  = ACTION_COLOR[action] ?? DIM;
    const ts         = pos.trade_setup;
    const entryZone  = ts
      ? `$${Number(ts.entry_zone_low).toFixed(2)} – $${Number(ts.entry_zone_high).toFixed(2)}`
      : (pos.entry_zone ?? '—');
    const stopLoss   = ts ? fmtPrice(ts.stop_loss)   : (pos.stop_loss   != null ? fmtPrice(pos.stop_loss)   : '—');
    const takeProfit = ts ? fmtPrice(ts.take_profit) : '—';
    const alloc      = (pos.allocation_pct ?? 0) > 0
      ? `${Number(pos.allocation_pct).toFixed(1)}%` : '—';
    const curPrice   = pos.current_price != null ? fmtPrice(pos.current_price) : '—';
    const reviewFreq = safeStr(pos.review_frequency ?? '—').replace(/_/g, ' ');

    // Pre-compute wrapped text heights for ensureSpace
    const rationaleLines   = pos.rationale ? wrap(doc, pos.rationale, CW - 4) : [];
    const triggerLines     = (pos.monitoring_triggers ?? []);
    const riskLines        = (pos.key_risks ?? []);

    const cardH = 10           // ticker row
      + 14                     // trade params row
      + (rationaleLines.length > 0 ? textHeight(rationaleLines, 9, 1.5) + 4 : 0)
      + (triggerLines.length > 0 ? 5 + triggerLines.length * 4.5 + 4 : 0)
      + (riskLines.length > 0    ? 5 + riskLines.length   * 4.5 + 4 : 0)
      + 6;                     // bottom padding

    ensureSpace(cardH);

    const cardTop = y;

    // Card background
    setF(CARDBG); setD(BORDER); doc.setLineWidth(0.25);
    // We'll draw this rect AFTER calculating the actual height

    // ── Ticker + action + allocation row ─────────────────
    y += 5; // inner top padding

    // Ticker
    setC(HEADING);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text(safeStr(pos.ticker), ML + 3, y);
    const tickerW = doc.getTextWidth(safeStr(pos.ticker)) + 4;

    // Action badge (inline text)
    setC(actionRgb);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(action, ML + 3 + tickerW, y);

    // Allocation (right-aligned)
    if (alloc !== '—') {
      setC(GREEN);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text(alloc, ML + CW - 3, y, { align: 'right' });
    }

    // Review frequency (below allocation)
    setC(DIM);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text(reviewFreq, ML + CW - 3, y + 4.5, { align: 'right' });

    y += 8;

    // ── Trade parameters: 5 columns ──────────────────────
    const params = [
      { label: 'Current Price', value: curPrice   },
      { label: 'Entry Zone',    value: entryZone  },
      { label: 'Stop Loss',     value: stopLoss   },
      { label: 'Take Profit',   value: takeProfit },
    ];
    const pBoxW = (CW - 4 - 3 * 3) / 4;
    const pBoxH = 11;

    params.forEach((p, i) => {
      const bx = ML + 2 + i * (pBoxW + 3);
      setF(WHITE); setD(BORDER); doc.setLineWidth(0.2);
      doc.roundedRect(bx, y, pBoxW, pBoxH, 1, 1, 'FD');

      setC(DIM);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
      doc.text(p.label.toUpperCase(), bx + pBoxW / 2, y + 3.5, { align: 'center' });

      setC(TEXT);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
      doc.text(safeStr(p.value), bx + pBoxW / 2, y + 8.5, { align: 'center' });
    });

    y += pBoxH + 4;

    // ── Rationale ────────────────────────────────────────
    if (rationaleLines.length > 0) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setC(TEXT);
      doc.text(rationaleLines, ML + 3, y);
      y += textHeight(rationaleLines, 9, 1.5) + 4;
    }

    // ── Monitoring Triggers ──────────────────────────────
    if (triggerLines.length > 0) {
      setC(DIM);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      doc.text('MONITORING TRIGGERS', ML + 3, y);
      y += 4.5;

      triggerLines.forEach(t => {
        ensureSpace(5);
        setC(TEXT);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
        const tLines = wrap(doc, `• ${t}`, CW - 6);
        doc.text(tLines, ML + 5, y);
        y += textHeight(tLines, 8.5, 1.4);
      });
      y += 3;
    }

    // ── Key Risks ────────────────────────────────────────
    if (riskLines.length > 0) {
      setC(DIM);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      doc.text('KEY RISKS', ML + 3, y);
      y += 4.5;

      riskLines.forEach(r => {
        ensureSpace(5);
        setC(TEXT);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
        const rLines = wrap(doc, `• ${r}`, CW - 6);
        doc.text(rLines, ML + 5, y);
        y += textHeight(rLines, 8.5, 1.4);
      });
      y += 3;
    }

    y += 3; // bottom padding inside card

    // Draw the card rect now that we know the actual height
    const cardActualH = y - cardTop;
    setF(CARDBG); setD(BORDER); doc.setLineWidth(0.25);
    // Paint it behind the text — jsPDF doesn't have z-index, so we can't go back.
    // Instead draw only the border (stroke only), as background was painted before text.
    doc.roundedRect(ML, cardTop, CW, cardActualH, 2, 2, 'S');

    y += 5; // gap between cards
  });

  // ══════════════════════════════════════════════════════════
  // DISCLAIMER
  // ══════════════════════════════════════════════════════════
  const disclaimer =
    'DISCLAIMER: This report was generated autonomously by an AI multi-agent system ' +
    'for the sole purpose of demonstrating agentic pipeline architecture. It does NOT ' +
    'constitute investment advice. Always consult a licensed financial professional ' +
    'before making investment decisions.';
  const dLines = wrap(doc, disclaimer, CW - 8);
  const dH     = textHeight(dLines, 7.5, 1.5) + 8;

  ensureSpace(dH);

  setF(CARDBG); setD(BORDER); doc.setLineWidth(0.25);
  doc.roundedRect(ML, y, CW, dH, 2, 2, 'FD');
  y += 5;
  setC(DIM);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text(dLines, ML + 4, y);

  // ── Save ────────────────────────────────────────────────
  const safeSector = (sector || 'Report').replace(/[\s/\\]+/g, '_');
  const dateShort  = new Date().toISOString().slice(0, 10);
  doc.save(`ProspectAI_${safeSector}_${dateShort}.pdf`);
}
