/**
 * Tests for environment URL utilities
 */

import { 
  extractEnvName, 
  getAllTargets, 
  getEnvUrl, 
  getMasterUrl,
  getNumberedEnvUrls,
  getTestTargets,
  getProdTargets,
  getEnvSummary,
} from '../../src/utils/env';

describe('env utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('extractEnvName', () => {
    it('should extract environment name from full URL', () => {
      expect(extractEnvName('https://aucmnswcrp01.crm6.dynamics.com/')).toBe('aucmnswcrp01');
    });

    it('should handle URL without trailing slash', () => {
      expect(extractEnvName('https://testorg.crm.dynamics.com')).toBe('testorg');
    });

    it('should handle http URLs', () => {
      expect(extractEnvName('http://devenv.crm6.dynamics.com')).toBe('devenv');
    });

    it('should return original string if no match', () => {
      expect(extractEnvName('invalid-url')).toBe('invalid-url');
    });
  });

  describe('getAllTargets', () => {
    it('should return empty array when ENV_ALL_TARGETS not set', () => {
      delete process.env.ENV_ALL_TARGETS;
      expect(getAllTargets()).toEqual([]);
    });

    it('should return empty array when ENV_ALL_TARGETS is empty', () => {
      process.env.ENV_ALL_TARGETS = '';
      expect(getAllTargets()).toEqual([]);
    });

    it('should parse comma-separated URLs', () => {
      process.env.ENV_ALL_TARGETS = 'https://env1.crm.dynamics.com,https://env2.crm.dynamics.com';
      const targets = getAllTargets();
      
      expect(targets).toHaveLength(2);
      expect(targets[0]).toEqual({
        url: 'https://env1.crm.dynamics.com',
        name: 'env1',
      });
      expect(targets[1]).toEqual({
        url: 'https://env2.crm.dynamics.com',
        name: 'env2',
      });
    });

    it('should handle URLs with trailing slashes', () => {
      process.env.ENV_ALL_TARGETS = 'https://env1.crm.dynamics.com/,https://env2.crm.dynamics.com/';
      const targets = getAllTargets();
      
      expect(targets[0].url).toBe('https://env1.crm.dynamics.com');
      expect(targets[1].url).toBe('https://env2.crm.dynamics.com');
    });

    it('should handle whitespace around URLs', () => {
      process.env.ENV_ALL_TARGETS = ' https://env1.crm.dynamics.com , https://env2.crm.dynamics.com ';
      const targets = getAllTargets();
      
      expect(targets).toHaveLength(2);
    });

    it('should filter out invalid URLs', () => {
      process.env.ENV_ALL_TARGETS = 'https://valid.crm.dynamics.com,invalid-url,https://valid2.crm.dynamics.com';
      const targets = getAllTargets();
      
      expect(targets).toHaveLength(2);
      expect(targets.every(t => t.url.startsWith('http'))).toBe(true);
    });

    it('should filter out empty entries', () => {
      process.env.ENV_ALL_TARGETS = 'https://env1.crm.dynamics.com,,https://env2.crm.dynamics.com,';
      const targets = getAllTargets();
      
      expect(targets).toHaveLength(2);
    });
  });

  describe('getEnvUrl', () => {
    it('should return ENV_DEV_URL when requested', () => {
      process.env.ENV_DEV_URL = 'https://dev.crm.dynamics.com';
      expect(getEnvUrl('dev')).toBe('https://dev.crm.dynamics.com');
    });

    it('should return ENV_TEST_URL when requested', () => {
      process.env.ENV_TEST_URL = 'https://test.crm.dynamics.com';
      expect(getEnvUrl('test')).toBe('https://test.crm.dynamics.com');
    });

    it('should return ENV_PROD_URL when requested', () => {
      process.env.ENV_PROD_URL = 'https://prod.crm.dynamics.com';
      expect(getEnvUrl('prod')).toBe('https://prod.crm.dynamics.com');
    });

    it('should return undefined when not set', () => {
      delete process.env.ENV_DEV_URL;
      expect(getEnvUrl('dev')).toBeUndefined();
    });
  });

  describe('getMasterUrl', () => {
    it('should prefer ENV_PROD_URL', () => {
      process.env.ENV_PROD_URL = 'https://prod.crm.dynamics.com';
      process.env.ENV_DEV_URL = 'https://dev.crm.dynamics.com';
      expect(getMasterUrl()).toBe('https://prod.crm.dynamics.com');
    });

    it('should fall back to ENV_DEV_URL if no prod', () => {
      delete process.env.ENV_PROD_URL;
      process.env.ENV_DEV_URL = 'https://dev.crm.dynamics.com';
      expect(getMasterUrl()).toBe('https://dev.crm.dynamics.com');
    });

    it('should return undefined when neither set', () => {
      delete process.env.ENV_PROD_URL;
      delete process.env.ENV_DEV_URL;
      expect(getMasterUrl()).toBeUndefined();
    });
  });

  describe('getNumberedEnvUrls', () => {
    beforeEach(() => {
      // Clear all numbered env vars
      for (let i = 1; i <= 10; i++) {
        delete process.env[`ENV_TEST_URL_${i.toString().padStart(2, '0')}`];
        delete process.env[`ENV_PROD_URL_${i.toString().padStart(2, '0')}`];
      }
    });

    it('should return empty array when no numbered vars set', () => {
      expect(getNumberedEnvUrls('test')).toEqual([]);
      expect(getNumberedEnvUrls('prod')).toEqual([]);
    });

    it('should parse numbered test URLs', () => {
      process.env.ENV_TEST_URL_01 = 'https://test1.crm6.dynamics.com/';
      process.env.ENV_TEST_URL_02 = 'https://test2.crm6.dynamics.com/';
      
      const targets = getNumberedEnvUrls('test');
      expect(targets).toHaveLength(2);
      expect(targets[0].url).toBe('https://test1.crm6.dynamics.com');
      expect(targets[0].name).toBe('test1');
      expect(targets[1].url).toBe('https://test2.crm6.dynamics.com');
      expect(targets[1].name).toBe('test2');
    });

    it('should parse numbered prod URLs', () => {
      process.env.ENV_PROD_URL_01 = 'https://prod1.crm6.dynamics.com/';
      process.env.ENV_PROD_URL_02 = 'https://prod2.crm6.dynamics.com/';
      
      const targets = getNumberedEnvUrls('prod');
      expect(targets).toHaveLength(2);
      expect(targets[0].url).toBe('https://prod1.crm6.dynamics.com');
      expect(targets[1].url).toBe('https://prod2.crm6.dynamics.com');
    });

    it('should skip invalid URLs', () => {
      process.env.ENV_TEST_URL_01 = 'https://valid.crm6.dynamics.com/';
      process.env.ENV_TEST_URL_02 = 'not-a-url';
      process.env.ENV_TEST_URL_03 = 'https://valid2.crm6.dynamics.com/';
      
      const targets = getNumberedEnvUrls('test');
      expect(targets).toHaveLength(2);
    });

    it('should handle gaps in numbering', () => {
      process.env.ENV_TEST_URL_01 = 'https://test1.crm6.dynamics.com/';
      // Skip 02
      process.env.ENV_TEST_URL_03 = 'https://test3.crm6.dynamics.com/';
      
      const targets = getNumberedEnvUrls('test');
      expect(targets).toHaveLength(2);
    });
  });

  describe('getTestTargets', () => {
    beforeEach(() => {
      for (let i = 1; i <= 10; i++) {
        delete process.env[`ENV_TEST_URL_${i.toString().padStart(2, '0')}`];
      }
    });

    it('should return test targets from numbered vars', () => {
      process.env.ENV_TEST_URL_01 = 'https://test1.crm6.dynamics.com/';
      process.env.ENV_TEST_URL_02 = 'https://test2.crm6.dynamics.com/';
      
      const targets = getTestTargets();
      expect(targets).toHaveLength(2);
    });
  });

  describe('getProdTargets', () => {
    beforeEach(() => {
      for (let i = 1; i <= 10; i++) {
        delete process.env[`ENV_PROD_URL_${i.toString().padStart(2, '0')}`];
      }
    });

    it('should return prod targets from numbered vars', () => {
      process.env.ENV_PROD_URL_01 = 'https://prod1.crm6.dynamics.com/';
      process.env.ENV_PROD_URL_02 = 'https://prod2.crm6.dynamics.com/';
      
      const targets = getProdTargets();
      expect(targets).toHaveLength(2);
    });
  });

  describe('getEnvSummary', () => {
    beforeEach(() => {
      for (let i = 1; i <= 10; i++) {
        delete process.env[`ENV_TEST_URL_${i.toString().padStart(2, '0')}`];
        delete process.env[`ENV_PROD_URL_${i.toString().padStart(2, '0')}`];
      }
    });

    it('should return correct counts', () => {
      process.env.ENV_TEST_URL_01 = 'https://test1.crm6.dynamics.com/';
      process.env.ENV_TEST_URL_02 = 'https://test2.crm6.dynamics.com/';
      process.env.ENV_PROD_URL_01 = 'https://prod1.crm6.dynamics.com/';
      
      const summary = getEnvSummary();
      expect(summary.test).toBe(2);
      expect(summary.prod).toBe(1);
      expect(summary.total).toBe(3);
    });

    it('should return zeros when no numbered vars', () => {
      const summary = getEnvSummary();
      expect(summary.test).toBe(0);
      expect(summary.prod).toBe(0);
      expect(summary.total).toBe(0);
    });
  });

  describe('getAllTargets with numbered vars', () => {
    beforeEach(() => {
      delete process.env.ENV_ALL_TARGETS;
      for (let i = 1; i <= 10; i++) {
        delete process.env[`ENV_TEST_URL_${i.toString().padStart(2, '0')}`];
        delete process.env[`ENV_PROD_URL_${i.toString().padStart(2, '0')}`];
      }
    });

    it('should prefer numbered vars over ENV_ALL_TARGETS', () => {
      process.env.ENV_ALL_TARGETS = 'https://all1.crm.dynamics.com,https://all2.crm.dynamics.com';
      process.env.ENV_TEST_URL_01 = 'https://test1.crm6.dynamics.com/';
      process.env.ENV_PROD_URL_01 = 'https://prod1.crm6.dynamics.com/';
      
      const targets = getAllTargets();
      expect(targets).toHaveLength(2);
      expect(targets[0].name).toBe('test1');
      expect(targets[1].name).toBe('prod1');
    });

    it('should fall back to ENV_ALL_TARGETS when no numbered vars', () => {
      process.env.ENV_ALL_TARGETS = 'https://all1.crm.dynamics.com,https://all2.crm.dynamics.com';
      
      const targets = getAllTargets();
      expect(targets).toHaveLength(2);
      expect(targets[0].name).toBe('all1');
      expect(targets[1].name).toBe('all2');
    });
  });
});