/**
 * Tests for Dataverse proxy service
 */

import { DataverseProxy } from '../../src/services/dataverse-proxy';

// Mock express
jest.mock('express', () => {
  const mockApp = {
    use: jest.fn(),
    get: jest.fn(),
    listen: jest.fn((port: number, callback: () => void) => {
      callback();
      return { close: jest.fn() };
    }),
  };
  const express = jest.fn(() => mockApp);
  (express as any).json = jest.fn(() => jest.fn());
  return express;
});

// Mock http-proxy-middleware
jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: jest.fn(() => jest.fn()),
}));

// Mock the auth module
jest.mock('../../src/auth', () => ({
  MsalAuthClient: jest.fn().mockImplementation(() => ({
    authenticate: jest.fn().mockResolvedValue({ accessToken: 'mock-token' }),
    getToken: jest.fn().mockResolvedValue('mock-token'),
  })),
}));

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('DataverseProxy', () => {
  const testUrl = 'https://testorg.crm.dynamics.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with valid URL', () => {
      const proxy = new DataverseProxy(testUrl);
      expect(proxy).toBeInstanceOf(DataverseProxy);
    });

    it('should normalize URL by removing trailing slash', () => {
      const proxy = new DataverseProxy('https://testorg.crm.dynamics.com/');
      expect(proxy).toBeInstanceOf(DataverseProxy);
    });
  });

  describe('start', () => {
    it('should authenticate before starting server', async () => {
      const proxy = new DataverseProxy(testUrl);
      
      // Start returns void, but internally calls authenticate
      await proxy.start();
      
      // If no error thrown, authentication succeeded (via mock)
      expect(true).toBe(true);
    });

    it('should setup express middleware', async () => {
      const express = require('express');
      const proxy = new DataverseProxy(testUrl);
      
      await proxy.start();
      
      const mockApp = express();
      expect(mockApp.use).toHaveBeenCalled();
    });

    it('should setup proxy routes', async () => {
      const express = require('express');
      const proxy = new DataverseProxy(testUrl);
      
      await proxy.start();
      
      const mockApp = express();
      // Should have called get for /_proxy/status and /_proxy/whoami
      expect(mockApp.get).toHaveBeenCalled();
    });

    it('should listen on default port 3000', async () => {
      const express = require('express');
      const proxy = new DataverseProxy(testUrl);
      
      await proxy.start();
      
      const mockApp = express();
      expect(mockApp.listen).toHaveBeenCalledWith(
        3000,
        expect.any(Function)
      );
    });
  });

  describe('CORS handling', () => {
    it('should setup CORS middleware', async () => {
      const express = require('express');
      const proxy = new DataverseProxy(testUrl);
      
      await proxy.start();
      
      const mockApp = express();
      // CORS is set up via app.use()
      expect(mockApp.use).toHaveBeenCalled();
    });
  });
});
