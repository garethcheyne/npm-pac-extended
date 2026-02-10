"use strict";
/**
 * Role Cleanup Command
 *
 * Removes direct role assignments from users
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
exports.RoleCleanup = void 0;
exports.runRoleCleanupCommand = runRoleCleanupCommand;
const fs = __importStar(require("fs"));
const services_1 = require("../services");
const utils_1 = require("../utils");
class RoleCleanup {
    client;
    envName;
    envUrl;
    options;
    results = [];
    constructor(environmentUrl, name, options = {}) {
        this.client = new services_1.DataverseClient(environmentUrl, name);
        this.envName = this.client.envName;
        this.envUrl = this.client.envUrl;
        this.options = options;
    }
    async authenticate() {
        await this.client.authenticate();
    }
    async findUsersWithDirectRoles() {
        utils_1.log.info('Finding users with direct role assignments...');
        const users = await this.client.getUsers();
        const usersWithDirect = [];
        let processed = 0;
        for (const user of users) {
            processed++;
            process.stdout.write(`\r  Checking user ${processed}/${users.length}...`);
            const directRoles = await this.client.getUserDirectRoles(user.id);
            if (directRoles.length > 0) {
                usersWithDirect.push({
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    isDisabled: user.isDisabled,
                    directRoles,
                    teamRoles: [],
                    teams: [],
                    allRoles: directRoles,
                    hasSystemAdmin: directRoles.some(r => r.name === 'System Administrator'),
                    hasSystemCustomizer: directRoles.some(r => r.name === 'System Customizer'),
                    hasDelegatedMailboxApprover: directRoles.some(r => r.name === 'Delegated Mailbox Approver'),
                });
            }
        }
        console.log();
        return usersWithDirect;
    }
    async removeRoleFromUser(userId, userName, role) {
        const result = {
            userId,
            userName,
            roleId: role.id,
            roleName: role.name,
            success: false,
        };
        if (this.options.dryRun) {
            utils_1.log.info(`[DRY RUN] Would remove "${role.name}" from ${userName}`);
            result.success = true;
            return result;
        }
        try {
            await this.client.removeUserRole(userId, role.id);
            utils_1.log.success(`Removed "${role.name}" from ${userName}`);
            result.success = true;
        }
        catch (e) {
            result.error = e.message;
            utils_1.log.error(`Failed to remove "${role.name}" from ${userName}: ${result.error}`);
        }
        return result;
    }
    async runCleanup(targetUsers, targetRoles) {
        utils_1.log.title('Role Cleanup');
        console.log(`Environment: ${utils_1.colors.cyan(this.envName)}`);
        if (this.options.dryRun) {
            console.log(utils_1.colors.yellow('DRY RUN MODE - No changes will be made'));
        }
        console.log();
        await this.authenticate();
        const users = targetUsers || await this.findUsersWithDirectRoles();
        if (users.length === 0) {
            utils_1.log.success('No users with direct role assignments found!');
            return [];
        }
        console.log();
        console.log(`Found ${utils_1.colors.yellow(users.length.toString())} users with direct role assignments`);
        console.log();
        // Show summary
        console.log(utils_1.colors.bold('Users to process:'));
        console.log('─'.repeat(60));
        for (const user of users.slice(0, 10)) {
            console.log(`  ${user.fullName} (${user.email})`);
            for (const role of user.directRoles) {
                const shouldRemove = !targetRoles || targetRoles.includes(role.name);
                const marker = shouldRemove ? utils_1.colors.red('✗') : utils_1.colors.dim('○');
                console.log(`    ${marker} ${role.name}`);
            }
        }
        if (users.length > 10) {
            console.log(utils_1.colors.dim(`  ... and ${users.length - 10} more users`));
        }
        console.log();
        // Confirm unless forced
        if (!this.options.force && !this.options.dryRun) {
            const proceed = await (0, utils_1.promptYN)('Proceed with role removal?', false);
            if (!proceed) {
                utils_1.log.warn('Cleanup cancelled');
                return [];
            }
        }
        // Process removals
        console.log();
        utils_1.log.title('Processing Removals');
        for (const user of users) {
            for (const role of user.directRoles) {
                // Skip if we have a target role list and this role isn't in it
                if (targetRoles && !targetRoles.includes(role.name)) {
                    continue;
                }
                const result = await this.removeRoleFromUser(user.id, user.fullName, role);
                this.results.push(result);
            }
        }
        return this.results;
    }
    printSummary() {
        const successful = this.results.filter(r => r.success).length;
        const failed = this.results.filter(r => !r.success).length;
        console.log();
        console.log(utils_1.colors.bold('═'.repeat(60)));
        console.log(utils_1.colors.bold('  CLEANUP SUMMARY'));
        console.log(utils_1.colors.bold('═'.repeat(60)));
        console.log();
        console.log(`  ${utils_1.colors.green(`✓ ${successful} role assignments removed`)}`);
        if (failed > 0) {
            console.log(`  ${utils_1.colors.red(`✗ ${failed} removals failed`)}`);
        }
        console.log(utils_1.colors.bold('═'.repeat(60)));
    }
    saveReport(filePath) {
        const jsonPath = filePath || (0, utils_1.getReportPath)('role-cleanup', 'json', this.envUrl);
        const report = {
            timestamp: new Date().toISOString(),
            environment: this.envName,
            dryRun: this.options.dryRun || false,
            results: this.results,
            summary: {
                total: this.results.length,
                successful: this.results.filter(r => r.success).length,
                failed: this.results.filter(r => !r.success).length,
            },
        };
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
        utils_1.log.success(`Report saved to: ${jsonPath}`);
        return jsonPath;
    }
}
exports.RoleCleanup = RoleCleanup;
/**
 * Run the role cleanup command
 */
async function runRoleCleanupCommand(args) {
    let envUrl = '';
    let dryRun = false;
    let force = false;
    let save = false;
    let useAllTargets = false;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
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
            case '--force':
            case '-f':
                force = true;
                break;
            case '--save':
            case '-s':
                save = true;
                break;
        }
    }
    // If --all flag, run cleanup on all environments from ENV_ALL_TARGETS
    if (useAllTargets) {
        const allTargets = (0, utils_1.getAllTargets)();
        if (allTargets.length === 0) {
            utils_1.log.error('ENV_ALL_TARGETS not set in .env or is empty');
            process.exit(1);
        }
        utils_1.log.title(`Role Cleanup - ${allTargets.length} Environments`);
        if (dryRun) {
            utils_1.log.warn('DRY RUN MODE - No changes will be made');
        }
        console.log();
        for (const target of allTargets) {
            console.log(utils_1.colors.bold(`\n${'═'.repeat(60)}`));
            console.log(utils_1.colors.bold(utils_1.colors.cyan(`  ${target.name}`)));
            console.log(utils_1.colors.bold(`${'═'.repeat(60)}\n`));
            try {
                const cleanup = new RoleCleanup(target.url, target.name, { dryRun, force });
                await cleanup.runCleanup();
                cleanup.printSummary();
                if (save) {
                    cleanup.saveReport();
                }
            }
            catch (error) {
                utils_1.log.error(`Failed to cleanup ${target.name}: ${error.message}`);
            }
        }
        utils_1.log.success(`\nCompleted cleanup of ${allTargets.length} environments`);
        return;
    }
    // Single environment mode
    if (!envUrl) {
        envUrl = process.env.ENV_DEV_URL || '';
    }
    if (!envUrl) {
        utils_1.log.error('Usage: pac-ext role-cleanup -e <environment-url> [--all] [--dry-run] [--force] [--save]');
        utils_1.log.info('  --all, -a    Run on all environments from ENV_ALL_TARGETS');
        process.exit(1);
    }
    const cleanup = new RoleCleanup(envUrl, undefined, { dryRun, force });
    await cleanup.runCleanup();
    cleanup.printSummary();
    if (save) {
        cleanup.saveReport();
    }
}
//# sourceMappingURL=role-cleanup.js.map