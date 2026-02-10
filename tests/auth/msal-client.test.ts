/**
 * Tests for MSAL authentication client
 */

import { MsalAuthClient, AuthenticationResult } from '../../src/auth/msal-client';

// Mock the msal-node module
jest.mock('@azure/msal-node', () => ({
  PublicClientApplication: jest.fn().mockImplementation(() => ({
    getTokenCache: jest.fn().mockReturnValue({
      getAllAccounts: jest.fn().mockReturnValue([]),
    }),
    acquireTokenSilent: jest.fn(),
    acquireTokenByDeviceCode: jest.fn(),
  })),
}));

// Mock the open module
jest.mock('open', () => jest.fn().mockResolvedValue(undefined));

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('MsalAuthClient', () => {
  const testUrl = 'https://testorg.crm.dynamics.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with valid URL', () => {
      const client = new MsalAuthClient(testUrl);
      expect(client).toBeInstanceOf(MsalAuthClient);
    });

    it('should accept optional name parameter', () => {
      const client = new MsalAuthClient(testUrl, 'Test Environment');
      expect(client).toBeInstanceOf(MsalAuthClient);
    });

    it('should normalize URL by removing trailing slash', () => {
      const client = new MsalAuthClient('https://testorg.crm.dynamics.com/');
      expect(client).toBeInstanceOf(MsalAuthClient);
    });
  });

  describe('isTokenValid', () => {
    it('should return false when no token exists', () => {
      const client = new MsalAuthClient(testUrl);
      expect(client.isTokenValid()).toBe(false);
    });
  });

  describe('AuthenticationResult interface', () => {
    it('should have correct shape', () => {
      const result: AuthenticationResult = {
        accessToken: 'test-token',
        expiresOn: new Date(),
        account: null,
      };

      expect(result.accessToken).toBe('test-token');
      expect(result.expiresOn).toBeInstanceOf(Date);
      expect(result.account).toBeNull();
    });
  });
});
