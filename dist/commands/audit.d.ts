/**
 * Environment Audit Command
 *
 * Compares a master environment against one or more target environments
 */
import type { AuditReport, ComparisonCategory } from '../types';
interface AuditTarget {
    url: string;
    name: string;
}
interface AuditOptions {
    deep?: boolean;
    save?: boolean;
}
export declare class EnvironmentAudit {
    private master;
    private targets;
    private options;
    private report;
    constructor(masterUrl: string, masterName: string, targets: AuditTarget[], options?: AuditOptions);
    authenticate(): Promise<void>;
    private compareGeneric;
    compareSolutions(): Promise<ComparisonCategory>;
    compareEnvironmentVariables(): Promise<ComparisonCategory>;
    comparePlugins(): Promise<ComparisonCategory>;
    compareWebResources(): Promise<ComparisonCategory>;
    compareTables(): Promise<ComparisonCategory>;
    compareFlows(): Promise<ComparisonCategory>;
    compareCanvasApps(): Promise<ComparisonCategory>;
    compareModelApps(): Promise<ComparisonCategory>;
    compareSecurityRoles(): Promise<ComparisonCategory>;
    compareTableColumnsDeep(): Promise<ComparisonCategory>;
    private formatColumnInfo;
    private compareColumnProperties;
    runAudit(): Promise<AuditReport>;
    printReport(): void;
    saveJsonReport(filePath?: string): string;
    saveHtmlReport(filePath?: string): string;
    private generateHtmlReport;
    private generateCategoryTable;
    private getStatusClass;
    private getStatusIcon;
}
/**
 * Run the audit command
 */
export declare function runAuditCommand(args: string[]): Promise<void>;
export {};
//# sourceMappingURL=audit.d.ts.map