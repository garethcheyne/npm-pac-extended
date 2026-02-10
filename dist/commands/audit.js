"use strict";
/**
 * Environment Audit Command
 *
 * Compares a master environment against one or more target environments
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentAudit = void 0;
exports.runAuditCommand = runAuditCommand;
const fs = __importStar(require("fs"));
const open_1 = __importDefault(require("open"));
const services_1 = require("../services");
const utils_1 = require("../utils");
const templates_1 = require("../templates");
class EnvironmentAudit {
    master;
    targets;
    options;
    report;
    constructor(masterUrl, masterName, targets, options = {}) {
        this.master = new services_1.DataverseClient(masterUrl, masterName);
        this.targets = targets.map(t => new services_1.DataverseClient(t.url, t.name));
        this.options = options;
        this.report = {
            timestamp: new Date().toISOString(),
            master: masterName,
            targets: targets.map(t => t.name),
            deep: options.deep || false,
            categories: {},
        };
    }
    async authenticate() {
        utils_1.log.title('Authenticating to Environments');
        await this.master.authenticate();
        for (const target of this.targets) {
            await target.authenticate();
        }
        console.log();
        utils_1.log.success('All environments authenticated');
    }
    // Generic comparison helper
    async compareGeneric(categoryName, categoryKey, getter, valueExtractor) {
        utils_1.log.info(`Comparing ${categoryName.toLowerCase()}...`);
        const masterItems = await getter(this.master);
        const masterMap = new Map(masterItems.map(item => [item.name, item]));
        const comparison = {
            name: categoryName,
            items: [],
        };
        const targetData = [];
        for (const target of this.targets) {
            const items = await getter(target);
            targetData.push({
                name: target.envName,
                items: new Map(items.map(item => [item.name, item])),
            });
        }
        const allNames = new Set([...masterMap.keys()]);
        for (const td of targetData) {
            for (const name of td.items.keys()) {
                allNames.add(name);
            }
        }
        for (const name of [...allNames].sort()) {
            const masterItem = masterMap.get(name);
            const masterValue = masterItem
                ? (valueExtractor ? valueExtractor(masterItem) : 'present')
                : null;
            const item = {
                name: name,
                displayName: masterItem?.displayName || name,
                master: masterValue,
                targets: {},
                status: 'match',
            };
            for (const td of targetData) {
                const targetItem = td.items.get(name);
                const targetValue = targetItem
                    ? (valueExtractor ? valueExtractor(targetItem) : 'present')
                    : null;
                item.targets[td.name] = targetValue;
                if (!masterItem && targetItem) {
                    item.status = 'extra_in_target';
                }
                else if (masterItem && !targetItem) {
                    item.status = 'missing_in_target';
                }
                else if (valueExtractor && masterItem && targetItem && masterValue !== targetValue) {
                    item.status = 'value_mismatch';
                }
            }
            comparison.items.push(item);
        }
        this.report.categories[categoryKey] = comparison;
        return comparison;
    }
    async compareSolutions() {
        return this.compareGeneric('Solutions', 'solutions', client => client.getSolutions(), item => item.version);
    }
    async compareEnvironmentVariables() {
        return this.compareGeneric('Environment Variables', 'environmentVariables', client => client.getEnvironmentVariables(), item => item.value);
    }
    async comparePlugins() {
        return this.compareGeneric('Plugins', 'plugins', client => client.getPlugins(), item => item.version);
    }
    async compareWebResources() {
        return this.compareGeneric('Web Resources', 'webResources', client => client.getWebResources());
    }
    async compareTables() {
        return this.compareGeneric('Custom Tables', 'tables', client => client.getTables());
    }
    async compareFlows() {
        return this.compareGeneric('Cloud Flows', 'flows', client => client.getFlows(), item => item.state);
    }
    async compareCanvasApps() {
        return this.compareGeneric('Canvas Apps', 'canvasApps', client => client.getCanvasApps(), item => item.version);
    }
    async compareModelApps() {
        return this.compareGeneric('Model-Driven Apps', 'modelApps', client => client.getModelApps(), item => item.version);
    }
    async compareSecurityRoles() {
        return this.compareGeneric('Security Roles', 'securityRoles', client => client.getSecurityRoles());
    }
    async compareTableColumnsDeep() {
        utils_1.log.info('Deep comparing table columns...');
        const masterTables = await this.master.getTables();
        const comparison = {
            name: 'Table Columns (Deep)',
            items: [],
        };
        let tableCount = 0;
        for (const table of masterTables) {
            tableCount++;
            process.stdout.write(`\r    Analyzing table ${tableCount}/${masterTables.length}: ${table.name.padEnd(40)}`);
            const masterColumns = await this.master.getTableColumns(table.name);
            const masterColMap = new Map(masterColumns.map(c => [c.name, c]));
            const targetData = [];
            for (const target of this.targets) {
                const cols = await target.getTableColumns(table.name);
                targetData.push({
                    name: target.envName,
                    columns: new Map(cols.map(c => [c.name, c])),
                });
            }
            const allColNames = new Set([...masterColMap.keys()]);
            for (const td of targetData) {
                for (const name of td.columns.keys()) {
                    allColNames.add(name);
                }
            }
            for (const colName of allColNames) {
                const masterCol = masterColMap.get(colName);
                const item = {
                    name: `${table.name}.${colName}`,
                    displayName: masterCol?.displayName || colName,
                    master: masterCol ? this.formatColumnInfo(masterCol) : null,
                    targets: {},
                    status: 'match',
                };
                for (const td of targetData) {
                    const targetCol = td.columns.get(colName);
                    item.targets[td.name] = targetCol ? this.formatColumnInfo(targetCol) : null;
                    if (!masterCol && targetCol) {
                        item.status = 'extra_in_target';
                    }
                    else if (masterCol && !targetCol) {
                        item.status = 'missing_in_target';
                    }
                    else if (masterCol && targetCol) {
                        const diffs = this.compareColumnProperties(masterCol, targetCol);
                        if (diffs.length > 0) {
                            item.status = 'value_mismatch';
                            item.differences = diffs;
                        }
                    }
                }
                if (item.status !== 'match') {
                    comparison.items.push(item);
                }
            }
        }
        console.log(); // New line after progress
        this.report.categories.tableColumns = comparison;
        return comparison;
    }
    formatColumnInfo(col) {
        let info = col.type;
        if (col.maxLength)
            info += `(${col.maxLength})`;
        if (col.required !== 'None')
            info += ' REQ';
        return info;
    }
    compareColumnProperties(master, target) {
        const diffs = [];
        if (master.type !== target.type) {
            diffs.push(`type: ${master.type} → ${target.type}`);
        }
        if (master.maxLength !== target.maxLength) {
            diffs.push(`maxLength: ${master.maxLength} → ${target.maxLength}`);
        }
        if (master.required !== target.required) {
            diffs.push(`required: ${master.required} → ${target.required}`);
        }
        if (master.precision !== target.precision) {
            diffs.push(`precision: ${master.precision} → ${target.precision}`);
        }
        return diffs;
    }
    async runAudit() {
        utils_1.log.title('Environment Audit');
        console.log();
        console.log(utils_1.colors.bold('Configuration:'));
        console.log('─'.repeat(60));
        console.log(`  Master:  ${utils_1.colors.cyan(this.master.envName)} (${this.master.envUrl})`);
        for (const target of this.targets) {
            console.log(`  Compare: ${utils_1.colors.yellow(target.envName)} (${target.envUrl})`);
        }
        if (this.options.deep) {
            console.log(utils_1.colors.magenta('  Mode:    DEEP (comparing table columns)'));
        }
        await this.authenticate();
        console.log();
        utils_1.log.title('Running Comparisons');
        await this.compareSolutions();
        await this.compareEnvironmentVariables();
        await this.comparePlugins();
        await this.compareFlows();
        await this.compareCanvasApps();
        await this.compareModelApps();
        await this.compareSecurityRoles();
        await this.compareWebResources();
        await this.compareTables();
        if (this.options.deep) {
            console.log();
            utils_1.log.title('Deep Comparisons');
            await this.compareTableColumnsDeep();
        }
        return this.report;
    }
    printReport() {
        console.log();
        console.log(utils_1.colors.bold('═'.repeat(70)));
        console.log(utils_1.colors.bold(`  ENVIRONMENT AUDIT REPORT`));
        console.log(utils_1.colors.bold(`  Master: ${this.master.envName}`));
        console.log(utils_1.colors.bold('═'.repeat(70)));
        for (const [, category] of Object.entries(this.report.categories)) {
            console.log();
            console.log(utils_1.colors.bold(category.name));
            console.log('─'.repeat(70));
            const targetNames = this.targets.map(t => t.envName);
            let header = `  ${'Item'.padEnd(30)} ${'Master'.padEnd(15)}`;
            for (const name of targetNames) {
                header += ` ${name.padEnd(15)}`;
            }
            header += ' Status';
            console.log(utils_1.colors.dim(header));
            let matches = 0, mismatches = 0, missing = 0, extra = 0;
            for (const item of category.items) {
                let line = `  ${item.name.substring(0, 28).padEnd(30)}`;
                line += ` ${(item.master || '-').toString().substring(0, 13).padEnd(15)}`;
                for (const name of targetNames) {
                    const val = item.targets[name];
                    line += ` ${(val || '-').toString().substring(0, 13).padEnd(15)}`;
                }
                let statusIcon;
                let statusColor;
                switch (item.status) {
                    case 'match':
                        statusIcon = '✓';
                        statusColor = utils_1.colors.green;
                        matches++;
                        break;
                    case 'version_mismatch':
                    case 'value_mismatch':
                        statusIcon = '!';
                        statusColor = utils_1.colors.yellow;
                        mismatches++;
                        break;
                    case 'missing_in_target':
                        statusIcon = '✗';
                        statusColor = utils_1.colors.red;
                        missing++;
                        break;
                    case 'extra_in_target':
                        statusIcon = '+';
                        statusColor = utils_1.colors.magenta;
                        extra++;
                        break;
                    default:
                        statusIcon = '?';
                        statusColor = utils_1.colors.dim;
                }
                if (item.status !== 'match') {
                    console.log(statusColor(line + ` ${statusIcon}`));
                }
            }
            console.log(utils_1.colors.dim('─'.repeat(70)));
            console.log(`  ${utils_1.colors.green(`✓ ${matches} match`)}  ${utils_1.colors.yellow(`! ${mismatches} differ`)}  ${utils_1.colors.red(`✗ ${missing} missing`)}  ${utils_1.colors.magenta(`+ ${extra} extra`)}`);
        }
        console.log();
        console.log(utils_1.colors.bold('═'.repeat(70)));
        let totalIssues = 0;
        for (const category of Object.values(this.report.categories)) {
            totalIssues += category.items.filter(i => i.status !== 'match').length;
        }
        if (totalIssues === 0) {
            console.log(utils_1.colors.green('  ✓ All environments are in sync!'));
        }
        else {
            console.log(utils_1.colors.yellow(`  ! Found ${totalIssues} differences across environments`));
        }
        console.log(utils_1.colors.bold('═'.repeat(70)));
    }
    saveJsonReport(filePath) {
        const jsonPath = filePath || (0, utils_1.getReportPath)('audit', 'json', this.master.envUrl);
        fs.writeFileSync(jsonPath, JSON.stringify(this.report, null, 2));
        utils_1.log.success(`JSON report saved to: ${jsonPath}`);
        return jsonPath;
    }
    saveHtmlReport(filePath) {
        const htmlPath = filePath || (0, utils_1.getReportPath)('audit', 'html', this.master.envUrl);
        const html = this.generateHtmlReport();
        fs.writeFileSync(htmlPath, html);
        utils_1.log.success(`HTML report saved to: ${htmlPath}`);
        return htmlPath;
    }
    generateHtmlReport() {
        const targetNames = this.targets.map(t => t.envName);
        // Calculate totals
        let totalMatches = 0, totalMismatches = 0, totalMissing = 0, totalExtra = 0;
        for (const category of Object.values(this.report.categories)) {
            for (const item of category.items) {
                switch (item.status) {
                    case 'match':
                        totalMatches++;
                        break;
                    case 'version_mismatch':
                    case 'value_mismatch':
                        totalMismatches++;
                        break;
                    case 'missing_in_target':
                        totalMissing++;
                        break;
                    case 'extra_in_target':
                        totalExtra++;
                        break;
                }
            }
        }
        // Generate category sections
        let categoriesHtml = '';
        for (const [key, category] of Object.entries(this.report.categories)) {
            const stats = { match: 0, differ: 0, missing: 0, extra: 0 };
            for (const item of category.items) {
                switch (item.status) {
                    case 'match':
                        stats.match++;
                        break;
                    case 'version_mismatch':
                    case 'value_mismatch':
                        stats.differ++;
                        break;
                    case 'missing_in_target':
                        stats.missing++;
                        break;
                    case 'extra_in_target':
                        stats.extra++;
                        break;
                }
            }
            const nonMatchItems = category.items.filter(i => i.status !== 'match');
            const isOpen = nonMatchItems.length > 0 && nonMatchItems.length < 50 ? 'open' : '';
            categoriesHtml += `
        <details class="category" ${isOpen}>
          <summary>
            <span>${category.name}</span>
            <div class="category-stats">
              <span class="stat-badge stat-match">✓ ${stats.match}</span>
              <span class="stat-badge stat-differ">! ${stats.differ}</span>
              <span class="stat-badge stat-missing">✗ ${stats.missing}</span>
              <span class="stat-badge stat-extra">+ ${stats.extra}</span>
            </div>
          </summary>
          <div class="category-content">
            ${this.generateCategoryTable(category, targetNames)}
          </div>
        </details>
      `;
        }
        const bodyContent = `
      ${(0, templates_1.generateSummaryCards)([
            { value: totalMatches, label: 'Matching', type: 'match' },
            { value: totalMismatches, label: 'Different', type: 'differ' },
            { value: totalMissing, label: 'Missing in Target', type: 'missing' },
            { value: totalExtra, label: 'Extra in Target', type: 'extra' },
        ])}
      ${categoriesHtml}
    `;
        return (0, templates_1.generateHtmlDocument)({
            title: 'Environment Audit Report',
            subtitle: 'Comparing Power Platform environments',
            timestamp: new Date(this.report.timestamp).toLocaleString(),
            masterEnvironment: this.master.envName,
            targetEnvironments: targetNames,
            isDeepAudit: this.options.deep,
        }, bodyContent);
    }
    generateCategoryTable(category, targetNames) {
        const headers = ['Item', 'Master', ...targetNames, 'Status'];
        const rows = category.items
            .filter(item => item.status !== 'match')
            .map(item => {
            const statusClass = this.getStatusClass(item.status);
            const statusIcon = this.getStatusIcon(item.status);
            return [
                item.name,
                item.master || '-',
                ...targetNames.map(name => item.targets[name] || '-'),
                `<span class="${statusClass}">${statusIcon}</span>`,
            ];
        });
        if (rows.length === 0) {
            return '<p style="color: var(--match); padding: 16px;">✓ All items match</p>';
        }
        return (0, templates_1.generateTable)(headers, rows);
    }
    getStatusClass(status) {
        switch (status) {
            case 'match': return 'status-match';
            case 'version_mismatch':
            case 'value_mismatch': return 'status-differ';
            case 'missing_in_target': return 'status-missing';
            case 'extra_in_target': return 'status-extra';
            default: return '';
        }
    }
    getStatusIcon(status) {
        switch (status) {
            case 'match': return '✓ Match';
            case 'version_mismatch':
            case 'value_mismatch': return '! Different';
            case 'missing_in_target': return '✗ Missing';
            case 'extra_in_target': return '+ Extra';
            default: return '?';
        }
    }
}
exports.EnvironmentAudit = EnvironmentAudit;
/**
 * Run the audit command
 */
async function runAuditCommand(args) {
    // Parse arguments
    let masterUrl = '';
    let masterName = '';
    const targets = [];
    let save = false;
    let deep = false;
    let useAllTargets = false;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--master':
            case '-m':
                masterUrl = args[++i];
                masterName = (0, utils_1.extractEnvName)(masterUrl);
                break;
            case '--compare':
            case '-c':
                // Collect all URLs until next flag
                while (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                    const url = args[++i];
                    const name = (0, utils_1.extractEnvName)(url);
                    targets.push({ url, name });
                }
                break;
            case '--all':
            case '-a':
                useAllTargets = true;
                break;
            case '--save':
            case '-s':
                save = true;
                break;
            case '--deep':
            case '-d':
                deep = true;
                break;
        }
    }
    // If --all flag, use ENV_ALL_TARGETS
    if (useAllTargets) {
        const allTargets = (0, utils_1.getAllTargets)();
        if (allTargets.length === 0) {
            utils_1.log.error('ENV_ALL_TARGETS not set in .env or is empty');
            process.exit(1);
        }
        // Add all targets that aren't already in the list
        for (const target of allTargets) {
            if (!targets.some(t => t.url === target.url)) {
                targets.push(target);
            }
        }
        utils_1.log.info(`Using ${allTargets.length} environments from ENV_ALL_TARGETS`);
    }
    // Default master to ENV_PROD_URL if not specified
    if (!masterUrl) {
        const defaultMaster = (0, utils_1.getMasterUrl)();
        if (defaultMaster) {
            masterUrl = defaultMaster;
            masterName = (0, utils_1.extractEnvName)(masterUrl);
            utils_1.log.info(`Using default master: ${masterName}`);
        }
    }
    if (!masterUrl || targets.length === 0) {
        utils_1.log.error('Usage: pac-ext audit --master <url> --compare <url1> [url2...] [--all] [--save] [--deep]');
        utils_1.log.info('  --all, -a    Use all environments from ENV_ALL_TARGETS');
        process.exit(1);
    }
    // Filter out master from targets if present
    const filteredTargets = targets.filter(t => t.url !== masterUrl);
    const audit = new EnvironmentAudit(masterUrl, masterName, filteredTargets, { deep, save });
    await audit.runAudit();
    audit.printReport();
    if (save) {
        const jsonPath = audit.saveJsonReport();
        const htmlPath = audit.saveHtmlReport();
        // Open HTML report in browser
        await (0, open_1.default)(htmlPath);
    }
}
//# sourceMappingURL=audit.js.map