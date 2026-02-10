"use strict";
/**
 * MSAL Authentication Client for Dataverse
 *
 * Uses Azure CLI public client ID for interactive authentication
 * with token caching to avoid repeated logins.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsalAuthClient = void 0;
exports.clearTokenCache = clearTokenCache;
exports.getCachedAccounts = getCachedAccounts;
const msal = __importStar(require("@azure/msal-node"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const open_1 = __importDefault(require("open"));
const utils_1 = require("../utils");
const TOKEN_CACHE_PATH = path.join(process.cwd(), '.token-cache.json');
// Using Azure CLI's public client ID - works for any tenant
const MSAL_CONFIG = {
    auth: {
        clientId: '04b07795-8ddb-461a-bbee-02f9e1bf7b46',
        authority: 'https://login.microsoftonline.com/common',
    },
    cache: {
        cachePlugin: {
            beforeCacheAccess: async (cacheContext) => {
                if (fs.existsSync(TOKEN_CACHE_PATH)) {
                    cacheContext.tokenCache.deserialize(fs.readFileSync(TOKEN_CACHE_PATH, 'utf-8'));
                }
            },
            afterCacheAccess: async (cacheContext) => {
                if (cacheContext.cacheHasChanged) {
                    fs.writeFileSync(TOKEN_CACHE_PATH, cacheContext.tokenCache.serialize());
                }
            },
        },
    },
};
class MsalAuthClient {
    msalClient;
    environmentUrl;
    name;
    accessToken = null;
    tokenExpiry = null;
    constructor(environmentUrl, name) {
        this.environmentUrl = environmentUrl.replace(/\/$/, '');
        this.name = name || this.extractEnvName(environmentUrl);
        this.msalClient = new msal.PublicClientApplication(MSAL_CONFIG);
    }
    extractEnvName(url) {
        const match = url.match(/https?:\/\/([^.]+)/);
        return match ? match[1] : url;
    }
    get envName() {
        return this.name;
    }
    get envUrl() {
        return this.environmentUrl;
    }
    async authenticate() {
        const scopes = [`${this.environmentUrl}/.default`];
        // Try silent auth first (from cache)
        try {
            const accounts = await this.msalClient.getTokenCache().getAllAccounts();
            if (accounts.length > 0) {
                const result = await this.msalClient.acquireTokenSilent({
                    account: accounts[0],
                    scopes: scopes,
                });
                this.accessToken = result.accessToken;
                this.tokenExpiry = result.expiresOn;
                return {
                    accessToken: result.accessToken,
                    expiresOn: result.expiresOn,
                    account: result.account,
                };
            }
        }
        catch {
            // Silent auth failed, need interactive
        }
        // Device code flow for interactive auth
        console.log();
        console.log(utils_1.colors.bold(`Authenticate to ${this.name}:`));
        console.log('─'.repeat(50));
        const result = await this.msalClient.acquireTokenByDeviceCode({
            scopes: scopes,
            deviceCodeCallback: (response) => {
                console.log(utils_1.colors.yellow('  1. Open: ') + utils_1.colors.cyan(response.verificationUri));
                console.log(utils_1.colors.yellow('  2. Enter code: ') + utils_1.colors.bold(utils_1.colors.green(response.userCode)));
                console.log(utils_1.colors.dim('  Waiting...'));
                (0, open_1.default)(response.verificationUri).catch(() => { });
            },
        });
        if (!result) {
            throw new Error('Authentication failed - no token received');
        }
        this.accessToken = result.accessToken;
        this.tokenExpiry = result.expiresOn;
        utils_1.log.success(`Authenticated to ${this.name}`);
        return {
            accessToken: result.accessToken,
            expiresOn: result.expiresOn,
            account: result.account,
        };
    }
    async getToken() {
        // Check if we have a valid cached token
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.accessToken;
        }
        // Re-authenticate
        const result = await this.authenticate();
        return result.accessToken;
    }
    isTokenValid() {
        return !!(this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry);
    }
}
exports.MsalAuthClient = MsalAuthClient;
/**
 * Clears all cached tokens
 */
function clearTokenCache() {
    if (fs.existsSync(TOKEN_CACHE_PATH)) {
        fs.unlinkSync(TOKEN_CACHE_PATH);
        utils_1.log.success('Token cache cleared');
    }
    else {
        utils_1.log.info('No token cache found');
    }
}
/**
 * Gets all cached accounts
 */
async function getCachedAccounts() {
    const client = new msal.PublicClientApplication(MSAL_CONFIG);
    return client.getTokenCache().getAllAccounts();
}
//# sourceMappingURL=msal-client.js.map