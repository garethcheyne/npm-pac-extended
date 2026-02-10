/**
 * Dataverse Proxy Server
 *
 * Provides authenticated proxy to Dataverse/Dynamics 365 for PCF development.
 * Uses interactive browser auth - no client secret required.
 */
export declare class DataverseProxy {
    private authClient;
    private environmentUrl;
    private userInfo;
    private tokenExpiry;
    constructor(environmentUrl: string);
    private getToken;
    start(): Promise<void>;
}
/**
 * Run the proxy command
 */
export declare function runProxyCommand(args: string[]): Promise<void>;
//# sourceMappingURL=dataverse-proxy.d.ts.map