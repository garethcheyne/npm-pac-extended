/**
 * Dataverse API Client
 *
 * Provides typed access to Dataverse Web API endpoints
 */
import type { Solution, SolutionDetails, SolutionComponent, EnvironmentVariable, Plugin, WebResource, CloudFlow, CanvasApp, ModelApp, SecurityRole, User, Team, CustomTable, TableColumn, UserRole } from '../types';
export declare class DataverseClient {
    private authClient;
    private url;
    private name;
    constructor(environmentUrl: string, name?: string);
    private extractEnvName;
    get envName(): string;
    get envUrl(): string;
    authenticate(): Promise<void>;
    private fetch;
    private delete;
    getSolutions(): Promise<Solution[]>;
    getSolutionByName(uniqueName: string): Promise<{
        solutionid: string;
        uniquename: string;
        friendlyname: string;
        version: string;
        ismanaged: boolean;
    } | null>;
    getSolutionDetails(uniqueName: string): Promise<SolutionDetails | null>;
    private getSolutionComponentCounts;
    deleteSolution(solutionId: string): Promise<void>;
    /**
     * Get all components in a solution with their details
     */
    getSolutionComponents(solutionId: string): Promise<SolutionComponent[]>;
    private getComponentTypeName;
    private canDeleteComponentType;
    private getComponentDetails;
    /**
     * Delete a specific component by type and ID
     */
    deleteComponent(type: number, objectId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    private deactivateWorkflow;
    getEnvironmentVariables(): Promise<EnvironmentVariable[]>;
    getPlugins(): Promise<Plugin[]>;
    getWebResources(): Promise<WebResource[]>;
    getTables(): Promise<CustomTable[]>;
    getTableColumns(tableName: string): Promise<TableColumn[]>;
    getFlows(): Promise<CloudFlow[]>;
    getCanvasApps(): Promise<CanvasApp[]>;
    getModelApps(): Promise<ModelApp[]>;
    getSecurityRoles(): Promise<SecurityRole[]>;
    getAllRoles(): Promise<SecurityRole[]>;
    getUsers(): Promise<User[]>;
    getUserDirectRoles(userId: string): Promise<UserRole[]>;
    getUserTeams(userId: string): Promise<Team[]>;
    getTeamRoles(teamId: string): Promise<UserRole[]>;
    removeUserRole(userId: string, roleId: string): Promise<boolean>;
}
//# sourceMappingURL=dataverse-client.d.ts.map