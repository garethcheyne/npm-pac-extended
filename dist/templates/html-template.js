"use strict";
/**
 * Shared HTML Report Templates
 *
 * Provides consistent styling and branding across all HTML reports
 * Theme: Microsoft Power Platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TAB_SCRIPT = exports.CSS_FOOTER = exports.CSS_BADGES = exports.CSS_TABS = exports.CSS_CATEGORIES = exports.CSS_TABLES = exports.CSS_CARDS = exports.CSS_HEADER = exports.CSS_BASE = exports.CSS_VARIABLES = void 0;
exports.getAllStyles = getAllStyles;
exports.generateHeader = generateHeader;
exports.generateFooter = generateFooter;
exports.generateHtmlDocument = generateHtmlDocument;
exports.generateSummaryCards = generateSummaryCards;
exports.generateTable = generateTable;
// Official Microsoft Power Platform Logo SVG - embedded for HTML reports
const LOGO_SVG = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 20 19" style="enable-background:new 0 0 20 19;" xml:space="preserve">
<style type="text/css">
	.st0{fill:#FFFFFF;filter:url(#Adobe_OpacityMaskFilter);}
	.st1{mask:url(#mask0_524_15785_00000157278166757378377780000015220603436856830396_);}
	.st2{fill:url(#SVGID_1_);}
	.st3{fill:url(#SVGID_00000158714616684661661410000014526746546123167642_);}
	.st4{fill:url(#SVGID_00000002371003867478512760000011024119486672247176_);}
	.st5{fill-opacity:0.24;}
	.st6{fill-opacity:0.32;}
	.st7{fill:url(#SVGID_00000121269142472131142040000018144151241904442553_);}
	.st8{opacity:0.7;fill:url(#SVGID_00000035489417531337516490000014809947321285521286_);enable-background:new    ;}
</style>
<defs>
	<filter id="Adobe_OpacityMaskFilter" filterUnits="userSpaceOnUse" x="2.1" y="1.1" width="15.5" height="16.2">
		<feColorMatrix  type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
	</filter>
</defs>
<mask maskUnits="userSpaceOnUse" x="2.1" y="1.1" width="15.5" height="16.2" id="mask0_524_15785_00000157278166757378377780000015220603436856830396_">
	<path class="st0" d="M7.9,1.1h7c2,0,3.2,2,2.4,3.8l0.1-0.3L15,9.5c0,0,0,0,0,0l-0.4,0.8L15,9.6c-0.4,0.9-1.4,1.5-2.4,1.5H8.4l-3,6
		c-0.2,0.5-0.9,0.5-1.1,0l-2.1-4.2c-0.2-0.4-0.2-0.8,0-1.1l2.3-4.6c0.2-0.4,0.7-0.7,1.1-0.7h8.8C14,6,13.3,5.7,12.6,5.7H6.2
		c-0.5,0-0.8-0.5-0.6-0.9l1.7-3.3C7.5,1.2,7.7,1.1,7.9,1.1z"/>
</mask>
<g class="st1">
	<linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="4.9354" y1="9.4639" x2="6.7063" y2="2.7347" gradientTransform="matrix(1 0 0 -1 0 20)">
		<stop  offset="0" style="stop-color:#159455"/>
		<stop  offset="1" style="stop-color:#3FBDA9"/>
	</linearGradient>
	<path class="st2" d="M3.3,11h5.1l-3,6c-0.2,0.5-0.9,0.5-1.1,0l-2.1-4.2C1.8,12,2.4,11,3.3,11z"/>
	<linearGradient id="SVGID_00000177482085251300230860000003997474521748523938_" gradientUnits="userSpaceOnUse" x1="5.9391" y1="18.3394" x2="16.2129" y2="13.7717" gradientTransform="matrix(1 0 0 -1 0 20)">
		<stop  offset="0" style="stop-color:#23A794"/>
		<stop  offset="0.5684" style="stop-color:#007A84"/>
		<stop  offset="1" style="stop-color:#005158"/>
	</linearGradient>
	<path style="fill:url(#SVGID_00000177482085251300230860000003997474521748523938_);" d="M7.9,1.1h7c2,0,3.3,2.1,2.4,3.8L15,9.5
		c0,0,0,0,0,0l-0.4,0.8L15,9.5c0.8-1.8-0.4-3.8-2.4-3.8H6.2c-0.5,0-0.8-0.5-0.6-0.9l1.7-3.3C7.5,1.2,7.7,1.1,7.9,1.1z"/>
	<linearGradient id="SVGID_00000091715884692297204420000011908570014893718677_" gradientUnits="userSpaceOnUse" x1="13.1727" y1="11.6202" x2="11.3134" y2="16.49" gradientTransform="matrix(1 0 0 -1 0 20)">
		<stop  offset="0" style="stop-color:#004A8B"/>
		<stop  offset="0.4056" style="stop-color:#105DA8;stop-opacity:0.5002"/>
		<stop  offset="1" style="stop-color:#2170C6;stop-opacity:0"/>
	</linearGradient>
	<path style="fill:url(#SVGID_00000091715884692297204420000011908570014893718677_);" d="M7.9,1.1h7c2,0,3.3,2.1,2.4,3.8L15,9.5
		c0,0,0,0,0,0L14.8,10L15,9.5c0.9-1.8-0.4-3.8-2.4-3.8H6.2c-0.5,0-0.8-0.5-0.6-0.9l1.7-3.3C7.5,1.2,7.7,1.1,7.9,1.1z"/>
	<g>
		<path class="st5" d="M12.6,11.1H3.3c-0.5,0-0.9,0.3-1.1,0.7l2.3-4.6c0.2-0.4,0.7-0.7,1.1-0.7h9.3c1,0,1.9-0.6,2.4-1.5l0.2-0.3
			L15,9.6C14.5,10.5,13.6,11.1,12.6,11.1z"/>
	</g>
	<g>
		<path class="st6" d="M12.6,11.4H3.3c-0.5,0-0.9,0.3-1.1,0.7l2.3-4.6C4.7,7,5.2,6.8,5.6,6.8h9.3c1,0,1.9-0.6,2.4-1.5L17.4,5L15,9.9
			C14.5,10.8,13.6,11.4,12.6,11.4z"/>
	</g>
	<linearGradient id="SVGID_00000029746480936040750840000000429303484663293837_" gradientUnits="userSpaceOnUse" x1="5.1362" y1="14.1387" x2="14.433" y2="9.5345" gradientTransform="matrix(1 0 0 -1 0 20)">
		<stop  offset="0" style="stop-color:#7FD9A2"/>
		<stop  offset="0.1961" style="stop-color:#47BF79"/>
		<stop  offset="0.7139" style="stop-color:#009280"/>
		<stop  offset="1" style="stop-color:#007A84"/>
	</linearGradient>
	<path style="fill:url(#SVGID_00000029746480936040750840000000429303484663293837_);" d="M12.6,11H3.3c-0.5,0-0.9,0.3-1.1,0.7
		l2.3-4.6c0.2-0.4,0.7-0.7,1.1-0.7h9.3c1,0,1.9-0.6,2.4-1.5l0.2-0.3L15,9.6C14.5,10.5,13.6,11,12.6,11z"/>
	<linearGradient id="SVGID_00000021809929754008343390000012737265104294235267_" gradientUnits="userSpaceOnUse" x1="5.0676" y1="13.9756" x2="7.1926" y2="12.9131" gradientTransform="matrix(1 0 0 -1 0 20)">
		<stop  offset="0" style="stop-color:#A8E47C;stop-opacity:0.86"/>
		<stop  offset="0.3675" style="stop-color:#87D152;stop-opacity:0.2"/>
		<stop  offset="1" style="stop-color:#58BE5A;stop-opacity:0"/>
	</linearGradient>
	<path style="opacity:0.7;fill:url(#SVGID_00000021809929754008343390000012737265104294235267_);enable-background:new    ;" d="
		M12.6,11H3.4c-0.5,0-0.9,0.3-1.1,0.7l2.3-4.6c0.2-0.4,0.7-0.7,1.1-0.7H15c1,0,1.9-0.5,2.3-1.4L15,9.6C14.5,10.5,13.6,11,12.6,11z"/>
</g>
</svg>`;
/**
 * CSS variables and base styles used across all reports
 * Theme: Microsoft Power Platform
 */
exports.CSS_VARIABLES = `
  :root {
    --pp-teal: #046963;
    --pp-teal-light: #038387;
    --pp-teal-dark: #034d49;
    --pp-purple: #742774;
    --pp-blue: #0078D4;
    --match: #107c10;
    --differ: #ffaa44;
    --missing: #d13438;
    --extra: #8764b8;
    --info: #0078D4;
    --bg: #1b1b1b;
    --bg-card: #2d2d2d;
    --bg-header: linear-gradient(135deg, #046963 0%, #034d49 50%, #032b29 100%);
    --text: #f3f3f3;
    --text-dim: #a0a0a0;
    --text-bright: #ffffff;
    --border: #404040;
    --accent: #038387;
  }
`;
/**
 * Base CSS styles for all reports
 */
exports.CSS_BASE = `
  ${exports.CSS_VARIABLES}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    padding: 20px;
  }
  .container {
    max-width: 1400px;
    margin: 0 auto;
  }
  a {
    color: var(--accent);
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
`;
/**
 * Header styles with logo
 */
exports.CSS_HEADER = `
  .report-header {
    background: var(--bg-header);
    border-radius: 12px;
    padding: 24px 32px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }
  .header-left {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .header-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .header-logo svg {
    height: 48px;
    width: auto;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }
  .header-logo-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .logo-title {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-bright);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  .logo-subtitle {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
  }
  .header-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-bright);
    margin: 0;
  }
  .header-subtitle {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.8);
  }
  .header-meta {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .meta-badge {
    background: rgba(255,255,255,0.15);
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.9);
    backdrop-filter: blur(4px);
  }
  .meta-badge strong {
    color: #fff;
  }
`;
/**
 * Card and summary styles
 */
exports.CSS_CARDS = `
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }
  .summary-card {
    background: var(--bg-card);
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    border-left: 4px solid var(--border);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .summary-card.match { border-left-color: var(--match); }
  .summary-card.differ { border-left-color: var(--differ); }
  .summary-card.missing { border-left-color: var(--missing); }
  .summary-card.extra { border-left-color: var(--extra); }
  .summary-card.info { border-left-color: var(--info); }
  .summary-card.danger { border-left-color: var(--missing); }
  .summary-card.warning { border-left-color: var(--differ); }
  .card-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-bright);
  }
  .card-label {
    font-size: 0.75rem;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }
  .summary-card.danger .card-value { color: var(--missing); }
  .summary-card.warning .card-value { color: var(--differ); }
  .summary-card.match .card-value { color: var(--match); }
`;
/**
 * Table styles
 */
exports.CSS_TABLES = `
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 0.875rem;
  }
  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }
  th {
    background: rgba(0,0,0,0.3);
    color: var(--text-dim);
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: sticky;
    top: 0;
  }
  tr:hover {
    background: rgba(4, 105, 99, 0.1);
  }
  .status-match { color: var(--match); }
  .status-differ { color: var(--differ); }
  .status-missing { color: var(--missing); }
  .status-extra { color: var(--extra); }
  .status-enabled { color: var(--match); }
  .status-disabled { color: var(--missing); }
`;
/**
 * Collapsible category/section styles
 */
exports.CSS_CATEGORIES = `
  .category {
    background: var(--bg-card);
    border-radius: 8px;
    margin-bottom: 12px;
    overflow: hidden;
  }
  .category > summary {
    background: rgba(4, 105, 99, 0.15);
    padding: 12px 16px;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    list-style: none;
    user-select: none;
    transition: background 0.2s;
  }
  .category > summary::-webkit-details-marker { display: none; }
  .category > summary::before {
    content: '▶';
    display: inline-block;
    margin-right: 8px;
    font-size: 0.7rem;
    transition: transform 0.2s;
  }
  .category[open] > summary::before { transform: rotate(90deg); }
  .category > summary:hover { background: rgba(4, 105, 99, 0.25); }
  .category-content {
    padding: 0 16px 16px;
  }
  .category-stats {
    display: flex;
    gap: 8px;
    font-size: 0.75rem;
  }
  .stat-badge {
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
  }
  .stat-match { background: rgba(16, 124, 16, 0.2); color: var(--match); }
  .stat-differ { background: rgba(255, 170, 68, 0.2); color: var(--differ); }
  .stat-missing { background: rgba(209, 52, 56, 0.2); color: var(--missing); }
  .stat-extra { background: rgba(135, 100, 184, 0.2); color: var(--extra); }
`;
/**
 * Tab styles for tabbed content
 */
exports.CSS_TABS = `
  .tabs {
    display: flex;
    gap: 8px;
    margin: 20px 0;
    border-bottom: 2px solid var(--border);
    padding-bottom: 8px;
    flex-wrap: wrap;
  }
  .tab {
    padding: 10px 20px;
    background: var(--bg-card);
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    border-radius: 8px 8px 0 0;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s;
  }
  .tab.active {
    background: var(--accent);
    color: #fff;
  }
  .tab:hover:not(.active) {
    background: rgba(4, 105, 99, 0.2);
    color: var(--text);
  }
  .tab-content {
    display: none;
  }
  .tab-content.active {
    display: block;
  }
`;
/**
 * Badge and tag styles
 */
exports.CSS_BADGES = `
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    margin: 2px;
  }
  .badge-match { background: rgba(16, 124, 16, 0.2); color: var(--match); }
  .badge-differ { background: rgba(255, 170, 68, 0.2); color: var(--differ); }
  .badge-missing { background: rgba(209, 52, 56, 0.2); color: var(--missing); }
  .badge-extra { background: rgba(135, 100, 184, 0.2); color: var(--extra); }
  .badge-info { background: rgba(0, 120, 212, 0.2); color: var(--info); }
  .badge-admin { background: var(--missing); color: #fff; }
  .badge-customizer { background: var(--differ); color: #000; }
  .badge-mailbox { background: var(--info); color: #fff; }
`;
/**
 * Footer styles
 */
exports.CSS_FOOTER = `
  .report-footer {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    text-align: center;
    color: var(--text-dim);
    font-size: 0.8rem;
  }
  .report-footer a {
    color: var(--accent);
  }
`;
/**
 * Combine all CSS
 */
function getAllStyles() {
    return `
    ${exports.CSS_BASE}
    ${exports.CSS_HEADER}
    ${exports.CSS_CARDS}
    ${exports.CSS_TABLES}
    ${exports.CSS_CATEGORIES}
    ${exports.CSS_TABS}
    ${exports.CSS_BADGES}
    ${exports.CSS_FOOTER}
  `;
}
/**
 * Generates the HTML header with logo and metadata
 */
function generateHeader(options) {
    const timestamp = options.timestamp || new Date().toLocaleString();
    let metaBadges = `<span class="meta-badge">Generated: <strong>${timestamp}</strong></span>`;
    if (options.environment) {
        metaBadges += `<span class="meta-badge">Environment: <strong>${options.environment}</strong></span>`;
    }
    if (options.masterEnvironment) {
        metaBadges += `<span class="meta-badge">Master: <strong>${options.masterEnvironment}</strong></span>`;
    }
    if (options.targetEnvironments && options.targetEnvironments.length > 0) {
        metaBadges += `<span class="meta-badge">Targets: <strong>${options.targetEnvironments.join(', ')}</strong></span>`;
    }
    if (options.isDeepAudit) {
        metaBadges += `<span class="meta-badge" style="background: rgba(168, 85, 247, 0.3);">🔍 Deep Audit</span>`;
    }
    return `
    <header class="report-header">
      <div class="header-left">
        <div class="header-logo">
          ${LOGO_SVG}
          <div class="header-logo-text">
            <span class="logo-title">Power Platform</span>
            <span class="logo-subtitle">PAC-Extended Audit Report</span>
          </div>
        </div>
        <h1 class="header-title">${options.title}</h1>
        ${options.subtitle ? `<p class="header-subtitle">${options.subtitle}</p>` : ''}
      </div>
      <div class="header-meta">
        ${metaBadges}
      </div>
    </header>
  `;
}
/**
 * Generates the HTML footer
 */
function generateFooter() {
    return `
    <footer class="report-footer">
      <p>Generated by <a href="https://github.com/garethcheyne/npm-pac-extended" target="_blank">PAC-Extended</a> • 
         Power Platform CLI Wrapper</p>
    </footer>
  `;
}
/**
 * JavaScript for tab switching
 */
exports.TAB_SCRIPT = `
  <script>
    function showTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
      document.getElementById('tab-' + tabId).classList.add('active');
      event.target.classList.add('active');
    }

    function toggleDisabledUsers() {
      const checkbox = document.getElementById('hideDisabled');
      const hideDisabled = checkbox ? checkbox.checked : false;
      document.querySelectorAll('tr[data-disabled]').forEach(row => {
        if (hideDisabled && row.getAttribute('data-disabled') === 'true') {
          row.style.display = 'none';
        } else {
          row.style.display = '';
        }
      });
    }
  </script>
`;
/**
 * Generates a complete HTML document
 */
function generateHtmlDocument(options, bodyContent) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>${getAllStyles()}</style>
</head>
<body>
  <div class="container">
    ${generateHeader(options)}
    ${bodyContent}
    ${generateFooter()}
  </div>
  ${exports.TAB_SCRIPT}
</body>
</html>`;
}
/**
 * Helper to generate summary cards
 */
function generateSummaryCards(cards) {
    return `
    <div class="summary-cards">
      ${cards.map(card => `
        <div class="summary-card ${card.type || ''}">
          <div class="card-value">${card.value}</div>
          <div class="card-label">${card.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}
/**
 * Helper to generate a data table
 */
function generateTable(headers, rows, options) {
    return `
    <table class="${options?.className || ''}">
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
//# sourceMappingURL=html-template.js.map