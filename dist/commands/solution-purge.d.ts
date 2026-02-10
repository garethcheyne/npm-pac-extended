/**
 * Solution Purge Command
 *
 * Deep deletion of an unmanaged solution by removing each component individually,
 * then deleting the solution shell. Provides detailed logging of what failed.
 */
import type { SolutionDetails } from '../types';
interface ComponentDeleteResult {
    componentId: string;
    componentType: number;
    typeName: string;
    objectId: string;
    name: string;
    displayName: string;
    success: boolean;
    error?: string;
    skipped?: boolean;
    reason?: string;
}
interface PurgeResult {
    environment: string;
    url: string;
    solutionName: string;
    solutionDetails?: SolutionDetails;
    components: ComponentDeleteResult[];
    solutionDeleted: boolean;
    solutionDeleteError?: string;
    success: boolean;
    error?: string;
    skipped?: boolean;
    reason?: string;
}
interface SolutionPurgeOptions {
    dryRun?: boolean;
    force?: boolean;
    save?: boolean;
    keepSolution?: boolean;
}
export declare class SolutionPurge {
    private solutionName;
    private options;
    private results;
    private report;
    constructor(solutionName: string, options?: SolutionPurgeOptions);
    private formatDate;
    private displaySolutionInfo;
    purgeFromEnvironment(envUrl: string): Promise<PurgeResult>;
    purgeFromAll(): Promise<PurgeResult[]>;
    printSummary(): void;
    saveJsonReport(filePath?: string): string;
    saveHtmlReport(filePath?: string): string;
    private generateHtmlReport;
    private generateComponentBreakdown;
    openHtmlReport(): Promise<void>;
}
/**
 * Run the solution purge command
 */
export declare function runSolutionPurgeCommand(args: string[]): Promise<void>;
export {};
//# sourceMappingURL=solution-purge.d.ts.map