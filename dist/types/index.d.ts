/**
 * Type definitions for Dataverse API responses and internal data structures
 */
export interface DataverseResponse<T> {
    value: T[];
    '@odata.context'?: string;
    '@odata.nextLink'?: string;
}
export interface DataverseSolution {
    uniquename: string;
    friendlyname: string;
    version: string;
    ismanaged: boolean;
    installedon: string;
}
export interface DataverseEnvironmentVariableDefinition {
    schemaname: string;
    displayname: string;
    type: number;
    environmentvariabledefinitionid: string;
}
export interface DataverseEnvironmentVariableValue {
    value: string;
}
export interface DataversePluginAssembly {
    name: string;
    version: string;
    publickeytoken: string;
    isolationmode: number;
}
export interface DataverseWebResource {
    name: string;
    displayname: string;
    webresourcetype: number;
}
export interface DataverseWorkflow {
    name: string;
    uniquename: string;
    statecode: number;
    statuscode: number;
}
export interface DataverseCanvasApp {
    name: string;
    displayname: string;
    appversion: string;
}
export interface DataverseAppModule {
    name: string;
    uniquename: string;
    appmoduleversion: string;
}
export interface DataverseRole {
    roleid: string;
    name: string;
    ismanaged?: boolean;
    iscustomizable?: {
        Value: boolean;
    };
}
export interface DataverseSystemUser {
    systemuserid: string;
    fullname: string;
    domainname: string;
    internalemailaddress: string;
    isdisabled: boolean;
    accessmode: number;
}
export interface DataverseTeam {
    teamid: string;
    name: string;
    teamtype: number;
}
export interface DataverseEntityDefinition {
    LogicalName: string;
    DisplayName?: {
        UserLocalizedLabel?: {
            Label: string;
        };
    };
    TableType?: string;
    IsCustomEntity?: boolean;
}
export interface DataverseAttributeDefinition {
    LogicalName: string;
    DisplayName?: {
        UserLocalizedLabel?: {
            Label: string;
        };
    };
    AttributeType: string;
    RequiredLevel?: {
        Value: string;
    };
    MaxLength?: number;
    MinValue?: number;
    MaxValue?: number;
    Precision?: number;
}
export interface Solution {
    name: string;
    displayName: string;
    version: string;
    isManaged: boolean;
    installedOn: string;
}
export interface SolutionComponentCounts {
    entities: number;
    webResources: number;
    plugins: number;
    workflows: number;
    canvasApps: number;
    modelApps: number;
    securityRoles: number;
    envVariables: number;
    total: number;
}
export interface SolutionDetails {
    solutionId: string;
    uniqueName: string;
    displayName: string;
    version: string;
    isManaged: boolean;
    installedOn: string;
    description: string;
    publisherName: string;
    modifiedOn: string;
    createdOn: string;
    components: SolutionComponentCounts;
}
export declare enum ComponentType {
    Entity = 1,
    Attribute = 2,
    Relationship = 3,
    OptionSet = 9,
    EntityKey = 14,
    Role = 20,
    RolePrivilege = 21,
    DisplayString = 22,
    Workflow = 29,
    Report = 31,
    ConnectionRole = 41,
    EmailTemplate = 36,
    ContractTemplate = 37,
    KBArticleTemplate = 38,
    MailMergeTemplate = 39,
    DuplicateRule = 44,
    SavedQuery = 26,
    SavedQueryVisualization = 59,
    SystemForm = 60,
    WebResource = 61,
    SiteMap = 62,
    PluginAssembly = 91,
    PluginType = 90,
    SDKMessageProcessingStep = 92,
    ServiceEndpoint = 95,
    RoutingRule = 150,
    SLA = 152,
    ConvertRule = 154,
    HierarchyRule = 65,
    MobileOfflineProfile = 161,
    SimilarityRule = 165,
    CustomControl = 66,
    CustomControlDefaultConfig = 68,
    AppModule = 80,
    CanvasApp = 300,
    Connector = 371,
    EnvironmentVariableDefinition = 380,
    EnvironmentVariableValue = 381,
    AIModel = 401,
    AIConfiguration = 402
}
export interface SolutionComponent {
    solutioncomponentid: string;
    componenttype: number;
    objectid: string;
    rootcomponentbehavior: number;
    ismetadata: boolean;
    name?: string;
    displayName?: string;
    typeName?: string;
    canDelete?: boolean;
    deleteError?: string;
}
export interface EnvironmentVariable {
    name: string;
    displayName: string;
    type: number;
    value: string;
}
export interface Plugin {
    name: string;
    version: string;
    publicKeyToken: string;
    isolationMode: number;
}
export interface WebResource {
    name: string;
    displayName: string;
    type: number;
}
export interface CloudFlow {
    name: string;
    uniqueName: string;
    state: string;
}
export interface CanvasApp {
    name: string;
    displayName: string;
    version: string;
}
export interface ModelApp {
    name: string;
    uniqueName: string;
    version: string;
}
export interface SecurityRole {
    id: string;
    name: string;
    isManaged?: boolean;
    isCustomizable?: boolean;
}
export interface User {
    id: string;
    fullName: string;
    domainName: string;
    email: string;
    isDisabled: boolean;
    accessMode: number;
}
export interface Team {
    id: string;
    name: string;
    teamType: number;
}
export interface CustomTable {
    name: string;
    displayName: string;
    tableType?: string;
}
export interface TableColumn {
    name: string;
    displayName: string;
    type: string;
    required: string;
    maxLength: number | null;
    minValue: number | null;
    maxValue: number | null;
    precision: number | null;
}
export type ComparisonStatus = 'match' | 'version_mismatch' | 'value_mismatch' | 'missing_in_target' | 'extra_in_target';
export interface ComparisonItem {
    name: string;
    displayName?: string;
    master: string | null;
    targets: Record<string, string | null>;
    status: ComparisonStatus;
    differences?: string[];
    details?: Record<string, unknown>;
}
export interface ComparisonCategory {
    name: string;
    items: ComparisonItem[];
}
export interface AuditReport {
    timestamp: string;
    master: string;
    targets: string[];
    deep: boolean;
    categories: Record<string, ComparisonCategory>;
}
export interface UserRole {
    id: string;
    name: string;
}
export interface UserTeamMembership {
    id: string;
    name: string;
    teamType: number;
    teamTypeName: string;
    roles: UserRole[];
}
export interface UserAuditEntry {
    id: string;
    fullName: string;
    email: string;
    isDisabled: boolean;
    directRoles: UserRole[];
    teams: UserTeamMembership[];
    teamRoles: Array<{
        team: string;
        roles: UserRole[];
    }>;
    allRoles: UserRole[];
    hasSystemAdmin: boolean;
    hasSystemCustomizer: boolean;
    hasDelegatedMailboxApprover: boolean;
}
export interface UserAuditSummary {
    totalUsers: number;
    usersWithDirectRoles: number;
    usersWithTeams: number;
    usersWithSystemAdmin: number;
    usersWithSystemCustomizer: number;
    usersWithDelegatedMailboxApprover: number;
}
export interface UserAuditReport {
    timestamp: string;
    environment: string;
    summary: UserAuditSummary;
    users: UserAuditEntry[];
}
export interface EnvironmentConfig {
    SOLUTION_NAME?: string;
    SOLUTION_DISPLAY_NAME?: string;
    SOLUTION_PUBLISHER_PREFIX?: string;
    ENV_DEV_URL?: string;
    ENV_TEST_URL?: string;
    ENV_PROD_URL?: string;
    PROXY_PORT?: string;
}
export interface CommandOptions {
    env?: string;
    managed?: boolean;
    save?: boolean;
    deep?: boolean;
    dryRun?: boolean;
    force?: boolean;
    [key: string]: unknown;
}
//# sourceMappingURL=index.d.ts.map