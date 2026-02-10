/**
 * Solution Delete Command
 *
 * Deletes a solution from one or more Dataverse environments
 * with detailed confirmation and reporting
 */
import type { SolutionDetails } from '../types';
interface DeleteResult {
    environment: string;
    url: string;
    solutionName: string;
    solutionDetails?: SolutionDetails;
    success: boolean;
    deletedAt?: string;
    error?: string;
    skipped?: boolean;
    reason?: string;
}
interface SolutionDeleteOptions {
    dryRun?: boolean;
    force?: boolean;
    save?: boolean;
}
export declare class SolutionDelete {
    private solutionName;
    private options;
    private results;
    private report;
    constructor(solutionName: string, options?: SolutionDeleteOptions);
    private formatDate;
    private displaySolutionInfo;
    deleteFromEnvironment(envUrl: string): Promise<DeleteResult>;
    deleteFromAll(): Promise<DeleteResult[]>;
    printSummary(): void;
    saveJsonReport(filePath?: string): string;
    saveHtmlReport(filePath?: string): string;
    private generateHtmlReport;
    private generateSolutionDetailsSection;
    openHtmlReport(): Promise<void>;
}
/**
 * Run the solution delete command
 */
export declare function runSolutionDeleteCommand(args: string[]): Promise<void>;
export {};
//# sourceMappingURL=solution-delete.d.ts.map