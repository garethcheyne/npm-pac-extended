/**
 * MSAL Authentication Client for Dataverse
 *
 * Uses Azure CLI public client ID for interactive authentication
 * with token caching to avoid repeated logins.
 */
import * as msal from '@azure/msal-node';
export interface AuthenticationResult {
    accessToken: string;
    expiresOn: Date | null;
    account: msal.AccountInfo | null;
}
export declare class MsalAuthClient {
    private msalClient;
    private environmentUrl;
    private name;
    private accessToken;
    private tokenExpiry;
    constructor(environmentUrl: string, name?: string);
    private extractEnvName;
    get envName(): string;
    get envUrl(): string;
    authenticate(): Promise<AuthenticationResult>;
    getToken(): Promise<string>;
    isTokenValid(): boolean;
}
/**
 * Clears all cached tokens
 */
export declare function clearTokenCache(): void;
/**
 * Gets all cached accounts
 */
export declare function getCachedAccounts(): Promise<msal.AccountInfo[]>;
//# sourceMappingURL=msal-client.d.ts.map