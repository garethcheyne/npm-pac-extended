/**
 * Tests for HTML template module
 */

import { HtmlTemplateOptions, CSS_VARIABLES } from '../../src/templates/html-template';

describe('HTML template', () => {
  describe('HtmlTemplateOptions interface', () => {
    it('should accept valid options object', () => {
      const options: HtmlTemplateOptions = {
        title: 'Test Report',
        subtitle: 'A test subtitle',
        timestamp: '2026-02-09T14:30:45',
        environment: 'https://test.crm.dynamics.com',
      };

      expect(options.title).toBe('Test Report');
      expect(options.subtitle).toBe('A test subtitle');
    });

    it('should allow optional properties', () => {
      const options: HtmlTemplateOptions = {
        title: 'Minimal Report',
      };

      expect(options.title).toBe('Minimal Report');
      expect(options.subtitle).toBeUndefined();
      expect(options.environment).toBeUndefined();
    });

    it('should accept masterEnvironment and targetEnvironments', () => {
      const options: HtmlTemplateOptions = {
        title: 'Audit Report',
        masterEnvironment: 'https://master.crm.dynamics.com',
        targetEnvironments: [
          'https://target1.crm.dynamics.com',
          'https://target2.crm.dynamics.com',
        ],
        isDeepAudit: true,
      };

      expect(options.masterEnvironment).toContain('master');
      expect(options.targetEnvironments).toHaveLength(2);
      expect(options.isDeepAudit).toBe(true);
    });
  });

  describe('CSS_VARIABLES', () => {
    it('should include Power Platform teal color', () => {
      expect(CSS_VARIABLES).toContain('#046963');
    });

    it('should include Power Platform purple color', () => {
      expect(CSS_VARIABLES).toContain('#742774');
    });

    it('should include Power Platform blue color', () => {
      expect(CSS_VARIABLES).toContain('#0078D4');
    });

    it('should include match color (green)', () => {
      expect(CSS_VARIABLES).toContain('#107c10');
    });

    it('should include differ color (warning)', () => {
      expect(CSS_VARIABLES).toContain('#ffaa44');
    });

    it('should include missing color (red)', () => {
      expect(CSS_VARIABLES).toContain('#d13438');
    });

    it('should define CSS custom properties', () => {
      expect(CSS_VARIABLES).toContain(':root');
      expect(CSS_VARIABLES).toContain('--pp-teal');
      expect(CSS_VARIABLES).toContain('--pp-purple');
      expect(CSS_VARIABLES).toContain('--pp-blue');
    });

    it('should include dark theme background colors', () => {
      expect(CSS_VARIABLES).toContain('--bg:');
      expect(CSS_VARIABLES).toContain('--bg-card:');
      expect(CSS_VARIABLES).toContain('--bg-header:');
    });

    it('should include text color variables', () => {
      expect(CSS_VARIABLES).toContain('--text:');
      expect(CSS_VARIABLES).toContain('--text-dim:');
      expect(CSS_VARIABLES).toContain('--text-bright:');
    });
  });
});
