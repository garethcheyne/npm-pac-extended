/**
 * Tests for type definitions
 * These tests verify that type interfaces work correctly at runtime
 */

import {
  DataverseResponse,
  DataverseSolution,
  DataverseSystemUser,
  DataverseRole,
  DataverseEntityDefinition,
  DataverseAttributeDefinition,
  Solution,
  SecurityRole,
  User,
} from '../../src/types';

import { AuthenticationResult } from '../../src/auth/msal-client';

describe('Type definitions', () => {
  describe('DataverseResponse', () => {
    it('should accept valid OData response with array values', () => {
      const response: DataverseResponse<DataverseSystemUser> = {
        value: [
          {
            systemuserid: '12345678-1234-1234-1234-123456789012',
            fullname: 'Test User',
            domainname: 'DOMAIN\\testuser',
            internalemailaddress: 'test@example.com',
            isdisabled: false,
            accessmode: 0,
          },
        ],
        '@odata.context': 'https://example.crm.dynamics.com/api/data/v9.2/$metadata#systemusers',
      };

      expect(response.value).toHaveLength(1);
      expect(response.value[0].fullname).toBe('Test User');
    });

    it('should handle pagination context', () => {
      const response: DataverseResponse<DataverseSystemUser> = {
        '@odata.context': 'https://example.crm.dynamics.com/api/data/v9.2/$metadata#systemusers',
        '@odata.nextLink': 'https://example.crm.dynamics.com/api/data/v9.2/systemusers?$skiptoken=123',
        value: [],
      };

      expect(response['@odata.nextLink']).toContain('skiptoken');
    });
  });

  describe('DataverseSystemUser', () => {
    it('should accept valid user object', () => {
      const user: DataverseSystemUser = {
        systemuserid: '12345678-1234-1234-1234-123456789012',
        fullname: 'Test User',
        domainname: 'DOMAIN\\testuser',
        internalemailaddress: 'test@example.com',
        isdisabled: false,
        accessmode: 0,
      };

      expect(user.systemuserid).toBe('12345678-1234-1234-1234-123456789012');
      expect(user.fullname).toBe('Test User');
      expect(user.isdisabled).toBe(false);
    });
  });

  describe('DataverseRole', () => {
    it('should accept valid role object', () => {
      const role: DataverseRole = {
        roleid: '12345678-1234-1234-1234-123456789012',
        name: 'System Administrator',
      };

      expect(role.name).toBe('System Administrator');
      expect(role.roleid).toBeDefined();
    });
  });

  describe('DataverseSolution', () => {
    it('should accept valid solution object', () => {
      const solution: DataverseSolution = {
        uniquename: 'TestSolution',
        friendlyname: 'Test Solution',
        version: '1.0.0.0',
        ismanaged: false,
        installedon: '2026-01-01T00:00:00Z',
      };

      expect(solution.uniquename).toBe('TestSolution');
      expect(solution.version).toBe('1.0.0.0');
      expect(solution.ismanaged).toBe(false);
    });
  });

  describe('Solution (transformed)', () => {
    it('should accept transformed solution object', () => {
      const solution: Solution = {
        name: 'TestSolution',
        displayName: 'Test Solution',
        version: '1.0.0.0',
        isManaged: false,
        installedOn: '2026-01-01',
      };

      expect(solution.name).toBe('TestSolution');
      expect(solution.isManaged).toBe(false);
    });
  });

  describe('SecurityRole (transformed)', () => {
    it('should accept transformed security role', () => {
      const role: SecurityRole = {
        name: 'System Administrator',
        id: '12345678-1234-1234-1234-123456789012',
      };

      expect(role.name).toBe('System Administrator');
      expect(role.id).toBeDefined();
    });
  });

  describe('User (transformed)', () => {
    it('should accept transformed user object', () => {
      const user: User = {
        id: '12345678-1234-1234-1234-123456789012',
        fullName: 'Test User',
        domainName: 'DOMAIN\\testuser',
        email: 'test@example.com',
        isDisabled: false,
        accessMode: 0,
      };

      expect(user.fullName).toBe('Test User');
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('AuthenticationResult', () => {
    it('should accept valid auth result', () => {
      const result: AuthenticationResult = {
        accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...',
        expiresOn: new Date('2026-02-09T15:30:00'),
        account: {
          homeAccountId: 'user-id',
          environment: 'login.microsoftonline.com',
          tenantId: 'tenant-id',
          username: 'user@example.com',
          localAccountId: 'local-id',
        },
      };

      expect(result.accessToken).toContain('eyJ');
      expect(result.expiresOn).toBeInstanceOf(Date);
    });

    it('should allow null account and expiresOn', () => {
      const result: AuthenticationResult = {
        accessToken: 'token',
        expiresOn: null,
        account: null,
      };

      expect(result.account).toBeNull();
      expect(result.expiresOn).toBeNull();
    });
  });

  describe('DataverseEntityDefinition', () => {
    it('should accept valid entity metadata', () => {
      const entity: DataverseEntityDefinition = {
        LogicalName: 'account',
        DisplayName: {
          UserLocalizedLabel: {
            Label: 'Account',
          },
        },
      };

      expect(entity.LogicalName).toBe('account');
      expect(entity.DisplayName?.UserLocalizedLabel?.Label).toBe('Account');
    });
  });

  describe('DataverseAttributeDefinition', () => {
    it('should accept valid attribute metadata', () => {
      const attribute: DataverseAttributeDefinition = {
        LogicalName: 'name',
        AttributeType: 'String',
        DisplayName: {
          UserLocalizedLabel: {
            Label: 'Name',
          },
        },
      };

      expect(attribute.LogicalName).toBe('name');
      expect(attribute.AttributeType).toBe('String');
    });
  });
});
