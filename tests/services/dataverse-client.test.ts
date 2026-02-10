/**
 * Tests for Dataverse client service
 */

import { DataverseClient } from '../../src/services/dataverse-client';

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

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('DataverseClient', () => {
  const testUrl = 'https://testorg.crm.dynamics.com';
  let client: DataverseClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new DataverseClient(testUrl);
  });

  describe('constructor', () => {
    it('should create instance with valid URL', () => {
      expect(client).toBeInstanceOf(DataverseClient);
    });

    it('should accept optional name parameter', () => {
      const namedClient = new DataverseClient(testUrl, 'Test Env');
      expect(namedClient).toBeInstanceOf(DataverseClient);
    });
  });

  describe('getUsers', () => {
    it('should fetch users from Dataverse API', async () => {
      const mockUsers = {
        value: [
          { 
            systemuserid: '123', 
            fullname: 'Test User',
            domainname: 'DOMAIN\\test',
            internalemailaddress: 'test@example.com',
            isdisabled: false,
            accessmode: 0,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      });

      const users = await client.getUsers();

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toContain('systemusers');
      // The client transforms the data to internal format
      expect(users[0].fullName).toBe('Test User');
      expect(users[0].id).toBe('123');
    });

    it('should include authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ value: [] }),
      });

      await client.getUsers();

      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer mock-token');
    });

    it('should return empty array on API failure (graceful degradation)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      // The client handles errors gracefully and returns empty array
      const users = await client.getUsers();
      expect(users).toEqual([]);
    });
  });

  describe('getSolutions', () => {
    it('should fetch solutions from Dataverse API', async () => {
      const mockSolutions = {
        value: [
          { uniquename: 'TestSolution', friendlyname: 'Test Solution', version: '1.0.0.0', ismanaged: false, installedon: '2026-01-01' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSolutions),
      });

      const solutions = await client.getSolutions();

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toContain('solutions');
    });
  });

  describe('getSecurityRoles', () => {
    it('should fetch security roles from Dataverse API', async () => {
      const mockRoles = {
        value: [
          { roleid: '123', name: 'System Administrator' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRoles),
      });

      const roles = await client.getSecurityRoles();

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toContain('roles');
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Client handles errors gracefully
      const users = await client.getUsers();
      expect(users).toEqual([]);
    });

    it('should handle 404 errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const users = await client.getUsers();
      expect(users).toEqual([]);
    });

    it('should handle 500 errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const users = await client.getUsers();
      expect(users).toEqual([]);
    });
  });
});
