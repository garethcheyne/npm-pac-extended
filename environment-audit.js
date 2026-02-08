#!/usr/bin/env node

/**
 * Environment Audit Tool
 *
 * Compares a master/baseline environment against one or more target environments.
 * Identifies differences in solutions, schemas, plugins, etc.
 */

const msal = require('@azure/msal-node');
const fs = require('fs');
const path = require('path');
const open = require('open');

// Load .env
require('dotenv').config();

// ANSI colors
const colors = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  blue: (t) => `\x1b[34m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  magenta: (t) => `\x1b[35m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`,
};

const log = {
  info: (msg) => console.log(colors.blue('i'), msg),
  success: (msg) => console.log(colors.green('✓'), msg),
  error: (msg) => console.log(colors.red('✗'), msg),
  warn: (msg) => console.log(colors.yellow('!'), msg),
  title: (msg) => console.log('\n' + colors.bold(colors.cyan(msg))),
};

const TOKEN_CACHE_PATH = path.join(process.cwd(), '.token-cache.json');

// MSAL Configuration
const MSAL_CONFIG = {
  auth: {
    clientId: '04b07795-8ddb-461a-bbee-02f9e1bf7b46', // Azure CLI public client
    authority: 'https://login.microsoftonline.com/common',
  },
  cache: {
    cachePlugin: {
      beforeCacheAccess: async (cacheContext) => {
        if (fs.existsSync(TOKEN_CACHE_PATH)) {
          cacheContext.tokenCache.deserialize(fs.readFileSync(TOKEN_CACHE_PATH, 'utf-8'));
        }
      },
      afterCacheAccess: async (cacheContext) => {
        if (cacheContext.cacheHasChanged) {
          fs.writeFileSync(TOKEN_CACHE_PATH, cacheContext.tokenCache.serialize());
        }
      },
    },
  },
};

class EnvironmentClient {
  constructor(url, name) {
    this.url = url.replace(/\/$/, '');
    this.name = name;
    this.msalClient = new msal.PublicClientApplication(MSAL_CONFIG);
    this.accessToken = null;
  }

  async authenticate() {
    const scopes = [`${this.url}/.default`];

    // Try silent auth first
    try {
      const accounts = await this.msalClient.getTokenCache().getAllAccounts();
      if (accounts.length > 0) {
        const result = await this.msalClient.acquireTokenSilent({
          account: accounts[0],
          scopes: scopes,
        });
        this.accessToken = result.accessToken;
        return;
      }
    } catch (error) {
      // Need interactive auth
    }

    // Device code flow
    console.log();
    console.log(colors.bold(`Authenticate to ${this.name}:`));
    console.log('─'.repeat(50));

    const result = await this.msalClient.acquireTokenByDeviceCode({
      scopes: scopes,
      deviceCodeCallback: (response) => {
        console.log(colors.yellow('  1. Open: ') + colors.cyan(response.verificationUri));
        console.log(colors.yellow('  2. Enter code: ') + colors.bold(colors.green(response.userCode)));
        console.log(colors.dim('  Waiting...'));
        open(response.verificationUri).catch(() => {});
      },
    });

    this.accessToken = result.accessToken;
    log.success(`Authenticated to ${this.name}`);
  }

  async fetch(endpoint) {
    const url = `${this.url}/api/data/v9.2/${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Accept': 'application/json',
        'Prefer': 'odata.include-annotations="*"',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getSolutions() {
    const data = await this.fetch('solutions?$filter=isvisible eq true&$select=uniquename,friendlyname,version,ismanaged,installedon&$orderby=uniquename');
    return data.value.map(s => ({
      name: s.uniquename,
      displayName: s.friendlyname,
      version: s.version,
      isManaged: s.ismanaged,
      installedOn: s.installedon,
    }));
  }

  async getEnvironmentVariables() {
    try {
      const defs = await this.fetch('environmentvariabledefinitions?$select=schemaname,displayname,type&$expand=environmentvariablevalues($select=value)');
      return defs.value.map(d => ({
        name: d.schemaname,
        displayName: d.displayname,
        type: d.type,
        value: d.environmentvariablevalues?.[0]?.value || '(not set)',
      }));
    } catch (e) {
      return [];
    }
  }

  async getPlugins() {
    try {
      const data = await this.fetch('pluginassemblies?$filter=ishidden eq false&$select=name,version,publickeytoken,isolationmode');
      return data.value.map(p => ({
        name: p.name,
        version: p.version,
        publicKeyToken: p.publickeytoken,
        isolationMode: p.isolationmode,
      }));
    } catch (e) {
      return [];
    }
  }

  async getWebResources() {
    try {
      const data = await this.fetch('webresourceset?$filter=ishidden eq false&$select=name,displayname,webresourcetype&$top=500');
      return data.value.map(w => ({
        name: w.name,
        displayName: w.displayname,
        type: w.webresourcetype,
      }));
    } catch (e) {
      return [];
    }
  }

  async getTables() {
    try {
      const data = await this.fetch('EntityDefinitions?$filter=IsCustomEntity eq true&$select=LogicalName,DisplayName,TableType');
      return data.value.map(t => ({
        name: t.LogicalName,
        displayName: t.DisplayName?.UserLocalizedLabel?.Label || t.LogicalName,
        tableType: t.TableType,
      }));
    } catch (e) {
      return [];
    }
  }
}

class EnvironmentAudit {
  constructor(masterUrl, masterName, targets) {
    this.master = new EnvironmentClient(masterUrl, masterName);
    this.targets = targets.map(t => new EnvironmentClient(t.url, t.name));
    this.report = {
      timestamp: new Date().toISOString(),
      master: masterName,
      targets: targets.map(t => t.name),
      categories: {},
    };
  }

  async authenticate() {
    log.title('Authenticating to Environments');

    await this.master.authenticate();
    for (const target of this.targets) {
      await target.authenticate();
    }

    console.log();
    log.success('All environments authenticated');
  }

  async compareSolutions() {
    log.info('Comparing solutions...');

    const masterSolutions = await this.master.getSolutions();
    const masterMap = new Map(masterSolutions.map(s => [s.name, s]));

    const comparison = {
      name: 'Solutions',
      items: [],
    };

    // Get all solutions from targets
    const targetData = [];
    for (const target of this.targets) {
      const solutions = await target.getSolutions();
      targetData.push({
        name: target.name,
        solutions: new Map(solutions.map(s => [s.name, s])),
      });
    }

    // Get all unique solution names
    const allNames = new Set([...masterMap.keys()]);
    for (const td of targetData) {
      for (const name of td.solutions.keys()) {
        allNames.add(name);
      }
    }

    // Compare each solution
    for (const name of [...allNames].sort()) {
      const masterSol = masterMap.get(name);
      const item = {
        name: name,
        displayName: masterSol?.displayName || name,
        master: masterSol?.version || null,
        targets: {},
        status: 'match',
      };

      for (const td of targetData) {
        const targetSol = td.solutions.get(name);
        item.targets[td.name] = targetSol?.version || null;

        if (!masterSol && targetSol) {
          item.status = 'extra_in_target';
        } else if (masterSol && !targetSol) {
          item.status = 'missing_in_target';
        } else if (masterSol && targetSol && masterSol.version !== targetSol.version) {
          item.status = 'version_mismatch';
        }
      }

      comparison.items.push(item);
    }

    this.report.categories.solutions = comparison;
    return comparison;
  }

  async compareEnvironmentVariables() {
    log.info('Comparing environment variables...');

    const masterVars = await this.master.getEnvironmentVariables();
    const masterMap = new Map(masterVars.map(v => [v.name, v]));

    const comparison = {
      name: 'Environment Variables',
      items: [],
    };

    const targetData = [];
    for (const target of this.targets) {
      const vars = await target.getEnvironmentVariables();
      targetData.push({
        name: target.name,
        vars: new Map(vars.map(v => [v.name, v])),
      });
    }

    const allNames = new Set([...masterMap.keys()]);
    for (const td of targetData) {
      for (const name of td.vars.keys()) {
        allNames.add(name);
      }
    }

    for (const name of [...allNames].sort()) {
      const masterVar = masterMap.get(name);
      const item = {
        name: name,
        displayName: masterVar?.displayName || name,
        master: masterVar?.value || null,
        targets: {},
        status: 'match',
      };

      for (const td of targetData) {
        const targetVar = td.vars.get(name);
        item.targets[td.name] = targetVar?.value || null;

        if (!masterVar && targetVar) {
          item.status = 'extra_in_target';
        } else if (masterVar && !targetVar) {
          item.status = 'missing_in_target';
        } else if (masterVar && targetVar && masterVar.value !== targetVar.value) {
          item.status = 'value_mismatch';
        }
      }

      comparison.items.push(item);
    }

    this.report.categories.environmentVariables = comparison;
    return comparison;
  }

  async comparePlugins() {
    log.info('Comparing plugins...');

    const masterPlugins = await this.master.getPlugins();
    const masterMap = new Map(masterPlugins.map(p => [p.name, p]));

    const comparison = {
      name: 'Plugins',
      items: [],
    };

    const targetData = [];
    for (const target of this.targets) {
      const plugins = await target.getPlugins();
      targetData.push({
        name: target.name,
        plugins: new Map(plugins.map(p => [p.name, p])),
      });
    }

    const allNames = new Set([...masterMap.keys()]);
    for (const td of targetData) {
      for (const name of td.plugins.keys()) {
        allNames.add(name);
      }
    }

    for (const name of [...allNames].sort()) {
      const masterPlugin = masterMap.get(name);
      const item = {
        name: name,
        master: masterPlugin?.version || null,
        targets: {},
        status: 'match',
      };

      for (const td of targetData) {
        const targetPlugin = td.plugins.get(name);
        item.targets[td.name] = targetPlugin?.version || null;

        if (!masterPlugin && targetPlugin) {
          item.status = 'extra_in_target';
        } else if (masterPlugin && !targetPlugin) {
          item.status = 'missing_in_target';
        } else if (masterPlugin && targetPlugin && masterPlugin.version !== targetPlugin.version) {
          item.status = 'version_mismatch';
        }
      }

      comparison.items.push(item);
    }

    this.report.categories.plugins = comparison;
    return comparison;
  }

  async compareWebResources() {
    log.info('Comparing web resources...');

    const masterResources = await this.master.getWebResources();
    const masterMap = new Map(masterResources.map(w => [w.name, w]));

    const comparison = {
      name: 'Web Resources',
      items: [],
    };

    const targetData = [];
    for (const target of this.targets) {
      const resources = await target.getWebResources();
      targetData.push({
        name: target.name,
        resources: new Map(resources.map(w => [w.name, w])),
      });
    }

    const allNames = new Set([...masterMap.keys()]);
    for (const td of targetData) {
      for (const name of td.resources.keys()) {
        allNames.add(name);
      }
    }

    for (const name of [...allNames].sort()) {
      const masterRes = masterMap.get(name);
      const item = {
        name: name,
        master: masterRes ? 'present' : null,
        targets: {},
        status: 'match',
      };

      for (const td of targetData) {
        const targetRes = td.resources.get(name);
        item.targets[td.name] = targetRes ? 'present' : null;

        if (!masterRes && targetRes) {
          item.status = 'extra_in_target';
        } else if (masterRes && !targetRes) {
          item.status = 'missing_in_target';
        }
      }

      comparison.items.push(item);
    }

    this.report.categories.webResources = comparison;
    return comparison;
  }

  async compareTables() {
    log.info('Comparing custom tables...');

    const masterTables = await this.master.getTables();
    const masterMap = new Map(masterTables.map(t => [t.name, t]));

    const comparison = {
      name: 'Custom Tables',
      items: [],
    };

    const targetData = [];
    for (const target of this.targets) {
      const tables = await target.getTables();
      targetData.push({
        name: target.name,
        tables: new Map(tables.map(t => [t.name, t])),
      });
    }

    const allNames = new Set([...masterMap.keys()]);
    for (const td of targetData) {
      for (const name of td.tables.keys()) {
        allNames.add(name);
      }
    }

    for (const name of [...allNames].sort()) {
      const masterTable = masterMap.get(name);
      const item = {
        name: name,
        displayName: masterTable?.displayName || name,
        master: masterTable ? 'present' : null,
        targets: {},
        status: 'match',
      };

      for (const td of targetData) {
        const targetTable = td.tables.get(name);
        item.targets[td.name] = targetTable ? 'present' : null;

        if (!masterTable && targetTable) {
          item.status = 'extra_in_target';
        } else if (masterTable && !targetTable) {
          item.status = 'missing_in_target';
        }
      }

      comparison.items.push(item);
    }

    this.report.categories.tables = comparison;
    return comparison;
  }

  async runAudit() {
    log.title('Environment Audit');
    console.log();
    console.log(colors.bold('Configuration:'));
    console.log('─'.repeat(60));
    console.log(`  Master:  ${colors.cyan(this.master.name)} (${this.master.url})`);
    for (const target of this.targets) {
      console.log(`  Compare: ${colors.yellow(target.name)} (${target.url})`);
    }

    await this.authenticate();

    console.log();
    log.title('Running Comparisons');

    await this.compareSolutions();
    await this.compareEnvironmentVariables();
    await this.comparePlugins();
    await this.compareWebResources();
    await this.compareTables();

    return this.report;
  }

  printReport() {
    console.log();
    console.log(colors.bold('═'.repeat(70)));
    console.log(colors.bold(`  ENVIRONMENT AUDIT REPORT`));
    console.log(colors.bold(`  Master: ${this.master.name}`));
    console.log(colors.bold('═'.repeat(70)));

    for (const [key, category] of Object.entries(this.report.categories)) {
      console.log();
      console.log(colors.bold(category.name));
      console.log('─'.repeat(70));

      // Header
      const targetNames = this.targets.map(t => t.name);
      let header = `  ${'Item'.padEnd(30)} ${'Master'.padEnd(15)}`;
      for (const name of targetNames) {
        header += ` ${name.padEnd(15)}`;
      }
      header += ' Status';
      console.log(colors.dim(header));

      // Count stats
      let matches = 0, mismatches = 0, missing = 0, extra = 0;

      for (const item of category.items) {
        let line = `  ${item.name.substring(0, 28).padEnd(30)}`;
        line += ` ${(item.master || '-').toString().substring(0, 13).padEnd(15)}`;

        for (const name of targetNames) {
          const val = item.targets[name];
          line += ` ${(val || '-').toString().substring(0, 13).padEnd(15)}`;
        }

        let statusIcon, statusColor;
        switch (item.status) {
          case 'match':
            statusIcon = '✓';
            statusColor = colors.green;
            matches++;
            break;
          case 'version_mismatch':
          case 'value_mismatch':
            statusIcon = '!';
            statusColor = colors.yellow;
            mismatches++;
            break;
          case 'missing_in_target':
            statusIcon = '✗';
            statusColor = colors.red;
            missing++;
            break;
          case 'extra_in_target':
            statusIcon = '+';
            statusColor = colors.magenta;
            extra++;
            break;
          default:
            statusIcon = '?';
            statusColor = colors.dim;
        }

        // Only show non-matching items by default
        if (item.status !== 'match') {
          console.log(statusColor(line + ` ${statusIcon}`));
        }
      }

      // Summary
      console.log(colors.dim('─'.repeat(70)));
      console.log(`  ${colors.green(`✓ ${matches} match`)}  ${colors.yellow(`! ${mismatches} differ`)}  ${colors.red(`✗ ${missing} missing`)}  ${colors.magenta(`+ ${extra} extra`)}`);
    }

    console.log();
    console.log(colors.bold('═'.repeat(70)));

    // Overall summary
    let totalIssues = 0;
    for (const category of Object.values(this.report.categories)) {
      totalIssues += category.items.filter(i => i.status !== 'match').length;
    }

    if (totalIssues === 0) {
      console.log(colors.green('  ✓ All environments are in sync!'));
    } else {
      console.log(colors.yellow(`  ! Found ${totalIssues} differences across environments`));
    }
    console.log(colors.bold('═'.repeat(70)));
  }

  saveReport(filename) {
    const jsonPath = filename || `audit-report-${Date.now()}.json`;
    fs.writeFileSync(jsonPath, JSON.stringify(this.report, null, 2));
    log.success(`Report saved to: ${jsonPath}`);
  }

  saveHtmlReport(filename) {
    const targetNames = this.targets.map(t => t.name);
    const timestamp = new Date().toLocaleString();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Environment Audit Report</title>
  <style>
    :root {
      --match: #22c55e;
      --differ: #eab308;
      --missing: #ef4444;
      --extra: #a855f7;
      --bg: #0f172a;
      --bg-card: #1e293b;
      --text: #f1f5f9;
      --text-dim: #94a3b8;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }
    header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    header p { opacity: 0.9; }
    .meta {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;
      font-size: 0.9rem;
    }
    .meta span { background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 20px; }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .summary-card {
      background: var(--bg-card);
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
      border-left: 4px solid var(--border);
    }
    .summary-card.match { border-left-color: var(--match); }
    .summary-card.differ { border-left-color: var(--differ); }
    .summary-card.missing { border-left-color: var(--missing); }
    .summary-card.extra { border-left-color: var(--extra); }
    .summary-card .number { font-size: 2.5rem; font-weight: bold; }
    .summary-card .label { color: var(--text-dim); font-size: 0.85rem; text-transform: uppercase; }
    .category {
      background: var(--bg-card);
      border-radius: 12px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }
    .category-header {
      background: rgba(99, 102, 241, 0.2);
      padding: 1rem 1.5rem;
      font-weight: 600;
      font-size: 1.1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .category-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.85rem;
    }
    .category-stats span { padding: 0.25rem 0.5rem; border-radius: 4px; }
    .stat-match { background: rgba(34, 197, 94, 0.2); color: var(--match); }
    .stat-differ { background: rgba(234, 179, 8, 0.2); color: var(--differ); }
    .stat-missing { background: rgba(239, 68, 68, 0.2); color: var(--missing); }
    .stat-extra { background: rgba(168, 85, 247, 0.2); color: var(--extra); }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: rgba(0,0,0,0.2);
      color: var(--text-dim);
      font-weight: 500;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    tr:hover { background: rgba(255,255,255,0.02); }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .status-match { background: rgba(34, 197, 94, 0.15); color: var(--match); }
    .status-differ { background: rgba(234, 179, 8, 0.15); color: var(--differ); }
    .status-missing { background: rgba(239, 68, 68, 0.15); color: var(--missing); }
    .status-extra { background: rgba(168, 85, 247, 0.15); color: var(--extra); }
    .value { font-family: 'Monaco', 'Consolas', monospace; font-size: 0.85rem; }
    .value-null { color: var(--text-dim); }
    .filter-bar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .filter-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn:hover { border-color: #6366f1; }
    .filter-btn.active { background: #6366f1; border-color: #6366f1; }
    footer {
      text-align: center;
      padding: 2rem;
      color: var(--text-dim);
      font-size: 0.85rem;
    }
    footer a { color: #6366f1; text-decoration: none; }
    @media (max-width: 768px) {
      body { padding: 1rem; }
      .meta { flex-direction: column; gap: 0.5rem; }
      th, td { padding: 0.5rem; font-size: 0.85rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Environment Audit Report</h1>
      <p>Comparing <strong>${this.master.name}</strong> against ${targetNames.join(', ')}</p>
      <div class="meta">
        <span>Generated: ${timestamp}</span>
        <span>Master: ${this.master.url}</span>
      </div>
    </header>

    ${this.generateHtmlSummary()}

    <div class="filter-bar">
      <button class="filter-btn active" onclick="filterRows('all')">All</button>
      <button class="filter-btn" onclick="filterRows('differ')">Differences Only</button>
      <button class="filter-btn" onclick="filterRows('missing')">Missing Only</button>
      <button class="filter-btn" onclick="filterRows('extra')">Extra Only</button>
    </div>

    ${this.generateHtmlCategories(targetNames)}

    <footer>
      Generated by <a href="https://github.com/garethcheyne/npm-pac-extended">PAC Extended</a>
    </footer>
  </div>

  <script>
    function filterRows(filter) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');

      document.querySelectorAll('tbody tr').forEach(row => {
        const status = row.dataset.status;
        if (filter === 'all') {
          row.style.display = '';
        } else if (filter === 'differ') {
          row.style.display = (status === 'version_mismatch' || status === 'value_mismatch') ? '' : 'none';
        } else if (filter === 'missing') {
          row.style.display = status === 'missing_in_target' ? '' : 'none';
        } else if (filter === 'extra') {
          row.style.display = status === 'extra_in_target' ? '' : 'none';
        }
      });
    }
  </script>
</body>
</html>`;

    const htmlPath = filename || `audit-report-${Date.now()}.html`;
    fs.writeFileSync(htmlPath, html);
    log.success(`HTML report saved to: ${htmlPath}`);
    return htmlPath;
  }

  generateHtmlSummary() {
    let totalMatch = 0, totalDiffer = 0, totalMissing = 0, totalExtra = 0;

    for (const category of Object.values(this.report.categories)) {
      for (const item of category.items) {
        switch (item.status) {
          case 'match': totalMatch++; break;
          case 'version_mismatch':
          case 'value_mismatch': totalDiffer++; break;
          case 'missing_in_target': totalMissing++; break;
          case 'extra_in_target': totalExtra++; break;
        }
      }
    }

    return `
    <div class="summary-cards">
      <div class="summary-card match">
        <div class="number">${totalMatch}</div>
        <div class="label">Match</div>
      </div>
      <div class="summary-card differ">
        <div class="number">${totalDiffer}</div>
        <div class="label">Different</div>
      </div>
      <div class="summary-card missing">
        <div class="number">${totalMissing}</div>
        <div class="label">Missing</div>
      </div>
      <div class="summary-card extra">
        <div class="number">${totalExtra}</div>
        <div class="label">Extra</div>
      </div>
    </div>`;
  }

  generateHtmlCategories(targetNames) {
    let html = '';

    for (const [key, category] of Object.entries(this.report.categories)) {
      let matches = 0, differs = 0, missing = 0, extra = 0;
      category.items.forEach(item => {
        switch (item.status) {
          case 'match': matches++; break;
          case 'version_mismatch':
          case 'value_mismatch': differs++; break;
          case 'missing_in_target': missing++; break;
          case 'extra_in_target': extra++; break;
        }
      });

      html += `
      <div class="category">
        <div class="category-header">
          <span>${category.name}</span>
          <div class="category-stats">
            <span class="stat-match">✓ ${matches}</span>
            <span class="stat-differ">! ${differs}</span>
            <span class="stat-missing">✗ ${missing}</span>
            <span class="stat-extra">+ ${extra}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Master</th>
              ${targetNames.map(n => `<th>${n}</th>`).join('')}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>`;

      for (const item of category.items) {
        const statusClass = item.status.replace('_', '-').replace('version-mismatch', 'differ').replace('value-mismatch', 'differ').replace('missing-in-target', 'missing').replace('extra-in-target', 'extra');
        const statusLabel = item.status === 'match' ? '✓ Match' :
                           item.status.includes('mismatch') ? '! Different' :
                           item.status === 'missing_in_target' ? '✗ Missing' :
                           item.status === 'extra_in_target' ? '+ Extra' : item.status;

        html += `
            <tr data-status="${item.status}">
              <td><strong>${item.displayName || item.name}</strong><br><span class="value-null">${item.name}</span></td>
              <td class="value">${item.master || '<span class="value-null">—</span>'}</td>
              ${targetNames.map(n => `<td class="value">${item.targets[n] || '<span class="value-null">—</span>'}</td>`).join('')}
              <td><span class="status status-${statusClass}">${statusLabel}</span></td>
            </tr>`;
      }

      html += `
          </tbody>
        </table>
      </div>`;
    }

    return html;
  }
}

module.exports = { EnvironmentAudit, EnvironmentClient };
