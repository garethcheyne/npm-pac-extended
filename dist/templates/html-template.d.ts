/**
 * Shared HTML Report Templates
 *
 * Provides consistent styling and branding across all HTML reports
 * Theme: Microsoft Power Platform
 */
export interface HtmlTemplateOptions {
    title: string;
    subtitle?: string;
    timestamp?: string;
    environment?: string;
    masterEnvironment?: string;
    targetEnvironments?: string[];
    isDeepAudit?: boolean;
}
/**
 * CSS variables and base styles used across all reports
 * Theme: Microsoft Power Platform
 */
export declare const CSS_VARIABLES = "\n  :root {\n    --pp-teal: #046963;\n    --pp-teal-light: #038387;\n    --pp-teal-dark: #034d49;\n    --pp-purple: #742774;\n    --pp-blue: #0078D4;\n    --match: #107c10;\n    --differ: #ffaa44;\n    --missing: #d13438;\n    --extra: #8764b8;\n    --info: #0078D4;\n    --bg: #1b1b1b;\n    --bg-card: #2d2d2d;\n    --bg-header: linear-gradient(135deg, #046963 0%, #034d49 50%, #032b29 100%);\n    --text: #f3f3f3;\n    --text-dim: #a0a0a0;\n    --text-bright: #ffffff;\n    --border: #404040;\n    --accent: #038387;\n  }\n";
/**
 * Base CSS styles for all reports
 */
export declare const CSS_BASE = "\n  \n  :root {\n    --pp-teal: #046963;\n    --pp-teal-light: #038387;\n    --pp-teal-dark: #034d49;\n    --pp-purple: #742774;\n    --pp-blue: #0078D4;\n    --match: #107c10;\n    --differ: #ffaa44;\n    --missing: #d13438;\n    --extra: #8764b8;\n    --info: #0078D4;\n    --bg: #1b1b1b;\n    --bg-card: #2d2d2d;\n    --bg-header: linear-gradient(135deg, #046963 0%, #034d49 50%, #032b29 100%);\n    --text: #f3f3f3;\n    --text-dim: #a0a0a0;\n    --text-bright: #ffffff;\n    --border: #404040;\n    --accent: #038387;\n  }\n\n  * { box-sizing: border-box; margin: 0; padding: 0; }\n  body {\n    font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;\n    font-size: 14px;\n    background: var(--bg);\n    color: var(--text);\n    line-height: 1.6;\n    padding: 20px;\n  }\n  .container {\n    max-width: 1400px;\n    margin: 0 auto;\n  }\n  a {\n    color: var(--accent);\n    text-decoration: none;\n  }\n  a:hover {\n    text-decoration: underline;\n  }\n";
/**
 * Header styles with logo
 */
export declare const CSS_HEADER = "\n  .report-header {\n    background: var(--bg-header);\n    border-radius: 12px;\n    padding: 24px 32px;\n    margin-bottom: 24px;\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    flex-wrap: wrap;\n    gap: 16px;\n  }\n  .header-left {\n    display: flex;\n    flex-direction: column;\n    gap: 8px;\n  }\n  .header-logo {\n    display: flex;\n    align-items: center;\n    gap: 12px;\n  }\n  .header-logo svg {\n    height: 48px;\n    width: auto;\n    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));\n  }\n  .header-logo-text {\n    display: flex;\n    flex-direction: column;\n    gap: 2px;\n  }\n  .logo-title {\n    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;\n    font-size: 1.1rem;\n    font-weight: 600;\n    color: var(--text-bright);\n    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);\n  }\n  .logo-subtitle {\n    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;\n    font-size: 0.75rem;\n    color: rgba(255, 255, 255, 0.8);\n  }\n  .header-title {\n    font-size: 1.5rem;\n    font-weight: 700;\n    color: var(--text-bright);\n    margin: 0;\n  }\n  .header-subtitle {\n    font-size: 0.9rem;\n    color: rgba(255,255,255,0.8);\n  }\n  .header-meta {\n    display: flex;\n    gap: 12px;\n    flex-wrap: wrap;\n  }\n  .meta-badge {\n    background: rgba(255,255,255,0.15);\n    padding: 6px 12px;\n    border-radius: 6px;\n    font-size: 0.8rem;\n    color: rgba(255,255,255,0.9);\n    backdrop-filter: blur(4px);\n  }\n  .meta-badge strong {\n    color: #fff;\n  }\n";
/**
 * Card and summary styles
 */
export declare const CSS_CARDS = "\n  .summary-cards {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));\n    gap: 12px;\n    margin-bottom: 24px;\n  }\n  .summary-card {\n    background: var(--bg-card);\n    border-radius: 8px;\n    padding: 16px;\n    text-align: center;\n    border-left: 4px solid var(--border);\n    transition: transform 0.2s, box-shadow 0.2s;\n  }\n  .summary-card:hover {\n    transform: translateY(-2px);\n    box-shadow: 0 4px 12px rgba(0,0,0,0.3);\n  }\n  .summary-card.match { border-left-color: var(--match); }\n  .summary-card.differ { border-left-color: var(--differ); }\n  .summary-card.missing { border-left-color: var(--missing); }\n  .summary-card.extra { border-left-color: var(--extra); }\n  .summary-card.info { border-left-color: var(--info); }\n  .summary-card.danger { border-left-color: var(--missing); }\n  .summary-card.warning { border-left-color: var(--differ); }\n  .card-value {\n    font-size: 2rem;\n    font-weight: 700;\n    color: var(--text-bright);\n  }\n  .card-label {\n    font-size: 0.75rem;\n    color: var(--text-dim);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n    margin-top: 4px;\n  }\n  .summary-card.danger .card-value { color: var(--missing); }\n  .summary-card.warning .card-value { color: var(--differ); }\n  .summary-card.match .card-value { color: var(--match); }\n";
/**
 * Table styles
 */
export declare const CSS_TABLES = "\n  table {\n    width: 100%;\n    border-collapse: collapse;\n    margin: 16px 0;\n    font-size: 0.875rem;\n  }\n  th, td {\n    padding: 12px 16px;\n    text-align: left;\n    border-bottom: 1px solid var(--border);\n  }\n  th {\n    background: rgba(0,0,0,0.3);\n    color: var(--text-dim);\n    font-weight: 600;\n    font-size: 0.75rem;\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n    position: sticky;\n    top: 0;\n  }\n  tr:hover {\n    background: rgba(4, 105, 99, 0.1);\n  }\n  .status-match { color: var(--match); }\n  .status-differ { color: var(--differ); }\n  .status-missing { color: var(--missing); }\n  .status-extra { color: var(--extra); }\n  .status-enabled { color: var(--match); }\n  .status-disabled { color: var(--missing); }\n";
/**
 * Collapsible category/section styles
 */
export declare const CSS_CATEGORIES = "\n  .category {\n    background: var(--bg-card);\n    border-radius: 8px;\n    margin-bottom: 12px;\n    overflow: hidden;\n  }\n  .category > summary {\n    background: rgba(4, 105, 99, 0.15);\n    padding: 12px 16px;\n    font-weight: 600;\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    cursor: pointer;\n    list-style: none;\n    user-select: none;\n    transition: background 0.2s;\n  }\n  .category > summary::-webkit-details-marker { display: none; }\n  .category > summary::before {\n    content: '\u25B6';\n    display: inline-block;\n    margin-right: 8px;\n    font-size: 0.7rem;\n    transition: transform 0.2s;\n  }\n  .category[open] > summary::before { transform: rotate(90deg); }\n  .category > summary:hover { background: rgba(4, 105, 99, 0.25); }\n  .category-content {\n    padding: 0 16px 16px;\n  }\n  .category-stats {\n    display: flex;\n    gap: 8px;\n    font-size: 0.75rem;\n  }\n  .stat-badge {\n    padding: 2px 8px;\n    border-radius: 4px;\n    font-weight: 500;\n  }\n  .stat-match { background: rgba(16, 124, 16, 0.2); color: var(--match); }\n  .stat-differ { background: rgba(255, 170, 68, 0.2); color: var(--differ); }\n  .stat-missing { background: rgba(209, 52, 56, 0.2); color: var(--missing); }\n  .stat-extra { background: rgba(135, 100, 184, 0.2); color: var(--extra); }\n";
/**
 * Tab styles for tabbed content
 */
export declare const CSS_TABS = "\n  .tabs {\n    display: flex;\n    gap: 8px;\n    margin: 20px 0;\n    border-bottom: 2px solid var(--border);\n    padding-bottom: 8px;\n    flex-wrap: wrap;\n  }\n  .tab {\n    padding: 10px 20px;\n    background: var(--bg-card);\n    border: none;\n    color: var(--text-dim);\n    cursor: pointer;\n    border-radius: 8px 8px 0 0;\n    font-size: 0.9rem;\n    font-weight: 500;\n    transition: all 0.2s;\n  }\n  .tab.active {\n    background: var(--accent);\n    color: #fff;\n  }\n  .tab:hover:not(.active) {\n    background: rgba(4, 105, 99, 0.2);\n    color: var(--text);\n  }\n  .tab-content {\n    display: none;\n  }\n  .tab-content.active {\n    display: block;\n  }\n";
/**
 * Badge and tag styles
 */
export declare const CSS_BADGES = "\n  .badge {\n    display: inline-block;\n    padding: 2px 8px;\n    border-radius: 4px;\n    font-size: 0.75rem;\n    font-weight: 500;\n    margin: 2px;\n  }\n  .badge-match { background: rgba(16, 124, 16, 0.2); color: var(--match); }\n  .badge-differ { background: rgba(255, 170, 68, 0.2); color: var(--differ); }\n  .badge-missing { background: rgba(209, 52, 56, 0.2); color: var(--missing); }\n  .badge-extra { background: rgba(135, 100, 184, 0.2); color: var(--extra); }\n  .badge-info { background: rgba(0, 120, 212, 0.2); color: var(--info); }\n  .badge-admin { background: var(--missing); color: #fff; }\n  .badge-customizer { background: var(--differ); color: #000; }\n  .badge-mailbox { background: var(--info); color: #fff; }\n";
/**
 * Footer styles
 */
export declare const CSS_FOOTER = "\n  .report-footer {\n    margin-top: 32px;\n    padding-top: 16px;\n    border-top: 1px solid var(--border);\n    text-align: center;\n    color: var(--text-dim);\n    font-size: 0.8rem;\n  }\n  .report-footer a {\n    color: var(--accent);\n  }\n";
/**
 * Combine all CSS
 */
export declare function getAllStyles(): string;
/**
 * Generates the HTML header with logo and metadata
 */
export declare function generateHeader(options: HtmlTemplateOptions): string;
/**
 * Generates the HTML footer
 */
export declare function generateFooter(): string;
/**
 * JavaScript for tab switching
 */
export declare const TAB_SCRIPT = "\n  <script>\n    function showTab(tabId) {\n      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));\n      document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));\n      document.getElementById('tab-' + tabId).classList.add('active');\n      event.target.classList.add('active');\n    }\n\n    function toggleDisabledUsers() {\n      const checkbox = document.getElementById('hideDisabled');\n      const hideDisabled = checkbox ? checkbox.checked : false;\n      document.querySelectorAll('tr[data-disabled]').forEach(row => {\n        if (hideDisabled && row.getAttribute('data-disabled') === 'true') {\n          row.style.display = 'none';\n        } else {\n          row.style.display = '';\n        }\n      });\n    }\n  </script>\n";
/**
 * Generates a complete HTML document
 */
export declare function generateHtmlDocument(options: HtmlTemplateOptions, bodyContent: string): string;
/**
 * Helper to generate summary cards
 */
export declare function generateSummaryCards(cards: Array<{
    value: number | string;
    label: string;
    type?: 'match' | 'differ' | 'missing' | 'extra' | 'info' | 'danger' | 'warning';
}>): string;
/**
 * Helper to generate a data table
 */
export declare function generateTable(headers: string[], rows: string[][], options?: {
    className?: string;
}): string;
//# sourceMappingURL=html-template.d.ts.map