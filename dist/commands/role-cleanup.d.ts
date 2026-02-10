/**
 * Role Cleanup Command
 *
 * Removes direct role assignments from users
 */
import type { UserAuditEntry, UserRole } from '../types';
interface RoleCleanupOptions {
    dryRun?: boolean;
    force?: boolean;
}
interface CleanupResult {
    userId: string;
    userName: string;
    roleId: string;
    roleName: string;
    success: boolean;
    error?: string;
}
export declare class RoleCleanup {
    private client;
    private envName;
    private envUrl;
    private options;
    private results;
    constructor(environmentUrl: string, name?: string, options?: RoleCleanupOptions);
    authenticate(): Promise<void>;
    findUsersWithDirectRoles(): Promise<UserAuditEntry[]>;
    removeRoleFromUser(userId: string, userName: string, role: UserRole): Promise<CleanupResult>;
    runCleanup(targetUsers?: UserAuditEntry[], targetRoles?: string[]): Promise<CleanupResult[]>;
    printSummary(): void;
    saveReport(filePath?: string): string;
}
/**
 * Run the role cleanup command
 */
export declare function runRoleCleanupCommand(args: string[]): Promise<void>;
export {};
//# sourceMappingURL=role-cleanup.d.ts.map