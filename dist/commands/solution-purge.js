"use strict";
/**
 * Solution Purge Command
 *
 * Deep deletion of an unmanaged solution by removing each component individually,
 * then deleting the solution shell. Provides detailed logging of what failed.
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
exports.SolutionPurge = void 0;
exports.runSolutionPurgeCommand = runSolutionPurgeCommand;
const fs = __importStar(require("fs"));
const open_1 = __importDefault(require("open"));
const services_1 = require("../services");
const utils_1 = require("../utils");
const templates_1 = require("../templates");
class SolutionPurge {
    solutionName;
    options;
    results = [];
    report;
    constructor(solutionName, options = {}) {
        this.solutionName = solutionName;
        this.options = options;
        this.report = {
            timestamp: new Date().toISOString(),
            solutionName,
            dryRun: options.dryRun || false,
            results: [],
            summary: {
                environments: { total: 0, success: 0, partial: 0, failed: 0, notFound: 0 },
                components: { total: 0, deleted: 0, skipped: 0, failed: 0 },
            },
        };
    }
    formatDate(isoDate) {
        if (!isoDate)
            return 'N/A';
        return new Date(isoDate).toLocaleString();
    }
    displaySolutionInfo(details) {
        console.log();
        console.log(utils_1.colors.bold(`  ┌${'─'.repeat(56)}┐`));
        console.log(utils_1.colors.bold(`  │${utils_1.colors.cyan(' SOLUTION TO PURGE').padEnd(66)}│`));
        console.log(utils_1.colors.bold(`  ├${'─'.repeat(56)}┤`));
        console.log(`  │  Display Name:    ${utils_1.colors.cyan(details.displayName.substring(0, 33).padEnd(33))} │`);
        console.log(`  │  Unique Name:     ${details.uniqueName.substring(0, 33).padEnd(33)} │`);
        console.log(`  │  Version:         ${details.version.padEnd(33)} │`);
        console.log(`  │  Publisher:       ${details.publisherName.substring(0, 33).padEnd(33)} │`);
        console.log(`  │  Type:            ${(details.isManaged ? utils_1.colors.yellow('MANAGED ⚠') : utils_1.colors.green('Unmanaged')).padEnd(44)} │`);
        console.log(utils_1.colors.bold(`  ├${'─'.repeat(56)}┤`));
        console.log(utils_1.colors.bold(`  │${' COMPONENTS TO DELETE'.padEnd(56)}│`));
        console.log(utils_1.colors.bold(`  ├${'─'.repeat(56)}┤`));
        console.log(`  │  Tables:          ${details.components.entities.toString().padEnd(33)} │`);
        console.log(`  │  Web Resources:   ${details.components.webResources.toString().padEnd(33)} │`);
        console.log(`  │  Plugins:         ${details.components.plugins.toString().padEnd(33)} │`);
        console.log(`  │  Cloud Flows:     ${details.components.workflows.toString().padEnd(33)} │`);
        console.log(`  │  Canvas Apps:     ${details.components.canvasApps.toString().padEnd(33)} │`);
        console.log(`  │  Model Apps:      ${details.components.modelApps.toString().padEnd(33)} │`);
        console.log(`  │  Security Roles:  ${details.components.securityRoles.toString().padEnd(33)} │`);
        console.log(`  │  Env Variables:   ${details.components.envVariables.toString().padEnd(33)} │`);
        console.log(`  │  ${utils_1.colors.bold('Total Components:')} ${utils_1.colors.red(details.components.total.toString()).padEnd(44)} │`);
        console.log(utils_1.colors.bold(`  └${'─'.repeat(56)}┘`));
        console.log();
    }
    async purgeFromEnvironment(envUrl) {
        const envName = (0, utils_1.extractEnvName)(envUrl);
        const result = {
            environment: envName,
            url: envUrl,
            solutionName: this.solutionName,
            components: [],
            solutionDeleted: false,
            success: false,
        };
        try {
            const client = new services_1.DataverseClient(envUrl, envName);
            console.log(utils_1.colors.bold(`\n${'═'.repeat(60)}`));
            console.log(utils_1.colors.bold(`  Environment: ${utils_1.colors.cyan(envName)}`));
            console.log(utils_1.colors.bold(`${'═'.repeat(60)}`));
            await client.authenticate();
            // Get solution details
            utils_1.log.info(`Looking for solution "${this.solutionName}"...`);
            const details = await client.getSolutionDetails(this.solutionName);
            if (!details) {
                result.skipped = true;
                result.reason = 'Solution not found';
                console.log();
                console.log(`  ${utils_1.colors.yellow('○')} Solution "${utils_1.colors.cyan(this.solutionName)}" not found`);
                return result;
            }
            result.solutionDetails = details;
            this.displaySolutionInfo(details);
            // Warn about managed solutions
            if (details.isManaged) {
                console.log(utils_1.colors.red(`  ⚠ WARNING: This is a MANAGED solution!`));
                console.log(utils_1.colors.red(`    Managed solutions cannot be purged component-by-component.`));
                console.log(utils_1.colors.red(`    Use 'solution-delete' instead to remove the entire solution.`));
                result.skipped = true;
                result.reason = 'Managed solution - use solution-delete instead';
                return result;
            }
            if (this.options.dryRun) {
                console.log(utils_1.colors.yellow(`  ⚠ DRY RUN - Showing what would be deleted\n`));
            }
            // Get all components
            utils_1.log.info('Fetching solution components...');
            const components = await client.getSolutionComponents(details.solutionId);
            console.log(`  Found ${utils_1.colors.cyan(components.length.toString())} components`);
            console.log();
            // Confirm unless forced
            if (!this.options.force && !this.options.dryRun) {
                console.log(utils_1.colors.red(`  ⚠ WARNING: This will PERMANENTLY DELETE ${components.length} components!`));
                console.log(utils_1.colors.dim(`    This action cannot be undone.`));
                console.log();
                const confirm = await (0, utils_1.promptYN)(`  Delete all ${components.length} components from "${details.displayName}"?`, false);
                if (!confirm) {
                    result.skipped = true;
                    result.reason = 'User cancelled';
                    utils_1.log.warn(`Skipped by user`);
                    return result;
                }
                // Extra confirmation for production
                if (envName.toLowerCase().includes('prod') || envName.toLowerCase().includes('crp')) {
                    console.log();
                    console.log(utils_1.colors.red(utils_1.colors.bold(`  🚨 PRODUCTION ENVIRONMENT DETECTED 🚨`)));
                    const confirm2 = await (0, utils_1.promptYN)(`  Type YES to confirm purge in PRODUCTION`, false);
                    if (!confirm2) {
                        result.skipped = true;
                        result.reason = 'Production confirmation rejected';
                        utils_1.log.warn(`Skipped - production confirmation rejected`);
                        return result;
                    }
                }
            }
            // Process components - delete in order (dependencies matter)
            // Order: Values before Definitions, Steps before Types before Assemblies, etc.
            const deleteOrder = [
                381, // Environment Variable Values first
                92, // SDK Message Steps before Plugin Types
                90, // Plugin Types before Assemblies
                91, // Plugin Assemblies
                29, // Workflows/Processes
                300, // Canvas Apps
                80, // Model-driven Apps
                61, // Web Resources
                380, // Environment Variable Definitions
                20, // Security Roles
                59, // Charts
                26, // Views
                60, // Forms
                36, // Email Templates
                31, // Reports
            ];
            // Sort components by delete order
            const sortedComponents = [...components].sort((a, b) => {
                const orderA = deleteOrder.indexOf(a.componenttype);
                const orderB = deleteOrder.indexOf(b.componenttype);
                // If not in order list, put at end
                return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
            });
            console.log(utils_1.colors.bold('  Deleting components...\n'));
            let deleted = 0;
            let skipped = 0;
            let failed = 0;
            for (const comp of sortedComponents) {
                const compResult = {
                    componentId: comp.solutioncomponentid,
                    componentType: comp.componenttype,
                    typeName: comp.typeName || `Type ${comp.componenttype}`,
                    objectId: comp.objectid,
                    name: comp.name || comp.objectid,
                    displayName: comp.displayName || comp.name || comp.objectid,
                    success: false,
                };
                const displayName = comp.displayName || comp.name || comp.objectid.substring(0, 20);
                const typeName = comp.typeName || `Type ${comp.componenttype}`;
                if (!comp.canDelete) {
                    compResult.skipped = true;
                    compResult.reason = 'Component type cannot be directly deleted';
                    skipped++;
                    console.log(`  ${utils_1.colors.yellow('○')} ${typeName.padEnd(20)} ${displayName.substring(0, 30).padEnd(30)} ${utils_1.colors.dim('(skipped - not deletable)')}`);
                }
                else if (this.options.dryRun) {
                    compResult.skipped = true;
                    compResult.reason = 'Dry run';
                    compResult.success = true;
                    skipped++;
                    console.log(`  ${utils_1.colors.cyan('~')} ${typeName.padEnd(20)} ${displayName.substring(0, 30).padEnd(30)} ${utils_1.colors.dim('(would delete)')}`);
                }
                else {
                    // Actually delete
                    const deleteResult = await client.deleteComponent(comp.componenttype, comp.objectid);
                    if (deleteResult.success) {
                        compResult.success = true;
                        deleted++;
                        console.log(`  ${utils_1.colors.green('✓')} ${typeName.padEnd(20)} ${displayName.substring(0, 30)}`);
                    }
                    else {
                        compResult.error = deleteResult.error;
                        failed++;
                        console.log(`  ${utils_1.colors.red('✗')} ${typeName.padEnd(20)} ${displayName.substring(0, 30).padEnd(30)} ${utils_1.colors.red(deleteResult.error?.substring(0, 40) || 'Unknown error')}`);
                    }
                }
                result.components.push(compResult);
            }
            console.log();
            console.log(`  ${utils_1.colors.green(`✓ ${deleted} deleted`)}  ${utils_1.colors.yellow(`○ ${skipped} skipped`)}  ${utils_1.colors.red(`✗ ${failed} failed`)}`);
            // Delete the solution shell if all deletable components succeeded
            if (!this.options.keepSolution && !this.options.dryRun) {
                const deletableComponents = result.components.filter(c => !c.skipped || c.reason === 'Dry run');
                const allDeleted = deletableComponents.every(c => c.success);
                console.log();
                if (failed === 0 || this.options.force) {
                    utils_1.log.info('Deleting solution shell...');
                    try {
                        await client.deleteSolution(details.solutionId);
                        result.solutionDeleted = true;
                        utils_1.log.success(`Solution "${details.displayName}" removed`);
                    }
                    catch (e) {
                        result.solutionDeleteError = e.message;
                        utils_1.log.error(`Failed to delete solution: ${result.solutionDeleteError}`);
                    }
                }
                else {
                    utils_1.log.warn(`Solution shell kept - ${failed} component(s) failed to delete`);
                    result.solutionDeleteError = `${failed} components failed - solution shell retained`;
                }
            }
            else if (this.options.dryRun) {
                console.log();
                utils_1.log.info(`[DRY RUN] Would delete solution shell`);
                result.solutionDeleted = true; // Mark as "would be deleted"
            }
            else if (this.options.keepSolution) {
                console.log();
                utils_1.log.info(`Solution shell kept (--keep-solution flag)`);
            }
            // Determine overall success
            result.success = failed === 0 && (result.solutionDeleted || !!this.options.keepSolution || !!this.options.dryRun);
        }
        catch (e) {
            result.error = e.message;
            console.log();
            utils_1.log.error(`Failed to purge solution: ${result.error}`);
        }
        return result;
    }
    async purgeFromAll() {
        const targets = (0, utils_1.getAllTargets)();
        if (targets.length === 0) {
            utils_1.log.error('No environments configured. Set ENV_TEST_URL_XX or ENV_PROD_URL_XX in .env');
            return [];
        }
        utils_1.log.title(`Purge Solution: ${this.solutionName}`);
        console.log(`Targeting ${utils_1.colors.cyan(targets.length.toString())} environments`);
        if (this.options.dryRun) {
            console.log(utils_1.colors.yellow('DRY RUN MODE - No changes will be made'));
        }
        if (this.options.keepSolution) {
            console.log(utils_1.colors.cyan('KEEP SOLUTION - Only deleting components'));
        }
        for (const target of targets) {
            const result = await this.purgeFromEnvironment(target.url);
            this.results.push(result);
        }
        // Calculate summary
        this.report.results = this.results;
        this.report.summary = {
            environments: {
                total: this.results.length,
                success: this.results.filter(r => r.success).length,
                partial: this.results.filter(r => !r.success && r.components.some(c => c.success)).length,
                failed: this.results.filter(r => !r.success && !r.skipped && r.components.length > 0 && !r.components.some(c => c.success)).length,
                notFound: this.results.filter(r => r.reason === 'Solution not found').length,
            },
            components: {
                total: this.results.reduce((sum, r) => sum + r.components.length, 0),
                deleted: this.results.reduce((sum, r) => sum + r.components.filter(c => c.success && !c.skipped).length, 0),
                skipped: this.results.reduce((sum, r) => sum + r.components.filter(c => c.skipped).length, 0),
                failed: this.results.reduce((sum, r) => sum + r.components.filter(c => !c.success && !c.skipped).length, 0),
            },
        };
        return this.results;
    }
    printSummary() {
        const { environments, components } = this.report.summary;
        console.log();
        console.log(utils_1.colors.bold('═'.repeat(60)));
        console.log(utils_1.colors.bold('  SOLUTION PURGE SUMMARY'));
        console.log(utils_1.colors.bold('═'.repeat(60)));
        console.log();
        console.log(`  Solution: ${utils_1.colors.cyan(this.solutionName)}`);
        if (this.options.dryRun) {
            console.log(`  Mode:     ${utils_1.colors.yellow('DRY RUN')}`);
        }
        console.log();
        console.log(utils_1.colors.bold('  Environments:'));
        console.log(`    ${utils_1.colors.green(`✓ ${environments.success} fully purged`)}`);
        if (environments.partial > 0) {
            console.log(`    ${utils_1.colors.yellow(`◐ ${environments.partial} partially purged`)}`);
        }
        console.log(`    ${utils_1.colors.dim(`- ${environments.notFound} not found`)}`);
        if (environments.failed > 0) {
            console.log(`    ${utils_1.colors.red(`✗ ${environments.failed} failed`)}`);
        }
        console.log();
        console.log(utils_1.colors.bold('  Components:'));
        console.log(`    ${utils_1.colors.green(`✓ ${components.deleted} deleted`)}`);
        console.log(`    ${utils_1.colors.yellow(`○ ${components.skipped} skipped`)}`);
        if (components.failed > 0) {
            console.log(`    ${utils_1.colors.red(`✗ ${components.failed} failed`)}`);
        }
        console.log();
        // Show failed components
        const failedComps = this.results.flatMap(r => r.components.filter(c => !c.success && !c.skipped).map(c => ({ ...c, env: r.environment })));
        if (failedComps.length > 0) {
            console.log(utils_1.colors.bold(utils_1.colors.red('  Failed Components:')));
            for (const comp of failedComps.slice(0, 10)) { // Show max 10
                console.log(`    ${utils_1.colors.red('✗')} [${comp.env}] ${comp.typeName}: ${comp.displayName}`);
                console.log(`      ${utils_1.colors.dim(comp.error || 'Unknown error')}`);
            }
            if (failedComps.length > 10) {
                console.log(`    ${utils_1.colors.dim(`... and ${failedComps.length - 10} more (see report)`)}`);
            }
            console.log();
        }
        console.log(utils_1.colors.bold('═'.repeat(60)));
    }
    saveJsonReport(filePath) {
        const jsonPath = filePath || (0, utils_1.getReportPath)('solution-purge', 'json');
        fs.writeFileSync(jsonPath, JSON.stringify(this.report, null, 2));
        utils_1.log.success(`JSON report saved to: ${jsonPath}`);
        return jsonPath;
    }
    saveHtmlReport(filePath) {
        const htmlPath = filePath || (0, utils_1.getReportPath)('solution-purge', 'html');
        const html = this.generateHtmlReport();
        fs.writeFileSync(htmlPath, html);
        utils_1.log.success(`HTML report saved to: ${htmlPath}`);
        return htmlPath;
    }
    generateHtmlReport() {
        const { environments, components } = this.report.summary;
        // Group failed components by error type
        const failedComps = this.results.flatMap(r => r.components.filter(c => !c.success && !c.skipped).map(c => ({ ...c, env: r.environment })));
        const bodyContent = `
      ${(0, templates_1.generateSummaryCards)([
            { value: environments.total, label: 'Environments', type: 'info' },
            { value: environments.success, label: 'Fully Purged', type: 'match' },
            { value: environments.partial, label: 'Partial', type: 'warning' },
            { value: environments.notFound, label: 'Not Found', type: 'info' },
            { value: components.deleted, label: 'Components Deleted', type: 'match' },
            { value: components.failed, label: 'Components Failed', type: 'danger' },
        ])}

      <div class="card" style="margin-top: 20px;">
        <div class="card-header">
          <h3>Solution: ${this.solutionName}</h3>
        </div>
        <div class="card-body">
          ${this.options.dryRun ? '<p style="color: var(--differ);">⚠ DRY RUN - No actual deletions were performed</p>' : ''}
          
          <h4>Environment Results</h4>
          ${(0, templates_1.generateTable)(['Environment', 'Status', 'Components', 'Deleted', 'Failed', 'Solution'], this.report.results.map(r => {
            let statusBadge;
            if (r.success) {
                statusBadge = '<span class="badge badge-match">✓ Purged</span>';
            }
            else if (r.reason === 'Solution not found') {
                statusBadge = '<span class="badge" style="background: rgba(160,160,160,0.2); color: #a0a0a0;">Not Found</span>';
            }
            else if (r.reason === 'Managed solution - use solution-delete instead') {
                statusBadge = '<span class="badge badge-differ">Managed</span>';
            }
            else if (r.skipped) {
                statusBadge = `<span class="badge badge-differ">○ Skipped</span>`;
            }
            else if (r.components.some(c => c.success)) {
                statusBadge = '<span class="badge badge-differ">◐ Partial</span>';
            }
            else {
                statusBadge = '<span class="badge badge-missing">✗ Failed</span>';
            }
            const total = r.components.length.toString();
            const deleted = r.components.filter(c => c.success && !c.skipped).length.toString();
            const failed = r.components.filter(c => !c.success && !c.skipped).length.toString();
            const solution = r.solutionDeleted
                ? '<span class="badge badge-match">Deleted</span>'
                : (r.solutionDeleteError ? '<span class="badge badge-missing">Failed</span>' : '-');
            return [r.environment, statusBadge, total, deleted, failed, solution];
        }))}
        </div>
      </div>

      ${failedComps.length > 0 ? `
        <div class="card" style="margin-top: 20px;">
          <div class="card-header">
            <h3 style="color: var(--missing);">Failed Components (${failedComps.length})</h3>
          </div>
          <div class="card-body">
            <p>These components could not be deleted. Review the errors below:</p>
            ${(0, templates_1.generateTable)(['Environment', 'Type', 'Name', 'Error'], failedComps.map(c => [
            c.env,
            c.typeName,
            c.displayName,
            `<span style="color: var(--missing);">${c.error || 'Unknown error'}</span>`,
        ]))}
          </div>
        </div>
      ` : ''}

      ${this.generateComponentBreakdown()}
    `;
        return (0, templates_1.generateHtmlDocument)({
            title: 'Solution Purge Report',
            subtitle: `Deep deletion report for ${this.solutionName}`,
            timestamp: new Date(this.report.timestamp).toLocaleString(),
        }, bodyContent);
    }
    generateComponentBreakdown() {
        // Get one result with solution details for reference
        const detailResult = this.report.results.find(r => r.solutionDetails);
        if (!detailResult?.solutionDetails)
            return '';
        const details = detailResult.solutionDetails;
        return `
      <div class="card" style="margin-top: 20px;">
        <div class="card-header">
          <h3>Solution Information</h3>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <div><strong>Display Name:</strong><br/>${details.displayName}</div>
            <div><strong>Unique Name:</strong><br/>${details.uniqueName}</div>
            <div><strong>Publisher:</strong><br/>${details.publisherName}</div>
            <div><strong>Version:</strong><br/>${details.version}</div>
          </div>
          
          <h4 style="margin-top: 20px;">Component Breakdown</h4>
          ${(0, templates_1.generateTable)(['Component Type', 'Count'], [
            ['Tables/Entities', details.components.entities.toString()],
            ['Web Resources', details.components.webResources.toString()],
            ['Plugin Assemblies', details.components.plugins.toString()],
            ['Cloud Flows', details.components.workflows.toString()],
            ['Canvas Apps', details.components.canvasApps.toString()],
            ['Model-Driven Apps', details.components.modelApps.toString()],
            ['Security Roles', details.components.securityRoles.toString()],
            ['Environment Variables', details.components.envVariables.toString()],
            ['<strong>Total</strong>', `<strong>${details.components.total}</strong>`],
        ])}
        </div>
      </div>
    `;
    }
    async openHtmlReport() {
        const htmlPath = this.saveHtmlReport();
        await (0, open_1.default)(htmlPath);
    }
}
exports.SolutionPurge = SolutionPurge;
/**
 * Run the solution purge command
 */
async function runSolutionPurgeCommand(args) {
    let solutionName = '';
    let envUrl = '';
    let dryRun = false;
    let force = false;
    let save = false;
    let keepSolution = false;
    let useAllTargets = false;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '-n':
            case '--name':
                solutionName = args[++i];
                break;
            case '-e':
            case '--environment':
                envUrl = args[++i];
                break;
            case '--all':
            case '-a':
                useAllTargets = true;
                break;
            case '--dry-run':
                dryRun = true;
                break;
            case '-f':
            case '--force':
                force = true;
                break;
            case '-s':
            case '--save':
                save = true;
                break;
            case '--keep-solution':
                keepSolution = true;
                break;
            default:
                // If it doesn't start with -, treat as solution name
                if (!arg.startsWith('-') && !solutionName) {
                    solutionName = arg;
                }
        }
    }
    if (!solutionName) {
        solutionName = process.env.SOLUTION_NAME || '';
    }
    if (!solutionName) {
        utils_1.log.error('Solution name required. Use: pac-ext solution-purge <name> or -n <name>');
        utils_1.log.info('Or set SOLUTION_NAME in .env');
        process.exit(1);
    }
    const purger = new SolutionPurge(solutionName, { dryRun, force, save, keepSolution });
    if (useAllTargets) {
        await purger.purgeFromAll();
        purger.printSummary();
        if (save) {
            purger.saveJsonReport();
            await purger.openHtmlReport();
        }
    }
    else if (envUrl) {
        const result = await purger.purgeFromEnvironment(envUrl);
        if (save && result.solutionDetails) {
            purger.saveJsonReport();
            await purger.openHtmlReport();
        }
        if (!result.success && !result.skipped) {
            process.exit(1);
        }
    }
    else {
        utils_1.log.error('Environment required. Use -e <url> or --all for all environments');
        process.exit(1);
    }
}
//# sourceMappingURL=solution-purge.js.map