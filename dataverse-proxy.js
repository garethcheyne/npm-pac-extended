#!/usr/bin/env node

/**
 * Dataverse Proxy Server
 *
 * Provides authenticated proxy to Dataverse/Dynamics 365 for PCF development.
 * Uses interactive browser auth - no client secret required.
 */

const msal = require('@azure/msal-node');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');
const open = require('open');

// Load .env
require('dotenv').config();

// ANSI colors
const colors = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  blue: (t) => `\x1b[34m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`,
};

const log = {
  info: (msg) => console.log(colors.blue('i'), msg),
  success: (msg) => console.log(colors.green('✓'), msg),
  error: (msg) => console.log(colors.red('✗'), msg),
  warn: (msg) => console.log(colors.yellow('!'), msg),
  title: (msg) => console.log('\n' + colors.bold(colors.cyan(msg))),
};

// Configuration
const PROXY_PORT = process.env.PROXY_PORT || 3000;
const TOKEN_CACHE_PATH = path.join(process.cwd(), '.token-cache.json');

// Azure AD / MSAL Configuration
// Using Azure CLI's public client ID - works for any tenant
const MSAL_CONFIG = {
  auth: {
    clientId: '04b07795-8ddb-461a-bbee-02f9e1bf7b46', // Azure CLI public client
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

class DataverseProxy {
  constructor(environmentUrl) {
    this.environmentUrl = environmentUrl.replace(/\/$/, ''); // Remove trailing slash
    this.msalClient = new msal.PublicClientApplication(MSAL_CONFIG);
    this.accessToken = null;
    this.tokenExpiry = null;
    this.userInfo = null;
  }

  async getToken() {
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const scopes = [`${this.environmentUrl}/.default`];

    // Try to get token silently first (from cache)
    try {
      const accounts = await this.msalClient.getTokenCache().getAllAccounts();
      if (accounts.length > 0) {
        log.info('Found cached credentials, refreshing token...');
        const result = await this.msalClient.acquireTokenSilent({
          account: accounts[0],
          scopes: scopes,
        });
        this.accessToken = result.accessToken;
        this.tokenExpiry = result.expiresOn;
        this.userInfo = result.account;
        return this.accessToken;
      }
    } catch (error) {
      // Silent token acquisition failed, need interactive auth
      log.info('Cached token expired or not found');
    }

    // Interactive authentication via device code
    log.title('Authentication Required');
    console.log();
    console.log(colors.bold('Please sign in to access Dataverse:'));
    console.log('─'.repeat(50));

    try {
      const result = await this.msalClient.acquireTokenByDeviceCode({
        scopes: scopes,
        deviceCodeCallback: (response) => {
          console.log();
          console.log(colors.yellow('  1. Open: ') + colors.cyan(response.verificationUri));
          console.log(colors.yellow('  2. Enter code: ') + colors.bold(colors.green(response.userCode)));
          console.log();
          console.log(colors.dim('  Waiting for authentication...'));

          // Auto-open browser
          open(response.verificationUri).catch(() => { });
        },
      });

      this.accessToken = result.accessToken;
      this.tokenExpiry = result.expiresOn;
      this.userInfo = result.account;

      console.log();
      log.success(`Authenticated as: ${this.userInfo.username}`);
      console.log('─'.repeat(50));

      return this.accessToken;
    } catch (error) {
      log.error(`Authentication failed: ${error.message}`);
      throw error;
    }
  }

  async start() {
    log.title('Dataverse Proxy Server');
    console.log();
    console.log(colors.bold('Configuration:'));
    console.log('─'.repeat(50));
    console.log(`  Target:     ${colors.cyan(this.environmentUrl)}`);
    console.log(`  Proxy Port: ${colors.cyan(PROXY_PORT)}`);
    console.log();

    // Get initial token (will prompt for auth if needed)
    await this.getToken();

    // Create Express app
    const app = express();

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
        user: this.userInfo?.username,
        tokenExpiry: this.tokenExpiry,
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
            user: this.userInfo?.username,
            environment: this.environmentUrl,
          },
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Proxy all other requests to Dataverse
    app.use('/api', createProxyMiddleware({
      target: this.environmentUrl,
      changeOrigin: true,
      onProxyReq: async (proxyReq, req, res) => {
        try {
          const token = await this.getToken();
          proxyReq.setHeader('Authorization', `Bearer ${token}`);
        } catch (error) {
          log.error(`Token refresh failed: ${error.message}`);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        // Log requests in dev mode
        const status = proxyRes.statusCode;
        const color = status < 400 ? colors.green : colors.red;
        console.log(`  ${color(status)} ${req.method} ${req.path}`);
      },
      onError: (err, req, res) => {
        log.error(`Proxy error: ${err.message}`);
        res.status(500).json({ error: err.message });
      },
    }));

    // Start server
    app.listen(PROXY_PORT, () => {
      console.log();
      log.success('Proxy server running!');
      console.log();
      console.log(colors.bold('Endpoints:'));
      console.log('─'.repeat(50));
      console.log(`  API:     ${colors.cyan(`http://localhost:${PROXY_PORT}/api/data/v9.2/...`)}`);
      console.log(`  Health:  ${colors.cyan(`http://localhost:${PROXY_PORT}/_proxy/health`)}`);
      console.log(`  WhoAmI:  ${colors.cyan(`http://localhost:${PROXY_PORT}/_proxy/whoami`)}`);

      console.log();
      console.log(colors.dim('Press Ctrl+C to stop'));
      console.log('─'.repeat(50));
      console.log();
    });
  }
}

// CLI entry point
async function main() {
  const envUrl = process.env.ENV_DEV_URL || process.argv[2];

  if (!envUrl) {
    log.error('No environment URL configured');
    console.log();
    console.log('Set ENV_DEV_URL in .env or pass as argument:');
    console.log(colors.dim('  pac-ext proxy https://yourorg.crm.dynamics.com'));
    process.exit(1);
  }

  const proxy = new DataverseProxy(envUrl);
  await proxy.start();
}

// Export for use as module
module.exports = { DataverseProxy };

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    log.error(error.message);
    process.exit(1);
  });
}
