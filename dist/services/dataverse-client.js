"use strict";
/**
 * Dataverse API Client
 *
 * Provides typed access to Dataverse Web API endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataverseClient = void 0;
const auth_1 = require("../auth");
const utils_1 = require("../utils");
// Sensitive keywords to redact in environment variable values
const SENSITIVE_KEYWORDS = ['clientsecret', 'secret', 'password', 'pass', 'apikey', 'token', 'credential'];
function isSensitiveVariable(name) {
    const lowerName = (name || '').toLowerCase();
    return SENSITIVE_KEYWORDS.some(keyword => lowerName.includes(keyword));
}
function redactValue(name, value) {
    if (isSensitiveVariable(name) && value && value !== '(not set)') {
        return '[REDACTED]';
    }
    return value;
}
class DataverseClient {
    authClient;
    url;
    name;
    constructor(environmentUrl, name) {
        this.url = environmentUrl.replace(/\/$/, '');
        this.name = name || this.extractEnvName(environmentUrl);
        this.authClient = new auth_1.MsalAuthClient(this.url, this.name);
    }
    extractEnvName(url) {
        const match = url.match(/https?:\/\/([^.]+)/);
        return match ? match[1] : url;
    }
    get envName() {
        return this.name;
    }
    get envUrl() {
        return this.url;
    }
    async authenticate() {
        await this.authClient.authenticate();
    }
    async fetch(endpoint) {
        const token = await this.authClient.getToken();
        const url = `${this.url}/api/data/v9.2/${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
                'Accept': 'application/json',
                'Prefer': 'odata.include-annotations="*"',
            },
        });
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
    async delete(endpoint) {
        const token = await this.authClient.getToken();
        const url = `${this.url}/api/data/v9.2/${endpoint}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Delete failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
    }
    // =========================================================================
    // SOLUTIONS
    // =========================================================================
    async getSolutions() {
        const data = await this.fetch('solutions?$filter=isvisible eq true&$select=uniquename,friendlyname,version,ismanaged,installedon&$orderby=uniquename');
        return data.value.map(s => ({
            name: s.uniquename,
            displayName: s.friendlyname,
            version: s.version,
            isManaged: s.ismanaged,
            installedOn: s.installedon,
        }));
    }
    async getSolutionByName(uniqueName) {
        try {
            const data = await this.fetch(`solutions?$filter=uniquename eq '${uniqueName}'&$select=solutionid,uniquename,friendlyname,version,ismanaged&$top=1`);
            return data.value.length > 0 ? data.value[0] : null;
        }
        catch {
            return null;
        }
    }
    async getSolutionDetails(uniqueName) {
        try {
            // Get basic solution info
            const data = await this.fetch(`solutions?$filter=uniquename eq '${uniqueName}'&$select=solutionid,uniquename,friendlyname,version,ismanaged,installedon,description,_publisherid_value,modifiedon,createdon&$top=1`);
            if (data.value.length === 0) {
                return null;
            }
            const sol = data.value[0];
            // Get publisher info
            let publisherName = 'Unknown';
            try {
                const publisher = await this.fetch(`publishers(${sol._publisherid_value})?$select=name,uniquename,customizationprefix`);
                publisherName = publisher.name;
            }
            catch {
                // Ignore publisher fetch errors
            }
            // Get component counts using solution components
            const components = await this.getSolutionComponentCounts(sol.solutionid);
            return {
                solutionId: sol.solutionid,
                uniqueName: sol.uniquename,
                displayName: sol.friendlyname,
                version: sol.version,
                isManaged: sol.ismanaged,
                installedOn: sol.installedon,
                description: sol.description || '',
                publisherName,
                modifiedOn: sol.modifiedon,
                createdOn: sol.createdon,
                components,
            };
        }
        catch (e) {
            console.log(utils_1.colors.dim(`    Error getting solution details: ${e.message}`));
            return null;
        }
    }
    async getSolutionComponentCounts(solutionId) {
        const counts = {
            entities: 0,
            webResources: 0,
            plugins: 0,
            workflows: 0,
            canvasApps: 0,
            modelApps: 0,
            securityRoles: 0,
            envVariables: 0,
            total: 0,
        };
        try {
            // Get all solution components
            const data = await this.fetch(`solutioncomponents?$filter=_solutionid_value eq '${solutionId}'&$select=componenttype`);
            // Component type codes: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/solutioncomponent
            for (const comp of data.value) {
                counts.total++;
                switch (comp.componenttype) {
                    case 1:
                        counts.entities++;
                        break; // Entity
                    case 61:
                        counts.webResources++;
                        break; // Web Resource
                    case 91:
                        counts.plugins++;
                        break; // Plugin Assembly
                    case 29:
                        counts.workflows++;
                        break; // Process (Workflow)
                    case 300:
                        counts.canvasApps++;
                        break; // Canvas App
                    case 80:
                        counts.modelApps++;
                        break; // Model-driven App
                    case 20:
                        counts.securityRoles++;
                        break; // Security Role
                    case 380:
                        counts.envVariables++;
                        break; // Environment Variable Definition
                }
            }
        }
        catch {
            // Ignore errors, return zeros
        }
        return counts;
    }
    async deleteSolution(solutionId) {
        await this.delete(`solutions(${solutionId})`);
    }
    /**
     * Get all components in a solution with their details
     */
    async getSolutionComponents(solutionId) {
        const components = [];
        try {
            const data = await this.fetch(`solutioncomponents?$filter=_solutionid_value eq '${solutionId}'&$select=solutioncomponentid,componenttype,objectid,rootcomponentbehavior,ismetadata`);
            for (const comp of data.value) {
                const component = {
                    solutioncomponentid: comp.solutioncomponentid,
                    componenttype: comp.componenttype,
                    objectid: comp.objectid,
                    rootcomponentbehavior: comp.rootcomponentbehavior,
                    ismetadata: comp.ismetadata,
                    typeName: this.getComponentTypeName(comp.componenttype),
                    canDelete: this.canDeleteComponentType(comp.componenttype),
                };
                // Try to get the component name
                const details = await this.getComponentDetails(comp.componenttype, comp.objectid);
                if (details) {
                    component.name = details.name;
                    component.displayName = details.displayName;
                }
                components.push(component);
            }
        }
        catch (e) {
            console.log(utils_1.colors.dim(`    Error getting solution components: ${e.message}`));
        }
        return components;
    }
    getComponentTypeName(type) {
        const names = {
            1: 'Table',
            2: 'Column',
            3: 'Relationship',
            9: 'Choice',
            14: 'Key',
            20: 'Security Role',
            26: 'View',
            29: 'Process/Flow',
            31: 'Report',
            36: 'Email Template',
            59: 'Chart',
            60: 'Form',
            61: 'Web Resource',
            62: 'Site Map',
            65: 'Hierarchy Rule',
            66: 'Custom Control',
            80: 'Model-driven App',
            90: 'Plugin Type',
            91: 'Plugin Assembly',
            92: 'SDK Message Step',
            95: 'Service Endpoint',
            300: 'Canvas App',
            371: 'Connector',
            380: 'Environment Variable',
            381: 'Environment Variable Value',
            401: 'AI Model',
            402: 'AI Configuration',
        };
        return names[type] || `Unknown (${type})`;
    }
    canDeleteComponentType(type) {
        // These component types can be directly deleted
        const deletableTypes = [
            61, // Web Resource
            29, // Process/Workflow
            300, // Canvas App
            80, // Model-driven App
            91, // Plugin Assembly
            90, // Plugin Type
            92, // SDK Message Step
            380, // Environment Variable Definition
            381, // Environment Variable Value
            20, // Security Role
            26, // View (savedquery)
            59, // Chart
            60, // Form
            36, // Email Template
            31, // Report
        ];
        return deletableTypes.includes(type);
    }
    async getComponentDetails(type, objectId) {
        try {
            switch (type) {
                case 1: { // Entity
                    const entity = await this.fetch(`EntityDefinitions(${objectId})?$select=LogicalName,DisplayName`);
                    return { name: entity.LogicalName, displayName: entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName };
                }
                case 61: { // Web Resource
                    const wr = await this.fetch(`webresourceset(${objectId})?$select=name,displayname`);
                    return { name: wr.name, displayName: wr.displayname || wr.name };
                }
                case 29: { // Workflow/Process
                    const wf = await this.fetch(`workflows(${objectId})?$select=name,uniquename`);
                    return { name: wf.uniquename, displayName: wf.name };
                }
                case 91: { // Plugin Assembly
                    const plugin = await this.fetch(`pluginassemblies(${objectId})?$select=name`);
                    return { name: plugin.name, displayName: plugin.name };
                }
                case 80: { // Model-driven App
                    const app = await this.fetch(`appmodules(${objectId})?$select=name,uniquename`);
                    return { name: app.uniquename, displayName: app.name };
                }
                case 300: { // Canvas App
                    const canvas = await this.fetch(`canvasapps(${objectId})?$select=name,displayname`);
                    return { name: canvas.name, displayName: canvas.displayname || canvas.name };
                }
                case 20: { // Security Role
                    const role = await this.fetch(`roles(${objectId})?$select=name`);
                    return { name: role.name, displayName: role.name };
                }
                case 380: { // Environment Variable Definition
                    const envVar = await this.fetch(`environmentvariabledefinitions(${objectId})?$select=schemaname,displayname`);
                    return { name: envVar.schemaname, displayName: envVar.displayname || envVar.schemaname };
                }
                default:
                    return null;
            }
        }
        catch {
            return null;
        }
    }
    /**
     * Delete a specific component by type and ID
     */
    async deleteComponent(type, objectId) {
        try {
            switch (type) {
                case 61: // Web Resource
                    await this.delete(`webresourceset(${objectId})`);
                    break;
                case 29: // Workflow/Process - need to deactivate first
                    await this.deactivateWorkflow(objectId);
                    await this.delete(`workflows(${objectId})`);
                    break;
                case 91: // Plugin Assembly
                    await this.delete(`pluginassemblies(${objectId})`);
                    break;
                case 90: // Plugin Type
                    await this.delete(`plugintypes(${objectId})`);
                    break;
                case 92: // SDK Message Processing Step
                    await this.delete(`sdkmessageprocessingsteps(${objectId})`);
                    break;
                case 300: // Canvas App
                    await this.delete(`canvasapps(${objectId})`);
                    break;
                case 80: // Model-driven App
                    await this.delete(`appmodules(${objectId})`);
                    break;
                case 20: // Security Role
                    await this.delete(`roles(${objectId})`);
                    break;
                case 380: // Environment Variable Definition
                    await this.delete(`environmentvariabledefinitions(${objectId})`);
                    break;
                case 381: // Environment Variable Value
                    await this.delete(`environmentvariablevalues(${objectId})`);
                    break;
                case 26: // Saved Query (View)
                    await this.delete(`savedqueries(${objectId})`);
                    break;
                case 59: // Chart
                    await this.delete(`savedqueryvisualizations(${objectId})`);
                    break;
                case 60: // System Form
                    await this.delete(`systemforms(${objectId})`);
                    break;
                case 36: // Email Template
                    await this.delete(`templates(${objectId})`);
                    break;
                case 31: // Report
                    await this.delete(`reports(${objectId})`);
                    break;
                default:
                    return { success: false, error: `Component type ${type} cannot be directly deleted` };
            }
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    async deactivateWorkflow(workflowId) {
        const token = await this.authClient.getToken();
        const url = `${this.url}/api/data/v9.2/workflows(${workflowId})`;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ statecode: 0, statuscode: 1 }), // Draft state
        });
        if (!response.ok) {
            // Ignore deactivation errors, may already be deactivated
        }
    }
    // =========================================================================
    // ENVIRONMENT VARIABLES
    // =========================================================================
    async getEnvironmentVariables() {
        try {
            const defs = await this.fetch('environmentvariabledefinitions?$select=schemaname,displayname,type,environmentvariabledefinitionid');
            const results = [];
            for (const d of defs.value) {
                let value = '(not set)';
                try {
                    const vals = await this.fetch(`environmentvariablevalues?$filter=_environmentvariabledefinitionid_value eq '${d.environmentvariabledefinitionid}'&$select=value&$top=1`);
                    if (vals.value && vals.value.length > 0) {
                        value = vals.value[0].value;
                    }
                }
                catch {
                    // Value not found
                }
                results.push({
                    name: d.schemaname,
                    displayName: d.displayname,
                    type: d.type,
                    value: redactValue(d.schemaname, value),
                });
            }
            return results;
        }
        catch (e) {
            console.log(utils_1.colors.dim(`    [${this.name}] Environment variables: ${e.message}`));
            return [];
        }
    }
    // =========================================================================
    // PLUGINS
    // =========================================================================
    async getPlugins() {
        try {
            const data = await this.fetch('pluginassemblies?$select=name,version,publickeytoken,isolationmode&$top=500');
            return data.value.map(p => ({
                name: p.name,
                version: p.version,
                publicKeyToken: p.publickeytoken,
                isolationMode: p.isolationmode,
            }));
        }
        catch (e) {
            console.log(utils_1.colors.dim(`    [${this.name}] Plugins: ${e.message}`));
            return [];
        }
    }
    // =========================================================================
    // WEB RESOURCES
    // =========================================================================
    async getWebResources() {
        try {
            const data = await this.fetch('webresourceset?$select=name,displayname,webresourcetype&$top=500');
            return data.value.map(w => ({
                name: w.name,
                displayName: w.displayname,
                type: w.webresourcetype,
            }));
        }
        catch (e) {
            console.log(utils_1.colors.dim(`    [${this.name}] Web resources: ${e.message}`));
            return [];
        }
    }
    // =========================================================================
    // TABLES
    // =========================================================================
    async getTables() {
        try {
            const data = await this.fetch('EntityDefinitions?$filter=IsCustomEntity eq true&$select=LogicalName,DisplayName,TableType');
            return data.value.map(t => ({
                name: t.LogicalName,
                displayName: t.DisplayName?.UserLocalizedLabel?.Label || t.LogicalName,
                tableType: t.TableType,
            }));
        }
        catch (e) {
            console.log(utils_1.colors.dim(`    [${this.name}] Custom tables: ${e.message}`));
            return [];
        }
    }
    async getTableColumns(tableName) {
        try {
            const data = await this.fetch(`EntityDefinitions(LogicalName='${tableName}')/Attributes?$select=LogicalName,DisplayName,AttributeType,RequiredLevel,MaxLength,MinValue,MaxValue,Precision`);
            return data.value.map(a => ({
                name: a.LogicalName,
                displayName: a.DisplayName?.UserLocalizedLabel?.Label || a.LogicalName,
                type: a.AttributeType,
                required: a.RequiredLevel?.Value || 'None',
                maxLength: a.MaxLength || null,
                minValue: a.MinValue || null,
                maxValue: a.MaxValue || null,
                precision: a.Precision || null,
            }));
        }
        catch {
            // Silently skip tables that don't allow schema queries
            return [];
        }
    }
    // =========================================================================
    // FLOWS
    // =========================================================================
    async getFlows() {
        try {
            const data = await this.fetch('workflows?$filter=category eq 5 and statecode eq 1&$select=name,uniquename,statecode,statuscode');
            return data.value.map(f => ({
                name: f.name,
                uniqueName: f.uniquename,
                state: f.statecode === 1 ? 'Active' : 'Inactive',
            }));
        }
        catch (e) {
            console.log(utils_1.colors.dim(`    [${this.name}] Flows: ${e.message}`));
            return [];
        }
    }
    // =========================================================================
    // APPS
    // =========================================================================
    async getCanvasApps() {
        try {
            const data = await this.fetch('canvasapps?$select=name,displayname,appversion');
            return data.value.map(a => ({
                name: a.name,
                displayName: a.displayname,
                version: a.appversion,
            }));
        }
        catch (e) {
            console.log(utils_1.colors.dim(`    [${this.name}] Canvas apps: ${e.message}`));
            return [];
        }
    }
    async getModelApps() {
        try {
            const data = await this.fetch('appmodules?$select=name,uniquename,appmoduleversion');
            return data.value.map(a => ({
                name: a.name,
                uniqueName: a.uniquename,
                version: a.appmoduleversion,
            }));
        }
        catch (e) {
            console.log(utils_1.colors.dim(`    [${this.name}] Model-driven apps: ${e.message}`));
            return [];
        }
    }
    // =========================================================================
    // SECURITY
    // =========================================================================
    async getSecurityRoles() {
        try {
            const data = await this.fetch('roles?$filter=iscustomizable/Value eq true&$select=name,roleid');
            return data.value.map(r => ({
                id: r.roleid,
                name: r.name,
            }));
        }
        catch (e) {
            console.log(utils_1.colors.dim(`    [${this.name}] Security roles: ${e.message}`));
            return [];
        }
    }
    async getAllRoles() {
        try {
            const data = await this.fetch('roles?$select=roleid,name,ismanaged,iscustomizable');
            return data.value.map(r => ({
                id: r.roleid,
                name: r.name,
                isManaged: r.ismanaged,
                isCustomizable: r.iscustomizable?.Value ?? true,
            }));
        }
        catch (e) {
            console.log(utils_1.colors.dim(`    [${this.name}] Roles: ${e.message}`));
            return [];
        }
    }
    // =========================================================================
    // USERS
    // =========================================================================
    async getUsers() {
        try {
            const data = await this.fetch('systemusers?$filter=islicensed eq true&$select=systemuserid,fullname,domainname,internalemailaddress,isdisabled,accessmode');
            return data.value.map(u => ({
                id: u.systemuserid,
                fullName: u.fullname,
                domainName: u.domainname,
                email: u.internalemailaddress,
                isDisabled: u.isdisabled,
                accessMode: u.accessmode,
            }));
        }
        catch (e) {
            console.log(utils_1.colors.dim(`    [${this.name}] Users: ${e.message}`));
            return [];
        }
    }
    async getUserDirectRoles(userId) {
        try {
            const data = await this.fetch(`systemusers(${userId})/systemuserroles_association?$select=roleid,name`);
            return data.value.map(r => ({
                id: r.roleid,
                name: r.name,
            }));
        }
        catch {
            return [];
        }
    }
    async getUserTeams(userId) {
        try {
            const data = await this.fetch(`systemusers(${userId})/teammembership_association?$select=teamid,name,teamtype`);
            return data.value.map(t => ({
                id: t.teamid,
                name: t.name,
                teamType: t.teamtype,
            }));
        }
        catch {
            return [];
        }
    }
    async getTeamRoles(teamId) {
        try {
            const data = await this.fetch(`teams(${teamId})/teamroles_association?$select=roleid,name`);
            return data.value.map(r => ({
                id: r.roleid,
                name: r.name,
            }));
        }
        catch {
            return [];
        }
    }
    async removeUserRole(userId, roleId) {
        const endpoint = `systemusers(${userId})/systemuserroles_association/$ref?$id=${this.url}/api/data/v9.2/roles(${roleId})`;
        await this.delete(endpoint);
        return true;
    }
}
exports.DataverseClient = DataverseClient;
//# sourceMappingURL=dataverse-client.js.map