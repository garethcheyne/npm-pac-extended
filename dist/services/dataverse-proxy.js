"use strict";
/**
 * Dataverse Proxy Server
 *
 * Provides authenticated proxy to Dataverse/Dynamics 365 for PCF development.
 * Uses interactive browser auth - no client secret required.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataverseProxy = void 0;
exports.runProxyCommand = runProxyCommand;
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const auth_1 = require("../auth");
const utils_1 = require("../utils");
const PROXY_PORT = parseInt(process.env.PROXY_PORT || '3000', 10);
class DataverseProxy {
    authClient;
    environmentUrl;
    userInfo = null;
    tokenExpiry = null;
    constructor(environmentUrl) {
        this.environmentUrl = environmentUrl.replace(/\/$/, '');
        this.authClient = new auth_1.MsalAuthClient(this.environmentUrl);
    }
    async getToken() {
        const token = await this.authClient.getToken();
        return token;
    }
    async start() {
        utils_1.log.title('Dataverse Proxy Server');
        console.log();
        console.log(utils_1.colors.bold('Configuration:'));
        console.log('─'.repeat(50));
        console.log(`  Target:     ${utils_1.colors.cyan(this.environmentUrl)}`);
        console.log(`  Proxy Port: ${utils_1.colors.cyan(PROXY_PORT.toString())}`);
        console.log();
        // Get initial token (will prompt for auth if needed)
        await this.authClient.authenticate();
        // Create Express app
        const app = (0, express_1.default)();
        // CORS headers for PCF harness
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, OData-MaxVersion, OData-Version, Prefer');
            res.header('Access-Control-Expose-Headers', 'OData-EntityId, Location, Preference-Applied');
            if (req.method === 'OPTIONS') {
                return res.sendStatus(200);
            }
            next();
        });
        // Health check endpoint
        app.get('/_proxy/health', (req, res) => {
            res.json({
                status: 'ok',
                target: this.environmentUrl,
                user: this.authClient.envName,
                tokenValid: this.authClient.isTokenValid(),
            });
        });
        // User info endpoint
        app.get('/_proxy/whoami', async (req, res) => {
            try {
                const token = await this.getToken();
                const response = await fetch(`${this.environmentUrl}/api/data/v9.2/WhoAmI`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                res.json({
                    ...data,
                    _proxy: {
                        environment: this.environmentUrl,
                    },
                });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Proxy all other requests to Dataverse
        const self = this;
        const proxyOptions = {
            target: this.environmentUrl,
            changeOrigin: true,
            onProxyReq: async (proxyReq) => {
                try {
                    const token = await self.getToken();
                    proxyReq.setHeader('Authorization', `Bearer ${token}`);
                }
                catch (error) {
                    utils_1.log.error(`Token refresh failed: ${error.message}`);
                }
            },
            onProxyRes: (proxyRes, req) => {
                const status = proxyRes.statusCode || 0;
                const color = status < 400 ? utils_1.colors.green : utils_1.colors.red;
                console.log(`  ${color(status.toString())} ${req.method} ${req.url}`);
            },
            onError: (err, req, res) => {
                utils_1.log.error(`Proxy error: ${err.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            },
        };
        app.use('/api', (0, http_proxy_middleware_1.createProxyMiddleware)(proxyOptions));
        // Start server
        app.listen(PROXY_PORT, () => {
            console.log();
            utils_1.log.success('Proxy server running!');
            console.log();
            console.log(utils_1.colors.bold('Endpoints:'));
            console.log('─'.repeat(50));
            console.log(`  API:     ${utils_1.colors.cyan(`http://localhost:${PROXY_PORT}/api/data/v9.2/...`)}`);
            console.log(`  Health:  ${utils_1.colors.cyan(`http://localhost:${PROXY_PORT}/_proxy/health`)}`);
            console.log(`  WhoAmI:  ${utils_1.colors.cyan(`http://localhost:${PROXY_PORT}/_proxy/whoami`)}`);
            console.log();
            console.log(utils_1.colors.dim('Press Ctrl+C to stop'));
            console.log('─'.repeat(50));
            console.log();
        });
    }
}
exports.DataverseProxy = DataverseProxy;
/**
 * Run the proxy command
 */
async function runProxyCommand(args) {
    let envUrl = process.env.ENV_DEV_URL || '';
    // Check for URL in args
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.includes('.dynamics.com') || arg.includes('.crm')) {
            envUrl = arg;
        }
        else if (arg === '-e' || arg === '--environment') {
            envUrl = args[++i];
        }
    }
    if (!envUrl) {
        utils_1.log.error('No environment URL configured');
        console.log();
        console.log('Set ENV_DEV_URL in .env or pass as argument:');
        console.log(utils_1.colors.dim('  pac-ext proxy https://yourorg.crm.dynamics.com'));
        process.exit(1);
    }
    const proxy = new DataverseProxy(envUrl);
    await proxy.start();
}
//# sourceMappingURL=dataverse-proxy.js.map