/**
 * User Audit Command
 *
 * Audits user permissions and role assignments in a Dataverse environment
 */
import type { UserAuditReport } from '../types';
export declare class UserAudit {
    private client;
    private envName;
    private report;
    constructor(environmentUrl: string, name?: string);
    authenticate(): Promise<void>;
    runAudit(): Promise<UserAuditReport>;
    printSummary(): void;
    saveJsonReport(filePath?: string): string;
    saveHtmlReport(filePath?: string): string;
    private generateHtmlReport;
    private generatePrivilegedUsersTab;
    private generateDirectRolesTab;
    private generateTeamsTab;
    private getTeamTypeBadge;
    private generateAllUsersTab;
}
/**
 * Run the user audit command
 */
export declare function runUserAuditCommand(args: string[]): Promise<void>;
//# sourceMappingURL=user-audit.d.ts.map