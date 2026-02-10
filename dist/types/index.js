"use strict";
/**
 * Type definitions for Dataverse API responses and internal data structures
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentType = void 0;
// Solution component types from Dataverse
// https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/solutioncomponent
var ComponentType;
(function (ComponentType) {
    ComponentType[ComponentType["Entity"] = 1] = "Entity";
    ComponentType[ComponentType["Attribute"] = 2] = "Attribute";
    ComponentType[ComponentType["Relationship"] = 3] = "Relationship";
    ComponentType[ComponentType["OptionSet"] = 9] = "OptionSet";
    ComponentType[ComponentType["EntityKey"] = 14] = "EntityKey";
    ComponentType[ComponentType["Role"] = 20] = "Role";
    ComponentType[ComponentType["RolePrivilege"] = 21] = "RolePrivilege";
    ComponentType[ComponentType["DisplayString"] = 22] = "DisplayString";
    ComponentType[ComponentType["Workflow"] = 29] = "Workflow";
    ComponentType[ComponentType["Report"] = 31] = "Report";
    ComponentType[ComponentType["ConnectionRole"] = 41] = "ConnectionRole";
    ComponentType[ComponentType["EmailTemplate"] = 36] = "EmailTemplate";
    ComponentType[ComponentType["ContractTemplate"] = 37] = "ContractTemplate";
    ComponentType[ComponentType["KBArticleTemplate"] = 38] = "KBArticleTemplate";
    ComponentType[ComponentType["MailMergeTemplate"] = 39] = "MailMergeTemplate";
    ComponentType[ComponentType["DuplicateRule"] = 44] = "DuplicateRule";
    ComponentType[ComponentType["SavedQuery"] = 26] = "SavedQuery";
    ComponentType[ComponentType["SavedQueryVisualization"] = 59] = "SavedQueryVisualization";
    ComponentType[ComponentType["SystemForm"] = 60] = "SystemForm";
    ComponentType[ComponentType["WebResource"] = 61] = "WebResource";
    ComponentType[ComponentType["SiteMap"] = 62] = "SiteMap";
    ComponentType[ComponentType["PluginAssembly"] = 91] = "PluginAssembly";
    ComponentType[ComponentType["PluginType"] = 90] = "PluginType";
    ComponentType[ComponentType["SDKMessageProcessingStep"] = 92] = "SDKMessageProcessingStep";
    ComponentType[ComponentType["ServiceEndpoint"] = 95] = "ServiceEndpoint";
    ComponentType[ComponentType["RoutingRule"] = 150] = "RoutingRule";
    ComponentType[ComponentType["SLA"] = 152] = "SLA";
    ComponentType[ComponentType["ConvertRule"] = 154] = "ConvertRule";
    ComponentType[ComponentType["HierarchyRule"] = 65] = "HierarchyRule";
    ComponentType[ComponentType["MobileOfflineProfile"] = 161] = "MobileOfflineProfile";
    ComponentType[ComponentType["SimilarityRule"] = 165] = "SimilarityRule";
    ComponentType[ComponentType["CustomControl"] = 66] = "CustomControl";
    ComponentType[ComponentType["CustomControlDefaultConfig"] = 68] = "CustomControlDefaultConfig";
    ComponentType[ComponentType["AppModule"] = 80] = "AppModule";
    ComponentType[ComponentType["CanvasApp"] = 300] = "CanvasApp";
    ComponentType[ComponentType["Connector"] = 371] = "Connector";
    ComponentType[ComponentType["EnvironmentVariableDefinition"] = 380] = "EnvironmentVariableDefinition";
    ComponentType[ComponentType["EnvironmentVariableValue"] = 381] = "EnvironmentVariableValue";
    ComponentType[ComponentType["AIModel"] = 401] = "AIModel";
    ComponentType[ComponentType["AIConfiguration"] = 402] = "AIConfiguration";
})(ComponentType || (exports.ComponentType = ComponentType = {}));
//# sourceMappingURL=index.js.map