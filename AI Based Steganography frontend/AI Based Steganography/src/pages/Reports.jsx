import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSearch,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  XCircle
} from 'lucide-react';

// ─── Colour helpers ────────────────────────────────────────────────────────
function resultColor(result) {
  if (result === 'Clean') return '#16a34a';
  if (result === 'Suspicious') return '#d97706';
  return '#dc2626';
}
function resultBg(result) {
  if (result === 'Clean') return '#f0fdf4';
  if (result === 'Suspicious') return '#fffbeb';
  return '#fef2f2';
}
function riskColor(level) {
  if (level === 'Low') return '#16a34a';
  if (level === 'Medium') return '#d97706';
  return '#dc2626';
}

// ─── Standalone HTML for the printed PDF ──────────────────────────────────
function buildPrintHtml(c) {
  const rc = resultColor(c.result);
  const rb = resultBg(c.result);
  const rk = riskColor(c.riskLevel);
  const generatedAt = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>StegXplore Report – ${c.id}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm 22mm 16mm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 10.5pt;
      color: #111827;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Letterhead */
    .lh { display:flex; justify-content:space-between; align-items:flex-start;
          border-bottom:3px solid #7c3aed; padding-bottom:12px; margin-bottom:18px; }
    .lh-org { font-size:18pt; font-weight:800; color:#7c3aed; letter-spacing:-0.5px; }
    .lh-sub { font-size:8pt; color:#6b7280; margin-top:2px; text-transform:uppercase; letter-spacing:.5px; }
    .lh-right { text-align:right; }
    .lh-label { font-size:7pt; color:#9ca3af; text-transform:uppercase; letter-spacing:.6px; }
    .lh-val { font-size:10pt; font-weight:700; color:#7c3aed; font-family:'Courier New',monospace; }

    /* Banner */
    .banner { background:linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%);
              color:#fff; padding:13px 18px; border-radius:6px; margin-bottom:18px; }
    .banner h1 { font-size:13pt; font-weight:800; letter-spacing:.3px; }
    .banner p  { font-size:8pt; opacity:.85; margin-top:3px; }

    /* Section title */
    .st { font-size:9.5pt; font-weight:700; color:#4b5563; text-transform:uppercase;
          letter-spacing:.7px; border-left:3px solid #7c3aed; padding-left:8px;
          margin:18px 0 10px; }

    /* Metadata grid */
    .mg { display:grid; grid-template-columns:1fr 1fr; border:1px solid #e5e7eb;
          border-radius:6px; overflow:hidden; margin-bottom:18px; }
    .mc { padding:10px 13px; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; }
    .mc:nth-child(2n) { border-right:none; }
    .mc:nth-last-child(-n+2) { border-bottom:none; }
    .ml { font-size:7pt; color:#9ca3af; text-transform:uppercase; letter-spacing:.5px; margin-bottom:2px; }
    .mv { font-size:10pt; font-weight:600; color:#111827; }

    /* Verdict row */
    .vr { display:grid; grid-template-columns:1fr 1fr 1fr; gap:11px; margin-bottom:18px; }
    .vc { border:1.5px solid #e5e7eb; border-radius:6px; padding:12px 13px; text-align:center; }
    .vl { font-size:7pt; color:#9ca3af; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
    .vv { font-size:15pt; font-weight:800; }

    /* Content block */
    .cb { border:1px solid #e5e7eb; border-radius:6px; padding:13px 15px;
          margin-bottom:14px; page-break-inside:avoid; }
    .cb p { font-size:10pt; line-height:1.65; color:#374151; }

    /* Disclaimer */
    .disc { background:#f9fafb; border:1px solid #d1d5db; border-radius:6px;
            padding:11px 14px; margin:16px 0 20px; page-break-inside:avoid; }
    .disc p { font-size:8pt; line-height:1.55; color:#6b7280; }

    /* Signature */
    .sr { display:grid; grid-template-columns:1fr 1fr; gap:28px;
          border-top:1.5px solid #e5e7eb; padding-top:14px; margin-top:24px; }
    .sl { border-top:1px solid #9ca3af; margin-top:28px; padding-top:4px;
          font-size:7.5pt; color:#6b7280; }

    /* Fixed footer */
    .pf { position:fixed; bottom:0; left:0; right:0; padding:5px 16mm;
          background:#fff; border-top:1px solid #e5e7eb;
          display:flex; justify-content:space-between; font-size:7pt; color:#9ca3af; }

    /* Watermark */
    .wm { position:fixed; top:50%; left:50%;
          transform:translate(-50%,-50%) rotate(-35deg);
          font-size:70pt; font-weight:900; color:rgba(124,58,237,0.04);
          white-space:nowrap; pointer-events:none; z-index:0; letter-spacing:8px; }
    .body-wrap { position:relative; z-index:1; }
  </style>
</head>
<body>
  <div class="wm">CONFIDENTIAL</div>
  <div class="body-wrap">

    <div class="lh">
      <div>
        <div class="lh-org">StegXplore AI</div>
        <div class="lh-sub">AI Forensic Multimedia Steganalysis Suite</div>
      </div>
      <div class="lh-right">
        <div class="lh-label">Case Reference</div>
        <div class="lh-val">${c.id}</div>
        <div class="lh-label" style="margin-top:5px;">Generated</div>
        <div style="font-size:8pt;color:#374151;">${generatedAt}</div>
      </div>
    </div>

    <div class="banner">
      <h1>STEGANOGRAPHY DETECTION REPORT</h1>
      <p>Digital Forensics &amp; Concealed Payload Examination &mdash; Strictly Confidential</p>
    </div>

    <div class="st">1. Case Identification</div>
    <div class="mg">
      <div class="mc"><div class="ml">Target File</div><div class="mv">${c.fileName}</div></div>
      <div class="mc"><div class="ml">File Size &amp; Domain</div><div class="mv">${c.fileSize} &bull; ${c.fileType}</div></div>
      <div class="mc"><div class="ml">Analysis Date &amp; Time</div><div class="mv">${c.dateFormatted}</div></div>
      <div class="mc"><div class="ml">Engine Status</div><div class="mv" style="color:#16a34a;">Completed</div></div>
    </div>

    <div class="st">2. Classification Outcome</div>
    <div class="vr">
      <div class="vc" style="background:${rb};border-color:${rc};">
        <div class="vl">Detection Result</div>
        <div class="vv" style="color:${rc};">${(c.result || '').toUpperCase()}</div>
      </div>
      <div class="vc">
        <div class="vl">AI Confidence Score</div>
        <div class="vv" style="color:#7c3aed;">${c.confidence}%</div>
      </div>
      <div class="vc" style="border-color:${rk};">
        <div class="vl">Risk Level</div>
        <div class="vv" style="color:${rk};">${c.riskLevel}</div>
      </div>
    </div>

    <div class="st">3. Statistical &amp; Forensic Findings</div>
    <div class="cb"><p>${c.findings}</p></div>

    <div class="st">4. Recommended Security Measures</div>
    <div class="cb"><p>${c.recommendation}</p></div>

    <div class="disc">
      <p><strong>Disclaimer:</strong> This report has been generated automatically by the StegXplore AI Forensic Engine and is intended solely for the authorised recipient. The findings are based on algorithmic analysis and should be reviewed by a qualified digital forensics professional before any legal or security action is taken. The organisation bears no liability for decisions made solely on the basis of this report without further human verification.</p>
    </div>

    <div class="sr">
      <div><div class="sl">Forensic Analyst Signature &amp; Date</div></div>
      <div><div class="sl">Authorising Officer Signature &amp; Date</div></div>
    </div>
  </div>

  <div class="pf">
    <span>StegXplore AI &mdash; Confidential Forensic Report</span>
    <span>Case: ${c.id} &nbsp;|&nbsp; ${generatedAt}</span>
  </div>
</body>
</html>`;
}

// ─── Print via hidden iframe (no web-app chrome in PDF) ──────────────────
function printReport(activeCase) {
  if (!activeCase) return;
  const html = buildPrintHtml(activeCase);

  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position: 'fixed', top: '-9999px', left: '-9999px',
    width: '210mm', height: '297mm', border: 'none', opacity: '0'
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open(); doc.write(html); doc.close();

  const cleanup = () => {
    setTimeout(() => { if (iframe.parentNode) document.body.removeChild(iframe); }, 1500);
  };

  iframe.contentWindow.onload = () => {
    setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); cleanup(); }, 300);
  };
  // Fallback
  setTimeout(() => {
    try { if (iframe.parentNode) { iframe.contentWindow.focus(); iframe.contentWindow.print(); cleanup(); } } catch (_) {}
  }, 900);
}

// ─── Export .txt ──────────────────────────────────────────────────────────
function exportTxt(activeCase) {
  if (!activeCase) return;
  const sep = '='.repeat(54);
  const sub = '-'.repeat(30);
  const lines = [
    'STEGXPLORE AI - DIGITAL FORENSIC ANALYSIS REPORT',
    sep, '',
    `Case Reference    : ${activeCase.id}`,
    `Target File       : ${activeCase.fileName}`,
    `File Size & Domain: ${activeCase.fileSize} / ${activeCase.fileType}`,
    `Analysis Date/Time: ${activeCase.dateFormatted}`,
    `Engine Status     : Completed`,
    '', 'CLASSIFICATION OUTCOME', sub,
    `Detection Result  : ${(activeCase.result || '').toUpperCase()}`,
    `AI Confidence     : ${activeCase.confidence}%`,
    `Risk Level        : ${activeCase.riskLevel}`,
    '', 'STATISTICAL & FORENSIC FINDINGS', sub, activeCase.findings,
    '', 'RECOMMENDED SECURITY MEASURES', sub, activeCase.recommendation,
    '', sep,
    'Report generated by StegXplore AI Forensic Engine.',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'SIGNATURES & AUTHORISATION', sub,
    'Forensic Analyst Signature & Date   : ___________________________',
    'Authorising Officer Signature & Date: ___________________________'
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `StegXplore_Report_${activeCase.id}.txt`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────
export default function Reports({ currentCase, allCases = [], onSelectCase, onNewScan }) {
  const [selectedCaseId, setSelectedCaseId] = useState(currentCase?.id || allCases[0]?.id || null);
  const activeCase = allCases.find((c) => c.id === selectedCaseId) || currentCase || allCases[0];

  const ResultIcon =
    activeCase?.result === 'Clean' ? CheckCircle2 :
    activeCase?.result === 'Suspicious' ? AlertTriangle : XCircle;

  if (!activeCase) {
    return (
      <div className="cyber-card empty-state">
        <div className="empty-state-icon"><FileSearch size={32} /></div>
        <h3>No Reports Available</h3>
        <p>Analyze a file first to generate a structured forensic evaluation report.</p>
        <button type="button" className="btn btn-primary" onClick={onNewScan}>Analyze a File</button>
      </div>
    );
  }

  const rc = resultColor(activeCase.result);
  const rb = resultBg(activeCase.result);
  const rk = riskColor(activeCase.riskLevel);

  // Helper: section heading style
  const sectionTitle = {
    fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.7px',
    borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px',
    marginBottom: '10px'
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>

      {/* Toolbar */}
      <div className="cyber-card" style={{ padding: '13px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Select Case:</span>
            <select
              className="form-select"
              style={{ width: 'auto', maxWidth: '340px' }}
              value={activeCase.id}
              onChange={(e) => {
                setSelectedCaseId(e.target.value);
                const chosen = allCases.find((c) => c.id === e.target.value);
                if (chosen) onSelectCase(chosen);
              }}
            >
              {allCases.map((c) => (
                <option key={c.id} value={c.id}>{c.id} — {c.fileName} ({c.result})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => printReport(activeCase)} title="Print / Save as PDF">
              <Printer size={15} /><span>Print / PDF</span>
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => exportTxt(activeCase)} title="Export plain-text report">
              <Download size={15} /><span>Export .TXT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report preview — matches print layout */}
      <div className="cyber-card" style={{ padding: '36px 38px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>

        {/* Letterhead */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid var(--color-primary)', paddingBottom: '14px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.3px' }}>StegXplore AI</span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              AI Forensic Multimedia Steganalysis Suite
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Case Reference</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{activeCase.id}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>{activeCase.dateFormatted}</div>
          </div>
        </div>

        {/* Title Banner */}
        <div
          className="report-title-banner"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #5b21b6 100%)',
            color: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '13px 18px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} className="report-title-icon" style={{ color: '#ffffff', flexShrink: 0 }} />
            <div>
              <h2 className="report-title-heading" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>STEGANOGRAPHY DETECTION REPORT</h2>
              <p className="report-title-sub" style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '2px' }}>Digital Forensics &amp; Concealed Payload Examination — Strictly Confidential</p>
            </div>
          </div>
        </div>

        {/* 1. Case Identification */}
        <div style={sectionTitle}>1. Case Identification</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '22px' }}>
          {[
            ['Target File', activeCase.fileName, false],
            ['File Size & Domain', `${activeCase.fileSize} · ${activeCase.fileType}`, false],
            ['Analysis Date & Time', activeCase.dateFormatted, false],
            ['Engine Status', 'Completed ✓', true],
          ].map(([label, val, isGreen], i) => (
            <div key={label} style={{ padding: '11px 13px', borderRight: i % 2 === 0 ? '1px solid var(--border-subtle)' : 'none', borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none' }}>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isGreen ? '#16a34a' : 'var(--text-primary)' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* 2. Classification Outcome */}
        <div style={sectionTitle}>2. Classification Outcome</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '22px' }}>
          <div className="report-outcome-card report-result-card" style={{ border: `1.5px solid ${rc}`, borderRadius: 'var(--radius-md)', padding: '14px', background: rb, textAlign: 'center' }}>
            <ResultIcon size={18} className="report-outcome-icon" style={{ color: rc, marginBottom: '5px' }} />
            <div className="report-card-label report-result-label" style={{ fontSize: '0.66rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Detection Result</div>
            <div className="report-result-value" style={{ fontSize: '1.15rem', fontWeight: 800, color: rc }}>{(activeCase.result || '').toUpperCase()}</div>
          </div>
          <div className="report-outcome-card" style={{ border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center' }}>
            <div className="report-card-label" style={{ fontSize: '0.66rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>AI Confidence</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-primary)' }}>{activeCase.confidence}%</div>
          </div>
          <div className="report-outcome-card" style={{ border: `1.5px solid ${rk}`, borderRadius: 'var(--radius-md)', padding: '14px', textAlign: 'center' }}>
            <div className="report-card-label" style={{ fontSize: '0.66rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Risk Level</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: rk }}>{activeCase.riskLevel}</div>
          </div>
        </div>

        {/* 3. Findings */}
        <div style={sectionTitle}>3. Statistical &amp; Forensic Findings</div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '13px 15px', marginBottom: '18px', background: 'var(--bg-surface)' }}>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>{activeCase.findings}</p>
        </div>

        {/* 4. Recommendation */}
        <div style={sectionTitle}>4. Recommended Security Measures</div>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '13px 15px', marginBottom: '22px', background: 'var(--bg-surface)' }}>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>{activeCase.recommendation}</p>
        </div>

        {/* Disclaimer */}
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '11px 14px', background: 'var(--bg-surface)', marginBottom: '22px' }}>
          <p style={{ fontSize: '0.74rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
            <strong>Disclaimer:</strong> This report is generated automatically by the StegXplore AI Forensic Engine and is intended solely for the authorised recipient. Findings are based on algorithmic analysis and should be reviewed by a qualified digital forensics professional before any legal or security action is taken.
          </p>
        </div>

        {/* Footer strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>StegXplore AI — Confidential Forensic Report</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{activeCase.id}</span>
        </div>
      </div>
    </div>
  );
}
