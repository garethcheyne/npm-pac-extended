#!/usr/bin/env node
"use strict";
/**
 * PAC Extended CLI
 *
 * A simplified wrapper for the Power Platform CLI (PAC) that makes deployments easier.
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
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./utils");
const audit_1 = require("./commands/audit");
const user_audit_1 = require("./commands/user-audit");
const role_cleanup_1 = require("./commands/role-cleanup");
const solution_delete_1 = require("./commands/solution-delete");
const solution_purge_1 = require("./commands/solution-purge");
const dataverse_proxy_1 = require("./services/dataverse-proxy");
// Load .env if exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    dotenv.config();
}
// =============================================================================
// PAC CLI HELPERS
// =============================================================================
function runPac(args, options = {}) {
    const cmd = `pac ${args}`;
    utils_1.log.info(utils_1.colors.dim(`Running: ${cmd}`));
    try {
        const result = (0, child_process_1.execSync)(cmd, {
            encoding: 'utf-8',
            stdio: options.silent ? 'pipe' : 'inherit',
        });
        return result || '';
    }
    catch (error) {
        if (!options.ignoreError) {
            utils_1.log.error(`Command failed: ${cmd}`);
        }
        throw error;
    }
}
// =============================================================================
// BASIC COMMANDS
// =============================================================================
async function cmdInit() {
    utils_1.log.title('PAC Extended - Initialize Project');
    console.log('\nThis will create a .env file with your environment configuration.\n');
    const config = {
        SOLUTION_NAME: await (0, utils_1.prompt)('Solution unique name'),
        SOLUTION_DISPLAY_NAME: await (0, utils_1.prompt)('Solution display name'),
        SOLUTION_PUBLISHER_PREFIX: await (0, utils_1.prompt)('Publisher prefix', 'new'),
        ENV_DEV_URL: await (0, utils_1.prompt)('Development environment URL'),
        ENV_TEST_URL: await (0, utils_1.prompt)('Test environment URL (optional)') || '',
        ENV_PROD_URL: await (0, utils_1.prompt)('Production environment URL (optional)') || '',
    };
    let envContent = '# PAC Extended Configuration\n\n';
    envContent += '# Solution Settings\n';
    for (const [key, value] of Object.entries(config)) {
        if (value) {
            envContent += `${key}=${value}\n`;
        }
    }
    fs.writeFileSync('.env', envContent);
    utils_1.log.success('Created .env file');
    // Add to .gitignore if not present
    const gitignorePath = '.gitignore';
    if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
        if (!gitignore.includes('.env')) {
            fs.appendFileSync(gitignorePath, '\n# PAC Extended\n.env\n.token-cache.json\n');
            utils_1.log.success('Added .env to .gitignore');
        }
    }
}
function cmdAuth() {
    utils_1.log.title('Authenticate to Power Platform');
    runPac('auth create');
}
function cmdAuthList() {
    utils_1.log.title('Authentication Profiles');
    runPac('auth list');
}
function cmdAuthClear() {
    utils_1.log.title('Clear Authentication');
    runPac('auth clear');
}
function cmdEnvList() {
    utils_1.log.title('Available Environments');
    runPac('org list');
}
function cmdEnvSelect() {
    utils_1.log.title('Select Environment');
    runPac('org select');
}
function cmdSolutionList() {
    utils_1.log.title('Solutions in Current Environment');
    runPac('solution list');
}
async function cmdSolutionClone() {
    utils_1.log.title('Clone Solution');
    const solutionName = process.env.SOLUTION_NAME || await (0, utils_1.prompt)('Solution unique name');
    runPac(`solution clone --name ${solutionName} --outputDirectory src`);
}
async function cmdDeploy() {
    utils_1.log.title('Deploy Solution');
    const solutionName = process.env.SOLUTION_NAME;
    if (!solutionName) {
        utils_1.log.error('SOLUTION_NAME not set in .env');
        process.exit(1);
    }
    // Bump version
    utils_1.log.info('Bumping version...');
    runPac(`solution version --buildversion +`);
    // Pack
    utils_1.log.info('Packing solution...');
    const zipPath = `solutions/${solutionName}.zip`;
    runPac(`solution pack --zipfile ${zipPath} --folder src`);
    // Import
    utils_1.log.info('Importing solution...');
    runPac(`solution import --path ${zipPath}`);
    // Publish
    utils_1.log.info('Publishing customizations...');
    runPac('solution publish');
    utils_1.log.success('Deployment complete!');
}
function cmdPublish() {
    utils_1.log.title('Publish Customizations');
    runPac('solution publish');
}
function cmdStatus() {
    utils_1.log.title('PAC Extended Status');
    console.log(utils_1.colors.bold('\nConfiguration:'));
    console.log('─'.repeat(40));
    console.log(`  Solution: ${process.env.SOLUTION_NAME || utils_1.colors.dim('(not set)')}`);
    console.log(`  Dev URL:  ${process.env.ENV_DEV_URL || utils_1.colors.dim('(not set)')}`);
    console.log(`  Test URL: ${process.env.ENV_TEST_URL || utils_1.colors.dim('(not set)')}`);
    console.log(`  Prod URL: ${process.env.ENV_PROD_URL || utils_1.colors.dim('(not set)')}`);
    // Show numbered environment counts
    const envSummary = (0, utils_1.getEnvSummary)();
    if (envSummary.total > 0) {
        console.log();
        console.log(utils_1.colors.bold('  Numbered Environments:'));
        const testTargets = (0, utils_1.getTestTargets)();
        const prodTargets = (0, utils_1.getProdTargets)();
        if (testTargets.length > 0) {
            console.log(`    Test (ENV_TEST_URL_XX): ${utils_1.colors.cyan(`${testTargets.length} configured`)}`);
            for (const t of testTargets) {
                console.log(`      ${utils_1.colors.dim('•')} ${t.name}`);
            }
        }
        if (prodTargets.length > 0) {
            console.log(`    Prod (ENV_PROD_URL_XX): ${utils_1.colors.cyan(`${prodTargets.length} configured`)}`);
            for (const p of prodTargets) {
                console.log(`      ${utils_1.colors.dim('•')} ${p.name}`);
            }
        }
    }
    console.log(utils_1.colors.bold('\nAuthentication:'));
    console.log('─'.repeat(40));
    try {
        runPac('auth list', { silent: false });
    }
    catch {
        utils_1.log.warn('Not authenticated');
    }
}
function cmdHelp() {
    console.log(`
${utils_1.colors.bold(utils_1.colors.cyan('PAC Extended'))} - Simplified Power Platform CLI

${utils_1.colors.bold('Usage:')} pac-ext <command> [options]

${utils_1.colors.bold('Commands:')}
  ${utils_1.colors.cyan('init')}              Initialize project, create .env configuration
  ${utils_1.colors.cyan('auth')}              Authenticate to default environment
  ${utils_1.colors.cyan('auth-list')}         List auth profiles
  ${utils_1.colors.cyan('auth-clear')}        Clear all auth profiles
  ${utils_1.colors.cyan('env-list')}          List available environments
  ${utils_1.colors.cyan('env-select')}        Select active environment
  ${utils_1.colors.cyan('solution-list')}     List solutions in current environment
  ${utils_1.colors.cyan('solution-clone')}    Clone solution from environment
  ${utils_1.colors.cyan('deploy')}            Bump version, pack, and deploy
  ${utils_1.colors.cyan('publish')}           Publish all customizations
  ${utils_1.colors.cyan('status')}            Show configuration and auth status

${utils_1.colors.bold('Audit Commands:')}
  ${utils_1.colors.cyan('audit')}             Compare environments (master vs targets)
    --master, -m      Master environment URL (default: ENV_PROD_URL)
    --compare, -c     Target environment URL(s)
    --all, -a         Use all environments (ENV_TEST_URL_XX + ENV_PROD_URL_XX)
    --deep, -d        Include table column comparison
    --save, -s        Save reports to file

  ${utils_1.colors.cyan('user-audit')}        Audit user permissions
    -e, --environment Environment URL
    --all, -a         Audit all environments (ENV_TEST_URL_XX + ENV_PROD_URL_XX)
    --save, -s        Save reports to file

  ${utils_1.colors.cyan('role-cleanup')}      Remove direct role assignments
    -e, --environment Environment URL
    --all, -a         Run on all environments (ENV_TEST_URL_XX + ENV_PROD_URL_XX)
    --dry-run         Preview changes without executing
    --force, -f       Skip confirmation
    --save, -s        Save report to file

  ${utils_1.colors.cyan('solution-delete')}   Delete a solution from environments
    <name>            Solution unique name (or use -n)
    -n, --name        Solution unique name
    -e, --environment Single environment URL
    --all, -a         Delete from all environments (ENV_TEST_URL_XX + ENV_PROD_URL_XX)
    --dry-run         Preview what would be deleted
    --force, -f       Skip confirmation prompts
    --save, -s        Save report to file and open in browser

  ${utils_1.colors.cyan('solution-purge')}    Deep delete unmanaged solution (delete components first)
    <name>            Solution unique name (or use -n)
    -n, --name        Solution unique name
    -e, --environment Single environment URL
    --all, -a         Purge from all environments (ENV_TEST_URL_XX + ENV_PROD_URL_XX)
    --dry-run         Preview components that would be deleted
    --force, -f       Skip confirmation prompts
    --keep-solution   Delete components only, keep the solution shell
    --save, -s        Save report to file and open in browser

${utils_1.colors.bold('Environment Variables:')}
  ENV_DEV_URL         Development environment URL
  ENV_TEST_URL        Test environment URL
  ENV_PROD_URL        Production environment URL (used as master)
  ENV_TEST_URL_01-99  Numbered test environments for --all flag
  ENV_PROD_URL_01-99  Numbered prod environments for --all flag

${utils_1.colors.bold('Examples:')}
  pac-ext init
  pac-ext auth
  pac-ext deploy
  pac-ext audit --master https://dev.crm.dynamics.com --compare https://test.crm.dynamics.com --save
  pac-ext audit --all --save                    # Compare all numbered environments
  pac-ext user-audit -e https://dev.crm.dynamics.com --save
  pac-ext user-audit --all --save               # Audit all numbered environments
  pac-ext solution-delete MySolution --all      # Delete from all environments
  pac-ext solution-delete MySolution -e https://test.crm.dynamics.com --force
  pac-ext solution-purge MySolution --all --save  # Deep delete from all environments
  pac-ext solution-purge MySolution -e https://test.crm.dynamics.com --dry-run
`);
}
// =============================================================================
// COMMAND ROUTING
// =============================================================================
const args = process.argv.slice(2);
const command = args[0];
const commandArgs = args.slice(1);
const commands = {
    'init': cmdInit,
    'auth': cmdAuth,
    'auth-list': cmdAuthList,
    'auth-clear': cmdAuthClear,
    'env-list': cmdEnvList,
    'env-select': cmdEnvSelect,
    'solution-list': cmdSolutionList,
    'solution-clone': cmdSolutionClone,
    'solution-delete': () => (0, solution_delete_1.runSolutionDeleteCommand)(commandArgs),
    'solution-purge': () => (0, solution_purge_1.runSolutionPurgeCommand)(commandArgs),
    'deploy': cmdDeploy,
    'publish': cmdPublish,
    'status': cmdStatus,
    'help': cmdHelp,
    'audit': () => (0, audit_1.runAuditCommand)(commandArgs),
    'user-audit': () => (0, user_audit_1.runUserAuditCommand)(commandArgs),
    'role-cleanup': () => (0, role_cleanup_1.runRoleCleanupCommand)(commandArgs),
    'proxy': () => (0, dataverse_proxy_1.runProxyCommand)(commandArgs),
};
async function main() {
    if (command && commands[command]) {
        await commands[command](commandArgs);
    }
    else {
        cmdHelp();
    }
}
main().catch(err => {
    utils_1.log.error(err.message);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map