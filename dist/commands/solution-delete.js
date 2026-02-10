"use strict";
/**
 * Solution Delete Command
 *
 * Deletes a solution from one or more Dataverse environments
 * with detailed confirmation and reporting
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
exports.SolutionDelete = void 0;
exports.runSolutionDeleteCommand = runSolutionDeleteCommand;
const fs = __importStar(require("fs"));
const open_1 = __importDefault(require("open"));
const services_1 = require("../services");
const utils_1 = require("../utils");
const templates_1 = require("../templates");
class SolutionDelete {
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
            summary: { total: 0, deleted: 0, skipped: 0, notFound: 0, failed: 0 },
        };
    }
    formatDate(isoDate) {
        if (!isoDate)
            return 'N/A';
        return new Date(isoDate).toLocaleString();
    }
    displaySolutionInfo(details, envName) {
        console.log();
        console.log(utils_1.colors.bold(`  ┌${'─'.repeat(56)}┐`));
        console.log(utils_1.colors.bold(`  │${utils_1.colors.cyan(' SOLUTION DETAILS').padEnd(66)}│`));
        console.log(utils_1.colors.bold(`  ├${'─'.repeat(56)}┤`));
        console.log(`  │  Display Name:    ${utils_1.colors.cyan(details.displayName.substring(0, 33).padEnd(33))} │`);
        console.log(`  │  Unique Name:     ${details.uniqueName.substring(0, 33).padEnd(33)} │`);
        console.log(`  │  Version:         ${details.version.padEnd(33)} │`);
        console.log(`  │  Publisher:       ${details.publisherName.substring(0, 33).padEnd(33)} │`);
        console.log(`  │  Type:            ${(details.isManaged ? 'Managed' : 'Unmanaged').padEnd(33)} │`);
        console.log(`  │  Installed On:    ${this.formatDate(details.installedOn).padEnd(33)} │`);
        console.log(`  │  Last Modified:   ${this.formatDate(details.modifiedOn).padEnd(33)} │`);
        console.log(utils_1.colors.bold(`  ├${'─'.repeat(56)}┤`));
        console.log(utils_1.colors.bold(`  │${' COMPONENTS'.padEnd(56)}│`));
        console.log(utils_1.colors.bold(`  ├${'─'.repeat(56)}┤`));
        console.log(`  │  Tables:          ${details.components.entities.toString().padEnd(33)} │`);
        console.log(`  │  Web Resources:   ${details.components.webResources.toString().padEnd(33)} │`);
        console.log(`  │  Plugins:         ${details.components.plugins.toString().padEnd(33)} │`);
        console.log(`  │  Cloud Flows:     ${details.components.workflows.toString().padEnd(33)} │`);
        console.log(`  │  Canvas Apps:     ${details.components.canvasApps.toString().padEnd(33)} │`);
        console.log(`  │  Model Apps:      ${details.components.modelApps.toString().padEnd(33)} │`);
        console.log(`  │  Security Roles:  ${details.components.securityRoles.toString().padEnd(33)} │`);
        console.log(`  │  Env Variables:   ${details.components.envVariables.toString().padEnd(33)} │`);
        console.log(`  │  ${utils_1.colors.bold('Total Components:')} ${utils_1.colors.cyan(details.components.total.toString()).padEnd(44)} │`);
        console.log(utils_1.colors.bold(`  └${'─'.repeat(56)}┘`));
        console.log();
        if (details.description) {
            console.log(`  ${utils_1.colors.dim('Description:')} ${details.description.substring(0, 60)}`);
            console.log();
        }
    }
    async deleteFromEnvironment(envUrl) {
        const envName = (0, utils_1.extractEnvName)(envUrl);
        const result = {
            environment: envName,
            url: envUrl,
            solutionName: this.solutionName,
            success: false,
        };
        try {
            const client = new services_1.DataverseClient(envUrl, envName);
            console.log(utils_1.colors.bold(`\n${'═'.repeat(60)}`));
            console.log(utils_1.colors.bold(`  Environment: ${utils_1.colors.cyan(envName)}`));
            console.log(utils_1.colors.bold(`${'═'.repeat(60)}`));
            await client.authenticate();
            // Find and get solution details
            utils_1.log.info(`Looking for solution "${this.solutionName}"...`);
            const details = await client.getSolutionDetails(this.solutionName);
            if (!details) {
                result.skipped = true;
                result.reason = 'Solution not found in this environment';
                console.log();
                console.log(`  ${utils_1.colors.yellow('○')} Solution "${utils_1.colors.cyan(this.solutionName)}" not found`);
                console.log(`    ${utils_1.colors.dim('This environment will be skipped.')}`);
                return result;
            }
            result.solutionDetails = details;
            // Display solution info
            this.displaySolutionInfo(details, envName);
            if (this.options.dryRun) {
                console.log(utils_1.colors.yellow(`  ⚠ DRY RUN - No changes will be made`));
                result.success = true;
                result.skipped = true;
                result.reason = 'Dry run mode';
                return result;
            }
            // Warn about managed vs unmanaged
            if (details.isManaged) {
                console.log(utils_1.colors.yellow(`  ⚠ This is a MANAGED solution.`));
                console.log(utils_1.colors.dim(`    Deleting will remove all components from this environment.`));
            }
            else {
                console.log(utils_1.colors.red(`  ⚠ This is an UNMANAGED solution.`));
                console.log(utils_1.colors.dim(`    Components may remain but lose solution association.`));
            }
            console.log();
            // Confirm deletion unless forced
            if (!this.options.force) {
                console.log(utils_1.colors.red(`  ⚠ WARNING: This action is DESTRUCTIVE and cannot be undone!`));
                console.log();
                const confirm1 = await (0, utils_1.promptYN)(`  Are you sure you want to delete "${details.displayName}" from ${envName}?`, false);
                if (!confirm1) {
                    result.skipped = true;
                    result.reason = 'User cancelled';
                    utils_1.log.warn(`Skipped by user`);
                    return result;
                }
                // Double confirmation for production environments
                if (envName.toLowerCase().includes('prod') || envName.toLowerCase().includes('crp')) {
                    console.log();
                    console.log(utils_1.colors.red(utils_1.colors.bold(`  🚨 PRODUCTION ENVIRONMENT DETECTED 🚨`)));
                    const confirm2 = await (0, utils_1.promptYN)(`  Type YES to confirm deletion from PRODUCTION`, false);
                    if (!confirm2) {
                        result.skipped = true;
                        result.reason = 'User cancelled (production confirmation)';
                        utils_1.log.warn(`Skipped - production confirmation rejected`);
                        return result;
                    }
                }
            }
            // Delete the solution
            console.log();
            utils_1.log.info(`Deleting solution...`);
            await client.deleteSolution(details.solutionId);
            result.deletedAt = new Date().toISOString();
            result.success = true;
            console.log();
            utils_1.log.success(`Solution "${details.displayName}" deleted successfully!`);
        }
        catch (e) {
            result.error = e.message;
            console.log();
            utils_1.log.error(`Failed to delete solution: ${result.error}`);
        }
        return result;
    }
    async deleteFromAll() {
        const targets = (0, utils_1.getAllTargets)();
        if (targets.length === 0) {
            utils_1.log.error('No environments configured. Set ENV_TEST_URL_XX or ENV_PROD_URL_XX in .env');
            return [];
        }
        utils_1.log.title(`Delete Solution: ${this.solutionName}`);
        console.log(`Targeting ${utils_1.colors.cyan(targets.length.toString())} environments`);
        if (this.options.dryRun) {
            console.log(utils_1.colors.yellow('DRY RUN MODE - No changes will be made'));
        }
        for (const target of targets) {
            const result = await this.deleteFromEnvironment(target.url);
            this.results.push(result);
        }
        // Update report
        this.report.results = this.results;
        this.report.summary = {
            total: this.results.length,
            deleted: this.results.filter(r => r.success && !r.skipped).length,
            skipped: this.results.filter(r => r.skipped && r.reason !== 'Solution not found in this environment').length,
            notFound: this.results.filter(r => r.reason === 'Solution not found in this environment').length,
            failed: this.results.filter(r => !r.success && !r.skipped).length,
        };
        return this.results;
    }
    printSummary() {
        const { deleted, skipped, notFound, failed } = this.report.summary;
        console.log();
        console.log(utils_1.colors.bold('═'.repeat(60)));
        console.log(utils_1.colors.bold('  SOLUTION DELETE SUMMARY'));
        console.log(utils_1.colors.bold('═'.repeat(60)));
        console.log();
        console.log(`  Solution: ${utils_1.colors.cyan(this.solutionName)}`);
        if (this.options.dryRun) {
            console.log(`  Mode:     ${utils_1.colors.yellow('DRY RUN')}`);
        }
        console.log();
        console.log(`  ${utils_1.colors.green(`✓ ${deleted} deleted`)}`);
        console.log(`  ${utils_1.colors.yellow(`○ ${skipped} skipped (user cancelled)`)}`);
        console.log(`  ${utils_1.colors.dim(`- ${notFound} not found`)}`);
        if (failed > 0) {
            console.log(`  ${utils_1.colors.red(`✗ ${failed} failed`)}`);
        }
        console.log();
        // Show details for each environment
        for (const result of this.results) {
            let status;
            let icon;
            if (result.success && !result.skipped) {
                icon = utils_1.colors.green('✓');
                status = 'Deleted';
            }
            else if (result.reason === 'Solution not found in this environment') {
                icon = utils_1.colors.dim('-');
                status = utils_1.colors.dim('Not found');
            }
            else if (result.skipped) {
                icon = utils_1.colors.yellow('○');
                status = utils_1.colors.yellow(`Skipped: ${result.reason}`);
            }
            else {
                icon = utils_1.colors.red('✗');
                status = utils_1.colors.red(`Failed: ${result.error?.substring(0, 30)}`);
            }
            console.log(`  ${icon} ${result.environment.padEnd(25)} ${status}`);
        }
        console.log(utils_1.colors.bold('═'.repeat(60)));
    }
    saveJsonReport(filePath) {
        const jsonPath = filePath || (0, utils_1.getReportPath)('solution-delete', 'json');
        fs.writeFileSync(jsonPath, JSON.stringify(this.report, null, 2));
        utils_1.log.success(`JSON report saved to: ${jsonPath}`);
        return jsonPath;
    }
    saveHtmlReport(filePath) {
        const htmlPath = filePath || (0, utils_1.getReportPath)('solution-delete', 'html');
        const html = this.generateHtmlReport();
        fs.writeFileSync(htmlPath, html);
        utils_1.log.success(`HTML report saved to: ${htmlPath}`);
        return htmlPath;
    }
    generateHtmlReport() {
        const { deleted, skipped, notFound, failed } = this.report.summary;
        const bodyContent = `
      ${(0, templates_1.generateSummaryCards)([
            { value: this.report.results.length, label: 'Environments', type: 'info' },
            { value: deleted, label: 'Deleted', type: 'match' },
            { value: skipped, label: 'Skipped', type: 'warning' },
            { value: notFound, label: 'Not Found', type: 'info' },
            { value: failed, label: 'Failed', type: 'danger' },
        ])}

      <div class="card" style="margin-top: 20px;">
        <div class="card-header">
          <h3>Solution: ${this.solutionName}</h3>
        </div>
        <div class="card-body">
          ${this.options.dryRun ? '<p style="color: var(--differ);">⚠ DRY RUN - No actual deletions were performed</p>' : ''}
          
          ${(0, templates_1.generateTable)(['Environment', 'Status', 'Version', 'Components', 'Details'], this.report.results.map(r => {
            let statusBadge;
            if (r.success && !r.skipped) {
                statusBadge = '<span class="badge badge-match">✓ Deleted</span>';
            }
            else if (r.reason === 'Solution not found in this environment') {
                statusBadge = '<span class="badge" style="background: rgba(160,160,160,0.2); color: #a0a0a0;">Not Found</span>';
            }
            else if (r.skipped) {
                statusBadge = '<span class="badge badge-differ">○ Skipped</span>';
            }
            else {
                statusBadge = '<span class="badge badge-missing">✗ Failed</span>';
            }
            const version = r.solutionDetails?.version || '-';
            const components = r.solutionDetails?.components.total.toString() || '-';
            const details = r.skipped
                ? r.reason || ''
                : (r.error || (r.deletedAt ? `Deleted at ${new Date(r.deletedAt).toLocaleTimeString()}` : ''));
            return [r.environment, statusBadge, version, components, details];
        }))}
        </div>
      </div>

      ${this.generateSolutionDetailsSection()}
    `;
        return (0, templates_1.generateHtmlDocument)({
            title: 'Solution Delete Report',
            subtitle: `Deletion report for ${this.solutionName}`,
            timestamp: new Date(this.report.timestamp).toLocaleString(),
        }, bodyContent);
    }
    generateSolutionDetailsSection() {
        // Find results that had solution details
        const resultsWithDetails = this.report.results.filter(r => r.solutionDetails);
        if (resultsWithDetails.length === 0) {
            return '';
        }
        // Use the first one for reference (they should all be similar)
        const details = resultsWithDetails[0].solutionDetails;
        return `
      <div class="card" style="margin-top: 20px;">
        <div class="card-header">
          <h3>Solution Information</h3>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <div>
              <strong>Display Name:</strong><br/>
              ${details.displayName}
            </div>
            <div>
              <strong>Unique Name:</strong><br/>
              ${details.uniqueName}
            </div>
            <div>
              <strong>Publisher:</strong><br/>
              ${details.publisherName}
            </div>
            <div>
              <strong>Type:</strong><br/>
              <span class="badge ${details.isManaged ? 'badge-info' : 'badge-differ'}">
                ${details.isManaged ? 'Managed' : 'Unmanaged'}
              </span>
            </div>
          </div>
          
          ${details.description ? `<p style="margin-top: 16px;"><strong>Description:</strong> ${details.description}</p>` : ''}

          <h4 style="margin-top: 20px;">Components</h4>
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
exports.SolutionDelete = SolutionDelete;
/**
 * Run the solution delete command
 */
async function runSolutionDeleteCommand(args) {
    let solutionName = '';
    let envUrl = '';
    let dryRun = false;
    let force = false;
    let save = false;
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
            default:
                // If it doesn't start with -, treat as solution name
                if (!arg.startsWith('-') && !solutionName) {
                    solutionName = arg;
                }
        }
    }
    if (!solutionName) {
        // Try to get from env
        solutionName = process.env.SOLUTION_NAME || '';
    }
    if (!solutionName) {
        utils_1.log.error('Solution name required. Use: pac-ext solution-delete <name> or -n <name>');
        utils_1.log.info('Or set SOLUTION_NAME in .env');
        process.exit(1);
    }
    const deleter = new SolutionDelete(solutionName, { dryRun, force, save });
    if (useAllTargets) {
        await deleter.deleteFromAll();
        deleter.printSummary();
        if (save) {
            deleter.saveJsonReport();
            await deleter.openHtmlReport();
        }
    }
    else if (envUrl) {
        const result = await deleter.deleteFromEnvironment(envUrl);
        if (save && result.solutionDetails) {
            deleter.saveJsonReport();
            await deleter.openHtmlReport();
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
//# sourceMappingURL=solution-delete.js.map