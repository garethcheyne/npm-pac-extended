/**
 * Tests for reports utility module
 */

import { getReportPath, getCompareReportPath, saveJsonReport, saveHtmlReport } from '../../src/utils/reports';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('reports utility', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date to return consistent values
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-09T14:30:45'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getReportPath', () => {
    it('should generate path with correct date folder', () => {
      const reportPath = getReportPath('audit', 'json');
      expect(reportPath).toContain('2026-02-09');
    });

    it('should generate path with correct report type folder', () => {
      const reportPath = getReportPath('user-audit', 'json');
      expect(reportPath).toContain('user-audit');
    });

    it('should generate path with correct extension', () => {
      const jsonPath = getReportPath('audit', 'json');
      expect(jsonPath).toEndWith('.json');

      const htmlPath = getReportPath('audit', 'html');
      expect(htmlPath).toEndWith('.html');
    });

    it('should include timestamp in filename', () => {
      const reportPath = getReportPath('audit', 'json');
      expect(reportPath).toContain('report-');
    });

    it('should use reports directory', () => {
      const reportPath = getReportPath('audit', 'json');
      expect(reportPath).toContain('reports');
    });

    it('should create directory recursively', () => {
      getReportPath('audit', 'json');
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
    });

    it('should include environment name in path when URL provided', () => {
      const reportPath = getReportPath('audit', 'json', 'https://aucmnswcrp01.crm6.dynamics.com/');
      expect(reportPath).toContain('aucmnswcrp01');
    });

    it('should structure path as reports/{envName}/{date}/{command}', () => {
      const reportPath = getReportPath('user-audit', 'json', 'https://testenv.crm6.dynamics.com/');
      expect(reportPath).toMatch(/reports[\\/]testenv[\\/]2026-02-09[\\/]user-audit/);
    });

    it('should use legacy structure when no URL provided', () => {
      const reportPath = getReportPath('audit', 'json');
      // Legacy: reports/{date}/{command}
      expect(reportPath).toMatch(/reports[\\/]2026-02-09[\\/]audit/);
    });
  });

  describe('getCompareReportPath', () => {
    it('should create audit-compare folder', () => {
      const reportPath = getCompareReportPath('json');
      expect(reportPath).toContain('audit-compare');
    });

    it('should include master environment name when provided', () => {
      const reportPath = getCompareReportPath('json', 'https://masterenv.crm6.dynamics.com/');
      expect(reportPath).toContain('masterenv');
    });

    it('should generate correct extension', () => {
      const jsonPath = getCompareReportPath('json');
      expect(jsonPath).toEndWith('.json');

      const htmlPath = getCompareReportPath('html');
      expect(htmlPath).toEndWith('.html');
    });
  });

  describe('saveJsonReport', () => {
    it('should write JSON to file with formatting', () => {
      const testData = { foo: 'bar', count: 42 };
      saveJsonReport('/test/path.json', testData);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/test/path.json',
        JSON.stringify(testData, null, 2)
      );
    });
  });

  describe('saveHtmlReport', () => {
    it('should write HTML to file', () => {
      const testHtml = '<html><body>Test</body></html>';
      saveHtmlReport('/test/path.html', testHtml);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/test/path.html',
        testHtml
      );
    });
  });
});

// Custom matcher for path endings
expect.extend({
  toEndWith(received: string, suffix: string) {
    const pass = received.endsWith(suffix);
    return {
      pass,
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to end with ${suffix}`,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toEndWith(suffix: string): R;
    }
  }
}
