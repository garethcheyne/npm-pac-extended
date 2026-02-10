"use strict";
/**
 * User Audit Command
 *
 * Audits user permissions and role assignments in a Dataverse environment
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
exports.UserAudit = void 0;
exports.runUserAuditCommand = runUserAuditCommand;
const fs = __importStar(require("fs"));
const open_1 = __importDefault(require("open"));
const services_1 = require("../services");
const utils_1 = require("../utils");
const templates_1 = require("../templates");
// Team type names from Dataverse
const TEAM_TYPE_NAMES = {
    0: 'Owner',
    1: 'Access',
    2: 'AAD Security Group',
    3: 'AAD Office Group',
};
function getTeamTypeName(teamType) {
    return TEAM_TYPE_NAMES[teamType] || `Unknown (${teamType})`;
}
class UserAudit {
    client;
    envName;
    report;
    constructor(environmentUrl, name) {
        this.client = new services_1.DataverseClient(environmentUrl, name);
        this.envName = this.client.envName;
        this.report = {
            timestamp: new Date().toISOString(),
            environment: this.envName,
            summary: {
                totalUsers: 0,
                usersWithDirectRoles: 0,
                usersWithTeams: 0,
                usersWithSystemAdmin: 0,
                usersWithSystemCustomizer: 0,
                usersWithDelegatedMailboxApprover: 0,
            },
            users: [],
        };
    }
    async authenticate() {
        await this.client.authenticate();
    }
    async runAudit() {
        utils_1.log.title('User Permission Audit');
        console.log(`Environment: ${utils_1.colors.cyan(this.envName)}`);
        console.log();
        await this.authenticate();
        utils_1.log.info('Fetching users...');
        const users = await this.client.getUsers();
        console.log(`  Found ${users.length} licensed users`);
        utils_1.log.info('Analyzing permissions...');
        let processed = 0;
        for (const user of users) {
            processed++;
            process.stdout.write(`\r  Processing user ${processed}/${users.length}...`);
            // Get direct roles
            const directRoles = await this.client.getUserDirectRoles(user.id);
            // Get team memberships and their roles
            const rawTeams = await this.client.getUserTeams(user.id);
            const teamMemberships = [];
            const teamRoles = [];
            for (const team of rawTeams) {
                const roles = await this.client.getTeamRoles(team.id);
                // Store full team membership info
                teamMemberships.push({
                    id: team.id,
                    name: team.name,
                    teamType: team.teamType,
                    teamTypeName: getTeamTypeName(team.teamType),
                    roles,
                });
                // Also store legacy format for backward compatibility
                if (roles.length > 0) {
                    teamRoles.push({ team: team.name, roles });
                }
            }
            // Combine all roles
            const allRoles = [...directRoles];
            for (const tr of teamRoles) {
                for (const role of tr.roles) {
                    if (!allRoles.find(r => r.id === role.id)) {
                        allRoles.push(role);
                    }
                }
            }
            // Check for privileged roles
            const hasSystemAdmin = allRoles.some(r => r.name === 'System Administrator');
            const hasSystemCustomizer = allRoles.some(r => r.name === 'System Customizer');
            const hasDelegatedMailboxApprover = allRoles.some(r => r.name === 'Delegated Mailbox Approver');
            const entry = {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                isDisabled: user.isDisabled,
                directRoles,
                teams: teamMemberships,
                teamRoles,
                allRoles,
                hasSystemAdmin,
                hasSystemCustomizer,
                hasDelegatedMailboxApprover,
            };
            this.report.users.push(entry);
        }
        console.log(); // New line after progress
        // Calculate summary
        this.report.summary = {
            totalUsers: this.report.users.length,
            usersWithDirectRoles: this.report.users.filter(u => u.directRoles.length > 0).length,
            usersWithTeams: this.report.users.filter(u => u.teams.length > 0).length,
            usersWithSystemAdmin: this.report.users.filter(u => u.hasSystemAdmin).length,
            usersWithSystemCustomizer: this.report.users.filter(u => u.hasSystemCustomizer).length,
            usersWithDelegatedMailboxApprover: this.report.users.filter(u => u.hasDelegatedMailboxApprover).length,
        };
        return this.report;
    }
    printSummary() {
        console.log();
        console.log(utils_1.colors.bold('═'.repeat(60)));
        console.log(utils_1.colors.bold('  USER PERMISSION AUDIT SUMMARY'));
        console.log(utils_1.colors.bold('═'.repeat(60)));
        console.log();
        console.log(`  Total Licensed Users:     ${utils_1.colors.cyan(this.report.summary.totalUsers.toString())}`);
        console.log(`  Users with Direct Roles:  ${utils_1.colors.yellow(this.report.summary.usersWithDirectRoles.toString())}`);
        console.log(`  Users with Team Access:   ${utils_1.colors.green(this.report.summary.usersWithTeams.toString())}`);
        console.log();
        console.log(utils_1.colors.bold('  Privileged Users:'));
        console.log(`    System Administrators:         ${utils_1.colors.red(this.report.summary.usersWithSystemAdmin.toString())}`);
        console.log(`    System Customizers:            ${utils_1.colors.red(this.report.summary.usersWithSystemCustomizer.toString())}`);
        console.log(`    Delegated Mailbox Approvers:   ${utils_1.colors.red(this.report.summary.usersWithDelegatedMailboxApprover.toString())}`);
        console.log();
        console.log(utils_1.colors.bold('═'.repeat(60)));
    }
    saveJsonReport(filePath) {
        const jsonPath = filePath || (0, utils_1.getReportPath)('user-audit', 'json', this.client.envUrl);
        fs.writeFileSync(jsonPath, JSON.stringify(this.report, null, 2));
        utils_1.log.success(`JSON report saved to: ${jsonPath}`);
        return jsonPath;
    }
    saveHtmlReport(filePath) {
        const htmlPath = filePath || (0, utils_1.getReportPath)('user-audit', 'html', this.client.envUrl);
        const html = this.generateHtmlReport();
        fs.writeFileSync(htmlPath, html);
        utils_1.log.success(`HTML report saved to: ${htmlPath}`);
        return htmlPath;
    }
    generateHtmlReport() {
        const usersWithDirect = this.report.users.filter(u => u.directRoles.length > 0);
        const usersWithTeams = this.report.users.filter(u => u.teams.length > 0);
        const privilegedUsers = this.report.users.filter(u => u.hasSystemAdmin || u.hasSystemCustomizer || u.hasDelegatedMailboxApprover);
        const bodyContent = `
      ${(0, templates_1.generateSummaryCards)([
            { value: this.report.summary.totalUsers, label: 'Licensed Users', type: 'info' },
            { value: this.report.summary.usersWithSystemAdmin, label: 'System Admins', type: 'danger' },
            { value: this.report.summary.usersWithSystemCustomizer, label: 'System Customizers', type: 'danger' },
            { value: this.report.summary.usersWithDelegatedMailboxApprover, label: 'Mailbox Approvers', type: 'danger' },
            { value: this.report.summary.usersWithDirectRoles, label: 'Direct Role Users', type: 'warning' },
            { value: this.report.summary.usersWithTeams, label: 'Team Members', type: 'match' },
        ])}

      <div class="filter-controls" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
        <div class="tabs">
          <button class="tab active" onclick="showTab('privileged')">Privileged Users (${privilegedUsers.length})</button>
          <button class="tab" onclick="showTab('direct')">Direct Roles (${usersWithDirect.length})</button>
          <button class="tab" onclick="showTab('teams')">Teams (${usersWithTeams.length})</button>
          <button class="tab" onclick="showTab('all')">All Users (${this.report.users.length})</button>
        </div>
        <label class="toggle-switch" style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;">
          <input type="checkbox" id="hideDisabled" onchange="toggleDisabledUsers()" style="width: 18px; height: 18px; cursor: pointer;">
          <span style="color: var(--text-dim); font-size: 0.9rem;">Hide Disabled Users</span>
        </label>
      </div>

      ${this.generatePrivilegedUsersTab(privilegedUsers)}
      ${this.generateDirectRolesTab(usersWithDirect)}
      ${this.generateTeamsTab(usersWithTeams)}
      ${this.generateAllUsersTab()}
    `;
        return (0, templates_1.generateHtmlDocument)({
            title: 'User Permission Audit',
            subtitle: 'Security role analysis and compliance check',
            timestamp: new Date(this.report.timestamp).toLocaleString(),
            environment: this.envName,
        }, bodyContent);
    }
    generatePrivilegedUsersTab(users) {
        if (users.length === 0) {
            return `
        <div id="tab-privileged" class="tab-content active">
          <div style="background: var(--bg-card); border-radius: 8px; padding: 30px; text-align: center; margin: 20px 0;">
            <div style="font-size: 3em; margin-bottom: 10px;">✓</div>
            <div style="color: var(--match); font-size: 1.2em;">No Privileged Users</div>
          </div>
        </div>
      `;
        }
        let rows = '';
        for (const user of users) {
            const badges = [];
            if (user.hasSystemAdmin)
                badges.push('<span class="badge badge-admin">System Administrator</span>');
            if (user.hasSystemCustomizer)
                badges.push('<span class="badge badge-customizer">System Customizer</span>');
            if (user.hasDelegatedMailboxApprover)
                badges.push('<span class="badge badge-mailbox">Delegated Mailbox Approver</span>');
            const directRoleNames = user.directRoles.map(r => r.name);
            const sources = [];
            if (user.hasSystemAdmin) {
                sources.push(directRoleNames.includes('System Administrator') ? 'Direct' : 'Team');
            }
            if (user.hasSystemCustomizer) {
                sources.push(directRoleNames.includes('System Customizer') ? 'Direct' : 'Team');
            }
            if (user.hasDelegatedMailboxApprover) {
                sources.push(directRoleNames.includes('Delegated Mailbox Approver') ? 'Direct' : 'Team');
            }
            // Show team names
            const teamsList = user.teams.length > 0
                ? user.teams.map(t => `<span class="badge badge-match" title="${t.teamTypeName}">${t.name}</span>`).join(' ')
                : '<span style="color: var(--text-dim);">None</span>';
            rows += `
        <tr data-disabled="${user.isDisabled}">
          <td>${user.fullName || 'N/A'}</td>
          <td>${user.email || 'N/A'}</td>
          <td class="${user.isDisabled ? 'status-disabled' : 'status-enabled'}">${user.isDisabled ? 'Disabled' : 'Enabled'}</td>
          <td>${badges.join(' ')}</td>
          <td>${sources.join(', ')}</td>
          <td>${teamsList}</td>
        </tr>
      `;
        }
        return `
      <div id="tab-privileged" class="tab-content active">
        <h3 style="color: var(--missing); margin: 20px 0;">Privileged Users (${users.length})</h3>
        <p style="color: var(--text-dim); margin-bottom: 15px;">Users with System Administrator, System Customizer, or Delegated Mailbox Approver roles.</p>
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Status</th><th>Privileged Roles</th><th>Source</th><th>Teams</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    }
    generateDirectRolesTab(users) {
        let rows = '';
        for (const user of users) {
            const roleList = user.directRoles.map(r => `<span class="badge badge-differ">${r.name}</span>`).join(' ');
            // Show team names
            const teamsList = user.teams.length > 0
                ? user.teams.map(t => `<span class="badge badge-match" title="${t.teamTypeName}">${t.name}</span>`).join(' ')
                : '<span style="color: var(--text-dim);">None</span>';
            rows += `
        <tr data-disabled="${user.isDisabled}">
          <td>${user.fullName || 'N/A'}</td>
          <td>${user.email || 'N/A'}</td>
          <td class="${user.isDisabled ? 'status-disabled' : 'status-enabled'}">${user.isDisabled ? 'Disabled' : 'Enabled'}</td>
          <td>${user.directRoles.length}</td>
          <td>${roleList}</td>
          <td>${teamsList}</td>
        </tr>
      `;
        }
        return `
      <div id="tab-direct" class="tab-content">
        <h3 style="color: var(--differ); margin: 20px 0;">Users with Direct Role Assignments (${users.length})</h3>
        <p style="color: var(--text-dim); margin-bottom: 15px;">These users have roles assigned directly rather than through teams. Consider moving to team-based assignments.</p>
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Status</th><th># Roles</th><th>Direct Roles</th><th>Teams</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    }
    generateTeamsTab(users) {
        // Get all unique teams across all users
        const teamMap = new Map();
        for (const user of users) {
            for (const team of user.teams) {
                if (!teamMap.has(team.id)) {
                    teamMap.set(team.id, { team, users: [] });
                }
                teamMap.get(team.id).users.push(user);
            }
        }
        // Sort teams by member count (descending)
        const sortedTeams = Array.from(teamMap.values()).sort((a, b) => b.users.length - a.users.length);
        let teamCards = '';
        for (const { team, users: teamUsers } of sortedTeams) {
            const teamTypeBadge = this.getTeamTypeBadge(team.teamType);
            const rolesList = team.roles.length > 0
                ? team.roles.map(r => `<span class="badge badge-differ">${r.name}</span>`).join(' ')
                : '<span style="color: var(--text-dim);">No roles assigned</span>';
            const usersList = teamUsers.map(u => `<div style="padding: 4px 0;">• ${u.fullName || 'N/A'} (${u.email || 'N/A'})</div>`).join('');
            teamCards += `
        <div style="background: var(--bg-card); border-radius: 8px; padding: 20px; margin-bottom: 15px; border-left: 4px solid var(--match);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="margin: 0;">${team.name}</h4>
            ${teamTypeBadge}
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Roles:</strong> ${rolesList}
          </div>
          <details>
            <summary style="cursor: pointer; color: var(--text-dim);">Members (${teamUsers.length})</summary>
            <div style="margin-top: 10px; padding-left: 10px;">${usersList}</div>
          </details>
        </div>
      `;
        }
        return `
      <div id="tab-teams" class="tab-content">
        <h3 style="color: var(--match); margin: 20px 0;">Team Memberships (${sortedTeams.length} teams)</h3>
        <p style="color: var(--text-dim); margin-bottom: 15px;">Security teams and their members. Team-based role assignments are the recommended approach.</p>
        ${teamCards || '<div style="background: var(--bg-card); border-radius: 8px; padding: 30px; text-align: center;"><div style="color: var(--text-dim);">No team memberships found</div></div>'}
      </div>
    `;
    }
    getTeamTypeBadge(teamType) {
        const typeName = getTeamTypeName(teamType);
        const badgeClass = teamType === 2 || teamType === 3 ? 'badge-match' : 'badge-differ';
        return `<span class="badge ${badgeClass}">${typeName}</span>`;
    }
    generateAllUsersTab() {
        let rows = '';
        for (const user of this.report.users) {
            const badges = [];
            if (user.hasSystemAdmin)
                badges.push('<span class="badge badge-admin">Admin</span>');
            if (user.hasSystemCustomizer)
                badges.push('<span class="badge badge-customizer">Customizer</span>');
            if (user.directRoles.length > 0)
                badges.push(`<span class="badge badge-differ">${user.directRoles.length} Direct</span>`);
            // Show team names with type badges
            const teamsList = user.teams.length > 0
                ? user.teams.map(t => `<span class="badge badge-match" title="${t.teamTypeName}">${t.name}</span>`).join(' ')
                : '<span style="color: var(--text-dim);">None</span>';
            rows += `
        <tr data-disabled="${user.isDisabled}">
          <td>${user.fullName || 'N/A'}</td>
          <td>${user.email || 'N/A'}</td>
          <td class="${user.isDisabled ? 'status-disabled' : 'status-enabled'}">${user.isDisabled ? 'Disabled' : 'Enabled'}</td>
          <td>${user.allRoles.length}</td>
          <td>${teamsList}</td>
          <td>${badges.join(' ')}</td>
        </tr>
      `;
        }
        return `
      <div id="tab-all" class="tab-content">
        <h3 style="margin: 20px 0;">All Licensed Users (${this.report.users.length})</h3>
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Status</th><th>Total Roles</th><th>Teams</th><th>Flags</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    }
}
exports.UserAudit = UserAudit;
/**
 * Run the user audit command
 */
async function runUserAuditCommand(args) {
    let envUrl = '';
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
            case '--save':
            case '-s':
                save = true;
                break;
        }
    }
    // If --all flag, run audit on all environments from ENV_ALL_TARGETS
    if (useAllTargets) {
        const allTargets = (0, utils_1.getAllTargets)();
        if (allTargets.length === 0) {
            utils_1.log.error('ENV_ALL_TARGETS not set in .env or is empty');
            process.exit(1);
        }
        utils_1.log.title(`User Audit - ${allTargets.length} Environments`);
        console.log();
        for (const target of allTargets) {
            console.log(utils_1.colors.bold(`\n${'═'.repeat(60)}`));
            console.log(utils_1.colors.bold(utils_1.colors.cyan(`  ${target.name}`)));
            console.log(utils_1.colors.bold(`${'═'.repeat(60)}\n`));
            try {
                const audit = new UserAudit(target.url, target.name);
                await audit.runAudit();
                audit.printSummary();
                if (save) {
                    audit.saveJsonReport();
                    audit.saveHtmlReport();
                }
            }
            catch (error) {
                utils_1.log.error(`Failed to audit ${target.name}: ${error.message}`);
            }
        }
        utils_1.log.success(`\nCompleted audit of ${allTargets.length} environments`);
        return;
    }
    // Single environment mode
    if (!envUrl) {
        envUrl = process.env.ENV_DEV_URL || '';
    }
    if (!envUrl) {
        utils_1.log.error('Usage: pac-ext user-audit -e <environment-url> [--all] [--save]');
        utils_1.log.info('  --all, -a    Audit all environments from ENV_ALL_TARGETS');
        process.exit(1);
    }
    const audit = new UserAudit(envUrl);
    await audit.runAudit();
    audit.printSummary();
    if (save) {
        audit.saveJsonReport();
        const htmlPath = audit.saveHtmlReport();
        await (0, open_1.default)(htmlPath);
    }
}
//# sourceMappingURL=user-audit.js.map