/**
 * Report path generation utilities
 */
export type ReportType = 'audit' | 'user-audit' | 'role-cleanup' | 'solution-delete' | 'solution-purge';
export type ReportExtension = 'json' | 'html';
/**
 * Generates a report path with environment and date-based subdirectories
 * Structure: reports/{envName}/{date}/{command}/report-{time}.{ext}
 * e.g., reports/aucmnswcrp01/2026-02-09/audit/report-143000.json
 */
export declare function getReportPath(command: ReportType, extension: ReportExtension, environmentUrl?: string): string;
/**
 * Generates a report path for comparison audits (multiple environments)
 * Structure: reports/audit-compare/{date}/report-{time}.{ext}
 */
export declare function getCompareReportPath(extension: ReportExtension, masterUrl?: string): string;
/**
 * Saves JSON report to file
 */
export declare function saveJsonReport(filePath: string, data: unknown): void;
/**
 * Saves HTML report to file
 */
export declare function saveHtmlReport(filePath: string, html: string): void;
//# sourceMappingURL=reports.d.ts.map